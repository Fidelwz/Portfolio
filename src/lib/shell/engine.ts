import { artisanCommands, confirmStep } from "./commands/artisan";
import { coreCommands } from "./commands/core";
import { cowsay, eggCommands } from "./commands/eggs";
import { tinkerCandidates, tinkerStep } from "./commands/tinker";
import { SECRETS, TOTAL_SECRETS } from "./content";
import { badge, blank, plainText, row, t } from "./out";
import { commonPrefix, editDistance, splitPipeline, tokenize } from "./parse";
import { promptFor } from "./prompt";
import type { CommandDef, CommandOutput, Completion, Effect, Env, Line, Result, SecretId, ShellState, Signal } from "./types";
import { vimSignal, vimStep } from "./vim";

/**
 * Motor del shell. Función pura: recibe la entrada, el estado y el entorno,
 * y devuelve el estado nuevo, las líneas a imprimir y los efectos que la
 * interfaz debe aplicar. No toca el DOM ni lee el reloj.
 */

const REGISTRY: readonly CommandDef[] = [...coreCommands, ...artisanCommands, ...eggCommands];

const BY_NAME = new Map<string, CommandDef>();
for (const command of REGISTRY) {
  BY_NAME.set(command.name, command);
  for (const alias of command.aliases ?? []) BY_NAME.set(alias, command);
}

/** Comandos visibles: los que tienen grupo. Los secretos no se sugieren ni se autocompletan. */
const VISIBLE = REGISTRY.filter((command) => command.group).map((command) => command.name);

const MAX_HISTORY = 100;

function findCommand(name: string) {
  return BY_NAME.get(name) ?? BY_NAME.get(name.toLowerCase());
}

function runSingle(segment: string, state: ShellState, env: Env): CommandOutput {
  const [name, ...args] = tokenize(segment);
  if (!name) return {};

  const command = findCommand(name);
  if (command) return command.run({ args, raw: segment, state, env, registry: REGISTRY });

  const suggestion = name.length > 1 ? VISIBLE.find((candidate) => editDistance(candidate, name.toLowerCase()) <= (name.length > 3 ? 2 : 1)) : undefined;
  return {
    lines: [
      t(`bash: ${name}: orden no encontrada`, "danger"),
      ...(suggestion ? [row(["¿Quisiste decir ", "muted"], [suggestion, "fg"], ["?", "muted"])] : []),
    ],
  };
}

function runBash(input: string, state: ShellState, env: Env): CommandOutput {
  const stages = splitPipeline(input);
  if (stages.some((stage) => !stage)) return { lines: [t("bash: error sintáctico cerca del elemento inesperado `|'", "danger")] };
  if (stages.length === 1) return runSingle(stages[0], state, env);

  const [sink, ...sinkArgs] = tokenize(stages[1]);
  if (stages.length > 2 || (sink !== "cowsay" && sink !== "cowthink") || sinkArgs.length) {
    return { lines: [t("bash: en esta terminal las tuberías solo llegan hasta cowsay", "danger")] };
  }
  const source = runSingle(stages[0], state, env);
  const text = (source.lines ?? []).map(plainText).filter(Boolean).join(" ");
  return {
    state: source.state,
    lines: cowsay(text),
    effects: [...(source.effects ?? []), { type: "secret", id: "cowsay" }],
  };
}

/** Anuncia los secretos nuevos y descarta los que ya estaban encontrados. */
function settle(state: ShellState, lines: Line[], effects: Effect[], env: Env): Result {
  const known = new Set<SecretId>(env.secrets);
  const fresh: SecretId[] = [];
  for (const effect of effects) {
    if (effect.type === "secret" && !known.has(effect.id) && !fresh.includes(effect.id)) fresh.push(effect.id);
  }

  let count = known.size;
  for (const id of fresh) {
    count += 1;
    const title = SECRETS.find((secret) => secret.id === id)?.title ?? id;
    lines.push(row(["★ secreto encontrado: ", "amber"], [title, "fg"], [`  ${count}/${TOTAL_SECRETS}`, "dim"]));
  }
  if (fresh.length && count >= TOTAL_SECRETS) {
    lines.push(blank, row(["★ Los encontraste todos. ", "emerald"], ["Privilegios concedidos: ahora eres root.", "fg"]));
  }

  return {
    state,
    lines,
    effects: [
      ...effects.filter((effect) => effect.type !== "secret"),
      ...fresh.map((id): Effect => ({ type: "secret", id })),
    ],
  };
}

function reduce(state: ShellState, output: CommandOutput, lines: Line[], effects: Effect[]) {
  if (output.lines) lines.push(...output.lines);
  if (output.effects) effects.push(...output.effects);
  return output.state ? { ...state, ...output.state } : state;
}

export function execute(input: string, state: ShellState, env: Env): Result {
  const lines: Line[] = [];
  const effects: Effect[] = [];

  // En Vim no hay eco: la pantalla del editor muestra el resultado.
  if (state.mode === "vim") {
    return settle(reduce(state, vimStep(input, state, env), lines, effects), lines, effects, env);
  }

  lines.push({ kind: "echo", prompt: promptFor(state, env.secrets.length), text: input });

  if (state.mode === "tinker") return settle(reduce(state, tinkerStep(input), lines, effects), lines, effects, env);
  if (state.mode === "confirm") return settle(reduce(state, confirmStep(input, state), lines, effects), lines, effects, env);

  const trimmed = input.trim();
  if (!trimmed) return settle(state, lines, effects, env);

  const history = state.history.at(-1) === trimmed ? state.history : [...state.history, trimmed].slice(-MAX_HISTORY);
  const withHistory = { ...state, history };
  return settle(reduce(withHistory, runBash(trimmed, withHistory, env), lines, effects), lines, effects, env);
}

/** Ctrl + C, Esc y Ctrl + D. `pending` es lo que había escrito sin enviar. */
export function signal(kind: Signal, state: ShellState, env: Env, pending = ""): Result {
  const lines: Line[] = [];
  const effects: Effect[] = [];

  if (state.mode === "vim") return settle(reduce(state, vimSignal(kind, state), lines, effects), lines, effects, env);
  if (kind === "escape") return { state, lines, effects };

  const echo: Line = {
    kind: "echo",
    prompt: promptFor(state, env.secrets.length),
    text: `${pending}${kind === "interrupt" ? "^C" : ""}`,
  };

  if (state.mode === "confirm") {
    return { state: { ...state, mode: "bash", confirm: null }, lines: [echo, blank, badge("WARN", "Command cancelled."), blank], effects };
  }
  if (state.mode === "tinker") {
    if (kind === "interrupt") return { state, lines: [echo], effects };
    return { state: { ...state, mode: "bash" }, lines: [echo, blank, badge("INFO", "Goodbye."), blank], effects };
  }
  if (kind === "interrupt") return { state, lines: [echo], effects };
  return { state, lines: [echo, t("logout", "dim")], effects: [{ type: "exit" }] };
}

/** Autocompletado con Tab. Si hay varias opciones, las devuelve para mostrarlas. */
export function complete(input: string, state: ShellState): Completion {
  const none: Completion = { value: input, candidates: [] };
  if (state.mode === "vim") return none;

  const resolve = (candidates: string[], prefix: string, typed: string, pad: boolean): Completion => {
    const matches = candidates.filter((candidate) => candidate.startsWith(typed));
    if (!matches.length) return none;
    if (matches.length === 1) return { value: `${prefix}${matches[0]}${pad && !/[\s/]$/.test(matches[0]) ? " " : ""}`, candidates: [] };
    const shared = commonPrefix(matches);
    return { value: `${prefix}${shared.length > typed.length ? shared : typed}`, candidates: shared.length > typed.length ? [] : matches };
  };

  if (state.mode === "confirm") return resolve(["yes", "no"], "", input.trim(), false);
  if (state.mode === "tinker") return resolve(tinkerCandidates(), "", input.trimStart(), false);

  const text = input.trimStart();
  const space = text.search(/\s/);
  if (space === -1) return resolve(VISIBLE, "", text, true);

  const name = text.slice(0, space);
  const rest = text.slice(space).trimStart();
  const candidates = findCommand(name)?.complete?.(rest, state) ?? [];
  return resolve(candidates, `${name} `, rest, false);
}

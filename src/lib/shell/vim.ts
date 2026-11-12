import { blank, row } from "./out";
import type { CommandOutput, Env, Segment, ShellState, Signal, VimState } from "./types";

/**
 * La trampa de Vim. El búfer está modificado y es de solo lectura, así que las
 * salidas "normales" fallan con los mismos errores que da Vim de verdad.
 */

const E37: Segment = { t: "E37: No write since last change (add ! to override)", tone: "danger" };
const E45: Segment = { t: "E45: 'readonly' option is set (add ! to override)", tone: "danger" };
const E212: Segment = { t: "E212: Can't open file for writing", tone: "danger" };
const HELP: Segment = { t: 'Get out of Vim:  Use ":qa!<Enter>" (careful, all changes are lost!).', tone: "fg" };
const INTERRUPT: Segment = { t: "Type  :qa!  and press <Enter> to abandon all changes and exit Vim", tone: "fg" };

const QUIT = new Set(["q", "qu", "qui", "quit", "qa", "qall", "quita", "quitall", "clo", "close"]);
const WRITE = new Set(["w", "write", "wq", "wqa", "wqall", "x", "xit", "xa", "xall", "exi", "exit", "wa", "wall", "up", "update"]);
const FORCE_QUIT = new Set(["q!", "qu!", "quit!", "qa!", "qall!", "quitall!", "cq", "cquit"]);
const FORCE_WRITE = new Set(["w!", "wq!", "wqa!", "x!", "xa!", "wa!"]);

function seconds(ms: number) {
  return `${(ms / 1000).toFixed(1)} s`;
}

function fail(vim: VimState, message: Segment): CommandOutput {
  return { state: { vim: { ...vim, message, insert: false, attempts: vim.attempts + 1 } } };
}

function leave(vim: VimState, env: Env): CommandOutput {
  const ms = Math.max(0, env.now - vim.startedAt);
  const isRecord = env.vimRecord === null || ms < env.vimRecord;
  return {
    state: { mode: "bash", vim: null },
    lines: [
      row(["Saliste de Vim en ", "muted"], [seconds(ms), "amber"], [vim.attempts ? ` tras ${vim.attempts} ${vim.attempts === 1 ? "intento fallido" : "intentos fallidos"}.` : " al primer intento.", "muted"]),
      isRecord
        ? row(["Nuevo récord personal.", "emerald"])
        : row(["Tu récord: ", "dim"], [seconds(env.vimRecord ?? ms), "fg"]),
      blank,
    ],
    effects: [
      { type: "secret", id: "vim" },
      { type: "vim-record", ms },
    ],
  };
}

export function vimStep(input: string, state: ShellState, env: Env): CommandOutput {
  const vim = state.vim;
  if (!vim) return { state: { mode: "bash" } };

  const raw = input.trimEnd();
  if (!raw) return {};

  if (raw === "ZQ") return leave(vim, env);
  if (raw === "ZZ") return fail(vim, E45);

  if (raw.startsWith(":")) {
    const command = raw.slice(1).trim();
    if (!command) return { state: { vim: { ...vim, message: null, insert: false } } };
    if (FORCE_QUIT.has(command)) return leave(vim, env);
    if (QUIT.has(command)) return fail(vim, E37);
    if (WRITE.has(command)) return fail(vim, E45);
    if (FORCE_WRITE.has(command)) return fail(vim, E212);
    if (/^h(elp)?(\s|$)/.test(command)) return fail(vim, HELP);
    if (/^\d+$/.test(command)) return { state: { vim: { ...vim, message: null, insert: false } } };
    return fail(vim, { t: `E492: Not an editor command: ${command}`, tone: "danger" });
  }

  // Sin dos puntos, Vim lo toma como texto: lo típico al escribir "exit".
  return {
    state: {
      vim: {
        ...vim,
        buffer: [...vim.buffer, raw].slice(-8),
        message: { t: "-- INSERT --", tone: "fg" },
        insert: true,
        attempts: vim.attempts + 1,
      },
    },
  };
}

export function vimSignal(signal: Signal, state: ShellState): CommandOutput {
  const vim = state.vim;
  if (!vim) return {};
  if (signal === "interrupt") return { state: { vim: { ...vim, message: INTERRUPT, insert: false, attempts: vim.attempts + 1 } } };
  if (signal === "escape") return { state: { vim: { ...vim, message: null, insert: false } } };
  return {};
}

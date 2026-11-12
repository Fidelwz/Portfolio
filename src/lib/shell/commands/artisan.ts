import { education, experience, profile, sections, skillGroups } from "@/data/profile";
import { badge, blank, dots, row, t } from "../out";
import { editDistance } from "../parse";
import type { CommandDef, CommandOutput, Env, Line, ShellState } from "../types";

/**
 * `php artisan …`: la consola de Laravel aplicada al portafolio.
 * Los formatos imitan la salida real de Artisan; los datos salen de profile.ts.
 */

type Artisan = {
  name: string;
  summary?: string;
  run(env: Env): CommandOutput;
};

/** Citas del comando `inspire` real de Laravel (Illuminate\Foundation\Inspiring). */
const QUOTES: [string, string][] = [
  ["Simplicity is the ultimate sophistication.", "Leonardo da Vinci"],
  ["Well begun is half done.", "Aristotle"],
  ["Smile, breathe, and go slowly.", "Thich Nhat Hanh"],
  ["He who is contented is rich.", "Laozi"],
  ["Very little is needed to make a happy life.", "Marcus Aurelius"],
  ["It is not the man who has too little, but the man who craves more, that is poor.", "Seneca"],
  ["Simplicity is an acquired taste.", "Katharine Gerould"],
  ["The only way to do great work is to love what you do.", "Steve Jobs"],
  ["Waste no more time arguing what a good man should be, be one.", "Marcus Aurelius"],
];

const DESTRUCTIVE = new Set(["migrate:fresh", "migrate:reset", "migrate:rollback", "db:wipe"]);

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\b(en|de|del|la|el)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function migrations() {
  const jobs = experience.map((job) => ({
    key: job.start,
    name: `${job.start.replace("-", "_")}_${slug(job.role)}_${job.id}`,
    running: job.end === null,
  }));
  const studies = education.map((item) => {
    const year = item.period.match(/\d{4}/)?.[0] ?? "0000";
    return { key: `${year}-00`, name: `${year}_${slug(item.degree)}_${item.id}`, running: item.status === "en-curso" };
  });
  return [...jobs, ...studies].sort((a, b) => a.key.localeCompare(b.key));
}

const COMMANDS: Artisan[] = [
  {
    name: "about",
    summary: "Muestra la ficha del perfil",
    run: () => ({
      lines: [
        blank,
        dots([{ t: "  Perfil", tone: "emerald" }], []),
        dots([{ t: "  Nombre", tone: "fg" }], [{ t: profile.name }]),
        dots([{ t: "  Rol", tone: "fg" }], [{ t: profile.role }]),
        dots([{ t: "  Título", tone: "fg" }], [{ t: profile.degree }]),
        dots([{ t: "  Ubicación", tone: "fg" }], [{ t: profile.location.short }]),
        ...(profile.availability.open
          ? [dots([{ t: "  Estado", tone: "fg" }], [{ t: profile.availability.label.toUpperCase(), tone: "amber" }])]
          : []),
        blank,
        dots([{ t: "  Stack", tone: "emerald" }], []),
        ...skillGroups.map((group) =>
          dots([{ t: `  ${group.title}`, tone: "fg" }], [{ t: group.skills.map((skill) => skill.name).join(", ") }]),
        ),
        blank,
      ],
    }),
  },
  {
    name: "inspire",
    summary: "Muestra una cita inspiradora",
    run(env) {
      const [quote, author] = QUOTES[Math.floor(env.now / 1000) % QUOTES.length];
      return { lines: [blank, row(["  “ ", "dim"], [quote, "fg"], [" ”", "dim"]), row(["  — ", "dim"], [author, "muted"]), blank] };
    },
  },
  {
    name: "serve",
    summary: "Sirve la aplicación",
    run: () => ({
      lines: [
        blank,
        badge("INFO", "Server running on [esta misma pestaña]."),
        blank,
        row(["  Ya estás dentro del servidor: no hace falta levantar otro.", "muted"]),
        blank,
      ],
    }),
  },
  {
    name: "tinker",
    summary: "Consulta el perfil de forma interactiva",
    run: () => ({
      state: { mode: "tinker" },
      lines: [
        row(["Psy Shell", "fg"], [" · tinker de bolsillo. Entiende consultas simples sobre el perfil.", "muted"]),
        row(["Prueba: ", "dim"], ["Experience::all()", "accent"], ["  ", "dim"], ["Skill::pluck('name')", "accent"], ["  ", "dim"], ["Fidel::first()->role", "accent"]),
        row(["Sal con ", "dim"], ["exit", "fg"], [" o Ctrl + D.", "dim"]),
      ],
    }),
  },
  {
    name: "migrate",
    summary: "Ejecuta las migraciones pendientes",
    run: () => ({ lines: [blank, badge("INFO", "Nothing to migrate."), blank] }),
  },
  {
    name: "migrate:fresh",
    summary: "Elimina todas las tablas y vuelve a migrar",
    run: () => confirmDestructive("migrate:fresh"),
  },
  {
    name: "migrate:status",
    summary: "Muestra el estado de cada migración",
    run: () => ({
      lines: [
        blank,
        dots([{ t: "  Migration name", tone: "dim" }], [{ t: "Batch / Status", tone: "dim" }]),
        ...migrations().map((migration, index) =>
          dots(
            [{ t: `  ${migration.name}`, tone: "fg" }],
            [
              { t: `[${index + 1}] `, tone: "dim" },
              migration.running ? { t: "Running", tone: "amber" } : { t: "Ran", tone: "emerald" },
            ],
          ),
        ),
        blank,
      ],
    }),
  },
  {
    name: "route:list",
    summary: "Lista las rutas registradas",
    run() {
      const routes: Line[] = sections.map((section) =>
        dots(
          [
            { t: "  GET|HEAD  ", tone: "accent" },
            { t: section.id === "inicio" ? "/" : section.id, tone: "fg" },
          ],
          [{ t: section.id === "inicio" ? "inicio" : `${section.id}.index` }],
          { type: "navigate", section: section.id },
          `Ir a ${section.label}`,
        ),
      );
      routes.push(
        dots(
          [
            { t: "  POST      ", tone: "amber" },
            { t: "contacto", tone: "fg" },
          ],
          [{ t: "contacto.enviar" }],
          { type: "navigate", section: "contacto" },
          "Ir al formulario de contacto",
        ),
      );
      return {
        lines: [blank, ...routes, blank, row([`  Showing [${routes.length}] routes · clic en una ruta para abrirla`, "dim"]), blank],
      };
    },
  },
];

function confirmDestructive(command: string): CommandOutput {
  return {
    state: { mode: "confirm", confirm: command },
    lines: [
      blank,
      badge("WARN", "APPLICATION IN PRODUCTION."),
      blank,
      row(["  Are you sure you want to run this command? ", "fg"], ["(yes/no) ", "muted"], ["[no]", "amber"]),
    ],
  };
}

/** Respuesta a la pregunta de confirmación de un comando destructivo. */
export function confirmStep(input: string, state: ShellState): CommandOutput {
  const answer = input.trim().toLowerCase();
  const reset = { mode: "bash" as const, confirm: null };
  if (["yes", "y", "si", "sí", "s"].includes(answer)) {
    return {
      state: reset,
      lines: [
        blank,
        dots([{ t: "  Dropping all tables", tone: "fg" }], [{ t: "fingiendo", tone: "amber" }]),
        blank,
        badge("INFO", `Es broma: \`${state.confirm}\` no toca la carrera. Command cancelled.`),
        blank,
      ],
    };
  }
  return { state: reset, lines: [blank, badge("WARN", "Command cancelled."), blank] };
}

function listCommands(): Line[] {
  const lines: Line[] = [
    row(["Laravel Framework", "emerald"], [` · portafolio de ${profile.name}`, "muted"]),
    blank,
    row(["Usage:", "amber"]),
    row(["  php artisan <comando>", "fg"]),
    blank,
    row(["Available commands:", "amber"]),
  ];
  let namespace = "";
  const sorted = [...COMMANDS].sort((a, b) => Number(a.name.includes(":")) - Number(b.name.includes(":")) || a.name.localeCompare(b.name));
  for (const command of sorted) {
    const [prefix] = command.name.includes(":") ? command.name.split(":") : [""];
    if (prefix && prefix !== namespace) {
      namespace = prefix;
      lines.push(row([` ${prefix}`, "amber"]));
    }
    lines.push(row([`  ${command.name.padEnd(18)}`, "emerald"], [command.summary ?? "", "muted"]));
  }
  return lines;
}

function unknownCommand(name: string): Line[] {
  const suggestions = COMMANDS.map((command) => command.name).filter(
    (candidate) => candidate.startsWith(name.split(":")[0]) || editDistance(candidate, name) <= 3,
  );
  return [
    blank,
    badge("ERROR", `Command "${name}" is not defined.${suggestions.length ? " Did you mean one of these?" : ""}`),
    ...(suggestions.length ? [blank, ...suggestions.map((candidate) => row(["  ⇂ ", "dim"], [candidate, "muted"]))] : []),
    blank,
  ];
}

export const artisanNames = COMMANDS.map((command) => command.name);

export const artisanCommands: CommandDef[] = [
  {
    name: "php",
    group: "Laravel",
    usage: "php artisan",
    summary: "Consola de Laravel: about, route:list, migrate:status, tinker…",
    run({ args, env }) {
      if (args[0] !== "artisan") {
        if (!args.length) return { lines: [row(["uso: ", "dim"], ["php artisan <comando>", "fg"])] };
        if (["-v", "--version"].includes(args[0])) {
          return { lines: [row(["La versión de PHP no figura en el CV. ", "muted"], ["Lo que sí hay: php artisan", "fg"])] };
        }
        return { lines: [t(`Could not open input file: ${args[0]}`, "danger")] };
      }
      const name = args[1];
      if (!name || name === "list") return { lines: listCommands() };
      if (name === "--version" || name === "-V") {
        return { lines: [row(["Laravel Framework", "emerald"], [" · la versión no figura en el CV", "muted"])] };
      }
      if (DESTRUCTIVE.has(name)) return confirmDestructive(name);
      const command = COMMANDS.find((candidate) => candidate.name === name);
      return command ? command.run(env) : { lines: unknownCommand(name) };
    },
    complete: (rest) => (rest.startsWith("artisan ") ? artisanNames.map((name) => `artisan ${name}`) : ["artisan "]),
  },
  {
    name: "artisan",
    run: () => ({ lines: [row(["bash: artisan: orden no encontrada. ", "danger"], ["¿Quisiste decir ", "muted"], ["php artisan", "fg"], ["?", "muted"])] }),
  },
  {
    name: "composer",
    run: () => ({ lines: [row(["composer: aquí no hay vendor/ que instalar. ", "muted"], ["Prueba php artisan", "fg"])] }),
  },
];

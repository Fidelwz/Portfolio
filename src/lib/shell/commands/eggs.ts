import { experience, sections } from "@/data/profile";
import { shortHash } from "@/lib/hash";
import { formatYearMonth } from "@/lib/time";
import { listFiles } from "../fs";
import { blank, link, pre, row, t } from "../out";
import type { CommandDef, Line, VimState } from "../types";
import { isRoot } from "./core";

/**
 * Guiños de culto. Ninguno aparece en `help`: los que cuentan para el
 * minijuego devuelven un efecto `secret`.
 */

/** Frases conocidas del gremio, con su autor. */
const FORTUNES: [string, string][] = [
  ["There are only two hard things in Computer Science: cache invalidation and naming things.", "Phil Karlton"],
  ["Premature optimization is the root of all evil.", "Donald Knuth"],
  ["Talk is cheap. Show me the code.", "Linus Torvalds"],
  ["Programs must be written for people to read, and only incidentally for machines to execute.", "Abelson y Sussman"],
  ["Simplicity is prerequisite for reliability.", "Edsger W. Dijkstra"],
  ["Make it work, make it right, make it fast.", "Kent Beck"],
  ["Weeks of coding can save you hours of planning.", "anónimo"],
  ["It works on my machine.", "todos, alguna vez"],
];

export function fortune(now: number) {
  const [quote, author] = FORTUNES[Math.floor(now / 1000) % FORTUNES.length];
  return `${quote} — ${author}`;
}

function wrap(text: string, width: number) {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (current && current.length + word.length + 1 > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/** La vaca de cowsay, con globo de una o varias líneas. */
export function cowsay(text: string): Line[] {
  const lines = wrap(text.trim() || "muuu", 34);
  const width = Math.max(...lines.map((line) => line.length));
  const bubble =
    lines.length === 1
      ? [`< ${lines[0]} >`]
      : lines.map((line, index) => {
          const [left, right] = index === 0 ? ["/", "\\"] : index === lines.length - 1 ? ["\\", "/"] : ["|", "|"];
          return `${left} ${line.padEnd(width)} ${right}`;
        });
  const art = [
    ` ${"_".repeat(width + 2)}`,
    ...bubble,
    ` ${"-".repeat(width + 2)}`,
    "        \\   ^__^",
    "         \\  (oo)\\_______",
    "            (__)\\       )\\/\\",
    "                ||----w |",
    "                ||     ||",
  ].join("\n");
  return [pre(art, "fg")];
}

function newVim(now: number, file: string): VimState {
  return {
    startedAt: now,
    buffer: [`# ${file}`, "", "Estás dentro de Vim.", "Nadie te explicó cómo salir."],
    message: { t: `"${file}" [readonly] 4L`, tone: "muted" },
    attempts: 0,
    insert: false,
  };
}

const RM_DANGEROUS = new Set(["/*", "~", "~/", "~/*", ".", "./", "./*", "*", "/home/fidel"]);

export const eggCommands: CommandDef[] = [
  {
    name: "sudo",
    run(ctx) {
      const { args, env, registry } = ctx;
      const rest = args.join(" ");
      if (rest === "make me a sandwich") return { lines: [t("Okay.", "fg")], effects: [{ type: "secret", id: "sandwich" }] };
      if (!args.length) return { lines: [t("uso: sudo <comando>")] };

      if (isRoot(env)) {
        const inner = registry.find((command) => command.name === args[0] || command.aliases?.includes(args[0]));
        if (!inner || inner.name === "sudo") return { lines: [t(`sudo: ${args[0]}: orden no encontrada`, "danger")] };
        return inner.run({ ...ctx, args: args.slice(1), raw: rest });
      }
      return {
        lines: [t("fidel is not in the sudoers file.  This incident will be reported.", "fg")],
        effects: [{ type: "secret", id: "sudoers" }],
      };
    },
  },
  {
    name: "make",
    run({ args }) {
      if (args.join(" ") === "me a sandwich") return { lines: [t("What? Make it yourself.", "fg")] };
      if (!args.length) return { lines: [t("make: *** No se especificó ningún objetivo y no se encontró ningún makefile.  Alto.", "danger")] };
      return { lines: [t(`make: *** No hay ninguna regla para construir el objetivo '${args[0]}'.  Alto.`, "danger")] };
    },
  },
  {
    name: "rm",
    run({ args, state }) {
      const flags = args.filter((arg) => arg.startsWith("-"));
      const targets = args.filter((arg) => !arg.startsWith("-"));
      const recursive = flags.some((flag) => flag === "--recursive" || (/^-[a-zA-Z]+$/.test(flag) && /r/i.test(flag)));
      const noPreserve = flags.includes("--no-preserve-root");

      if (!targets.length) return { lines: [t("rm: falta un operando", "danger")] };

      const wipesRoot = targets.includes("/");
      if (recursive && wipesRoot && !noPreserve) {
        return {
          lines: [
            t("rm: es peligroso operar recursivamente sobre '/'", "danger"),
            t("rm: utilice --no-preserve-root para saltarse esta medida de seguridad", "danger"),
          ],
        };
      }
      if (recursive && (wipesRoot || targets.some((target) => RM_DANGEROUS.has(target)))) {
        return {
          lines: [
            ...sections.filter((section) => section.id !== "inicio").map((section) => t(`removed directory '${section.id}/'`, "dim")),
            ...listFiles("inicio").map((file) => t(`removed '${file.name}'`, "dim")),
            t("Kernel panic - not syncing: Attempted to kill init! exitcode=0x00000009", "danger"),
            blank,
            t("… restaurando desde el backup de anoche", "dim"),
            row(["[  OK  ] ", "emerald"], ["Portafolio restaurado. No se perdió nada.", "fg"]),
            t("Moraleja: los backups existen por algo."),
          ],
          effects: [{ type: "shake" }, { type: "secret", id: "rm" }],
        };
      }
      const target = targets[0];
      const isDirectory = state.cwd === "inicio" && sections.some((section) => section.id === target.replace(/\/$/, ""));
      return {
        lines: [t(`rm: no se puede borrar '${target}': ${isDirectory && !recursive ? "Es un directorio" : "Permiso denegado"}`, "danger")],
      };
    },
  },
  {
    name: "sl",
    run: () => ({
      lines: [{ kind: "train" }, t("sl: Steam Locomotive. Querías escribir ls, ¿verdad?", "dim")],
      effects: [{ type: "secret", id: "sl" }],
    }),
  },
  {
    name: "cowsay",
    aliases: ["cowthink"],
    run: ({ args }) => ({ lines: cowsay(args.join(" ")), effects: [{ type: "secret", id: "cowsay" }] }),
  },
  {
    name: "fortune",
    run: ({ env }) => ({ lines: [t(fortune(env.now), "fg")] }),
  },
  {
    name: "vim",
    aliases: ["vi", "nvim"],
    run: ({ args, env }) => ({ state: { mode: "vim", vim: newVim(env.now, args[0] ?? "portafolio.md") } }),
  },
  {
    name: "emacs",
    run: () => ({
      lines: [row(["bash: emacs: orden no encontrada ", "danger"], ["(y así debe ser)", "dim"])],
      effects: [{ type: "secret", id: "emacs" }],
    }),
  },
  {
    name: "nano",
    aliases: ["pico"],
    run: () => ({ lines: [row(["nano: demasiado fácil. ", "muted"], ["El reto está en vim.", "fg"])] }),
  },
  {
    name: "git",
    run({ args }) {
      const [sub, ...rest] = args;
      switch (sub) {
        case undefined:
          return { lines: [t("uso: git <status | log | blame | push>")] };
        case "status":
          return {
            lines: [
              t("En la rama main", "fg"),
              t("Tu rama está actualizada con 'origin/main'.", "fg"),
              blank,
              t("nada para hacer commit, el árbol de trabajo está limpio", "fg"),
            ],
          };
        case "log":
          return {
            lines: experience.flatMap((job, index): Line[] => [
              row(
                [shortHash(`${job.company}${job.start}`), "amber"],
                ...(index === 0 && job.end === null ? ([[" (HEAD -> main)", "accent"]] as [string, "accent"][]) : []),
                [` ${job.role} @ ${job.company}`, "fg"],
              ),
              t(`        ${formatYearMonth(job.start)} — ${job.end ? formatYearMonth(job.end) : "actualidad"}`, "dim"),
            ]),
          };
        case "blame":
          return { lines: [row(["fidel", "accent"], ["  todas las líneas. Sin excusas.", "muted"])] };
        case "commit":
          return { lines: [t("nada para hacer commit, el árbol de trabajo está limpio", "fg")] };
        case "push":
          if (rest.includes("--force-with-lease")) {
            return { lines: [t("Everything up-to-date", "fg"), t("Así sí: --force-with-lease no pisa el trabajo de nadie.", "emerald")] };
          }
          if (rest.includes("--force") || rest.includes("-f")) {
            return {
              lines: [
                t(" ! [rejected]        main -> main (sentido común)", "danger"),
                row(["hint: ", "amber"], ["usa --force-with-lease: no pisa el trabajo de nadie.", "muted"]),
              ],
              effects: [{ type: "secret", id: "force" }],
            };
          }
          return { lines: [t("Everything up-to-date", "fg")] };
        default:
          return { lines: [t(`git: '${sub}' no es un comando de git. Mira 'git --help'.`, "danger")] };
      }
    },
  },
  {
    name: "mysql",
    aliases: ["mariadb"],
    run({ args }) {
      const userFlag = args.findIndex((arg) => arg === "-u" || arg === "--user");
      const inline = args.find((arg) => /^-u.+/.test(arg))?.slice(2);
      const user = (userFlag >= 0 ? args[userFlag + 1] : inline) ?? "fidel";
      const password = args.some((arg) => arg.startsWith("-p") || arg.startsWith("--password"));
      return {
        lines: [t(`ERROR 1045 (28000): Access denied for user '${user}'@'localhost' (using password: ${password ? "YES" : "NO"})`, "danger")],
        effects: [{ type: "secret", id: "mysql" }],
      };
    },
  },
  {
    name: "ping",
    run: ({ args }) => ({
      lines: [
        t(`PING ${args[0] ?? "fidel"}: 64 bytes, tiempo de respuesta: lo que tarde en leer el correo.`),
        link("escribirle por el formulario de contacto", { type: "navigate", section: "contacto" }),
      ],
    }),
  },
  {
    name: "hola",
    aliases: ["hello", "hi"],
    run: () => ({ lines: [row(["¡Hola! Escribe ", "muted"], ["help", "fg"], [" para empezar.", "muted"])] }),
  },
];

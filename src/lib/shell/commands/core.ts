import { experience, profile, sections, type SectionId } from "@/data/profile";
import { formatMonths, formatYearMonth, totalExperienceMonths } from "@/lib/time";
import { fetchLines, SECRETS, statusLines, TOTAL_SECRETS } from "../content";
import { absolutePath, listDirs, listFiles, resolvePath } from "../fs";
import { blank, link, row, t } from "../out";
import type { CommandDef, CommandGroup, Env, Line, Segment } from "../types";

export function isRoot(env: Env) {
  return env.secrets.length >= TOTAL_SECRETS;
}

const GROUP_ORDER: CommandGroup[] = ["Navegación", "Perfil", "Laravel", "Sistema"];

const OPEN_TARGETS: Record<string, string> = {
  github: profile.contact.github,
  linkedin: profile.contact.linkedin,
  email: `mailto:${profile.contact.email}`,
};

const dateFormatter = new Intl.DateTimeFormat("es-SV", {
  dateStyle: "full",
  timeStyle: "medium",
  timeZone: "America/El_Salvador",
});

function sectionLabel(id: SectionId) {
  return sections.find((section) => section.id === id)?.label ?? id;
}

/** Cambia de directorio. En la vista normal también desplaza la página a esa sección. */
function changeDirectory(section: SectionId, env: Env) {
  const lines: Line[] = [];
  if (section !== "inicio") {
    if (env.maximized) {
      lines.push(link(`ver la sección «${sectionLabel(section)}» en la página`, { type: "navigate", section }));
    } else {
      lines.push(t(`página desplazada a «${sectionLabel(section)}». Vuelve con Ctrl + K › Abrir terminal.`, "dim"));
    }
  }
  return {
    lines,
    state: { cwd: section },
    effects: env.maximized ? [] : [{ type: "navigate" as const, section }],
  };
}

export const coreCommands: CommandDef[] = [
  {
    name: "help",
    aliases: ["ayuda", "?"],
    group: "Sistema",
    summary: "Muestra esta ayuda",
    run({ registry }) {
      const lines: Line[] = [];
      for (const group of GROUP_ORDER) {
        const commands = registry.filter((command) => command.group === group);
        if (!commands.length) continue;
        lines.push(row([group, "amber"]));
        for (const command of commands) {
          lines.push(row([`  ${(command.usage ?? command.name).padEnd(26)}`, "emerald"], [command.summary ?? "", "muted"]));
        }
      }
      lines.push(
        blank,
        row(["Atajos: ", "dim"], ["↑ ↓", "fg"], [" historial · ", "dim"], ["Tab", "fg"], [" autocompleta · ", "dim"], ["Ctrl + L", "fg"], [" limpia", "dim"]),
        row(
          [`Hay ${TOTAL_SECRETS} secretos`, "amber"],
          [" que no salen aquí. Revisa tu progreso con ", "muted"],
          ["secretos", "fg"],
          [".", "muted"],
        ),
      );
      return { lines };
    },
  },
  {
    name: "clear",
    aliases: ["cls"],
    group: "Sistema",
    summary: "Limpia la pantalla",
    run: () => ({ effects: [{ type: "clear" }] }),
  },
  {
    name: "ls",
    aliases: ["ll", "dir"],
    group: "Navegación",
    usage: "ls [-a] [ruta]",
    summary: "Lista secciones y archivos",
    run({ args, state }) {
      const flags = args.filter((arg) => arg.startsWith("-")).join("");
      const target = args.find((arg) => !arg.startsWith("-"));
      const showHidden = flags.includes("a");
      let dir = state.cwd;

      if (target) {
        const resolved = resolvePath(state.cwd, target);
        if (resolved.kind === "file") return { lines: [t(resolved.file.name, "fg")] };
        if (resolved.kind === "special") return { lines: [t(target, "fg")] };
        if (resolved.kind === "outside") return { lines: [t(`ls: no se puede abrir el directorio '${target}': Permiso denegado`, "danger")] };
        if (resolved.kind === "missing") return { lines: [t(`ls: no se puede acceder a '${target}': No existe el fichero o el directorio`, "danger")] };
        dir = resolved.section;
      }

      const segments: Segment[] = [];
      for (const name of listDirs(dir)) segments.push({ t: `${name}/`, tone: "accent" }, { t: "  " });
      for (const file of listFiles(dir, showHidden)) segments.push({ t: file.name, tone: file.hidden ? "dim" : "fg" }, { t: "  " });
      return { lines: segments.length ? [{ kind: "code", segments }] : [] };
    },
    complete: (_args, state) => [...listDirs(state.cwd).map((dir) => `${dir}/`), ...listFiles(state.cwd).map((file) => file.name)],
  },
  {
    name: "cd",
    group: "Navegación",
    usage: "cd <sección>",
    summary: "Entra a una sección del sitio",
    run({ args, state, env }) {
      const target = args[0] ?? "~";
      const resolved = resolvePath(state.cwd, target);
      if (resolved.kind === "dir") return changeDirectory(resolved.section, env);
      if (resolved.kind === "file" || resolved.kind === "special") return { lines: [t(`bash: cd: ${target}: No es un directorio`, "danger")] };
      if (resolved.kind === "outside") return { lines: [t(`bash: cd: ${target}: Permiso denegado`, "danger")] };
      return { lines: [t(`bash: cd: ${target}: No existe el fichero o el directorio`, "danger")] };
    },
    complete: (_args, state) => [...listDirs(state.cwd), ...(state.cwd === "inicio" ? [] : [".."])],
  },
  {
    name: "pwd",
    group: "Navegación",
    summary: "Muestra la ruta actual",
    run: ({ state }) => ({ lines: [t(absolutePath(state.cwd), "fg")] }),
  },
  {
    name: "cat",
    aliases: ["less", "more", "bat"],
    group: "Navegación",
    usage: "cat <archivo>",
    summary: "Lee un archivo",
    run({ args, state }) {
      if (!args.length) return { lines: [t("cat: falta un operando. Prueba: cat about.txt", "danger")] };
      const lines: Line[] = [];
      for (const target of args) {
        const resolved = resolvePath(state.cwd, target);
        if (resolved.kind === "file") lines.push(...resolved.file.read());
        else if (resolved.kind === "special") lines.push(...resolved.read());
        else if (resolved.kind === "dir") lines.push(t(`cat: ${target}: Es un directorio`, "danger"));
        else if (resolved.kind === "outside") lines.push(t(`cat: ${target}: Permiso denegado`, "danger"));
        else lines.push(t(`cat: ${target}: No existe el fichero o el directorio`, "danger"));
      }
      return { lines };
    },
    complete: (_args, state) => [...listFiles(state.cwd).map((file) => file.name), ...listDirs(state.cwd).map((dir) => `${dir}/`)],
  },
  {
    name: "open",
    aliases: ["xdg-open"],
    group: "Navegación",
    usage: "open <destino>",
    summary: "Abre github, linkedin, email o una sección",
    run({ args }) {
      const target = args[0]?.toLowerCase();
      if (!target) return { lines: [t(`uso: open <${[...Object.keys(OPEN_TARGETS), "sección"].join(" | ")}>`)] };
      if (OPEN_TARGETS[target]) {
        return { lines: [t(`abriendo ${target}…`, "dim")], effects: [{ type: "open", url: OPEN_TARGETS[target] }] };
      }
      const section = sections.find((item) => item.id === target);
      if (section) return { lines: [t(`abriendo ${section.path}…`, "dim")], effects: [{ type: "navigate", section: section.id }] };
      return { lines: [t(`open: no sé abrir '${args[0]}'`, "danger")] };
    },
    complete: () => [...Object.keys(OPEN_TARGETS), ...sections.map((section) => section.id)],
  },
  {
    name: "whoami",
    group: "Perfil",
    summary: "Quién está en la terminal",
    run: ({ env }) => ({ lines: [t(isRoot(env) ? "root" : "fidel", "fg")] }),
  },
  {
    name: "man",
    group: "Perfil",
    usage: "man fidel",
    summary: "Página de manual del perfil",
    run({ args }) {
      if (!args.length) return { lines: [t("¿Qué página de manual desea?"), t("Por ejemplo, pruebe con `man fidel'.")] };
      if (args[0] !== "fidel") return { lines: [t(`No hay ninguna página sobre ${args[0]}`, "danger")] };
      return {
        lines: [
          row(["FIDEL(1)", "fg"], ["              Manual del portafolio              ", "dim"], ["FIDEL(1)", "fg"]),
          blank,
          row(["NOMBRE", "amber"]),
          row(["       fidel", "fg"], [` — ${profile.role} (${profile.focus.join(" · ")})`, "muted"]),
          blank,
          row(["SINOPSIS", "amber"]),
          row(["       fidel", "fg"], [` ${profile.focus.map((item) => `[--${item.toLowerCase()}]`).join(" ")}`, "accent"]),
          blank,
          row(["DESCRIPCIÓN", "amber"]),
          t(`       ${profile.summary}`),
          blank,
          row(["UBICACIÓN", "amber"]),
          t(`       ${profile.location.full}`),
          blank,
          row(["VÉASE TAMBIÉN", "amber"]),
          row(["       php artisan about", "fg"], [", ", "dim"], ["cat about.txt", "fg"], [", ", "dim"], ["open github", "fg"]),
        ],
      };
    },
    complete: () => ["fidel"],
  },
  {
    name: "uptime",
    group: "Perfil",
    summary: "Tiempo de carrera acumulado",
    run({ env }) {
      const now = new Date(env.now);
      const first = experience.reduce((a, b) => (a.start < b.start ? a : b));
      return {
        lines: [
          row(
            ["up ", "dim"],
            [formatMonths(totalExperienceMonths(experience, now)), "amber"],
            [` de carrera · ${experience.length} roles · desde ${formatYearMonth(first.start)}`, "muted"],
          ),
        ],
      };
    },
  },
  {
    name: "fastfetch",
    aliases: ["neofetch"],
    group: "Perfil",
    summary: "Resumen del perfil",
    run: () => ({ lines: fetchLines }),
  },
  {
    name: "systemctl",
    group: "Perfil",
    usage: "systemctl status",
    summary: "Estado de career.service",
    run({ args }) {
      const unit = args[1]?.replace(/\.service$/, "");
      if (args[0] === "status" && (!unit || unit === "career")) return { lines: statusLines };
      if (args[0] === "status") return { lines: [t(`Unit ${args[1]} could not be found.`, "danger")] };
      return { lines: [t("uso: systemctl status career.service")] };
    },
    complete: () => ["status career.service"],
  },
  {
    name: "secretos",
    aliases: ["secrets", "logros"],
    group: "Sistema",
    summary: "Progreso del minijuego",
    run({ env }) {
      const found = new Set(env.secrets);
      return {
        lines: [
          row(["secretos ", "muted"], [`${found.size}/${TOTAL_SECRETS}`, "amber"]),
          ...SECRETS.map((secret) =>
            found.has(secret.id)
              ? row(["  [x] ", "emerald"], [secret.title, "fg"])
              : row(["  [ ] ", "dim"], ["???", "dim"], [`  pista: ${secret.hint}`, "muted"]),
          ),
          ...(isRoot(env) ? [blank, row(["Los encontraste todos. ", "emerald"], ["sudo ya te obedece.", "muted"])] : []),
        ],
      };
    },
  },
  {
    name: "echo",
    group: "Sistema",
    usage: "echo <texto>",
    summary: "Repite un texto",
    run: ({ args }) => ({ lines: [t(args.join(" "), "fg")] }),
  },
  {
    name: "date",
    group: "Sistema",
    summary: "Fecha y hora en El Salvador",
    run: ({ env }) => ({ lines: [t(dateFormatter.format(new Date(env.now)), "fg")] }),
  },
  {
    name: "history",
    group: "Sistema",
    summary: "Comandos que has escrito",
    run: ({ state }) => ({
      lines: state.history.map((entry, index) => row([`${String(index + 1).padStart(4)}  `, "dim"], [entry, "fg"])),
    }),
  },
  {
    name: "exit",
    aliases: ["logout", "quit"],
    group: "Sistema",
    summary: "Cierra el shell",
    run: () => ({ lines: [t("logout", "dim")], effects: [{ type: "exit" }] }),
  },
];

import { experience, profile, sections, skillGroups, type SectionId } from "@/data/profile";
import { formatYearMonth } from "@/lib/time";
import { stackLines } from "./content";
import { blank, link, row, t } from "./out";
import type { Line } from "./types";

/**
 * Sistema de archivos virtual. Cada sección del sitio es un directorio
 * y cada archivo se genera a partir de `src/data/profile.ts`.
 */

export type FsFile = { name: string; hidden?: boolean; read(): Line[] };

const HOME = "/home/fidel";
const DIRS = sections.filter((section) => section.id !== "inicio").map((section) => section.id);

function isDir(name: string): name is SectionId {
  return (DIRS as string[]).includes(name);
}

function jobFile(job: (typeof experience)[number]): FsFile {
  return {
    name: `${job.id}.md`,
    read: () => [
      row([`# ${job.role}`, "fg"]),
      row([job.company, "accent"], [` · ${job.location}`, "muted"]),
      t(`${formatYearMonth(job.start)} — ${job.end ? formatYearMonth(job.end) : "actualidad"}`, "dim"),
      blank,
      t(job.summary),
      blank,
      ...job.changes.map((change) =>
        row([`${change.type}${change.scope ? `(${change.scope})` : ""}: `, change.key ? "amber" : "emerald"], [change.text, "fg"]),
      ),
      blank,
      row(["stack: ", "dim"], [job.stack.join(" · "), "accent"]),
    ],
  };
}

const FILES: Record<SectionId, FsFile[]> = {
  inicio: [
    {
      name: "about.txt",
      read: () => [
        row([profile.fullName, "fg"]),
        row([profile.role, "accent"], [` · ${profile.location.full}`, "muted"]),
        blank,
        t(profile.summary),
        ...(profile.availability.open ? [blank, row(["estado: ", "dim"], [profile.availability.label, "emerald"])] : []),
      ],
    },
    {
      name: "README.md",
      read: () => [
        row(["# portafolio", "fg"]),
        t("Cada sección del sitio es un directorio. Muévete con cd y lee con cat."),
        row(["La parte divertida está en ", "muted"], ["php artisan", "accent"], [".", "muted"]),
      ],
    },
    {
      name: ".secretos",
      hidden: true,
      read: () => [row(["No todo sale en help. Escribe ", "muted"], ["secretos", "amber"], [" para ver tu progreso.", "muted"])],
    },
  ],
  experiencia: experience.map(jobFile),
  proyectos: [
    {
      name: "README.md",
      read: () => [
        t("Los proyectos se cargan en vivo desde la API pública de GitHub."),
        link("abrir la sección de proyectos", { type: "navigate", section: "proyectos" }),
        link(`abrir github.com/${profile.contact.githubUser}`, { type: "open", url: profile.contact.github }),
      ],
    },
  ],
  stack: skillGroups.map((group) => ({
    name: group.file,
    read: () => [
      t(`# ${group.title}`, "dim"),
      ...group.skills.map((skill) =>
        row(
          [skill.name, "fg"],
          [skill.detail ? ` = ${skill.detail}` : "", "muted"],
          [skill.usedAt?.length ? `  ${skill.usedAt.map((place) => `@${place}`).join(" ")}` : "", "accent"],
        ),
      ),
    ],
  })),
  contacto: [
    {
      name: "canales.txt",
      read: () => [
        row(["email     ", "dim"], [profile.contact.email, "fg"]),
        row(["linkedin  ", "dim"], [profile.contact.linkedinHandle, "fg"]),
        row(["github    ", "dim"], [`@${profile.contact.githubUser}`, "fg"]),
        blank,
        link("ir al formulario de contacto", { type: "navigate", section: "contacto" }),
      ],
    },
  ],
};

/** Archivos fuera del árbol de secciones que también se pueden leer. */
const SPECIAL_FILES: Record<string, () => Line[]> = {
  "~/.config/stack.yml": () => stackLines,
  ".config/stack.yml": () => stackLines,
};

/** `~` en inicio, `~/experiencia` en una sección. */
export function promptPath(cwd: SectionId) {
  return cwd === "inicio" ? "~" : `~/${cwd}`;
}

export function absolutePath(cwd: SectionId) {
  return cwd === "inicio" ? HOME : `${HOME}/${cwd}`;
}

export function listDirs(cwd: SectionId): SectionId[] {
  return cwd === "inicio" ? DIRS : [];
}

export function listFiles(cwd: SectionId, includeHidden = false): FsFile[] {
  return FILES[cwd].filter((file) => includeHidden || !file.hidden);
}

export type Resolved =
  | { kind: "dir"; section: SectionId }
  | { kind: "file"; file: FsFile }
  | { kind: "special"; read: () => Line[] }
  | { kind: "outside" }
  | { kind: "missing" };

/** Resuelve una ruta relativa o absoluta dentro del árbol virtual. */
export function resolvePath(cwd: SectionId, path: string): Resolved {
  if (SPECIAL_FILES[path]) return { kind: "special", read: SPECIAL_FILES[path] };

  let dir: SectionId = cwd;
  let rest = path;

  if (rest === "~" || rest.startsWith("~/")) {
    dir = "inicio";
    rest = rest.slice(1);
  } else if (rest === HOME || rest.startsWith(`${HOME}/`)) {
    dir = "inicio";
    rest = rest.slice(HOME.length);
  } else if (rest.startsWith("/")) {
    return { kind: "outside" };
  }

  const segments = rest.split("/").filter((segment) => segment && segment !== ".");

  for (const [index, segment] of segments.entries()) {
    if (segment === "..") {
      dir = "inicio";
      continue;
    }
    if (dir === "inicio" && isDir(segment)) {
      dir = segment;
      continue;
    }
    const file = FILES[dir].find((candidate) => candidate.name === segment);
    if (file && index === segments.length - 1) return { kind: "file", file };
    return { kind: "missing" };
  }
  return { kind: "dir", section: dir };
}

import { education, experience, profile } from "@/data/profile";
import { formatYearMonth } from "@/lib/time";
import type { Line, SecretId } from "./types";

/**
 * Contenido derivado del perfil que comparten las pestañas del inspector
 * y los comandos del shell. No depende del motor, así se carga con la página.
 */

export type InspectorTabId = "status" | "fetch" | "stack";

export type InspectorTab = {
  id: InspectorTabId;
  label: string;
  command: string;
  lines: Line[];
};

const current = experience.find((job) => job.end === null) ?? experience[0];
const previous = experience.find((job) => job.end !== null);
const university = education.find((item) => item.status === "en-curso");

export const statusLines: Line[] = [
  { kind: "title", unit: "career.service", text: `${profile.name} · ${profile.role}` },
  { kind: "kv", k: "Loaded", v: "loaded (/etc/systemd/system/career.service; enabled)" },
  {
    kind: "kv",
    k: "Active",
    v: `active (running) desde ${formatYearMonth(current.start)} · ${current.company}`,
    tone: "emerald",
  },
  { kind: "kv", k: "Location", v: profile.location.full },
  { kind: "kv", k: "Stack", v: "PHP · Laravel · Livewire · MySQL · JavaScript", tone: "accent" },
  ...(university ? [{ kind: "kv" as const, k: "Formación", v: `${university.degree} · UFG (en curso)` }] : []),
  ...(profile.availability.open
    ? [{ kind: "kv" as const, k: "Estado", v: profile.availability.label, tone: "amber" as const }]
    : []),
  { kind: "blank" },
  ...(previous
    ? [
        {
          kind: "log" as const,
          date: formatYearMonth(previous.start),
          unit: previous.id,
          state: "started",
          msg: previous.role,
        },
        {
          kind: "log" as const,
          date: formatYearMonth(previous.end!),
          unit: previous.id,
          state: "stopped",
          msg: "PHP/Laravel · MySQL · JS · Scrum",
        },
      ]
    : []),
  { kind: "log", date: formatYearMonth(current.start), unit: current.id, state: "started", msg: current.role },
  { kind: "log", date: "ahora", unit: current.id, state: "running", msg: "Laravel · Livewire · MySQL · Wompi" },
];

export const fetchLines: Line[] = [
  { kind: "heading", text: "fidel@fedora" },
  { kind: "kv", k: "SO", v: "Linux · Fedora, Debian" },
  { kind: "kv", k: "Rol", v: profile.role },
  { kind: "kv", k: "Backend", v: "PHP · Laravel · Livewire" },
  { kind: "kv", k: "Datos", v: "MySQL · SQL" },
  { kind: "kv", k: "Frontend", v: "JavaScript" },
  { kind: "kv", k: "Lenguajes", v: "Java · Python" },
  { kind: "kv", k: "Contenedor", v: "Docker" },
  { kind: "kv", k: "Método", v: "Scrum" },
  { kind: "kv", k: "Formación", v: "Ing. Desarrollo de Software" },
  { kind: "blank" },
  { kind: "swatches" },
];

export const stackLines: Line[] = [
  { kind: "code", segments: [{ t: "# stack aplicado en roles profesionales", tone: "dim" }] },
  { kind: "code", segments: [{ t: "backend", tone: "accent" }, { t: ":", tone: "dim" }] },
  { kind: "code", segments: [{ t: "  lenguaje", tone: "accent" }, { t: ": ", tone: "dim" }, { t: "php" }] },
  { kind: "code", segments: [{ t: "  framework", tone: "accent" }, { t: ": ", tone: "dim" }, { t: "laravel" }] },
  { kind: "code", segments: [{ t: "  ui", tone: "accent" }, { t: ": ", tone: "dim" }, { t: "livewire" }] },
  { kind: "code", segments: [{ t: "datos", tone: "accent" }, { t: ": ", tone: "dim" }, { t: "mysql" }] },
  { kind: "code", segments: [{ t: "frontend", tone: "accent" }, { t: ": ", tone: "dim" }, { t: "javascript" }] },
  { kind: "code", segments: [{ t: "integraciones", tone: "accent" }, { t: ":", tone: "dim" }] },
  { kind: "code", segments: [{ t: "  - ", tone: "dim" }, { t: "wompi", tone: "amber" }, { t: "  # pasarela de pagos", tone: "dim" }] },
  { kind: "code", segments: [{ t: "deploy", tone: "accent" }, { t: ": ", tone: "dim" }, { t: "hostinger" }] },
  { kind: "code", segments: [{ t: "entorno", tone: "accent" }, { t: ":", tone: "dim" }] },
  { kind: "code", segments: [{ t: "  so", tone: "accent" }, { t: ": ", tone: "dim" }, { t: "[fedora, debian]" }] },
  { kind: "code", segments: [{ t: "  contenedores", tone: "accent" }, { t: ": ", tone: "dim" }, { t: "docker" }] },
  { kind: "code", segments: [{ t: "proceso", tone: "accent" }, { t: ": ", tone: "dim" }, { t: "scrum", tone: "emerald" }] },
];

export const INSPECTOR_TABS: InspectorTab[] = [
  { id: "status", label: "status", command: "systemctl status career.service", lines: statusLines },
  { id: "fetch", label: "fetch", command: "fastfetch", lines: fetchLines },
  { id: "stack", label: "stack", command: "cat ~/.config/stack.yml", lines: stackLines },
];

export const FETCH_LOGO = ["█▀▀▀▀  ▄▀▀▀▀", "█▄▄▄   █    ", "█      █    ", "▀       ▀▀▀▀"].join("\n");

/** Los secretos del minijuego. No aparecen en `help`; se descubren probando. */
export const SECRETS: { id: SecretId; title: string; hint: string }[] = [
  { id: "sudoers", title: "Sin permisos", hint: "Pide privilegios de superusuario." },
  { id: "sandwich", title: "xkcd 149", hint: "Pide un sándwich… con autoridad." },
  { id: "rm", title: "Viernes por la tarde", hint: "El comando que nunca se ejecuta en producción." },
  { id: "sl", title: "Dedos rápidos", hint: "Escribe mal `ls`." },
  { id: "cowsay", title: "La vaca opina", hint: "Una vaca tiene algo que decir." },
  { id: "vim", title: "Sobreviviente", hint: "Entra al editor del que nadie sale. Y sal." },
  { id: "emacs", title: "Guerra de editores", hint: "Invoca al editor rival." },
  { id: "force", title: "A la fuerza", hint: "Sube cambios con git sin pedir permiso." },
  { id: "mysql", title: "Acceso denegado", hint: "Intenta entrar a la base de datos." },
];

export const TOTAL_SECRETS = SECRETS.length;

/** Mensaje de bienvenida del shell. */
export const MOTD: Line[] = [
  {
    kind: "code",
    segments: [
      { t: "Fedora Linux", tone: "accent" },
      { t: ` · sesión de visitante en el portafolio de ${profile.name}`, tone: "muted" },
    ],
  },
  {
    kind: "code",
    segments: [
      { t: "Escribe ", tone: "muted" },
      { t: "help", tone: "fg" },
      { t: " para ver los comandos. Hay ", tone: "muted" },
      { t: `${TOTAL_SECRETS} secretos`, tone: "amber" },
      { t: " escondidos.", tone: "muted" },
    ],
  },
  { kind: "blank" },
];

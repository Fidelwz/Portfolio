import type { SectionId } from "@/data/profile";

export type Tone = "fg" | "muted" | "dim" | "accent" | "amber" | "emerald" | "danger";

export type Segment = { t: string; tone?: Tone };

/** Acción que una línea clicable o un comando puede pedirle a la interfaz. */
export type Effect =
  | { type: "clear" }
  | { type: "navigate"; section: SectionId }
  | { type: "open"; url: string }
  | { type: "exit" }
  | { type: "shake" }
  | { type: "secret"; id: SecretId }
  | { type: "vim-record"; ms: number };

export type PromptInfo = {
  user: "fidel" | "root";
  path: string;
  /** `$` usuario normal, `#` root, `>` tinker, `?` confirmación. */
  symbol: "$" | "#" | ">" | "?";
};

export type Line =
  | { kind: "title"; unit: string; text: string }
  | { kind: "kv"; k: string; v: string; tone?: Tone }
  | { kind: "log"; date: string; unit: string; state: string; msg: string }
  | { kind: "code"; segments: Segment[] }
  | { kind: "heading"; text: string }
  | { kind: "swatches" }
  | { kind: "blank" }
  /** Arte ASCII o tablas: sin ajuste de línea. */
  | { kind: "pre"; text: string; tone?: Tone }
  /** Fila con puntos guía al estilo de la consola de Laravel. Clicable si lleva `action`. */
  | { kind: "dots"; left: Segment[]; right: Segment[]; action?: Effect; label?: string }
  /** Enlace de acción dentro de la salida. */
  | { kind: "link"; text: string; action: Effect }
  /** Eco de lo que escribió el visitante, con el prompt de ese momento. */
  | { kind: "echo"; prompt: PromptInfo; text: string }
  /** El tren de `sl`. */
  | { kind: "train" };

export type Entry = { id: number; line: Line };

export type SecretId =
  | "sudoers"
  | "sandwich"
  | "rm"
  | "sl"
  | "cowsay"
  | "vim"
  | "emacs"
  | "force"
  | "mysql";

export type Mode = "bash" | "tinker" | "vim" | "confirm";

export type VimState = {
  startedAt: number;
  buffer: string[];
  message: Segment | null;
  attempts: number;
  insert: boolean;
};

export type ShellState = {
  mode: Mode;
  cwd: SectionId;
  history: string[];
  vim: VimState | null;
  /** Comando a la espera de un sí o no. */
  confirm: string | null;
};

/** Lo que el motor necesita del mundo exterior. Se captura en el evento, nunca en el render. */
export type Env = {
  now: number;
  secrets: readonly SecretId[];
  vimRecord: number | null;
  maximized: boolean;
};

export type Result = {
  state: ShellState;
  lines: Line[];
  effects: Effect[];
};

export type Signal = "interrupt" | "escape" | "eof";

export type Completion = { value: string; candidates: string[] };

export type CommandContext = {
  args: string[];
  raw: string;
  state: ShellState;
  env: Env;
  registry: readonly CommandDef[];
};

export type CommandOutput = {
  lines?: Line[];
  state?: Partial<ShellState>;
  effects?: Effect[];
};

export type CommandGroup = "Navegación" | "Perfil" | "Laravel" | "Sistema";

export type CommandDef = {
  name: string;
  aliases?: string[];
  /** Sin `group` el comando queda oculto en `help` y en el autocompletado. */
  group?: CommandGroup;
  usage?: string;
  summary?: string;
  run(ctx: CommandContext): CommandOutput;
  /** Candidatos para lo que va después del nombre del comando (`rest`). */
  complete?(rest: string, state: ShellState): string[];
};

export const INITIAL_SHELL_STATE: ShellState = {
  mode: "bash",
  cwd: "inicio",
  history: [],
  vim: null,
  confirm: null,
};

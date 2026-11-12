import type { ReactNode } from "react";
import type { Effect, Line, PromptInfo, Segment, Tone } from "@/lib/shell/types";
import { Train } from "./train";

export const toneClass: Record<Tone, string> = {
  fg: "text-fg",
  muted: "text-muted",
  dim: "text-dim",
  accent: "text-accent",
  amber: "text-amber",
  emerald: "text-emerald",
  danger: "text-danger",
};

const SWATCHES = ["bg-canvas", "bg-surface-2", "bg-line-strong", "bg-muted", "bg-fg", "bg-accent", "bg-amber", "bg-emerald"];

const DEFAULT_PROMPT: PromptInfo = { user: "fidel", path: "~", symbol: "$" };

/** `fidel@fedora:~$ ` — o solo `> ` dentro de tinker y de una confirmación. */
export function PromptLabel({ info = DEFAULT_PROMPT }: { info?: PromptInfo }) {
  if (info.symbol === ">" || info.symbol === "?") {
    return <span className="select-none text-amber">{info.symbol === ">" ? "> " : "  ❯ "}</span>;
  }
  return (
    <span className="select-none">
      <span className={info.user === "root" ? "text-danger" : "text-emerald"}>{info.user}@fedora</span>
      <span className="text-dim">:</span>
      <span className="text-accent">{info.path}</span>
      <span className="text-dim">{info.symbol} </span>
    </span>
  );
}

export function Prompt({ info, children }: { info?: PromptInfo; children?: ReactNode }) {
  return (
    <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
      <PromptLabel info={info} />
      <span className="text-fg">{children}</span>
    </p>
  );
}

export function Cursor() {
  return <span aria-hidden="true" className="ml-px inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-muted animate-blink" />;
}

function Segments({ segments, fallback = "fg" }: { segments: Segment[]; fallback?: Tone }) {
  return (
    <>
      {segments.map((segment, index) => (
        <span key={index} className={toneClass[segment.tone ?? fallback]}>
          {segment.t}
        </span>
      ))}
    </>
  );
}

type TerminalLineProps = {
  line: Line;
  /** Estilo fastfetch para las filas clave/valor: clave a la izquierda en azul. */
  fetchStyle?: boolean;
  onAction?: (effect: Effect) => void;
};

export function TerminalLine({ line, fetchStyle = false, onAction }: TerminalLineProps) {
  switch (line.kind) {
    case "title":
      return (
        <p className="[overflow-wrap:anywhere]">
          <span className="text-emerald">● </span>
          <span className="font-medium text-fg">{line.unit}</span>
          <span className="text-dim"> — </span>
          <span className="text-muted">{line.text}</span>
        </p>
      );
    case "kv":
      if (fetchStyle) {
        return (
          <p className="[overflow-wrap:anywhere]">
            <span className="text-accent">{line.k}</span>
            <span className="text-dim">: </span>
            <span className={toneClass[line.tone ?? "muted"]}>{line.v}</span>
          </p>
        );
      }
      return (
        <div className="grid grid-cols-[5.75rem_1fr] gap-x-3 sm:grid-cols-[6.5rem_1fr]">
          <span className="text-right text-dim">{line.k}:</span>
          <span className={`[overflow-wrap:anywhere] ${toneClass[line.tone ?? "muted"]}`}>{line.v}</span>
        </div>
      );
    case "log":
      return (
        <p className="flex flex-wrap gap-x-2 text-[11.5px]">
          <span className="w-[4.25rem] shrink-0 text-dim">{line.date}</span>
          <span className="text-accent">{line.unit}</span>
          <span className={line.state === "running" ? "text-emerald" : line.state === "stopped" ? "text-dim" : "text-amber"}>
            {line.state}:
          </span>
          <span className="text-muted">{line.msg}</span>
        </p>
      );
    case "code":
      return (
        <p className="min-h-[1.5em] whitespace-pre-wrap [overflow-wrap:anywhere]">
          <Segments segments={line.segments} />
        </p>
      );
    case "heading":
      return (
        <div>
          <p>
            <span className="font-medium text-accent">fidel</span>
            <span className="text-dim">@</span>
            <span className="font-medium text-accent">fedora</span>
          </p>
          <p className="text-dim" aria-hidden="true">
            ────────────
          </p>
        </div>
      );
    case "swatches":
      return (
        <div className="flex gap-1" aria-hidden="true">
          {SWATCHES.map((swatch) => (
            <span key={swatch} className={`h-3 w-5 rounded-[2px] border border-line ${swatch}`} />
          ))}
        </div>
      );
    case "blank":
      return <div className="h-3" aria-hidden="true" />;
    case "pre":
      return <pre className={`overflow-x-auto leading-[1.3] ${toneClass[line.tone ?? "muted"]}`}>{line.text}</pre>;
    case "dots": {
      // Las etiquetas cortas no se parten; las largas (nombres de migración) sí pueden.
      const short = line.left.reduce((total, segment) => total + segment.t.length, 0) <= 30;
      const content = (
        <>
          <span className={`whitespace-pre-wrap [overflow-wrap:anywhere] ${short ? "shrink-0" : "min-w-0"}`}>
            <Segments segments={line.left} />
          </span>
          <span aria-hidden="true" className="mx-2 min-w-3 flex-1 translate-y-[-0.3em] border-b border-dotted border-line-strong" />
          <span className="min-w-0 text-right [overflow-wrap:anywhere]">
            <Segments segments={line.right} fallback="muted" />
          </span>
        </>
      );
      if (line.action && onAction) {
        const action = line.action;
        return (
          <button
            type="button"
            onClick={() => onAction(action)}
            aria-label={line.label}
            className="flex w-full items-baseline rounded-sm text-left transition-colors duration-150 hover:bg-surface-2"
          >
            {content}
          </button>
        );
      }
      return <div className="flex items-baseline">{content}</div>;
    }
    case "link": {
      const action = line.action;
      return (
        <p>
          <button
            type="button"
            onClick={() => onAction?.(action)}
            className="text-left text-accent underline decoration-accent-strong underline-offset-4 transition-colors duration-150 hover:text-fg"
          >
            → {line.text}
          </button>
        </p>
      );
    }
    case "echo":
      return <Prompt info={line.prompt}>{line.text}</Prompt>;
    case "train":
      return <Train />;
  }
}

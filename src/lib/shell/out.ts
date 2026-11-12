import type { Effect, Line, Segment, Tone } from "./types";

/** Línea de texto de un solo color. */
export function t(text: string, tone: Tone = "muted"): Line {
  return { kind: "code", segments: [{ t: text, tone }] };
}

/** Línea con varios colores: `row(["error: ", "danger"], "detalle")`. */
export function row(...parts: (string | [string, Tone])[]): Line {
  return {
    kind: "code",
    segments: parts.map((part): Segment => (typeof part === "string" ? { t: part, tone: "muted" } : { t: part[0], tone: part[1] })),
  };
}

export const blank: Line = { kind: "blank" };

export function pre(text: string, tone: Tone = "muted"): Line {
  return { kind: "pre", text, tone };
}

export function dots(left: Segment[], right: Segment[], action?: Effect, label?: string): Line {
  return { kind: "dots", left, right, action, label };
}

export function link(text: string, action: Effect): Line {
  return { kind: "link", text, action };
}

/** Etiqueta al estilo de Laravel: `  INFO  mensaje`. */
export function badge(label: "INFO" | "WARN" | "ERROR", text: string): Line {
  const tone: Tone = label === "INFO" ? "accent" : label === "WARN" ? "amber" : "danger";
  return row(["  ", "dim"], [` ${label} `, tone], ["  ", "dim"], [text, "fg"]);
}

/** Texto plano de una línea, para tuberías como `fortune | cowsay`. */
export function plainText(line: Line): string | null {
  switch (line.kind) {
    case "code":
      return line.segments.map((segment) => segment.t).join("");
    case "kv":
      return `${line.k}: ${line.v}`;
    case "title":
      return `${line.unit} — ${line.text}`;
    case "dots":
      return `${line.left.map((s) => s.t).join("")} ${line.right.map((s) => s.t).join("")}`;
    case "pre":
      return line.text;
    case "link":
      return line.text;
    default:
      return null;
  }
}

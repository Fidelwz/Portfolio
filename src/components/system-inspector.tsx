"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { education, experience, profile } from "@/data/profile";
import { prefersReducedMotion } from "@/lib/client";
import { formatYearMonth } from "@/lib/time";
import { RotateCw } from "./icons";

type Tone = "fg" | "muted" | "dim" | "accent" | "amber" | "emerald";

type Line =
  | { kind: "title"; unit: string; text: string }
  | { kind: "kv"; k: string; v: string; tone?: Tone }
  | { kind: "log"; date: string; unit: string; state: string; msg: string }
  | { kind: "code"; segments: { t: string; tone?: Tone }[] }
  | { kind: "heading"; text: string }
  | { kind: "swatches" }
  | { kind: "blank" };

type Tab = { id: "status" | "fetch" | "stack"; label: string; command: string; lines: Line[] };

const toneClass: Record<Tone, string> = {
  fg: "text-fg",
  muted: "text-muted",
  dim: "text-dim",
  accent: "text-accent",
  amber: "text-amber",
  emerald: "text-emerald",
};

const current = experience.find((job) => job.end === null) ?? experience[0];
const previous = experience.find((job) => job.end !== null);
const university = education.find((item) => item.status === "en-curso");

const TABS: Tab[] = [
  {
    id: "status",
    label: "status",
    command: "systemctl status career.service",
    lines: [
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
      ...(university
        ? [{ kind: "kv" as const, k: "Formación", v: `${university.degree} · UFG (en curso)` }]
        : []),
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
    ],
  },
  {
    id: "fetch",
    label: "fetch",
    command: "fastfetch",
    lines: [
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
    ],
  },
  {
    id: "stack",
    label: "stack",
    command: "cat ~/.config/stack.yml",
    lines: [
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
    ],
  },
];

const FETCH_LOGO = ["█▀▀▀▀  ▄▀▀▀▀", "█▄▄▄   █    ", "█      █    ", "▀       ▀▀▀▀"];

const SWATCHES = ["bg-canvas", "bg-surface-2", "bg-line-strong", "bg-muted", "bg-fg", "bg-accent", "bg-amber", "bg-emerald"];

function Prompt({ children }: { children?: ReactNode }) {
  return (
    <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
      <span className="text-emerald">fidel@fedora</span>
      <span className="text-dim">:</span>
      <span className="text-accent">~</span>
      <span className="text-dim">$ </span>
      <span className="text-fg">{children}</span>
    </p>
  );
}

function Cursor() {
  return <span aria-hidden="true" className="ml-px inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-muted animate-blink" />;
}

function renderLine(line: Line, index: number, fetchStyle = false) {
  switch (line.kind) {
    case "title":
      return (
        <p key={index} className="[overflow-wrap:anywhere]">
          <span className="text-emerald">● </span>
          <span className="font-medium text-fg">{line.unit}</span>
          <span className="text-dim"> — </span>
          <span className="text-muted">{line.text}</span>
        </p>
      );
    case "kv":
      if (fetchStyle) {
        return (
          <p key={index} className="[overflow-wrap:anywhere]">
            <span className="text-accent">{line.k}</span>
            <span className="text-dim">: </span>
            <span className={toneClass[line.tone ?? "muted"]}>{line.v}</span>
          </p>
        );
      }
      return (
        <div key={index} className="grid grid-cols-[5.75rem_1fr] gap-x-3 sm:grid-cols-[6.5rem_1fr]">
          <span className="text-right text-dim">{line.k}:</span>
          <span className={`[overflow-wrap:anywhere] ${toneClass[line.tone ?? "muted"]}`}>{line.v}</span>
        </div>
      );
    case "log":
      return (
        <p key={index} className="flex flex-wrap gap-x-2 text-[11.5px]">
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
        <p key={index} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
          {line.segments.map((segment, i) => (
            <span key={i} className={toneClass[segment.tone ?? "fg"]}>
              {segment.t}
            </span>
          ))}
        </p>
      );
    case "heading":
      return (
        <div key={index}>
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
        <div key={index} className="flex gap-1" aria-hidden="true">
          {SWATCHES.map((swatch) => (
            <span key={swatch} className={`h-3 w-5 rounded-[2px] border border-line ${swatch}`} />
          ))}
        </div>
      );
    case "blank":
      return <div key={index} className="h-3" aria-hidden="true" />;
  }
}

export function SystemInspector() {
  const [tabId, setTabId] = useState<Tab["id"]>("status");
  const [run, setRun] = useState(0);
  // Infinity = salida completa (estado inicial en SSR, sin animación al cargar).
  const [typed, setTyped] = useState(Number.POSITIVE_INFINITY);
  const [visible, setVisible] = useState(Number.POSITIVE_INFINITY);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const tab = TABS.find((t) => t.id === tabId) ?? TABS[0];

  useEffect(() => {
    if (run === 0) return;
    const active = TABS.find((t) => t.id === tabId) ?? TABS[0];
    let typedCount = 0;
    let lineCount = 0;
    let timer = 0;

    const lineStep = () => {
      lineCount += 1;
      setVisible(lineCount);
      if (lineCount < active.lines.length) timer = window.setTimeout(lineStep, 42);
    };
    const typeStep = () => {
      typedCount += 1;
      setTyped(typedCount);
      if (typedCount < active.command.length) timer = window.setTimeout(typeStep, 22 + Math.random() * 26);
      else timer = window.setTimeout(lineStep, 180);
    };
    timer = window.setTimeout(typeStep, 120);
    return () => window.clearTimeout(timer);
  }, [run, tabId]);

  function activate(id: Tab["id"]) {
    setTabId(id);
    if (prefersReducedMotion()) {
      setTyped(Number.POSITIVE_INFINITY);
      setVisible(Number.POSITIVE_INFINITY);
      return;
    }
    setTyped(0);
    setVisible(0);
    setRun((value) => value + 1);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + TABS.length) % TABS.length;
    tabRefs.current[next]?.focus();
    activate(TABS[next].id);
  }

  const typing = typed < tab.command.length;
  const done = !typing && visible >= tab.lines.length;
  const shownLines = tab.lines.slice(0, typing ? 0 : visible);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {/* Barra de título estilo GNOME: título centrado, controles a la derecha. */}
      <div className="relative flex h-9 items-center justify-center border-b border-line px-3">
        <p className="font-mono text-[11px] text-dim">fidel@fedora: ~</p>
        <div className="absolute right-3 flex gap-1.5" aria-hidden="true">
          <span className="size-3 rounded-full border border-line-strong bg-surface-2" />
          <span className="size-3 rounded-full border border-line-strong bg-surface-2" />
          <span className="size-3 rounded-full border border-line-strong bg-surface-2" />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-line bg-canvas-raised pr-2">
        <div role="tablist" aria-label="Inspección del perfil" className="flex">
          {TABS.map((t, index) => {
            const selected = t.id === tabId;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => activate(t.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`relative h-9 border-r border-line px-4 font-mono text-[11px] transition-colors duration-150 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-px ${
                  selected ? "bg-surface text-fg after:bg-accent" : "text-dim hover:bg-surface/60 hover:text-muted"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => activate(tabId)}
          className="flex h-7 items-center gap-1.5 rounded px-2 font-mono text-[11px] text-dim transition-colors duration-150 hover:bg-surface hover:text-fg"
        >
          <RotateCw size={12} />
          <span className="hidden sm:inline">ejecutar</span>
          <span className="sr-only sm:hidden">Ejecutar de nuevo</span>
        </button>
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${tabId}`}
        aria-busy={!done}
        className="min-h-[23rem] space-y-1 p-4 font-mono text-[12px] leading-6 sm:p-5 sm:text-[12.5px]"
      >
        <Prompt>
          {tab.command.slice(0, Number.isFinite(typed) ? typed : undefined)}
          {typing && <Cursor />}
        </Prompt>

        {tab.id === "fetch" ? (
          <div className="flex gap-5 pt-1">
            {shownLines.length > 0 && (
              <pre className="hidden shrink-0 leading-[1.15] text-accent motion-safe:animate-fade-in sm:block" aria-hidden="true">
                {FETCH_LOGO.join("\n")}
              </pre>
            )}
            <div className="min-w-0 flex-1 space-y-0.5">{shownLines.map((line, i) => renderLine(line, i, true))}</div>
          </div>
        ) : (
          <div className="space-y-0.5 pt-1">{shownLines.map((line, i) => renderLine(line, i))}</div>
        )}

        {done && (
          <div className="pt-2">
            <Prompt>
              <Cursor />
            </Prompt>
          </div>
        )}
      </div>
    </div>
  );
}

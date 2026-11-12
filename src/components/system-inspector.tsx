"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { lockPageScroll, OPEN_SHELL_EVENT, openUrl, prefersReducedMotion, scrollToSection } from "@/lib/client";
import { FETCH_LOGO, INSPECTOR_TABS, MOTD, TOTAL_SECRETS, type InspectorTabId } from "@/lib/shell/content";
import { promptFor } from "@/lib/shell/prompt";
import { addSecret, getSecrets, readEnv, saveVimRecord, useSecrets } from "@/lib/shell/secrets";
import { INITIAL_SHELL_STATE, type Effect, type Entry, type Result, type ShellState, type Signal } from "@/lib/shell/types";
import { RotateCw } from "./icons";
import { Cursor, Prompt, TerminalLine } from "./terminal/lines";

/** La vista del shell y el motor se descargan solo cuando alguien abre la pestaña. */
const Shell = dynamic(() => import("./terminal/shell").then((module) => module.Shell), {
  ssr: false,
  loading: () => <p className="p-4 text-dim sm:p-5">cargando shell…</p>,
});

let enginePromise: Promise<typeof import("@/lib/shell/engine")> | null = null;
const loadEngine = () => (enginePromise ??= import("@/lib/shell/engine"));

type TabId = InspectorTabId | "shell";

const TABS: { id: TabId; label: string }[] = [...INSPECTOR_TABS.map(({ id, label }) => ({ id, label })), { id: "shell", label: "shell" }];

const SUGGESTED = ["help", "php artisan route:list", "php artisan migrate:status", "php artisan tinker", "sl"];

const MAX_ENTRIES = 400;
const COMPLETE = Number.POSITIVE_INFINITY;

type Session = { shell: ShellState; entries: Entry[]; seq: number };

/** Sesión del shell fuera de React: los manejadores leen siempre el estado más reciente. */
function createSessionStore() {
  let session: Session = {
    shell: INITIAL_SHELL_STATE,
    entries: MOTD.map((line, id) => ({ id, line })),
    seq: MOTD.length,
  };
  const listeners = new Set<() => void>();
  return {
    get: () => session,
    set(next: Session) {
      session = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function SystemInspector() {
  const [tabId, setTabId] = useState<TabId>("status");
  const [run, setRun] = useState(0);
  // COMPLETE = salida entera (estado inicial en SSR, sin animación al cargar).
  const [typed, setTyped] = useState(COMPLETE);
  const [visible, setVisible] = useState(COMPLETE);
  const [maximized, setMaximized] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [store] = useState(createSessionStore);
  const session = useSyncExternalStore(store.subscribe, store.get, store.get);
  const secrets = useSecrets();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const tab = INSPECTOR_TABS.find((item) => item.id === tabId);
  const isShell = tabId === "shell";

  useEffect(() => {
    if (run === 0) return;
    const active = INSPECTOR_TABS.find((item) => item.id === tabId);
    if (!active) return;
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

  // La paleta de comandos (Ctrl + K) puede pedir que se abra el shell.
  useEffect(() => {
    function onOpenShell() {
      void loadEngine();
      setTabId("shell");
      dialogRef.current?.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
    }
    window.addEventListener(OPEN_SHELL_EVENT, onOpenShell);
    return () => window.removeEventListener(OPEN_SHELL_EVENT, onOpenShell);
  }, []);

  useEffect(() => () => lockPageScroll(false), []);

  function activate(id: TabId) {
    setTabId(id);
    if (id === "shell") {
      void loadEngine();
      return;
    }
    if (prefersReducedMotion()) {
      setTyped(COMPLETE);
      setVisible(COMPLETE);
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

  /* ── Ventana: el mismo <dialog> pasa de bloque en la página a modal, sin remontar nada ── */

  const isModal = () => dialogRef.current?.matches(":modal") ?? false;

  function maximize() {
    const dialog = dialogRef.current;
    if (!dialog || isModal()) return;
    dialog.close();
    dialog.showModal();
    lockPageScroll(true);
    setMaximized(true);
    if (isShell) inputRef.current?.focus({ preventScroll: true });
  }

  function restore() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialog.open) dialog.close();
    dialog.show();
    lockPageScroll(false);
    setMaximized(false);
  }

  /* ── Shell ── */

  function handleEffect(effect: Effect) {
    switch (effect.type) {
      case "secret":
        addSecret(effect.id);
        break;
      case "vim-record":
        saveVimRecord(effect.ms);
        break;
      case "navigate":
        if (isModal()) restore();
        scrollToSection(effect.section);
        break;
      case "open":
        openUrl(effect.url);
        break;
      case "exit":
        if (isModal()) restore();
        else activate("status");
        break;
      case "shake":
        setShaking(true);
        window.setTimeout(() => setShaking(false), 600);
        break;
      case "clear":
        break;
    }
  }

  function applyResult(result: Result) {
    const current = store.get();
    const cleared = result.effects.some((effect) => effect.type === "clear");
    let seq = current.seq;
    const added = cleared ? [] : result.lines.map((line) => ({ id: seq++, line }));
    store.set({
      shell: result.state,
      entries: [...(cleared ? [] : current.entries), ...added].slice(-MAX_ENTRIES),
      seq,
    });
    result.effects.forEach(handleEffect);
  }

  async function runCommand(input: string) {
    const engine = await loadEngine();
    applyResult(engine.execute(input, store.get().shell, readEnv(isModal())));
  }

  async function sendSignal(kind: Signal, pending: string) {
    const engine = await loadEngine();
    applyResult(engine.signal(kind, store.get().shell, readEnv(isModal()), pending));
  }

  async function completeInput(input: string) {
    const engine = await loadEngine();
    const current = store.get();
    const completion = engine.complete(input, current.shell);
    if (completion.candidates.length) {
      const options = completion.candidates.map((candidate) => candidate.trim().split(" ").pop()).join("  ");
      store.set({
        ...current,
        entries: [
          ...current.entries,
          { id: current.seq, line: { kind: "echo", prompt: promptFor(current.shell, getSecrets().length), text: input } },
          { id: current.seq + 1, line: { kind: "code", segments: [{ t: options, tone: "muted" }] } },
        ],
        seq: current.seq + 2,
      });
    }
    return completion.value;
  }

  function clearScreen() {
    store.set({ ...store.get(), entries: [] });
  }

  function runSuggested(command: string) {
    setTabId("shell");
    void runCommand(command);
    inputRef.current?.focus({ preventScroll: true });
  }

  const typing = tab ? typed < tab.command.length : false;
  const done = tab ? !typing && visible >= tab.lines.length : true;
  const shownLines = tab ? tab.lines.slice(0, typing ? 0 : visible) : [];
  const titlePath = isShell ? promptFor(session.shell, secrets.length).path : "~";

  return (
    <>
      <dialog
        ref={dialogRef}
        open
        role={maximized ? undefined : "group"}
        aria-label="Terminal del portafolio"
        onClose={() => {
          // Esc cierra el modal: se vuelve a mostrar como bloque en la página.
          if (dialogRef.current && !dialogRef.current.open) restore();
        }}
        onCancel={(event) => {
          if (store.get().shell.mode === "vim") event.preventDefault();
        }}
        className={`max-w-none overflow-hidden rounded-lg border bg-surface p-0 text-fg ${
          maximized
            ? "fixed inset-0 m-auto flex h-[min(46rem,calc(100dvh-2rem))] max-h-none w-[min(72rem,calc(100vw-2rem))] flex-col border-line-strong"
            : "static m-0 block w-full border-line"
        }`}
      >
        {/* Barra de título estilo GNOME: título centrado, controles a la derecha. */}
        <div className="relative flex h-9 shrink-0 items-center justify-center border-b border-line px-3">
          <p className="font-mono text-[11px] text-dim">fidel@fedora: {titlePath}</p>
          <div className="absolute right-1.5 flex items-center">
            <span className="mx-[3px] size-3 rounded-full border border-line-strong bg-surface-2" aria-hidden="true" />
            <button
              type="button"
              onClick={maximized ? restore : maximize}
              aria-label={maximized ? "Restaurar terminal" : "Maximizar terminal"}
              aria-pressed={maximized}
              title={maximized ? "Restaurar (Esc)" : "Maximizar"}
              className="group grid size-6 place-items-center rounded-full"
            >
              <span
                className={`size-3 rounded-full border transition-colors duration-150 group-hover:border-accent group-hover:bg-accent/40 ${
                  maximized ? "border-accent bg-accent/40" : "border-line-strong bg-surface-2"
                }`}
              />
            </button>
            <span className="mx-[3px] size-3 rounded-full border border-line-strong bg-surface-2" aria-hidden="true" />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-line bg-canvas-raised pr-2">
          <div role="tablist" aria-label="Inspección del perfil" className="flex">
            {TABS.map((item, index) => {
              const selected = item.id === tabId;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => activate(item.id)}
                  onPointerEnter={item.id === "shell" ? () => void loadEngine() : undefined}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  className={`relative flex h-9 items-center gap-1.5 border-r border-line px-3 font-mono text-[11px] transition-colors duration-150 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-px sm:px-4 ${
                    selected ? "bg-surface text-fg after:bg-accent" : "text-dim hover:bg-surface/60 hover:text-muted"
                  }`}
                >
                  {item.id === "shell" && <span className="size-1.5 rounded-full bg-amber" aria-hidden="true" />}
                  {item.label}
                </button>
              );
            })}
          </div>
          {isShell ? (
            <button
              type="button"
              onClick={() => void runCommand("secretos")}
              className="flex h-7 items-center gap-1.5 rounded px-2 font-mono text-[11px] text-dim transition-colors duration-150 hover:bg-surface hover:text-fg"
              aria-label={`Secretos encontrados: ${secrets.length} de ${TOTAL_SECRETS}. Ver progreso`}
            >
              <span className="hidden sm:inline">secretos</span>
              <span className={secrets.length ? "text-amber" : undefined}>
                {secrets.length}/{TOTAL_SECRETS}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => activate(tabId)}
              className="flex h-7 items-center gap-1.5 rounded px-2 font-mono text-[11px] text-dim transition-colors duration-150 hover:bg-surface hover:text-fg"
            >
              <RotateCw size={12} />
              <span className="hidden sm:inline">ejecutar</span>
              <span className="sr-only sm:hidden">Ejecutar de nuevo</span>
            </button>
          )}
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tabId}`}
          aria-busy={!done}
          className={`font-mono text-[12px] leading-6 sm:text-[12.5px] ${
            maximized ? "min-h-0 flex-1" : isShell ? "h-[23rem]" : "min-h-[23rem]"
          } ${shaking ? "motion-safe:animate-shake" : ""}`}
        >
          {isShell ? (
            <Shell
              entries={session.entries}
              shell={session.shell}
              secretsFound={secrets.length}
              inputRef={inputRef}
              onRun={(input) => void runCommand(input)}
              onSignal={(kind, pending) => void sendSignal(kind, pending)}
              onComplete={completeInput}
              onClear={clearScreen}
              onAction={handleEffect}
            />
          ) : (
            tab && (
              <div className={`space-y-1 p-4 sm:p-5 ${maximized ? "h-full overflow-y-auto" : ""}`}>
                <Prompt>
                  {tab.command.slice(0, Number.isFinite(typed) ? typed : undefined)}
                  {typing && <Cursor />}
                </Prompt>

                {tab.id === "fetch" ? (
                  <div className="flex gap-5 pt-1">
                    {shownLines.length > 0 && (
                      <pre className="hidden shrink-0 leading-[1.15] text-accent motion-safe:animate-fade-in sm:block" aria-hidden="true">
                        {FETCH_LOGO}
                      </pre>
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      {shownLines.map((line, index) => (
                        <TerminalLine key={index} line={line} fetchStyle />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0.5 pt-1">
                    {shownLines.map((line, index) => (
                      <TerminalLine key={index} line={line} />
                    ))}
                  </div>
                )}

                {done && (
                  <div className="pt-2">
                    <Prompt>
                      <Cursor />
                    </Prompt>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </dialog>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
        <span className="mr-0.5 text-accent">prueba:</span>
        {SUGGESTED.map((command) => (
          <button
            key={command}
            type="button"
            onClick={() => runSuggested(command)}
            onPointerEnter={() => void loadEngine()}
            className="rounded border border-line bg-canvas-raised px-2 py-1 text-muted transition-colors duration-150 hover:border-accent-strong hover:text-fg"
          >
            {command}
          </button>
        ))}
      </div>
      <p className="mt-2.5 font-mono text-[11px] text-dim">
        <span className="text-accent">tip:</span>{" "}
        {isShell
          ? `↑ ↓ historial · Tab autocompleta · Ctrl + L limpia · hay ${TOTAL_SECRETS} secretos escondidos.`
          : "cambia de pestaña o usa ← → para inspeccionar el perfil."}
      </p>
    </>
  );
}

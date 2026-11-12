"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { promptFor } from "@/lib/shell/prompt";
import type { Effect, Entry, ShellState, Signal, VimState } from "@/lib/shell/types";
import { PromptLabel, TerminalLine, toneClass } from "./lines";

export type ShellProps = {
  entries: Entry[];
  shell: ShellState;
  secretsFound: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onRun: (input: string) => void;
  onSignal: (kind: Signal, pending: string) => void;
  /** Devuelve el texto completado (o el mismo si no hay nada que completar). */
  onComplete: (input: string) => Promise<string>;
  onClear: () => void;
  onAction: (effect: Effect) => void;
};

const inputClass =
  "min-w-0 flex-1 bg-transparent p-0 text-[16px] text-fg caret-amber outline-none placeholder:text-dim sm:text-[1em]";

export function Shell({ entries, shell, secretsFound, inputRef, onRun, onSignal, onComplete, onClear, onAction }: ShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const inVim = shell.mode === "vim" && shell.vim !== null;

  // Al montar y al cambiar de modo el <input> es otro nodo: se recupera el foco.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [inputRef, shell.mode]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, shell.mode]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onRun(value);
    setValue("");
    setDraft("");
    setHistoryIndex(null);
  }

  function browseHistory(step: -1 | 1) {
    const { history } = shell;
    if (!history.length) return;
    const current = historyIndex ?? history.length;
    const next = Math.max(0, current + step);
    if (historyIndex === null) setDraft(value);
    if (next >= history.length) {
      setHistoryIndex(null);
      setValue(historyIndex === null ? value : draft);
    } else {
      setHistoryIndex(next);
      setValue(history[next]);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const key = event.key.toLowerCase();
    const input = event.currentTarget;

    if (event.key === "Escape" && inVim) {
      // En Vim, Esc vuelve a modo normal en vez de cerrar la ventana maximizada.
      event.preventDefault();
      event.stopPropagation();
      onSignal("escape", value);
      return;
    }
    if (event.key === "Tab" && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (!value.trim() || inVim) return; // sin texto, Tab sigue moviendo el foco
      event.preventDefault();
      void onComplete(value).then(setValue);
      return;
    }
    if (!inVim && event.key === "ArrowUp") {
      event.preventDefault();
      browseHistory(-1);
      return;
    }
    if (!inVim && event.key === "ArrowDown") {
      event.preventDefault();
      browseHistory(1);
      return;
    }
    if (!event.ctrlKey || event.metaKey || event.altKey) return;

    if (key === "l") {
      event.preventDefault();
      onClear();
    } else if (key === "c" && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
      onSignal("interrupt", value);
      setValue("");
      setHistoryIndex(null);
    } else if (key === "d" && !value) {
      event.preventDefault();
      onSignal("eof", "");
    }
  }

  function focusInput() {
    if (window.getSelection()?.isCollapsed ?? true) inputRef.current?.focus({ preventScroll: true });
  }

  const input = (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        setHistoryIndex(null);
      }}
      onKeyDown={onKeyDown}
      aria-label={inVim ? "Línea de comandos de Vim" : "Línea de comandos"}
      autoCapitalize="none"
      autoCorrect="off"
      autoComplete="off"
      spellCheck={false}
      enterKeyHint="send"
      placeholder={inVim ? "nadie sabe qué escribir aquí…" : undefined}
      className={inputClass}
    />
  );

  if (inVim && shell.vim) {
    return <VimScreen vim={shell.vim} onSubmit={submit} onFocus={focusInput} onGiveUp={() => onRun(":q!")} input={input} />;
  }

  return (
    // El clic en cualquier parte de la terminal enfoca la línea de comandos, como en una terminal real.
    <div ref={scrollRef} onClick={focusInput} className="h-full cursor-text overflow-y-auto overscroll-contain p-4 sm:p-5">
      <div role="log" aria-live="polite" aria-label="Salida de la terminal" className="space-y-0.5">
        {entries.map((entry) => (
          <TerminalLine key={entry.id} line={entry.line} onAction={onAction} />
        ))}
      </div>
      <form onSubmit={submit} className="flex items-baseline pt-0.5">
        <PromptLabel info={promptFor(shell, secretsFound)} />
        {input}
      </form>
    </div>
  );
}

function VimScreen({
  vim,
  input,
  onSubmit,
  onFocus,
  onGiveUp,
}: {
  vim: VimState;
  input: ReactNode;
  onSubmit: (event: FormEvent) => void;
  onFocus: () => void;
  onGiveUp: () => void;
}) {
  const file = vim.buffer[0]?.replace(/^# /, "") ?? "portafolio.md";
  return (
    <div onClick={onFocus} className="flex h-full cursor-text flex-col">
      <div className="min-h-0 flex-1 overflow-hidden px-4 pt-4 sm:px-5 sm:pt-5" aria-label={`Búfer de Vim: ${file}`}>
        {vim.buffer.map((line, index) => (
          <p key={index} className="min-h-[1.5em] whitespace-pre-wrap text-fg [overflow-wrap:anywhere]">
            {line}
          </p>
        ))}
        {Array.from({ length: 14 }, (_, index) => (
          <p key={index} className="text-accent-strong" aria-hidden="true">
            ~
          </p>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 bg-surface-2 px-4 text-[11px] text-fg sm:px-5">
        <span className="truncate">
          {file} <span className="text-amber">[+]</span> <span className="text-dim">[RO]</span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-dim">
          {vim.attempts >= 3 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onGiveUp();
              }}
              className="text-amber underline underline-offset-2 hover:text-amber-bright"
            >
              rendirse
            </button>
          )}
          <span>intentos: {vim.attempts}</span>
        </span>
      </div>

      <form onSubmit={onSubmit} className="shrink-0 px-4 pb-3 pt-1 sm:px-5">
        <p role="status" className={`min-h-[1.5em] [overflow-wrap:anywhere] ${vim.message ? toneClass[vim.message.tone ?? "fg"] : ""}`}>
          {vim.message?.t}
        </p>
        <div className="flex items-baseline">{input}</div>
      </form>
    </div>
  );
}

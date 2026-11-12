"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { profile, sections } from "@/data/profile";
import { copyToClipboard, openShell, scrollToSection, useModifierKey } from "@/lib/client";
import { ArrowUpRight, CornerDownLeft, Copy, Hash, Search, Terminal } from "./icons";

type PaletteContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = use(PaletteContext);
  if (!ctx) throw new Error("useCommandPalette debe usarse dentro de <CommandPaletteProvider>");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <PaletteContext value={value}>
      {children}
      <CommandPalette />
    </PaletteContext>
  );
}

type Command = {
  id: string;
  group: "Navegar" | "Acciones" | "Enlaces";
  label: string;
  hint: string;
  keywords: string;
  icon: ReactNode;
  run: () => void | Promise<void>;
  /** Mantener la paleta abierta para mostrar feedback. */
  keepOpen?: boolean;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const modifier = useModifierKey();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const baseId = useId();

  const commands = useMemo<Command[]>(
    () => [
      ...sections.map((section) => ({
        id: `nav-${section.id}`,
        group: "Navegar" as const,
        label: section.label.charAt(0).toUpperCase() + section.label.slice(1),
        hint: `cd ${section.path}`,
        keywords: `${section.id} ir seccion`,
        icon: <Hash size={15} />,
        run: () => scrollToSection(section.id),
      })),
      {
        id: "open-shell",
        group: "Acciones",
        label: "Abrir terminal",
        hint: "php artisan · secretos",
        keywords: "shell terminal consola artisan laravel juego secretos vim",
        icon: <Terminal size={15} />,
        run: () => openShell(),
      },
      {
        id: "copy-email",
        group: "Acciones",
        label: "Copiar correo",
        hint: profile.contact.email,
        keywords: "email correo mail copiar",
        icon: <Copy size={15} />,
        keepOpen: true,
        run: async () => {
          const ok = await copyToClipboard(profile.contact.email);
          setFeedback(ok ? "[OK] Correo copiado al portapapeles" : "[ERROR] No se pudo copiar");
          window.setTimeout(close, 900);
        },
      },
      {
        id: "github",
        group: "Enlaces",
        label: "GitHub",
        hint: `github.com/${profile.contact.githubUser}`,
        keywords: "github repos codigo",
        icon: <ArrowUpRight size={15} />,
        run: () => openExternal(profile.contact.github),
      },
      {
        id: "linkedin",
        group: "Enlaces",
        label: "LinkedIn",
        hint: profile.contact.linkedinHandle,
        keywords: "linkedin perfil profesional",
        icon: <ArrowUpRight size={15} />,
        run: () => openExternal(profile.contact.linkedin),
      },
      {
        id: "email",
        group: "Enlaces",
        label: "Enviar correo",
        hint: `mailto:${profile.contact.email}`,
        keywords: "email correo mail escribir",
        icon: <ArrowUpRight size={15} />,
        run: () => {
          window.location.href = `mailto:${profile.contact.email}`;
        },
      },
    ],
    [close],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return commands;
    return commands.filter((command) => normalize(`${command.label} ${command.hint} ${command.keywords}`).includes(q));
  }, [commands, query]);

  const safeIndex = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

  // Sincroniza el <dialog> nativo (foco atrapado, Esc e inert gratis) con el estado.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${safeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [safeIndex]);

  function handleClosed() {
    close();
    setQuery("");
    setActiveIndex(0);
    setFeedback(null);
  }

  async function execute(command: Command | undefined) {
    if (!command) return;
    if (!command.keepOpen) dialogRef.current?.close();
    await command.run();
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!filtered.length) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((safeIndex + 1) % filtered.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((safeIndex - 1 + filtered.length) % filtered.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(filtered.length - 1);
        break;
      case "Enter":
        event.preventDefault();
        void execute(filtered[safeIndex]);
        break;
    }
  }

  const listboxId = `${baseId}-list`;
  let lastGroup: string | null = null;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Paleta de comandos"
      onClose={handleClosed}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      className="fixed inset-x-0 top-[12vh] m-0 mx-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-lg border border-line-strong bg-surface p-0 text-fg open:animate-fade-in"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={16} className="shrink-0 text-dim" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-activedescendant={filtered[safeIndex] ? `${baseId}-${filtered[safeIndex].id}` : undefined}
          aria-autocomplete="list"
          spellCheck={false}
          autoComplete="off"
          placeholder="Escribe un comando o busca…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKeyDown}
          className="h-12 w-full bg-transparent font-mono text-sm text-fg placeholder:text-dim focus:outline-none"
        />
        <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-dim sm:block">
          esc
        </kbd>
      </div>

      <div ref={listRef} id={listboxId} role="listbox" aria-label="Comandos" className="max-h-[min(22rem,55vh)] overflow-y-auto p-2">
        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center font-mono text-xs text-dim">
            <span className="text-danger">command not found:</span> {query}
          </p>
        )}
        {filtered.map((command, index) => {
          const showGroup = command.group !== lastGroup;
          lastGroup = command.group;
          const active = index === safeIndex;
          return (
            <div key={command.id} role="presentation">
              {showGroup && (
                <p role="presentation" className="px-3 pb-1.5 pt-3 font-mono text-[11px] uppercase tracking-wider text-dim first:pt-1">
                  {command.group}
                </p>
              )}
              <div
                id={`${baseId}-${command.id}`}
                role="option"
                aria-selected={active}
                data-index={index}
                onMouseMove={() => activeIndex !== index && setActiveIndex(index)}
                onClick={() => void execute(command)}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150 ${
                  active ? "bg-surface-2 text-fg" : "text-muted"
                }`}
              >
                <span className={active ? "text-accent" : "text-dim"}>{command.icon}</span>
                <span className="font-medium">{command.label}</span>
                <span className="ml-auto truncate pl-4 font-mono text-xs text-dim">{command.hint}</span>
                <CornerDownLeft size={14} className={`shrink-0 ${active ? "text-muted" : "invisible"}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2.5 font-mono text-[11px] text-dim">
        {feedback ? (
          <span role="status" className={feedback.startsWith("[OK]") ? "text-emerald" : "text-danger"}>
            {feedback}
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <span>
              <kbd className="text-muted">↑↓</kbd> navegar
            </span>
            <span>
              <kbd className="text-muted">↵</kbd> ejecutar
            </span>
          </span>
        )}
        <span className="hidden sm:inline">
          <kbd className="text-muted">{modifier} K</kbd> alternar
        </span>
      </div>
    </dialog>
  );
}

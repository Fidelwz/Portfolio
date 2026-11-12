import { profile } from "@/data/profile";
import { ArrowUp } from "./icons";

/** Pie estilo statusline de vim/tmux. */
export function StatusLine({ year }: { year: number }) {
  return (
    <footer className="border-t border-line bg-canvas-raised">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-stretch justify-between font-mono text-[11px] min-[1442px]:border-x min-[1442px]:border-line">
        <div className="flex items-stretch">
          <span className="flex items-center bg-accent px-3 py-2 font-semibold text-canvas">NORMAL</span>
          <span className="flex items-center border-r border-line px-3 text-muted">⎇ main</span>
          <span className="hidden items-center px-3 text-dim sm:flex">~/fidel/portafolio</span>
        </div>
        <div className="flex items-stretch">
          <span className="hidden items-center border-l border-line px-3 text-dim md:flex">utf-8</span>
          <span className="hidden items-center border-l border-line px-3 text-dim md:flex">next.js · tailwind</span>
          <span className="flex items-center border-l border-line px-3 text-muted">
            © {year} {profile.name}
          </span>
          <a
            href="#inicio"
            className="flex items-center gap-1.5 border-l border-line px-3 text-muted transition-colors duration-150 hover:bg-surface hover:text-fg"
          >
            <ArrowUp size={12} />
            <span className="hidden sm:inline">inicio</span>
            <span className="sr-only sm:hidden">Volver al inicio</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

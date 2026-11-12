"use client";

import { useEffect, useState } from "react";
import { profile, sections, type SectionId } from "@/data/profile";
import { useClock, useModifierKey } from "@/lib/client";
import { useCommandPalette } from "./command-palette";
import { Menu, PromptMark, Search } from "./icons";

function useActiveSection() {
  const [active, setActive] = useState<SectionId>("inicio");

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    // Una franja fina a ~35% del viewport decide qué sección está "montada".
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId);
        }
      },
      { rootMargin: "-35% 0px -64% 0px" },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return active;
}

export function TopBar() {
  const active = useActiveSection();
  const clock = useClock();
  const modifier = useModifierKey();
  const { open } = useCommandPalette();
  const path = sections.find((section) => section.id === active)?.path ?? "~/fidel";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1440px] items-center gap-4 px-4 sm:px-6 min-[1442px]:border-x min-[1442px]:border-line">
        <a
          href="#inicio"
          className="group flex min-w-0 items-center gap-2.5 font-mono text-[13px]"
          aria-label={`${profile.name}, volver al inicio`}
        >
          <PromptMark className="size-5 shrink-0" />
          <span className="flex min-w-0 items-baseline">
            <span className="text-fg">fidel</span>
            <span className="text-dim">@</span>
            <span className="text-accent">fedora</span>
            <span className="text-dim">:</span>
            <span key={path} className="truncate text-muted motion-safe:animate-fade-in">
              {path}
            </span>
            <span className="ml-0.5 hidden text-dim sm:inline">$</span>
          </span>
        </a>

        <nav aria-label="Secciones" className="ml-auto hidden lg:block">
          <ul className="flex items-center font-mono text-[13px]">
            {sections.map((section) => {
              const isActive = section.id === active;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? "location" : undefined}
                    className={`relative flex h-12 items-center px-3 transition-colors duration-150 after:absolute after:inset-x-3 after:bottom-[-1px] after:h-px after:transition-colors after:duration-150 ${
                      isActive
                        ? "text-fg after:bg-accent"
                        : "text-muted after:bg-transparent hover:text-fg"
                    }`}
                  >
                    {section.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-2">
          {profile.availability.open && (
            <span className="hidden items-center gap-2 rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted md:flex">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full rounded-full bg-emerald opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald" />
              </span>
              {profile.availability.label.toLowerCase()}
            </span>
          )}

          <time
            className="hidden min-w-[9.5rem] text-right font-mono text-[11px] tabular-nums text-dim xl:block"
            title="Hora local en El Salvador"
            suppressHydrationWarning
          >
            {clock ? `SV ${clock}` : "SV --:--"}
          </time>

          <button
            type="button"
            onClick={open}
            className="flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2.5 font-mono text-[11px] text-muted transition-colors duration-150 hover:border-line-strong hover:text-fg"
            aria-label="Abrir paleta de comandos"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <Search size={14} className="hidden sm:block" />
            <Menu size={15} className="sm:hidden" />
            <span className="hidden sm:inline">Buscar</span>
            <kbd className="hidden rounded border border-line-strong px-1 text-[10px] leading-4 text-dim sm:inline">
              {modifier} K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
}

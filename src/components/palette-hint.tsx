"use client";

import { useModifierKey } from "@/lib/client";
import { useCommandPalette } from "./command-palette";

export function PaletteHint() {
  const { open } = useCommandPalette();
  const modifier = useModifierKey();
  return (
    <button
      type="button"
      onClick={open}
      className="hidden items-center gap-2 font-mono text-xs text-dim transition-colors duration-150 hover:text-muted sm:inline-flex"
    >
      o presiona
      <kbd className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-[11px] text-muted">{modifier}</kbd>
      <kbd className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-[11px] text-muted">K</kbd>
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { copyToClipboard } from "@/lib/client";
import { Check, Copy } from "./icons";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => setCopied(await copyToClipboard(value))}
      className={`relative z-10 inline-flex h-7 shrink-0 items-center gap-1.5 rounded border px-2 font-mono text-[11px] transition-colors duration-150 ${
        copied ? "border-emerald/50 text-emerald" : "border-line text-dim hover:border-line-strong hover:text-fg"
      }`}
      aria-label={copied ? "Copiado" : label}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span aria-live="polite">{copied ? "copiado" : "copiar"}</span>
    </button>
  );
}

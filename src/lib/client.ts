"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** "⌘" en macOS/iOS, "Ctrl" en el resto. En servidor asume "Ctrl". */
export function useModifierKey() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", id === "inicio" ? window.location.pathname : `#${id}`);
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback para contextos sin Clipboard API (http, permisos denegados).
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/** Hora local de El Salvador, refrescada cada 15 s. `null` durante SSR. */
const clockFormatter = new Intl.DateTimeFormat("es-SV", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/El_Salvador",
});

function subscribeClock(callback: () => void) {
  const id = window.setInterval(callback, 15_000);
  return () => window.clearInterval(id);
}

export function useClock() {
  return useSyncExternalStore(
    subscribeClock,
    () => clockFormatter.format(new Date()).replace(/\./g, "").replace(",", ""),
    () => null,
  );
}

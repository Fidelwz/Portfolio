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

/** Bloquea el scroll de la página mientras hay una ventana modal abierta. */
export function lockPageScroll(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

/** Abre un enlace externo en otra pestaña; los `mailto:` en la misma. */
export function openUrl(url: string) {
  if (url.startsWith("mailto:")) window.location.href = url;
  else window.open(url, "_blank", "noopener,noreferrer");
}

export const OPEN_SHELL_EVENT = "portfolio:open-shell";

/** Pide a la terminal del inicio que muestre el shell y enfoque la línea de comandos. */
export function openShell() {
  window.dispatchEvent(new CustomEvent(OPEN_SHELL_EVENT));
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

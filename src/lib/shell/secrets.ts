"use client";

import { useSyncExternalStore } from "react";
import { SECRETS } from "./content";
import type { Env, SecretId } from "./types";

/**
 * Progreso del minijuego, guardado en localStorage.
 * Se expone como almacén externo para leerlo sin efectos ni desajustes de hidratación.
 */

const SECRETS_KEY = "shell:secrets";
const VIM_KEY = "shell:vim-record";
const EMPTY: readonly SecretId[] = [];

const validIds = new Set<string>(SECRETS.map((secret) => secret.id));
const listeners = new Set<() => void>();

/** Respaldo en memoria por si localStorage está bloqueado. */
const memory: { secrets: string | null; vim: string | null } = { secrets: null, vim: null };

let cachedRaw: string | null | undefined;
let cachedSecrets: readonly SecretId[] = EMPTY;

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Almacenamiento bloqueado: el progreso vive solo en memoria.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getSecrets(): readonly SecretId[] {
  const raw = read(SECRETS_KEY) ?? memory.secrets;
  if (raw === cachedRaw) return cachedSecrets;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedSecrets = Array.isArray(parsed) ? (parsed.filter((id) => validIds.has(String(id))) as SecretId[]) : EMPTY;
  } catch {
    cachedSecrets = EMPTY;
  }
  return cachedSecrets;
}

export function addSecret(id: SecretId) {
  const current = getSecrets();
  if (current.includes(id)) return;
  memory.secrets = JSON.stringify([...current, id]);
  write(SECRETS_KEY, memory.secrets);
}

export function getVimRecord(): number | null {
  const raw = read(VIM_KEY) ?? memory.vim;
  const value = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function saveVimRecord(ms: number) {
  const current = getVimRecord();
  if (current !== null && current <= ms) return;
  memory.vim = String(ms);
  write(VIM_KEY, memory.vim);
}

/** Entorno para el motor. Lee reloj y almacenamiento: solo se llama desde eventos. */
export function readEnv(maximized: boolean): Env {
  return { now: Date.now(), secrets: getSecrets(), vimRecord: getVimRecord(), maximized };
}

export function useSecrets() {
  return useSyncExternalStore(subscribe, getSecrets, () => EMPTY);
}

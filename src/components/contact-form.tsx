"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CornerDownLeft } from "./icons";

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || "TU_ACCESS_KEY_AQUI";
const KEY_CONFIGURED = ACCESS_KEY !== "TU_ACCESS_KEY_AQUI";

type FieldName = "name" | "email" | "subject" | "message";
type Tone = "muted" | "info" | "ok" | "warn" | "error";
type LogLine = { id: number; time: string | null; tag: string; text: string; tone: Tone };

const toneClass: Record<Tone, string> = {
  muted: "text-dim",
  info: "text-amber",
  ok: "text-emerald",
  warn: "text-amber",
  error: "text-danger",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: Record<FieldName, string>) {
  const errors: Partial<Record<FieldName, string>> = {};
  if (values.name.trim().length < 2) errors.name = "Escribe tu nombre (mínimo 2 caracteres).";
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Introduce un correo válido.";
  if (values.subject.trim().length < 3) errors.subject = "Añade un asunto (mínimo 3 caracteres).";
  if (values.message.trim().length < 10) errors.message = "El mensaje debe tener al menos 10 caracteres.";
  return errors;
}

function timestamp() {
  return new Date().toLocaleTimeString("es-SV", { hour12: false });
}

const initialLog: LogLine[] = [
  KEY_CONFIGURED
    ? { id: 0, time: null, tag: "[READY]", text: "Formulario listo · destino api.web3forms.com", tone: "muted" }
    : {
        id: 0,
        time: null,
        tag: "[WARN]",
        text: "NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY no configurada; usando TU_ACCESS_KEY_AQUI",
        tone: "warn",
      },
];

export function ContactForm() {
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [log, setLog] = useState<LogLine[]>(initialLog);
  const baseId = useId();

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  function push(tag: string, text: string, tone: Tone) {
    const line = { id: nextId.current++, time: timestamp(), tag, text, tone };
    setLog((current) => [...current.slice(-30), line]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    const found = validate(values);
    setErrors(found);
    const invalid = Object.keys(found) as FieldName[];
    if (invalid.length) {
      invalid.forEach((field) => push("[INVALID]", `--${field}: ${found[field]}`, "error"));
      form.querySelector<HTMLElement>(`[name="${invalid[0]}"]`)?.focus();
      return;
    }

    if (!KEY_CONFIGURED) {
      push("[ERROR]", "Fallo en el envío: configura NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY en .env.local", "error");
      return;
    }

    setSending(true);
    push("[SENDING...]", `POST ${WEB3FORMS_ENDPOINT}`, "info");

    // Igual que el ejemplo oficial: Object.fromEntries(FormData). El honeypot `botcheck`
    // solo viaja si un bot lo marca, y Web3Forms descarta ese envío.
    const payload = {
      ...Object.fromEntries(data),
      access_key: ACCESS_KEY,
      from_name: "Portafolio · Fidel Contreras",
    };

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
      const result = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string };

      if (response.ok && result.success) {
        push(`[${response.status} OK]`, "Mensaje entregado correctamente", "ok");
        form.reset();
        setErrors({});
      } else {
        push("[ERROR]", `Fallo en el envío · ${response.status}${result.message ? ` ${result.message}` : ""}`, "error");
      }
    } catch (error) {
      const reason = (error as Error).name === "TimeoutError" ? "tiempo de espera agotado" : "sin conexión con el servidor";
      push("[ERROR]", `Fallo en el envío · ${reason}`, "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col">
      <form onSubmit={onSubmit} noValidate className="space-y-5" aria-describedby={`${baseId}-log`}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={`${baseId}-name`} name="name" flag="--name" label="nombre" error={errors.name}>
            <input
              id={`${baseId}-name`}
              name="name"
              type="text"
              autoComplete="name"
              maxLength={100}
              required
              placeholder="Tu nombre"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${baseId}-name-error` : undefined}
              className={inputClass}
            />
          </Field>
          <Field id={`${baseId}-email`} name="email" flag="--email" label="correo" error={errors.email}>
            <input
              id={`${baseId}-email`}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={150}
              required
              placeholder="tu@correo.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${baseId}-email-error` : undefined}
              className={inputClass}
            />
          </Field>
        </div>
        <Field id={`${baseId}-subject`} name="subject" flag="--subject" label="asunto" error={errors.subject}>
          <input
            id={`${baseId}-subject`}
            name="subject"
            type="text"
            maxLength={150}
            required
            placeholder="Propuesta de proyecto, vacante, colaboración…"
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? `${baseId}-subject-error` : undefined}
            className={inputClass}
          />
        </Field>
        <Field id={`${baseId}-message`} name="message" flag="--message" label="mensaje" error={errors.message}>
          <textarea
            id={`${baseId}-message`}
            name="message"
            rows={6}
            maxLength={5000}
            required
            placeholder="Cuéntame en qué puedo ayudarte."
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? `${baseId}-message-error` : undefined}
            className={`${inputClass} min-h-36 resize-y leading-relaxed`}
          />
        </Field>

        {/* Honeypot anti-spam de Web3Forms: invisible para personas y lectores de pantalla. */}
        <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" style={{ display: "none" }} />

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={sending}
            aria-busy={sending}
            className="inline-flex h-11 items-center gap-2.5 rounded-md bg-amber px-5 text-sm font-semibold text-canvas transition-colors duration-150 hover:bg-amber-bright disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-amber"
          >
            {sending ? (
              <>
                <span className="size-3.5 rounded-full border-2 border-canvas/30 border-t-canvas motion-safe:animate-spin" aria-hidden="true" />
                Enviando…
              </>
            ) : (
              <>
                Enviar mensaje
                <CornerDownLeft size={15} />
              </>
            )}
          </button>
          <p className="font-mono text-[11px] text-dim">vía Web3Forms · sin rastreo</p>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-md border border-line bg-canvas-raised">
        <div className="flex items-center justify-between border-b border-line px-4 py-2 font-mono text-[11px] text-dim">
          <span>stdout — contact.sh</span>
          <button
            type="button"
            onClick={() => setLog([])}
            className="rounded px-1.5 py-0.5 transition-colors duration-150 hover:bg-surface hover:text-muted"
          >
            limpiar
          </button>
        </div>
        <div
          ref={logRef}
          id={`${baseId}-log`}
          role="log"
          aria-live="polite"
          aria-label="Registro de envío"
          className="max-h-44 min-h-24 space-y-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed"
        >
          {log.length === 0 && <p className="text-dim">$ _</p>}
          {log.map((line) => (
            <p key={line.id} className="[overflow-wrap:anywhere] motion-safe:animate-fade-in">
              {line.time && <span className="text-dim">{line.time} </span>}
              <span className={toneClass[line.tone]}>{line.tag}</span>{" "}
              <span className={line.tone === "ok" ? "text-emerald" : line.tone === "error" ? "text-danger" : "text-muted"}>
                {line.text}
              </span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-canvas-raised px-3.5 py-2.5 font-mono text-sm text-fg placeholder:text-dim transition-colors duration-150 hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent aria-[invalid=true]:border-danger/70 aria-[invalid=true]:focus:ring-danger/60";

function Field({
  id,
  name,
  flag,
  label,
  error,
  children,
}: {
  id: string;
  name: FieldName;
  flag: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div data-field={name}>
      <label htmlFor={id} className="mb-2 flex items-baseline gap-2 font-mono text-xs">
        <span className="text-accent">{flag}</span>
        <span className="text-dim">{label}</span>
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 font-mono text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

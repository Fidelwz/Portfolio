"use client";

import { useEffect, useState } from "react";
import { GITHUB_REPOS_ENDPOINT, GITHUB_USER, languageColor, type Repo } from "@/lib/github";
import { formatAbsolute, formatRelative } from "@/lib/time";
import { ArrowUpRight, RotateCw } from "./icons";

type FeedState =
  | { status: "loading" }
  | { status: "success"; repos: Repo[]; ms: number | null; fetchedAt: number; cached: boolean }
  | { status: "error"; code: number | null; message: string };

const CACHE_KEY = "gh-repos:v1";
const CACHE_TTL = 10 * 60 * 1000;

class FeedError extends Error {
  constructor(
    message: string,
    public code: number | null,
  ) {
    super(message);
  }
}

function readCache(): { at: number; repos: Repo[] } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; repos: Repo[] };
    return Date.now() - parsed.at < CACHE_TTL ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(repos: Repo[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos }));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota): se ignora.
  }
}

async function fetchRepos(signal: AbortSignal): Promise<Repo[]> {
  let response: Response;
  try {
    response = await fetch(GITHUB_REPOS_ENDPOINT, {
      signal,
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new FeedError("No se pudo conectar con api.github.com", null);
  }

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    if ((response.status === 403 || response.status === 429) && remaining === "0") {
      const at = reset
        ? new Intl.DateTimeFormat("es-SV", { hour: "2-digit", minute: "2-digit" }).format(new Date(reset * 1000))
        : null;
      throw new FeedError(
        `Límite de peticiones de la API de GitHub alcanzado${at ? `; se restablece a las ${at}` : ""}`,
        response.status,
      );
    }
    if (response.status === 404) throw new FeedError(`Usuario ${GITHUB_USER} no encontrado`, 404);
    throw new FeedError(`Respuesta inesperada de GitHub (${response.statusText || "sin detalle"})`, response.status);
  }

  return (await response.json()) as Repo[];
}

export function GitHubFeed() {
  const [state, setState] = useState<FeedState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      const cached = attempt === 0 ? readCache() : null;
      if (cached) {
        setState({ status: "success", repos: cached.repos, ms: null, fetchedAt: Date.now(), cached: true });
        return;
      }
      const started = performance.now();
      try {
        const repos = await fetchRepos(controller.signal);
        writeCache(repos);
        setState({
          status: "success",
          repos,
          ms: Math.round(performance.now() - started),
          fetchedAt: Date.now(),
          cached: false,
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        const feedError = error instanceof FeedError ? error : new FeedError("Error desconocido", null);
        setState({ status: "error", code: feedError.code, message: feedError.message });
      }
    }

    void load();
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-4 font-mono text-xs sm:px-8">
        <p className="min-w-0 truncate text-muted" title={`curl -s ${GITHUB_REPOS_ENDPOINT}`}>
          <span className="select-none text-emerald">$ </span>
          curl -s api.github.com/users/{GITHUB_USER}/repos?sort=updated&amp;per_page=6
        </p>
        <p role="status" aria-live="polite" className="shrink-0">
          {state.status === "loading" && <span className="text-amber motion-safe:animate-pulse">[FETCHING…]</span>}
          {state.status === "success" && (
            <span className="text-emerald">
              [200 OK] <span className="text-dim">{state.repos.length} repos</span>
              {state.ms !== null && <span className="text-dim"> · {state.ms} ms</span>}
              {state.cached && <span className="text-dim"> · caché</span>}
            </span>
          )}
          {state.status === "error" && <span className="text-danger">[ERROR{state.code ? ` ${state.code}` : ""}]</span>}
        </p>
      </div>

      {state.status === "loading" && <SkeletonGrid />}

      {state.status === "error" && (
        <div className="px-5 py-12 sm:px-8">
          <div className="max-w-xl rounded-md border border-danger/30 bg-danger/[0.06] p-5 font-mono text-xs">
            <p className="text-danger">[ERROR] {state.message}</p>
            <p className="mt-2 text-muted">El feed en vivo no está disponible en este momento. Los repositorios siguen accesibles en GitHub.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={retry}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-3 text-fg transition-colors duration-150 hover:border-accent hover:text-accent"
              >
                <RotateCw size={13} /> Reintentar
              </button>
              <a
                href={`https://github.com/${GITHUB_USER}?tab=repositories`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-accent transition-colors duration-150 hover:bg-surface"
              >
                Abrir en GitHub <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>
      )}

      {state.status === "success" &&
        (state.repos.length === 0 ? (
          <p className="px-5 py-12 font-mono text-xs text-dim sm:px-8">No hay repositorios públicos todavía.</p>
        ) : (
          <ul className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
            {state.repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} now={state.fetchedAt} />
            ))}
          </ul>
        ))}

      <div className="flex justify-end border-t border-line px-5 py-4 sm:px-8">
        <a
          href={`https://github.com/${GITHUB_USER}?tab=repositories`}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 font-mono text-xs text-muted transition-colors duration-150 hover:text-accent"
        >
          Ver todos los repositorios en github.com/{GITHUB_USER}
          <ArrowUpRight size={13} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}

function RepoCard({ repo, now }: { repo: Repo; now: number }) {
  return (
    <li className="group relative flex min-h-[13.5rem] flex-col bg-canvas p-6 transition-colors duration-150 hover:bg-surface motion-safe:animate-fade-in sm:p-7">
      <div className="flex items-center justify-between font-mono text-[11px] text-dim">
        <span>
          pkg <span className="text-line-strong">·</span> {GITHUB_USER.toLowerCase()}/
        </span>
        <ArrowUpRight
          size={15}
          className="transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </div>

      <h3 className="mt-3 font-mono text-base font-medium text-fg [overflow-wrap:anywhere]">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
        >
          {repo.name}
        </a>
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
        {repo.description ?? <span className="text-dim">Sin descripción en el repositorio.</span>}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-6 font-mono text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: languageColor(repo.language) }} aria-hidden="true" />
          {repo.language ?? "sin lenguaje"}
        </span>
        {repo.stargazers_count > 0 && <span aria-label={`${repo.stargazers_count} estrellas`}>★ {repo.stargazers_count}</span>}
        <time dateTime={repo.updated_at} title={formatAbsolute(repo.updated_at)} className="text-dim">
          act. {formatRelative(repo.updated_at, now)}
        </time>
        {repo.homepage && (
          <a
            href={repo.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 ml-auto text-accent underline-offset-4 hover:underline"
          >
            demo ↗
          </a>
        )}
      </div>
    </li>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex min-h-[13.5rem] flex-col bg-canvas p-6 sm:p-7">
          <span className="h-2.5 w-24 rounded-sm bg-surface-2 motion-safe:animate-pulse" />
          <span className="mt-4 h-4 w-40 rounded-sm bg-surface-2 motion-safe:animate-pulse" />
          <span className="mt-4 h-2.5 w-full rounded-sm bg-surface motion-safe:animate-pulse" />
          <span className="mt-2 h-2.5 w-3/4 rounded-sm bg-surface motion-safe:animate-pulse" />
          <span className="mt-auto flex gap-4 pt-6">
            <span className="h-2.5 w-16 rounded-sm bg-surface-2 motion-safe:animate-pulse" />
            <span className="h-2.5 w-24 rounded-sm bg-surface-2 motion-safe:animate-pulse" />
          </span>
        </li>
      ))}
    </ul>
  );
}

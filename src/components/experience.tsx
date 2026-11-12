import { education, experience, type ChangeType, type Experience as Job } from "@/data/profile";
import { formatMonths, formatYearMonth, monthsBetween, totalExperienceMonths } from "@/lib/time";
import { MetaList, Section } from "./section";

const changeTone: Record<ChangeType, string> = {
  feat: "text-emerald",
  chore: "text-muted",
  agile: "text-accent",
  deploy: "text-amber",
};

/** Hash corto determinista (FNV-1a) para el motivo visual de `git log`. */
function shortHash(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

function Badge({ children }: { children: string }) {
  return (
    <li className="rounded border border-accent-strong/40 bg-accent-strong/10 px-2 py-0.5 font-mono text-[11px] text-accent">
      {children}
    </li>
  );
}

function ArchitecturePanel({ job }: { job: Job }) {
  return (
    <figure className="rounded-md border border-line bg-surface">
      <figcaption className="flex items-center justify-between border-b border-line px-4 py-2 font-mono text-[11px] text-dim">
        <span>arquitectura</span>
        <span className="text-line-strong">{job.architecture.length} capas</span>
      </figcaption>
      <ol className="px-4 py-3">
        {job.architecture.map((layer, index) => (
          <li key={layer.layer} className="relative grid grid-cols-[4.75rem_1fr] items-center gap-3 py-1.5 font-mono text-xs">
            <span className="text-dim">{layer.layer}</span>
            <span className="flex items-center gap-2 text-fg">
              <span
                className={`relative z-10 size-2 shrink-0 rounded-[2px] border ${
                  index === 0 ? "border-accent bg-accent/20" : "border-line-strong bg-surface-2"
                }`}
                aria-hidden="true"
              />
              {layer.tech}
            </span>
            {index < job.architecture.length - 1 && (
              <span
                className="absolute left-[calc(4.75rem+0.75rem+3.5px)] top-[calc(50%+5px)] h-[calc(100%-6px)] w-px bg-line-strong"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </figure>
  );
}

function Commit({ job, now, isHead }: { job: Job; now: Date; isHead: boolean }) {
  const months = monthsBetween(job.start, job.end, now);
  const period = `${formatYearMonth(job.start)} — ${job.end ? formatYearMonth(job.end) : "actualidad"}`;

  return (
    <li className="group/commit relative grid grid-cols-[2.25rem_1fr] sm:grid-cols-[3.25rem_1fr]">
      {/* Carril del grafo */}
      <div className="relative" aria-hidden="true">
        <span
          className={`absolute left-1/2 w-px -translate-x-1/2 bg-line-strong ${isHead ? "top-[2.6rem] bottom-0 sm:top-[3.35rem]" : "inset-y-0"}`}
        />
        <span
          className={`absolute left-1/2 top-[2.2rem] size-3 -translate-x-1/2 rounded-full sm:top-[2.95rem] ${
            isHead ? "bg-amber ring-4 ring-amber/15" : "border-2 border-accent bg-canvas"
          }`}
        />
      </div>

      <article className="min-w-0 border-b border-line py-8 pr-5 group-last/commit:border-b-0 sm:py-10 sm:pr-8">
        <header>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs">
            <span className="text-amber">commit {shortHash(`${job.company}${job.start}`)}</span>
            {isHead ? (
              <span className="text-dim">
                (<span className="text-accent">HEAD</span> → <span className="text-emerald">main</span>,{" "}
                <span className="text-amber">tag: actual</span>)
              </span>
            ) : (
              <span className="text-dim">
                (<span className="text-muted">tag: {job.id}</span>)
              </span>
            )}
          </p>
          <div className="mt-4 flex flex-col gap-x-6 gap-y-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{job.role}</h3>
              <p className="mt-1 text-[15px] text-muted">
                <span className="text-fg">{job.company}</span>
                <span className="mx-2 text-line-strong">/</span>
                {job.location}
              </p>
            </div>
            <p className="shrink-0 font-mono text-xs text-muted sm:pt-1.5 sm:text-right">
              <span className="block">{period}</span>
              <span className={`mt-1 block ${isHead ? "text-emerald" : "text-dim"}`}>{formatMonths(months)}</span>
            </p>
          </div>
        </header>

        <div className="mt-7 grid gap-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0">
            <p className="text-[15px] leading-relaxed text-muted">{job.summary}</p>
            <ul className="mt-5 space-y-3">
              {job.changes.map((change) => (
                <li
                  key={change.text}
                  className={`rounded-md border px-4 py-3 transition-colors duration-150 ${
                    change.key
                      ? "border-amber/35 bg-amber/[0.06] hover:border-amber/60"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <p className="font-mono text-[11px]">
                    <span className={changeTone[change.type]}>{change.type}</span>
                    {change.scope && <span className="text-dim">({change.scope})</span>}
                    <span className="text-dim">:</span>
                    {change.key && <span className="ml-2 text-amber">★ logro clave</span>}
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-fg">{change.text}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <ArchitecturePanel job={job} />
            <div>
              <p className="font-mono text-[11px] text-dim">stack</p>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Stack en ${job.company}`}>
                {job.stack.map((tech) => (
                  <Badge key={tech}>{tech}</Badge>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

function EducationLog() {
  return (
    <div className="border-t border-line">
      <p className="border-b border-line px-5 py-4 font-mono text-xs text-muted sm:px-8">
        <span className="select-none text-emerald">$ </span>git log --oneline education
      </p>
      <ol className="grid gap-px bg-line md:grid-cols-2">
        {education.map((item) => (
          <li key={item.id} className="bg-canvas px-5 py-6 transition-colors duration-150 hover:bg-canvas-raised sm:px-8">
            <p className="font-mono text-[11px]">
              <span className="text-amber">{shortHash(item.institution)}</span>{" "}
              {item.status === "en-curso" ? (
                <span className="text-dim">
                  (<span className="text-emerald">branch: en-curso</span>)
                </span>
              ) : (
                <span className="text-dim">
                  (<span className="text-muted">tag: graduado</span>)
                </span>
              )}
            </p>
            <h3 className="mt-3 font-medium text-fg">{item.degree}</h3>
            <p className="mt-1 text-sm text-muted">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-accent hover:decoration-accent"
                >
                  {item.institution}
                </a>
              ) : (
                item.institution
              )}
            </p>
            <p className="mt-3 font-mono text-xs text-dim">{item.period}</p>
            {item.notes.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {item.notes.map((note) => (
                  <li key={note} className="before:mr-2 before:font-mono before:text-dim before:content-['+']">
                    {note}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Experience({ now }: { now: Date }) {
  const total = totalExperienceMonths(experience, now);
  const current = experience.find((job) => job.end === null);
  const first = experience.reduce((a, b) => (a.start < b.start ? a : b));

  return (
    <Section
      id="experiencia"
      index="01"
      path="~/fidel/experiencia"
      title="Experiencia profesional"
      command="git log --graph --decorate career"
      description="Registro de roles en formato de commits: qué se construyó, con qué arquitectura y con qué stack."
      aside={
        <MetaList
          items={[
            { label: "acumulada", value: <span className="text-amber">{formatMonths(total)}</span> },
            { label: "roles", value: experience.length },
            ...(current ? [{ label: "actual", value: current.company }] : []),
            { label: "desde", value: formatYearMonth(first.start) },
          ]}
        />
      }
    >
      <ol aria-label="Historial laboral" className="pl-1 sm:pl-2">
        {experience.map((job, index) => (
          <Commit key={job.id} job={job} now={now} isHead={index === 0 && job.end === null} />
        ))}
      </ol>
      <EducationLog />
    </Section>
  );
}

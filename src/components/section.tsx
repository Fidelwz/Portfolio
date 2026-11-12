import type { ReactNode } from "react";

type SectionProps = {
  id: string;
  index: string;
  path: string;
  title: string;
  command: string;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
};

/**
 * Sección con retícula suiza: columna de metadatos (3/12, fija al hacer scroll)
 * y contenido (9/12), separadas por un borde de 1px.
 */
export function Section({ id, index, path, title, command, description, aside, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-b border-line">
      <div className="grid lg:grid-cols-12">
        <header className="border-b border-line px-5 py-8 sm:px-8 lg:col-span-3 lg:border-b-0 lg:border-r lg:py-14">
          <div className="lg:sticky lg:top-20">
            <p className="font-mono text-xs text-dim">
              <span className="text-accent">{index}</span>
              <span className="mx-2 text-line-strong">/</span>
              {path}
            </p>
            <h2 id={`${id}-title`} className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-[1.75rem]">
              {title}
            </h2>
            <p className="mt-3 font-mono text-xs leading-relaxed text-muted [overflow-wrap:anywhere]">
              <span className="select-none text-emerald">$ </span>
              {command}
            </p>
            {description && <div className="mt-5 max-w-sm text-sm leading-relaxed text-muted">{description}</div>}
            {aside}
          </div>
        </header>
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </section>
  );
}

/** Lista clave/valor monoespaciada para la columna lateral. */
export function MetaList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="mt-8 divide-y divide-line border-y border-line font-mono text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-dim">{item.label}</dt>
          <dd className="text-right text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

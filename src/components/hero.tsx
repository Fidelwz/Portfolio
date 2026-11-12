import { experience, profile } from "@/data/profile";
import { formatMonths, totalExperienceMonths } from "@/lib/time";
import { ArrowDown } from "./icons";
import { PaletteHint } from "./palette-hint";
import { SystemInspector } from "./system-inspector";

export function Hero({ now }: { now: Date }) {
  const current = experience.find((job) => job.end === null) ?? experience[0];
  const total = formatMonths(totalExperienceMonths(experience, now));

  const meta = [
    { label: "rol actual", value: `${current.company}` },
    { label: "experiencia", value: total, tone: "text-amber" },
    { label: "ubicación", value: profile.location.short },
    { label: "formación", value: "Ing. Desarrollo de Software · UFG" },
  ];

  return (
    <section id="inicio" aria-labelledby="inicio-title" className="border-b border-line">
      <div className="grid lg:grid-cols-12">
        <div className="flex flex-col px-5 pb-12 pt-10 sm:px-8 sm:pt-14 lg:col-span-7 lg:border-r lg:border-line lg:pb-16 lg:pt-20 xl:pr-16">
          <p className="font-mono text-xs text-dim">
            ~/fidel <span className="mx-1.5 text-line-strong">·</span>
            <span className="text-emerald">$</span> whoami
          </p>

          <h1
            id="inicio-title"
            className="mt-6 text-[clamp(2.75rem,8vw,5.25rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-fg"
          >
            Fidel
            <br />
            Contreras<span className="text-amber">.</span>
          </h1>

          <p className="mt-6 font-mono text-[13px] text-muted">
            {profile.role}
            <span className="mx-2 text-dim">{"//"}</span>
            <span className="text-accent">{profile.focus.join(" · ")}</span>
          </p>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-fg sm:text-xl sm:leading-relaxed">
            Desarrollo e integro funcionalidades en sistemas internos con Laravel, Livewire y MySQL. En{" "}
            {current.company} integré la pasarela de pagos <span className="text-amber">Wompi</span> en una plataforma
            existente.
          </p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            Proactivo, organizado y orientado al trabajo en equipo con Scrum. Formación técnica en desarrollo de software
            y actualmente cursando la ingeniería en la Universidad Francisco Gavidia.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#experiencia"
              className="group inline-flex h-11 items-center gap-2 rounded-md bg-amber px-5 text-sm font-semibold text-canvas transition-colors duration-150 hover:bg-amber-bright"
            >
              Ver experiencia
              <ArrowDown size={15} className="transition-transform duration-200 group-hover:translate-y-0.5" />
            </a>
            <span className="ml-1">
              <PaletteHint />
            </span>
          </div>

          <div className="min-h-12 flex-1" aria-hidden="true" />

          <dl className="grid grid-cols-2 border-y border-line font-mono text-xs xl:grid-cols-4">
            {meta.map((item, index) => (
              <div
                key={item.label}
                className={`py-4 pr-4 ${index % 2 === 1 ? "border-l border-line pl-4" : ""} ${
                  index > 1 ? "border-t border-line xl:border-t-0" : ""
                } ${index === 2 ? "xl:border-l xl:pl-4" : ""}`}
              >
                <dt className="text-dim">{item.label}</dt>
                <dd className={`mt-1.5 text-[13px] leading-snug ${item.tone ?? "text-fg"}`}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-dots flex items-center border-t border-line px-5 py-10 sm:px-8 lg:col-span-5 lg:border-t-0 lg:py-16">
          <div className="w-full">
            <SystemInspector />
            <p className="mt-3 font-mono text-[11px] text-dim">
              <span className="text-accent">tip:</span> cambia de pestaña o usa ← → para inspeccionar el perfil.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

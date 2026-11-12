import { skillGroups, type SkillGroup } from "@/data/profile";
import { Section } from "./section";

const spanClass: Record<NonNullable<SkillGroup["span"]> | "default", string> = {
  default: "xl:col-span-2",
  wide: "md:col-span-2 xl:col-span-4",
  "xl-wide": "xl:col-span-4",
};

function FlowNode({ label, tech, accent = false }: { label: string; tech: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-md border bg-surface px-4 py-3 transition-colors duration-150 hover:border-line-strong ${
        accent ? "border-accent-strong/60" : "border-line"
      }`}
    >
      <p className="font-mono text-[11px] text-dim">{label}</p>
      <p className={`mt-1 font-mono text-sm ${accent ? "text-accent" : "text-fg"}`}>{tech}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center text-line-strong" aria-hidden="true">
      <span className="h-5 w-px bg-line-strong md:h-px md:w-6" />
      <span className="hidden font-mono text-[11px] md:inline">›</span>
      <span className="font-mono text-[11px] md:hidden">⌄</span>
    </div>
  );
}

/** Flujo de petición típico en los sistemas de los roles del CV. */
function ArchitectureFlow() {
  return (
    <figure className="border-b border-line px-5 py-8 sm:px-8 sm:py-10">
      <figcaption className="font-mono text-xs text-muted">
        <span className="text-dim"># </span>flujo típico en los sistemas donde he trabajado
      </figcaption>

      <div className="mt-6 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-0">
        <FlowNode label="cliente" tech="JavaScript · Livewire" />
        <Connector />
        <FlowNode label="aplicación" tech="Laravel · PHP" accent />
        <Connector />
        <FlowNode label="datos" tech="MySQL" />
      </div>

      {/* Rama hacia la pasarela de pagos, colgando de la capa de aplicación. */}
      <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="hidden md:block" />
        <div className="hidden md:block" />
        <div className="flex flex-col items-center md:items-stretch">
          <div className="flex justify-center" aria-hidden="true">
            <span className="h-6 w-px border-l border-dashed border-line-strong" />
          </div>
          <div className="w-full rounded-md border border-dashed border-amber/50 px-4 py-3">
            <p className="font-mono text-[11px] text-dim">integración externa</p>
            <p className="mt-1 font-mono text-sm text-amber">Wompi · pasarela de pagos</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-dashed border-line pt-4 font-mono text-[11px] text-dim">
        <span>
          entorno <span className="text-muted">Linux (Fedora, Debian)</span>
        </span>
        <span>
          contenedores <span className="text-muted">Docker</span>
        </span>
        <span>
          deploy <span className="text-muted">Hostinger</span>
        </span>
        <span>
          proceso <span className="text-muted">Scrum</span>
        </span>
      </div>
    </figure>
  );
}

function GroupCell({ group }: { group: SkillGroup }) {
  return (
    <li className={`group bg-canvas p-6 transition-colors duration-150 hover:bg-canvas-raised sm:p-7 ${spanClass[group.span ?? "default"]}`}>
      <p className="font-mono text-[11px] text-dim">
        /etc/stack/<span className="text-muted transition-colors duration-150 group-hover:text-accent">{group.file}</span>
      </p>
      <h3 className="mt-2 font-semibold tracking-tight text-fg">{group.title}</h3>
      <ul className={`mt-5 grid gap-x-8 gap-y-4 ${group.span ? "sm:grid-cols-2" : ""}`}>
        {group.skills.map((skill) => (
          <li key={skill.name} className="min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-mono text-sm text-fg">{skill.name}</span>
              {skill.usedAt?.map((place) => (
                <span key={place} className="font-mono text-[11px] text-accent">
                  @{place}
                </span>
              ))}
            </p>
            {skill.detail && <p className="mt-0.5 text-sm text-muted">{skill.detail}</p>}
          </li>
        ))}
      </ul>
    </li>
  );
}

export function Stack() {
  return (
    <Section
      id="stack"
      index="03"
      path="~/fidel/stack"
      title="Stack & arquitectura"
      command="cat /etc/stack/*.conf"
      description={
        <>
          Agrupado por capa. Sin barras de porcentaje: cada tecnología indica dónde se aplicó
          (<span className="font-mono text-accent">@rol</span>).
        </>
      }
    >
      <ArchitectureFlow />
      <ul className="grid gap-px bg-line md:grid-cols-2 xl:grid-cols-6">
        {skillGroups.map((group) => (
          <GroupCell key={group.id} group={group} />
        ))}
      </ul>
    </Section>
  );
}

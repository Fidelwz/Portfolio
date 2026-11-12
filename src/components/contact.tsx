import type { ReactNode } from "react";
import { profile } from "@/data/profile";
import { ContactForm } from "./contact-form";
import { CopyButton } from "./copy-button";
import { ArrowUpRight } from "./icons";
import { Section } from "./section";

type Channel = {
  key: string;
  value: string;
  href?: string;
  external?: boolean;
  action?: ReactNode;
};

const { contact } = profile;

const channels: Channel[] = [
  {
    key: "email",
    value: contact.email,
    href: `mailto:${contact.email}`,
    action: <CopyButton value={contact.email} label="Copiar correo" />,
  },
  { key: "linkedin", value: contact.linkedinHandle, href: contact.linkedin, external: true },
  { key: "github", value: `@${contact.githubUser}`, href: contact.github, external: true },
  { key: "ubicación", value: profile.location.full },
];

export function Contact() {
  return (
    <Section
      id="contacto"
      index="04"
      path="~/fidel/contacto"
      title="Contacto"
      command="./contact.sh --to fidel"
      description="¿Una vacante, un proyecto o una integración con Laravel? Escríbeme por el formulario o por cualquiera de los canales directos."
    >
      <div className="grid xl:grid-cols-12">
        <div className="border-b border-line px-5 py-8 sm:px-8 sm:py-10 xl:col-span-6 xl:border-b-0 xl:border-r">
          <p className="font-mono text-xs text-muted">
            <span className="select-none text-emerald">$ </span>ls -l ~/contacto
          </p>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {channels.map((channel) => (
              <li key={channel.key} className="group relative flex items-center gap-4 py-3.5">
                <span className="w-[4.5rem] shrink-0 font-mono text-[11px] text-dim">{channel.key}</span>
                {channel.href ? (
                  <a
                    href={channel.href}
                    {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="min-w-0 flex-1 font-mono text-[13px] text-fg transition-colors duration-150 [overflow-wrap:anywhere] hover:text-accent"
                  >
                    {channel.value}
                  </a>
                ) : (
                  <span className="min-w-0 flex-1 text-sm text-muted">{channel.value}</span>
                )}
                {channel.action ??
                  (channel.external ? (
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-dim transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  ) : null)}
              </li>
            ))}
          </ul>
          {profile.availability.open && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-md border border-emerald/30 bg-emerald/[0.06] px-3 py-2 font-mono text-xs text-emerald">
              <span className="size-1.5 rounded-full bg-emerald" aria-hidden="true" />
              {profile.availability.label}
            </p>
          )}
        </div>

        <div className="px-5 py-8 sm:px-8 sm:py-10 xl:col-span-6">
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}

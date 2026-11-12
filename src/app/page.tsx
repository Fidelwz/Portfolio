import { cacheLife } from "next/cache";
import { Contact } from "@/components/contact";
import { Experience } from "@/components/experience";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { Stack } from "@/components/stack";
import { StatusLine } from "@/components/status-line";
import { TopBar } from "@/components/top-bar";
import { experience, profile } from "@/data/profile";

/**
 * Fecha de referencia para duraciones ("1 año 6 meses"). Se captura en el
 * shell estático y se regenera a diario, así la página sigue siendo estática.
 */
async function getReferenceDate() {
  "use cache";
  cacheLife("days");
  return new Date().toISOString();
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.fullName,
  jobTitle: profile.role,
  email: `mailto:${profile.contact.email}`,
  address: { "@type": "PostalAddress", addressRegion: "La Libertad", addressCountry: "SV" },
  worksFor: { "@type": "Organization", name: experience[0].company },
  alumniOf: [{ "@type": "CollegeOrUniversity", name: "Universidad Francisco Gavidia" }],
  knowsAbout: ["PHP", "Laravel", "Livewire", "JavaScript", "MySQL", "Docker", "Linux", "Scrum"],
  sameAs: [profile.contact.github, profile.contact.linkedin],
};

export default async function Home() {
  const now = new Date(await getReferenceDate());

  return (
    <>
      <a
        href="#experiencia"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-14 focus:z-50 focus:rounded-md focus:bg-amber focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
      >
        Saltar a la experiencia
      </a>
      <TopBar />
      <main className="mx-auto w-full max-w-[1440px] min-[1442px]:border-x min-[1442px]:border-line">
        <Hero now={now} />
        <Experience now={now} />
        <Projects />
        <Stack />
        <Contact />
      </main>
      <StatusLine year={now.getFullYear()} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}

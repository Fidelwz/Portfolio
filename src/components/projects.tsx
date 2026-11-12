import { profile } from "@/data/profile";
import { GitHubFeed } from "./github-feed";
import { Section } from "./section";

export function Projects() {
  return (
    <Section
      id="proyectos"
      index="02"
      path="~/fidel/proyectos"
      title="Proyectos recientes"
      command={`gh repo list ${profile.contact.githubUser} --limit 6`}
      description={
        <>
          Feed en vivo desde la API pública de GitHub, ordenado por última actualización. Cada módulo enlaza al
          repositorio.
        </>
      }
    >
      <GitHubFeed />
    </Section>
  );
}

export const GITHUB_USER = "Fidelwz";
export const GITHUB_REPOS_ENDPOINT = `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=6`;

export type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  homepage: string | null;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
};

/** Colores oficiales de linguist (solo para el punto indicador, nunca para texto). */
const LANGUAGE_COLORS: Record<string, string> = {
  PHP: "#4F5D95",
  Blade: "#f7523f",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Java: "#b07219",
  Python: "#3572A5",
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  HTML: "#e34c26",
  CSS: "#663399",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Go: "#00ADD8",
  Rust: "#dea584",
  "Jupyter Notebook": "#DA5B0B",
};

export function languageColor(language: string | null) {
  return (language && LANGUAGE_COLORS[language]) || "#94a3b8";
}

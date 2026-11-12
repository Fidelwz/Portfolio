/**
 * Fuente única de datos del portafolio.
 * Todo el contenido proviene de CvFidel.pdf. Si algo cambia en el CV,
 * se actualiza aquí y el resto de la interfaz se ajusta sola.
 */

export type YearMonth = `${number}-${string}`;

export type ChangeType = "feat" | "chore" | "agile" | "deploy";

export type Change = {
  type: ChangeType;
  scope?: string;
  text: string;
  /** Marca el logro principal del rol (se resalta en ámbar). */
  key?: boolean;
};

export type ArchitectureLayer = {
  layer: string;
  tech: string;
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  location: string;
  start: YearMonth;
  /** `null` = puesto actual. */
  end: YearMonth | null;
  summary: string;
  changes: Change[];
  architecture: ArchitectureLayer[];
  stack: string[];
};

export type Education = {
  id: string;
  degree: string;
  institution: string;
  period: string;
  status: "en-curso" | "graduado";
  notes: string[];
  url?: string;
};

export type Skill = {
  name: string;
  detail?: string;
  /** Rol(es) del CV donde se aplicó esta tecnología. */
  usedAt?: string[];
};

export type SkillGroup = {
  id: string;
  file: string;
  title: string;
  skills: Skill[];
  /** wide: 2 columnas en md y 4 en xl · xl-wide: 1 columna en md y 4 en xl. */
  span?: "wide" | "xl-wide";
};

export const profile = {
  name: "Fidel Contreras",
  fullName: "Fidel Alejandro Contreras Pérez",
  role: "Desarrollador Full Stack",
  degree: "Técnico en Ingeniería de Desarrollo de Software",
  focus: ["PHP", "Laravel", "JavaScript", "MySQL"],
  location: {
    short: "La Libertad, El Salvador",
    full: "Lourdes Colón, La Libertad, El Salvador",
  },
  /** Estado visible en la barra superior. Cambiar `open` a false si ya no aplica. */
  availability: {
    open: true,
    label: "Abierto a oportunidades",
  },
  summary:
    "Soy una persona sociable, proactiva, organizada y muy responsable. Busco llevar mis habilidades al límite y aplicar mis conocimientos para el buen desarrollo de la empresa. Me apasiona el trabajo en equipo y me considero una persona ágil y empática.",
  contact: {
    email: "fidelcontrereas2002@gmail.com",
    linkedin: "https://www.linkedin.com/in/fidel-contreras-perez",
    linkedinHandle: "in/fidel-contreras-perez",
    github: "https://github.com/Fidelwz",
    githubUser: "Fidelwz",
  },
} as const;

export const experience: Experience[] = [
  {
    id: "metalink",
    role: "Desarrollador Full Stack",
    company: "Metalink Networks",
    location: "San Salvador",
    start: "2025-06",
    end: null,
    summary:
      "Desarrollo e integración de funcionalidades en sistemas internos utilizando Laravel, con foco en integraciones estables y eficientes.",
    changes: [
      {
        type: "feat",
        scope: "payments",
        text: "Integración de la pasarela de pagos Wompi en una plataforma existente.",
        key: true,
      },
      {
        type: "feat",
        scope: "internal",
        text: "Desarrollo e integración de funcionalidades en sistemas internos con Laravel.",
      },
      {
        type: "chore",
        scope: "stack",
        text: "Trabajo con PHP, Laravel, MySQL y Livewire, asegurando integraciones estables y eficientes.",
      },
    ],
    architecture: [
      { layer: "ui", tech: "Livewire" },
      { layer: "app", tech: "Laravel · PHP" },
      { layer: "datos", tech: "MySQL" },
      { layer: "pagos", tech: "Wompi" },
    ],
    stack: ["PHP", "Laravel", "Livewire", "MySQL", "Wompi"],
  },
  {
    id: "consulight",
    role: "Desarrollador de Software",
    company: "Consulight People First",
    location: "San Salvador",
    start: "2022-12",
    end: "2023-11",
    summary:
      "Contribución al desarrollo y mejora de soluciones de software, desde la implementación hasta el despliegue.",
    changes: [
      {
        type: "feat",
        scope: "core",
        text: "Desarrollo y mejora de soluciones de software con PHP (Laravel), MySQL y JavaScript.",
        key: true,
      },
      {
        type: "agile",
        scope: "scrum",
        text: "Implementación de metodologías ágiles, especialmente Scrum, para asegurar entregas eficientes.",
      },
      {
        type: "deploy",
        scope: "hostinger",
        text: "Despliegues en Hostinger, garantizando implementaciones fluidas.",
      },
    ],
    architecture: [
      { layer: "frontend", tech: "JavaScript" },
      { layer: "backend", tech: "Laravel · PHP" },
      { layer: "datos", tech: "MySQL" },
      { layer: "deploy", tech: "Hostinger" },
    ],
    stack: ["PHP", "Laravel", "MySQL", "JavaScript", "Scrum", "Hostinger"],
  },
];

export const education: Education[] = [
  {
    id: "ufg",
    degree: "Ingeniería en Desarrollo de Software",
    institution: "Universidad Francisco Gavidia",
    period: "2024 — en curso",
    status: "en-curso",
    notes: [],
    url: "https://www.ufg.edu.sv/",
  },
  {
    id: "agape",
    degree: "Técnico en Ingeniería de Desarrollo de Software",
    institution: "Escuela Superior Franciscana AGAPE",
    period: "Graduado en 2022",
    status: "graduado",
    notes: ["Miembro del grupo de robótica"],
  },
];

export const skillGroups: SkillGroup[] = [
  {
    id: "backend",
    file: "backend.conf",
    title: "Backend & PHP/Laravel",
    span: "wide",
    skills: [
      { name: "PHP", detail: "Lenguaje base del backend", usedAt: ["metalink", "consulight"] },
      { name: "Laravel", detail: "Framework principal en sistemas internos", usedAt: ["metalink", "consulight"] },
      { name: "Livewire", detail: "Interfaces reactivas sobre Laravel", usedAt: ["metalink"] },
      { name: "Wompi", detail: "Integración de pasarela de pagos", usedAt: ["metalink"] },
    ],
  },
  {
    id: "database",
    file: "database.conf",
    title: "Base de datos & MySQL",
    skills: [
      { name: "MySQL", detail: "Motor de datos en ambos roles", usedAt: ["metalink", "consulight"] },
      { name: "SQL", detail: "Lenguaje de consultas" },
    ],
  },
  {
    id: "frontend",
    file: "frontend.conf",
    title: "Frontend & JavaScript",
    skills: [
      { name: "JavaScript", detail: "Lógica del lado del cliente", usedAt: ["consulight"] },
      { name: "Livewire", detail: "UI reactiva sin salir de Laravel", usedAt: ["metalink"] },
    ],
  },
  {
    id: "linux",
    file: "entorno.conf",
    title: "Entorno Linux & herramientas",
    span: "wide",
    skills: [
      { name: "Linux", detail: "Fedora · Debian" },
      { name: "Docker", detail: "Contenedores" },
      { name: "Hostinger", detail: "Despliegue de aplicaciones", usedAt: ["consulight"] },
    ],
  },
  {
    id: "languages",
    file: "lenguajes.conf",
    title: "Otros lenguajes",
    skills: [{ name: "Java" }, { name: "Python" }],
  },
  {
    id: "team",
    file: "equipo.conf",
    title: "Proceso & equipo",
    span: "xl-wide",
    skills: [
      { name: "Scrum", detail: "Entregas iterativas", usedAt: ["consulight"] },
      { name: "Trabajo en equipo" },
      { name: "Empatía" },
      { name: "Responsabilidad" },
    ],
  },
];

export const sections = [
  { id: "inicio", label: "inicio", path: "~/fidel" },
  { id: "experiencia", label: "experiencia", path: "~/fidel/experiencia" },
  { id: "proyectos", label: "proyectos", path: "~/fidel/proyectos" },
  { id: "stack", label: "stack", path: "~/fidel/stack" },
  { id: "contacto", label: "contacto", path: "~/fidel/contacto" },
] as const;

export type SectionId = (typeof sections)[number]["id"];


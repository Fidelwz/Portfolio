import type { Experience, YearMonth } from "@/data/profile";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function parse(ym: YearMonth) {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, month: m };
}

function toYearMonth(date: Date): YearMonth {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** "jun 2025" */
export function formatYearMonth(ym: YearMonth) {
  const { year, month } = parse(ym);
  return `${MONTHS[month - 1]} ${year}`;
}

/** Meses inclusivos entre dos fechas (jun → jun = 1 mes), igual que LinkedIn. */
export function monthsBetween(start: YearMonth, end: YearMonth | null, now: Date) {
  const a = parse(start);
  const b = parse(end ?? toYearMonth(now));
  return Math.max(1, (b.year - a.year) * 12 + (b.month - a.month) + 1);
}

/** 18 → "1 año 6 meses" · compact: "1a 6m" */
export function formatMonths(total: number, compact = false) {
  const years = Math.floor(total / 12);
  const months = total % 12;
  if (compact) {
    return [years ? `${years}a` : "", months ? `${months}m` : ""].filter(Boolean).join(" ");
  }
  const parts: string[] = [];
  if (years) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
  if (months) parts.push(`${months} ${months === 1 ? "mes" : "meses"}`);
  return parts.join(" ");
}

export function totalExperienceMonths(jobs: Experience[], now: Date) {
  return jobs.reduce((sum, job) => sum + monthsBetween(job.start, job.end, now), 0);
}

const relativeFormatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

/** "hace 5 días", "ayer", "hace 2 meses"… relativo a `now` (ms). */
export function formatRelative(iso: string, now: number) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormatter.format(Math.round(seconds / size), unit);
    }
  }
  return "hace un momento";
}

const absoluteFormatter = new Intl.DateTimeFormat("es-SV", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/El_Salvador",
});

export function formatAbsolute(iso: string) {
  return absoluteFormatter.format(new Date(iso));
}

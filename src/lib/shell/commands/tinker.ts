import { education, experience, profile, skillGroups } from "@/data/profile";
import { badge, blank, row, t } from "../out";
import type { CommandOutput, Line, Segment } from "../types";

/**
 * Tinker de bolsillo. No interpreta PHP: reconoce un conjunto fijo de consultas
 * tipo Eloquent sobre cuatro "modelos" construidos con los datos de profile.ts.
 */

type Value = string | number | boolean | null | string[];
type Model = { __class: string; attributes: Record<string, Value> };
type Collection = { __collection: true; items: (Model | Value)[] };
type Result = Model | Collection | Value;

function model(name: string, attributes: Record<string, Value>): Model {
  return { __class: `App\\Models\\${name}`, attributes };
}

const MODELS: Record<string, { headline: string[]; records: Model[] }> = {
  Fidel: {
    headline: ["name", "role"],
    records: [
      model("Fidel", {
        id: 1,
        name: profile.name,
        full_name: profile.fullName,
        role: profile.role,
        degree: profile.degree,
        focus: [...profile.focus],
        location: profile.location.full,
        email: profile.contact.email,
        github: profile.contact.githubUser,
        available: profile.availability.open,
      }),
    ],
  },
  Experience: {
    headline: ["role", "company"],
    records: [...experience]
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((job, index) =>
        model("Experience", {
          id: index + 1,
          role: job.role,
          company: job.company,
          location: job.location,
          start: job.start,
          end: job.end,
          stack: job.stack,
        }),
      ),
  },
  Education: {
    headline: ["degree", "institution"],
    records: [...education].reverse().map((item, index) =>
      model("Education", {
        id: index + 1,
        degree: item.degree,
        institution: item.institution,
        period: item.period,
        status: item.status,
      }),
    ),
  },
  Skill: {
    headline: ["name", "group"],
    records: skillGroups
      .flatMap((group) => group.skills.map((skill) => ({ skill, group: group.title })))
      .filter((entry, index, all) => all.findIndex((other) => other.skill.name === entry.skill.name) === index)
      .map((entry, index) =>
        model("Skill", {
          id: index + 1,
          name: entry.skill.name,
          group: entry.group,
          detail: entry.skill.detail ?? null,
          used_at: entry.skill.usedAt ?? [],
        }),
      ),
  },
};

const EXAMPLES = ["Experience::all()", "Experience::count()", "Experience::find(1)", "Skill::pluck('name')", "Fidel::first()->role"];

const QUERY = /^\\?(?:App\\Models\\)?([A-Za-z_]+)::([a-zA-Z]+)\(\s*(?:(['"])(.*?)\3|(\d+))?\s*\)((?:\s*->\s*[A-Za-z_]+(?:\(\))?)*)\s*;?$/;
const ARITHMETIC = /^(-?\d+(?:\.\d+)?)\s*([-+*/%])\s*(-?\d+(?:\.\d+)?)\s*;?$/;

class TinkerError extends Error {
  constructor(
    public label: string,
    message: string,
  ) {
    super(message);
  }
}

function isModel(value: Result): value is Model {
  return typeof value === "object" && value !== null && "__class" in value;
}

function isCollection(value: Result): value is Collection {
  return typeof value === "object" && value !== null && "__collection" in value;
}

function collect(items: (Model | Value)[]): Collection {
  return { __collection: true, items };
}

function evaluate(input: string): Result {
  const match = QUERY.exec(input);
  if (!match) throw new TinkerError("PARSE", "");

  const [, className, method, , stringArg, numberArg, chain] = match;
  const entry = MODELS[className];
  if (!entry) throw new TinkerError("Error", `Class "${className}" not found.`);
  const { records } = entry;

  let value: Result;
  switch (method) {
    case "all":
    case "get":
      value = collect(records);
      break;
    case "count":
      value = records.length;
      break;
    case "first":
      value = records[0] ?? null;
      break;
    case "last":
      value = records.at(-1) ?? null;
      break;
    case "latest":
      value = collect([...records].reverse());
      break;
    case "find":
      if (numberArg === undefined) throw new TinkerError("ArgumentCountError", "Too few arguments to function find(), 0 passed and exactly 1 expected.");
      value = records.find((record) => record.attributes.id === Number(numberArg)) ?? null;
      break;
    case "pluck":
      if (stringArg === undefined) throw new TinkerError("ArgumentCountError", "Too few arguments to function pluck(), 0 passed and at least 1 expected.");
      value = collect(records.map((record) => record.attributes[stringArg] ?? null));
      break;
    default:
      throw new TinkerError("BadMethodCallException", `Call to undefined method App\\Models\\${className}::${method}()`);
  }

  for (const step of chain.split("->").map((part) => part.trim()).filter(Boolean)) {
    const isCall = step.endsWith("()");
    const name = isCall ? step.slice(0, -2) : step;

    if (isCollection(value)) {
      if (isCall && name === "count") value = value.items.length;
      else if (isCall && name === "first") value = value.items[0] ?? null;
      else if (isCall && name === "last") value = value.items.at(-1) ?? null;
      else if (isCall) throw new TinkerError("BadMethodCallException", `Method Illuminate\\Support\\Collection::${name} does not exist.`);
      else throw new TinkerError("Exception", `Property [${name}] does not exist on this collection instance.`);
    } else if (isModel(value)) {
      if (isCall) throw new TinkerError("BadMethodCallException", `Call to undefined method ${value.__class}::${name}()`);
      value = value.attributes[name] ?? null;
    } else if (value === null) {
      if (isCall) throw new TinkerError("Error", `Call to a member function ${name}() on null`);
      throw new TinkerError("Warning", `Attempt to read property "${name}" on null`);
    } else {
      throw new TinkerError("Error", `Cannot use ${isCall ? "method" : "property"} "${name}" on a scalar value`);
    }
  }
  return value;
}

function scalar(value: Value): Segment[] {
  if (value === null) return [{ t: "null", tone: "amber" }];
  if (typeof value === "boolean" || typeof value === "number") return [{ t: String(value), tone: "amber" }];
  if (Array.isArray(value)) {
    return [{ t: "[", tone: "dim" }, { t: value.map((item) => `"${item}"`).join(", "), tone: "fg" }, { t: "]", tone: "dim" }];
  }
  return [{ t: `"${value}"`, tone: "fg" }];
}

function printModel(value: Model): Line[] {
  return [
    row(["= ", "dim"], [value.__class, "amber"], [` {#${value.attributes.id}`, "dim"]),
    ...Object.entries(value.attributes).map(
      ([key, attribute]): Line => ({
        kind: "code",
        segments: [{ t: `    ${key}`, tone: "accent" }, { t: ": ", tone: "dim" }, ...scalar(attribute), { t: ",", tone: "dim" }],
      }),
    ),
    t("  }", "dim"),
  ];
}

function printCollection(value: Collection, headline: string[]): Line[] {
  const models = value.items.filter(isModel);
  if (models.length !== value.items.length || !models.length) {
    const values = value.items as Value[];
    return [
      {
        kind: "code",
        segments: [
          { t: "= ", tone: "dim" },
          { t: "Illuminate\\Support\\Collection", tone: "amber" },
          { t: " {all: [", tone: "dim" },
          ...values.flatMap((item, index): Segment[] => [...(index ? [{ t: ", ", tone: "dim" as const }] : []), ...scalar(item)]),
          { t: "]}", tone: "dim" },
        ],
      },
    ];
  }
  return [
    row(["= ", "dim"], ["Illuminate\\Database\\Eloquent\\Collection", "amber"], [" {all: [", "dim"]),
    ...models.map(
      (item): Line => ({
        kind: "code",
        segments: [
          { t: `    #${item.attributes.id} `, tone: "dim" },
          ...headline.flatMap((key, index): Segment[] => [
            ...(index ? [{ t: " · ", tone: "dim" as const }] : []),
            { t: String(item.attributes[key] ?? "null"), tone: index ? "muted" : "fg" },
          ]),
        ],
      }),
    ),
    row(["  ]}", "dim"], [`  ${models.length} registros · detalle con ::find(id)`, "dim"]),
  ];
}

function print(value: Result, headline: string[]): Line[] {
  if (isModel(value)) return printModel(value);
  if (isCollection(value)) return printCollection(value, headline);
  return [{ kind: "code", segments: [{ t: "= ", tone: "dim" }, ...scalar(value)] }];
}

/** Candidatos de autocompletado dentro de tinker. */
export function tinkerCandidates() {
  return [...EXAMPLES, "exit", "help"];
}

export function tinkerStep(input: string): CommandOutput {
  const expression = input.trim();
  if (!expression) return {};

  if (/^(exit|quit|exit\(\)|\\q)\s*;?$/.test(expression)) {
    return { state: { mode: "bash" }, lines: [blank, badge("INFO", "Goodbye."), blank] };
  }
  if (/^(help|\?)$/.test(expression)) {
    return {
      lines: [
        row(["Modelos: ", "dim"], [Object.keys(MODELS).join(", "), "amber"]),
        row(["Métodos: ", "dim"], ["all() count() first() last() find(id) pluck('campo')", "fg"]),
        row(["Después: ", "dim"], ["->campo  ->count()  ->first()", "fg"]),
        ...EXAMPLES.map((example) => row(["  ", "dim"], [example, "accent"])),
      ],
    };
  }

  const arithmetic = ARITHMETIC.exec(expression);
  if (arithmetic) {
    const [, left, operator, right] = arithmetic;
    const a = Number(left);
    const b = Number(right);
    if ((operator === "/" || operator === "%") && b === 0) {
      return { lines: [blank, row(["   DivisionByZeroError ", "danger"], [operator === "/" ? " Division by zero." : " Modulo by zero.", "fg"]), blank] };
    }
    const result = operator === "+" ? a + b : operator === "-" ? a - b : operator === "*" ? a * b : operator === "/" ? a / b : a % b;
    return { lines: [row(["= ", "dim"], [String(result), "amber"])] };
  }

  const literal = /^(['"])(.*)\1\s*;?$/.exec(expression);
  if (literal) return { lines: [row(["= ", "dim"], [`"${literal[2]}"`, "fg"])] };

  try {
    const className = QUERY.exec(expression)?.[1] ?? "";
    return { lines: print(evaluate(expression), MODELS[className]?.headline ?? []) };
  } catch (error) {
    if (error instanceof TinkerError && error.label === "PARSE") {
      return {
        lines: [
          row(["  tinker de bolsillo: ", "amber"], ["no entiendo esa expresión. Escribe ", "muted"], ["help", "fg"], [" para ver ejemplos.", "muted"]),
        ],
      };
    }
    if (error instanceof TinkerError) {
      return {
        lines: [
          blank,
          row([`   ${error.label} `, "danger"], [` ${error.message}`, "fg"]),
          ...(error.label === "Warning" ? [blank, row(["= ", "dim"], ["null", "amber"])] : [blank]),
        ],
      };
    }
    throw error;
  }
}

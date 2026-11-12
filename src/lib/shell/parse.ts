/**
 * Parser mínimo de línea de comandos: palabras, comillas simples y dobles,
 * y tuberías con `|` fuera de comillas. No hay variables ni redirecciones.
 */

/** Separa `fortune | cowsay` en ["fortune", "cowsay"], respetando comillas. */
export function splitPipeline(input: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (const char of input) {
    if (quote) {
      if (char === quote) quote = null;
      current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      current += char;
    } else if (char === "|") {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts;
}

/** Separa `echo "hola mundo" x` en ["echo", "hola mundo", "x"]. */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let hasToken = false;

  for (const char of input) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      hasToken = true;
    } else if (/\s/.test(char)) {
      if (hasToken || current) tokens.push(current);
      current = "";
      hasToken = false;
    } else {
      current += char;
    }
  }
  if (hasToken || current) tokens.push(current);
  return tokens;
}

/** Distancia de edición, para sugerir "¿quisiste decir…?". */
export function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = a[i - 1] === b[j - 1] ? diagonal : 1 + Math.min(diagonal, above, previous[j - 1]);
      diagonal = above;
    }
  }
  return previous[b.length];
}

/** Prefijo común más largo de una lista de candidatos. */
export function commonPrefix(values: string[]): string {
  if (values.length === 0) return "";
  let prefix = values[0];
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

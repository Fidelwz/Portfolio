import { TOTAL_SECRETS } from "./content";
import type { PromptInfo, ShellState } from "./types";

/** Prompt según el modo y el progreso. No depende del motor: se usa también en la vista. */
export function promptFor(state: ShellState, secretsFound: number): PromptInfo {
  const root = secretsFound >= TOTAL_SECRETS;
  const path = state.cwd === "inicio" ? "~" : `~/${state.cwd}`;
  if (state.mode === "tinker") return { user: root ? "root" : "fidel", path, symbol: ">" };
  if (state.mode === "confirm") return { user: root ? "root" : "fidel", path, symbol: "?" };
  return { user: root ? "root" : "fidel", path, symbol: root ? "#" : "$" };
}

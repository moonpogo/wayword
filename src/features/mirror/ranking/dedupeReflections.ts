import type { MirrorReflectionCandidate } from "../types/mirrorTypes.js";

/** Collapse identical statements, keeping the stronger `rankScore`. */
export function dedupeReflections(candidates: MirrorReflectionCandidate[]): MirrorReflectionCandidate[] {
  const byStatement = new Map<string, MirrorReflectionCandidate>();
  for (const c of candidates) {
    const key = c.statement.trim().toLowerCase();
    const prev = byStatement.get(key);
    if (!prev || c.rankScore > prev.rankScore) byStatement.set(key, c);
  }
  return [...byStatement.values()];
}

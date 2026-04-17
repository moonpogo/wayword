import type { MirrorCategoryV1, MirrorReflectionCandidate } from "../types/mirrorTypes.js";
import { compareRanked, rankReflections } from "./rankReflections.js";

/**
 * At most one candidate per category (defensive), then identical headlines collapsed.
 * Output is re-sorted with the same rules as `rankReflections`.
 */
export function dedupeReflections(candidates: MirrorReflectionCandidate[]): MirrorReflectionCandidate[] {
  const byCategory = new Map<MirrorCategoryV1, MirrorReflectionCandidate>();
  for (const c of candidates) {
    const prev = byCategory.get(c.category);
    if (!prev || compareRanked(c, prev) < 0) byCategory.set(c.category, c);
  }

  const byStatement = new Map<string, MirrorReflectionCandidate>();
  for (const c of byCategory.values()) {
    // Dedupe identity is still normalized headline text (not a separate headlineKey).
    const key = c.statement.trim().toLowerCase().replace(/\s+/g, " ");
    const prev = byStatement.get(key);
    if (!prev || compareRanked(c, prev) < 0) byStatement.set(key, c);
  }

  return rankReflections([...byStatement.values()]);
}

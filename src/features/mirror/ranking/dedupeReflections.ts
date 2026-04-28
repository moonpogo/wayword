import { MIRROR_HEADLINE_REPETITION_GENERIC_PRESSURE } from "../constants/mirrorSessionHeadlines.js";
import type { MirrorCategoryV1, MirrorReflectionCandidate } from "../types/mirrorTypes.js";
import { compareRanked, rankReflections } from "./rankReflections.js";

function normStmt(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * At most one candidate per category (defensive), except a bonsai pair of named repetition +
 * generic pressure (both `repetition`). Then identical headlines collapsed.
 * Output is re-sorted with the same rules as `rankReflections`.
 */
export function dedupeReflections(candidates: MirrorReflectionCandidate[]): MirrorReflectionCandidate[] {
  const byCategory = new Map<MirrorCategoryV1, MirrorReflectionCandidate[]>();
  for (const c of candidates) {
    const arr = byCategory.get(c.category) ?? [];
    arr.push(c);
    byCategory.set(c.category, arr);
  }

  const merged: MirrorReflectionCandidate[] = [];
  for (const [cat, list] of byCategory) {
    if (cat === "repetition" && list.length > 1) {
      const genNorm = normStmt(MIRROR_HEADLINE_REPETITION_GENERIC_PRESSURE);
      const generic = list.find((x) => normStmt(x.statement) === genNorm);
      const named = list.filter((x) => x.statement.includes("\u201c"));
      if (generic && named.length >= 1) {
        const bestNamed = named.reduce((a, b) => (compareRanked(a, b) < 0 ? a : b));
        merged.push(bestNamed, generic);
        continue;
      }
    }
    const winner = list.reduce((a, b) => (compareRanked(a, b) < 0 ? a : b));
    merged.push(winner);
  }

  const byStatement = new Map<string, MirrorReflectionCandidate>();
  for (const c of merged) {
    // Dedupe identity is still normalized headline text (not a separate headlineKey).
    const key = c.statement.trim().toLowerCase().replace(/\s+/g, " ");
    const prev = byStatement.get(key);
    if (!prev || compareRanked(c, prev) < 0) byStatement.set(key, c);
  }

  return rankReflections([...byStatement.values()]);
}

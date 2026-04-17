import { MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA } from "../constants/selectionThresholds.js";
import type { MirrorCategoryV1, MirrorReflectionCandidate } from "../types/mirrorTypes.js";
import { mirrorStatementSpecificity } from "./statementSpecificity.js";

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Explicit ordering weights so lead cards prefer directional observations over balanced/mixed lines.
 * This layer does not alter extraction thresholds or evidence; it only affects rank ordering.
 */
function rankingWeight(candidate: MirrorReflectionCandidate): number {
  const s = norm(candidate.statement);

  // Lower-priority abstraction states should not outrank directional observations.
  if (
    s === "ideas and concrete detail stay in balance." ||
    s === "both idea-words and image-words appear frequently."
  ) {
    return -28;
  }

  // Highest-priority directional abstraction movement and directional abstraction dominance.
  if (
    s === "the back half leans more conceptual than scene-based." ||
    s === "concrete detail carries more of the later passages." ||
    s === "ideas dominate over concrete detail." ||
    s === "concrete detail outweighs abstraction."
  ) {
    return 34;
  }

  // Named recurrence should remain near the top.
  if (s.includes("returns several times in this draft")) {
    return 30;
  }

  // Medium-priority cadence movement.
  if (
    s === "the ending tightens noticeably." ||
    s === "lines lengthen near the end." ||
    s === "the cadence alternates between short and long lines."
  ) {
    return 18;
  }

  // Medium-priority hesitation / qualification patterns.
  if (
    s === "statements are often qualified just after they’re made." ||
    s === "assertions are often followed by softening." ||
    s === "statements are often revised or softened."
  ) {
    return 10;
  }

  return 0;
}

/**
 * When rank scores are tied within the near-delta window, prefer categories that should
 * lead with stronger directional observations before softer generalized signals.
 */
function categoryTiePreference(category: MirrorCategoryV1): number {
  if (category === "abstraction_concrete") return 4;
  if (category === "repetition") return 3;
  if (category === "cadence") return 2;
  if (category === "hesitation_qualification") return 1;
  return 1;
}

export function compareRanked(a: MirrorReflectionCandidate, b: MirrorReflectionCandidate): number {
  const weightedA = a.rankScore + rankingWeight(a);
  const weightedB = b.rankScore + rankingWeight(b);
  const d = weightedB - weightedA;
  if (Math.abs(d) <= MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA) {
    const sp =
      mirrorStatementSpecificity(b.statement) - mirrorStatementSpecificity(a.statement);
    if (sp !== 0) return sp;
    const pref = categoryTiePreference(b.category) - categoryTiePreference(a.category);
    if (pref !== 0) return pref;
  } else if (d !== 0) {
    return d;
  }
  return 0;
}

/**
 * Sort by `rankScore` (desc), then when scores are within `MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA`
 * prefer higher statement specificity. Remaining ties preserve the order of the input array
 * (stable relative to the list passed in — typically already rank-ordered upstream).
 */
export function rankReflections(candidates: MirrorReflectionCandidate[]): MirrorReflectionCandidate[] {
  return [...candidates]
    .map((c, inputIndex) => ({ c, inputIndex }))
    .sort((a, b) => {
      const cmp = compareRanked(a.c, b.c);
      if (cmp !== 0) return cmp;
      return a.inputIndex - b.inputIndex;
    })
    .map(({ c }) => c);
}

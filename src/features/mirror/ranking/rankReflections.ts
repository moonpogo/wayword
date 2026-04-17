import {
  MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL,
  MIRROR_HEADLINE_ABSTRACTION_BALANCE,
  MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS,
  MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE,
  MIRROR_HEADLINE_CADENCE_ALTERNATION,
  MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS,
  MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN,
  MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING,
  MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER,
  MIRROR_HEADLINE_HESITATION_REVISED,
  MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER,
  normMirrorReflectionHeadline
} from "../constants/mirrorSessionHeadlines.js";
import { MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA } from "../constants/selectionThresholds.js";
import type { MirrorCategoryV1, MirrorReflectionCandidate } from "../types/mirrorTypes.js";
import { mirrorStatementSpecificity } from "./statementSpecificity.js";

function norm(s: string): string {
  return normMirrorReflectionHeadline(s);
}

/**
 * Explicit ordering weights so lead cards prefer directional observations over balanced/mixed lines.
 * This layer does not alter extraction thresholds or evidence; it only affects rank ordering.
 */
function rankingWeight(candidate: MirrorReflectionCandidate): number {
  const s = norm(candidate.statement);

  // Lower-priority abstraction states should not outrank directional observations.
  if (
    s === norm(MIRROR_HEADLINE_ABSTRACTION_BALANCE) ||
    s === norm(MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT)
  ) {
    return -28;
  }

  // Highest-priority directional abstraction movement and directional abstraction dominance.
  if (
    s === norm(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL) ||
    s === norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER) ||
    s === norm(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) ||
    s === norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS)
  ) {
    return 34;
  }

  // Named recurrence should remain near the top.
  if (s.includes(MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER)) {
    return 30;
  }

  // Medium-priority cadence movement.
  if (
    s === norm(MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS) ||
    s === norm(MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN) ||
    s === norm(MIRROR_HEADLINE_CADENCE_ALTERNATION)
  ) {
    return 18;
  }

  // Medium-priority hesitation / qualification patterns.
  if (
    s === norm(MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER) ||
    s === norm(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING) ||
    s === norm(MIRROR_HEADLINE_HESITATION_REVISED)
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

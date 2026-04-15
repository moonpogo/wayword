import { MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA } from "../constants/selectionThresholds.js";
import type { MirrorCategoryV1, MirrorReflectionCandidate } from "../types/mirrorTypes.js";
import { mirrorStatementSpecificity } from "./statementSpecificity.js";

/**
 * When rank scores are tied within the near-delta window, prefer categories that should
 * not lose to middling cadence (cadence gets the lowest preference).
 */
function categoryTiePreference(category: MirrorCategoryV1): number {
  if (category === "abstraction_concrete" || category === "hesitation_qualification") return 3;
  if (category === "repetition") return 2;
  if (category === "cadence") return 0;
  return 1;
}

export function compareRanked(a: MirrorReflectionCandidate, b: MirrorReflectionCandidate): number {
  const d = b.rankScore - a.rankScore;
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

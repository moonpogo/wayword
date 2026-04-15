import type { MirrorCategoryV1, MirrorReflectionCandidate } from "../types/mirrorTypes.js";

const CATEGORY_ORDER: MirrorCategoryV1[] = [
  "repetition",
  "abstraction_concrete",
  "cadence",
  "hesitation_qualification"
];

/** Stable ordering by internal score (desc), then fixed category order. */
export function rankReflections(candidates: MirrorReflectionCandidate[]): MirrorReflectionCandidate[] {
  return [...candidates].sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  });
}

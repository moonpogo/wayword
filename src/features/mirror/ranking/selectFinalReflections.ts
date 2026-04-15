import {
  MIRROR_SELECTION_MAX_SUPPORTING,
  MIRROR_SELECTION_MIN_RANK_SCORE_FOR_MAIN,
  MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT
} from "../constants/selectionThresholds.js";
import type {
  MirrorCategoryV1,
  MirrorPipelineResult,
  MirrorReflectionCandidate,
  MirrorReflectionRole,
  MirrorSelectedReflection
} from "../types/mirrorTypes.js";

function asSelected(
  c: MirrorReflectionCandidate,
  role: MirrorReflectionRole
): MirrorSelectedReflection {
  return {
    id: c.id,
    category: c.category,
    statement: c.statement,
    evidence: [...c.evidence],
    role,
    rankScore: c.rankScore
  };
}

/**
 * Picks up to one main (when the top candidate clears the main floor) and up to four supporting
 * cards. Supporting does not require a main: weak top + stronger others yields `main: null` with
 * supporting only. At most one card per category; never more than five cards total; no filler.
 */
export function selectFinalReflections(
  rankedDeduped: MirrorReflectionCandidate[]
): MirrorPipelineResult {
  if (rankedDeduped.length === 0) {
    return { main: null, supporting: [] };
  }

  const supportEligible = rankedDeduped.filter(
    (c) => c.rankScore >= MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT
  );

  if (supportEligible.length === 0) {
    return { main: null, supporting: [] };
  }

  const best = rankedDeduped[0]!;
  const supporting: MirrorSelectedReflection[] = [];
  const used = new Set<MirrorCategoryV1>();

  if (best.rankScore >= MIRROR_SELECTION_MIN_RANK_SCORE_FOR_MAIN) {
    const main = asSelected(best, "main");
    used.add(best.category);

    for (const c of rankedDeduped.slice(1)) {
      if (supporting.length >= MIRROR_SELECTION_MAX_SUPPORTING) break;
      if (used.has(c.category)) continue;
      if (c.rankScore < MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT) continue;
      supporting.push(asSelected(c, "support"));
      used.add(c.category);
    }

    return { main, supporting };
  }

  for (const c of supportEligible) {
    if (supporting.length >= MIRROR_SELECTION_MAX_SUPPORTING) break;
    if (used.has(c.category)) continue;
    supporting.push(asSelected(c, "support"));
    used.add(c.category);
  }

  return { main: null, supporting };
}

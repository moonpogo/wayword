import { MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA } from "../constants/selectionThresholds.js";
import { MIRROR_RECENT_MAX_TRENDS_TOTAL } from "./types.js";
import type {
  MirrorRecentTrend,
  MirrorRecentTrendCandidate,
  MirrorRecentTrendCategory,
  MirrorRecentTrendsResult
} from "./types.js";

function candidateToTrend(c: MirrorRecentTrendCandidate): MirrorRecentTrend {
  return {
    id: c.id,
    category: c.category,
    statement: c.statement,
    evidence: c.evidence
  };
}

/**
 * When `rankScore` is within `MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA`, prefer categories
 * with a more specific headline (named lemma → habit line → broad register).
 */
function categorySpecificityTieOrder(category: MirrorRecentTrendCategory): number {
  switch (category) {
    case "recent_lexical_anchor":
      return 0;
    case "recent_hesitation_qualification":
      return 1;
    case "recent_abstraction_lean":
      return 2;
    default:
      return 9;
  }
}

/**
 * Picks up to `MIRROR_RECENT_MAX_TRENDS_TOTAL` trends, at most one per category, highest rank first.
 */
export function selectRecentTrends(
  candidates: ReadonlyArray<MirrorRecentTrendCandidate>
): MirrorRecentTrendsResult {
  if (candidates.length === 0) return { trends: [] };

  const sorted = [...candidates]
    .map((c, inputIndex) => ({ c, inputIndex }))
    .sort((a, b) => {
      const d = b.c.rankScore - a.c.rankScore;
      if (Math.abs(d) <= MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA) {
        const spec =
          categorySpecificityTieOrder(a.c.category) - categorySpecificityTieOrder(b.c.category);
        if (spec !== 0) return spec;
      }
      if (d !== 0) return d;
      const cat = a.c.category.localeCompare(b.c.category);
      if (cat !== 0) return cat;
      return a.inputIndex - b.inputIndex;
    })
    .map(({ c }) => c);

  const seen = new Set<string>();
  const trends: MirrorRecentTrend[] = [];
  for (const c of sorted) {
    if (seen.has(c.category)) continue;
    seen.add(c.category);
    trends.push(candidateToTrend(c));
    if (trends.length >= MIRROR_RECENT_MAX_TRENDS_TOTAL) break;
  }

  return { trends };
}

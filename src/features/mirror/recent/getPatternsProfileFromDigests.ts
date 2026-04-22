import { runPatternsFromDigests } from "../patterns/runPatternsFromDigests.js";
import type { PatternCardCandidateV1 } from "../patterns/types.js";
import { buildReflectiveProfile } from "./buildReflectiveProfile.js";
import type { MirrorRecentTrend, MirrorSessionDigest, PatternsProfileFromDigestsResult } from "./types.js";

export {
  MIRROR_PROMOTION_THRESHOLD_HITS,
  MIRROR_PROMOTION_WINDOW_QUALIFYING,
  sliceLastQualifyingMirrorDigests
} from "../patterns/analysis/qualifyingDigests.js";

function candidateToMirrorRecentTrend(c: PatternCardCandidateV1): MirrorRecentTrend {
  const category =
    c.family === "recurring_signal"
      ? "pattern_recurring_signal"
      : c.family === "shift_over_time"
        ? "pattern_shift_over_time"
        : "pattern_consistency_vs_variation";
  return {
    id: c.id,
    category,
    statement: c.statement,
    evidence: [...c.evidence]
  };
}

/**
 * Patterns V1: digest-only cross-run cards plus optional reflective profile line.
 */
export function getPatternsProfileFromDigests(
  digests: ReadonlyArray<MirrorSessionDigest>
): PatternsProfileFromDigestsResult {
  const selection = runPatternsFromDigests(digests);
  const promotedPatterns = selection.cards.map(candidateToMirrorRecentTrend);
  /** Single-card layout: headline already carries the line; avoid duplicating it as a profile summary. */
  const profile =
    promotedPatterns.length > 1 ? buildReflectiveProfile([...promotedPatterns]) : null;
  return {
    promotedPatterns,
    profile,
    qualifyingRunCount: selection.qualifyingRunCount,
    patternsEmptyState: selection.emptyState
  };
}

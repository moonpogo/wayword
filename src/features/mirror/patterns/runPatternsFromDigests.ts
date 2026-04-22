import type { MirrorSessionDigest } from "../recent/types.js";
import { detectConsistencyVariationCandidates } from "./analysis/consistencyVariation.js";
import { normalizeMirrorSessionDigest } from "./analysis/normalizeDigest.js";
import { detectRecurringSignalCandidates } from "./analysis/recurringSignal.js";
import { sortQualifyingMirrorDigestsChronological } from "./analysis/qualifyingDigests.js";
import { detectShiftOverTimeCandidates } from "./analysis/shiftOverTime.js";
import { rankAndSelectPatternCards } from "./ranking/rankAndSelect.js";
import type { PatternCardCandidateV1, PatternsV1SelectionResult } from "./types.js";

/**
 * Deterministic Patterns V1: digest-only aggregation, no LLM, no session mirror cards.
 */
export function runPatternsFromDigests(digests: ReadonlyArray<MirrorSessionDigest>): PatternsV1SelectionResult {
  const qualifying = sortQualifyingMirrorDigestsChronological(digests).map(normalizeMirrorSessionDigest);
  const n = qualifying.length;
  if (n <= 2) {
    return rankAndSelectPatternCards(n, []);
  }

  const recurring = detectRecurringSignalCandidates(qualifying);
  const shift = detectShiftOverTimeCandidates(qualifying);
  const consistency = detectConsistencyVariationCandidates(qualifying);
  const merged: PatternCardCandidateV1[] = [...recurring, ...shift, ...consistency];
  return rankAndSelectPatternCards(n, merged);
}

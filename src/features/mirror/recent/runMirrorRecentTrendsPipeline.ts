import { aggregateRecentDigests } from "./aggregateRecentDigests.js";
import { buildRecentTrendCandidates } from "./buildRecentTrendCandidates.js";
import { sliceLastQualifyingMirrorDigests } from "./getPatternsProfileFromDigests.js";
import { selectRecentTrends } from "./selectRecentTrends.js";
import type { MirrorRecentTrendsResult, MirrorSessionDigest } from "./types.js";

const MIN_QUALIFYING_SESSIONS = 4;

/**
 * Cross-session recent trends (V1.1). Uses `mirrorSessionDigest` fields only (no V1 card history).
 * Aggregates the same last qualifying digest window as pattern promotion (`sliceLastQualifyingMirrorDigests`).
 */
export function runMirrorRecentTrendsPipeline(
  digests: ReadonlyArray<MirrorSessionDigest>
): MirrorRecentTrendsResult {
  const qualifying = sliceLastQualifyingMirrorDigests(digests);
  if (qualifying.length < MIN_QUALIFYING_SESSIONS) {
    return { trends: [] };
  }

  const aggregate = aggregateRecentDigests(qualifying);
  const candidates = buildRecentTrendCandidates(aggregate);
  return selectRecentTrends(candidates);
}

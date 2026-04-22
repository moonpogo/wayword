import type { MirrorSessionDigest } from "../../recent/types.js";

/** Last N qualifying digests considered for recent-trends windowing (unchanged contract). */
export const MIRROR_PROMOTION_WINDOW_QUALIFYING = 8;

/**
 * Legacy digest-window promotion threshold (pre–Patterns V1). Retained for public bundle exports.
 * Patterns V1 uses per-family gates inside `src/features/mirror/patterns/`.
 */
export const MIRROR_PROMOTION_THRESHOLD_HITS = 5;

/**
 * Qualifying digests sorted oldest → newest (`v === 1`, `qualifiesForRecent`).
 */
export function sortQualifyingMirrorDigestsChronological(
  digests: ReadonlyArray<MirrorSessionDigest>
): ReadonlyArray<MirrorSessionDigest> {
  return digests.filter((d) => d.v === 1 && d.qualifiesForRecent).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Newest slice of up to `MIRROR_PROMOTION_WINDOW_QUALIFYING` qualifying digests.
 * Shared by recent-trends aggregation and legacy pattern promotion windowing.
 */
export function sliceLastQualifyingMirrorDigests(
  digests: ReadonlyArray<MirrorSessionDigest>
): ReadonlyArray<MirrorSessionDigest> {
  const qualifying = sortQualifyingMirrorDigestsChronological(digests);
  if (qualifying.length === 0) return [];
  const n = qualifying.length;
  const start = Math.max(0, n - MIRROR_PROMOTION_WINDOW_QUALIFYING);
  return qualifying.slice(start);
}

import type { MirrorRecentTrendsResult, MirrorSessionDigest } from "./types.js";

/**
 * Cross-session recent trends (V1.1). Phase 1: stub — aggregation and candidates come later.
 */
export function runMirrorRecentTrendsPipeline(
  _digests: ReadonlyArray<MirrorSessionDigest>
): MirrorRecentTrendsResult {
  return { trends: [] };
}

import { analyzeText } from "../analysis/analyzeText.js";
import { MIRROR_GEN_MIN_WORDS_FOR_ANY } from "../constants/generationThresholds.js";
import type { MirrorSessionInput } from "../types/mirrorTypes.js";
import type { MirrorSessionDigest } from "./types.js";

const DIGEST_TOP_REPEATED_WORDS_MAX = 5;

function digestTimestampMs(input: MirrorSessionInput): number {
  if (typeof input.endedAt === "number" && Number.isFinite(input.endedAt)) {
    return input.endedAt;
  }
  if (typeof input.startedAt === "number" && Number.isFinite(input.startedAt)) {
    return input.startedAt;
  }
  return Date.now();
}

/**
 * Deterministic digest for cross-session Mirror logic. Always returns a digest;
 * use `qualifiesForRecent` to gate aggregation.
 */
export function buildMirrorSessionDigest(input: MirrorSessionInput): MirrorSessionDigest {
  const features = analyzeText(input);
  const qualifiesForRecent = features.wordCount >= MIRROR_GEN_MIN_WORDS_FOR_ANY;

  return {
    v: 1,
    sessionId: features.sessionId,
    timestamp: digestTimestampMs(input),
    qualifiesForRecent,
    wordCount: features.wordCount,
    topRepeatedWords: features.topRepeatedWords.slice(0, DIGEST_TOP_REPEATED_WORDS_MAX).map((e) => ({
      word: e.word,
      count: e.count
    })),
    abstraction: {
      abstractCount: features.abstractionProfile.abstractCount,
      concreteCount: features.abstractionProfile.concreteCount,
      abstractConcreteRatio: features.abstractionProfile.abstractConcreteRatio
    },
    hesitation: {
      qualifierCount: features.hesitationProfile.qualifierCount,
      pivotCount: features.hesitationProfile.pivotCount,
      contradictionMarkers: features.hesitationProfile.contradictionMarkers,
      uncertaintyMarkers: features.hesitationProfile.uncertaintyMarkers
    }
  };
}

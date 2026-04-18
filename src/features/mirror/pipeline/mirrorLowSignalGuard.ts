import {
  MIRROR_LOW_SIGNAL_MAX_WORDS_EXCLUSIVE,
  MIRROR_LOW_SIGNAL_STRUCTURE_MIN_WORDS
} from "../constants/generationThresholds.js";
import { MIRROR_HEADLINE_LOW_SIGNAL } from "../constants/mirrorSessionHeadlines.js";
import type { MirrorFeatures, MirrorPipelineResult, MirrorSelectedReflection } from "../types/mirrorTypes.js";

/**
 * True when the session text is too thin for rule-based mirror headlines: skip generation,
 * ranking, dedupe, and the poetic `fallback` headline.
 */
export function mirrorFeaturesAreLowSignal(features: MirrorFeatures): boolean {
  if (features.wordCount < MIRROR_LOW_SIGNAL_MAX_WORDS_EXCLUSIVE) return true;
  if (features.sentenceCount < 2 && features.wordCount < MIRROR_LOW_SIGNAL_STRUCTURE_MIN_WORDS) {
    return true;
  }
  return false;
}

export function buildLowSignalMirrorPipelineResult(sessionId: string): MirrorPipelineResult {
  const main: MirrorSelectedReflection = {
    id: `low_signal:${sessionId}`,
    category: "low_signal",
    statement: MIRROR_HEADLINE_LOW_SIGNAL,
    evidence: [],
    role: "main",
    rankScore: 0
  };
  return { main, supporting: [] };
}

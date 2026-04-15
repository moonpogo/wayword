import { analyzeText } from "../analysis/analyzeText.js";
import { buildReflectionCandidates } from "../generation/buildReflectionCandidates.js";
import { dedupeReflections } from "../ranking/dedupeReflections.js";
import { rankReflections } from "../ranking/rankReflections.js";
import { selectFinalReflections } from "../ranking/selectFinalReflections.js";
import type { MirrorPipelineResult, MirrorSessionInput } from "../types/mirrorTypes.js";
import { normalizeText } from "../utils/normalizeText.js";

export function runMirrorPipeline(input: MirrorSessionInput): MirrorPipelineResult {
  const features = analyzeText(input);
  const raw = buildReflectionCandidates(features, normalizeText(input.text));
  const ranked = rankReflections(raw);
  const deduped = dedupeReflections(ranked);
  return selectFinalReflections(deduped);
}

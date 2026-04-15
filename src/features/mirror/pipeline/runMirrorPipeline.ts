import { analyzeText } from "../analysis/analyzeText.js";
import { generateReflections } from "../generation/generateReflections.js";
import { dedupeReflections } from "../ranking/dedupeReflections.js";
import { rankReflections } from "../ranking/rankReflections.js";
import type { MirrorPipelineResult, MirrorSessionInput } from "../types/mirrorTypes.js";

export function runMirrorPipeline(input: MirrorSessionInput): MirrorPipelineResult {
  const features = analyzeText(input);
  const ranked = rankReflections(features);
  const deduped = dedupeReflections(ranked);
  return generateReflections(deduped);
}

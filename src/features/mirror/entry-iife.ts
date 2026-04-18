/**
 * Browser bundle entry: exposes Mirror V1 + V1.1 helpers for `script.js`.
 * Build: `npm run build:mirror` → `mirror-engine.iife.js`
 */
export { runMirrorPipeline } from "./pipeline/runMirrorPipeline.js";
export { buildMirrorSessionDigest } from "./recent/buildMirrorSessionDigest.js";
export { buildReflectiveProfile } from "./recent/buildReflectiveProfile.js";
export { getPatternsProfileFromDigests } from "./recent/getPatternsProfileFromDigests.js";
export { runMirrorRecentTrendsPipeline } from "./recent/runMirrorRecentTrendsPipeline.js";
export {
  MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION,
  MIRROR_NEXT_PASS_LOW_SIGNAL_FALLBACK,
  nextPassInstructionFromMirrorPipelineResult
} from "./nudges/nextPassInstruction.js";

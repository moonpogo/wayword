/**
 * Browser bundle entry: exposes Mirror V1 + V1.1 helpers for `script.js`.
 * Build: `npm run build:mirror` → `mirror-engine.iife.js`
 */
export { runMirrorPipeline } from "./pipeline/runMirrorPipeline.js";
export { buildMirrorSessionDigest } from "./recent/buildMirrorSessionDigest.js";
export { runMirrorRecentTrendsPipeline } from "./recent/runMirrorRecentTrendsPipeline.js";

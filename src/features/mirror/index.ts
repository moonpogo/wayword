export type {
  MirrorAbstractionExtraction,
  MirrorAbstractionProfile,
  MirrorCadenceExtraction,
  MirrorCadenceProfile,
  MirrorCategoryV1,
  MirrorEvidence,
  MirrorFeatures,
  MirrorHesitationExtraction,
  MirrorHesitationProfile,
  MirrorPipelineResult,
  MirrorReflection,
  MirrorRepetitionExtraction,
  MirrorSessionInput
} from "./types/mirrorTypes.js";

export { MIRROR_ABSTRACT_WORDS } from "./constants/abstractWords.js";
export { MIRROR_CONCRETE_WORDS } from "./constants/concreteWords.js";
export {
  MIRROR_CONTRADICTION_MARKER_WORDS,
  MIRROR_HESITATION_WORDS,
  MIRROR_PIVOT_WORDS,
  MIRROR_QUALIFIER_WORDS,
  MIRROR_UNCERTAINTY_WORDS
} from "./constants/hesitationWords.js";
export { MIRROR_STOPWORDS } from "./constants/stopwords.js";
export {
  MIRROR_ABSTRACTION_SHIFT_RATIO,
  MIRROR_CADENCE_MIN_SENTENCES_FOR_END_SHAPE,
  MIRROR_END_COMPRESSION_RATIO,
  MIRROR_END_EXPANSION_RATIO,
  MIRROR_LONG_SENTENCE_MIN_WORDS,
  MIRROR_MIN_TOKEN_LENGTH,
  MIRROR_REPETITION_MIN_COUNT,
  MIRROR_REPETITION_TOP_N,
  MIRROR_SHORT_SENTENCE_MAX_WORDS
} from "./constants/thresholds.js";

export { analyzeText } from "./analysis/analyzeText.js";
export { extractAbstraction } from "./analysis/extractAbstraction.js";
export { extractCadence } from "./analysis/extractCadence.js";
export { extractHesitation } from "./analysis/extractHesitation.js";
export { extractRepetition } from "./analysis/extractRepetition.js";

export { generateReflections } from "./generation/generateReflections.js";
export { MIRROR_REFLECTION_TEMPLATES } from "./generation/reflectionTemplates.js";

export { dedupeReflections } from "./ranking/dedupeReflections.js";
export { rankReflections } from "./ranking/rankReflections.js";

export { normalizeText } from "./utils/normalizeText.js";
export { resolveMirrorSessionId } from "./utils/mirrorSessionId.js";
export { splitSentences } from "./utils/splitSentences.js";
export { tokenizeText } from "./utils/tokenizeText.js";

export { runMirrorPipeline } from "./pipeline/runMirrorPipeline.js";

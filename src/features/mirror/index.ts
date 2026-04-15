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
  MirrorReflectionCandidate,
  MirrorReflectionRole,
  MirrorSelectedReflection,
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
export {
  MIRROR_SELECTION_MAX_SUPPORTING,
  MIRROR_SELECTION_MIN_RANK_SCORE_FOR_MAIN,
  MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT,
  MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA
} from "./constants/selectionThresholds.js";
export {
  MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT,
  MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS,
  MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG,
  MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT,
  MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE,
  MIRROR_GEN_CADENCE_MIN_SENTENCES,
  MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS,
  MIRROR_GEN_HESITATION_MIN_TOTAL,
  MIRROR_GEN_MIN_WORDS_FOR_ANY,
  MIRROR_GEN_REPETITION_DULL_WORDS,
  MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN,
  MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT,
  MIRROR_GEN_REPETITION_TOP_MIN_COUNT
} from "./constants/generationThresholds.js";
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

export {
  buildReflectionCandidates,
  buildReflectionCandidates as generateReflectionCandidates
} from "./generation/buildReflectionCandidates.js";
export { MIRROR_REFLECTION_TEMPLATE_RULES_DOC } from "./generation/reflectionTemplates.js";

export { dedupeReflections } from "./ranking/dedupeReflections.js";
export { rankReflections, compareRanked } from "./ranking/rankReflections.js";
export { selectFinalReflections } from "./ranking/selectFinalReflections.js";
export { mirrorStatementSpecificity } from "./ranking/statementSpecificity.js";

export { normalizeText } from "./utils/normalizeText.js";
export { resolveMirrorSessionId } from "./utils/mirrorSessionId.js";
export { splitSentences } from "./utils/splitSentences.js";
export { tokenizeText } from "./utils/tokenizeText.js";

export { runMirrorPipeline } from "./pipeline/runMirrorPipeline.js";

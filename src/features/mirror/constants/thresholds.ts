/** Tunable numeric gates for deterministic extraction (V1). */

/** Minimum token length (after lowercasing) to count in repetition / lexicon stats. */
export const MIRROR_MIN_TOKEN_LENGTH = 3;

/** Max distinct repeated words returned (sorted by count, then word). */
export const MIRROR_REPETITION_TOP_N = 8;

/** Minimum occurrences to appear in repetition top list. */
export const MIRROR_REPETITION_MIN_COUNT = 2;

/** Sentence length (words) at or below this counts as “short”. */
export const MIRROR_SHORT_SENTENCE_MAX_WORDS = 7;

/** Sentence length (words) at or above this counts as “long”. */
export const MIRROR_LONG_SENTENCE_MIN_WORDS = 18;

/** Minimum sentences required before quarter means and end flags are computed. */
export const MIRROR_CADENCE_MIN_SENTENCES_FOR_END_SHAPE = 6;

/**
 * Last-quarter mean must be below this fraction of the first-quarter mean to set endCompression.
 */
export const MIRROR_END_COMPRESSION_RATIO = 0.68;

/**
 * Last-quarter mean must be above this fraction of the first-quarter mean to set endExpansion.
 */
export const MIRROR_END_EXPANSION_RATIO = 1.34;

/**
 * Second-half lexicon hit rate must exceed first-half by this factor to set a shift flag
 * (separate rates for abstract vs concrete lexicons).
 */
export const MIRROR_ABSTRACTION_SHIFT_RATIO = 1.32;

/**
 * Second-half rate must exceed first-half by at least this absolute amount (per-token density)
 * in addition to the shift ratio factor, so weak half-over-half bumps do not qualify.
 */
export const MIRROR_ABSTRACTION_SHIFT_MIN_RATE_DELTA = 0.015;

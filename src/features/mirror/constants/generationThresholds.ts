/**
 * Minimum material and signal floors for emitting a category candidate.
 * Below these, that category is skipped (fewer candidates, no filler).
 */

/**
 * Low-signal guard (pipeline): below this tokenizer word count, skip headline selection and
 * emit `MIRROR_HEADLINE_LOW_SIGNAL` instead of category lines or the soft fallback headline.
 */
export const MIRROR_LOW_SIGNAL_MAX_WORDS_EXCLUSIVE = 8;

/**
 * When there is only one sentence segment and word count is still below this, treat as
 * insufficient structure for mirror headlines (same low-signal path as word floor).
 */
export const MIRROR_LOW_SIGNAL_STRUCTURE_MIN_WORDS = 24;

/** Minimum tokenizer words before any reflection category is considered. */
export const MIRROR_GEN_MIN_WORDS_FOR_ANY = 32;

/** Minimum count for the top repeated word to emit repetition (non-dull, length above short cap). */
export const MIRROR_GEN_REPETITION_TOP_MIN_COUNT = 4;

/**
 * Repeated lemmas this length or below need a higher count before they can surface
 * under a named-word headline (dulls generic short words).
 */
export const MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN = 4;

/** Minimum count for a short (≤ max len) top word to count for repetition at all. */
export const MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT = 6;

/** Lemmas treated as low-signal: skipped for repetition cards unless a stronger named lemma appears later in the top list. */
export const MIRROR_GEN_REPETITION_DULL_WORDS: ReadonlySet<string> = new Set([
  "thing",
  "things",
  "stuff",
  "something",
  "anything",
  "nothing",
  "way",
  "ways",
  "kind",
  "sort",
  "time",
  "life",
  "world",
  "people",
  "person",
  "moment",
  "day",
  "night",
  "hand",
  "back",
  "place",
  "room",
  "door"
]);

/** Minimum sentences before any cadence candidate (end shape or alternation) is considered. */
export const MIRROR_GEN_CADENCE_MIN_SENTENCES = 5;

/** Opening lens: minimum sentences before first/last quarter means exist (matches cadence quarter gates). */
export const MIRROR_GEN_OPENING_MIN_SENTENCES = 6;

/** Opening “slow start” line: first-quarter mean sentence length (words) and vs last-quarter ratio. */
export const MIRROR_GEN_OPENING_LONG_FIRST_Q = 14;
export const MIRROR_GEN_OPENING_MOMENT_RATIO = 1.18;

/** Opening “loose then settles”: variance floor and first quarter longer than last. */
export const MIRROR_GEN_OPENING_MIN_VARIANCE_LOOSE = 24;
export const MIRROR_GEN_OPENING_LOOSE_RATIO = 1.08;
export const MIRROR_GEN_OPENING_LOOSE_FIRSTQ_MIN = 10;

/** Opening “direct”: short opening quarter, not longer than the close. */
export const MIRROR_GEN_OPENING_DIRECT_MAX_FIRST_Q = 10;
export const MIRROR_GEN_OPENING_DIRECT_LAST_RATIO = 1.05;

/** Shift lens: minimum lexicon hits when a sole half-session shift flag is set. */
export const MIRROR_GEN_SHIFT_MIN_LEX = 4;

/** Minimum short-sentence count for the alternation headline (with long count + variance floor). */
export const MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT = 3;

/** Minimum long-sentence count for the alternation headline. */
export const MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG = 2;

/** Minimum sentence-length variance required before the alternation headline can fire. */
export const MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE = 20;

/** Minimum combined abstract + concrete lexicon hits for a density-only abstraction line. */
export const MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL = 4;

/**
 * Abstraction-only: allow evaluation below `MIRROR_GEN_MIN_WORDS_FOR_ANY` when the passage is
 * short but lexicon signal is strongly idea-lean (does not affect other categories).
 */
export const MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS = 26;
export const MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT = 4;
export const MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO = 2.25;
export const MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE = 1;

/** Minimum combined hits for a single-shift movement line. */
export const MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT = 6;

/**
 * Minimum abstract lexicon hits (for abstract shift) or concrete hits (for concrete shift)
 * before a directional half-session shift headline may emit.
 */
export const MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT = 5;

/** Ratio floor for calling the balance “mostly ideas” in the headline (density branch). */
export const MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO = 1.35;

/** Ratio ceiling (inverse) for calling the balance “mostly concrete” in the headline. */
export const MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO = 1.35;

/** Softer idea-lean density gate (below strict idea-lean ratio). */
export const MIRROR_GEN_ABSTRACTION_SOFT_IDEA_LEAN_RATIO = 1.12;

/** Minimum total hesitation-lexicon hits across buckets. */
export const MIRROR_GEN_HESITATION_MIN_TOTAL = 8;

/** Minimum hesitation hits per 100 tokenizer words (secondary gate when total is below min total). */
export const MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS = 2;

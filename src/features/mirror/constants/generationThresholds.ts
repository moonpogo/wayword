/**
 * Minimum material and signal floors for emitting a category candidate.
 * Below these, that category is skipped (fewer candidates, no filler).
 */

/** Minimum tokenizer words before any reflection category is considered. */
export const MIRROR_GEN_MIN_WORDS_FOR_ANY = 28;

/** Minimum count for the top repeated word to emit repetition (non-dull, length above short cap). */
export const MIRROR_GEN_REPETITION_TOP_MIN_COUNT = 3;

/**
 * Repeated lemmas this length or below need a higher count before they can surface
 * under a named-word headline (dulls generic short words).
 */
export const MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN = 4;

/** Minimum count for a short (≤ max len) top word to count for repetition at all. */
export const MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT = 5;

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

/** Minimum short-sentence count for the alternation headline (with long count + variance floor). */
export const MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT = 3;

/** Minimum long-sentence count for the alternation headline. */
export const MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG = 2;

/** Minimum sentence-length variance required before the alternation headline can fire. */
export const MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE = 16;

/** Minimum combined abstract + concrete lexicon hits for a density-only abstraction line. */
export const MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL = 3;

/**
 * Abstraction-only: allow evaluation below `MIRROR_GEN_MIN_WORDS_FOR_ANY` when the passage is
 * short but lexicon signal is strongly idea-lean (does not affect other categories).
 */
export const MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS = 24;
export const MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT = 3;
export const MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO = 2;
export const MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE = 1;

/** Minimum combined hits for a single-shift movement line. */
export const MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT = 3;

/** Ratio floor for calling the balance “mostly ideas” in the headline (density branch). */
export const MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO = 1.28;

/** Ratio ceiling (inverse) for calling the balance “mostly concrete” in the headline. */
export const MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO = 1.28;

/** Minimum total hesitation-lexicon hits across buckets. */
export const MIRROR_GEN_HESITATION_MIN_TOTAL = 6;

/** Minimum hesitation hits per 100 tokenizer words (secondary gate when total is below min total). */
export const MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS = 1.5;

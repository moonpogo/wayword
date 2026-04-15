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

/** Lemmas treated as low-signal for named-word lines; still eligible for the generic recurrence line at higher totals. */
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

/** Minimum sentences before cadence candidates (shape or spread) are considered. */
export const MIRROR_GEN_CADENCE_MIN_SENTENCES = 3;

/** Minimum sentence-length variance to read rhythm as uneven (no “variance” in headline). */
export const MIRROR_GEN_CADENCE_MIN_VARIANCE = 14;

/** At or below this variance, with enough sentences, rhythm reads as even. */
export const MIRROR_GEN_CADENCE_EVEN_MAX_VARIANCE = 6;

/** Minimum combined abstract + concrete lexicon hits for a density-only line. */
export const MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL = 5;

/** Minimum combined hits for a single-shift movement line. */
export const MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT = 3;

/** Ratio floor for calling the balance “mostly ideas” in the headline (density branch). */
export const MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO = 1.35;

/** Ratio ceiling (inverse) for calling the balance “mostly concrete” in the headline. */
export const MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO = 1.35;

/** Minimum total hesitation-lexicon hits across buckets. */
export const MIRROR_GEN_HESITATION_MIN_TOTAL = 4;

/** Minimum hesitation hits per 100 tokenizer words (secondary gate when total is below min total). */
export const MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS = 1.25;

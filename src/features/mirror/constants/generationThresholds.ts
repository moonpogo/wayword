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

/**
 * Repetition-only short override: still below `MIRROR_GEN_MIN_WORDS_FOR_ANY`, but enough
 * sentences + surface area that a strong named recurrence is unlikely to be noise.
 * 20 words: MIX-01-style tight pages that sit just under the old 22-word band.
 */
export const MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_WORDS = 20;
export const MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SENTENCES = 3;
/** Minimum share of tokenizer words taken by the chosen lemma count (e.g. 4/27 ≈ 0.15). */
export const MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SHARE = 0.11;

/**
 * Short override only: minimum lemma count for a **named** headline when the lemma is
 * length-gated “low signal” but not in the dull bucket (MIX-01 triple “fine”).
 * Non–low-signal lemmas still use `MIRROR_GEN_REPETITION_TOP_MIN_COUNT` in `tryRepetition`.
 */
export const MIRROR_GEN_REPETITION_SHORT_OVERRIDE_NAMED_MIN_COUNT = 3;

/**
 * Hesitation-only short override: phrase-level hedges (not full lexicon) can qualify when the
 * global 32-word floor would block an otherwise clear qualification pattern.
 */
export const MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_WORDS = 22;
export const MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_SENTENCES = 2;
export const MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_PHRASE_HITS = 2;
export const MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_TOTAL = 5;
export const MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_PER100 = 2;

/**
 * Long-text hesitation: allow sparse lex totals to be augmented by high-precision revision
 * phrases only when total lexicon hits stay at or below this ceiling (avoids double-counting
 * when hesitation is already lexicon-strong).
 */
export const MIRROR_GEN_HESITATION_PHRASE_AUGMENT_MAX_TOTAL_LEX = 3;
export const MIRROR_GEN_HESITATION_PHRASE_AUGMENT_MIN_PHRASE_HITS = 2;

/**
 * Cadence: when exactly four sentences, half-over-half mean length ratio is used only if
 * sentence-length variance already shows real structure (blocks flat four-liners).
 */
export const MIRROR_GEN_CADENCE_FOUR_SENTENCE_MIN_VARIANCE = 32;

/**
 * Sparse concrete-image bridge: when lexicon totals stay below `MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL`
 * but at least one sentence co-locates multiple concrete lemmas and abstraction stays empty.
 * Tight word band avoids long passages where two stray hits would overclaim; min words keeps
 * list-like / one-token-per-line dumps out.
 */
export const MIRROR_GEN_CONCRETE_SCENE_MIN_WORDS = 30;
export const MIRROR_GEN_CONCRETE_SCENE_MAX_WORDS = 42;
export const MIRROR_GEN_CONCRETE_SCENE_MIN_SENTENCES = 3;
export const MIRROR_GEN_CONCRETE_SCENE_MIN_LEX = 2;
export const MIRROR_GEN_CONCRETE_SCENE_MIN_PER_SENTENCE = 2;

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
  /** Filler / discourse marker; avoid named-repetition wins on casual “like” stacks (EDGE-04). */
  "like",
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

/**
 * Sole abstract half-shift with lex signal but abstract lemma count below `MIN_SIDE_FOR_SHIFT`:
 * still emit BACK_HALF when ratio is not concrete-dominated (MIX-02: scene → theory with thin
 * abstract lexicon counts).
 */
export const MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_LEX = 4;
export const MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_ABSTRACT = 2;
export const MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_RATIO = 0.85;

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

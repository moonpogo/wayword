/**
 * Lexicon buckets for hesitation / qualification signals (token equality, lowercased).
 * Lists are intentionally small; extend in one place.
 */

export const MIRROR_QUALIFIER_WORDS: readonly string[] = [
  "almost",
  "basically",
  "maybe",
  "fairly",
  "generally",
  "kind",
  "largely",
  "mostly",
  "nearly",
  "partially",
  "perhaps",
  "possibly",
  "probably",
  "quite",
  "rather",
  "relatively",
  "roughly",
  "seems",
  "appears",
  "somewhat",
  "sort",
  "usually",
  "might",
  "could",
  "would"
];

export const MIRROR_PIVOT_WORDS: readonly string[] = [
  "although",
  "besides",
  "conversely",
  "furthermore",
  "hence",
  "however",
  "meanwhile",
  "moreover",
  "nevertheless",
  "nonetheless",
  "otherwise",
  "still",
  "therefore",
  "though",
  "thus",
  "yet"
];

export const MIRROR_CONTRADICTION_MARKER_WORDS: readonly string[] = [
  "cannot",
  "contrary",
  "couldn't",
  "despite",
  "didn't",
  "doesn't",
  "instead",
  "neither",
  "never",
  "nor",
  "unlikely",
  "unlike",
  "wasn't",
  "weren't"
];

export const MIRROR_UNCERTAINTY_WORDS: readonly string[] = [
  "arguably",
  "guess",
  "guessing",
  "presumably",
  "seemingly",
  "supposedly",
  "unclear",
  "uncertain",
  "unknown",
  "unsure"
];

/** @deprecated Use MIRROR_QUALIFIER_WORDS; kept for callers that imported the old name. */
export const MIRROR_HESITATION_WORDS: readonly string[] = MIRROR_QUALIFIER_WORDS;

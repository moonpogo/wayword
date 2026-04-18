/**
 * Single source of truth for per-session mirror reflection headline strings
 * (pipeline: buildReflectionCandidates → rankReflections → statementSpecificity).
 * Dedupe still keys on normalized statement text in dedupeReflections.ts.
 */

/** Same normalization as historically used in ranking / specificity (trim, lower, collapse spaces). */
export function normMirrorReflectionHeadline(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Substring shared by all named-repetition headlines; rank/specificity match on this fragment. */
export const MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER = "returns several times on the page";

/** When no category clears selection floors: one soft, observational line (not diagnostic). */
export const MIRROR_HEADLINE_FALLBACK_SOFT = "It stays on one line the whole way through.";

/** Very short / thin-structure submissions: plain capacity line (not an error, not poetic). */
export const MIRROR_HEADLINE_LOW_SIGNAL = "Not enough here to notice a pattern yet.";

export function mirrorHeadlineRepetitionNamed(word: string): string {
  return `\u201c${word}\u201d ${MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER}.`;
}

/** Cadence */
export const MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS = "The ending tightens noticeably.";
export const MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN = "Lines lengthen near the end.";
export const MIRROR_HEADLINE_CADENCE_ALTERNATION = "Short and long lines trade places.";

/** Opening (first-quarter sentence length vs rest; mutually gated vs strong cadence cards). */
export const MIRROR_HEADLINE_OPENING_DIRECT = "It opens directly.";
export const MIRROR_HEADLINE_OPENING_MOMENT =
  "The opening takes a moment before anything lands.";
export const MIRROR_HEADLINE_OPENING_LOOSE = "It starts loose before settling.";

/** Shift (half-session lean flagged, below abstraction movement headline bars). */
export const MIRROR_HEADLINE_SHIFT_TURNS = "It turns partway through.";
export const MIRROR_HEADLINE_SHIFT_HOLDS = "The direction shifts once, then holds.";
export const MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER = "It starts one way, then leans another.";

/** Abstraction / concrete */
export const MIRROR_HEADLINE_ABSTRACTION_BALANCE = "Ideas and concrete detail stay in balance.";
export const MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL =
  "The back half leans more conceptual than scene-based.";
export const MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER = "Concrete detail carries more of the later passages.";
export const MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE = "It leans more on ideas than on what can be seen.";
export const MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS = "Concrete detail carries more than the ideas here.";
export const MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT = "Both idea-words and image-words appear frequently.";

/** Hesitation / qualification */
export const MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER =
  "A statement appears, then softens right after.";
export const MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING = "Assertions are often followed by softening.";
export const MIRROR_HEADLINE_HESITATION_REVISED = "Statements are often revised or softened.";

/** Headlines treated as generic fallbacks for specificity tie-breaks (subset of session headlines). */
export const MIRROR_HEADLINE_GENERIC_FALLBACK_SET_MEMBERS = [
  MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT,
  MIRROR_HEADLINE_ABSTRACTION_BALANCE,
  MIRROR_HEADLINE_HESITATION_REVISED
] as const;

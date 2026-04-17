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
export const MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER = "returns several times in this draft";

export function mirrorHeadlineRepetitionNamed(word: string): string {
  return `\u201c${word}\u201d ${MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER}.`;
}

/** Cadence */
export const MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS = "The ending tightens noticeably.";
export const MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN = "Lines lengthen near the end.";
export const MIRROR_HEADLINE_CADENCE_ALTERNATION = "The cadence alternates between short and long lines.";

/** Abstraction / concrete */
export const MIRROR_HEADLINE_ABSTRACTION_BALANCE = "Ideas and concrete detail stay in balance.";
export const MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL =
  "The back half leans more conceptual than scene-based.";
export const MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER = "Concrete detail carries more of the later passages.";
export const MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE = "Ideas dominate over concrete detail.";
export const MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS = "Concrete detail outweighs abstraction.";
export const MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT = "Both idea-words and image-words appear frequently.";

/** Hesitation / qualification */
export const MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER =
  "Statements are often qualified just after they\u2019re made.";
export const MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING = "Assertions are often followed by softening.";
export const MIRROR_HEADLINE_HESITATION_REVISED = "Statements are often revised or softened.";

/** Headlines treated as generic fallbacks for specificity tie-breaks (subset of session headlines). */
export const MIRROR_HEADLINE_GENERIC_FALLBACK_SET_MEMBERS = [
  MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT,
  MIRROR_HEADLINE_ABSTRACTION_BALANCE,
  MIRROR_HEADLINE_HESITATION_REVISED
] as const;

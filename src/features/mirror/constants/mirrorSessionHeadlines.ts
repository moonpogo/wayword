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

/**
 * When no category clears selection floors: one soft, observational line (not diagnostic).
 * Variants share one reflection family (`fallback:steady_line`) and are chosen by session id.
 */
export const MIRROR_HEADLINE_FALLBACK_SOFT_VARIANTS = [
  "It stays on one line the whole way through.",
  "The shape stays steady from start to finish.",
  "Line length stays even the whole way through.",
  "It holds a single, even line across the piece.",
  "Sentence length barely shifts from line to line."
] as const;

/** Back-compat alias; prefer `pickMirrorFallbackSoftStatement` at selection time. */
export const MIRROR_HEADLINE_FALLBACK_SOFT = MIRROR_HEADLINE_FALLBACK_SOFT_VARIANTS[0];

function hashSessionSalt(sessionId: string, salt: string): number {
  const s = `${sessionId}|${salt}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic variant pick so repeat sessions do not always show the same fallback sentence. */
export function pickMirrorFallbackSoftStatement(sessionId: string): string {
  const idx = hashSessionSalt(sessionId, "mirrorFallbackSoft") % MIRROR_HEADLINE_FALLBACK_SOFT_VARIANTS.length;
  return MIRROR_HEADLINE_FALLBACK_SOFT_VARIANTS[idx]!;
}

const FALLBACK_SOFT_NORM_SET = new Set(
  MIRROR_HEADLINE_FALLBACK_SOFT_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
);

export function isMirrorFallbackSoftStatement(statement: string): boolean {
  return FALLBACK_SOFT_NORM_SET.has(normMirrorReflectionHeadline(statement));
}

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
export const MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS = [
  "Ideas and concrete detail stay in balance.",
  "Abstract language and concrete detail hold about the same weight."
] as const;

export const MIRROR_HEADLINE_ABSTRACTION_BALANCE = MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS[0];

export function pickMirrorAbstractionBalanceStatement(sessionId: string): string {
  const idx =
    hashSessionSalt(sessionId, "abstractionBalance") % MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS.length;
  return MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS[idx]!;
}

const ABSTRACTION_BALANCE_NORM_SET = new Set(
  MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
);

export function isMirrorAbstractionBalanceStatement(statement: string): boolean {
  return ABSTRACTION_BALANCE_NORM_SET.has(normMirrorReflectionHeadline(statement));
}

export const MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS = [
  "Both idea-words and image-words appear frequently.",
  "Idea language and image language both show up often."
] as const;

export const MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT = MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS[0];

export function pickMirrorAbstractionBothFrequentStatement(sessionId: string): string {
  const idx =
    hashSessionSalt(sessionId, "abstractionBothFrequent") %
    MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS.length;
  return MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS[idx]!;
}

const ABSTRACTION_BOTH_FREQUENT_NORM_SET = new Set(
  MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
);

export function isMirrorAbstractionBothFrequentStatement(statement: string): boolean {
  return ABSTRACTION_BOTH_FREQUENT_NORM_SET.has(normMirrorReflectionHeadline(statement));
}

export const MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL =
  "The back half leans more conceptual than scene-based.";
export const MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER = "Concrete detail carries more of the later passages.";
export const MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE = "It leans more on ideas than on what can be seen.";
export const MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS = "Concrete detail carries more than the ideas here.";

/** Hesitation / qualification */
export const MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER =
  "A statement appears, then softens right after.";
export const MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING = "Assertions are often followed by softening.";
export const MIRROR_HEADLINE_HESITATION_REVISED = "Statements are often revised or softened.";

/** Headlines treated as generic fallbacks for specificity tie-breaks (subset of session headlines). */
export const MIRROR_HEADLINE_GENERIC_FALLBACK_SET_MEMBERS = [
  ...MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS,
  ...MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS,
  MIRROR_HEADLINE_HESITATION_REVISED
] as const;

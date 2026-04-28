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
export const MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER = "returns.";

/**
 * When no category clears selection floors: one soft, observational line (not diagnostic).
 * Variants share one reflection family (`fallback:steady_line`) and are chosen by session id.
 *
 * Single-sentence drafts (including one long sentence above the low-signal structure floor) use
 * structure-true lines. Multi-sentence drafts use pattern-absence lines so we do not imply a
 * measured cadence read when nothing qualified.
 */
export const MIRROR_HEADLINE_FALLBACK_SOFT_SINGLE_SENTENCE_VARIANTS = [
  "One sentence holds the span.",
  "Still a single line."
] as const;

export const MIRROR_HEADLINE_FALLBACK_SOFT_MULTI_SENTENCE_VARIANTS = [
  "No pattern resolves yet.",
  "Still flat on the meter.",
  "Nothing dominant enough to name."
] as const;

/** Retired cadence-shaped fallbacks — still recognized for `isMirrorFallbackSoftStatement`. */
const MIRROR_HEADLINE_FALLBACK_SOFT_LEGACY_VARIANTS = [
  "The shape stays steady from start to finish.",
  "Line length stays even the whole way through.",
  "It holds a single, even line across the piece.",
  "Sentence length barely shifts from line to line."
] as const;

/** Union of active + legacy strings (for dedupe / nudge routing compatibility). */
export const MIRROR_HEADLINE_FALLBACK_SOFT_VARIANTS = [
  ...MIRROR_HEADLINE_FALLBACK_SOFT_SINGLE_SENTENCE_VARIANTS,
  ...MIRROR_HEADLINE_FALLBACK_SOFT_MULTI_SENTENCE_VARIANTS,
  ...MIRROR_HEADLINE_FALLBACK_SOFT_LEGACY_VARIANTS
] as const;

/** Back-compat alias; prefer `pickMirrorFallbackSoftStatement` at selection time. */
export const MIRROR_HEADLINE_FALLBACK_SOFT = MIRROR_HEADLINE_FALLBACK_SOFT_SINGLE_SENTENCE_VARIANTS[0];

export function hashSessionSalt(sessionId: string, salt: string): number {
  const s = `${sessionId}|${salt}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Deterministic variant pick so repeat sessions do not always show the same fallback sentence.
 * Pass `sentenceCount` from `MirrorFeatures` so one-sentence spans do not get multi-sentence
 * cadence-shaped fallbacks.
 */
export function pickMirrorFallbackSoftStatement(sessionId: string, sentenceCount?: number | null): string {
  const sc = typeof sentenceCount === "number" && Number.isFinite(sentenceCount) ? sentenceCount : 2;
  if (sc <= 1) {
    const pool = MIRROR_HEADLINE_FALLBACK_SOFT_SINGLE_SENTENCE_VARIANTS;
    const idx = hashSessionSalt(sessionId, "mirrorFallbackSoft|single") % pool.length;
    return pool[idx]!;
  }
  const pool = MIRROR_HEADLINE_FALLBACK_SOFT_MULTI_SENTENCE_VARIANTS;
  const idx = hashSessionSalt(sessionId, "mirrorFallbackSoft|multi") % pool.length;
  return pool[idx]!;
}

const FALLBACK_SOFT_NORM_SET = new Set(
  MIRROR_HEADLINE_FALLBACK_SOFT_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
);

export function isMirrorFallbackSoftStatement(statement: string): boolean {
  return FALLBACK_SOFT_NORM_SET.has(normMirrorReflectionHeadline(statement));
}

/** Very short / thin-structure submissions (standard). */
export const MIRROR_HEADLINE_LOW_SIGNAL_SURFACE = "Signal is thin. Add surface.";

/** Monastic / bonsai headline experiment: low-signal line (reversible via `mirrorBonsaiHeadlinesActive`). */
export const MIRROR_HEADLINE_LOW_SIGNAL_CONTINUE = "Signal is thin. Continue.";

/** Default export name kept for bundles expecting `MIRROR_HEADLINE_LOW_SIGNAL`. */
export const MIRROR_HEADLINE_LOW_SIGNAL = MIRROR_HEADLINE_LOW_SIGNAL_SURFACE;

/** Unified monastic hesitation headline when bonsai mode is on. */
export const MIRROR_HEADLINE_HESITATION_BONSAI_MONASTIC = "Assertion bends.";

/** Optional supporting pressure line (repetition-adjacent, rare). */
export const MIRROR_HEADLINE_REPETITION_GENERIC_PRESSURE = "A single word is doing too much work.";

export function mirrorHeadlineRepetitionNamed(word: string): string {
  return `\u201c${word}\u201d returns.`;
}

/** Cadence */
export const MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS = "The ending compresses.";
export const MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN = "The ending opens.";
export const MIRROR_HEADLINE_CADENCE_ALTERNATION = "Short and long lines trade places.";

/** Opening (first-quarter sentence length vs rest; mutually gated vs strong cadence cards). */
export const MIRROR_HEADLINE_OPENING_DIRECT = "The first move lands immediately.";
export const MIRROR_HEADLINE_OPENING_MOMENT = "The first move delays impact.";
export const MIRROR_HEADLINE_OPENING_LOOSE = "The opening widens before it commits.";

/** Shift (half-session lean flagged, below abstraction movement headline bars). */
export const MIRROR_HEADLINE_SHIFT_TURNS = "The piece pivots once, then stabilizes.";
export const MIRROR_HEADLINE_SHIFT_HOLDS = "The piece pivots once, then stabilizes.";
export const MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER = "The piece pivots once, then stabilizes.";

/** Abstraction / concrete */
export const MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS = ["Ideas and scene hold balance."] as const;

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
  "Ideas and scene both keep surfacing.",
  "Idea language and image language both recur."
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
export const MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE = "Ideas outweigh scene.";
export const MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS = "Scene outweighs ideas.";

/** Hesitation / qualification — qualified-after family (session-picked for copy variety). */
export const MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS = [
  "Stated; then softened in the same breath.",
  "Claim, then pullback.",
  "Statement; immediate qualifier."
] as const;

export const MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER =
  MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS[0];

export function pickMirrorHesitationQualifiedAfterStatement(
  sessionId: string,
  fingerprint = ""
): string {
  const pool = MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS;
  const key = fingerprint ? `${sessionId}|${fingerprint}` : sessionId;
  const idx = hashSessionSalt(key, "hesitationQualifiedAfter") % pool.length;
  return pool[idx]!;
}

const HESITATION_QUALIFIED_AFTER_NORM_SET = new Set(
  MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
);

export function isMirrorHesitationQualifiedAfterStatement(statement: string): boolean {
  return HESITATION_QUALIFIED_AFTER_NORM_SET.has(normMirrorReflectionHeadline(statement));
}

export const MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING = "Assertion is followed by softening.";

/** General / revised-softening family (session-picked). */
export const MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS = [
  "The line revises itself before landing.",
  "Emphasis shifts mid-sentence.",
  "The sentence adjusts its own force."
] as const;

export const MIRROR_HEADLINE_HESITATION_REVISED = MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS[0];

export function pickMirrorHesitationRevisedGeneralStatement(sessionId: string, fingerprint = ""): string {
  const pool = MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS;
  const key = fingerprint ? `${sessionId}|${fingerprint}` : sessionId;
  const idx = hashSessionSalt(key, "hesitationRevisedGeneral") % pool.length;
  return pool[idx]!;
}

const HESITATION_REVISED_FAMILY_NORM_SET = new Set(
  MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
);

export function isMirrorHesitationRevisedFamilyStatement(statement: string): boolean {
  return HESITATION_REVISED_FAMILY_NORM_SET.has(normMirrorReflectionHeadline(statement));
}

/** Hesitation headlines that use the standard hesitation nudge pool in `nextPassInstruction`. */
export function isMirrorHesitationStandardNudgeStatement(statement: string): boolean {
  const n = normMirrorReflectionHeadline(statement);
  return (
    HESITATION_QUALIFIED_AFTER_NORM_SET.has(n) ||
    HESITATION_REVISED_FAMILY_NORM_SET.has(n) ||
    n === normMirrorReflectionHeadline(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING) ||
    n === normMirrorReflectionHeadline(MIRROR_HEADLINE_HESITATION_BONSAI_MONASTIC)
  );
}

/** Headlines treated as generic fallbacks for specificity tie-breaks (subset of session headlines). */
export const MIRROR_HEADLINE_GENERIC_FALLBACK_SET_MEMBERS = [
  ...MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS,
  ...MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS,
  ...MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS
] as const;

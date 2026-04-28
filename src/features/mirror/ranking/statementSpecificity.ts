/**
 * Deterministic specificity tiers for ranking tie-breaks and dedupe tie-breaks.
 * Higher = more text-grounded / less generic fallback (does not change `rankScore` on candidates).
 */

import {
  MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS,
  MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE,
  MIRROR_HEADLINE_CADENCE_ALTERNATION,
  MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS,
  MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN,
  isMirrorFallbackSoftStatement,
  MIRROR_HEADLINE_OPENING_DIRECT,
  MIRROR_HEADLINE_OPENING_LOOSE,
  MIRROR_HEADLINE_OPENING_MOMENT,
  MIRROR_HEADLINE_SHIFT_HOLDS,
  MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER,
  MIRROR_HEADLINE_SHIFT_TURNS,
  MIRROR_HEADLINE_GENERIC_FALLBACK_SET_MEMBERS,
  MIRROR_HEADLINE_LOW_SIGNAL,
  MIRROR_HEADLINE_LOW_SIGNAL_CONTINUE,
  MIRROR_HEADLINE_LOW_SIGNAL_SURFACE,
  MIRROR_HEADLINE_REPETITION_GENERIC_PRESSURE,
  MIRROR_HEADLINE_HESITATION_BONSAI_MONASTIC,
  MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING,
  isMirrorHesitationQualifiedAfterStatement,
  isMirrorHesitationRevisedFamilyStatement,
  MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER,
  normMirrorReflectionHeadline
} from "../constants/mirrorSessionHeadlines.js";

const GENERIC_FALLBACK_STATEMENTS = new Set(
  MIRROR_HEADLINE_GENERIC_FALLBACK_SET_MEMBERS.map((h) => normMirrorReflectionHeadline(h))
);

function norm(s: string): string {
  return normMirrorReflectionHeadline(s);
}

/**
 * Returns 0–100; higher breaks ties toward more specific, less boilerplate headlines.
 */
export function mirrorStatementSpecificity(statement: string): number {
  const n = norm(statement);
  if (isMirrorFallbackSoftStatement(statement)) return 5;
  if (
    n === norm(MIRROR_HEADLINE_LOW_SIGNAL) ||
    n === norm(MIRROR_HEADLINE_LOW_SIGNAL_SURFACE) ||
    n === norm(MIRROR_HEADLINE_LOW_SIGNAL_CONTINUE)
  ) {
    return 6;
  }
  if (GENERIC_FALLBACK_STATEMENTS.has(n)) return 20;

  // Named recurrence should beat most non-directional observations.
  if (n.includes(MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER)) return 100;
  if (n === norm(MIRROR_HEADLINE_REPETITION_GENERIC_PRESSURE)) return 62;

  // Directional abstraction movement should lead when present.
  if (
    n === norm(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL) ||
    n === norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER)
  ) {
    return 110;
  }

  // Strong directional cadence changes remain high, but below directional abstraction.
  if (n === norm(MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS) || n === norm(MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN)) {
    return 90;
  }
  if (n === norm(MIRROR_HEADLINE_CADENCE_ALTERNATION)) return 84;

  if (
    n === norm(MIRROR_HEADLINE_OPENING_DIRECT) ||
    n === norm(MIRROR_HEADLINE_OPENING_MOMENT) ||
    n === norm(MIRROR_HEADLINE_OPENING_LOOSE)
  ) {
    return 86;
  }
  if (
    n === norm(MIRROR_HEADLINE_SHIFT_TURNS) ||
    n === norm(MIRROR_HEADLINE_SHIFT_HOLDS) ||
    n === norm(MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER)
  ) {
    return 86;
  }

  // Non-shift directional abstraction beats generic mixed states.
  if (
    n === norm(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) ||
    n === norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS)
  ) {
    return 82;
  }

  if (isMirrorHesitationQualifiedAfterStatement(statement)) return 58;
  if (n === norm(MIRROR_HEADLINE_HESITATION_BONSAI_MONASTIC)) return 57;
  if (n === norm(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING)) return 56;
  if (isMirrorHesitationRevisedFamilyStatement(statement)) return 40;

  return 40;
}

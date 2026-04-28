import {
  MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL,
  MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS,
  MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS,
  MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE,
  MIRROR_HEADLINE_CADENCE_ALTERNATION,
  MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS,
  MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN,
  MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING,
  MIRROR_HEADLINE_HESITATION_BONSAI_MONASTIC,
  MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS,
  MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS,
  MIRROR_HEADLINE_OPENING_DIRECT,
  MIRROR_HEADLINE_OPENING_LOOSE,
  MIRROR_HEADLINE_OPENING_MOMENT,
  MIRROR_HEADLINE_SHIFT_HOLDS,
  MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER,
  MIRROR_HEADLINE_SHIFT_TURNS,
  MIRROR_HEADLINE_REPETITION_GENERIC_PRESSURE,
  normMirrorReflectionHeadline
} from "../constants/mirrorSessionHeadlines.js";
import type { MirrorReflection, MirrorReflectionCandidate } from "../types/mirrorTypes.js";

function norm(s: string): string {
  return normMirrorReflectionHeadline(s);
}

const NORM_TO_FAMILY: Record<string, string> = {
  [norm(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL)]: "abstraction:back_half_conceptual",
  [norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER)]: "abstraction:concrete_later",
  [norm(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE)]: "abstraction:ideas_dominate",
  [norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS)]: "abstraction:concrete_outweighs",
  [norm(MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS)]: "cadence:ending_tightens",
  [norm(MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN)]: "cadence:lines_lengthen",
  [norm(MIRROR_HEADLINE_CADENCE_ALTERNATION)]: "cadence:alternation",
  [norm(MIRROR_HEADLINE_OPENING_DIRECT)]: "opening:direct",
  [norm(MIRROR_HEADLINE_OPENING_MOMENT)]: "opening:moment",
  [norm(MIRROR_HEADLINE_OPENING_LOOSE)]: "opening:loose",
  [norm(MIRROR_HEADLINE_SHIFT_TURNS)]: "shift:turns",
  [norm(MIRROR_HEADLINE_SHIFT_HOLDS)]: "shift:holds",
  [norm(MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER)]: "shift:leans_another",
  [norm(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING)]: "hesitation:assertions_softening",
  [norm(MIRROR_HEADLINE_HESITATION_BONSAI_MONASTIC)]: "hesitation:bonsai",
  [norm(MIRROR_HEADLINE_REPETITION_GENERIC_PRESSURE)]: "repetition:generic_pressure"
};

for (const line of MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS) {
  NORM_TO_FAMILY[norm(line)] = "hesitation:qualified_after";
}
for (const line of MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS) {
  NORM_TO_FAMILY[norm(line)] = "hesitation:revised";
}

for (const line of MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS) {
  NORM_TO_FAMILY[norm(line)] = "abstraction:balance";
}
for (const line of MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS) {
  NORM_TO_FAMILY[norm(line)] = "abstraction:both_frequent";
}

/**
 * Stable key for “reflection family” — suppresses repeats across runs even when phrasing varies
 * inside a category (e.g. fallback variants share one family).
 */
export function mirrorReflectionFamilyKey(
  reflection: Pick<MirrorReflection, "category" | "statement">
): string {
  const n = norm(reflection.statement);
  if (reflection.category === "fallback") {
    return "fallback:steady_line";
  }
  if (reflection.category === "low_signal") {
    return "low_signal";
  }
  if (reflection.category === "repetition") {
    if (n === norm(MIRROR_HEADLINE_REPETITION_GENERIC_PRESSURE)) {
      return "repetition:generic_pressure";
    }
    const m = reflection.statement.match(/\u201c([^\u201d]+)\u201d/i);
    const w = m ? norm(m[1] ?? "") : "";
    return w ? `repetition:named:${w}` : "repetition:named";
  }

  const mapped = NORM_TO_FAMILY[n];
  if (mapped) return mapped;

  return `${reflection.category}:${n}`;
}

export function mirrorCandidateFamilyKey(candidate: MirrorReflectionCandidate): string {
  return mirrorReflectionFamilyKey(candidate);
}

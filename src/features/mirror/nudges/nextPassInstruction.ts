import {
  MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL,
  MIRROR_HEADLINE_ABSTRACTION_BALANCE,
  MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS,
  MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE,
  MIRROR_HEADLINE_FALLBACK_SOFT,
  MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING,
  MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER,
  MIRROR_HEADLINE_HESITATION_REVISED,
  normMirrorReflectionHeadline
} from "../constants/mirrorSessionHeadlines.js";
import type { MirrorPipelineResult, MirrorSelectedReflection } from "../types/mirrorTypes.js";

/** Shown when the mirror stack is empty, load failed, or no category maps to a targeted nudge. */
export const MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION = "Write it again. Change one thing.";

function normStatement(s: string): string {
  return normMirrorReflectionHeadline(s);
}

function pickDriverReflection(result: MirrorPipelineResult): MirrorSelectedReflection | null {
  const main = result.main;
  if (main && String(main.statement || "").trim()) {
    return main;
  }
  const supporting = Array.isArray(result.supporting) ? result.supporting : [];
  const first = supporting.find((c) => c && String(c.statement || "").trim());
  return first ?? null;
}

/**
 * Deterministic “next pass” line from the published mirror stack only (category + headline text
 * matched to the same canonical strings generation uses). No draft re-analysis.
 */
export function nextPassInstructionFromMirrorPipelineResult(
  result: MirrorPipelineResult | null | undefined,
  loadFailed: boolean
): string {
  if (loadFailed || !result || typeof result !== "object") {
    return MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
  }

  const driver = pickDriverReflection(result);
  if (!driver) {
    return MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
  }

  const cat = driver.category;
  const n = normStatement(driver.statement);

  if (cat === "fallback" || n === normStatement(MIRROR_HEADLINE_FALLBACK_SOFT)) {
    return MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
  }

  if (cat === "repetition") {
    return "Avoid that word. Find another path.";
  }

  if (cat === "cadence") {
    return "Let the whole piece move like that.";
  }

  if (cat === "hesitation_qualification") {
    if (
      n === normStatement(MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER) ||
      n === normStatement(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING) ||
      n === normStatement(MIRROR_HEADLINE_HESITATION_REVISED)
    ) {
      return "Say it once. Don't soften it.";
    }
    return MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
  }

  if (cat === "abstraction_concrete") {
    if (
      n === normStatement(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) ||
      n === normStatement(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL)
    ) {
      return "Keep the idea. Anchor it in a scene.";
    }
    if (
      n === normStatement(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS) ||
      n === normStatement(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER)
    ) {
      return "Keep the scene. Let an idea surface.";
    }
    if (
      n === normStatement(MIRROR_HEADLINE_ABSTRACTION_BALANCE) ||
      n === normStatement(MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT)
    ) {
      return MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
    }
    return MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
  }

  return MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
}

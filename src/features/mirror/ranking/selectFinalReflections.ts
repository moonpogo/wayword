import {
  MIRROR_SELECTION_MAX_SUPPORTING,
  MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT
} from "../constants/selectionThresholds.js";
import {
  MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL,
  MIRROR_HEADLINE_ABSTRACTION_BALANCE,
  MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS,
  MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE,
  MIRROR_HEADLINE_FALLBACK_SOFT,
  MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER,
  normMirrorReflectionHeadline
} from "../constants/mirrorSessionHeadlines.js";
import type {
  MirrorCategoryV1,
  MirrorPipelineResult,
  MirrorReflectionCandidate,
  MirrorReflectionRole,
  MirrorSelectedReflection
} from "../types/mirrorTypes.js";

function asSelected(
  c: MirrorReflectionCandidate,
  role: MirrorReflectionRole
): MirrorSelectedReflection {
  return {
    id: c.id,
    category: c.category,
    statement: c.statement,
    evidence: [...c.evidence],
    role,
    rankScore: c.rankScore
  };
}

function norm(s: string): string {
  return normMirrorReflectionHeadline(s);
}

/**
 * Interpretive strength for choosing the single primary (lower = stronger).
 * Order: shift > dominance > repetition > cadence > hesitation > mixed/balance.
 */
function interpretiveStrengthTier(c: MirrorReflectionCandidate): number {
  if (c.category === "fallback" || c.category === "low_signal") {
    return 99;
  }
  const n = norm(c.statement);
  if (
    n === norm(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL) ||
    n === norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER)
  ) {
    return 0;
  }
  if (
    n === norm(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) ||
    n === norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS)
  ) {
    return 1;
  }
  if (c.category === "repetition" || n.includes(MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER)) {
    return 2;
  }
  if (c.category === "cadence" || c.category === "opening" || c.category === "shift") {
    return 3;
  }
  if (c.category === "hesitation_qualification") {
    return 4;
  }
  if (n === norm(MIRROR_HEADLINE_ABSTRACTION_BALANCE) || n === norm(MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT)) {
    return 5;
  }
  return 6;
}

function categoryTieOrder(cat: MirrorCategoryV1): number {
  if (cat === "abstraction_concrete") return 0;
  if (cat === "repetition") return 1;
  if (cat === "cadence") return 2;
  if (cat === "opening") return 3;
  if (cat === "shift") return 4;
  if (cat === "hesitation_qualification") return 5;
  if (cat === "fallback") return 6;
  if (cat === "low_signal") return 7;
  return 8;
}

function compareInterpretivePrimaryOrder(a: MirrorReflectionCandidate, b: MirrorReflectionCandidate): number {
  const ta = interpretiveStrengthTier(a);
  const tb = interpretiveStrengthTier(b);
  if (ta !== tb) return ta - tb;
  if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
  return categoryTieOrder(a.category) - categoryTieOrder(b.category);
}

function buildFallbackCandidate(sessionId: string): MirrorReflectionCandidate {
  return {
    id: `fallback:${sessionId}`,
    category: "fallback",
    statement: MIRROR_HEADLINE_FALLBACK_SOFT,
    evidence: [],
    rankScore: 0
  };
}

/**
 * Exactly one `main` line per run: strongest qualifying candidate (interpretive tier then
 * `rankScore`), or a soft fallback when none qualify. Supporting only when `supportsPrimary` is set.
 */
export function selectFinalReflections(
  rankedDeduped: MirrorReflectionCandidate[],
  sessionId: string
): MirrorPipelineResult {
  if (rankedDeduped.length === 0) {
    return { main: asSelected(buildFallbackCandidate(sessionId), "main"), supporting: [] };
  }

  const ordered = [...rankedDeduped].sort(compareInterpretivePrimaryOrder);

  const primary =
    ordered.find((c) => c.rankScore >= MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT) ?? null;

  const chosen = primary ?? buildFallbackCandidate(sessionId);
  const main = asSelected(chosen, "main");
  const supporting: MirrorSelectedReflection[] = [];
  const used = new Set<MirrorCategoryV1>([chosen.category]);

  for (const c of ordered) {
    if (supporting.length >= MIRROR_SELECTION_MAX_SUPPORTING) break;
    if (c === chosen) continue;
    if (used.has(c.category)) continue;
    if (!c.supportsPrimary) continue;
    if (c.rankScore < MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT) continue;
    supporting.push(asSelected(c, "support"));
    used.add(c.category);
  }

  return { main, supporting };
}

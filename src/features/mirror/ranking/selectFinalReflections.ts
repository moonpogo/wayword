import {
  MIRROR_SELECTION_MAX_SUPPORTING,
  MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT
} from "../constants/selectionThresholds.js";
import {
  MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS,
  MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE,
  MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER,
  isMirrorAbstractionBalanceStatement,
  isMirrorAbstractionBothFrequentStatement,
  normMirrorReflectionHeadline,
  pickMirrorFallbackSoftStatement
} from "../constants/mirrorSessionHeadlines.js";
import type {
  MirrorCategoryV1,
  MirrorPipelineResult,
  MirrorReflectionCandidate,
  MirrorReflectionRole,
  MirrorSelectedReflection
} from "../types/mirrorTypes.js";
import { mirrorCandidateFamilyKey } from "./reflectionFamilyKey.js";

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
  if (
    isMirrorAbstractionBalanceStatement(c.statement) ||
    isMirrorAbstractionBothFrequentStatement(c.statement)
  ) {
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

/** Penalties by recency slot: most recent prior run → older (index 3). */
const REFLECTION_RECENCY_PENALTY_BY_INDEX = [88, 64, 42, 24] as const;

function effectivePrimaryRank(
  c: MirrorReflectionCandidate,
  recentKeys: string[] | undefined,
  pool: MirrorReflectionCandidate[]
): number {
  const base = c.rankScore;
  if (!recentKeys?.length) return base;
  const fam = mirrorCandidateFamilyKey(c);
  const idx = recentKeys.indexOf(fam);
  if (idx < 0) return base;
  let penalty = REFLECTION_RECENCY_PENALTY_BY_INDEX[idx] ?? 14;
  const sortedByRaw = [...pool].sort((a, b) => b.rankScore - a.rankScore);
  const top = sortedByRaw[0];
  if (top && top.id === c.id && c.rankScore >= 85) {
    const second = sortedByRaw.find((x) => x.id !== c.id);
    if (!second || c.rankScore - second.rankScore >= 28) {
      penalty = Math.floor(penalty * 0.18);
    }
  }
  return base - penalty;
}

function buildCompareInterpretivePrimaryOrder(
  recentKeys: string[] | undefined,
  pool: MirrorReflectionCandidate[]
) {
  return (a: MirrorReflectionCandidate, b: MirrorReflectionCandidate): number => {
    const ta = interpretiveStrengthTier(a);
    const tb = interpretiveStrengthTier(b);
    if (ta !== tb) return ta - tb;
    const eb = effectivePrimaryRank(b, recentKeys, pool);
    const ea = effectivePrimaryRank(a, recentKeys, pool);
    if (eb !== ea) return eb - ea;
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    return categoryTieOrder(a.category) - categoryTieOrder(b.category);
  };
}

function buildFallbackCandidate(sessionId: string): MirrorReflectionCandidate {
  return {
    id: `fallback:${sessionId}`,
    category: "fallback",
    statement: pickMirrorFallbackSoftStatement(sessionId),
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
  sessionId: string,
  options?: { recentReflectionFamilyKeys?: string[] }
): MirrorPipelineResult {
  if (rankedDeduped.length === 0) {
    return { main: asSelected(buildFallbackCandidate(sessionId), "main"), supporting: [] };
  }

  const recentKeys = options?.recentReflectionFamilyKeys;
  const pool = rankedDeduped;
  const ordered = [...pool].sort(buildCompareInterpretivePrimaryOrder(recentKeys, pool));

  const primary =
    ordered.find(
      (c) =>
        effectivePrimaryRank(c, recentKeys, pool) >= MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT
    ) ?? null;

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

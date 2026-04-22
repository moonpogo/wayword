import type { PatternCardCandidateV1, PatternFamilyV1, PatternsV1SelectionResult } from "../types.js";

function maxCardsForRunCount(n: number): number {
  if (n <= 2) return 0;
  if (n <= 4) return 1;
  if (n <= 7) return 2;
  return 3;
}

function rankFloor(n: number): number {
  if (n <= 4) return 118;
  if (n <= 7) return 92;
  return 72;
}

function dedupeByKey(candidates: ReadonlyArray<PatternCardCandidateV1>): PatternCardCandidateV1[] {
  const best = new Map<string, PatternCardCandidateV1>();
  for (const c of candidates) {
    const prev = best.get(c.dedupeKey);
    if (!prev || c.rankScore > prev.rankScore || (c.rankScore === prev.rankScore && c.id.localeCompare(prev.id) < 0)) {
      best.set(c.dedupeKey, c);
    }
  }
  return [...best.values()];
}

function sortCandidates(a: PatternCardCandidateV1, b: PatternCardCandidateV1): number {
  if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
  return a.id.localeCompare(b.id);
}

/**
 * Dedupe by `dedupeKey`, apply a run-count floor, then greedily pick strongest distinct families up to cap.
 */
export function rankAndSelectPatternCards(
  qualifyingRunCount: number,
  candidates: ReadonlyArray<PatternCardCandidateV1>
): PatternsV1SelectionResult {
  if (qualifyingRunCount <= 2) {
    return {
      qualifyingRunCount,
      cards: [],
      emptyState: "insufficient_runs"
    };
  }

  const cap = maxCardsForRunCount(qualifyingRunCount);
  const floor = rankFloor(qualifyingRunCount);
  const filtered = dedupeByKey(candidates)
    .filter((c) => c.rankScore >= floor)
    .sort(sortCandidates);

  const picked: PatternCardCandidateV1[] = [];
  const usedFamilies = new Set<PatternFamilyV1>();
  for (const c of filtered) {
    if (picked.length >= cap) break;
    if (usedFamilies.has(c.family)) continue;
    if (picked.length > 0 && c.rankScore < 0.38 * picked[0]!.rankScore) {
      break;
    }
    usedFamilies.add(c.family);
    picked.push(c);
  }

  if (picked.length === 0) {
    return {
      qualifyingRunCount,
      cards: [],
      emptyState: "no_strong_pattern"
    };
  }

  return {
    qualifyingRunCount,
    cards: picked,
    emptyState: null
  };
}

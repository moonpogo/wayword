import { buildReflectiveProfile } from "./buildReflectiveProfile.js";
import type {
  MirrorRecentTrend,
  MirrorRecentTrendEvidence,
  MirrorSessionDigest,
  PatternsProfileFromDigestsResult
} from "./types.js";
import {
  MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL,
  MIRROR_GEN_REPETITION_DULL_WORDS,
  MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN,
  MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT,
  MIRROR_GEN_REPETITION_TOP_MIN_COUNT
} from "../constants/generationThresholds.js";

/** Last N qualifying digests considered for promotion (starting rule). */
export const MIRROR_PROMOTION_WINDOW_QUALIFYING = 8;

/** Minimum hits inside the window required to promote a category (starting rule). */
export const MIRROR_PROMOTION_THRESHOLD_HITS = 5;

function repetitionWordIsLowSignal(word: string): boolean {
  const w = word.toLowerCase();
  if (MIRROR_GEN_REPETITION_DULL_WORDS.has(w)) return true;
  if (w.length <= MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN) return true;
  return false;
}

function repetitionMeetsCountGate(word: string, count: number): boolean {
  if (repetitionWordIsLowSignal(word)) return count >= MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT;
  return count >= MIRROR_GEN_REPETITION_TOP_MIN_COUNT;
}

function lexicalWordCountsForSession(word: string, count: number): boolean {
  return repetitionMeetsCountGate(word, count) && !repetitionWordIsLowSignal(word);
}

function sessionAbstractIdeaLean(d: MirrorSessionDigest): boolean {
  const a = d.abstraction;
  const lex = a.abstractCount + a.concreteCount;
  if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return false;
  if (a.abstractCount < 2) return false;
  if (a.abstractConcreteRatio < MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO) return false;
  const concreteDominant =
    a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1) &&
    a.concreteCount >= 2;
  return !concreteDominant;
}

function sessionAbstractConcreteLean(d: MirrorSessionDigest): boolean {
  const a = d.abstraction;
  const lex = a.abstractCount + a.concreteCount;
  if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return false;
  if (a.concreteCount < 2) return false;
  const ideaLean =
    a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO && a.abstractCount >= 2;
  if (ideaLean) return false;
  return a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1);
}

function sessionQualifierPattern(d: MirrorSessionDigest): boolean {
  const q = d.hesitation.qualifierCount;
  const w = Math.max(d.wordCount, 1);
  const per100 = (q / w) * 100;
  if (q < 2) return false;
  if (q >= 3 && per100 >= 1.0) return true;
  return q >= 2 && per100 >= 1.5;
}

function promotedEvidence(): ReadonlyArray<MirrorRecentTrendEvidence> {
  return [{ text: "Recurrent across recent qualifying drafts." }];
}

/**
 * Newest slice of up to `MIRROR_PROMOTION_WINDOW_QUALIFYING` qualifying digests (`v === 1`,
 * `qualifiesForRecent`). Shared by recent-trends aggregation and pattern promotion.
 */
export function sliceLastQualifyingMirrorDigests(
  digests: ReadonlyArray<MirrorSessionDigest>
): ReadonlyArray<MirrorSessionDigest> {
  const qualifying = digests
    .filter((d) => d.v === 1 && d.qualifiesForRecent)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (qualifying.length === 0) return [];
  const n = qualifying.length;
  const start = Math.max(0, n - MIRROR_PROMOTION_WINDOW_QUALIFYING);
  return qualifying.slice(start);
}

function promoteLexicalFromWindow(window: ReadonlyArray<MirrorSessionDigest>): MirrorRecentTrend | null {
  type Agg = { displayWord: string; sessions: number; totalCount: number };
  const byKey = new Map<string, Agg>();

  for (const d of window) {
    const seenInDigest = new Set<string>();
    for (const row of d.topRepeatedWords) {
      const key = row.word.toLowerCase();
      if (seenInDigest.has(key)) continue;
      seenInDigest.add(key);
      if (!lexicalWordCountsForSession(row.word, row.count)) continue;
      let g = byKey.get(key);
      if (!g) {
        g = { displayWord: row.word, sessions: 0, totalCount: 0 };
        byKey.set(key, g);
      }
      g.sessions += 1;
      g.totalCount += row.count;
    }
  }

  let best: Agg | null = null;
  for (const g of byKey.values()) {
    if (g.sessions < MIRROR_PROMOTION_THRESHOLD_HITS) continue;
    if (
      !best ||
      g.sessions > best.sessions ||
      (g.sessions === best.sessions && g.totalCount > best.totalCount) ||
      (g.sessions === best.sessions && g.totalCount === best.totalCount && g.displayWord.localeCompare(best.displayWord) < 0)
    ) {
      best = g;
    }
  }

  if (!best) return null;
  const w = best.displayWord;
  return {
    id: `recent_lexical_anchor:${w}`,
    category: "recent_lexical_anchor",
    statement: `Across recent drafts, you return often to “${w}.”`,
    evidence: promotedEvidence()
  };
}

function promoteAbstractionFromWindow(window: ReadonlyArray<MirrorSessionDigest>): MirrorRecentTrend | null {
  let idea = 0;
  let concrete = 0;
  for (const d of window) {
    if (sessionAbstractIdeaLean(d)) idea += 1;
    else if (sessionAbstractConcreteLean(d)) concrete += 1;
  }
  if (idea < MIRROR_PROMOTION_THRESHOLD_HITS || idea <= concrete) return null;
  return {
    id: "recent_abstraction_lean:promoted",
    category: "recent_abstraction_lean",
    statement: "Across recent writing, your language leans more toward ideas than scenes.",
    evidence: promotedEvidence()
  };
}

function promoteHesitationFromWindow(window: ReadonlyArray<MirrorSessionDigest>): MirrorRecentTrend | null {
  let n = 0;
  for (const d of window) {
    if (sessionQualifierPattern(d)) n += 1;
  }
  if (n < MIRROR_PROMOTION_THRESHOLD_HITS) return null;
  return {
    id: "recent_hesitation_qualification:promoted",
    category: "recent_hesitation_qualification",
    statement: "Several recent drafts qualify a thought just after stating it.",
    evidence: promotedEvidence()
  };
}

function promoteRecentTrendsToPatternsFromWindow(
  window: ReadonlyArray<MirrorSessionDigest>
): MirrorRecentTrend[] {
  const out: MirrorRecentTrend[] = [];
  const lex = promoteLexicalFromWindow(window);
  if (lex) out.push(lex);
  const abs = promoteAbstractionFromWindow(window);
  if (abs) out.push(abs);
  const hes = promoteHesitationFromWindow(window);
  if (hes) out.push(hes);
  return out;
}

/**
 * Promotes strong recent signals (same per-session gates as recent trends) when they appear
 * in at least `MIRROR_PROMOTION_THRESHOLD_HITS` of the last `MIRROR_PROMOTION_WINDOW_QUALIFYING`
 * qualifying digests, then builds the reflective profile from those promoted rows.
 */
export function getPatternsProfileFromDigests(
  digests: ReadonlyArray<MirrorSessionDigest>
): PatternsProfileFromDigestsResult {
  const window = sliceLastQualifyingMirrorDigests(digests);
  const promotedPatterns = promoteRecentTrendsToPatternsFromWindow(window);
  const profile =
    promotedPatterns.length > 0 ? buildReflectiveProfile([...promotedPatterns]) : null;
  return { promotedPatterns, profile };
}

import {
  MIRROR_GEN_REPETITION_DULL_WORDS,
  MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN,
  MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT,
  MIRROR_GEN_REPETITION_TOP_MIN_COUNT
} from "../../constants/generationThresholds.js";
import type { PatternCardCandidateV1 } from "../types.js";
import { recurringLexicalEvidence, recurringQualificationEvidence } from "../generation/templates.js";
import type { NormalizedMirrorSessionDigest } from "./normalizeDigest.js";
import {
  sessionAbstractConcreteLean,
  sessionAbstractIdeaLean,
  sessionQualifierDensityPattern
} from "./sessionFlags.js";

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

function minSessionsRecurring(n: number): number {
  return Math.max(2, Math.ceil(0.55 * n));
}

type LexAgg = { displayWord: string; sessions: number; totalCount: number };

function aggregateLexical(window: ReadonlyArray<NormalizedMirrorSessionDigest>): Map<string, LexAgg> {
  const byKey = new Map<string, LexAgg>();
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
  return byKey;
}

function pickBestLexical(byKey: Map<string, LexAgg>, minSessions: number): LexAgg | null {
  let best: LexAgg | null = null;
  for (const g of byKey.values()) {
    if (g.sessions < minSessions) continue;
    if (
      !best ||
      g.sessions > best.sessions ||
      (g.sessions === best.sessions && g.totalCount > best.totalCount) ||
      (g.sessions === best.sessions &&
        g.totalCount === best.totalCount &&
        g.displayWord.localeCompare(best.displayWord) < 0)
    ) {
      best = g;
    }
  }
  return best;
}

/**
 * Recurring-signal family: lexical anchor, abstraction lean, concrete lean, qualification density.
 * Every branch requires at least two qualifying runs in-window (`minSessionsRecurring`).
 */
export function detectRecurringSignalCandidates(
  window: ReadonlyArray<NormalizedMirrorSessionDigest>
): PatternCardCandidateV1[] {
  const n = window.length;
  if (n < 2) return [];
  const minSessions = minSessionsRecurring(n);
  const out: PatternCardCandidateV1[] = [];

  const lexicalMap = aggregateLexical(window);
  const bestLex = pickBestLexical(lexicalMap, minSessions);
  if (bestLex) {
    const w = bestLex.displayWord;
    const score = bestLex.sessions * 1000 + bestLex.totalCount;
    out.push({
      family: "recurring_signal",
      id: `pattern_recurring_signal:lexical:${w.toLowerCase()}`,
      dedupeKey: "recurring:lexical",
      rankScore: score,
      statement: "One surface word keeps returning across saved drafts.",
      evidence: recurringLexicalEvidence(w, bestLex.sessions, n)
    });
  }

  let idea = 0;
  let concrete = 0;
  for (const d of window) {
    if (sessionAbstractIdeaLean(d)) idea += 1;
    else if (sessionAbstractConcreteLean(d)) concrete += 1;
  }
  if (idea >= minSessions && idea > concrete) {
    out.push({
      family: "recurring_signal",
      id: "pattern_recurring_signal:abstraction:idea_lean",
      dedupeKey: "recurring:abstraction_idea",
      rankScore: idea * 100 + (idea - concrete) * 10,
      statement: "Drafts here lean toward ideas over concrete detail.",
      evidence: [
        {
          text: `That tilt showed in ${idea} of ${n} saved drafts counted here, compared with ${concrete} drafts leaning the other way.`
        }
      ]
    });
  } else if (concrete >= minSessions && concrete > idea) {
    out.push({
      family: "recurring_signal",
      id: "pattern_recurring_signal:abstraction:concrete_lean",
      dedupeKey: "recurring:abstraction_concrete",
      rankScore: concrete * 100 + (concrete - idea) * 10,
      statement: "Drafts here lean toward concrete detail over abstract wording.",
      evidence: [
        {
          text: `That tilt showed in ${concrete} of ${n} saved drafts counted here, compared with ${idea} drafts leaning the other way.`
        }
      ]
    });
  }

  let qual = 0;
  for (const d of window) {
    if (sessionQualifierDensityPattern(d)) qual += 1;
  }
  if (qual >= minSessions) {
    out.push({
      family: "recurring_signal",
      id: "pattern_recurring_signal:hesitation:density",
      dedupeKey: "recurring:qualification_density",
      rankScore: qual * 95,
      statement: "Softening marks repeat across saved drafts.",
      evidence: recurringQualificationEvidence(qual, n)
    });
  }

  return out;
}

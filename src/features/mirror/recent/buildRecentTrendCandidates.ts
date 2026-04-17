import {
  MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL,
  MIRROR_GEN_REPETITION_DULL_WORDS,
  MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN,
  MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT,
  MIRROR_GEN_REPETITION_TOP_MIN_COUNT
} from "../constants/generationThresholds.js";
import type { MirrorRecentDigestsAggregate } from "./aggregateRecentDigests.js";
import type { MirrorRecentTrendCandidate, MirrorRecentTrendEvidence } from "./types.js";

const MIN_SESSIONS_FOR_LEXICAL_RECURRENCE = 3;
const MIN_SESSIONS_FOR_CROSS_SESSION_PATTERN = 3;

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

/** A session counts toward lexical recurrence only if the word clears the same gates as V1 named repetition. */
function lexicalWordCountsForSession(word: string, count: number): boolean {
  return repetitionMeetsCountGate(word, count) && !repetitionWordIsLowSignal(word);
}

function sessionAbstractIdeaLean(a: MirrorRecentDigestsAggregate["abstractionSessions"][number]): boolean {
  const lex = a.abstractCount + a.concreteCount;
  if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return false;
  if (a.abstractCount < 2) return false;
  if (a.abstractConcreteRatio < MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO) return false;
  const concreteDominant =
    a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1) &&
    a.concreteCount >= 2;
  return !concreteDominant;
}

function sessionAbstractConcreteLean(a: MirrorRecentDigestsAggregate["abstractionSessions"][number]): boolean {
  const lex = a.abstractCount + a.concreteCount;
  if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return false;
  if (a.concreteCount < 2) return false;
  const ideaLean =
    a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO && a.abstractCount >= 2;
  if (ideaLean) return false;
  return (
    a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1)
  );
}

function sessionQualifierPattern(h: MirrorRecentDigestsAggregate["hesitationSessions"][number]): boolean {
  const q = h.qualifierCount;
  const per100 = h.qualifiersPer100Words;
  if (q < 2) return false;
  if (q >= 3 && per100 >= 1.0) return true;
  return q >= 2 && per100 >= 1.5;
}

function evidenceLines(...lines: string[]): ReadonlyArray<MirrorRecentTrendEvidence> {
  return lines.map((text) => ({ text }));
}

/** Chronological order of sessions (digest sort order). */
function sessionChronoIndex(aggregate: MirrorRecentDigestsAggregate): Map<string, number> {
  const m = new Map<string, number>();
  aggregate.abstractionSessions.forEach((s, i) => m.set(s.sessionId, i));
  return m;
}

function tryLexicalCandidate(aggregate: MirrorRecentDigestsAggregate): MirrorRecentTrendCandidate | null {
  const gated = aggregate.lexicalWords
    .map((row) => {
      const hits = row.perSessionCounts.filter((p) => lexicalWordCountsForSession(row.word, p.count));
      const sessionIds = hits.map((h) => h.sessionId).sort((a, b) => a.localeCompare(b));
      const totalTopListCount = hits.reduce((s, h) => s + h.count, 0);
      return {
        word: row.word,
        sessionIds,
        perSessionCounts: hits,
        distinctSessionCount: hits.length,
        totalTopListCount
      };
    })
    .filter((row) => row.distinctSessionCount >= MIN_SESSIONS_FOR_LEXICAL_RECURRENCE);

  if (gated.length === 0) return null;

  gated.sort((a, b) => {
    if (b.distinctSessionCount !== a.distinctSessionCount) return b.distinctSessionCount - a.distinctSessionCount;
    if (b.totalTopListCount !== a.totalTopListCount) return b.totalTopListCount - a.totalTopListCount;
    return a.word.localeCompare(b.word);
  });

  const best = gated[0];
  const n = aggregate.qualifyingSessionCount;
  const rankScore = 42 + best.distinctSessionCount * 14 + Math.min(18, best.totalTopListCount);
  const statement = `“${best.word}” recurs across recent drafts.`;
  const chrono = sessionChronoIndex(aggregate);
  const ordered = [...best.perSessionCounts].sort(
    (a, b) => (chrono.get(a.sessionId) ?? 0) - (chrono.get(b.sessionId) ?? 0)
  );
  const parts = ordered.map((p) => `${p.count}×`).join(", ");
  const ev = evidenceLines(
    `Seen in ${best.distinctSessionCount} of the last ${n} qualifying drafts.`,
    `Recent counts: ${parts}.`
  );
  return {
    id: `recent_lexical_anchor:${best.word}`,
    category: "recent_lexical_anchor",
    statement,
    evidence: ev,
    rankScore
  };
}

function tryAbstractionCandidate(aggregate: MirrorRecentDigestsAggregate): MirrorRecentTrendCandidate | null {
  const sessions = aggregate.abstractionSessions;
  let ideaLean = 0;
  let concreteLean = 0;
  for (const s of sessions) {
    if (sessionAbstractIdeaLean(s)) ideaLean += 1;
    else if (sessionAbstractConcreteLean(s)) concreteLean += 1;
  }
  if (ideaLean < MIN_SESSIONS_FOR_CROSS_SESSION_PATTERN) return null;
  if (ideaLean <= concreteLean) return null;

  const n = aggregate.qualifyingSessionCount;
  const ratios = sessions.map((s) => s.abstractConcreteRatio);
  const meanRatio = ratios.reduce((a, b) => a + b, 0) / Math.max(ratios.length, 1);
  const rankScore = 48 + ideaLean * 11 + Math.min(14, meanRatio * 4);
  const statement = "Across recent drafts, language leans toward ideas over scenes.";
  const ev = evidenceLines(`Ideas over scenes in ${ideaLean} of the last ${n} qualifying drafts.`);
  return {
    id: "recent_abstraction_lean:aggregate",
    category: "recent_abstraction_lean",
    statement,
    evidence: ev,
    rankScore
  };
}

function tryHesitationCandidate(aggregate: MirrorRecentDigestsAggregate): MirrorRecentTrendCandidate | null {
  const sessions = aggregate.hesitationSessions;
  let qualPattern = 0;
  for (const s of sessions) {
    if (sessionQualifierPattern(s)) qualPattern += 1;
  }
  if (qualPattern < MIN_SESSIONS_FOR_CROSS_SESSION_PATTERN) return null;

  const n = aggregate.qualifyingSessionCount;
  const rankScore = 46 + qualPattern * 10;
  const statement = "Across recent drafts, statements are often qualified just after they appear.";
  const chrono = sessionChronoIndex(aggregate);
  const ordered = sessions
    .filter((s) => sessionQualifierPattern(s))
    .sort((a, b) => (chrono.get(a.sessionId) ?? 0) - (chrono.get(b.sessionId) ?? 0));
  const counts = ordered.map((s) => String(s.qualifierCount)).join(", ");
  const ev = evidenceLines(
    `Qualifier-heavy in ${qualPattern} of the last ${n} qualifying drafts.`,
    `Recent drafts: ${counts} qualifiers.`
  );
  return {
    id: "recent_hesitation_qualification:aggregate",
    category: "recent_hesitation_qualification",
    statement,
    evidence: ev,
    rankScore
  };
}

export function buildRecentTrendCandidates(
  aggregate: MirrorRecentDigestsAggregate
): MirrorRecentTrendCandidate[] {
  const out: MirrorRecentTrendCandidate[] = [];
  const lex = tryLexicalCandidate(aggregate);
  if (lex) out.push(lex);
  const abs = tryAbstractionCandidate(aggregate);
  if (abs) out.push(abs);
  const hes = tryHesitationCandidate(aggregate);
  if (hes) out.push(hes);
  return out;
}

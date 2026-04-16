import type { MirrorSessionDigest } from "./types.js";

/** One repeated lemma aggregated across qualifying sessions (digest top-list only). */
export interface MirrorRecentAggregatedLexicalWord {
  readonly word: string;
  /** Distinct qualifying sessions where the lemma appears in the digest `topRepeatedWords` list. */
  readonly sessionIds: ReadonlyArray<string>;
  /** Per-session counts from each session’s digest `topRepeatedWords` entry (max per session). */
  readonly perSessionCounts: ReadonlyArray<{ readonly sessionId: string; readonly count: number }>;
  readonly distinctSessionCount: number;
  /** Sum of counts across gated sessions (secondary signal only). */
  readonly totalTopListCount: number;
}

/** Deterministic cross-session rollup for recent-pattern trends (digest fields only). */
export interface MirrorRecentDigestsAggregate {
  readonly qualifyingSessionCount: number;
  readonly earliestTimestamp: number;
  readonly latestTimestamp: number;
  readonly lexicalWords: ReadonlyArray<MirrorRecentAggregatedLexicalWord>;
  readonly abstractionSessions: ReadonlyArray<{
    readonly sessionId: string;
    readonly timestamp: number;
    readonly abstractCount: number;
    readonly concreteCount: number;
    readonly abstractConcreteRatio: number;
    readonly wordCount: number;
  }>;
  readonly hesitationSessions: ReadonlyArray<{
    readonly sessionId: string;
    readonly timestamp: number;
    readonly qualifierCount: number;
    readonly qualifiersPer100Words: number;
    readonly wordCount: number;
  }>;
}

function sortedSessionIds(map: Map<string, number>): ReadonlyArray<string> {
  return [...map.keys()].sort((a, b) => a.localeCompare(b));
}

function perSessionCountsFromMap(map: Map<string, number>): ReadonlyArray<{ sessionId: string; count: number }> {
  return sortedSessionIds(map).map((sessionId) => ({ sessionId, count: map.get(sessionId) ?? 0 }));
}

/**
 * Rolls up digest-only fields across sessions that already passed `qualifiesForRecent`.
 * Callers must pre-filter; this function does not re-check gates.
 */
export function aggregateRecentDigests(
  qualifyingDigests: ReadonlyArray<MirrorSessionDigest>
): MirrorRecentDigestsAggregate {
  const ordered = [...qualifyingDigests].sort((a, b) => a.timestamp - b.timestamp);
  const n = ordered.length;
  const earliestTimestamp = n > 0 ? ordered[0].timestamp : 0;
  const latestTimestamp = n > 0 ? ordered[n - 1].timestamp : 0;

  const lexicalMap = new Map<string, { displayWord: string; bySession: Map<string, number> }>();

  const abstractionSessions = ordered.map((d) => ({
    sessionId: d.sessionId,
    timestamp: d.timestamp,
    abstractCount: d.abstraction.abstractCount,
    concreteCount: d.abstraction.concreteCount,
    abstractConcreteRatio: d.abstraction.abstractConcreteRatio,
    wordCount: d.wordCount
  }));

  const hesitationSessions = ordered.map((d) => {
    const w = Math.max(d.wordCount, 1);
    return {
      sessionId: d.sessionId,
      timestamp: d.timestamp,
      qualifierCount: d.hesitation.qualifierCount,
      qualifiersPer100Words: (d.hesitation.qualifierCount / w) * 100,
      wordCount: d.wordCount
    };
  });

  for (const d of ordered) {
    for (const row of d.topRepeatedWords) {
      const key = row.word.toLowerCase();
      let entry = lexicalMap.get(key);
      if (!entry) {
        entry = { displayWord: row.word, bySession: new Map() };
        lexicalMap.set(key, entry);
      }
      const prev = entry.bySession.get(d.sessionId) ?? 0;
      if (row.count > prev) {
        entry.bySession.set(d.sessionId, row.count);
      }
    }
  }

  const lexicalWords: MirrorRecentAggregatedLexicalWord[] = [];
  for (const [, { displayWord, bySession }] of lexicalMap) {
    const perSession = perSessionCountsFromMap(bySession);
    const totalTopListCount = perSession.reduce((s, r) => s + r.count, 0);
    lexicalWords.push({
      word: displayWord,
      sessionIds: sortedSessionIds(bySession),
      perSessionCounts: perSession,
      distinctSessionCount: bySession.size,
      totalTopListCount
    });
  }

  lexicalWords.sort((a, b) => {
    if (b.distinctSessionCount !== a.distinctSessionCount) {
      return b.distinctSessionCount - a.distinctSessionCount;
    }
    if (b.totalTopListCount !== a.totalTopListCount) {
      return b.totalTopListCount - a.totalTopListCount;
    }
    return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
  });

  return {
    qualifyingSessionCount: n,
    earliestTimestamp,
    latestTimestamp,
    lexicalWords,
    abstractionSessions,
    hesitationSessions
  };
}

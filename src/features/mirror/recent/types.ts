export type MirrorSessionDigestVersion = 1;

/** Phase 2+: at most three trend cards (one main, up to two supporting). */
export const MIRROR_RECENT_MAX_TRENDS_TOTAL = 3;

/** Phase 2+: supporting slots when a main trend is present. */
export const MIRROR_RECENT_MAX_SUPPORTING = 2;

/**
 * Small, JSON-safe snapshot of one session’s Mirror analysis (digest-on-save).
 * Built only from `analyzeText` / `MirrorFeatures` — not from selected V1 cards.
 */
export interface MirrorSessionDigest {
  readonly v: MirrorSessionDigestVersion;
  /** Same value as `MirrorFeatures.sessionId` for this analysis. */
  readonly sessionId: string;
  /** Wall-clock ms for this digest (typically session end / save time). */
  readonly timestamp: number;
  /**
   * Single source of truth: whether this session counts toward recent-pattern gates.
   * Mirrors the V1 “any category” material floor (`MIRROR_GEN_MIN_WORDS_FOR_ANY`).
   */
  readonly qualifiesForRecent: boolean;
  /** Same basis as `MirrorFeatures.wordCount`. */
  readonly wordCount: number;
  /**
   * From `MirrorFeatures.topRepeatedWords`, truncated (e.g. top 5).
   * Tokenizer-normalized repeated words (not stemmed/lemmatized).
   */
  readonly topRepeatedWords: ReadonlyArray<{ readonly word: string; readonly count: number }>;
  readonly abstraction: {
    readonly abstractCount: number;
    readonly concreteCount: number;
    readonly abstractConcreteRatio: number;
  };
  readonly hesitation: {
    readonly qualifierCount: number;
    readonly pivotCount: number;
    readonly contradictionMarkers: number;
    readonly uncertaintyMarkers: number;
  };
}

export type MirrorRecentTrendCategory =
  | "recent_lexical_anchor"
  | "recent_abstraction_lean"
  | "recent_hesitation_qualification";

export interface MirrorRecentTrendEvidence {
  readonly text: string;
  readonly start?: number;
  readonly end?: number;
}

export interface MirrorRecentTrend {
  readonly id: string;
  readonly category: MirrorRecentTrendCategory;
  readonly statement: string;
  readonly evidence: ReadonlyArray<MirrorRecentTrendEvidence>;
}

/** Internal ranking shape (Phase 2+), aligned with V1 candidate architecture. */
export interface MirrorRecentTrendCandidate extends MirrorRecentTrend {
  readonly rankScore: number;
}

/** Public output of the recent-trends pipeline (Phase 1: always empty `trends`). */
export interface MirrorRecentTrendsResult {
  readonly trends: ReadonlyArray<MirrorRecentTrend>;
}

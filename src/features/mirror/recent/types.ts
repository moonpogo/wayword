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
  /**
   * Optional on older stored digests: half-session abstraction density flags from `analyzeText`.
   */
  readonly abstraction: {
    readonly abstractCount: number;
    readonly concreteCount: number;
    readonly abstractConcreteRatio: number;
    readonly shiftsTowardConcrete?: boolean;
    readonly shiftsTowardAbstract?: boolean;
  };
  readonly hesitation: {
    readonly qualifierCount: number;
    readonly pivotCount: number;
    readonly contradictionMarkers: number;
    readonly uncertaintyMarkers: number;
  };
  /**
   * Optional on older stored digests: sentence-shape snapshot for cross-run cadence.
   */
  readonly cadence?: {
    readonly sentenceCount: number;
    readonly avgSentenceLength: number;
    readonly varianceSentenceLength: number;
    readonly shortSentenceCount: number;
    readonly longSentenceCount: number;
    readonly endCompression: boolean;
    readonly endExpansion: boolean;
  };
  /**
   * Optional on older stored digests: eligible-token repetition surface (distinct vs repeated pool).
   */
  readonly repetition?: {
    readonly eligibleTokenCount: number;
    readonly distinctEligibleTokenCount: number;
  };
}

export type MirrorRecentTrendCategory =
  | "recent_lexical_anchor"
  | "recent_abstraction_lean"
  | "recent_hesitation_qualification"
  | "pattern_recurring_signal"
  | "pattern_shift_over_time"
  | "pattern_consistency_vs_variation";

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

/** Durable patterns promoted from digest history + reflective profile string. */
export interface PatternsProfileFromDigestsResult {
  readonly promotedPatterns: ReadonlyArray<MirrorRecentTrend>;
  readonly profile: string | null;
  /** Qualifying runs (`v === 1`, `qualifiesForRecent`) feeding Patterns V1. */
  readonly qualifyingRunCount: number;
  /**
   * When no cards render: distinguish low history vs enough history but no passable signal.
   * `null` when cards exist or mirror bundle does not support patterns V1.
   */
  readonly patternsEmptyState: PatternsProfileFromDigestsEmptyState | null;
}

export type PatternsProfileFromDigestsEmptyState = "insufficient_runs" | "no_strong_pattern";

export type MirrorCategoryV1 =
  | "repetition"
  | "abstraction_concrete"
  | "cadence"
  | "opening"
  | "shift"
  | "hesitation_qualification"
  | "fallback"
  | "low_signal";

export interface MirrorSessionInput {
  text: string;
  /** When set and non-empty, used as `MirrorFeatures.sessionId`. */
  sessionId?: string;
  startedAt?: number;
  endedAt?: number;
  /**
   * Main-line reflection family keys from prior completed runs, most recent first.
   * Used to down-rank near-duplicate “families” across the review loop.
   */
  recentReflectionFamilyKeys?: string[];
}

export interface MirrorEvidence {
  text: string;
  start?: number;
  end?: number;
}

/** Headline line; `evidence` is always empty in V1 UI (internal scoring only). */
export interface MirrorReflection {
  id: string;
  category: MirrorCategoryV1;
  statement: string;
  evidence: MirrorEvidence[];
}

/** Candidate after generation; includes internal ordering signal for ranking. */
export interface MirrorReflectionCandidate extends MirrorReflection {
  /** Internal only — higher means stronger signal for downstream ranking/selection. */
  rankScore: number;
  /**
   * When true, this card may appear as supporting alongside the single primary if it clears
   * the support floor. Defaults unset/false; generation sets only when explicitly paired.
   */
  supportsPrimary?: boolean;
}

/** Public extraction payload for generation (analysis only). */
export type MirrorFeatures = {
  sessionId: string;
  /** Tokenizer word count (`tokenizeText` on session text); not reconciled to editor metrics. */
  wordCount: number;
  sentenceCount: number;

  topRepeatedWords: Array<{ word: string; count: number }>;

  cadenceProfile: {
    avgSentenceLength: number;
    varianceSentenceLength: number;
    shortSentenceCount: number;
    longSentenceCount: number;
    endCompression: boolean;
    endExpansion: boolean;
    /** Present when sentence count supports quarter comparison; used for evidence-backed cadence lines. */
    meanSentenceLengthFirstQuarterWords: number | null;
    meanSentenceLengthLastQuarterWords: number | null;
  };

  /**
   * Lexicon hit counts and half-session density shift flags (deterministic).
   * Generation: if `shiftsTowardAbstract` and `shiftsTowardConcrete` are both true, treat
   * directional abstraction movement as ambiguous — do not produce two separate movement reflections.
   */
  abstractionProfile: {
    abstractCount: number;
    concreteCount: number;
    /** `abstractCount / Math.max(concreteCount, 1)`. */
    abstractConcreteRatio: number;
    shiftsTowardConcrete: boolean;
    shiftsTowardAbstract: boolean;
  };

  hesitationProfile: {
    qualifierCount: number;
    pivotCount: number;
    contradictionMarkers: number;
    uncertaintyMarkers: number;
  };
};

export type MirrorCadenceProfile = MirrorFeatures["cadenceProfile"];
export type MirrorAbstractionProfile = MirrorFeatures["abstractionProfile"];
export type MirrorHesitationProfile = MirrorFeatures["hesitationProfile"];

/** Internal: repetition extractor output. */
export interface MirrorRepetitionExtraction {
  totalTokenCount: number;
  eligibleTokenCount: number;
  distinctEligibleTokenCount: number;
  topRepeatedWords: ReadonlyArray<{ readonly word: string; readonly count: number }>;
}

/** Internal: cadence extractor output (includes quarter means for tuning). */
export interface MirrorCadenceExtraction {
  sentenceCount: number;
  averageSentenceLengthWords: number;
  sentenceLengthVariance: number;
  shortSentenceCount: number;
  longSentenceCount: number;
  endCompression: boolean;
  endExpansion: boolean;
  meanSentenceLengthFirstQuarterWords: number | null;
  meanSentenceLengthLastQuarterWords: number | null;
}

/**
 * Internal: abstraction extractor output (mirrors `MirrorFeatures.abstractionProfile` fields).
 * Same generation rule as on `MirrorFeatures` when both shift flags are true.
 */
export interface MirrorAbstractionExtraction {
  abstractCount: number;
  concreteCount: number;
  /** `abstractCount / Math.max(concreteCount, 1)`. */
  abstractConcreteRatio: number;
  shiftsTowardConcrete: boolean;
  shiftsTowardAbstract: boolean;
  contentTokenCount: number;
  firstHalfAbstractMatchCount: number;
  secondHalfAbstractMatchCount: number;
  firstHalfConcreteMatchCount: number;
  secondHalfConcreteMatchCount: number;
}

/** Internal: hesitation extractor output. */
export interface MirrorHesitationExtraction {
  contentTokenCount: number;
  qualifierLexiconMatchCount: number;
  pivotLexiconMatchCount: number;
  contradictionLexiconMatchCount: number;
  uncertaintyLexiconMatchCount: number;
}

export type MirrorReflectionRole = "main" | "support";

/** One card in the final mirror stack (main or supporting). */
export interface MirrorSelectedReflection {
  id: string;
  category: MirrorCategoryV1;
  statement: string;
  evidence: MirrorEvidence[];
  role: MirrorReflectionRole;
  /** Unchanged from the candidate; for tuning / transparency (UI may hide). */
  rankScore: number;
}

/** Final pipeline output after rank, dedupe, and selection. */
export interface MirrorPipelineResult {
  /**
   * Exactly one line per run: strongest qualifying signal, a soft `fallback` line when none
   * clear the support floor, or `low_signal` when the submission is too thin for pattern copy.
   * Null only if the pipeline cannot run (e.g. bundle failure upstream).
   */
  main: MirrorSelectedReflection | null;
  /**
   * Optional secondary lines only when `MirrorReflectionCandidate.supportsPrimary` is set on the
   * candidate; each must meet the support floor and use a distinct category from `main`.
   */
  supporting: MirrorSelectedReflection[];
}

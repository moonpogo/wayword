export type MirrorCategoryV1 =
  | "repetition"
  | "abstraction_concrete"
  | "cadence"
  | "hesitation_qualification";

export interface MirrorSessionInput {
  text: string;
  /** When set and non-empty, used as `MirrorFeatures.sessionId`. */
  sessionId?: string;
  startedAt?: number;
  endedAt?: number;
}

export interface MirrorEvidence {
  text: string;
  start?: number;
  end?: number;
}

/** Evidence-backed line; no scores, no prescriptive advice. */
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

export interface MirrorPipelineResult {
  candidates: MirrorReflectionCandidate[];
}

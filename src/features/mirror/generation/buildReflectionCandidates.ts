import {
  MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT,
  MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL,
  MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS,
  MIRROR_GEN_ABSTRACTION_SOFT_IDEA_LEAN_RATIO,
  MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG,
  MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT,
  MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE,
  MIRROR_GEN_CADENCE_MIN_SENTENCES,
  MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS,
  MIRROR_GEN_HESITATION_MIN_TOTAL,
  MIRROR_GEN_MIN_WORDS_FOR_ANY,
  MIRROR_GEN_REPETITION_DULL_WORDS,
  MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN,
  MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT,
  MIRROR_GEN_REPETITION_TOP_MIN_COUNT
} from "../constants/generationThresholds.js";
import {
  MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL,
  MIRROR_HEADLINE_ABSTRACTION_BALANCE,
  MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS,
  MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE,
  MIRROR_HEADLINE_CADENCE_ALTERNATION,
  MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS,
  MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN,
  MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING,
  MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER,
  MIRROR_HEADLINE_HESITATION_REVISED,
  mirrorHeadlineRepetitionNamed
} from "../constants/mirrorSessionHeadlines.js";
import type {
  MirrorEvidence,
  MirrorFeatures,
  MirrorReflectionCandidate
} from "../types/mirrorTypes.js";

function candidate(
  category: MirrorReflectionCandidate["category"],
  sessionId: string,
  statement: string,
  evidence: MirrorEvidence[],
  rankScore: number,
  supportsPrimary = false
): MirrorReflectionCandidate {
  const base: MirrorReflectionCandidate = {
    id: `${category}:${sessionId}`,
    category,
    statement,
    evidence,
    rankScore
  };
  if (supportsPrimary) base.supportsPrimary = true;
  return base;
}

/** Abstraction cards share a selection floor so marginal-but-valid signals still reach support. */
function abstractionCandidate(
  sessionId: string,
  statement: string,
  rankScore: number,
  supportsPrimary = false
): MirrorReflectionCandidate {
  return candidate(
    "abstraction_concrete",
    sessionId,
    statement,
    [],
    Math.max(rankScore, 38),
    supportsPrimary
  );
}

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

function tryRepetition(features: MirrorFeatures): MirrorReflectionCandidate | null {
  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
  const list = features.topRepeatedWords;
  const picked = list.find(
    (e) => repetitionMeetsCountGate(e.word, e.count) && !repetitionWordIsLowSignal(e.word)
  );
  if (!picked) return null;

  const statement = mirrorHeadlineRepetitionNamed(picked.word);
  const multiNamed = list.filter(
    (e) => repetitionMeetsCountGate(e.word, e.count) && !repetitionWordIsLowSignal(e.word)
  ).length;
  const rankScore = Math.min(100, picked.count * 14 + (multiNamed > 1 ? 5 : 0));
  return candidate("repetition", features.sessionId, statement, [], rankScore);
}

function tryCadence(features: MirrorFeatures): MirrorReflectionCandidate | null {
  const c = features.cadenceProfile;
  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
  if (features.sentenceCount < MIRROR_GEN_CADENCE_MIN_SENTENCES) return null;

  const firstQ = c.meanSentenceLengthFirstQuarterWords;
  const lastQ = c.meanSentenceLengthLastQuarterWords;
  const quarterRatio =
    firstQ != null && lastQ != null && firstQ > 0 ? lastQ / firstQ : null;

  if (c.endCompression && quarterRatio != null && firstQ != null && lastQ != null) {
    const statement = MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS;
    const rankScore = 54 + Math.min(18, c.varianceSentenceLength * 0.55);
    return candidate("cadence", features.sessionId, statement, [], rankScore);
  }

  if (c.endExpansion && quarterRatio != null && firstQ != null && lastQ != null) {
    const statement = MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN;
    const rankScore = 54 + Math.min(18, c.varianceSentenceLength * 0.55);
    return candidate("cadence", features.sessionId, statement, [], rankScore);
  }

  const strongAlternation =
    features.sentenceCount >= MIRROR_GEN_CADENCE_MIN_SENTENCES &&
    c.shortSentenceCount >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT &&
    c.longSentenceCount >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG &&
    c.varianceSentenceLength >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE;

  if (strongAlternation) {
    const statement = MIRROR_HEADLINE_CADENCE_ALTERNATION;
    const rankScore = 44 + Math.min(16, c.shortSentenceCount + c.longSentenceCount);
    return candidate("cadence", features.sessionId, statement, [], rankScore);
  }

  return null;
}

function tryAbstraction(features: MirrorFeatures): MirrorReflectionCandidate | null {
  const a = features.abstractionProfile;
  const lex = a.abstractCount + a.concreteCount;

  const shortFormAbstractionEligible =
    features.wordCount >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS &&
    a.abstractCount >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT &&
    a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO &&
    a.concreteCount <= MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE;

  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY && !shortFormAbstractionEligible) {
    return null;
  }

  if (a.shiftsTowardAbstract && a.shiftsTowardConcrete) {
    if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return null;
    const statement = MIRROR_HEADLINE_ABSTRACTION_BALANCE;
    const rankScore = 40 + Math.min(22, lex * 1.6);
    return abstractionCandidate(features.sessionId, statement, rankScore);
  }

  if (
    a.shiftsTowardAbstract &&
    lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT &&
    a.abstractCount >= MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT
  ) {
    const statement = MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL;
    const rankScore = 80 + Math.min(20, a.abstractCount * 2.4);
    return abstractionCandidate(features.sessionId, statement, rankScore);
  }

  if (
    a.shiftsTowardConcrete &&
    lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT &&
    a.concreteCount >= MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT
  ) {
    const statement = MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER;
    const rankScore = 80 + Math.min(20, a.concreteCount * 2.4);
    return abstractionCandidate(features.sessionId, statement, rankScore);
  }

  if (lex >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) {
    const ratioOkIdeas =
      a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO && a.abstractCount >= 2;
    const ratioOkIdeasSoft =
      !ratioOkIdeas &&
      a.abstractCount >= 3 &&
      a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_SOFT_IDEA_LEAN_RATIO;
    const ratioOkConcrete =
      a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1) &&
      a.concreteCount >= 2;

    if (ratioOkIdeas && !ratioOkConcrete) {
      const statement = MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE;
      const rankScore = 68 + Math.min(16, lex * 1.8);
      return abstractionCandidate(features.sessionId, statement, rankScore);
    }
    if (ratioOkIdeasSoft && !ratioOkConcrete) {
      const statement = MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE;
      const rankScore = 64 + Math.min(14, lex * 1.8);
      return abstractionCandidate(features.sessionId, statement, rankScore);
    }
    if (ratioOkConcrete && !ratioOkIdeas) {
      const statement = MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS;
      const rankScore = 68 + Math.min(16, lex * 1.8);
      return abstractionCandidate(features.sessionId, statement, rankScore);
    }

    const statement = MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT;
    const rankScore = 34 + Math.min(14, lex * 1.5);
    return abstractionCandidate(features.sessionId, statement, rankScore);
  }

  return null;
}

function tryHesitation(features: MirrorFeatures): MirrorReflectionCandidate | null {
  const h = features.hesitationProfile;
  const total =
    h.qualifierCount + h.pivotCount + h.contradictionMarkers + h.uncertaintyMarkers;
  const per100 = (total / Math.max(features.wordCount, 1)) * 100;

  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;

  const soft = h.qualifierCount + h.uncertaintyMarkers;
  const turn = h.pivotCount + h.contradictionMarkers;

  // Scene connectives (pivots / negation) without real softening are usually not hesitation.
  if (turn === 0) {
    if (soft < 4) return null;
  } else {
    if (soft < 2 && (total < 10 || turn < 4)) return null;
    if (soft < 3 && turn > soft && total < 8) return null;
  }

  if (total < MIRROR_GEN_HESITATION_MIN_TOTAL && per100 < MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS) {
    return null;
  }

  let statement: string;
  if (soft >= turn && h.qualifierCount >= 2) {
    statement = MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER;
  } else if (turn >= soft && turn >= 2 && soft >= 2) {
    statement = MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING;
  } else {
    statement = MIRROR_HEADLINE_HESITATION_REVISED;
  }

  let rankScore = Math.min(54, 24 + total * 2.2 + per100 * 0.7);
  if (soft < 3 && turn >= 2) rankScore -= 10;
  return candidate("hesitation_qualification", features.sessionId, statement, [], rankScore);
}

/**
 * Builds at most one candidate per mirror category from features; skips weak buckets.
 */
export function buildReflectionCandidates(
  features: MirrorFeatures,
  _sourceText?: string
): MirrorReflectionCandidate[] {
  const out: MirrorReflectionCandidate[] = [];

  const rep = tryRepetition(features);
  if (rep) out.push(rep);

  const abs = tryAbstraction(features);
  if (abs) out.push(abs);

  const cad = tryCadence(features);
  if (cad) out.push(cad);

  const hes = tryHesitation(features);
  if (hes) out.push(hes);

  return out;
}

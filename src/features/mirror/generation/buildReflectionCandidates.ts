import { MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT } from "../constants/selectionThresholds.js";
import {
  MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_ABSTRACT,
  MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_LEX,
  MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_RATIO,
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
  MIRROR_GEN_CADENCE_FOUR_SENTENCE_MIN_VARIANCE,
  MIRROR_GEN_CADENCE_MIN_SENTENCES,
  MIRROR_GEN_CONCRETE_SCENE_MAX_WORDS,
  MIRROR_GEN_CONCRETE_SCENE_MIN_LEX,
  MIRROR_GEN_CONCRETE_SCENE_MIN_PER_SENTENCE,
  MIRROR_GEN_CONCRETE_SCENE_MIN_SENTENCES,
  MIRROR_GEN_CONCRETE_SCENE_MIN_WORDS,
  MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS,
  MIRROR_GEN_HESITATION_MIN_TOTAL,
  MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_PER100,
  MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_PHRASE_HITS,
  MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_SENTENCES,
  MIRROR_GEN_HESITATION_PHRASE_AUGMENT_MAX_TOTAL_LEX,
  MIRROR_GEN_HESITATION_PHRASE_AUGMENT_MIN_PHRASE_HITS,
  MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_TOTAL,
  MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_WORDS,
  MIRROR_GEN_MIN_WORDS_FOR_ANY,
  MIRROR_GEN_OPENING_DIRECT_LAST_RATIO,
  MIRROR_GEN_OPENING_DIRECT_MAX_FIRST_Q,
  MIRROR_GEN_OPENING_LONG_FIRST_Q,
  MIRROR_GEN_OPENING_LOOSE_FIRSTQ_MIN,
  MIRROR_GEN_OPENING_LOOSE_RATIO,
  MIRROR_GEN_OPENING_MIN_SENTENCES,
  MIRROR_GEN_OPENING_MIN_VARIANCE_LOOSE,
  MIRROR_GEN_OPENING_MOMENT_RATIO,
  MIRROR_GEN_REPETITION_DULL_WORDS,
  MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SENTENCES,
  MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SHARE,
  MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_WORDS,
  MIRROR_GEN_REPETITION_SHORT_OVERRIDE_NAMED_MIN_COUNT,
  MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN,
  MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT,
  MIRROR_GEN_REPETITION_TOP_MIN_COUNT,
  MIRROR_GEN_SHIFT_MIN_LEX
} from "../constants/generationThresholds.js";
import { MIRROR_CONCRETE_WORDS } from "../constants/concreteWords.js";
import {
  MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS,
  MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE,
  MIRROR_HEADLINE_CADENCE_ALTERNATION,
  MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS,
  MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN,
  MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING,
  pickMirrorHesitationQualifiedAfterStatement,
  pickMirrorHesitationRevisedGeneralStatement,
  MIRROR_HEADLINE_OPENING_DIRECT,
  MIRROR_HEADLINE_OPENING_LOOSE,
  MIRROR_HEADLINE_OPENING_MOMENT,
  MIRROR_HEADLINE_SHIFT_HOLDS,
  MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER,
  MIRROR_HEADLINE_SHIFT_TURNS,
  mirrorHeadlineRepetitionNamed,
  pickMirrorAbstractionBalanceStatement,
  pickMirrorAbstractionBothFrequentStatement
} from "../constants/mirrorSessionHeadlines.js";
import type {
  MirrorEvidence,
  MirrorFeatures,
  MirrorReflectionCandidate
} from "../types/mirrorTypes.js";
import { splitSentences } from "../utils/splitSentences.js";
import { tokenizeText } from "../utils/tokenizeText.js";

const CONCRETE_LEX_SET = new Set(MIRROR_CONCRETE_WORDS.map((w) => w.toLowerCase()));

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

function repetitionShortTextOverrideEligible(features: MirrorFeatures): boolean {
  if (features.wordCount >= MIRROR_GEN_MIN_WORDS_FOR_ANY) return false;
  if (features.wordCount < MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_WORDS) return false;
  if (features.sentenceCount < MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SENTENCES) return false;
  return true;
}

/** MIX-01: two deliberate short beats, or one stronger short lemma, before 3× low gates apply. */
function repetitionShortBeatPageStrong(
  list: MirrorFeatures["topRepeatedWords"],
  wordCount: number
): boolean {
  const floor = MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SHARE;
  const eligibleShort = list.filter((e) => {
    const w = e.word.toLowerCase();
    if (MIRROR_GEN_REPETITION_DULL_WORDS.has(w)) return false;
    if (e.word.length > MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN) return false;
    if (e.count < MIRROR_GEN_REPETITION_SHORT_OVERRIDE_NAMED_MIN_COUNT) return false;
    return e.count / Math.max(wordCount, 1) >= floor;
  });
  if (eligibleShort.length >= 2) return true;
  if (eligibleShort.some((h) => h.count >= MIRROR_GEN_REPETITION_TOP_MIN_COUNT)) return true;
  return false;
}

/**
 * Whether a lemma may headline named repetition. Short-page override can surface deliberate
 * short non-dull beats (MIX-01) when the page shows corroborated surface recurrence; dull lemmas
 * never name here.
 */
function repetitionLemmaEligibleForNamedHeadline(
  word: string,
  count: number,
  features: MirrorFeatures,
  shortOverride: boolean,
  list: MirrorFeatures["topRepeatedWords"]
): boolean {
  const w = word.toLowerCase();
  if (MIRROR_GEN_REPETITION_DULL_WORDS.has(w)) return false;

  if (
    shortOverride &&
    repetitionShortBeatPageStrong(list, features.wordCount) &&
    word.length <= MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN &&
    count >= MIRROR_GEN_REPETITION_SHORT_OVERRIDE_NAMED_MIN_COUNT &&
    count / Math.max(features.wordCount, 1) >= MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SHARE
  ) {
    return true;
  }

  return repetitionMeetsCountGate(word, count) && !repetitionWordIsLowSignal(word);
}

/** Max concrete-lexicon hits in any one sentence (co-location proxy for image language). */
function maxConcreteLexHitsInOneSentence(normalizedText: string): number {
  let maxH = 0;
  for (const sent of splitSentences(normalizedText)) {
    let h = 0;
    for (const raw of tokenizeText(sent)) {
      if (CONCRETE_LEX_SET.has(raw.toLowerCase())) h += 1;
    }
    maxH = Math.max(maxH, h);
  }
  return maxH;
}

/**
 * Phrase-level softeners / revision cues missed by token lexicons.
 * Extensions are tied to corpus misses (HES-02 revision, REAL-01 replay / expectation hedges).
 */
function hesitationPhraseSoftHitCount(normalizedText: string): number {
  const t = normalizedText.toLowerCase();
  const patterns: RegExp[] = [
    /\bi think\b/g,
    /\bi guess\b/g,
    /\bi suppose\b/g,
    /\bmore or less\b/g,
    /\bnot exactly\b/g,
    /\b(?:or\s+)?at least\b/g,
    /\bwhich is maybe\b/g,
    /\bwondering whether\b/g,
    /\bmore than i expected\b/g,
    // REAL-02-style evaluative softening; phrase augment still requires sparse lex + min phrase hits.
    /\bseems to\b/g,
    /\bmore than it should\b/g
  ];
  let n = 0;
  for (const re of patterns) {
    const m = t.match(re);
    if (m) n += m.length;
  }
  return n;
}

function pickVariantIndex(sessionId: string, salt: string): number {
  const s = `${sessionId}|${salt}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function cadenceStrongAlternation(features: MirrorFeatures): boolean {
  const c = features.cadenceProfile;
  return (
    features.sentenceCount >= MIRROR_GEN_CADENCE_MIN_SENTENCES &&
    c.shortSentenceCount >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT &&
    c.longSentenceCount >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG &&
    c.varianceSentenceLength >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE
  );
}

function tryRepetition(features: MirrorFeatures): MirrorReflectionCandidate | null {
  const shortOverride = repetitionShortTextOverrideEligible(features);
  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY && !shortOverride) return null;

  const list = features.topRepeatedWords;
  const picked = list.find((e) =>
    repetitionLemmaEligibleForNamedHeadline(e.word, e.count, features, shortOverride, list)
  );
  if (!picked) return null;

  if (shortOverride) {
    const share = picked.count / Math.max(features.wordCount, 1);
    if (share < MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SHARE) return null;
    const minNamedHits = repetitionWordIsLowSignal(picked.word)
      ? MIRROR_GEN_REPETITION_SHORT_OVERRIDE_NAMED_MIN_COUNT
      : MIRROR_GEN_REPETITION_TOP_MIN_COUNT;
    if (picked.count < minNamedHits) return null;
  }

  const statement = mirrorHeadlineRepetitionNamed(picked.word);
  const multiNamed = list.filter((e) =>
    repetitionLemmaEligibleForNamedHeadline(e.word, e.count, features, shortOverride, list)
  ).length;
  const rankScore = Math.min(100, picked.count * 14 + (multiNamed > 1 ? 5 : 0));
  return candidate("repetition", features.sessionId, statement, [], rankScore);
}

function tryCadence(features: MirrorFeatures): MirrorReflectionCandidate | null {
  const c = features.cadenceProfile;
  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;

  const fourSentenceEndShape =
    features.sentenceCount === 4 &&
    c.varianceSentenceLength >= MIRROR_GEN_CADENCE_FOUR_SENTENCE_MIN_VARIANCE;

  if (features.sentenceCount < MIRROR_GEN_CADENCE_MIN_SENTENCES) {
    if (!fourSentenceEndShape) return null;
  }

  const firstQ = c.meanSentenceLengthFirstQuarterWords;
  const lastQ = c.meanSentenceLengthLastQuarterWords;
  const quarterRatio =
    firstQ != null && lastQ != null && firstQ > 0 ? lastQ / firstQ : null;

  if (c.endCompression && quarterRatio != null && firstQ != null && lastQ != null) {
    const statement = MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS;
    let rankScore = 54 + Math.min(18, c.varianceSentenceLength * 0.55);
    if (fourSentenceEndShape) rankScore -= 4;
    return candidate("cadence", features.sessionId, statement, [], rankScore);
  }

  if (c.endExpansion && quarterRatio != null && firstQ != null && lastQ != null) {
    const statement = MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN;
    let rankScore = 54 + Math.min(18, c.varianceSentenceLength * 0.55);
    if (fourSentenceEndShape) rankScore -= 4;
    return candidate("cadence", features.sessionId, statement, [], rankScore);
  }

  if (cadenceStrongAlternation(features)) {
    const statement = MIRROR_HEADLINE_CADENCE_ALTERNATION;
    const rankScore = 44 + Math.min(16, c.shortSentenceCount + c.longSentenceCount);
    return candidate("cadence", features.sessionId, statement, [], rankScore);
  }

  return null;
}

function tryOpening(features: MirrorFeatures): MirrorReflectionCandidate | null {
  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
  if (features.sentenceCount < MIRROR_GEN_OPENING_MIN_SENTENCES) return null;
  const c = features.cadenceProfile;
  const firstQ = c.meanSentenceLengthFirstQuarterWords;
  const lastQ = c.meanSentenceLengthLastQuarterWords;
  if (firstQ == null || lastQ == null || firstQ <= 0) return null;
  if (c.endCompression || c.endExpansion) return null;
  if (cadenceStrongAlternation(features)) return null;

  const eligible: Array<{ key: "moment" | "loose" | "direct"; statement: string }> = [];
  if (firstQ >= MIRROR_GEN_OPENING_LONG_FIRST_Q && firstQ >= lastQ * MIRROR_GEN_OPENING_MOMENT_RATIO) {
    eligible.push({ key: "moment", statement: MIRROR_HEADLINE_OPENING_MOMENT });
  }
  if (
    c.varianceSentenceLength >= MIRROR_GEN_OPENING_MIN_VARIANCE_LOOSE &&
    firstQ > lastQ * MIRROR_GEN_OPENING_LOOSE_RATIO &&
    firstQ > MIRROR_GEN_OPENING_LOOSE_FIRSTQ_MIN
  ) {
    eligible.push({ key: "loose", statement: MIRROR_HEADLINE_OPENING_LOOSE });
  }
  if (firstQ <= MIRROR_GEN_OPENING_DIRECT_MAX_FIRST_Q && firstQ <= lastQ * MIRROR_GEN_OPENING_DIRECT_LAST_RATIO) {
    eligible.push({ key: "direct", statement: MIRROR_HEADLINE_OPENING_DIRECT });
  }
  if (!eligible.length) return null;

  const order: Array<"moment" | "loose" | "direct"> = ["moment", "loose", "direct"];
  const ordered = order
    .map((k) => eligible.find((e) => e.key === k))
    .filter((e): e is { key: "moment" | "loose" | "direct"; statement: string } => Boolean(e));
  const pick = ordered[pickVariantIndex(features.sessionId, "opening") % ordered.length]!;
  const rankScore = 46 + Math.min(10, (firstQ + lastQ) * 0.8);
  return candidate("opening", features.sessionId, pick.statement, [], rankScore);
}

function tryShift(features: MirrorFeatures): MirrorReflectionCandidate | null {
  const a = features.abstractionProfile;
  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;

  const soleHalfShift = a.shiftsTowardAbstract !== a.shiftsTowardConcrete;
  if (!soleHalfShift) return null;

  const lex = a.abstractCount + a.concreteCount;
  if (lex < MIRROR_GEN_SHIFT_MIN_LEX) return null;

  const strongAbstractMove =
    a.shiftsTowardAbstract &&
    lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT &&
    a.abstractCount >= MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT;
  const strongConcreteMove =
    a.shiftsTowardConcrete &&
    lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT &&
    a.concreteCount >= MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT;
  if (strongAbstractMove || strongConcreteMove) return null;

  const statements = [
    MIRROR_HEADLINE_SHIFT_TURNS,
    MIRROR_HEADLINE_SHIFT_HOLDS,
    MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER
  ] as const;
  const statement = statements[pickVariantIndex(features.sessionId, "shift") % statements.length]!;
  const rankScore = 44 + Math.min(12, lex * 1.2);
  return candidate("shift", features.sessionId, statement, [], rankScore);
}

function tryAbstraction(
  features: MirrorFeatures,
  sourceNorm: string | undefined
): MirrorReflectionCandidate | null {
  const a = features.abstractionProfile;
  const lex = a.abstractCount + a.concreteCount;

  const shortFormAbstractionEligible =
    features.wordCount >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS &&
    a.abstractCount >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT &&
    a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO &&
    a.concreteCount <= MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE;

  const concreteSceneBandEligible =
    Boolean(sourceNorm) &&
    features.wordCount >= MIRROR_GEN_CONCRETE_SCENE_MIN_WORDS &&
    features.wordCount <= MIRROR_GEN_CONCRETE_SCENE_MAX_WORDS &&
    features.sentenceCount >= MIRROR_GEN_CONCRETE_SCENE_MIN_SENTENCES;

  if (
    features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY &&
    !shortFormAbstractionEligible &&
    !concreteSceneBandEligible
  ) {
    return null;
  }

  if (a.shiftsTowardAbstract && a.shiftsTowardConcrete) {
    if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return null;
    const statement = pickMirrorAbstractionBalanceStatement(features.sessionId);
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
    a.shiftsTowardAbstract &&
    !a.shiftsTowardConcrete &&
    lex >= MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_LEX &&
    a.abstractCount >= MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_ABSTRACT &&
    a.abstractCount < MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT &&
    a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_RATIO
  ) {
    const statement = MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL;
    const rankScore = 74 + Math.min(14, lex * 2.2);
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

    const statement = pickMirrorAbstractionBothFrequentStatement(features.sessionId);
    const rankScore = 34 + Math.min(14, lex * 1.5);
    return abstractionCandidate(features.sessionId, statement, rankScore);
  }

  if (
    sourceNorm &&
    concreteSceneBandEligible &&
    a.abstractCount === 0 &&
    a.concreteCount >= MIRROR_GEN_CONCRETE_SCENE_MIN_LEX &&
    lex >= MIRROR_GEN_CONCRETE_SCENE_MIN_LEX &&
    lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL &&
    !(a.shiftsTowardAbstract && a.shiftsTowardConcrete) &&
    maxConcreteLexHitsInOneSentence(sourceNorm) >= MIRROR_GEN_CONCRETE_SCENE_MIN_PER_SENTENCE
  ) {
    const statement = MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS;
    const rankScore = 56 + Math.min(12, lex * 3);
    return abstractionCandidate(features.sessionId, statement, rankScore);
  }

  return null;
}

function tryHesitation(
  features: MirrorFeatures,
  sourceNorm: string | undefined
): MirrorReflectionCandidate | null {
  const h = features.hesitationProfile;
  const phraseHits = sourceNorm ? hesitationPhraseSoftHitCount(sourceNorm) : 0;

  const shortOverride =
    features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY &&
    features.wordCount >= MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_WORDS &&
    features.sentenceCount >= MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_SENTENCES &&
    Boolean(sourceNorm) &&
    phraseHits >= MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_PHRASE_HITS;

  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY && !shortOverride) return null;

  const totalLex =
    h.qualifierCount + h.pivotCount + h.contradictionMarkers + h.uncertaintyMarkers;
  const softLex = h.qualifierCount + h.uncertaintyMarkers;
  const turnLex = h.pivotCount + h.contradictionMarkers;

  const phraseAugmentLong =
    !shortOverride &&
    features.wordCount >= MIRROR_GEN_MIN_WORDS_FOR_ANY &&
    Boolean(sourceNorm) &&
    totalLex <= MIRROR_GEN_HESITATION_PHRASE_AUGMENT_MAX_TOTAL_LEX &&
    phraseHits >= MIRROR_GEN_HESITATION_PHRASE_AUGMENT_MIN_PHRASE_HITS;

  const phraseAugment = shortOverride || phraseAugmentLong;
  const soft = phraseAugment ? softLex + phraseHits : softLex;
  const turn = turnLex;
  const total = phraseAugment ? totalLex + phraseHits : totalLex;
  const per100 = (total / Math.max(features.wordCount, 1)) * 100;

  // Scene connectives (pivots / negation) without real softening are usually not hesitation.
  /** Long-text phrase augment: allow 3+ combined soft signals when lex is sparse (see phraseAugmentLong). */
  const softFloorNoTurn = shortOverride ? 3 : phraseAugmentLong ? 3 : 4;
  if (turn === 0) {
    if (soft < softFloorNoTurn) return null;
  } else {
    if (soft < 2 && (total < 10 || turn < 4)) return null;
    if (soft < 3 && turn > soft && total < 8) return null;
  }

  const minTotal = shortOverride ? MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_TOTAL : MIRROR_GEN_HESITATION_MIN_TOTAL;
  const minPer100 = shortOverride
    ? MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_PER100
    : MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS;

  if (total < minTotal && per100 < minPer100) {
    return null;
  }

  const qualifiedAfter =
    soft >= turn &&
    (h.qualifierCount >= 2 ||
      (phraseAugment && phraseHits >= 1 && h.qualifierCount >= 1) ||
      (phraseAugmentLong && phraseHits >= 2 && turn >= 1 && soft >= 2));

  const headlineFingerprint = `${turn}|${phraseHits}|${h.qualifierCount}|${softLex}|${totalLex}`;

  let statement: string;
  if (qualifiedAfter) {
    statement = pickMirrorHesitationQualifiedAfterStatement(features.sessionId, headlineFingerprint);
  } else if (turn >= soft && turn >= 2 && soft >= 2) {
    statement = MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING;
  } else {
    statement = pickMirrorHesitationRevisedGeneralStatement(features.sessionId, headlineFingerprint);
  }

  let rankScore = Math.min(54, 24 + total * 2.2 + per100 * 0.7);
  if (soft < 3 && turn >= 2 && !phraseAugmentLong) rankScore -= 10;
  if (shortOverride) rankScore = Math.min(54, rankScore + 4);
  if (phraseAugmentLong) rankScore = Math.min(54, rankScore + 6);
  /** Allow hesitation as a supporting line when another category wins primary (e.g. MIX-03). */
  const eligibleAsSupporting = rankScore >= MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT;
  return candidate(
    "hesitation_qualification",
    features.sessionId,
    statement,
    [],
    rankScore,
    eligibleAsSupporting
  );
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

  const abs = tryAbstraction(features, _sourceText);
  if (abs) out.push(abs);

  const cad = tryCadence(features);
  if (cad) out.push(cad);

  const opn = tryOpening(features);
  if (opn) out.push(opn);

  const shf = tryShift(features);
  if (shf) out.push(shf);

  const hes = tryHesitation(features, _sourceText);
  if (hes) out.push(hes);

  return out;
}

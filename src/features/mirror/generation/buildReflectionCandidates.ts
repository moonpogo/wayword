import {
  MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT,
  MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO,
  MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS,
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
  MIRROR_LONG_SENTENCE_MIN_WORDS,
  MIRROR_SHORT_SENTENCE_MAX_WORDS
} from "../constants/thresholds.js";
import type {
  MirrorFeatures,
  MirrorReflectionCandidate,
  MirrorEvidence
} from "../types/mirrorTypes.js";
import { normalizeText } from "../utils/normalizeText.js";

function snippetAround(text: string, needle: string, radius = 36): MirrorEvidence {
  const t = text;
  const lower = t.toLowerCase();
  const n = needle.toLowerCase();
  const idx = lower.indexOf(n);
  if (idx < 0) {
    return { text: needle };
  }
  const a = Math.max(0, idx - radius);
  const b = Math.min(t.length, idx + needle.length + radius);
  const slice = t.slice(a, b).trim();
  return { text: slice, start: a, end: b };
}

function candidate(
  category: MirrorReflectionCandidate["category"],
  sessionId: string,
  statement: string,
  evidence: MirrorEvidence[],
  rankScore: number
): MirrorReflectionCandidate {
  return {
    id: `${category}:${sessionId}`,
    category,
    statement,
    evidence,
    rankScore
  };
}

/** Abstraction cards share a selection floor so marginal-but-valid signals still reach support. */
function abstractionCandidate(
  sessionId: string,
  statement: string,
  evidence: MirrorEvidence[],
  rankScore: number
): MirrorReflectionCandidate {
  return candidate(
    "abstraction_concrete",
    sessionId,
    statement,
    evidence,
    Math.max(rankScore, 38)
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

function repetitionTopCountsEvidence(features: MirrorFeatures, depth = 4): MirrorEvidence {
  const parts = features.topRepeatedWords
    .slice(0, depth)
    .map((e) => `"${e.word}" ×${e.count}`);
  return { text: `Repeated lemmas (tokenizer): ${parts.join("; ")}.` };
}

function tryRepetition(
  features: MirrorFeatures,
  sourceText: string
): MirrorReflectionCandidate | null {
  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
  const list = features.topRepeatedWords;
  const picked = list.find(
    (e) => repetitionMeetsCountGate(e.word, e.count) && !repetitionWordIsLowSignal(e.word)
  );
  if (!picked) return null;

  const namedEv: MirrorEvidence[] = [snippetAround(sourceText, picked.word)];
  const tie = list.find(
    (e) =>
      e.word !== picked.word &&
      e.count === picked.count &&
      repetitionMeetsCountGate(e.word, e.count) &&
      !repetitionWordIsLowSignal(e.word)
  );
  if (tie) namedEv.push(snippetAround(sourceText, tie.word));
  namedEv.push(repetitionTopCountsEvidence(features));

  const statement = `“${picked.word}” returns several times in this draft.`;
  const multiNamed = list.filter(
    (e) => repetitionMeetsCountGate(e.word, e.count) && !repetitionWordIsLowSignal(e.word)
  ).length;
  const rankScore = Math.min(100, picked.count * 14 + (multiNamed > 1 ? 5 : 0));
  return candidate("repetition", features.sessionId, statement, namedEv, rankScore);
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
    const statement = "The ending tightens noticeably.";
    const ev: MirrorEvidence[] = [
      {
        text: `Opening-quarter mean sentence length ${firstQ.toFixed(1)} words; closing-quarter mean ${lastQ.toFixed(1)} words; closing/opening mean ratio ${quarterRatio.toFixed(2)}; ${features.sentenceCount} sentences.`
      }
    ];
    const rankScore = 54 + Math.min(18, c.varianceSentenceLength * 0.55);
    return candidate("cadence", features.sessionId, statement, ev, rankScore);
  }

  if (c.endExpansion && quarterRatio != null && firstQ != null && lastQ != null) {
    const statement = "The lines lengthen as the piece moves toward its close.";
    const ev: MirrorEvidence[] = [
      {
        text: `Opening-quarter mean ${firstQ.toFixed(1)} words per sentence; closing-quarter mean ${lastQ.toFixed(1)} words; closing/opening mean ratio ${quarterRatio.toFixed(2)}; ${features.sentenceCount} sentences.`
      }
    ];
    const rankScore = 54 + Math.min(18, c.varianceSentenceLength * 0.55);
    return candidate("cadence", features.sessionId, statement, ev, rankScore);
  }

  const strongAlternation =
    features.sentenceCount >= MIRROR_GEN_CADENCE_MIN_SENTENCES &&
    c.shortSentenceCount >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT &&
    c.longSentenceCount >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG &&
    c.varianceSentenceLength >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE;

  if (strongAlternation) {
    const statement = "The cadence alternates between short and extended lines.";
    const ev: MirrorEvidence[] = [
      {
        text: `Short sentences (≤${MIRROR_SHORT_SENTENCE_MAX_WORDS} words): ${c.shortSentenceCount}; long (≥${MIRROR_LONG_SENTENCE_MIN_WORDS} words): ${c.longSentenceCount}; average sentence length ${c.avgSentenceLength.toFixed(1)} words; spread (population variance of sentence word counts) ${c.varianceSentenceLength.toFixed(2)}.`
      }
    ];
    const rankScore = 44 + Math.min(16, c.shortSentenceCount + c.longSentenceCount);
    return candidate("cadence", features.sessionId, statement, ev, rankScore);
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

  const metrics = `Abstract lexicon hits ${a.abstractCount}; concrete ${a.concreteCount}; ratio ${a.abstractConcreteRatio.toFixed(2)}.`;

  if (a.shiftsTowardAbstract && a.shiftsTowardConcrete) {
    if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return null;
    const statement = "This piece holds ideas and concrete detail in balance.";
    const ev: MirrorEvidence[] = [{ text: `${metrics} Both half-session rates rise for abstract and concrete lexicon matches (ambiguous direction).` }];
    const rankScore = 62 + Math.min(34, lex * 2.2);
    return abstractionCandidate(features.sessionId, statement, ev, rankScore);
  }

  if (a.shiftsTowardAbstract && lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT) {
    const statement = "Language grows more conceptual than scene-based toward the back half.";
    const ev: MirrorEvidence[] = [{ text: `${metrics} Abstract-lexicon matches pick up in the second half of tokens.` }];
    const rankScore = 64 + Math.min(36, a.abstractCount * 3.2);
    return abstractionCandidate(features.sessionId, statement, ev, rankScore);
  }

  if (a.shiftsTowardConcrete && lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT) {
    const statement = "Objects and detail carry more of the late passage than earlier on.";
    const ev: MirrorEvidence[] = [{ text: `${metrics} Concrete-lexicon matches pick up in the second half of tokens.` }];
    const rankScore = 64 + Math.min(36, a.concreteCount * 3.2);
    return abstractionCandidate(features.sessionId, statement, ev, rankScore);
  }

  if (lex >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) {
    const ratioOkIdeas =
      a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO && a.abstractCount >= 2;
    const ratioOkIdeasSoft =
      !ratioOkIdeas &&
      a.abstractCount >= 3 &&
      a.abstractConcreteRatio >= 1.06;
    const ratioOkConcrete =
      a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1) &&
      a.concreteCount >= 2;

    if (ratioOkIdeas && !ratioOkConcrete) {
      const statement = "This piece stays mostly in the realm of ideas.";
      const ev: MirrorEvidence[] = [{ text: metrics }];
      const rankScore = 52 + Math.min(34, lex * 2.5);
      return abstractionCandidate(features.sessionId, statement, ev, rankScore);
    }
    if (ratioOkIdeasSoft && !ratioOkConcrete) {
      const statement = "This piece stays mostly in the realm of ideas.";
      const ev: MirrorEvidence[] = [{ text: `${metrics} Idea-leaning lexicon signal is present but below the stricter ratio gate.` }];
      const rankScore = 50 + Math.min(32, lex * 2.5);
      return abstractionCandidate(features.sessionId, statement, ev, rankScore);
    }
    if (ratioOkConcrete && !ratioOkIdeas) {
      const statement = "The piece is grounded more in objects and detail than in abstraction.";
      const ev: MirrorEvidence[] = [{ text: metrics }];
      const rankScore = 52 + Math.min(34, lex * 2.5);
      return abstractionCandidate(features.sessionId, statement, ev, rankScore);
    }

    const statement = "Idea-words and image-words both show up often enough to matter.";
    const ev: MirrorEvidence[] = [{ text: metrics }];
    const rankScore = 47 + Math.min(30, lex * 2.35);
    return abstractionCandidate(features.sessionId, statement, ev, rankScore);
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

  const tallies = `Qualifiers ${h.qualifierCount}; pivots ${h.pivotCount}; contradiction markers ${h.contradictionMarkers}; uncertainty markers ${h.uncertaintyMarkers}; total ${total}; about ${per100.toFixed(1)} per 100 tokenizer words.`;

  let statement: string;
  if (soft >= turn && h.qualifierCount >= 2) {
    statement = "Statements are often qualified just after they appear.";
  } else if (turn >= soft && turn >= 2 && soft >= 2) {
    statement = "Assertions are often followed by softening.";
  } else {
    statement = "Statements are often followed by revision or softening.";
  }

  const ev: MirrorEvidence[] = [{ text: tallies }];
  let rankScore = Math.min(100, 30 + total * 4 + per100);
  if (soft < 3 && turn >= 2) rankScore -= 10;
  return candidate("hesitation_qualification", features.sessionId, statement, ev, rankScore);
}

/**
 * Builds at most one candidate per mirror category from features; skips weak buckets.
 */
export function buildReflectionCandidates(
  features: MirrorFeatures,
  sourceText: string
): MirrorReflectionCandidate[] {
  const text = normalizeText(sourceText);
  const out: MirrorReflectionCandidate[] = [];

  const rep = tryRepetition(features, text);
  if (rep) out.push(rep);

  const abs = tryAbstraction(features);
  if (abs) out.push(abs);

  const cad = tryCadence(features);
  if (cad) out.push(cad);

  const hes = tryHesitation(features);
  if (hes) out.push(hes);

  return out;
}

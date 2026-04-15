import {
  MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT,
  MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL,
  MIRROR_GEN_CADENCE_EVEN_MAX_VARIANCE,
  MIRROR_GEN_CADENCE_MIN_SENTENCES,
  MIRROR_GEN_CADENCE_MIN_VARIANCE,
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
  const top = features.topRepeatedWords[0];
  if (!top || !repetitionMeetsCountGate(top.word, top.count)) return null;

  const ev: MirrorEvidence[] = [repetitionTopCountsEvidence(features)];

  if (repetitionWordIsLowSignal(top.word)) {
    const slice = snippetAround(sourceText, top.word);
    if (slice.text) ev.unshift(slice);
    const statement = "A few recurring words carry much of the weight here.";
    const rankScore = Math.min(100, top.count * 12 + (features.topRepeatedWords.length > 1 ? 6 : 0));
    return candidate("repetition", features.sessionId, statement, ev, rankScore);
  }

  const namedEv: MirrorEvidence[] = [snippetAround(sourceText, top.word)];
  if (features.topRepeatedWords[1] && features.topRepeatedWords[1].count === top.count) {
    namedEv.push(snippetAround(sourceText, features.topRepeatedWords[1].word));
  }
  namedEv.push(repetitionTopCountsEvidence(features));

  const statement = `You return several times to “${top.word}.”`;
  const rankScore = Math.min(100, top.count * 14 + (features.topRepeatedWords.length > 1 ? 5 : 0));
  return candidate("repetition", features.sessionId, statement, namedEv, rankScore);
}

function tryCadence(features: MirrorFeatures): MirrorReflectionCandidate | null {
  const c = features.cadenceProfile;
  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
  if (features.sentenceCount < MIRROR_GEN_CADENCE_MIN_SENTENCES) return null;

  if (c.endCompression && c.meanSentenceLengthFirstQuarterWords != null && c.meanSentenceLengthLastQuarterWords != null) {
    const statement = "The ending tightens noticeably.";
    const ev: MirrorEvidence[] = [
      {
        text: `Opening-quarter mean sentence length ${c.meanSentenceLengthFirstQuarterWords.toFixed(1)} words; closing-quarter mean ${c.meanSentenceLengthLastQuarterWords.toFixed(1)} words; ${features.sentenceCount} sentences.`
      }
    ];
    const rankScore = 72 + Math.min(28, c.varianceSentenceLength);
    return candidate("cadence", features.sessionId, statement, ev, rankScore);
  }

  if (c.endExpansion && c.meanSentenceLengthFirstQuarterWords != null && c.meanSentenceLengthLastQuarterWords != null) {
    const statement = "The lines lengthen as the piece moves toward its close.";
    const ev: MirrorEvidence[] = [
      {
        text: `Opening-quarter mean ${c.meanSentenceLengthFirstQuarterWords.toFixed(1)} words per sentence; closing-quarter mean ${c.meanSentenceLengthLastQuarterWords.toFixed(1)} words; ${features.sentenceCount} sentences.`
      }
    ];
    const rankScore = 72 + Math.min(28, c.varianceSentenceLength);
    return candidate("cadence", features.sessionId, statement, ev, rankScore);
  }

  if (c.shortSentenceCount >= 2 && c.longSentenceCount >= 1) {
    const statement = "The cadence alternates between short and extended lines.";
    const ev: MirrorEvidence[] = [
      {
        text: `Short sentences (≤${MIRROR_SHORT_SENTENCE_MAX_WORDS} words): ${c.shortSentenceCount}; long (≥${MIRROR_LONG_SENTENCE_MIN_WORDS} words): ${c.longSentenceCount}; average sentence length ${c.avgSentenceLength.toFixed(1)} words.`
      }
    ];
    const rankScore = 38 + c.shortSentenceCount + c.longSentenceCount;
    return candidate("cadence", features.sessionId, statement, ev, rankScore);
  }

  if (
    features.sentenceCount >= MIRROR_GEN_CADENCE_MIN_SENTENCES &&
    c.varianceSentenceLength <= MIRROR_GEN_CADENCE_EVEN_MAX_VARIANCE
  ) {
    const statement = "The sentences stay relatively even in length.";
    const ev: MirrorEvidence[] = [
      {
        text: `Across ${features.sentenceCount} sentences, average length ${c.avgSentenceLength.toFixed(1)} words; spread (population variance of sentence word counts) ${c.varianceSentenceLength.toFixed(2)}.`
      }
    ];
    const rankScore = 34 + Math.min(20, features.sentenceCount);
    return candidate("cadence", features.sessionId, statement, ev, rankScore);
  }

  if (
    features.sentenceCount >= MIRROR_GEN_CADENCE_MIN_SENTENCES &&
    c.varianceSentenceLength >= MIRROR_GEN_CADENCE_MIN_VARIANCE
  ) {
    const statement = "The lines keep changing length from sentence to sentence.";
    const ev: MirrorEvidence[] = [
      {
        text: `${features.sentenceCount} sentences; average length ${c.avgSentenceLength.toFixed(1)} words; spread (population variance of sentence word counts) ${c.varianceSentenceLength.toFixed(2)}.`
      }
    ];
    const rankScore = 40 + Math.min(40, c.varianceSentenceLength);
    return candidate("cadence", features.sessionId, statement, ev, rankScore);
  }

  return null;
}

function tryAbstraction(features: MirrorFeatures): MirrorReflectionCandidate | null {
  const a = features.abstractionProfile;
  const lex = a.abstractCount + a.concreteCount;
  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;

  const metrics = `Abstract lexicon hits ${a.abstractCount}; concrete ${a.concreteCount}; ratio ${a.abstractConcreteRatio.toFixed(2)}.`;

  if (a.shiftsTowardAbstract && a.shiftsTowardConcrete) {
    if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return null;
    const statement = "This piece holds ideas and concrete detail in balance.";
    const ev: MirrorEvidence[] = [{ text: `${metrics} Both half-session rates rise for abstract and concrete lexicon matches (ambiguous direction).` }];
    const rankScore = 55 + Math.min(30, lex * 2);
    return candidate("abstraction_concrete", features.sessionId, statement, ev, rankScore);
  }

  if (a.shiftsTowardAbstract && lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT) {
    const statement = "The writing leans more conceptual than scene-based toward the back half.";
    const ev: MirrorEvidence[] = [{ text: `${metrics} Abstract-lexicon matches pick up in the second half of tokens.` }];
    const rankScore = 58 + Math.min(32, a.abstractCount * 3);
    return candidate("abstraction_concrete", features.sessionId, statement, ev, rankScore);
  }

  if (a.shiftsTowardConcrete && lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT) {
    const statement = "Objects and detail carry more of the late passage than earlier on.";
    const ev: MirrorEvidence[] = [{ text: `${metrics} Concrete-lexicon matches pick up in the second half of tokens.` }];
    const rankScore = 58 + Math.min(32, a.concreteCount * 3);
    return candidate("abstraction_concrete", features.sessionId, statement, ev, rankScore);
  }

  if (lex >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) {
    const ratioOkIdeas =
      a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO && a.abstractCount >= 2;
    const ratioOkConcrete =
      a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1) &&
      a.concreteCount >= 2;

    if (ratioOkIdeas && !ratioOkConcrete) {
      const statement = "This piece stays mostly in the realm of ideas.";
      const ev: MirrorEvidence[] = [{ text: metrics }];
      const rankScore = 35 + Math.min(25, lex * 2);
      return candidate("abstraction_concrete", features.sessionId, statement, ev, rankScore);
    }
    if (ratioOkConcrete && !ratioOkIdeas) {
      const statement = "The piece is grounded more in objects and detail than in abstraction.";
      const ev: MirrorEvidence[] = [{ text: metrics }];
      const rankScore = 35 + Math.min(25, lex * 2);
      return candidate("abstraction_concrete", features.sessionId, statement, ev, rankScore);
    }

    const statement = "Idea-words and image-words both show up often enough to matter.";
    const ev: MirrorEvidence[] = [{ text: metrics }];
    const rankScore = 32 + Math.min(22, lex * 2);
    return candidate("abstraction_concrete", features.sessionId, statement, ev, rankScore);
  }

  return null;
}

function tryHesitation(features: MirrorFeatures): MirrorReflectionCandidate | null {
  const h = features.hesitationProfile;
  const total =
    h.qualifierCount + h.pivotCount + h.contradictionMarkers + h.uncertaintyMarkers;
  const per100 = (total / Math.max(features.wordCount, 1)) * 100;

  if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
  if (total < MIRROR_GEN_HESITATION_MIN_TOTAL && per100 < MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS) {
    return null;
  }

  const tallies = `Qualifiers ${h.qualifierCount}; pivots ${h.pivotCount}; contradiction markers ${h.contradictionMarkers}; uncertainty markers ${h.uncertaintyMarkers}; total ${total}; about ${per100.toFixed(1)} per 100 tokenizer words.`;

  const soft = h.qualifierCount + h.uncertaintyMarkers;
  const turn = h.pivotCount + h.contradictionMarkers;

  let statement: string;
  if (soft >= turn && h.qualifierCount >= 2) {
    statement = "You often qualify a thought just after stating it.";
  } else if (turn >= soft && turn >= 2) {
    statement = "There's a pattern of assertion followed by softening.";
  } else {
    statement = "Statements here are often followed by revision or softening.";
  }

  const ev: MirrorEvidence[] = [{ text: tallies }];
  const rankScore = Math.min(100, 30 + total * 4 + per100);
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

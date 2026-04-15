import {
  MIRROR_CADENCE_MIN_SENTENCES_FOR_END_SHAPE,
  MIRROR_END_COMPRESSION_RATIO,
  MIRROR_END_EXPANSION_RATIO,
  MIRROR_LONG_SENTENCE_MIN_WORDS,
  MIRROR_SHORT_SENTENCE_MAX_WORDS
} from "../constants/thresholds.js";
import type { MirrorCadenceExtraction, MirrorSessionInput } from "../types/mirrorTypes.js";
import { splitSentences } from "../utils/splitSentences.js";
import { tokenizeText } from "../utils/tokenizeText.js";

function populationVariance(values: readonly number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  return values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
}

function mean(values: readonly number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / n;
}

export function extractCadence(input: MirrorSessionInput): MirrorCadenceExtraction {
  const sentences = splitSentences(input.text);
  const sentenceCount = sentences.length;
  const lengths = sentences.map((s) => tokenizeText(s).length);

  const averageSentenceLengthWords =
    sentenceCount === 0 ? 0 : lengths.reduce((a, b) => a + b, 0) / sentenceCount;
  const sentenceLengthVariance = populationVariance(lengths);

  let shortSentenceCount = 0;
  let longSentenceCount = 0;
  for (const len of lengths) {
    if (len <= MIRROR_SHORT_SENTENCE_MAX_WORDS && len > 0) shortSentenceCount += 1;
    if (len >= MIRROR_LONG_SENTENCE_MIN_WORDS) longSentenceCount += 1;
  }

  let meanSentenceLengthFirstQuarterWords: number | null = null;
  let meanSentenceLengthLastQuarterWords: number | null = null;
  let endCompression = false;
  let endExpansion = false;

  if (sentenceCount >= MIRROR_CADENCE_MIN_SENTENCES_FOR_END_SHAPE) {
    const q = Math.max(1, Math.ceil(sentenceCount / 4));
    const firstLens = lengths.slice(0, q);
    const lastLens = lengths.slice(-q);
    meanSentenceLengthFirstQuarterWords = mean(firstLens);
    meanSentenceLengthLastQuarterWords = mean(lastLens);

    if (meanSentenceLengthFirstQuarterWords > 0) {
      const ratio =
        meanSentenceLengthLastQuarterWords / meanSentenceLengthFirstQuarterWords;
      endCompression = ratio <= MIRROR_END_COMPRESSION_RATIO;
      endExpansion = ratio >= MIRROR_END_EXPANSION_RATIO;
    }
  }

  return {
    sentenceCount,
    averageSentenceLengthWords,
    sentenceLengthVariance,
    shortSentenceCount,
    longSentenceCount,
    endCompression,
    endExpansion,
    meanSentenceLengthFirstQuarterWords,
    meanSentenceLengthLastQuarterWords
  };
}

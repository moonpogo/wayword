import { MIRROR_STOPWORDS } from "../constants/stopwords.js";
import {
  MIRROR_MIN_TOKEN_LENGTH,
  MIRROR_REPETITION_MIN_COUNT,
  MIRROR_REPETITION_TOP_N
} from "../constants/thresholds.js";
import type { MirrorRepetitionExtraction, MirrorSessionInput } from "../types/mirrorTypes.js";
import { tokenizeText } from "../utils/tokenizeText.js";

function isEligibleRepetitionToken(word: string): boolean {
  if (word.length < MIRROR_MIN_TOKEN_LENGTH) return false;
  if (MIRROR_STOPWORDS.has(word)) return false;
  return true;
}

export function extractRepetition(input: MirrorSessionInput): MirrorRepetitionExtraction {
  const tokens = tokenizeText(input.text);
  const totalTokenCount = tokens.length;

  const counts = new Map<string, number>();
  let eligibleTokenCount = 0;

  for (const raw of tokens) {
    const w = raw.toLowerCase();
    if (!isEligibleRepetitionToken(w)) continue;
    eligibleTokenCount += 1;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }

  const distinctEligibleTokenCount = counts.size;

  const topRepeatedWords = [...counts.entries()]
    .filter(([, c]) => c >= MIRROR_REPETITION_MIN_COUNT)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MIRROR_REPETITION_TOP_N)
    .map(([word, count]) => ({ word, count }));

  return {
    totalTokenCount,
    eligibleTokenCount,
    distinctEligibleTokenCount,
    topRepeatedWords
  };
}

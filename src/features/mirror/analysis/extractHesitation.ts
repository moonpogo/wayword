import {
  MIRROR_CONTRADICTION_MARKER_WORDS,
  MIRROR_PIVOT_WORDS,
  MIRROR_QUALIFIER_WORDS,
  MIRROR_UNCERTAINTY_WORDS
} from "../constants/hesitationWords.js";
import type { MirrorHesitationExtraction, MirrorSessionInput } from "../types/mirrorTypes.js";
import { tokenizeText } from "../utils/tokenizeText.js";

const QUALIFIERS = new Set(MIRROR_QUALIFIER_WORDS.map((w) => w.toLowerCase()));
const PIVOTS = new Set(MIRROR_PIVOT_WORDS.map((w) => w.toLowerCase()));
const CONTRADICTIONS = new Set(MIRROR_CONTRADICTION_MARKER_WORDS.map((w) => w.toLowerCase()));
const UNCERTAINTY = new Set(MIRROR_UNCERTAINTY_WORDS.map((w) => w.toLowerCase()));

export function extractHesitation(input: MirrorSessionInput): MirrorHesitationExtraction {
  const tokens = tokenizeText(input.text).map((t) => t.toLowerCase());
  const contentTokenCount = tokens.length;

  let qualifierLexiconMatchCount = 0;
  let pivotLexiconMatchCount = 0;
  let contradictionLexiconMatchCount = 0;
  let uncertaintyLexiconMatchCount = 0;

  for (const w of tokens) {
    if (QUALIFIERS.has(w)) qualifierLexiconMatchCount += 1;
    if (PIVOTS.has(w)) pivotLexiconMatchCount += 1;
    if (CONTRADICTIONS.has(w)) contradictionLexiconMatchCount += 1;
    if (UNCERTAINTY.has(w)) uncertaintyLexiconMatchCount += 1;
  }

  return {
    contentTokenCount,
    qualifierLexiconMatchCount,
    pivotLexiconMatchCount,
    contradictionLexiconMatchCount,
    uncertaintyLexiconMatchCount
  };
}

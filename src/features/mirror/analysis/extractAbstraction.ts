import { MIRROR_ABSTRACT_WORDS } from "../constants/abstractWords.js";
import { MIRROR_CONCRETE_WORDS } from "../constants/concreteWords.js";
import {
  MIRROR_ABSTRACTION_SHIFT_MIN_RATE_DELTA,
  MIRROR_ABSTRACTION_SHIFT_RATIO
} from "../constants/thresholds.js";
import type { MirrorAbstractionExtraction, MirrorSessionInput } from "../types/mirrorTypes.js";
import { tokenizeText } from "../utils/tokenizeText.js";

const ABSTRACT = new Set(MIRROR_ABSTRACT_WORDS.map((w) => w.toLowerCase()));
const CONCRETE = new Set(MIRROR_CONCRETE_WORDS.map((w) => w.toLowerCase()));

export function extractAbstraction(input: MirrorSessionInput): MirrorAbstractionExtraction {
  const tokens = tokenizeText(input.text).map((t) => t.toLowerCase());
  const contentTokenCount = tokens.length;

  let abstractCount = 0;
  let concreteCount = 0;

  const firstHalfEnd = Math.ceil(contentTokenCount / 2);
  let firstHalfAbstractMatchCount = 0;
  let secondHalfAbstractMatchCount = 0;
  let firstHalfConcreteMatchCount = 0;
  let secondHalfConcreteMatchCount = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const w = tokens[i]!;
    const inFirst = i < firstHalfEnd;

    if (ABSTRACT.has(w)) {
      abstractCount += 1;
      if (inFirst) firstHalfAbstractMatchCount += 1;
      else secondHalfAbstractMatchCount += 1;
    }
    if (CONCRETE.has(w)) {
      concreteCount += 1;
      if (inFirst) firstHalfConcreteMatchCount += 1;
      else secondHalfConcreteMatchCount += 1;
    }
  }

  const abstractConcreteRatio = abstractCount / Math.max(concreteCount, 1);

  const firstTokens = firstHalfEnd;
  const secondTokens = contentTokenCount - firstHalfEnd;

  const d1a = firstHalfAbstractMatchCount / Math.max(1, firstTokens);
  const d2a = secondHalfAbstractMatchCount / Math.max(1, secondTokens);
  const d1c = firstHalfConcreteMatchCount / Math.max(1, firstTokens);
  const d2c = secondHalfConcreteMatchCount / Math.max(1, secondTokens);

  /*
   * Generation readiness: when both shift flags are true, treat directional abstraction
   * movement as ambiguous; generation must not emit two separate movement reflections.
   */
  let shiftsTowardAbstract = false;
  let shiftsTowardConcrete = false;
  if (contentTokenCount >= 2 && firstTokens >= 1 && secondTokens >= 1) {
    shiftsTowardAbstract =
      d2a > d1a * MIRROR_ABSTRACTION_SHIFT_RATIO &&
      d2a - d1a >= MIRROR_ABSTRACTION_SHIFT_MIN_RATE_DELTA;
    shiftsTowardConcrete =
      d2c > d1c * MIRROR_ABSTRACTION_SHIFT_RATIO &&
      d2c - d1c >= MIRROR_ABSTRACTION_SHIFT_MIN_RATE_DELTA;
  }

  return {
    abstractCount,
    concreteCount,
    abstractConcreteRatio,
    shiftsTowardConcrete,
    shiftsTowardAbstract,
    contentTokenCount,
    firstHalfAbstractMatchCount,
    secondHalfAbstractMatchCount,
    firstHalfConcreteMatchCount,
    secondHalfConcreteMatchCount
  };
}

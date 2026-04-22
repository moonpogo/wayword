import {
  MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO,
  MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL
} from "../../constants/generationThresholds.js";
import type { NormalizedMirrorSessionDigest } from "./normalizeDigest.js";

export function sessionAbstractIdeaLean(d: NormalizedMirrorSessionDigest): boolean {
  const a = d.abstraction;
  const lex = a.abstractCount + a.concreteCount;
  if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return false;
  if (a.abstractCount < 2) return false;
  if (a.abstractConcreteRatio < MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO) return false;
  const concreteDominant =
    a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1) &&
    a.concreteCount >= 2;
  return !concreteDominant;
}

export function sessionAbstractConcreteLean(d: NormalizedMirrorSessionDigest): boolean {
  const a = d.abstraction;
  const lex = a.abstractCount + a.concreteCount;
  if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return false;
  if (a.concreteCount < 2) return false;
  const ideaLean =
    a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO && a.abstractCount >= 2;
  if (ideaLean) return false;
  return a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1);
}

export function sessionQualifierDensityPattern(d: NormalizedMirrorSessionDigest): boolean {
  const q = d.hesitation.qualifierCount;
  const w = Math.max(d.wordCount, 1);
  const per100 = (q / w) * 100;
  if (q < 2) return false;
  if (q >= 3 && per100 >= 1.0) return true;
  return q >= 2 && per100 >= 1.5;
}

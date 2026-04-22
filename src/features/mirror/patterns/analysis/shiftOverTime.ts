import { MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL } from "../../constants/generationThresholds.js";
import type { PatternCardCandidateV1 } from "../types.js";
import type { NormalizedMirrorSessionDigest } from "./normalizeDigest.js";

function mean(values: ReadonlyArray<number>): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function earlyLateSplit<T>(sorted: ReadonlyArray<T>): { early: T[]; late: T[] } | null {
  const n = sorted.length;
  if (n < 4) return null;
  const span = Math.max(2, Math.ceil(n * 0.4));
  const early = [...sorted.slice(0, span)];
  const late = [...sorted.slice(n - span)];
  if (early.length < 2 || late.length < 2) return null;
  return { early, late };
}

function qualifiersPer100(d: NormalizedMirrorSessionDigest): number {
  const w = Math.max(d.wordCount, 1);
  return (d.hesitation.qualifierCount / w) * 100;
}

/**
 * Earlier vs recent comparison on digest-only means. Requires at least four qualifying runs
 * so each segment holds two or more runs (no single-run segment).
 */
export function detectShiftOverTimeCandidates(
  sorted: ReadonlyArray<NormalizedMirrorSessionDigest>
): PatternCardCandidateV1[] {
  const split = earlyLateSplit(sorted);
  if (!split) return [];
  const { early, late } = split;
  const out: PatternCardCandidateV1[] = [];

  const earlyAbsRatios = early
    .filter((d) => d.abstraction.abstractCount + d.abstraction.concreteCount >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL)
    .map((d) => d.abstraction.abstractConcreteRatio);
  const lateAbsRatios = late
    .filter((d) => d.abstraction.abstractCount + d.abstraction.concreteCount >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL)
    .map((d) => d.abstraction.abstractConcreteRatio);
  if (earlyAbsRatios.length >= 2 && lateAbsRatios.length >= 2) {
    const e = mean(earlyAbsRatios);
    const l = mean(lateAbsRatios);
    const delta = l - e;
    if (Math.abs(delta) >= 0.48) {
      const toward = delta > 0 ? "recent" : "earlier";
      out.push({
        family: "shift_over_time",
        id: `pattern_shift_over_time:abstraction_ratio:${toward}`,
        dedupeKey: "shift:abstraction_ratio",
        rankScore: Math.round(Math.abs(delta) * 200) + earlyAbsRatios.length + lateAbsRatios.length,
        statement: "The abstract-to-concrete label ratio shifts between earlier and more recent saved drafts.",
        evidence: [
          {
            text: `Mean abstract-to-concrete ratio was ${e.toFixed(2)} in the earlier segment (${earlyAbsRatios.length} runs) and ${l.toFixed(
              2
            )} in the more recent segment (${lateAbsRatios.length} runs).`
          }
        ]
      });
    }
  }

  const earlyCad = early.filter((d) => d.cadence.sentenceCount >= 4).map((d) => d.cadence.avgSentenceLength);
  const lateCad = late.filter((d) => d.cadence.sentenceCount >= 4).map((d) => d.cadence.avgSentenceLength);
  if (earlyCad.length >= 2 && lateCad.length >= 2) {
    const e = mean(earlyCad);
    const l = mean(lateCad);
    const delta = l - e;
    if (Math.abs(delta) >= 2.35) {
      const toward = delta > 0 ? "recent" : "earlier";
      out.push({
        family: "shift_over_time",
        id: `pattern_shift_over_time:sentence_length:${toward}`,
        dedupeKey: "shift:sentence_length_mean",
        rankScore: Math.round(Math.abs(delta) * 40) + earlyCad.length + lateCad.length,
        statement: "Average sentence length shifts between earlier and more recent saved drafts.",
        evidence: [
          {
            text: `Mean words-per-sentence moved from ${e.toFixed(1)} to ${l.toFixed(1)} comparing the two time segments (${earlyCad.length}+${lateCad.length} cadence-qualified runs).`
          }
        ]
      });
    }
  }

  const earlyQ = early.map((d) => qualifiersPer100(d));
  const lateQ = late.map((d) => qualifiersPer100(d));
  if (earlyQ.length >= 2 && lateQ.length >= 2) {
    const e = mean(earlyQ);
    const l = mean(lateQ);
    const delta = l - e;
    if (Math.abs(delta) >= 0.95) {
      const toward = delta > 0 ? "recent" : "earlier";
      out.push({
        family: "shift_over_time",
        id: `pattern_shift_over_time:qualifier_rate:${toward}`,
        dedupeKey: "shift:qualifier_per100",
        rankScore: Math.round(Math.abs(delta) * 80) + earlyQ.length + lateQ.length,
        statement: "Qualifier rate shifts between earlier and more recent saved drafts.",
        evidence: [
          {
            text: `Mean qualifiers per 100 words moved from ${e.toFixed(2)} to ${l.toFixed(2)} (${toward} segment higher).`
          }
        ]
      });
    }
  }

  return out;
}

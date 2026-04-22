import { MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL } from "../../constants/generationThresholds.js";
import type { PatternCardCandidateV1 } from "../types.js";
import type { NormalizedMirrorSessionDigest } from "./normalizeDigest.js";

function populationStd(values: ReadonlyArray<number>): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const v = values.reduce((acc, x) => acc + (x - mean) ** 2, 0) / n;
  return Math.sqrt(v);
}

function minMax(values: ReadonlyArray<number>): { min: number; max: number } | null {
  if (values.length === 0) return null;
  let min = values[0];
  let max = values[0];
  for (const x of values) {
    if (x < min) min = x;
    if (x > max) max = x;
  }
  return { min, max };
}

/**
 * Cross-run tight vs loose bands on digest-only metrics (cadence + abstraction ratio).
 */
export function detectConsistencyVariationCandidates(
  sorted: ReadonlyArray<NormalizedMirrorSessionDigest>
): PatternCardCandidateV1[] {
  const n = sorted.length;
  if (n < 3) return [];
  const out: PatternCardCandidateV1[] = [];

  const cadMeans = sorted
    .filter((d) => d.cadence.sentenceCount >= 4)
    .map((d) => d.cadence.avgSentenceLength);
  const mm = minMax(cadMeans);
  if (mm && cadMeans.length >= 3) {
    const span = mm.max - mm.min;
    /** Ignore trivial identical means (no real band to describe). */
    if (span >= 0.45 && span <= 2.4) {
      out.push({
        family: "consistency_vs_variation",
        id: "pattern_consistency_vs_variation:sentence_length_tight",
        dedupeKey: "consistency:sentence_length_band",
        rankScore: Math.round(200 - span * 40) + cadMeans.length * 5,
        statement: "Average sentence length sits in a narrow band across cadence-qualified saved drafts.",
        evidence: [
          {
            text: `Across ${cadMeans.length} runs with four or more sentences, per-run averages stayed between ${mm.min.toFixed(
              1
            )} and ${mm.max.toFixed(1)} words per sentence.`
          }
        ]
      });
    } else if (span >= 7.5 && cadMeans.length >= 3) {
      out.push({
        family: "consistency_vs_variation",
        id: "pattern_consistency_vs_variation:sentence_length_wide",
        dedupeKey: "variation:sentence_length_band",
        rankScore: Math.round(span * 25) + cadMeans.length * 4,
        statement: "Average sentence length swings across cadence-qualified saved drafts.",
        evidence: [
          {
            text: `Across ${cadMeans.length} runs with four or more sentences, per-run averages ranged from ${mm.min.toFixed(
              1
            )} to ${mm.max.toFixed(1)} words per sentence.`
          }
        ]
      });
    }
  }

  const ratios = sorted
    .filter((d) => d.abstraction.abstractCount + d.abstraction.concreteCount >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL)
    .map((d) => d.abstraction.abstractConcreteRatio);
  if (ratios.length >= 3) {
    const std = populationStd(ratios);
    if (std <= 0.17 && std >= 1e-6) {
      out.push({
        family: "consistency_vs_variation",
        id: "pattern_consistency_vs_variation:abstraction_ratio_tight",
        dedupeKey: "consistency:abstraction_ratio_std",
        rankScore: Math.round(160 - std * 500) + ratios.length * 6,
        statement: "The abstract-to-concrete label ratio stays close run to run when lexicon totals clear the floor.",
        evidence: [
          {
            text: `Across ${ratios.length} lexicon-qualified runs, the standard deviation of the ratio was ${std.toFixed(3)}.`
          }
        ]
      });
    } else if (std >= 1.22) {
      out.push({
        family: "consistency_vs_variation",
        id: "pattern_consistency_vs_variation:abstraction_ratio_loose",
        dedupeKey: "variation:abstraction_ratio_std",
        rankScore: Math.round(std * 420) + ratios.length * 5,
        statement: "The abstract-to-concrete label ratio drifts run to run when lexicon totals clear the floor.",
        evidence: [
          {
            text: `Across ${ratios.length} lexicon-qualified runs, the standard deviation of the ratio was ${std.toFixed(3)}.`
          }
        ]
      });
    }
  }

  return out;
}

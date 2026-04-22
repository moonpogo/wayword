import type { MirrorSessionDigest } from "../../src/features/mirror/recent/types.js";

let fixtureSeq = 0;
function nextTs() {
  fixtureSeq += 1;
  return 1_700_000_000_000 + fixtureSeq;
}

function digest(partial: Omit<MirrorSessionDigest, "v">): MirrorSessionDigest {
  return { v: 1, ...partial };
}

/** Six qualifying runs sharing a strong non-dull repeated surface word. */
export const PATTERNS_EVAL_STABLE_RECURRENCE: MirrorSessionDigest[] = Array.from({ length: 6 }, (_, i) =>
  digest({
    sessionId: `stable-${i}`,
    timestamp: nextTs(),
    qualifiesForRecent: true,
    wordCount: 48,
    topRepeatedWords: [
      { word: "zephyr", count: 6 },
      { word: "branch", count: 3 }
    ],
    abstraction: { abstractCount: 2, concreteCount: 3, abstractConcreteRatio: 0.7 },
    hesitation: { qualifierCount: 1, pivotCount: 0, contradictionMarkers: 0, uncertaintyMarkers: 0 },
    cadence: {
      sentenceCount: 6,
      avgSentenceLength: 12,
      varianceSentenceLength: 18,
      shortSentenceCount: 2,
      longSentenceCount: 1,
      endCompression: false,
      endExpansion: false
    },
    repetition: { eligibleTokenCount: 40, distinctEligibleTokenCount: 28 }
  })
);

/** Four runs with a clear early-vs-recent move in abstract-to-concrete ratio. */
export const PATTERNS_EVAL_REAL_SHIFT: MirrorSessionDigest[] = [
  digest({
    sessionId: "shift-0",
    timestamp: nextTs(),
    qualifiesForRecent: true,
    wordCount: 44,
    topRepeatedWords: [],
    abstraction: { abstractCount: 1, concreteCount: 5, abstractConcreteRatio: 0.2 },
    hesitation: { qualifierCount: 2, pivotCount: 0, contradictionMarkers: 0, uncertaintyMarkers: 0 },
    cadence: {
      sentenceCount: 5,
      avgSentenceLength: 11,
      varianceSentenceLength: 14,
      shortSentenceCount: 2,
      longSentenceCount: 0,
      endCompression: false,
      endExpansion: false
    },
    repetition: { eligibleTokenCount: 36, distinctEligibleTokenCount: 30 }
  }),
  digest({
    sessionId: "shift-1",
    timestamp: nextTs(),
    qualifiesForRecent: true,
    wordCount: 44,
    topRepeatedWords: [],
    abstraction: { abstractCount: 1, concreteCount: 5, abstractConcreteRatio: 0.2 },
    hesitation: { qualifierCount: 2, pivotCount: 0, contradictionMarkers: 0, uncertaintyMarkers: 0 },
    cadence: {
      sentenceCount: 5,
      avgSentenceLength: 11.5,
      varianceSentenceLength: 15,
      shortSentenceCount: 2,
      longSentenceCount: 0,
      endCompression: false,
      endExpansion: false
    },
    repetition: { eligibleTokenCount: 36, distinctEligibleTokenCount: 30 }
  }),
  digest({
    sessionId: "shift-2",
    timestamp: nextTs(),
    qualifiesForRecent: true,
    wordCount: 44,
    topRepeatedWords: [],
    abstraction: { abstractCount: 5, concreteCount: 2, abstractConcreteRatio: 2.5 },
    hesitation: { qualifierCount: 2, pivotCount: 0, contradictionMarkers: 0, uncertaintyMarkers: 0 },
    cadence: {
      sentenceCount: 5,
      avgSentenceLength: 12,
      varianceSentenceLength: 16,
      shortSentenceCount: 2,
      longSentenceCount: 0,
      endCompression: false,
      endExpansion: false
    },
    repetition: { eligibleTokenCount: 36, distinctEligibleTokenCount: 30 }
  }),
  digest({
    sessionId: "shift-3",
    timestamp: nextTs(),
    qualifiesForRecent: true,
    wordCount: 44,
    topRepeatedWords: [],
    abstraction: { abstractCount: 5, concreteCount: 2, abstractConcreteRatio: 2.5 },
    hesitation: { qualifierCount: 2, pivotCount: 0, contradictionMarkers: 0, uncertaintyMarkers: 0 },
    cadence: {
      sentenceCount: 5,
      avgSentenceLength: 12.5,
      varianceSentenceLength: 17,
      shortSentenceCount: 2,
      longSentenceCount: 0,
      endCompression: false,
      endExpansion: false
    },
    repetition: { eligibleTokenCount: 36, distinctEligibleTokenCount: 30 }
  })
];

const noisyAbstraction: ReadonlyArray<{
  abstractCount: number;
  concreteCount: number;
  abstractConcreteRatio: number;
}> = [
  { abstractCount: 3, concreteCount: 3, abstractConcreteRatio: 1.0 },
  { abstractCount: 4, concreteCount: 3, abstractConcreteRatio: 4 / 3 },
  { abstractCount: 3, concreteCount: 4, abstractConcreteRatio: 0.75 },
  { abstractCount: 4, concreteCount: 3, abstractConcreteRatio: 4 / 3 },
  { abstractCount: 3, concreteCount: 4, abstractConcreteRatio: 0.75 }
];

/** Five runs: mixed ratios without a lean streak, weak repetition rows, middling cadence spread — expect no card. */
export const PATTERNS_EVAL_NOISY: MirrorSessionDigest[] = [0, 1, 2, 3, 4].map((i) =>
  digest({
    sessionId: `noisy-${i}`,
    timestamp: nextTs(),
    qualifiesForRecent: true,
    wordCount: 50,
    topRepeatedWords: [{ word: `beacon${i}`, count: 3 }],
    abstraction: noisyAbstraction[i]!,
    hesitation: { qualifierCount: 1, pivotCount: 0, contradictionMarkers: 0, uncertaintyMarkers: 0 },
    cadence: {
      sentenceCount: 6,
      avgSentenceLength: 12 + (i % 2) * 0.05 + (i === 2 ? 0.15 : 0),
      varianceSentenceLength: 20 + i * 1.2,
      shortSentenceCount: 2,
      longSentenceCount: 1,
      endCompression: false,
      endExpansion: false
    },
    repetition: { eligibleTokenCount: 42, distinctEligibleTokenCount: 32 }
  })
);

export interface PatternsEvalCase {
  readonly id: string;
  readonly name: string;
  readonly digests: ReadonlyArray<MirrorSessionDigest>;
  /** Expected `patternsEmptyState` when no cards; omit when expecting cards. */
  readonly expectEmptyState?: "insufficient_runs" | "no_strong_pattern";
  /** Substring checks on selected card ids (order ignored). */
  readonly expectCardIdIncludes?: ReadonlyArray<string>;
}

export const patternsEvaluationCases: PatternsEvalCase[] = [
  {
    id: "patterns-stable-recurrence",
    name: "Stable lexical recurrence across six runs",
    digests: PATTERNS_EVAL_STABLE_RECURRENCE,
    expectCardIdIncludes: ["pattern_recurring_signal:lexical:zephyr"]
  },
  {
    id: "patterns-real-shift",
    name: "Detectable abstraction ratio shift (four runs)",
    digests: PATTERNS_EVAL_REAL_SHIFT,
    expectCardIdIncludes: ["pattern_shift_over_time:abstraction_ratio"]
  },
  {
    id: "patterns-noisy-weak",
    name: "Noisy alternating history — expect empty selection",
    digests: PATTERNS_EVAL_NOISY,
    expectEmptyState: "no_strong_pattern"
  }
];

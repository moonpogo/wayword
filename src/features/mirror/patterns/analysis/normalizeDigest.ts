import type { MirrorSessionDigest } from "../../recent/types.js";

/**
 * Digest shape used by Patterns V1: always includes cadence / repetition / half-session abstraction flags.
 * Older saved digests omit optional blocks; defaults keep aggregation deterministic.
 */
export interface NormalizedMirrorSessionDigest extends MirrorSessionDigest {
  readonly cadence: {
    readonly sentenceCount: number;
    readonly avgSentenceLength: number;
    readonly varianceSentenceLength: number;
    readonly shortSentenceCount: number;
    readonly longSentenceCount: number;
    readonly endCompression: boolean;
    readonly endExpansion: boolean;
  };
  readonly repetition: {
    readonly eligibleTokenCount: number;
    readonly distinctEligibleTokenCount: number;
  };
  readonly abstraction: MirrorSessionDigest["abstraction"] & {
    readonly shiftsTowardConcrete: boolean;
    readonly shiftsTowardAbstract: boolean;
  };
}

export function normalizeMirrorSessionDigest(d: MirrorSessionDigest): NormalizedMirrorSessionDigest {
  const cadence =
    d.cadence ??
    ({
      sentenceCount: 0,
      avgSentenceLength: 0,
      varianceSentenceLength: 0,
      shortSentenceCount: 0,
      longSentenceCount: 0,
      endCompression: false,
      endExpansion: false
    } as const);

  const repetition =
    d.repetition ??
    ({
      eligibleTokenCount: 0,
      distinctEligibleTokenCount: 0
    } as const);

  const abstractionBase = d.abstraction;
  const abstraction = {
    abstractCount: abstractionBase.abstractCount,
    concreteCount: abstractionBase.concreteCount,
    abstractConcreteRatio: abstractionBase.abstractConcreteRatio,
    shiftsTowardConcrete: abstractionBase.shiftsTowardConcrete ?? false,
    shiftsTowardAbstract: abstractionBase.shiftsTowardAbstract ?? false
  };

  return {
    ...d,
    cadence,
    repetition,
    abstraction
  };
}

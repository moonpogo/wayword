import type { MirrorRecentTrendEvidence } from "../recent/types.js";

export type PatternFamilyV1 = "recurring_signal" | "shift_over_time" | "consistency_vs_variation";

/** Internal candidate before cap / dedupe (pure ranking score). */
export interface PatternCardCandidateV1 {
  readonly family: PatternFamilyV1;
  readonly id: string;
  readonly rankScore: number;
  /** Stable key for dedupe (one winner per key). */
  readonly dedupeKey: string;
  readonly statement: string;
  readonly evidence: ReadonlyArray<MirrorRecentTrendEvidence>;
}

export type PatternsV1EmptyState = "insufficient_runs" | "no_strong_pattern";

export interface PatternsV1SelectionResult {
  readonly qualifyingRunCount: number;
  readonly cards: ReadonlyArray<PatternCardCandidateV1>;
  readonly emptyState: PatternsV1EmptyState | null;
}

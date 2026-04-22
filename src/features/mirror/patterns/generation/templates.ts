import type { MirrorRecentTrendEvidence } from "../../recent/types.js";

export function recurringLexicalEvidence(
  displayWord: string,
  hitSessions: number,
  qualifyingRuns: number
): ReadonlyArray<MirrorRecentTrendEvidence> {
  return [
    {
      text: `“${displayWord}” met the repetition gate in ${hitSessions} of ${qualifyingRuns} qualifying runs.`
    }
  ];
}

export function recurringQualificationEvidence(
  hitSessions: number,
  qualifyingRuns: number
): ReadonlyArray<MirrorRecentTrendEvidence> {
  return [
    {
      text: `Qualifier-density snapshots fired in ${hitSessions} of ${qualifyingRuns} qualifying runs.`
    }
  ];
}

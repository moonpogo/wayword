import type { MirrorRecentTrendEvidence } from "../../recent/types.js";

export function recurringLexicalEvidence(
  displayWord: string,
  hitSessions: number,
  includedDrafts: number
): ReadonlyArray<MirrorRecentTrendEvidence> {
  return [
    {
      text: `“${displayWord}” showed up again in ${hitSessions} of ${includedDrafts} saved drafts counted here.`
    }
  ];
}

export function recurringQualificationEvidence(
  hitSessions: number,
  includedDrafts: number
): ReadonlyArray<MirrorRecentTrendEvidence> {
  return [
    {
      text: `Softening markers sat heavier in ${hitSessions} of ${includedDrafts} saved drafts counted here.`
    }
  ];
}

import type { MirrorRecentTrendEvidence } from "../../recent/types.js";

export function recurringLexicalEvidence(
  displayWord: string,
  hitSessions: number,
  includedDrafts: number
): ReadonlyArray<MirrorRecentTrendEvidence> {
  return [
    {
      text: `\u201c${displayWord}\u201d appeared in ${hitSessions} of ${includedDrafts} qualifying drafts.`
    }
  ];
}

export function recurringQualificationEvidence(
  hitSessions: number,
  includedDrafts: number
): ReadonlyArray<MirrorRecentTrendEvidence> {
  return [
    {
      text: `Softening sits heavier in ${hitSessions} of ${includedDrafts} qualifying drafts.`
    }
  ];
}

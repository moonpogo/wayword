import type { MirrorRecentTrend } from "./types.js";

const LEXICAL_ID_PREFIX = "recent_lexical_anchor:";

function extractLexicalWord(id: string): string | null {
  if (typeof id !== "string" || !id.startsWith(LEXICAL_ID_PREFIX)) {
    return null;
  }
  const w = id.slice(LEXICAL_ID_PREFIX.length).trim();
  return w.length > 0 ? w : null;
}

function lowerFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Clause body without a closing sentence period (for joining). */
function clauseFor(pattern: MirrorRecentTrend): string | null {
  switch (pattern.category) {
    case "recent_lexical_anchor": {
      const word = extractLexicalWord(pattern.id);
      if (!word) return null;
      return `\u201c${word}\u201d recurs across drafts`;
    }
    case "recent_abstraction_lean":
      return "Language leans toward ideas over scenes";
    case "recent_hesitation_qualification":
      return "Statements are often qualified just after they appear";
    default:
      return null;
  }
}

/** One full sentence when this pattern stands alone or opens the three-pattern case. */
function standaloneSentence(pattern: MirrorRecentTrend): string | null {
  switch (pattern.category) {
    case "recent_lexical_anchor": {
      const word = extractLexicalWord(pattern.id);
      if (!word) return null;
      return `\u201c${word}\u201d recurs across drafts.`;
    }
    case "recent_abstraction_lean":
      return "Language leans toward ideas over scenes.";
    case "recent_hesitation_qualification":
      return "Statements are often qualified just after they appear.";
    default:
      return null;
  }
}

/**
 * Converts up to three promoted recent trends into a short neutral profile string.
 * Omits numbers, counts, and evidence. Skips lexical rows when the anchor word cannot be parsed from `id`.
 */
export function buildReflectiveProfile(patterns: MirrorRecentTrend[]): string | null {
  if (!patterns || patterns.length === 0) {
    return null;
  }

  const top = patterns.slice(0, 3);
  const valid = top.filter((p) => clauseFor(p) != null);
  if (valid.length === 0) {
    return null;
  }

  if (valid.length === 1) {
    return standaloneSentence(valid[0]);
  }

  if (valid.length === 2) {
    const a = clauseFor(valid[0]);
    const b = clauseFor(valid[1]);
    return `${a} and ${lowerFirst(b!)}.`;
  }

  const s1 = standaloneSentence(valid[0]);
  const c2 = clauseFor(valid[1]);
  const c3 = clauseFor(valid[2]);
  return `${s1} ${c2}, and ${lowerFirst(c3!)}.`;
}

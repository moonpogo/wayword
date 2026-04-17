/**
 * Deterministic specificity tiers for ranking tie-breaks and dedupe tie-breaks.
 * Higher = more text-grounded / less generic fallback (does not change `rankScore` on candidates).
 */

const GENERIC_FALLBACK_STATEMENTS = new Set(
  [
    "both idea-words and image-words appear frequently.",
    "ideas and concrete detail stay in balance.",
    "statements are often revised or softened."
  ].map((s) => s.toLowerCase())
);

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Returns 0–100; higher breaks ties toward more specific, less boilerplate headlines.
 */
export function mirrorStatementSpecificity(statement: string): number {
  const n = norm(statement);
  if (GENERIC_FALLBACK_STATEMENTS.has(n)) return 20;

  // Named recurrence should beat most non-directional observations.
  if (n.includes("returns several times in this draft")) return 100;

  // Directional abstraction movement should lead when present.
  if (
    n === "the back half leans more conceptual than scene-based." ||
    n === "concrete detail carries more of the later passages."
  ) {
    return 110;
  }

  // Strong directional cadence changes remain high, but below directional abstraction.
  if (n === "the ending tightens noticeably." || n === "lines lengthen near the end.") {
    return 90;
  }
  if (n === "the cadence alternates between short and long lines.") return 84;

  // Non-shift directional abstraction beats generic mixed states.
  if (
    n === "ideas dominate over concrete detail." ||
    n === "concrete detail outweighs abstraction."
  ) {
    return 82;
  }

  if (n === "statements are often qualified just after they’re made.") return 58;
  if (n === "assertions are often followed by softening.") return 56;

  return 40;
}

/**
 * Deterministic specificity tiers for ranking tie-breaks and dedupe tie-breaks.
 * Higher = more text-grounded / less generic fallback (does not change `rankScore` on candidates).
 */

const GENERIC_FALLBACK_STATEMENTS = new Set(
  [
    "idea-words and image-words both show up often enough to matter.",
    "statements here are often followed by revision or softening."
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
  if (GENERIC_FALLBACK_STATEMENTS.has(n)) return 25;

  if (n.startsWith("you return several times to")) return 100;

  if (n === "the ending tightens noticeably." || n === "the lines lengthen as the piece moves toward its close.") {
    return 95;
  }
  if (n === "the cadence alternates between short and extended lines.") return 90;

  if (
    n === "the writing leans more conceptual than scene-based toward the back half." ||
    n === "objects and detail carry more of the late passage than earlier on."
  ) {
    return 90;
  }

  if (
    n === "this piece stays mostly in the realm of ideas." ||
    n === "the piece is grounded more in objects and detail than in abstraction."
  ) {
    return 85;
  }

  if (n === "this piece holds ideas and concrete detail in balance.") return 80;

  if (n === "you often qualify a thought just after stating it.") return 58;
  if (n === "there's a pattern of assertion followed by softening.") return 58;

  return 45;
}

/**
 * Collapse whitespace, trim, and normalize common punctuation variants to ASCII
 * so downstream token rules stay predictable.
 */
export function normalizeText(text: string): string {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2018\u2019\u201A\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

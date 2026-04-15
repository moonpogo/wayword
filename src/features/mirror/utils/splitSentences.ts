import { normalizeText } from "./normalizeText.js";

/**
 * Split on sentence-ending punctuation followed by whitespace or end of string.
 * Abbreviations like "e.g." are not special-cased in V1.
 */
export function splitSentences(text: string): string[] {
  const body = normalizeText(text);
  if (!body) return [];

  const parts = body.split(/(?<=[.!?])(?:\s+|$)/g);
  const out: string[] = [];
  for (const part of parts) {
    const s = part.trim();
    if (s) out.push(s);
  }
  return out;
}

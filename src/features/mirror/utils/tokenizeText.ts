import { normalizeText } from "./normalizeText.js";

/**
 * Lowercased word tokens (Unicode letters; internal apostrophe allowed once per token).
 */
export function tokenizeText(text: string): string[] {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) return [];
  return normalized.match(/\p{L}+(?:'\p{L}+)?/gu) ?? [];
}

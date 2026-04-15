import { normalizeText } from "./normalizeText.js";
import type { MirrorSessionInput } from "../types/mirrorTypes.js";

/** FNV-1a 32-bit over a string; stable for identical session material. */
function fnv1a32Hex(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Uses `input.sessionId` when non-empty; otherwise a deterministic fingerprint from
 * normalized text and optional timestamps (no randomness).
 */
export function resolveMirrorSessionId(input: MirrorSessionInput): string {
  const explicit = input.sessionId?.trim();
  if (explicit) return explicit;
  const basis = `${normalizeText(input.text)}|${input.startedAt ?? ""}|${input.endedAt ?? ""}`;
  return `mirror-${fnv1a32Hex(basis)}`;
}

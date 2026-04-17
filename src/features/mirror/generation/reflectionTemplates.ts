/**
 * Wayword-style copy rules for rule-based candidates (V1).
 *
 * Categories (internal enum unchanged):
 * - repetition
 * - abstraction_concrete
 * - cadence
 * - hesitation_qualification
 *
 * **Voice**
 * - Headline (`statement`): one observation-first sentence; plain, restrained; no metrics.
 * - Evidence: counts, ratios, means, snippets — everything that “proves” the line lives here.
 * - No advice, no diagnosis, no personality claims, no feigned certainty.
 *
 * **repetition**
 * - Named return only: the repeated lemma in quotes + “returns several times in this draft.”
 *   that passes count gates and is not dull/ultra-short; otherwise no repetition card.
 *
 * **abstraction_concrete**
 * - Ambiguous movement (both shift flags): balance-only headline; metrics + note in evidence.
 * - Single-direction shift: conceptual vs concrete leaning in the back half (headline); metrics in evidence.
 * - Density-only: mostly-ideas / mostly-grounded / mixed middle line; ratio gates in thresholds file.
 *
 * **cadence**
 * - End compression / expansion: stricter quarter mean ratio + minimum sentence count; quarter
 *   means and ratio in evidence; lower rank weight than earlier V1.
 * - Alternation: only when short/long counts and sentence-length variance all clear explicit floors;
 *   counts and spread in evidence. No separate “even rhythm” or “changing length” headlines.
 *
 * **hesitation_qualification**
 * - Headline chosen from a small set by bucket balance (qualify-after-state vs turn/soften vs general).
 * - Full bucket tallies and rate live in evidence only.
 *
 * **headline style rules**
 * - Avoid filler subjects like "this piece" or "the writing" unless necessary.
 * - Avoid vague abstractions like "realm of ideas."
 * - Prefer direct contrast where possible.
 * - Prefer simple phrasing over academic phrasing.
 * - Headlines should feel like observations, not labels.
 * - Keep sentences short and structurally clean.
 */

/** Pointer for tooling / search; rules live in this file’s module comment block. */
export const MIRROR_REFLECTION_TEMPLATE_RULES_DOC = "mirror:reflectionTemplates:v1";

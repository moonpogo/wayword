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
 * - Named return: “You return several times to ‘lemma.’” (non–low-signal lemma, count floor lower).
 * - Low-signal lemma (dull list or very short): higher count floor; headline uses the generic
 *   recurrence line; evidence carries tokenizer counts and a text slice.
 *
 * **abstraction_concrete**
 * - Ambiguous movement (both shift flags): balance-only headline; metrics + note in evidence.
 * - Single-direction shift: conceptual vs concrete leaning in the back half (headline); metrics in evidence.
 * - Density-only: mostly-ideas / mostly-grounded / mixed middle line; ratio gates in thresholds file.
 *
 * **cadence**
 * - End compression / expansion: plain observation about tightening or lengthening toward the close;
 *   quarter means in evidence only.
 * - Short + long mix: alternation headline; thresholds and counts in evidence.
 * - Even rhythm: low spread; no “variance” in headline.
 * - Uneven rhythm: high spread; headline describes changing line length without naming variance.
 *
 * **hesitation_qualification**
 * - Headline chosen from a small set by bucket balance (qualify-after-state vs turn/soften vs general).
 * - Full bucket tallies and rate live in evidence only.
 */

/** Pointer for tooling / search; rules live in this file’s module comment block. */
export const MIRROR_REFLECTION_TEMPLATE_RULES_DOC = "mirror:reflectionTemplates:v1";

import {
  MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER,
  MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS,
  MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE,
  MIRROR_HEADLINE_CADENCE_ALTERNATION,
  MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS,
  MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN,
  isMirrorAbstractionBalanceStatement,
  isMirrorAbstractionBothFrequentStatement,
  isMirrorFallbackSoftStatement,
  MIRROR_HEADLINE_OPENING_DIRECT,
  MIRROR_HEADLINE_OPENING_LOOSE,
  MIRROR_HEADLINE_OPENING_MOMENT,
  MIRROR_HEADLINE_SHIFT_HOLDS,
  MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER,
  MIRROR_HEADLINE_SHIFT_TURNS,
  isMirrorHesitationStandardNudgeStatement,
  normMirrorReflectionHeadline
} from "../constants/mirrorSessionHeadlines.js";
import type { MirrorPipelineResult, MirrorSelectedReflection } from "../types/mirrorTypes.js";

const PROMPT_FAMILIES = new Set([
  "Observation",
  "Relation",
  "Tension",
  "Possibility",
  "Constraint"
]);

/**
 * Restrained copy when the mirror cannot lean on strong surface text / cards.
 * Stays modest, and does not imply a prescribed follow-up run on the same prompt.
 */
export const MIRROR_NEXT_PASS_LOW_SIGNAL_FALLBACK =
  "With a little more language on the page, patterns get easier to notice.";

/**
 * Default when load fails, stack is empty, or mapping yields no line.
 * Observation-shaped, not a “do this next” brief.
 */
export const MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION =
  "What stands out in the draft you just wrote?";

export type MirrorAttentionalNudgeOpts = {
  /** Prompt family label from the active ritual (keeps phrasing in the same world). */
  promptFamily?: string | null;
  /**
   * True when post-run treats the submission as low-signal for reflection (short text and
   * weak/absent main mirror line or evidence), matching `computeMirrorPostRunPanelParts`.
   */
  lowSignal?: boolean;
  /** Stable id (e.g. runId) so variant choice does not flicker on re-render. */
  seed?: string | null;
  /**
   * Tokenizer word count for the submitted draft (same as mirror `analyzeText` / `tokenizeText`).
   * When the primary is soft fallback and this is at or above the ambiguous threshold, nudges
   * avoid “strong mirror” framing (e.g. chasing detail) while staying modest.
   */
  submissionWordCount?: number | null;
};

function normStatement(s: string): string {
  return normMirrorReflectionHeadline(s);
}

function pickIndex(seed: string, modulus: number): number {
  const s = String(seed ?? "");
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return modulus <= 0 ? 0 : h % modulus;
}

function pickLine(seedKey: string, lines: readonly string[]): string {
  if (!lines.length) return MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
  return lines[pickIndex(seedKey, lines.length)] ?? MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
}

function normPromptFamily(f: string | null | undefined): string | null {
  const t = String(f ?? "").trim();
  return PROMPT_FAMILIES.has(t) ? t : null;
}

function seedWithFamily(base: string, family: string | null): string {
  return family ? `${base}|fam:${family}` : `${base}|fam:na`;
}

/** Below this, keep generic fallback nudges (thin / fragment drafts). */
const MIRROR_NUDGE_AMBIGUOUS_MIN_WORDS = 28;

function pickDriverReflection(result: MirrorPipelineResult): MirrorSelectedReflection | null {
  const main = result.main;
  if (main && String(main.statement || "").trim()) {
    return main;
  }
  const supporting = Array.isArray(result.supporting) ? result.supporting : [];
  const first = supporting.find((c) => c && String(c.statement || "").trim());
  return first ?? null;
}

const NUDGE_LOW_SIGNAL: readonly string[] = [
  MIRROR_NEXT_PASS_LOW_SIGNAL_FALLBACK,
  "A fuller stretch of writing usually gives the mirror more to work with.",
  "What becomes a little easier to see with a few more sentences on the page?",
  "When the page has more on it, small echoes are easier to hear."
];

const NUDGE_GENERIC: readonly string[] = [
  MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION,
  "Where does the thread invite another glance?",
  "What detail keeps catching your attention?",
  "What remains unattended in what you wrote?"
];

/** When the mirror is soft fallback but the draft has real length: honest, low-claim prompts. */
const NUDGE_FALLBACK_AMBIGUOUS: readonly string[] = [
  "What still feels open (not wrong, just unsettled) in what you wrote?",
  "Where would you trust your own read more than a slick echo?",
  "If the mirror stays this quiet, what one thread do you still want to follow?"
];

const NUDGE_REPETITION: readonly string[] = [
  "What shifts if the same pressure shows up somewhere else?",
  "Where does the return feel different when you look again?",
  "What happens if that insistence loosens without vanishing?",
  "What opens if another word carries a slice of that weight?"
];

const NUDGE_CADENCE_TIGHTENS: readonly string[] = [
  "What if a later stretch lets the breath lengthen again?",
  "Where could the motion redistribute after that late tightening?",
  "What changes if one paragraph lets the line run a little longer?"
];

const NUDGE_CADENCE_LENGTHEN: readonly string[] = [
  "What happens if a middle passage holds a shorter beat for a moment?",
  "Where does a tighter line change the glide of what follows?",
  "What shifts if length gathers earlier instead of at the edge?"
];

const NUDGE_CADENCE_ALTERNATION: readonly string[] = [
  "What happens if one section holds a steadier stride?",
  "Where does the alternation want a softer hand in what follows?",
  "What remains if the swing between long and short quiets for a beat?"
];

const NUDGE_CADENCE_DEFAULT: readonly string[] = [
  "Where would you redistribute the motion?",
  "What changes if the pulse of the lines shifts mid-piece?",
  "What shows up if you follow the cadence into a neighboring texture?"
];

const NUDGE_ABSTRACT_LEANS: readonly string[] = [
  "What becomes touchable if the ideas rest in one place a little longer?",
  "Where does a single image want to carry more of the thinking?",
  "What surfaces if the abstractions lean toward one scene-stain?"
];

const NUDGE_CONCRETE_LEANS: readonly string[] = [
  "Where does the idea begin to surface behind the detail?",
  "What shifts if the objects fall away for a breath (not erased, just quieter)?",
  "What remains if the scene quiets further and something else hums?"
];

const NUDGE_ABSTRACTION_BALANCED: readonly string[] = [
  "What interests you if idea and image keep trading places?",
  "Where does one kind of attention want a little more room?",
  "What would you watch for in the handoff between scene and thought?"
];

const NUDGE_HESITATION: readonly string[] = [
  "What changes when the cushioning thins, without forcing a harder voice?",
  "Where does a line want to stand without the immediate softener?",
  "What clarity appears if the qualification arrives a beat later?",
  "What shifts if you let one assertion stay unaccompanied for a line?"
];

/**
 * Deterministic attentional nudge from the published mirror stack (category + canonical headline
 * text only). No draft re-analysis, no LLM.
 */
export function nextPassInstructionFromMirrorPipelineResult(
  result: MirrorPipelineResult | null | undefined,
  loadFailed: boolean,
  opts?: MirrorAttentionalNudgeOpts | null
): string {
  const seed = String(opts?.seed ?? "").trim() || "wayword";
  const family = normPromptFamily(opts?.promptFamily);
  const lowSignal = Boolean(opts?.lowSignal);

  if (loadFailed || !result || typeof result !== "object") {
    return pickLine(seedWithFamily(`${seed}|load-fail`, family), NUDGE_GENERIC);
  }

  if (lowSignal) {
    return pickLine(seedWithFamily(`${seed}|low-signal`, family), NUDGE_LOW_SIGNAL);
  }

  const driver = pickDriverReflection(result);
  if (!driver) {
    return pickLine(seedWithFamily(`${seed}|no-driver`, family), NUDGE_GENERIC);
  }

  const cat = driver.category;
  const n = normStatement(driver.statement);

  if (cat === "low_signal") {
    return pickLine(seedWithFamily(`${seed}|mirror-low-signal`, family), NUDGE_LOW_SIGNAL);
  }

  if (cat === "fallback" || isMirrorFallbackSoftStatement(driver.statement)) {
    const wcRaw = opts?.submissionWordCount;
    const wc =
      typeof wcRaw === "number" && Number.isFinite(wcRaw) && wcRaw >= 0 ? Math.floor(wcRaw) : 0;
    if (wc >= MIRROR_NUDGE_AMBIGUOUS_MIN_WORDS) {
      return pickLine(seedWithFamily(`${seed}|fallback-ambiguous`, family), NUDGE_FALLBACK_AMBIGUOUS);
    }
    return pickLine(seedWithFamily(`${seed}|fallback-soft`, family), NUDGE_GENERIC);
  }

  let line = "";

  if (cat === "repetition") {
    line = pickLine(seedWithFamily(`${seed}|repetition`, family), NUDGE_REPETITION);
  } else if (cat === "cadence") {
    if (n === normStatement(MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS)) {
      line = pickLine(seedWithFamily(`${seed}|cadence-tightens`, family), NUDGE_CADENCE_TIGHTENS);
    } else if (n === normStatement(MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN)) {
      line = pickLine(seedWithFamily(`${seed}|cadence-lengthen`, family), NUDGE_CADENCE_LENGTHEN);
    } else if (n === normStatement(MIRROR_HEADLINE_CADENCE_ALTERNATION)) {
      line = pickLine(seedWithFamily(`${seed}|cadence-alt`, family), NUDGE_CADENCE_ALTERNATION);
    } else {
      line = pickLine(seedWithFamily(`${seed}|cadence`, family), NUDGE_CADENCE_DEFAULT);
    }
  } else if (cat === "opening" || cat === "shift") {
    if (
      n === normStatement(MIRROR_HEADLINE_OPENING_DIRECT) ||
      n === normStatement(MIRROR_HEADLINE_OPENING_MOMENT) ||
      n === normStatement(MIRROR_HEADLINE_OPENING_LOOSE) ||
      n === normStatement(MIRROR_HEADLINE_SHIFT_TURNS) ||
      n === normStatement(MIRROR_HEADLINE_SHIFT_HOLDS) ||
      n === normStatement(MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER)
    ) {
      line = pickLine(seedWithFamily(`${seed}|shape-${cat}`, family), NUDGE_CADENCE_DEFAULT);
    } else {
      line = pickLine(seedWithFamily(`${seed}|shape-unknown`, family), NUDGE_GENERIC);
    }
  } else if (cat === "hesitation_qualification") {
    if (isMirrorHesitationStandardNudgeStatement(driver.statement)) {
      line = pickLine(seedWithFamily(`${seed}|hesitation`, family), NUDGE_HESITATION);
    } else {
      line = pickLine(seedWithFamily(`${seed}|hesitation-unknown`, family), NUDGE_GENERIC);
    }
  } else if (cat === "abstraction_concrete") {
    if (
      n === normStatement(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) ||
      n === normStatement(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL)
    ) {
      line = pickLine(seedWithFamily(`${seed}|abstraction-ideas`, family), NUDGE_ABSTRACT_LEANS);
    } else if (
      n === normStatement(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS) ||
      n === normStatement(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER)
    ) {
      line = pickLine(seedWithFamily(`${seed}|abstraction-concrete`, family), NUDGE_CONCRETE_LEANS);
    } else if (
      isMirrorAbstractionBalanceStatement(driver.statement) ||
      isMirrorAbstractionBothFrequentStatement(driver.statement)
    ) {
      line = pickLine(seedWithFamily(`${seed}|abstraction-balance`, family), NUDGE_ABSTRACTION_BALANCED);
    } else {
      line = pickLine(seedWithFamily(`${seed}|abstraction-other`, family), NUDGE_GENERIC);
    }
  } else {
    line = pickLine(seedWithFamily(`${seed}|unknown-cat`, family), NUDGE_GENERIC);
  }

  return String(line || "").trim() || MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
}

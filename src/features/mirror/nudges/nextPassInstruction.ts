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
  MIRROR_HEADLINE_LOW_SIGNAL_CONTINUE,
  MIRROR_HEADLINE_LOW_SIGNAL_SURFACE,
  normMirrorReflectionHeadline
} from "../constants/mirrorSessionHeadlines.js";
import { mirrorBonsaiHeadlinesActive } from "../constants/mirrorBonsaiLexicon.js";
import type { MirrorPipelineResult, MirrorSelectedReflection } from "../types/mirrorTypes.js";

const PROMPT_FAMILIES = new Set(["Scene", "Relation", "Pressure", "Constraint"]);

/**
 * Restrained copy when the mirror cannot lean on strong surface text / cards.
 * Default surface string; with bonsai headlines active, runtime nudges prefer {@link MIRROR_HEADLINE_LOW_SIGNAL_CONTINUE}.
 */
export const MIRROR_NEXT_PASS_LOW_SIGNAL_FALLBACK = MIRROR_HEADLINE_LOW_SIGNAL_SURFACE;

function thinSignalLeadLine(): string {
  return mirrorBonsaiHeadlinesActive()
    ? MIRROR_HEADLINE_LOW_SIGNAL_CONTINUE
    : MIRROR_HEADLINE_LOW_SIGNAL_SURFACE;
}

/**
 * Default when load fails, stack is empty, or mapping yields no line.
 */
export const MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION =
  "What stands out on the page in this draft?";

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

function nudgeLowSignalPool(): readonly string[] {
  return [
    thinSignalLeadLine(),
    "Add more sentences; look again.",
    "Stretch the passage; patterns need surface.",
    "Stay in the draft longer before judging it."
  ];
}

const NUDGE_GENERIC: readonly string[] = [
  MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION,
  "What pulls focus on a second pass?",
  "One detail still open at the close?",
  "What reads unfinished at the end?"
];

/** When the mirror is soft fallback but the draft has real length: low-claim prompts. */
const NUDGE_FALLBACK_AMBIGUOUS: readonly string[] = [
  "What stays open in this draft?",
  "Where does a direct reread read firmer than this line?",
  "What thread still stops short of the next sentence?"
];

const NUDGE_REPETITION: readonly string[] = [
  "Try the same pressure elsewhere on the page.",
  "Watch the next return of that word.",
  "Let repetition move, not thicken.",
  "Trade weight to a plainer synonym once."
];

const NUDGE_CADENCE_TIGHTENS: readonly string[] = [
  "Let one later stretch lengthen.",
  "Where does tight late cadence redistribute?",
  "Open the line once after compression."
];

const NUDGE_CADENCE_LENGTHEN: readonly string[] = [
  "Hold one middle beat short.",
  "Where does early length change what follows?",
  "Tighten one passage before the close."
];

const NUDGE_CADENCE_ALTERNATION: readonly string[] = [
  "Hold one section to a steadier stride.",
  "Let long and short trade without theatrics.",
  "Quiet the swing between long and short once."
];

const NUDGE_CADENCE_DEFAULT: readonly string[] = [
  "Redistribute length on a second pass.",
  "Shift cadence mid-piece deliberately.",
  "Follow the rhythm into an adjacent paragraph."
];

const NUDGE_ABSTRACT_LEANS: readonly string[] = [
  "Let one idea land in one image.",
  "Park abstraction in a single concrete beat.",
  "Hold one concept in one place."
];

const NUDGE_CONCRETE_LEANS: readonly string[] = [
  "Let the idea surface behind the detail.",
  "Pull back objects for one beat.",
  "State the thought the scene implies."
];

const NUDGE_ABSTRACTION_BALANCED: readonly string[] = [
  "Watch idea and image trade slots.",
  "Give one attention type more room.",
  "Note where scene and thought hand off."
];

const NUDGE_HESITATION: readonly string[] = [
  "Thin the cushioning; keep the line plain.",
  "Drop one softener.",
  "Let one assertion stand alone one line.",
  "Delay the qualifier one beat."
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
    return pickLine(seedWithFamily(`${seed}|low-signal`, family), nudgeLowSignalPool());
  }

  const driver = pickDriverReflection(result);
  if (!driver) {
    return pickLine(seedWithFamily(`${seed}|no-driver`, family), NUDGE_GENERIC);
  }

  const cat = driver.category;
  const n = normStatement(driver.statement);

  if (cat === "low_signal") {
    return pickLine(seedWithFamily(`${seed}|mirror-low-signal`, family), nudgeLowSignalPool());
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

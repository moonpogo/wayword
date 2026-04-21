/**
 * Bundled by scripts/run-wayword-evaluation.js (esbuild → Node) so the harness
 * runs the same TS mirror + nudge stack as the app without adding ts-node.
 */
import { analyzeText } from "../src/features/mirror/analysis/analyzeText.js";
import { runMirrorPipeline } from "../src/features/mirror/pipeline/runMirrorPipeline.js";
import { nextPassInstructionFromMirrorPipelineResult } from "../src/features/mirror/nudges/nextPassInstruction.js";
import type { MirrorEvidence, MirrorPipelineResult, MirrorSelectedReflection } from "../src/features/mirror/types/mirrorTypes.js";
import { waywordEvaluationCorpus } from "../tests/fixtures/wayword-evaluation-corpus.js";

function divider() {
  console.log("\n" + "=".repeat(88) + "\n");
}

function truncate(s: string, max: number): string {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

function formatEvidenceList(ev: MirrorEvidence[] | undefined): string[] {
  const list = ev && ev.length ? ev : [];
  if (!list.length) return ["  (none)"];
  return list.map((e, i) => {
    const span =
      e.start != null && e.end != null ? ` @chars ${e.start}–${e.end}` : "";
    return `  [${i + 1}] ${truncate(e.text, 200)}${span}`;
  });
}

function mirrorPostRunHasSubstantiveMain(result: MirrorPipelineResult | null | undefined): boolean {
  const r = result;
  if (!r || typeof r !== "object") return false;
  const main = r.main;
  if (!main || !String(main.statement || "").trim()) return false;
  if (main.category === "fallback") return false;
  return true;
}

function isLowSignalMirrorSubmission(text: string): boolean {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return true;
  const tokens = normalized.split(" ").filter(Boolean);
  if (normalized.length < 18) return true;
  if (tokens.length <= 1 && normalized.length <= 36) return true;
  return false;
}

function mirrorPipelineResultHasEvidenceCardsHarness(result: MirrorPipelineResult | null | undefined): boolean {
  const main = result?.main;
  if (main && Array.isArray(main.evidence) && main.evidence.length > 0) return true;
  const sup = result?.supporting;
  if (!Array.isArray(sup)) return false;
  return sup.some((s) => Array.isArray(s.evidence) && s.evidence.length > 0);
}

/**
 * Mirrors the intent of `computeMirrorAttentionalNudgeLowSignal` in render-post-run.js
 * without the DOM bundle.
 */
function computeHarnessLowSignal(textForSignal: string, result: MirrorPipelineResult): boolean {
  const main = result.main;
  if (main && main.category === "low_signal") return true;
  const text = textForSignal != null ? String(textForSignal) : "";
  const hasCards = mirrorPipelineResultHasEvidenceCardsHarness(result);
  const substantiveMain = mirrorPostRunHasSubstantiveMain(result);
  return isLowSignalMirrorSubmission(text) && (!hasCards || !substantiveMain);
}

function printReflectionBlock(label: string, r: MirrorSelectedReflection | null) {
  console.log(`${label}:`);
  if (!r) {
    console.log("  (null)");
    return;
  }
  console.log(`  category: ${r.category}`);
  console.log(`  statement: ${r.statement}`);
  console.log(`  rankScore: ${r.rankScore}`);
  console.log(`  role: ${r.role}`);
  console.log("  evidence:");
  for (const line of formatEvidenceList(r.evidence)) console.log(line);
}

function run() {
  console.log("Wayword mirror evaluation harness (manual review)\n");
  console.log(`Cases: ${waywordEvaluationCorpus.length}`);

  for (const c of waywordEvaluationCorpus) {
    divider();
    console.log(`Case: ${c.id} — ${c.name}`);
    console.log(`Bucket: ${c.bucket}`);
    if (c.targetCategories.length) {
      console.log(`Target categories: ${c.targetCategories.join(", ")}`);
    } else {
      console.log("Target categories: (none dominant)");
    }
    console.log("\n--- Expectations (for your review, not auto-checked) ---");
    console.log("Acceptable primary / signals:");
    for (const line of c.acceptablePrimary) console.log(`  • ${line}`);
    console.log("Forbidden as primary:");
    for (const line of c.forbiddenPrimary) console.log(`  • ${line}`);
    console.log(`Nudge expectation: ${c.nudgeExpectation}`);
    console.log(`Notes: ${c.notes}`);

    console.log("\n--- Input ---");
    console.log(c.input);

    const result = runMirrorPipeline({
      text: c.input,
      sessionId: c.id
    });

    const lowSignal = computeHarnessLowSignal(c.input, result);
    const submissionWordCount = analyzeText({ text: c.input, sessionId: c.id }).wordCount;
    const nudge = nextPassInstructionFromMirrorPipelineResult(result, false, {
      seed: c.id,
      promptFamily: null,
      lowSignal,
      submissionWordCount
    });

    console.log("\n--- Mirror output ---");
    printReflectionBlock("Primary (main)", result.main);
    console.log("");
    console.log(`Supporting count: ${result.supporting.length}`);
    result.supporting.forEach((s, idx) => {
      console.log("");
      printReflectionBlock(`Supporting [${idx + 1}]`, s);
    });

    console.log("\n--- Nudge ---");
    console.log(`lowSignal (harness heuristic): ${lowSignal}`);
    console.log(`line: ${nudge}`);
  }

  divider();
  console.log("Done. Compare output to expectations above; no pass/fail in this harness.");
}

run();

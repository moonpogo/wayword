/**
 * Bundled by scripts/run-patterns-evaluation.js (esbuild → Node).
 */
import { runPatternsFromDigests } from "../src/features/mirror/patterns/runPatternsFromDigests.js";
import { patternsEvaluationCases } from "../tests/fixtures/patterns-evaluation-digests.js";

function divider() {
  console.log("\n" + "=".repeat(88) + "\n");
}

function run() {
  console.log("Wayword Patterns V1 evaluation harness (manual / smoke checks)\n");
  console.log(`Cases: ${patternsEvaluationCases.length}`);

  for (const c of patternsEvaluationCases) {
    divider();
    console.log(`Case: ${c.id} — ${c.name}`);
    const result = runPatternsFromDigests(c.digests);
    console.log(`Qualifying runs: ${result.qualifyingRunCount}`);
    console.log(`Empty state: ${result.emptyState ?? "(none — cards present)"}`);
    console.log(`Selected cards: ${result.cards.length}`);
    result.cards.forEach((card, i) => {
      console.log(`\n  [${i + 1}] ${card.id}`);
      console.log(`      family: ${card.family}`);
      console.log(`      rankScore: ${card.rankScore}`);
      console.log(`      statement: ${card.statement}`);
      for (const ev of card.evidence) {
        console.log(`      evidence: ${ev.text}`);
      }
    });

    if (c.expectEmptyState != null) {
      const ok = result.emptyState === c.expectEmptyState && result.cards.length === 0;
      console.log(`\nSmoke: expect emptyState=${c.expectEmptyState} → ${ok ? "OK" : "MISMATCH"}`);
    }
    if (c.expectCardIdIncludes != null && c.expectCardIdIncludes.length) {
      const ids = new Set(result.cards.map((x) => x.id));
      const missing = c.expectCardIdIncludes.filter((frag) => ![...ids].some((id) => id.includes(frag)));
      console.log(
        `\nSmoke: expect card id fragments {${c.expectCardIdIncludes.join(", ")}} → ${
          missing.length === 0 ? "OK" : `MISSING: ${missing.join("; ")}`
        }`
      );
    }
  }

  divider();
  console.log("Done.");
}

run();

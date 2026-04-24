const assert = require("node:assert/strict");
const test = require("node:test");
const { bundleRequire } = require("./helpers/bundle-require.cjs");

const { runMirrorPipeline } = bundleRequire("src/features/mirror/pipeline/runMirrorPipeline.ts");
const { waywordEvaluationCorpus } = bundleRequire("tests/fixtures/wayword-evaluation-corpus.js");

function collectStatements(result) {
  const lines = [];
  if (result && result.main && String(result.main.statement || "").trim()) {
    lines.push(String(result.main.statement));
  }
  const supporting = Array.isArray(result && result.supporting) ? result.supporting : [];
  supporting.forEach((card) => {
    if (card && String(card.statement || "").trim()) {
      lines.push(String(card.statement));
    }
  });
  return lines;
}

const FORBIDDEN_STATEMENT_PATTERNS = [
  /\byou should\b/i,
  /\byou need to\b/i,
  /\byou must\b/i,
  /\bdiagnos/i,
  /\bpersonality\b/i,
  /\btrait\b/i,
  /\bmental state\b/i,
];

test("mirror pipeline is deterministic for representative input", () => {
  const input =
    "I kept saying fine. Fine, probably. Fine, in a way. The word kept returning even as it kept changing shape.";
  const first = runMirrorPipeline({ text: input, sessionId: "MIX-01" });
  const second = runMirrorPipeline({ text: input, sessionId: "MIX-01" });
  assert.deepEqual(second, first);
});

test("mirror pipeline returns expected dominant categories for clean single-signal cases", () => {
  const cases = [
    {
      id: "REP-01",
      expectedCategory: "repetition",
      text:
        "I kept thinking about the window. The window in the kitchen. The window above the sink. Even later, walking home, it was still the window I saw.",
    },
    {
      id: "ABS-01",
      expectedCategory: "abstraction_concrete",
      text:
        "Meaning kept dissolving into interpretation. Everything felt mediated by distance, structure, and idea rather than event. I could describe the shape of the thought, but not the room it happened in.",
    },
    {
      id: "CAD-01",
      expectedCategory: "cadence",
      text:
        "I kept trying to explain it in full sentences, adding context, qualifications, and side routes as if precision might make the memory easier to hold. It didn’t. By the end there was only this: it happened. I stayed.",
    },
    {
      id: "HES-01",
      expectedCategory: "hesitation_qualification",
      text:
        "It was the right decision, I think. I knew what I was doing, or at least I mostly did. The plan was clear, more or less, until it wasn’t.",
    },
  ];

  cases.forEach((fixture) => {
    const result = runMirrorPipeline({ text: fixture.text, sessionId: fixture.id });
    assert.ok(result.main, `${fixture.id} should emit a main reflection`);
    assert.equal(result.main.category, fixture.expectedCategory);
    assert.equal(result.main.role, "main");
    assert.ok(String(result.main.statement || "").trim().length > 0);
    assert.ok(Array.isArray(result.main.evidence));
  });
});

test("mirror pipeline low-signal guard handles fragment input", () => {
  const result = runMirrorPipeline({ text: "Tired.", sessionId: "WEAK-03" });
  assert.ok(result.main);
  assert.equal(result.main.category, "low_signal");
  assert.equal(result.main.statement, "Not enough here to notice a pattern yet.");
  assert.deepEqual(result.supporting, []);
});

test("mirror statements stay observational across the evaluation corpus", () => {
  waywordEvaluationCorpus.forEach((fixture) => {
    const result = runMirrorPipeline({ text: fixture.input, sessionId: fixture.id });
    const statements = collectStatements(result);
    assert.ok(statements.length >= 1, `${fixture.id} should yield at least one visible statement`);
    statements.forEach((statement) => {
      assert.ok(statement.trim().length > 0, `${fixture.id} produced a blank statement`);
      FORBIDDEN_STATEMENT_PATTERNS.forEach((pattern) => {
        assert.doesNotMatch(statement, pattern, `${fixture.id} violated observational guardrails`);
      });
    });
  });
});

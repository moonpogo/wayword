const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { buildTraceFieldV0Report } = require("../src/features/trace-field/trace-field-v0-harness.js");
const ALLOWED_PRIMITIVES = ["exact_token", "normalized_token", "phrase", "co_occurrence", "structural", "proximity"];
const PROHIBITED_REPORT_WORDS = [
  "anxious",
  "depression",
  "depressed",
  "avoidant",
  "loneliness",
  "therapy",
  "diagnose",
  "diagnosis",
  "personality",
  "understands you",
  "optimize",
  "streak",
];

function loadFixture() {
  const fixturePath = path.resolve(__dirname, "fixtures", "trace-field-v0-fixture.json");
  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function loadEdgeFixture() {
  const fixturePath = path.resolve(__dirname, "fixtures", "trace-field-v0-edge-cases.json");
  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

test("trace field v0 report is deterministic and reproducible", () => {
  const fixture = loadFixture();
  const reportA = buildTraceFieldV0Report(fixture.runs, fixture.config);
  const reportB = buildTraceFieldV0Report(fixture.runs, fixture.config);
  assert.deepEqual(reportA, reportB);
  assert.equal(reportA.meta.deterministic, true);
  assert.equal(reportA.meta.llmInterpretationUsed, false);
  assert.equal(reportA.meta.embeddingsUsed, false);
  assert.equal(reportA.meta.productionSurfacingAllowed, false);
  assert.equal(reportA.meta.audience, "internal");
});

test("trace field v0 surfaces only evidence-backed recurrence bundles", () => {
  const fixture = loadFixture();
  const report = buildTraceFieldV0Report(fixture.runs, fixture.config);

  assert.ok(report.surfaced.length > 0, "expected surfaced bundles");
  for (const bundle of report.surfaced) {
    assert.equal(bundle.suppressionChecksPassed, true);
    assert.ok(bundle.supportingTraces.runs.length >= fixture.config.minRuns);
    assert.ok(bundle.supportingTraces.excerpts.length > 0);
    assert.equal(typeof bundle.key, "string");
    assert.ok(bundle.count >= fixture.config.minCount);
    assert.equal(typeof bundle.supportingTraces, "object");
    assert.ok(Array.isArray(bundle.supportingTraces.runs));
    assert.ok(Array.isArray(bundle.supportingTraces.excerpts));
  }
});

test("trace field v0 keeps weak signals suppressed", () => {
  const fixture = loadFixture();
  const report = buildTraceFieldV0Report(fixture.runs, fixture.config);

  const weak = report.suppressed.find((bundle) => bundle.suppressionChecks.minCount === false || bundle.suppressionChecks.minRuns === false);
  assert.ok(weak, "expected at least one weak suppressed bundle");
});

test("trace field v0 includes allowed primitives", () => {
  const fixture = loadFixture();
  const report = buildTraceFieldV0Report(fixture.runs, fixture.config);

  const primitives = new Set(report.surfaced.map((item) => item.primitive));
  for (const key of ALLOWED_PRIMITIVES) {
    assert.ok(primitives.has(key) || report.suppressed.some((entry) => entry.primitive === key), `expected primitive presence: ${key}`);
  }
});

test("trace field v0 reruns are byte-identical after JSON serialization", () => {
  const fixture = loadFixture();
  const a = JSON.stringify(buildTraceFieldV0Report(fixture.runs, fixture.config));
  const b = JSON.stringify(buildTraceFieldV0Report(fixture.runs, fixture.config));
  assert.equal(a, b);
});

test("trace field v0 report fields avoid prohibited framing", () => {
  const fixture = loadFixture();
  const report = buildTraceFieldV0Report(fixture.runs, fixture.config);

  const internalStrings = [];
  internalStrings.push(String(report.meta.internalHarnessNotice || ""));
  internalStrings.push(String(report.meta.outputClass || ""));
  internalStrings.push(String(report.meta.languageConstraint || ""));
  for (const item of [...report.surfaced, ...report.suppressed]) {
    internalStrings.push(String(item.primitive));
    const flagValues = Object.values(item.normalizationFlags || {});
    for (const value of flagValues) internalStrings.push(String(value));
  }

  for (const value of internalStrings) {
    const lc = value.toLowerCase();
    for (const banned of PROHIBITED_REPORT_WORDS) {
      assert.equal(lc.includes(banned), false, `prohibited framing token found: ${banned}`);
    }
  }
});

test("edge fixture covers threshold boundary below/at/above", () => {
  const fixture = loadEdgeFixture();
  const report = buildTraceFieldV0Report(fixture.runs, fixture.config);

  const harborLantern = report.surfaced.find((item) => item.key === "harbor lantern" && item.primitive === "phrase");
  assert.ok(harborLantern, "expected above/at threshold surfaced phrase");
  assert.ok(harborLantern.count >= fixture.config.minCount);
  assert.ok(harborLantern.runCount >= fixture.config.minRuns);

  const belowThreshold = report.suppressed.find((item) => item.count < fixture.config.minCount || item.runCount < fixture.config.minRuns);
  assert.ok(belowThreshold, "expected below-threshold suppression");
});

test("edge fixture enforces single-run dominance suppression", () => {
  const fixture = loadEdgeFixture();
  const report = buildTraceFieldV0Report(fixture.runs, fixture.config);
  const dominated = report.suppressed.find((item) => item.suppressionChecks.singleRunShare === false);
  assert.ok(dominated, "expected single-run dominant suppression");
});

test("edge fixture enforces stopword/boilerplate suppression", () => {
  const fixture = loadEdgeFixture();
  const report = buildTraceFieldV0Report(fixture.runs, fixture.config);
  const stopwordSuppressed = report.suppressed.find((item) => item.primitive === "exact_token" && item.suppressionChecks.boilerplateStopword === false);
  assert.ok(stopwordSuppressed, "expected stopword suppression for exact token primitive");
});

test("edge fixture enforces repeated pasted text suppression", () => {
  const fixture = loadEdgeFixture();
  const report = buildTraceFieldV0Report(fixture.runs, fixture.config);
  const repeatedSuppressed = report.suppressed.find((item) => item.suppressionChecks.repeatedExcerptShare === false);
  assert.ok(repeatedSuppressed, "expected repeated pasted-text suppression");
});

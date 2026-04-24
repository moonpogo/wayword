const assert = require("node:assert/strict");
const test = require("node:test");
const { bundleRequire } = require("./helpers/bundle-require.cjs");

const { getPatternsProfileFromDigests } = bundleRequire(
  "src/features/mirror/recent/getPatternsProfileFromDigests.ts"
);
const {
  patternsEvaluationCases,
  PATTERNS_EVAL_STABLE_RECURRENCE,
} = bundleRequire("tests/fixtures/patterns-evaluation-digests.ts");

test("patterns aggregation matches fixture expectations", () => {
  patternsEvaluationCases.forEach((fixture) => {
    const result = getPatternsProfileFromDigests(fixture.digests);
    if (fixture.expectEmptyState != null) {
      assert.equal(result.patternsEmptyState, fixture.expectEmptyState);
      assert.equal(result.promotedPatterns.length, 0);
      return;
    }

    const ids = result.promotedPatterns.map((pattern) => pattern.id);
    fixture.expectCardIdIncludes.forEach((fragment) => {
      assert.ok(
        ids.some((id) => id.includes(fragment)),
        `${fixture.id} should include promoted pattern id containing ${fragment}`
      );
    });
  });
});

test("patterns profile adapter reports stable qualifying count", () => {
  const result = getPatternsProfileFromDigests(PATTERNS_EVAL_STABLE_RECURRENCE);
  assert.equal(result.qualifyingRunCount, 6);
  assert.ok(result.promotedPatterns.length >= 1);
  assert.ok(result.promotedPatterns.every((pattern) => String(pattern.statement || "").trim().length > 0));
});

"use strict";
// Internal research harness runner only. Not for production or user-facing output.

const fs = require("node:fs");
const path = require("node:path");
const { buildTraceFieldV0Report } = require("../src/features/trace-field/trace-field-v0-harness.js");

function main() {
  const fixturePath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.resolve(process.cwd(), "tests/fixtures/trace-field-v0-fixture.json");

  const payload = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const report = buildTraceFieldV0Report(payload.runs, payload.config || {});
  report.meta.internalHarnessNotice = "INTERNAL_ONLY_NON_USER_FACING_RESEARCH_OUTPUT";
  process.stderr.write("[trace-field-v0] INTERNAL ONLY - NON USER FACING RESEARCH OUTPUT\n");

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main();

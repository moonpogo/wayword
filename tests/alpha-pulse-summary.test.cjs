const assert = require("node:assert/strict");
const test = require("node:test");

const summary = require("../scripts/alpha-pulse-summary.js");

test("alpha pulse summary maps persisted telemetry rows into all funnel stages", () => {
  const windowInfo = {
    label: "Last 7 days",
    startAt: "2026-06-01T00:00:00.000Z",
    endAt: "2026-06-10T00:00:00.000Z",
  };

  const result = summary.buildAlphaPulseSummaryFromRows(
    [
      { event: "landing_viewed", created_at: "2026-06-02T10:00:00.000Z" },
      { event: "writing_started", created_at: "2026-06-02T10:01:00.000Z" },
      { event: "run_submitted", created_at: "2026-06-02T10:02:00.000Z" },
      { event: "run_saved", created_at: "2026-06-02T10:03:00.000Z", payload: { sync_status: "server_synced" } },
      { event: "return_session_detected", created_at: "2026-06-03T10:00:00.000Z" },
      { event: "recent_runs_opened", created_at: "2026-06-03T10:05:00.000Z", payload: { surface_name: "drawer" } },
      { event: "observatory_revisited", created_at: "2026-06-03T10:06:00.000Z", payload: { surface_name: "patterns" } },
      { event: "migration_failed", created_at: "2026-06-04T10:06:00.000Z", payload: { reason: "rls" } },
      { event: "run_saved", created_at: "2026-06-04T10:07:00.000Z", payload: { sync_status: "local_only_sync_failed" } },
    ],
    windowInfo,
    { available: true, table: "retention_events", reason: "" }
  );

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.stages.map((stage) => [stage.id, stage.count]),
    [
      ["landed", 1],
      ["started_writing", 1],
      ["submitted", 1],
      ["saved", 2],
      ["returned", 1],
      ["opened_recent_runs", 1],
      ["opened_patterns", 1],
      ["errors", 2],
    ]
  );
});

test("buildWindow supports all time", () => {
  const windowInfo = summary.buildWindow(new Date("2026-06-10T00:00:00.000Z"), "all");
  assert.equal(windowInfo.label, "All time");
  assert.equal(windowInfo.days, "all");
  assert.equal(windowInfo.startAt, "1970-01-01T00:00:00.000Z");
});

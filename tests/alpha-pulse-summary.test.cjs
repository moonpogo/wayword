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

test("alpha pulse summary can build from a real-data snapshot fallback", () => {
  const windowInfo = summary.buildWindow(new Date("2026-06-15T20:00:00.000Z"), "14");
  const result = summary.buildAlphaPulseSummaryFromSnapshot(
    {
      telemetryTable: "retention_events",
      generatedAt: "2026-06-15T17:25:14.840Z",
      latestEventAt: "2026-06-15T17:25:14.840Z",
      coverage: {
        landed: { total: 0, firstSeenAt: "", lastSeenAt: "", historicallySeen: false },
        started_writing: {
          total: 2,
          firstSeenAt: "2026-06-12T20:41:24.639Z",
          lastSeenAt: "2026-06-12T20:44:47.665Z",
          historicallySeen: true,
        },
        submitted: { total: 0, firstSeenAt: "", lastSeenAt: "", historicallySeen: false },
        saved: {
          total: 44,
          firstSeenAt: "2026-05-28T00:53:23.281Z",
          lastSeenAt: "2026-06-06T16:18:08.176Z",
          historicallySeen: true,
        },
        returned: {
          total: 47,
          firstSeenAt: "2026-05-28T17:14:52.954Z",
          lastSeenAt: "2026-06-15T17:25:14.840Z",
          historicallySeen: true,
        },
        opened_recent_runs: {
          total: 1,
          firstSeenAt: "2026-06-12T20:41:25.347Z",
          lastSeenAt: "2026-06-12T20:41:25.347Z",
          historicallySeen: true,
        },
        opened_patterns: {
          total: 29,
          firstSeenAt: "2026-05-28T04:10:48.310Z",
          lastSeenAt: "2026-06-12T20:44:49.724Z",
          historicallySeen: true,
        },
        errors: { total: 0, firstSeenAt: "", lastSeenAt: "", historicallySeen: false },
      },
      windows: {
        "14": {
          counts: {
            landed: 0,
            started_writing: 2,
            submitted: 0,
            saved: 3,
            returned: 32,
            opened_recent_runs: 1,
            opened_patterns: 9,
            errors: 0,
          },
        },
      },
    },
    windowInfo
  );

  assert.equal(result.ok, true);
  assert.equal(result.source.mode, "snapshot");
  assert.equal(result.source.snapshotGeneratedAt, "2026-06-15T17:25:14.840Z");
  assert.equal(result.seams.some((seam) => seam.label === "Landed coverage"), true);
  assert.deepEqual(
    result.stages.map((stage) => [stage.id, stage.count, stage.source]),
    [
      ["landed", 0, "snapshot"],
      ["started_writing", 2, "snapshot"],
      ["submitted", 0, "snapshot"],
      ["saved", 3, "snapshot"],
      ["returned", 32, "snapshot"],
      ["opened_recent_runs", 1, "snapshot"],
      ["opened_patterns", 9, "snapshot"],
      ["errors", 0, "snapshot"],
    ]
  );
});

test("alpha pulse summary carries coverage metadata for stage history", () => {
  const windowInfo = {
    label: "Last 7 days",
    startAt: "2026-06-10T00:00:00.000Z",
    endAt: "2026-06-17T00:00:00.000Z",
  };
  const result = summary.buildAlphaPulseSummaryFromRows(
    [
      { event: "run_saved", created_at: "2026-06-06T10:00:00.000Z", payload: { sync_status: "server_synced" } },
      { event: "writing_started", created_at: "2026-06-12T10:00:00.000Z", payload: { source: "begin_button" } },
    ],
    windowInfo,
    { available: true, table: "retention_events", reason: "" }
  );

  assert.equal(result.stages.find((stage) => stage.id === "landed").coverage.historicallySeen, false);
  assert.equal(result.stages.find((stage) => stage.id === "saved").coverage.lastSeenAt, "2026-06-06T10:00:00.000Z");
  assert.equal(result.seams.some((seam) => seam.label === "Submitted coverage"), true);
});

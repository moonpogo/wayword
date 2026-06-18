const assert = require("node:assert/strict");
const test = require("node:test");

const dashboard = require("../src/alpha-pulse/alpha-pulse-dashboard.js");

test("normalizeSummary preserves live stage counts from the private summary endpoint", () => {
  const normalized = dashboard.normalizeSummary({
    ok: true,
    window: { label: "Last 7 days" },
    source: { available: true, telemetryTable: "retention_events", mode: "live", unavailableReason: "" },
    stages: [
      { id: "landed", count: 9, source: "live" },
      { id: "started_writing", count: 7, source: "live" },
      { id: "submitted", count: 5, source: "live" },
      { id: "saved", count: 4, source: "live" },
      { id: "returned", count: 2, source: "live" },
      { id: "opened_recent_runs", count: 3, source: "live" },
      { id: "opened_patterns", count: 2, source: "live" },
      { id: "errors", count: 1, source: "live" },
    ],
  });

  assert.equal(normalized.ok, true);
  assert.equal(normalized.stages.length, 8);
  assert.equal(normalized.stages.find((stage) => stage.id === "landed").count, 9);
  assert.equal(normalized.stages.find((stage) => stage.id === "opened_recent_runs").count, 3);
  assert.equal(normalized.source.mode, "live");
});

test("normalizeSummary fills missing stage rows as unavailable zeroes", () => {
  const normalized = dashboard.normalizeSummary({
    ok: false,
    source: { available: false, unavailableReason: "missing_env" },
    stages: [{ id: "saved", count: 4, source: "unavailable" }],
    seams: [{ id: "missing_env", label: "Live summary unavailable", reason: "missing_env" }],
  });

  assert.equal(normalized.stages.length, 8);
  assert.equal(normalized.stages.find((stage) => stage.id === "saved").count, 4);
  assert.equal(normalized.stages.find((stage) => stage.id === "landed").count, 0);
  assert.equal(normalized.stages.find((stage) => stage.id === "landed").source, "unavailable");
});

test("loadDashboardData falls back to unavailable summary when fetch fails", async () => {
  global.fetch = () => Promise.reject(new Error("network_down"));
  const result = await dashboard.loadDashboardData({ range: "all" });
  delete global.fetch;

  assert.equal(result.ok, false);
  assert.equal(result.stages.length, 8);
  assert.equal(result.source.unavailableReason, "network_down");
  assert.equal(result.window.label, "All time");
});

test("normalizeSummary preserves snapshot metadata", () => {
  const normalized = dashboard.normalizeSummary({
    ok: true,
    source: {
      available: true,
      telemetryTable: "retention_events",
      mode: "snapshot",
      snapshotGeneratedAt: "2026-06-15T17:25:14.840Z",
      latestEventAt: "2026-06-15T17:25:14.840Z",
      unavailableReason: "",
    },
    stages: [
      {
        id: "saved",
        count: 44,
        source: "snapshot",
        coverage: {
          total: 44,
          firstSeenAt: "2026-05-28T00:53:23.281Z",
          lastSeenAt: "2026-06-06T16:18:08.176Z",
          historicallySeen: true,
        },
      },
      {
        id: "landed",
        count: 0,
        source: "snapshot",
        coverage: {
          total: 0,
          firstSeenAt: "",
          lastSeenAt: "",
          historicallySeen: false,
        },
      },
    ],
  });

  assert.equal(normalized.source.mode, "snapshot");
  assert.equal(normalized.source.snapshotGeneratedAt, "2026-06-15T17:25:14.840Z");
  assert.equal(normalized.stages.find((stage) => stage.id === "saved").source, "snapshot");
  assert.equal(normalized.stages.find((stage) => stage.id === "landed").coverage.historicallySeen, false);
});

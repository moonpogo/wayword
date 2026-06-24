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

test("loadDashboardData sends a bearer token when dashboard auth is supplied", async () => {
  let capturedUrl = "";
  let capturedOptions = null;
  global.fetch = (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, source: { available: true, mode: "live" }, stages: [] }),
    });
  };

  const result = await dashboard.loadDashboardData({ range: "14", requestId: "manual", authToken: "founder-token" });
  delete global.fetch;

  assert.equal(result.ok, true);
  assert.equal(capturedUrl, "/api/alpha-pulse-summary?days=14&request=manual");
  assert.equal(capturedOptions.cache, "no-store");
  assert.deepEqual(capturedOptions.headers, { Authorization: "Bearer founder-token" });
});

test("dashboard auth can come from a URL hash without sending the token in the query", () => {
  const priorLocation = global.location;
  const priorHistory = global.history;
  const priorSessionStorage = global.sessionStorage;
  const stored = {};

  global.location = {
    hash: "#token=hash-token",
    pathname: "/alpha-pulse/",
    search: "",
  };
  global.history = {
    replacedWith: "",
    replaceState(_state, _title, path) {
      this.replacedWith = path;
    },
  };
  global.sessionStorage = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(stored, key) ? stored[key] : null;
    },
    setItem(key, value) {
      stored[key] = String(value);
    },
  };

  const options = dashboard.buildFetchOptions({});

  global.location = priorLocation;
  global.history = priorHistory;
  global.sessionStorage = priorSessionStorage;

  assert.deepEqual(options.headers, { Authorization: "Bearer hash-token" });
  assert.equal(stored[dashboard.AUTH_TOKEN_STORAGE_KEY], "hash-token");
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

test("buildStatusText calls out stale snapshot timestamps", () => {
  const text = dashboard.buildStatusText({
    ok: true,
    source: {
      mode: "snapshot",
      snapshotGeneratedAt: "2026-06-15T17:25:14.840Z",
    },
  });

  assert.match(text, /Snapshot from/i);
  assert.match(text, /Retrying live automatically/i);
});

test("buildStatusText describes live auto refresh", () => {
  assert.equal(
    dashboard.buildStatusText({
      ok: true,
      source: { mode: "live" },
    }),
    "Live telemetry. Refreshes automatically."
  );
  assert.equal(
    dashboard.buildStatusText({
      ok: false,
      source: { mode: "unavailable" },
    }),
    "Telemetry unavailable right now. Retrying automatically."
  );
  assert.equal(dashboard.REFRESH_INTERVAL_MS, 5 * 60 * 1000);
});

test("buildSummaryUrl appends a request token for fresh pulls", () => {
  assert.equal(
    dashboard.buildSummaryUrl("14", "manual-refresh"),
    "/api/alpha-pulse-summary?days=14&request=manual-refresh"
  );
  assert.equal(
    dashboard.buildSummaryUrl("all", ""),
    "/api/alpha-pulse-summary?days=all"
  );
});

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const {
  createSupabaseRestClient,
  ensureSupabaseEnv,
  fetchTableRows,
  loadDotEnv,
} = require("./generate-founder-alpha-pulse.js");

const TELEMETRY_EVENTS = new Set([
  "landing_viewed",
  "writing_started",
  "run_submitted",
  "run_saved",
  "onboarding_abandoned",
  "alpha_error",
  "return_session_detected",
  "recent_runs_opened",
  "observatory_revisited",
  "migration_failed",
  "migration_skipped_unverified_rls",
]);

const TELEMETRY_TABLE_CANDIDATES = [
  "retention_telemetry_events",
  "retention_events",
  "telemetry_events",
];
const ALPHA_PULSE_ROLLUP_TABLE = "alpha_pulse_stage_daily_totals";

const STAGES = [
  { id: "landed", label: "Landed" },
  { id: "started_writing", label: "Started writing" },
  { id: "submitted", label: "Submitted" },
  { id: "saved", label: "Saved" },
  { id: "onboarding_abandoned", label: "Onboarding abandoned" },
  { id: "returned", label: "Returned" },
  { id: "opened_recent_runs", label: "Opened Recent Runs" },
  { id: "opened_patterns", label: "Opened Patterns" },
  { id: "errors", label: "Errors" },
];

const EVENT_BY_STAGE = {
  landed: "landing_viewed",
  started_writing: "writing_started",
  submitted: "run_submitted",
  saved: "run_saved",
  onboarding_abandoned: "onboarding_abandoned",
  returned: "return_session_detected",
  opened_recent_runs: "recent_runs_opened",
  opened_patterns: "observatory_revisited",
  errors: "errors",
};

const SNAPSHOT_PATH = path.resolve(__dirname, "..", "alpha-pulse", "alpha-pulse-summary.snapshot.json");

function safeString(value) {
  return String(value == null ? "" : value).trim();
}

function safePositiveInteger(value, fallback) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function buildWindow(now, days) {
  const effectiveNow = now instanceof Date && Number.isFinite(now.getTime()) ? now : new Date();
  if (safeString(days).toLowerCase() === "all") {
    return {
      label: "All time",
      days: "all",
      startAt: new Date(0).toISOString(),
      endAt: effectiveNow.toISOString(),
    };
  }
  const safeDays = safePositiveInteger(days, 7);
  const endAt = effectiveNow.toISOString();
  const startAt = new Date(effectiveNow.getTime() - safeDays * 24 * 60 * 60 * 1000).toISOString();
  return {
    label: `Last ${safeDays} days`,
    days: safeDays,
    startAt,
    endAt,
  };
}

function isWithinWindow(iso, windowInfo) {
  const ms = Date.parse(safeString(iso));
  const startMs = Date.parse(windowInfo.startAt);
  const endMs = Date.parse(windowInfo.endAt);
  return Number.isFinite(ms) && Number.isFinite(startMs) && Number.isFinite(endMs) && ms >= startMs && ms <= endMs;
}

function pickEventTimestamp(row) {
  return row.timestamp || row.created_at || (row.payload && row.payload.timestamp) || "";
}

function pickRollupTimestamp(row, fieldName) {
  return row && typeof row === "object" ? row[fieldName] || "" : "";
}

async function loadTelemetryRows(supabase) {
  const failures = [];
  for (const table of TELEMETRY_TABLE_CANDIDATES) {
    try {
      const rows = await fetchTableRows(supabase, table, {
        select: "event,payload,timestamp,created_at,user_id",
        order: "created_at.asc",
        limit: "50000",
      });
      return {
        available: true,
        table,
        rows: rows.filter((row) => TELEMETRY_EVENTS.has(safeString(row.event))),
        reason: "",
      };
    } catch (error) {
      failures.push(`${table}: ${error.message}`);
    }
  }

  return {
    available: false,
    table: "",
    rows: [],
    reason: failures.join(" | "),
  };
}

async function loadAlphaPulseRollupRows(supabase) {
  try {
    const rows = await fetchTableRows(supabase, ALPHA_PULSE_ROLLUP_TABLE, {
      select: "day,stage_id,event_count,first_event_at,last_event_at",
      order: "day.asc",
      limit: "5000",
    });
    return {
      available: true,
      table: ALPHA_PULSE_ROLLUP_TABLE,
      rows: Array.isArray(rows) ? rows : [],
      reason: "",
    };
  } catch (error) {
    return {
      available: false,
      table: ALPHA_PULSE_ROLLUP_TABLE,
      rows: [],
      reason: `${ALPHA_PULSE_ROLLUP_TABLE}: ${error.message}`,
    };
  }
}

function countEvents(rows, predicate) {
  let count = 0;
  const list = Array.isArray(rows) ? rows : [];
  for (const row of list) {
    if (predicate(row)) count += 1;
  }
  return count;
}

function buildCoverageMap(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const map = {};
  for (const stage of STAGES) {
    map[stage.id] = {
      total: 0,
      firstSeenAt: "",
      lastSeenAt: "",
      historicallySeen: false,
    };
  }

  for (const row of list) {
    const eventName = safeString(row && row.event);
    const occurredAt = pickEventTimestamp(row);
    let stageId = "";
    if (eventName === "landing_viewed") stageId = "landed";
    if (eventName === "writing_started") stageId = "started_writing";
    if (eventName === "run_submitted") stageId = "submitted";
    if (eventName === "run_saved") stageId = "saved";
    if (eventName === "onboarding_abandoned") stageId = "onboarding_abandoned";
    if (eventName === "return_session_detected") stageId = "returned";
    if (eventName === "recent_runs_opened") stageId = "opened_recent_runs";
    if (eventName === "migration_failed" || eventName === "alpha_error") stageId = "errors";
    if (eventName === "observatory_revisited") {
      const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
      const surfaceName = safeString(payload.surface_name);
      if (!surfaceName || surfaceName === "patterns") {
        stageId = "opened_patterns";
      }
    }
    if (eventName === "run_saved") {
      const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
      if (safeString(payload.sync_status) === "local_only_sync_failed") {
        const errorCoverage = map.errors;
        errorCoverage.total += 1;
        errorCoverage.historicallySeen = true;
        if (!errorCoverage.firstSeenAt || Date.parse(occurredAt) < Date.parse(errorCoverage.firstSeenAt)) {
          errorCoverage.firstSeenAt = occurredAt;
        }
        if (!errorCoverage.lastSeenAt || Date.parse(occurredAt) > Date.parse(errorCoverage.lastSeenAt)) {
          errorCoverage.lastSeenAt = occurredAt;
        }
      }
    }
    if (!stageId) continue;
    const coverage = map[stageId];
    coverage.total += 1;
    coverage.historicallySeen = true;
    if (!coverage.firstSeenAt || Date.parse(occurredAt) < Date.parse(coverage.firstSeenAt)) {
      coverage.firstSeenAt = occurredAt;
    }
    if (!coverage.lastSeenAt || Date.parse(occurredAt) > Date.parse(coverage.lastSeenAt)) {
      coverage.lastSeenAt = occurredAt;
    }
  }

  return map;
}

function buildCoverageSeams(coverageMap) {
  const seams = [];
  const landed = coverageMap.landed;
  const submitted = coverageMap.submitted;
  const writing = coverageMap.started_writing;
  const recentRuns = coverageMap.opened_recent_runs;

  if (landed && !landed.historicallySeen) {
    seams.push({
      id: "landed_not_captured",
      label: "Landed coverage",
      reason: "No landing-view events have been stored in the current dataset yet.",
    });
  }
  if (submitted && !submitted.historicallySeen) {
    seams.push({
      id: "submitted_not_captured",
      label: "Submitted coverage",
      reason: "No submit events have been stored in the current dataset yet.",
    });
  }
  if (writing && writing.historicallySeen && writing.firstSeenAt) {
    seams.push({
      id: "started_writing_started_late",
      label: "Started writing coverage",
      reason: "Direct started-writing tracking begins on " + writing.firstSeenAt + ".",
    });
  }
  if (recentRuns && recentRuns.historicallySeen && recentRuns.firstSeenAt) {
    seams.push({
      id: "recent_runs_started_late",
      label: "Recent Runs coverage",
      reason: "Direct Recent Runs tracking begins on " + recentRuns.firstSeenAt + ".",
    });
  }
  return seams;
}

function buildCoverageMapFromRollups(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const map = {};
  for (const stage of STAGES) {
    map[stage.id] = {
      total: 0,
      firstSeenAt: "",
      lastSeenAt: "",
      historicallySeen: false,
    };
  }

  for (const row of list) {
    const stageId = safeString(row && row.stage_id);
    if (!stageId || !map[stageId]) continue;
    const coverage = map[stageId];
    const count = Math.max(0, Number(row && row.event_count) || 0);
    const firstSeenAt = pickRollupTimestamp(row, "first_event_at");
    const lastSeenAt = pickRollupTimestamp(row, "last_event_at");
    coverage.total += count;
    coverage.historicallySeen = coverage.total > 0;
    if (firstSeenAt && (!coverage.firstSeenAt || Date.parse(firstSeenAt) < Date.parse(coverage.firstSeenAt))) {
      coverage.firstSeenAt = firstSeenAt;
    }
    if (lastSeenAt && (!coverage.lastSeenAt || Date.parse(lastSeenAt) > Date.parse(coverage.lastSeenAt))) {
      coverage.lastSeenAt = lastSeenAt;
    }
  }

  return map;
}

function isRollupDayWithinWindow(dayIso, windowInfo) {
  const day = safeString(dayIso);
  const dayStartMs = Date.parse(day ? `${day}T00:00:00.000Z` : "");
  const dayEndMs = Date.parse(day ? `${day}T23:59:59.999Z` : "");
  const startMs = Date.parse(windowInfo.startAt);
  const endMs = Date.parse(windowInfo.endAt);
  return (
    Number.isFinite(dayStartMs) &&
    Number.isFinite(dayEndMs) &&
    Number.isFinite(startMs) &&
    Number.isFinite(endMs) &&
    dayEndMs >= startMs &&
    dayStartMs <= endMs
  );
}

function buildAlphaPulseSummaryFromRows(rows, windowInfo, meta) {
  const list = (Array.isArray(rows) ? rows : []).filter((row) => isWithinWindow(pickEventTimestamp(row), windowInfo));
  const coverageMap = buildCoverageMap(rows);

  const stageCounts = {
    landed: countEvents(list, (row) => safeString(row.event) === "landing_viewed"),
    started_writing: countEvents(list, (row) => safeString(row.event) === "writing_started"),
    submitted: countEvents(list, (row) => safeString(row.event) === "run_submitted"),
    saved: countEvents(list, (row) => safeString(row.event) === "run_saved"),
    onboarding_abandoned: countEvents(list, (row) => safeString(row.event) === "onboarding_abandoned"),
    returned: countEvents(list, (row) => safeString(row.event) === "return_session_detected"),
    opened_recent_runs: countEvents(list, (row) => safeString(row.event) === "recent_runs_opened"),
    opened_patterns: countEvents(list, (row) => {
      if (safeString(row.event) !== "observatory_revisited") return false;
      const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
      const surfaceName = safeString(payload.surface_name);
      return !surfaceName || surfaceName === "patterns";
    }),
    errors: countEvents(list, (row) => {
      const eventName = safeString(row.event);
      if (eventName === "migration_failed" || eventName === "alpha_error") return true;
      if (eventName !== "run_saved") return false;
      const payload = row && row.payload && typeof row.payload === "object" ? row.payload : {};
      return safeString(payload.sync_status) === "local_only_sync_failed";
    }),
  };

  return {
    ok: Boolean(meta && meta.available),
    generatedAt: new Date().toISOString(),
    window: windowInfo,
    source: {
      telemetryTable: safeString(meta && meta.table),
      available: Boolean(meta && meta.available),
      mode: safeString(meta && meta.mode) || (meta && meta.available ? "live" : "unavailable"),
      snapshotGeneratedAt: safeString(meta && meta.snapshotGeneratedAt),
      latestEventAt: safeString(meta && meta.latestEventAt),
      unavailableReason: safeString(meta && meta.reason),
    },
    stages: STAGES.map((stage) => ({
      id: stage.id,
      label: stage.label,
      count: stageCounts[stage.id] || 0,
      coverage: coverageMap[stage.id] || null,
      source: meta && meta.available ? "live" : "unavailable",
      note: "",
    })),
    seams: meta && meta.available
      ? buildCoverageSeams(coverageMap)
      : [
          {
            id: "live_summary_unavailable",
            label: "Live summary unavailable",
            reason:
              safeString(meta && meta.reason) ||
              "Supabase summary access is not configured for this environment.",
          },
        ],
  };
}

function buildAlphaPulseSummaryFromRollups(rows, windowInfo, meta) {
  const list = Array.isArray(rows) ? rows : [];
  const coverageMap = buildCoverageMapFromRollups(list);
  const stageCounts = {};
  let latestEventAt = "";

  for (const stage of STAGES) {
    stageCounts[stage.id] = 0;
  }

  for (const row of list) {
    const stageId = safeString(row && row.stage_id);
    if (!stageId || !Object.prototype.hasOwnProperty.call(stageCounts, stageId)) continue;
    if (isRollupDayWithinWindow(row && row.day, windowInfo)) {
      stageCounts[stageId] += Math.max(0, Number(row && row.event_count) || 0);
    }
    const rowLastEventAt = pickRollupTimestamp(row, "last_event_at");
    if (rowLastEventAt && (!latestEventAt || Date.parse(rowLastEventAt) > Date.parse(latestEventAt))) {
      latestEventAt = rowLastEventAt;
    }
  }

  return {
    ok: Boolean(meta && meta.available),
    generatedAt: new Date().toISOString(),
    window: windowInfo,
    source: {
      telemetryTable: safeString(meta && meta.table),
      available: Boolean(meta && meta.available),
      mode: "live",
      snapshotGeneratedAt: "",
      latestEventAt,
      unavailableReason: safeString(meta && meta.reason),
    },
    stages: STAGES.map((stage) => ({
      id: stage.id,
      label: stage.label,
      count: stageCounts[stage.id] || 0,
      coverage: coverageMap[stage.id] || null,
      source: "live",
      note: "",
    })),
    seams: buildCoverageSeams(coverageMap),
  };
}

function readSnapshotFile() {
  try {
    const raw = fs.readFileSync(SNAPSHOT_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
}

function getSnapshotEntry(snapshot, days) {
  const entries = snapshot && snapshot.windows && typeof snapshot.windows === "object" ? snapshot.windows : {};
  const key = safeString(days).toLowerCase() === "all" ? "all" : String(safePositiveInteger(days, 7));
  const entry = entries[key];
  return entry && typeof entry === "object" ? entry : null;
}

function buildAlphaPulseSummaryFromSnapshot(snapshot, windowInfo, fallbackMeta) {
  const entry = getSnapshotEntry(snapshot, windowInfo.days);
  if (!entry) return null;

  const counts = entry.counts && typeof entry.counts === "object" ? entry.counts : {};
  const coverageMap = snapshot && snapshot.coverage && typeof snapshot.coverage === "object" ? snapshot.coverage : {};
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    window: windowInfo,
    source: {
      telemetryTable: safeString(snapshot.telemetryTable) || "retention_events",
      available: true,
      mode: "snapshot",
      snapshotGeneratedAt: safeString(snapshot.generatedAt),
      latestEventAt: safeString(snapshot.latestEventAt),
      unavailableReason: safeString(fallbackMeta && fallbackMeta.reason),
    },
    stages: STAGES.map((stage) => ({
      id: stage.id,
      label: stage.label,
      count: Number(counts[stage.id]) || 0,
      coverage: coverageMap[stage.id] || null,
      source: "snapshot",
      note: "",
    })),
    seams: buildCoverageSeams(coverageMap).concat([
      {
        id: "local_snapshot_fallback",
        label: "Preview mode",
        reason:
          "Using a recent telemetry snapshot because live summary access is unavailable." +
          (safeString(fallbackMeta && fallbackMeta.reason)
            ? " " + safeString(fallbackMeta && fallbackMeta.reason)
            : ""),
      },
    ]),
  };
}

async function loadAlphaPulseDashboardSummary(options) {
  loadDotEnv();
  const windowInfo = buildWindow(options && options.now, options && options.days);
  try {
    const url = String(process.env.SUPABASE_URL || "").trim();
    const anonKey = String(process.env.SUPABASE_ANON_KEY || "").trim();
    if (url && anonKey) {
      const publicClient = createSupabaseRestClient({ url, serviceRole: anonKey });
      const rollups = await loadAlphaPulseRollupRows(publicClient);
      if (rollups.available && rollups.rows.length > 0) {
        return buildAlphaPulseSummaryFromRollups(rollups.rows, windowInfo, {
          ...rollups,
          mode: "live",
        });
      }
    }
  } catch (_) {
    /* fall through to service-role and snapshot paths */
  }
  try {
    const { url, serviceRole } = ensureSupabaseEnv();
    const supabase = createSupabaseRestClient({ url, serviceRole });
    const telemetry = await loadTelemetryRows(supabase);
    if (telemetry.available) {
      return buildAlphaPulseSummaryFromRows(telemetry.rows, windowInfo, {
        ...telemetry,
        mode: "live",
      });
    }
    const snapshotSummary = buildAlphaPulseSummaryFromSnapshot(readSnapshotFile(), windowInfo, telemetry);
    if (snapshotSummary) return snapshotSummary;
    return buildAlphaPulseSummaryFromRows(telemetry.rows, windowInfo, telemetry);
  } catch (error) {
    const snapshotSummary = buildAlphaPulseSummaryFromSnapshot(readSnapshotFile(), windowInfo, {
      reason: error && error.message ? error.message : "alpha_pulse_summary_unavailable",
    });
    if (snapshotSummary) return snapshotSummary;
    return buildAlphaPulseSummaryFromRows([], windowInfo, {
      available: false,
      table: "",
      mode: "unavailable",
      reason: error && error.message ? error.message : "alpha_pulse_summary_unavailable",
    });
  }
}

module.exports = {
  SNAPSHOT_PATH,
  ALPHA_PULSE_ROLLUP_TABLE,
  buildAlphaPulseSummaryFromRollups,
  STAGES,
  buildAlphaPulseSummaryFromRows,
  buildAlphaPulseSummaryFromSnapshot,
  buildCoverageMap,
  buildCoverageSeams,
  buildWindow,
  loadAlphaPulseDashboardSummary,
  loadAlphaPulseRollupRows,
  loadTelemetryRows,
  readSnapshotFile,
};

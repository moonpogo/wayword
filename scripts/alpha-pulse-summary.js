#!/usr/bin/env node
"use strict";

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

const STAGES = [
  { id: "landed", label: "Landed" },
  { id: "started_writing", label: "Started writing" },
  { id: "submitted", label: "Submitted" },
  { id: "saved", label: "Saved" },
  { id: "returned", label: "Returned" },
  { id: "opened_recent_runs", label: "Opened Recent Runs" },
  { id: "opened_patterns", label: "Opened Patterns" },
  { id: "errors", label: "Errors" },
];

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

function countEvents(rows, predicate) {
  let count = 0;
  const list = Array.isArray(rows) ? rows : [];
  for (const row of list) {
    if (predicate(row)) count += 1;
  }
  return count;
}

function buildAlphaPulseSummaryFromRows(rows, windowInfo, meta) {
  const list = (Array.isArray(rows) ? rows : []).filter((row) => isWithinWindow(pickEventTimestamp(row), windowInfo));

  const stageCounts = {
    landed: countEvents(list, (row) => safeString(row.event) === "landing_viewed"),
    started_writing: countEvents(list, (row) => safeString(row.event) === "writing_started"),
    submitted: countEvents(list, (row) => safeString(row.event) === "run_submitted"),
    saved: countEvents(list, (row) => safeString(row.event) === "run_saved"),
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
      if (eventName === "migration_failed") return true;
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
      unavailableReason: safeString(meta && meta.reason),
    },
    stages: STAGES.map((stage) => ({
      id: stage.id,
      label: stage.label,
      count: stageCounts[stage.id] || 0,
      source: meta && meta.available ? "live" : "unavailable",
      note: "",
    })),
    seams: meta && meta.available
      ? []
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

async function loadAlphaPulseDashboardSummary(options) {
  loadDotEnv();
  const { url, serviceRole } = ensureSupabaseEnv();
  const supabase = createSupabaseRestClient({ url, serviceRole });
  const windowInfo = buildWindow(options && options.now, options && options.days);
  const telemetry = await loadTelemetryRows(supabase);
  return buildAlphaPulseSummaryFromRows(telemetry.rows, windowInfo, telemetry);
}

module.exports = {
  STAGES,
  buildAlphaPulseSummaryFromRows,
  buildWindow,
  loadAlphaPulseDashboardSummary,
  loadTelemetryRows,
};

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['\"]|['\"]$/g, "");
  }
}

function mustEnv(name) {
  const v = String(process.env[name] || "").trim();
  if (!v) throw new Error("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  return v;
}

function within(iso, startMs, endMs) {
  const ms = Date.parse(iso || "");
  return Number.isFinite(ms) && ms >= startMs && ms < endMs;
}

function pickEventTs(row) {
  return row.timestamp || row.created_at || (row.payload && row.payload.timestamp) || null;
}

function labelLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function main() {
  loadDotEnv();
  const supabase = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const yStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const startMs = yStart.getTime();
  const endMs = todayStart.getTime();
  const dayLabel = labelLocal(yStart);

  const [runsRes, eventsRes] = await Promise.all([
    supabase.from("runs").select("id,user_id,local_created_at,created_at"),
    supabase.from("retention_events").select("event,payload,user_id,timestamp,created_at").order("created_at", { ascending: false }).limit(10000),
  ]);

  if (runsRes.error) throw new Error(`runs query failed: ${runsRes.error.message}`);
  if (eventsRes.error) throw new Error(`retention_events query failed: ${eventsRes.error.message}`);

  const runs = runsRes.data || [];
  const events = eventsRes.data || [];

  let runsYesterday = 0;
  const runUsersYesterday = new Set();
  for (const r of runs) {
    const ts = r.local_created_at || r.created_at;
    if (!within(ts, startMs, endMs)) continue;
    runsYesterday += 1;
    if (r.user_id) runUsersYesterday.add(String(r.user_id));
  }

  let runSavedYesterday = 0;
  const runSavedUsersYesterday = new Set();
  const syncStatusBreakdown = { server_synced: 0, local_only_no_session: 0, local_only_sync_failed: 0, other: 0 };

  for (const e of events) {
    if (String(e.event || "") !== "run_saved") continue;
    if (!within(pickEventTs(e), startMs, endMs)) continue;
    runSavedYesterday += 1;
    if (e.user_id) runSavedUsersYesterday.add(String(e.user_id));
    const status = String((e.payload || {}).sync_status || "");
    if (Object.prototype.hasOwnProperty.call(syncStatusBreakdown, status)) syncStatusBreakdown[status] += 1;
    else syncStatusBreakdown.other += 1;
  }

  const usersWithRunsNoRunSaved = [];
  for (const id of runUsersYesterday) {
    if (!runSavedUsersYesterday.has(id)) usersWithRunsNoRunSaved.push(id);
  }

  const lines = [];
  lines.push(`# Telemetry Sync Audit - ${dayLabel}`);
  lines.push("");
  lines.push(`Window: ${yStart.toISOString()} to ${todayStart.toISOString()}`);
  lines.push("");
  lines.push("## Server Ingestion Checks");
  lines.push(`- runs created yesterday (server): ${runsYesterday}`);
  lines.push(`- run_saved events yesterday (server): ${runSavedYesterday}`);
  lines.push(`- ingestion delta (runs - run_saved): ${runsYesterday - runSavedYesterday}`);
  lines.push("");
  lines.push("## Sync Status Breakdown (run_saved)");
  lines.push(`- server_synced: ${syncStatusBreakdown.server_synced}`);
  lines.push(`- local_only_no_session: ${syncStatusBreakdown.local_only_no_session}`);
  lines.push(`- local_only_sync_failed: ${syncStatusBreakdown.local_only_sync_failed}`);
  lines.push(`- other: ${syncStatusBreakdown.other}`);
  lines.push("");
  lines.push("## User-Level Gaps");
  lines.push(`- users with server runs but no run_saved event in window: ${usersWithRunsNoRunSaved.length}`);
  lines.push(usersWithRunsNoRunSaved.length ? `- user ids: ${usersWithRunsNoRunSaved.join(", ")}` : "- user ids: none");
  lines.push("");
  lines.push("## Notes");
  lines.push("- This report compares server-ingested telemetry against server run writes.");
  lines.push("- Local-only telemetry volume is not directly queryable from this server-side script.");

  const outDir = path.join(process.cwd(), "docs", "alpha-pulse");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${dayLabel}-telemetry-sync-audit.md`);
  fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
  console.log(`Telemetry sync audit written: ${path.relative(process.cwd(), out)}`);
}

main().catch((e) => {
  console.error(`telemetry-sync-audit failed: ${e.message}`);
  process.exit(1);
});

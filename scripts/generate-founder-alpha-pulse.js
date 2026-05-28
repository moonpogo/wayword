#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const TELEMETRY_EVENTS = new Set([
  "onboarding_completed",
  "run_saved",
  "meaningful_session_completed",
  "observatory_revisited",
  "return_session_detected",
  "migration_previewed",
  "migration_completed",
  "migration_failed",
  "migration_skipped_unverified_rls",
]);

const TELEMETRY_TABLE_CANDIDATES = [
  "retention_telemetry_events",
  "retention_events",
  "telemetry_events",
];

function uniquePaths(paths) {
  const seen = new Set();
  const ordered = [];
  for (const candidate of paths) {
    if (!candidate) continue;
    const normalized = path.resolve(candidate);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    ordered.push(normalized);
  }
  return ordered;
}

function listRepoRoots() {
  const roots = [process.cwd()];
  try {
    const output = childProcess.execFileSync("git", ["worktree", "list", "--porcelain"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    for (const line of output.split(/\r?\n/)) {
      if (!line.startsWith("worktree ")) continue;
      roots.push(line.slice("worktree ".length).trim());
    }
  } catch {}
  return uniquePaths(roots);
}

function findFirstExisting(paths) {
  for (const candidate of paths) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}

function loadDotEnv() {
  const envPath = findFirstExisting(
    listRepoRoots().map((root) => path.join(root, ".env"))
  );
  if (!envPath) return "";
  const raw = fs.readFileSync(envPath, "utf8");
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    if (!key || process.env[key]) continue;
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
  return envPath;
}

function startOfTodayLocal(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isoDateLocal(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isWithinWindow(iso, startMs, endMs) {
  const ms = Date.parse(iso || "");
  return Number.isFinite(ms) && ms >= startMs && ms < endMs;
}

function pickEventTimestamp(row) {
  return row.timestamp || row.created_at || (row.payload && row.payload.timestamp) || null;
}

function pickRunTimestamp(row) {
  return row.local_created_at || row.created_at || null;
}

function pickEventUserId(row) {
  if (row.user_id) return String(row.user_id);
  const payload = row.payload || {};
  if (payload.user_id) return String(payload.user_id);
  if (payload.account_id) return String(payload.account_id);
  if (payload.subject_id) return String(payload.subject_id);
  return "";
}

function pickElapsedHours(row) {
  const payload = row.payload || {};
  const value = Number(payload.elapsed_hours);
  return Number.isFinite(value) ? value : null;
}

async function loadUsersAndRuns(supabase) {
  return {
    users: await fetchTableRows(supabase, "users", {
      select: "id,created_at",
    }),
    runs: await fetchTableRows(supabase, "runs", {
      select: "user_id,local_created_at,created_at,updated_at",
    }),
    observatory: await fetchTableRows(supabase, "observatory_summaries", {
      select: "user_id,generated_at",
    }),
  };
}

async function loadTelemetryEvents(supabase) {
  const failures = [];
  for (const table of TELEMETRY_TABLE_CANDIDATES) {
    try {
      const rows = await fetchTableRows(supabase, table, {
        select: "event,payload,timestamp,created_at,user_id",
        order: "created_at.asc",
        limit: "50000",
      });
      const filtered = rows.filter((row) => TELEMETRY_EVENTS.has(String(row.event || "")));
      return { available: true, table, rows: filtered, unavailableReason: "" };
    } catch (error) {
      failures.push(`${table}: ${error.message}`);
    }
  }

  return {
    available: false,
    table: "",
    rows: [],
    unavailableReason: failures.join(" | "),
  };
}

function createSupabaseRestClient(config) {
  const headers = {
    apikey: config.serviceRole,
    Authorization: `Bearer ${config.serviceRole}`,
  };

  return {
    async fetchRows(table, params) {
      const url = new URL(`/rest/v1/${table}`, config.url);
      for (const [key, value] of Object.entries(params)) {
        if (value == null || value === "") continue;
        url.searchParams.set(key, String(value));
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        const message = (await response.text()).trim() || `HTTP ${response.status}`;
        throw new Error(message);
      }

      const body = await response.json();
      return Array.isArray(body) ? body : [];
    },
  };
}

async function fetchTableRows(supabase, table, params) {
  try {
    return await supabase.fetchRows(table, params);
  } catch (error) {
    throw new Error(`${table} query failed: ${error.message}`);
  }
}

function incrementMapCounter(map, key) {
  const prior = map.get(key) || 0;
  map.set(key, prior + 1);
}

function buildPulse(input) {
  const { users, runs, observatory, telemetry, startMs, endMs } = input;

  const runCountByUser = new Map();
  let savedRunsYesterday = 0;
  for (const row of runs) {
    const userId = String(row.user_id || "");
    if (!userId) continue;
    incrementMapCounter(runCountByUser, userId);
    const stamp = pickRunTimestamp(row);
    if (isWithinWindow(stamp, startMs, endMs)) {
      savedRunsYesterday += 1;
    }
  }

  const observatoryByUser = new Map();
  let observatorySummariesYesterday = 0;
  for (const row of observatory) {
    const userId = String(row.user_id || "");
    if (!userId) continue;
    incrementMapCounter(observatoryByUser, userId);
    if (isWithinWindow(row.generated_at, startMs, endMs)) {
      observatorySummariesYesterday += 1;
    }
  }

  let meaningfulSessionsYesterday = 0;
  let returnSessionsYesterday = 0;
  let observatoryRevisitsYesterday = 0;
  let migrationFailedYesterday = 0;
  let migrationSkippedRlsYesterday = 0;
  let serverSyncedYesterday = 0;
  let localNoSessionYesterday = 0;
  let localSyncFailedYesterday = 0;

  const returnAfter12hUsers = new Set();
  const returnedUsers = new Set();
  const onboardingUsers = new Set();
  const observatoryEventUsers = new Set();

  if (telemetry.available) {
    for (const row of telemetry.rows) {
      const event = String(row.event || "");
      const stamp = pickEventTimestamp(row);
      const userId = pickEventUserId(row);
      const payload = row.payload || {};

      if (event === "onboarding_completed" && userId) onboardingUsers.add(userId);
      if (event === "return_session_detected" && userId) returnedUsers.add(userId);
      if (event === "observatory_revisited" && userId) observatoryEventUsers.add(userId);

      if (!isWithinWindow(stamp, startMs, endMs)) continue;

      if (event === "meaningful_session_completed") meaningfulSessionsYesterday += 1;
      if (event === "return_session_detected") {
        returnSessionsYesterday += 1;
        const elapsedHours = pickElapsedHours(row);
        if (userId && Number.isFinite(elapsedHours) && elapsedHours >= 12) {
          returnAfter12hUsers.add(userId);
        }
      }
      if (event === "observatory_revisited") observatoryRevisitsYesterday += 1;
      if (event === "migration_failed") migrationFailedYesterday += 1;
      if (event === "migration_skipped_unverified_rls") migrationSkippedRlsYesterday += 1;
      if (event === "run_saved") {
        const sync = String(payload.sync_status || "");
        if (sync === "server_synced") serverSyncedYesterday += 1;
        if (sync === "local_only_no_session") localNoSessionYesterday += 1;
        if (sync === "local_only_sync_failed") localSyncFailedYesterday += 1;
      }
    }
  }

  const accountIds = new Set(users.map((user) => String(user.id || "")).filter(Boolean));

  let newAccountsYesterday = 0;
  for (const user of users) {
    if (isWithinWindow(user.created_at, startMs, endMs)) newAccountsYesterday += 1;
  }

  const usersWith3Runs = Array.from(runCountByUser.values()).filter((count) => count >= 3).length;
  const usersWith5Runs = Array.from(runCountByUser.values()).filter((count) => count >= 5).length;

  let revisitedAfterMultipleRuns = 0;
  for (const userId of accountIds) {
    const runCount = runCountByUser.get(userId) || 0;
    const hasObservatoryRevisit = (observatoryByUser.get(userId) || 0) > 0 || observatoryEventUsers.has(userId);
    if (runCount >= 2 && hasObservatoryRevisit) revisitedAfterMultipleRuns += 1;
  }

  let zeroRunUsers = 0;
  let oneRunNoReturnUsers = 0;
  let runSavedNoObservatoryUsers = 0;
  for (const userId of accountIds) {
    const runCount = runCountByUser.get(userId) || 0;
    const hasReturn = returnedUsers.has(userId);
    const hasObservatory = (observatoryByUser.get(userId) || 0) > 0 || observatoryEventUsers.has(userId);

    if (runCount === 0) zeroRunUsers += 1;
    if (runCount === 1 && !hasReturn) oneRunNoReturnUsers += 1;
    if (runCount > 0 && !hasObservatory) runSavedNoObservatoryUsers += 1;
  }

  let onboardingNoSavedRunUsers = 0;
  for (const userId of onboardingUsers) {
    if ((runCountByUser.get(userId) || 0) === 0) onboardingNoSavedRunUsers += 1;
  }

  return {
    newAccountsYesterday,
    totalAccounts: accountIds.size,
    savedRunsYesterday,
    meaningfulSessionsYesterday,
    returnSessionsYesterday,
    observatoryRevisitsYesterday: telemetry.available ? observatoryRevisitsYesterday : observatorySummariesYesterday,
    usersWith3Runs,
    usersWith5Runs,
    usersReturnedAfter12h: telemetry.available ? returnAfter12hUsers.size : null,
    usersRevisitedPatternsAfterMultipleRuns: revisitedAfterMultipleRuns,
    usersWithZeroRuns: zeroRunUsers,
    usersWithOneRunNoReturn: oneRunNoReturnUsers,
    usersWithRunNoObservatoryRevisit: runSavedNoObservatoryUsers,
    usersOnboardingNoSavedRun: telemetry.available ? onboardingNoSavedRunUsers : null,
    trust: {
      serverSyncedYesterday: telemetry.available ? serverSyncedYesterday : null,
      localNoSessionYesterday: telemetry.available ? localNoSessionYesterday : null,
      localSyncFailedYesterday: telemetry.available ? localSyncFailedYesterday : null,
      migrationFailedYesterday: telemetry.available ? migrationFailedYesterday : null,
      migrationSkippedRlsYesterday: telemetry.available ? migrationSkippedRlsYesterday : null,
    },
    telemetryAvailable: telemetry.available,
    telemetryTable: telemetry.table,
    telemetryUnavailableReason: telemetry.unavailableReason || "",
  };
}

function formatMetric(label, value) {
  if (value == null) return `- ${label}: telemetry source unavailable`;
  return `- ${label}: ${value}`;
}

function buildMarkdown(dateLabel, windowStartIso, windowEndIso, pulse) {
  const lines = [];
  lines.push(`# Founder Alpha Pulse - ${dateLabel}`);
  lines.push("");
  lines.push(`Window: ${windowStartIso} to ${windowEndIso}`);
  lines.push("");
  lines.push("## 1. Alpha Pulse Summary");
  lines.push(`- new accounts yesterday: ${pulse.newAccountsYesterday}`);
  lines.push(`- total accounts: ${pulse.totalAccounts}`);
  lines.push(`- saved runs yesterday: ${pulse.savedRunsYesterday}`);
  if (pulse.telemetryAvailable) {
    lines.push(formatMetric("meaningful sessions yesterday", pulse.meaningfulSessionsYesterday));
    lines.push(formatMetric("return sessions yesterday", pulse.returnSessionsYesterday));
  }
  lines.push(formatMetric("observatory revisits yesterday", pulse.observatoryRevisitsYesterday));
  lines.push("");
  lines.push("## 2. Recurrence Signals");
  lines.push(`- users with 3+ saved runs: ${pulse.usersWith3Runs}`);
  lines.push(`- users with 5+ saved runs: ${pulse.usersWith5Runs}`);
  if (pulse.telemetryAvailable) {
    lines.push(formatMetric("users who returned after 12+ hours", pulse.usersReturnedAfter12h));
  }
  lines.push(`- users who revisited Patterns after multiple runs: ${pulse.usersRevisitedPatternsAfterMultipleRuns}`);
  lines.push("");
  lines.push("## 3. Drop-Off Watch");
  lines.push(`- users with account but zero runs: ${pulse.usersWithZeroRuns}`);
  lines.push(`- users with one run and no return: ${pulse.usersWithOneRunNoReturn}`);
  lines.push(`- users with run saved but no observatory revisit: ${pulse.usersWithRunNoObservatoryRevisit}`);
  if (pulse.telemetryAvailable) {
    lines.push(formatMetric("users with onboarding completed but no saved run", pulse.usersOnboardingNoSavedRun));
  }
  lines.push("");
  lines.push("## 4. Trust / Continuity Health");
  if (pulse.telemetryAvailable) {
    lines.push(formatMetric("server_synced count", pulse.trust.serverSyncedYesterday));
    lines.push(formatMetric("local_only_no_session count", pulse.trust.localNoSessionYesterday));
    lines.push(formatMetric("local_only_sync_failed count", pulse.trust.localSyncFailedYesterday));
    lines.push(formatMetric("migration_failed count", pulse.trust.migrationFailedYesterday));
    lines.push(formatMetric("migration_skipped_unverified_rls count", pulse.trust.migrationSkippedRlsYesterday));

    const warnings = [];
    if (pulse.trust.localSyncFailedYesterday > 0) warnings.push("local sync failures observed yesterday");
    if (pulse.trust.localNoSessionYesterday > 0) warnings.push("run saves without session observed yesterday");
    if (pulse.trust.migrationFailedYesterday > 0) warnings.push("migration failures observed yesterday");
    if (pulse.trust.migrationSkippedRlsYesterday > 0) warnings.push("migration skipped due to unverified RLS observed yesterday");
    if (warnings.length === 0) {
      lines.push("- auth/sync warnings: none observed yesterday");
    } else {
      lines.push(`- auth/sync warnings: ${warnings.join("; ")}`);
    }
  } else {
    lines.push("- telemetry-backed trust metrics unavailable: no readable telemetry table found");
  }

  lines.push("");
  lines.push("## 5. Founder Notes Prompt");
  lines.push("- What confused users?");
  lines.push("- What language did users repeat?");
  lines.push("- What screenshot/post drove interest?");
  lines.push("- What sparse-state moment needs attention?");
  lines.push("- Who should be followed up with today?");
  lines.push("");
  lines.push("## Data Source Notes");
  lines.push("- No writing body/content fields are queried or included.");
  if (pulse.telemetryAvailable) {
    lines.push(`- Telemetry source: ${pulse.telemetryTable}`);
  } else {
    lines.push("- Telemetry-backed metrics were omitted because no persisted telemetry source is available in the current project.");
  }
  lines.push("- Identifiers are aggregated only; no personal identifiers included.");
  lines.push("");

  return lines.join("\n");
}

function ensureSupabaseEnv() {
  const url = String(process.env.SUPABASE_URL || "").trim();
  const serviceRole = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceRole) {
    throw new Error(
      "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment or .env before running alpha pulse."
    );
  }
  return { url, serviceRole };
}

async function generateFounderAlphaPulse() {
  loadDotEnv();

  const { url, serviceRole } = ensureSupabaseEnv();
  const supabase = createSupabaseRestClient({ url, serviceRole });

  const todayStart = startOfTodayLocal(new Date());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const dateLabel = isoDateLocal(yesterdayStart);

  const windowStartIso = yesterdayStart.toISOString();
  const windowEndIso = todayStart.toISOString();

  const startMs = yesterdayStart.getTime();
  const endMs = todayStart.getTime();

  const baseData = await loadUsersAndRuns(supabase);
  const telemetry = await loadTelemetryEvents(supabase);

  const pulse = buildPulse({
    users: baseData.users,
    runs: baseData.runs,
    observatory: baseData.observatory,
    telemetry,
    startMs,
    endMs,
  });

  const markdown = buildMarkdown(dateLabel, windowStartIso, windowEndIso, pulse);
  const outDir = path.join(process.cwd(), "docs", "alpha-pulse");
  const outPath = path.join(outDir, `${dateLabel}-founder-alpha-pulse.md`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, markdown, "utf8");

  return { outPath, dateLabel, telemetryAvailable: telemetry.available };
}

if (require.main === module) {
  generateFounderAlphaPulse()
    .then((result) => {
      console.log(`Founder alpha pulse written: ${path.relative(process.cwd(), result.outPath)}`);
      if (!result.telemetryAvailable) {
        console.log("Note: telemetry source unavailable; report includes explicit unavailable markers.");
      }
    })
    .catch((error) => {
      console.error(`founder-alpha-pulse failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  buildPulse,
  buildMarkdown,
  createSupabaseRestClient,
  ensureSupabaseEnv,
  fetchTableRows,
  generateFounderAlphaPulse,
  listRepoRoots,
  loadDotEnv,
};

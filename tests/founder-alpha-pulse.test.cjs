const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPulse,
  buildMarkdown,
  ensureSupabaseEnv,
} = require("../scripts/generate-founder-alpha-pulse.js");

function iso(ms) {
  return new Date(ms).toISOString();
}

test("fails safely when supabase env is missing", () => {
  const priorUrl = process.env.SUPABASE_URL;
  const priorService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  assert.throws(
    () => ensureSupabaseEnv(),
    /Missing Supabase configuration/
  );

  if (priorUrl) process.env.SUPABASE_URL = priorUrl;
  if (priorService) process.env.SUPABASE_SERVICE_ROLE_KEY = priorService;
});

test("buildPulse handles empty alpha state cleanly", () => {
  const startMs = Date.parse("2026-05-25T07:00:00.000Z");
  const endMs = Date.parse("2026-05-26T07:00:00.000Z");

  const pulse = buildPulse({
    users: [],
    runs: [],
    observatory: [],
    telemetry: { available: false, table: "", rows: [] },
    startMs,
    endMs,
  });

  assert.equal(pulse.totalAccounts, 0);
  assert.equal(pulse.savedRunsYesterday, 0);
  assert.equal(pulse.usersWithZeroRuns, 0);
  assert.equal(pulse.telemetryAvailable, false);
});

test("buildPulse aggregates sync status and avoids content dependency", () => {
  const startMs = Date.parse("2026-05-25T07:00:00.000Z");
  const endMs = Date.parse("2026-05-26T07:00:00.000Z");

  const users = [
    { id: "u1", created_at: iso(startMs + 1000) },
    { id: "u2", created_at: iso(startMs - 1000) },
  ];

  const runs = [
    { user_id: "u1", local_created_at: iso(startMs + 2000), created_at: iso(startMs + 2100) },
    { user_id: "u2", created_at: iso(startMs + 3000) },
    { user_id: "u2", local_created_at: iso(startMs + 4000), created_at: iso(startMs + 4100) },
  ];

  const telemetry = {
    available: true,
    table: "retention_events",
    rows: [
      { event: "run_saved", created_at: iso(startMs + 100), payload: { sync_status: "server_synced" }, user_id: "u1" },
      { event: "run_saved", created_at: iso(startMs + 200), payload: { sync_status: "local_only_no_session" }, user_id: "u2" },
      { event: "run_saved", created_at: iso(startMs + 300), payload: { sync_status: "local_only_sync_failed" }, user_id: "u2" },
      { event: "return_session_detected", created_at: iso(startMs + 400), payload: { elapsed_hours: 13 }, user_id: "u2" },
      { event: "onboarding_completed", created_at: iso(startMs + 500), payload: {}, user_id: "u1" },
      { event: "meaningful_session_completed", created_at: iso(startMs + 600), payload: {}, user_id: "u1" },
    ],
  };

  const pulse = buildPulse({
    users,
    runs,
    observatory: [],
    telemetry,
    startMs,
    endMs,
  });

  assert.equal(pulse.trust.serverSyncedYesterday, 1);
  assert.equal(pulse.trust.localNoSessionYesterday, 1);
  assert.equal(pulse.trust.localSyncFailedYesterday, 1);
  assert.equal(pulse.usersReturnedAfter12h, 1);
});

test("buildPulse supports runs without saved_at by using local_created_at then created_at", () => {
  const startMs = Date.parse("2026-05-25T07:00:00.000Z");
  const endMs = Date.parse("2026-05-26T07:00:00.000Z");

  const pulse = buildPulse({
    users: [{ id: "u1", created_at: iso(startMs - 1000) }],
    runs: [
      { user_id: "u1", local_created_at: iso(startMs + 1000), created_at: iso(startMs + 9000) },
      { user_id: "u1", created_at: iso(startMs + 2000) },
      { user_id: "u1", local_created_at: iso(startMs - 1000), created_at: iso(startMs + 3000) },
    ],
    observatory: [],
    telemetry: { available: false, table: "", rows: [] },
    startMs,
    endMs,
  });

  assert.equal(pulse.savedRunsYesterday, 2);
});

test("markdown output contains no writing body field", () => {
  const markdown = buildMarkdown(
    "2026-05-25",
    "2026-05-25T07:00:00.000Z",
    "2026-05-26T07:00:00.000Z",
    {
      newAccountsYesterday: 0,
      totalAccounts: 0,
      savedRunsYesterday: 0,
      meaningfulSessionsYesterday: 0,
      returnSessionsYesterday: 0,
      observatoryRevisitsYesterday: 0,
      usersWith3Runs: 0,
      usersWith5Runs: 0,
      usersReturnedAfter12h: 0,
      usersRevisitedPatternsAfterMultipleRuns: 0,
      usersWithZeroRuns: 0,
      usersWithOneRunNoReturn: 0,
      usersWithRunNoObservatoryRevisit: 0,
      usersOnboardingNoSavedRun: 0,
      trust: {
        serverSyncedYesterday: 0,
        localNoSessionYesterday: 0,
        localSyncFailedYesterday: 0,
        migrationFailedYesterday: 0,
        migrationSkippedRlsYesterday: 0,
      },
      telemetryAvailable: true,
      telemetryTable: "retention_events",
    }
  );

  assert.equal(markdown.includes("writing_text"), false);
  assert.equal(markdown.includes("draft text"), false);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function makeStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

function loadScripts(context, files) {
  for (const file of files) {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
}

function makeContext(overrides = {}) {
  const storage = makeStorage();
  const context = vm.createContext({
    window: {},
    localStorage: storage,
    console,
    setTimeout,
    clearTimeout,
    Date,
    Promise,
    ...overrides,
  });
  context.window.window = context.window;
  context.window.localStorage = storage;
  context.window.console = console;
  context.window.Date = Date;
  context.window.Promise = Promise;
  return context;
}

test("event registry rejects prohibited content keys", () => {
  const context = makeContext();
  loadScripts(context, ["src/infrastructure/telemetry/event-registry.js"]);
  const registry = context.window.waywordTelemetryEventRegistry;
  const result = registry.sanitizePayload("run_saved", {
    sync_status: "server_synced",
    writing_text: "secret",
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "prohibited_key");
});

test("retention events queue before auth and flush after auth", async () => {
  const insertCalls = [];
  const context = makeContext();
  context.window.waywordSupabaseClient = {
    getClient() {
      return {
        from() {
          return {
            insert(rows) {
              insertCalls.push(rows);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };
  let currentSession = null;
  context.window.waywordAuthSessionRuntime = {
    getCurrentSession() {
      return currentSession;
    },
  };

  loadScripts(context, [
    "src/infrastructure/telemetry/event-registry.js",
    "src/infrastructure/telemetry/retention-events.js",
  ]);

  context.window.waywordRetentionEvents.markOnboardingCompleted({ source: "begin_button" });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(insertCalls.length, 0);

  currentSession = { user: { id: "user-1" } };
  const flushResult = await context.window.waywordRetentionEvents.flushPending();
  assert.equal(flushResult.ok, true);
  assert.equal(flushResult.count, 0);
  assert.equal(insertCalls.length, 0);
});

test("retention events flush matching-user queued telemetry and drop mismatched entries", async () => {
  const insertCalls = [];
  const context = makeContext();
  context.window.waywordSupabaseClient = {
    getClient() {
      return {
        from() {
          return {
            insert(rows) {
              insertCalls.push(rows);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };
  let currentSession = { user: { id: "user-b" } };
  context.window.waywordAuthSessionRuntime = {
    getCurrentSession() {
      return currentSession;
    },
  };

  loadScripts(context, [
    "src/infrastructure/telemetry/event-registry.js",
    "src/infrastructure/telemetry/retention-events.js",
  ]);

  context.window.localStorage.setItem(
    "waywordRetentionEventQueueV1",
    JSON.stringify([
      {
        event: "onboarding_completed",
        payload: { source: "landing" },
        queued_at: "2026-06-11T00:00:00.000Z",
        owner_key: "user-a",
      },
      {
        event: "onboarding_completed",
        payload: { source: "landing" },
        queued_at: "2026-06-11T00:00:01.000Z",
        owner_key: "user-b",
      },
      {
        event: "onboarding_completed",
        payload: { source: "landing" },
        queued_at: "2026-06-11T00:00:02.000Z",
        owner_key: "anonymous",
      },
    ])
  );

  const flushResult = await context.window.waywordRetentionEvents.flushPending();
  assert.equal(flushResult.ok, true);
  assert.equal(insertCalls.length, 1);
  assert.equal(insertCalls[0][0].event, "onboarding_completed");
  assert.equal(insertCalls[0][0].user_id, "user-b");
  assert.equal(insertCalls[0].length, 1);
  assert.deepEqual(JSON.parse(context.window.localStorage.getItem("waywordRetentionEventQueueV1") || "[]"), []);
});

test("retention events queue same-user failures and flush them correctly later", async () => {
  const insertCalls = [];
  let failInsert = true;
  const context = makeContext();
  context.window.waywordSupabaseClient = {
    getClient() {
      return {
        from() {
          return {
            insert(rows) {
              insertCalls.push(rows);
              if (failInsert) {
                return Promise.resolve({ error: { message: "temporary_failure" } });
              }
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };
  const currentSession = { user: { id: "user-1" } };
  context.window.waywordAuthSessionRuntime = {
    getCurrentSession() {
      return currentSession;
    },
  };

  loadScripts(context, [
    "src/infrastructure/telemetry/event-registry.js",
    "src/infrastructure/telemetry/retention-events.js",
  ]);

  const firstResult = await context.window.waywordRetentionEvents.persistTelemetryEvent(
    "onboarding_completed",
    { source: "begin_button" }
  );
  assert.equal(firstResult.ok, false);
  assert.equal(insertCalls.length, 1);

  failInsert = false;
  const flushResult = await context.window.waywordRetentionEvents.flushPending();
  assert.equal(flushResult.ok, true);
  assert.equal(flushResult.count, 1);
  assert.equal(insertCalls.length, 2);
  assert.equal(insertCalls[1][0].user_id, "user-1");
});

test("telemetry runtime forwards persisted retention events", async () => {
  const persisted = [];
  const context = makeContext();
  context.window.waywordTelemetryEventRegistry = {
    sanitizePayload(eventName, payload) {
      return { ok: true, payload: payload || {}, event: eventName };
    },
  };
  context.window.waywordRetentionEvents = {
    persistTelemetryEvent(eventName, payload) {
      persisted.push({ eventName, payload });
      return Promise.resolve({ ok: true });
    },
  };

  loadScripts(context, ["src/infrastructure/telemetry/telemetry-runtime.js"]);
  const runtime = context.window.waywordTelemetryRuntime;
  context.window.localStorage.setItem("wayword-retention-last-seen-at", String(Date.now() - 13 * 60 * 60 * 1000));
  const result = runtime.detectReturnSession({ thresholdHours: 12 });
  assert.equal(result.emitted, true);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].eventName, "return_session_detected");
});

test("telemetry runtime does not flush anonymous or other-user cached events as the current user", async () => {
  const insertCalls = [];
  const context = makeContext();
  let currentSession = { user: { id: "user-b" } };
  context.window.waywordTelemetryEventRegistry = {
    sanitizePayload(eventName, payload) {
      return { ok: true, payload: payload || {}, event: eventName };
    },
  };
  context.window.waywordSupabaseClient = {
    getClient() {
      return {
        from() {
          return {
            insert(rows) {
              insertCalls.push(rows);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };
  context.window.waywordAuthSessionRuntime = {
    getCurrentSession() {
      return currentSession;
    },
  };

  context.window.localStorage.setItem(
    "waywordRetentionTelemetryV1",
    JSON.stringify([
      {
        event: "landing_viewed",
        timestamp: "2026-06-11T00:00:00.000Z",
        payload: { source: "landing" },
        owner_key: "anonymous",
      },
      {
        event: "landing_viewed",
        timestamp: "2026-06-11T00:00:01.000Z",
        payload: { source: "landing" },
        owner_key: "user-a",
      },
    ])
  );
  context.window.localStorage.setItem("wayword-retention-telemetry-synced-count", "0");

  loadScripts(context, ["src/infrastructure/telemetry/telemetry-runtime.js"]);
  const runtime = context.window.waywordTelemetryRuntime;
  const result = runtime.track("landing_viewed", { source: "begin_button" });
  assert.equal(result.ok, true);
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(insertCalls.length, 1);
  assert.equal(insertCalls[0].length, 1);
  assert.equal(insertCalls[0][0].user_id, "user-b");
  assert.equal(insertCalls[0][0].payload.source, "begin_button");
  const stored = JSON.parse(context.window.localStorage.getItem("waywordRetentionTelemetryV1") || "[]");
  assert.equal(stored.length, 1);
  assert.equal(stored[0].owner_key, "user-b");
});

test("event registry accepts alpha pulse funnel events and rejects empty feedback", () => {
  const context = makeContext();
  loadScripts(context, ["src/infrastructure/telemetry/event-registry.js"]);
  const registry = context.window.waywordTelemetryEventRegistry;

  assert.equal(registry.sanitizePayload("landing_viewed", { source: "landing_screen" }).ok, true);
  assert.equal(registry.sanitizePayload("writing_started", { source: "begin_button" }).ok, true);
  assert.equal(registry.sanitizePayload("run_submitted", {}).ok, true);
  assert.equal(registry.sanitizePayload("recent_runs_opened", { surface_name: "drawer" }).ok, true);
  assert.equal(registry.sanitizePayload("alpha_pulse_feedback", { response: "useful" }).ok, true);
  assert.equal(registry.sanitizePayload("alpha_pulse_feedback", { response: "" }).ok, false);
});

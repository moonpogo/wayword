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
  assert.equal(insertCalls.length, 1);
  assert.equal(insertCalls[0][0].event, "onboarding_completed");
  assert.equal(insertCalls[0][0].user_id, "user-1");
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

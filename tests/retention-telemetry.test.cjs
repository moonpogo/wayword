const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const REPO_ROOT = path.resolve(__dirname, "..");

function createLocalStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
  };
}

function loadScriptIntoContext(context, relativePath) {
  const absPath = path.join(REPO_ROOT, relativePath);
  const source = fs.readFileSync(absPath, "utf8");
  vm.runInContext(source, context, { filename: absPath });
}

function buildContext() {
  const localStorage = createLocalStorage();
  const windowObj = { localStorage };
  const context = vm.createContext({
    window: windowObj,
    localStorage,
    console,
    Date,
    Math,
    JSON,
    setTimeout,
    clearTimeout,
  });

  loadScriptIntoContext(context, "src/infrastructure/telemetry/event-registry.js");
  loadScriptIntoContext(context, "src/infrastructure/telemetry/telemetry-runtime.js");
  loadScriptIntoContext(context, "src/infrastructure/telemetry/retention-events.js");

  return { windowObj };
}

test("telemetry registry locks Track 6 event allowlist", () => {
  const { windowObj } = buildContext();
  const events = Array.from(windowObj.waywordTelemetryEventRegistry.ALLOWED_EVENTS || []);

  assert.deepEqual(events, [
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
});

test("unknown telemetry events are rejected", () => {
  const { windowObj } = buildContext();
  const result = windowObj.waywordTelemetryRuntime.track("mystery_event", { status: "x" });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "unknown_event");
});

test("prohibited content payload keys are rejected", () => {
  const { windowObj } = buildContext();
  const result = windowObj.waywordTelemetryRuntime.track("run_saved", {
    sync_status: "server_synced",
    writing_text: "secret",
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "prohibited_payload_key");
});

test("run save hook emits run_saved and meaningful session candidate without content", () => {
  const { windowObj } = buildContext();

  windowObj.waywordRetentionEvents.beginSession();
  const emitted = windowObj.waywordRetentionEvents.markRunSaved({
    sync_status: "local_only_fallback",
    is_authenticated: false,
  });

  assert.equal(emitted.ok, true);

  const events = windowObj.waywordTelemetryRuntime.getEvents();
  const runSaved = events.find((row) => row.event === "run_saved");
  const meaningful = events.find((row) => row.event === "meaningful_session_completed");

  assert.ok(runSaved, "run_saved should be emitted");
  assert.equal(runSaved.payload.sync_status, "local_only_fallback");
  assert.equal(Object.prototype.hasOwnProperty.call(runSaved.payload, "writing_text"), false);

  assert.ok(meaningful, "meaningful session should be emitted as candidate/completed status");
  assert.equal(meaningful.payload.status, "candidate");
});

test("migration telemetry payload is schema-limited and excludes unknown fields", () => {
  const { windowObj } = buildContext();

  const emitted = windowObj.waywordRetentionEvents.markMigrationPreviewed({
    local_count: 3,
    server_count: 1,
    duplicate_count: 1,
    local_only_count: 2,
    conflict_count: 0,
    upload_count: 2,
    status: "preview_ready",
    extra_field: "drop_me",
  });

  assert.equal(emitted.ok, true);

  const eventRow = windowObj.waywordTelemetryRuntime
    .getEvents()
    .find((row) => row.event === "migration_previewed");

  assert.ok(eventRow);
  assert.equal(eventRow.payload.local_count, 3);
  assert.equal(eventRow.payload.status, "preview_ready");
  assert.equal(Object.prototype.hasOwnProperty.call(eventRow.payload, "extra_field"), false);
});

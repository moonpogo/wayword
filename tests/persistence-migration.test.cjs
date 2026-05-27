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
    _dump() {
      return Object.fromEntries(store.entries());
    },
  };
}

function loadScriptIntoContext(context, relativePath) {
  const absPath = path.join(REPO_ROOT, relativePath);
  const source = fs.readFileSync(absPath, "utf8");
  vm.runInContext(source, context, { filename: absPath });
}

function buildContext({ env = {}, localHistory = [], sessionUserId = "user-a", serverRuns = [] } = {}) {
  const localStorage = createLocalStorage();
  const windowObj = {
    __WAYWORD_ENV: env,
    waywordStorage: {
      loadHistory() {
        return JSON.parse(JSON.stringify(localHistory));
      },
    },
    waywordAuthSessionRuntime: {
      getCurrentSession() {
        if (!sessionUserId) return null;
        return { user: { id: sessionUserId } };
      },
    },
  };

  const opLog = [];
  const supabaseClient = {
    from(tableName) {
      const op = { tableName, mode: null, filters: [], payload: null };
      opLog.push(op);
      function eq(field, value) {
        op.filters.push([field, value]);
        return api;
      }
      const api = {
        eq,
        order() {
          return Promise.resolve({ data: serverRuns, error: null });
        },
        select() {
          return api;
        },
        single() {
          return Promise.resolve({ data: { id: "server-id-1", payload: op.payload }, error: null });
        },
      };
      return {
        select() {
          op.mode = "select";
          return api;
        },
        insert(payload) {
          op.mode = "insert";
          op.payload = payload;
          return api;
        },
        delete() {
          op.mode = "delete";
          return {
            eq,
          };
        },
      };
    },
  };

  windowObj.waywordSupabaseClient = {
    getClient() {
      return supabaseClient;
    },
  };

  const context = vm.createContext({
    window: windowObj,
    localStorage,
    console,
    Date,
    Math,
    setTimeout,
    clearTimeout,
    Promise,
  });

  loadScriptIntoContext(context, "src/config/env.js");
  loadScriptIntoContext(context, "src/infrastructure/persistence/local-run-store.js");
  loadScriptIntoContext(context, "src/infrastructure/persistence/run-migration-utils.js");
  loadScriptIntoContext(context, "src/infrastructure/persistence/supabase-run-store.js");
  loadScriptIntoContext(context, "src/infrastructure/persistence/persistence-runtime.js");

  return { context, windowObj, localStorage, opLog };
}

test("migration preview is non-mutating and reports local-only runs", async () => {
  const localRuns = [
    { runId: "r1", originalText: "hello world", savedAt: 1710000000000, wordCount: 2 },
    { runId: "r2", originalText: "second run", savedAt: 1710000100000, wordCount: 2 },
  ];
  const { windowObj } = buildContext({
    env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon" },
    localHistory: localRuns,
    sessionUserId: "user-a",
    serverRuns: [],
  });

  windowObj.waywordPersistenceRuntime.init({ onStatus() {} });
  const before = JSON.stringify(localRuns);
  const preview = await windowObj.waywordPersistenceRuntime.previewMigration({ storage: windowObj.waywordStorage });
  const after = JSON.stringify(localRuns);

  assert.equal(before, after, "preview must not mutate local run history");
  assert.equal(preview.status, "preview_ready");
  assert.equal(preview.localRunCount, 2);
  assert.equal(preview.serverRunCount, 0);
  assert.equal(preview.localOnly.length, 2);
  assert.equal(preview.estimatedUploadCount, 2);
});

test("migration executor is gated when RLS verification is not enabled", async () => {
  const { windowObj, localStorage } = buildContext({
    env: {
      SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_RLS_VERIFIED: false,
    },
    localHistory: [{ runId: "r1", originalText: "hello", savedAt: 1710000000000, wordCount: 1 }],
    sessionUserId: "user-a",
    serverRuns: [],
  });

  windowObj.waywordPersistenceRuntime.init({ onStatus() {} });
  const result = await windowObj.waywordPersistenceRuntime.executeMigration({ storage: windowObj.waywordStorage });

  assert.equal(result.status, "skipped_unverified_rls");
  assert.equal(localStorage.getItem("wayword-migration-status"), "skipped_unverified_rls");
});

test("migration executor fails when unauthenticated", async () => {
  const { windowObj } = buildContext({
    env: {
      SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_RLS_VERIFIED: true,
    },
    localHistory: [{ runId: "r1", originalText: "hello", savedAt: 1710000000000, wordCount: 1 }],
    sessionUserId: "",
    serverRuns: [],
  });

  windowObj.waywordPersistenceRuntime.init({ onStatus() {} });
  const result = await windowObj.waywordPersistenceRuntime.executeMigration({ storage: windowObj.waywordStorage });

  assert.equal(result.status, "failed");
  assert.equal(result.reason, "no_authenticated_session");
});

test("overlap classifier flags client_run_id collisions with differing fingerprints", () => {
  const { windowObj } = buildContext();

  const localRun = { runId: "run-1", originalText: "alpha beta", savedAt: 1710000000000, wordCount: 2 };
  const serverRun = { client_run_id: "run-1", writing_text: "different text", saved_at: "2024-03-09T00:00:00.000Z", word_count: 2 };

  const overlap = windowObj.waywordRunMigrationUtils.classifyOverlap(localRun, serverRun);
  assert.equal(overlap.kind, "conflict");
  assert.equal(overlap.reason, "client_run_id_collision");
});

test("exportOwnedRuns returns only authenticated ownership envelope fields", async () => {
  const serverRows = [
    {
      id: "run-a",
      user_id: "user-a",
      client_run_id: "client-a",
      writing_text: "private writing",
      saved_at: "2026-05-24T01:00:00.000Z",
      word_count: 2,
      prompt_id: "p1",
      prompt_family: "entry",
      created_at: "2026-05-24T01:00:00.000Z",
      updated_at: "2026-05-24T01:00:00.000Z",
      continuity_state: "active",
      migration_fingerprint: "abc",
      migration_source: "local_storage",
      migrated_at: "2026-05-24T01:05:00.000Z",
      migration_batch_id: "migration-1",
    },
  ];
  const { windowObj, opLog } = buildContext({
    env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_RLS_VERIFIED: true },
    sessionUserId: "user-a",
    serverRuns: serverRows,
  });
  windowObj.waywordPersistenceRuntime.init({ onStatus() {} });
  const result = await windowObj.waywordPersistenceRuntime.exportOwnedRuns();
  assert.equal(result.ok, true);
  assert.equal(result.runCount, 1);
  assert.equal(result.exportData.ownerUserId, "user-a");
  assert.equal(result.exportData.runs[0].writingText, "private writing");
  const exportOp = opLog.find((op) => op.mode === "select" && op.tableName === "runs");
  assert.ok(exportOp);
  assert.deepEqual(exportOp.filters.some(([field, value]) => field === "user_id" && value === "user-a"), true);
});

test("deleteOwnedRun scopes delete query to authenticated ownership", async () => {
  const { windowObj, opLog } = buildContext({
    env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_RLS_VERIFIED: true },
    sessionUserId: "user-a",
  });
  windowObj.waywordPersistenceRuntime.init({ onStatus() {} });
  const result = await windowObj.waywordPersistenceRuntime.deleteOwnedRun("run-1");
  assert.equal(result.ok, true);
  const deleteOp = opLog.find((op) => op.mode === "delete" && op.tableName === "runs");
  assert.ok(deleteOp);
  assert.deepEqual(deleteOp.filters.some(([field, value]) => field === "user_id" && value === "user-a"), true);
  assert.deepEqual(deleteOp.filters.some(([field, value]) => field === "id" && value === "run-1"), true);
  assert.equal(result.localDataDeleted, false);
});

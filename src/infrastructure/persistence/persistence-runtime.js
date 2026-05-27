(function () {
  var initialized = false;
  var supabase = null;
  var migrationStatus = "not_started";

  function safeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function readLocalMigrationStatus() {
    try {
      return safeString(localStorage.getItem("wayword-migration-status"));
    } catch (_) {
      return "";
    }
  }

  function writeLocalMigrationStatus(status) {
    migrationStatus = status;
    try {
      localStorage.setItem("wayword-migration-status", status);
    } catch (_) {
      /* ignore */
    }
  }

  function emitMigrationEvent(methodName, payload) {
    try {
      var retention = window.waywordRetentionEvents;
      if (!retention || typeof retention[methodName] !== "function") return;
      retention[methodName](payload || {});
    } catch (_) {
      /* ignore */
    }
  }

  function getSessionUserId() {
    var authRuntime = window.waywordAuthSessionRuntime;
    if (!authRuntime || typeof authRuntime.getCurrentSession !== "function") return "";
    var session = authRuntime.getCurrentSession();
    if (!session || !session.user || !session.user.id) return "";
    return String(session.user.id);
  }

  function isRlsVerified() {
    var env = window.waywordEnv || {};
    return env.SUPABASE_RLS_VERIFIED === true || env.SUPABASE_RLS_VERIFIED === "true";
  }

  function toIsoNow() {
    return new Date().toISOString();
  }

  function buildExportEnvelope(userId, rows) {
    var list = Array.isArray(rows) ? rows : [];
    return {
      schemaVersion: "wayword-export-v1",
      exportedAt: toIsoNow(),
      ownerUserId: userId,
      runCount: list.length,
      runs: list.map(function (row) {
        return {
          id: safeString(row && row.id),
          clientRunId: safeString(row && row.client_run_id),
          savedAt: safeString(row && row.saved_at),
          createdAt: safeString(row && row.created_at),
          updatedAt: safeString(row && row.updated_at),
          promptId: safeString(row && row.prompt_id),
          promptFamily: safeString(row && row.prompt_family),
          continuityState: safeString(row && row.continuity_state),
          wordCount: Number(row && row.word_count) || 0,
          writingText: String((row && row.writing_text) || ""),
          migrationFingerprint: safeString(row && row.migration_fingerprint),
          migrationSource: safeString(row && row.migration_source),
          migratedAt: safeString(row && row.migrated_at),
          migrationBatchId: safeString(row && row.migration_batch_id),
        };
      }),
    };
  }

  function getLocalRuns(storageApi) {
    var store = window.waywordLocalRunStore;
    if (!store || typeof store.readHistoryRows !== "function") return [];
    return store.readHistoryRows(storageApi);
  }

  function buildLocalRunMeta(run) {
    var utils = window.waywordRunMigrationUtils;
    var localRunId = utils && typeof utils.localRunId === "function"
      ? utils.localRunId(run)
      : safeString(run && run.runId);
    var fingerprint = utils && typeof utils.buildRunFingerprint === "function"
      ? utils.buildRunFingerprint(run)
      : "";
    return {
      run: run,
      localRunId: localRunId,
      fingerprint: fingerprint,
    };
  }

  function buildServerRunMeta(run) {
    var utils = window.waywordRunMigrationUtils;
    var localRunId = utils && typeof utils.localRunId === "function"
      ? utils.localRunId(run)
      : safeString(run && run.client_run_id);
    var fingerprint = safeString(run && run.migration_fingerprint);
    if (!fingerprint && utils && typeof utils.buildRunFingerprint === "function") {
      fingerprint = utils.buildRunFingerprint(run);
    }
    return {
      run: run,
      localRunId: localRunId,
      fingerprint: fingerprint,
    };
  }

  function classifyPreview(localRuns, serverRuns) {
    var utils = window.waywordRunMigrationUtils || {};
    var localMeta = localRuns.map(buildLocalRunMeta);
    var serverMeta = serverRuns.map(buildServerRunMeta);

    var serverByFingerprint = new Map();
    var serverByClientRunId = new Map();

    serverMeta.forEach(function (row) {
      if (row.fingerprint) serverByFingerprint.set(row.fingerprint, row);
      if (row.localRunId) {
        if (!serverByClientRunId.has(row.localRunId)) serverByClientRunId.set(row.localRunId, []);
        serverByClientRunId.get(row.localRunId).push(row);
      }
    });

    var exactDuplicates = [];
    var localOnly = [];
    var conflicts = [];

    localMeta.forEach(function (localRow) {
      var matchedServer = localRow.fingerprint ? serverByFingerprint.get(localRow.fingerprint) : null;
      if (matchedServer) {
        exactDuplicates.push({ local: localRow, server: matchedServer, reason: "fingerprint_match" });
        return;
      }

      var sameClientRun = localRow.localRunId ? serverByClientRunId.get(localRow.localRunId) || [] : [];
      if (sameClientRun.length > 0) {
        var conflictReason = "client_run_id_collision";
        if (typeof utils.classifyOverlap === "function") {
          conflictReason = utils.classifyOverlap(localRow.run, sameClientRun[0].run).reason;
        }
        conflicts.push({ local: localRow, server: sameClientRun, reason: conflictReason });
        return;
      }

      localOnly.push(localRow);
    });

    var localFingerprintSet = new Set(localMeta.map(function (row) { return row.fingerprint; }).filter(Boolean));
    var serverOnly = serverMeta.filter(function (row) {
      return !row.fingerprint || !localFingerprintSet.has(row.fingerprint);
    });

    return {
      localRunCount: localRuns.length,
      serverRunCount: serverRuns.length,
      exactDuplicates: exactDuplicates,
      localOnly: localOnly,
      serverOnly: serverOnly,
      conflicts: conflicts,
      estimatedUploadCount: localOnly.length,
    };
  }

  async function loadServerRuns(userId) {
    if (!supabase) return { data: [], error: null };
    if (!window.waywordSupabaseRunStore || typeof window.waywordSupabaseRunStore.listServerRunsForUser !== "function") {
      return { data: [], error: new Error("supabase_run_store_missing") };
    }
    return window.waywordSupabaseRunStore.listServerRunsForUser(supabase, userId);
  }

  function init(input) {
    if (initialized) return;
    initialized = true;

    var persistedStatus = readLocalMigrationStatus();
    if (persistedStatus) {
      migrationStatus = persistedStatus;
    }

    if (!window.waywordSupabaseClient || typeof window.waywordSupabaseClient.getClient !== "function") {
      return;
    }
    supabase = window.waywordSupabaseClient.getClient();

    if (!supabase && typeof input.onStatus === "function") {
      input.onStatus({ mode: "local-only", reason: "supabase_not_configured", migrationStatus: migrationStatus });
      return;
    }

    if (typeof input.onStatus === "function") {
      input.onStatus({ mode: supabase ? "hybrid" : "local-only", migrationStatus: migrationStatus });
    }
  }

  async function syncSavedRun(run) {
    if (!supabase) {
      return { ok: false, reason: "supabase_not_configured" };
    }

    var userId = getSessionUserId();
    if (!userId) {
      return { ok: false, reason: "no_authenticated_session" };
    }

    if (!window.waywordSupabaseRunStore || typeof window.waywordSupabaseRunStore.upsertRun !== "function") {
      return { ok: false, reason: "supabase_run_store_missing" };
    }

    try {
      var result = await window.waywordSupabaseRunStore.upsertRun(supabase, run, userId);
      if (result && result.error) {
        return { ok: false, reason: "insert_error", error: result.error };
      }
      return { ok: true, serverId: result && result.data ? result.data.id || "" : "" };
    } catch (err) {
      return { ok: false, reason: "exception", error: err };
    }
  }

  async function previewMigration(options) {
    var storageApi = options && options.storage ? options.storage : window.waywordStorage;
    var localRuns = getLocalRuns(storageApi);

    var userId = getSessionUserId();
    if (!supabase || !userId) {
      writeLocalMigrationStatus("preview_ready");
      var gatedPreview = {
        status: "preview_ready",
        gated: true,
        reason: !supabase ? "supabase_not_configured" : "no_authenticated_session",
        localRunCount: localRuns.length,
        serverRunCount: 0,
        exactDuplicates: [],
        localOnly: localRuns.map(buildLocalRunMeta),
        serverOnly: [],
        conflicts: [],
        estimatedUploadCount: localRuns.length,
      };
      emitMigrationEvent("markMigrationPreviewed", {
        local_count: gatedPreview.localRunCount,
        server_count: gatedPreview.serverRunCount,
        duplicate_count: 0,
        local_only_count: gatedPreview.localOnly.length,
        conflict_count: 0,
        upload_count: gatedPreview.estimatedUploadCount,
        status: gatedPreview.status,
      });
      return gatedPreview;
    }

    var serverResult = await loadServerRuns(userId);
    if (serverResult && serverResult.error) {
      var failedPreview = {
        status: "failed",
        gated: true,
        reason: "server_fetch_failed",
        error: serverResult.error,
        localRunCount: localRuns.length,
        serverRunCount: 0,
        exactDuplicates: [],
        localOnly: localRuns.map(buildLocalRunMeta),
        serverOnly: [],
        conflicts: [],
        estimatedUploadCount: localRuns.length,
      };
      emitMigrationEvent("markMigrationFailed", {
        status: failedPreview.status,
        reason: failedPreview.reason,
      });
      return failedPreview;
    }

    var classified = classifyPreview(localRuns, Array.isArray(serverResult.data) ? serverResult.data : []);
    writeLocalMigrationStatus("preview_ready");
    var result = Object.assign({ status: "preview_ready", gated: false }, classified);
    emitMigrationEvent("markMigrationPreviewed", {
      local_count: result.localRunCount,
      server_count: result.serverRunCount,
      duplicate_count: result.exactDuplicates.length,
      local_only_count: result.localOnly.length,
      conflict_count: result.conflicts.length,
      upload_count: result.estimatedUploadCount,
      status: result.status,
    });
    return result;
  }

  async function executeMigration(options) {
    var storageApi = options && options.storage ? options.storage : window.waywordStorage;

    if (!isRlsVerified()) {
      writeLocalMigrationStatus("skipped_unverified_rls");
      emitMigrationEvent("markMigrationSkippedUnverifiedRls");
      return {
        status: "skipped_unverified_rls",
        uploadedCount: 0,
        skippedDuplicates: 0,
        conflicts: [],
        failures: [],
      };
    }

    if (!supabase) {
      emitMigrationEvent("markMigrationFailed", {
        status: "failed",
        reason: "supabase_not_configured",
      });
      return { status: "failed", reason: "supabase_not_configured" };
    }

    var userId = getSessionUserId();
    if (!userId) {
      emitMigrationEvent("markMigrationFailed", {
        status: "failed",
        reason: "no_authenticated_session",
      });
      return { status: "failed", reason: "no_authenticated_session" };
    }

    var preview = await previewMigration({ storage: storageApi });
    if (preview.status !== "preview_ready") {
      emitMigrationEvent("markMigrationFailed", {
        status: "failed",
        reason: "preview_failed",
      });
      return {
        status: "failed",
        reason: "preview_failed",
        preview: preview,
      };
    }

    writeLocalMigrationStatus("in_progress");

    var batchId = window.waywordRunMigrationUtils && typeof window.waywordRunMigrationUtils.makeBatchId === "function"
      ? window.waywordRunMigrationUtils.makeBatchId()
      : ["migration", Date.now()].join("-");

    var uploadedCount = 0;
    var failures = [];

    for (var i = 0; i < preview.localOnly.length; i += 1) {
      var localRow = preview.localOnly[i];
      var run = Object.assign({}, localRow.run, { migrationBatchId: batchId });
      var result = await syncSavedRun(run);
      if (result && result.ok) {
        uploadedCount += 1;
      } else {
        failures.push({ localRunId: localRow.localRunId, reason: result && result.reason ? result.reason : "unknown" });
      }
    }

    var status = "completed";
    if (failures.length > 0 && uploadedCount > 0) status = "partial_failure";
    if (failures.length > 0 && uploadedCount === 0) status = "failed";

    writeLocalMigrationStatus(status);
    if (status === "completed") {
      emitMigrationEvent("markMigrationCompleted", {
        local_count: preview.localRunCount,
        server_count: preview.serverRunCount,
        duplicate_count: preview.exactDuplicates.length,
        local_only_count: preview.localOnly.length,
        conflict_count: preview.conflicts.length,
        upload_count: uploadedCount,
        status: status,
      });
    } else {
      emitMigrationEvent("markMigrationFailed", {
        status: status,
        reason: failures.length > 0 ? "upload_failures" : "unknown",
      });
    }

    return {
      status: status,
      migrationBatchId: batchId,
      localRunCount: preview.localRunCount,
      serverRunCount: preview.serverRunCount,
      uploadedCount: uploadedCount,
      skippedDuplicates: preview.exactDuplicates.length,
      conflicts: preview.conflicts,
      failures: failures,
      estimatedUploadCount: preview.estimatedUploadCount,
    };
  }

  async function exportOwnedRuns() {
    if (!supabase) return { ok: false, reason: "supabase_not_configured" };
    var userId = getSessionUserId();
    if (!userId) return { ok: false, reason: "no_authenticated_session" };
    if (!window.waywordSupabaseRunStore || typeof window.waywordSupabaseRunStore.exportRunsForUser !== "function") {
      return { ok: false, reason: "supabase_run_store_missing" };
    }
    try {
      var result = await window.waywordSupabaseRunStore.exportRunsForUser(supabase, userId);
      if (result && result.error) return { ok: false, reason: "export_query_failed", error: result.error };
      var rows = Array.isArray(result && result.data) ? result.data : [];
      return {
        ok: true,
        userId: userId,
        format: "json",
        exportedAt: toIsoNow(),
        runCount: rows.length,
        exportData: buildExportEnvelope(userId, rows),
      };
    } catch (err) {
      return { ok: false, reason: "export_exception", error: err };
    }
  }

  async function deleteOwnedRun(runId) {
    if (!supabase) return { ok: false, reason: "supabase_not_configured" };
    var userId = getSessionUserId();
    if (!userId) return { ok: false, reason: "no_authenticated_session" };
    if (!window.waywordSupabaseRunStore || typeof window.waywordSupabaseRunStore.deleteRunForUser !== "function") {
      return { ok: false, reason: "supabase_run_store_missing" };
    }
    try {
      var result = await window.waywordSupabaseRunStore.deleteRunForUser(supabase, userId, runId);
      if (result && result.error) return { ok: false, reason: "delete_failed", error: result.error };
      return { ok: true, userId: userId, deletedRunId: safeString(runId), localDataDeleted: false };
    } catch (err) {
      return { ok: false, reason: "delete_exception", error: err };
    }
  }

  async function deleteAllOwnedRuns() {
    if (!supabase) return { ok: false, reason: "supabase_not_configured" };
    var userId = getSessionUserId();
    if (!userId) return { ok: false, reason: "no_authenticated_session" };
    if (!window.waywordSupabaseRunStore || typeof window.waywordSupabaseRunStore.deleteAllRunsForUser !== "function") {
      return { ok: false, reason: "supabase_run_store_missing" };
    }
    try {
      var result = await window.waywordSupabaseRunStore.deleteAllRunsForUser(supabase, userId);
      if (result && result.error) return { ok: false, reason: "delete_all_failed", error: result.error };
      return { ok: true, userId: userId, localDataDeleted: false };
    } catch (err) {
      return { ok: false, reason: "delete_all_exception", error: err };
    }
  }

  window.waywordPersistenceRuntime = {
    init: init,
    syncSavedRun: syncSavedRun,
    previewMigration: previewMigration,
    executeMigration: executeMigration,
    exportOwnedRuns: exportOwnedRuns,
    deleteOwnedRun: deleteOwnedRun,
    deleteAllOwnedRuns: deleteAllOwnedRuns,
    getMigrationStatus: function () {
      return migrationStatus;
    },
    isRlsVerified: isRlsVerified,
  };
})();

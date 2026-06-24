(function () {
  function cloneLegacyFallbackRow(run) {
    return Object.assign({}, run);
  }

  function assembleCanonicalDocument(input) {
    if (
      !window.waywordRunDocumentsModel ||
      typeof window.waywordRunDocumentsModel.assembleRunDocumentForSuccessfulSave !== "function"
    ) {
      return null;
    }
    try {
      return window.waywordRunDocumentsModel.assembleRunDocumentForSuccessfulSave(input);
    } catch (assembleErr) {
      console.error("wayword: assembleRunDocumentForSuccessfulSave failed; using legacy run row for session only", assembleErr);
      return null;
    }
  }

  function projectLegacyHistoryRow(canonicalDoc, fallbackRun) {
    if (
      canonicalDoc &&
      window.waywordRunDocumentsModel &&
      typeof window.waywordRunDocumentsModel.legacyHistoryRowFromCanonicalDocument === "function"
    ) {
      try {
        return window.waywordRunDocumentsModel.legacyHistoryRowFromCanonicalDocument(canonicalDoc);
      } catch (projectionErr) {
        console.error("wayword: legacyHistoryRowFromCanonicalDocument failed; using legacy run row", projectionErr);
      }
    }
    return cloneLegacyFallbackRow(fallbackRun);
  }

  function upsertCanonicalDocument(canonicalDoc) {
    if (
      !canonicalDoc ||
      !window.waywordRunDocumentRepo ||
      typeof window.waywordRunDocumentRepo.upsertDocument !== "function"
    ) {
      return false;
    }
    try {
      window.waywordRunDocumentRepo.upsertDocument(canonicalDoc);
      return true;
    } catch (persistErr) {
      console.error("wayword: canonical repository upsert failed", persistErr);
      console.warn(
        "wayword: legacy history/localStorage will still be updated; canonical store may be out of sync until repaired"
      );
      return false;
    }
  }

  function syncLegacySavedRunState(input) {
    var history = Array.isArray(input.history) ? input.history : null;
    var savedRunIds = input.savedRunIds;
    var runId = input.runId;
    var legacyRow = input.legacyRow;

    if (!history) {
      throw new Error("waywordSavedRunPersistence.syncLegacySavedRunState: history array is required");
    }
    if (!savedRunIds || typeof savedRunIds.add !== "function") {
      throw new Error("waywordSavedRunPersistence.syncLegacySavedRunState: savedRunIds set is required");
    }

    var previousHistoryLength = history.length;
    var hadRunId = savedRunIds.has(runId);

    history.push(Object.assign({}, legacyRow));
    savedRunIds.add(runId);

    if (
      input.inactivityEaseRunKey &&
      window.waywordStorage &&
      typeof window.waywordStorage.removeInactivityEaseRun === "function"
    ) {
      window.waywordStorage.removeInactivityEaseRun(input.inactivityEaseRunKey);
    }

    if (typeof input.persist === "function") {
      try {
        input.persist();
        return true;
      } catch (persistErr) {
        console.error("wayword: legacy saved-run persist failed", persistErr);
        if (input.rollbackOnPersistFailure) {
          history.splice(previousHistoryLength);
          if (!hadRunId) savedRunIds.delete(runId);
        }
        return false;
      }
    }

    console.warn("wayword: legacy saved-run persist callback missing");
    if (input.rollbackOnPersistFailure) {
      history.splice(previousHistoryLength);
      if (!hadRunId) savedRunIds.delete(runId);
    }
    return false;
  }

  function markRetentionEvent(methodName, payload) {
    try {
      if (
        window.waywordRetentionEvents &&
        typeof window.waywordRetentionEvents[methodName] === "function"
      ) {
        window.waywordRetentionEvents[methodName](payload || {});
      }
    } catch (_) {
      /* ignore */
    }
  }

  /**
   * Canonical-first saved-run persistence seam. Normative contract: `docs/SAVED_RUNS_PERSISTENCE.md`.
   * Order is intentionally explicit:
   * 1. Assemble canonical document.
   * 2. Project canonical document to the legacy history row when possible.
   * 3. Attempt canonical repository upsert before any legacy sync.
   * 4. Sync legacy history + run ids + localStorage compatibility state.
   */
  function persistSuccessfulSavedRun(input) {
    var fallbackRun = input && input.run ? input.run : {};
    var canonicalDoc = assembleCanonicalDocument(input && input.canonicalSaveInput);
    var legacyRow = projectLegacyHistoryRow(canonicalDoc, fallbackRun);
    var canonicalPersisted = upsertCanonicalDocument(canonicalDoc);

    var legacyPersisted = syncLegacySavedRunState({
      history: input && input.history,
      savedRunIds: input && input.savedRunIds,
      runId: String(fallbackRun.runId || ""),
      legacyRow: legacyRow,
      inactivityEaseRunKey: input && input.inactivityEaseRunKey,
      persist: input && input.persist,
      rollbackOnPersistFailure: !canonicalPersisted,
    });
    var locallyDurable = Boolean(canonicalPersisted || legacyPersisted);

    if (!locallyDurable) {
      console.error("wayword: saved run was not durably written to local storage; skipping remote sync");
      markRetentionEvent("markAlphaError", {
        area: "save",
        reason: "local_durability_failed",
      });
      return {
        canonicalDoc: canonicalDoc,
        legacyRow: legacyRow,
        canonicalPersisted: canonicalPersisted,
        legacyPersisted: legacyPersisted,
        locallyDurable: false,
      };
    }

    // Track 3 start: best-effort authenticated persistence path.
    // Local continuity remains canonical fallback if this fails or is unavailable.
    try {
      if (
        window.waywordPersistenceRuntime &&
        typeof window.waywordPersistenceRuntime.syncSavedRun === "function"
      ) {
        Promise.resolve(window.waywordPersistenceRuntime.syncSavedRun(fallbackRun))
          .then(function (syncResult) {
            var synced = Boolean(syncResult && syncResult.ok);
            var reason = syncResult && syncResult.reason ? String(syncResult.reason) : "";
            var noSession = reason === "no_authenticated_session" || reason === "supabase_not_configured";
            markRetentionEvent("markRunSaved", {
              sync_status: synced
                ? "server_synced"
                : noSession
                  ? "local_only_no_session"
                  : "local_only_sync_failed",
              is_authenticated: synced || !noSession,
            });
            if (!synced && !noSession) {
              markRetentionEvent("markAlphaError", {
                area: "sync",
                reason: reason || "sync_failed",
              });
            }
            markRetentionEvent("markMeaningfulSessionCompleted");
            if (!synced) {
              console.warn("wayword: persistence runtime sync failed; local continuity remains authoritative", syncResult);
            }
          })
          .catch(function (err) {
            markRetentionEvent("markRunSaved", {
              sync_status: "local_only_sync_failed",
              is_authenticated: true,
            });
            markRetentionEvent("markAlphaError", {
              area: "sync",
              reason: "sync_exception",
            });
            markRetentionEvent("markMeaningfulSessionCompleted");
            console.warn("wayword: persistence runtime sync failed; local continuity remains authoritative", err);
          });
      } else {
        markRetentionEvent("markRunSaved", {
          sync_status: "local_only_no_session",
          is_authenticated: false,
        });
        markRetentionEvent("markMeaningfulSessionCompleted");
      }
    } catch (persistSyncErr) {
      markRetentionEvent("markRunSaved", {
        sync_status: "local_only_sync_failed",
        is_authenticated: true,
      });
      markRetentionEvent("markAlphaError", {
        area: "sync",
        reason: "sync_exception",
      });
      markRetentionEvent("markMeaningfulSessionCompleted");
      console.warn("wayword: persistence runtime sync threw synchronously; local continuity remains authoritative", persistSyncErr);
    }

    return {
      canonicalDoc: canonicalDoc,
      legacyRow: legacyRow,
      canonicalPersisted: canonicalPersisted,
      legacyPersisted: legacyPersisted,
      locallyDurable: locallyDurable,
    };
  }

  window.waywordSavedRunPersistence = {
    persistSuccessfulSavedRun: persistSuccessfulSavedRun,
    syncLegacySavedRunState: syncLegacySavedRunState,
  };
})();

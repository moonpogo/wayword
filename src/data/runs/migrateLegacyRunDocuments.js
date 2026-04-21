(function () {
  /** Keys read when hydrating the canonical store from legacy persistence (never deleted here). */
  var LEGACY_RUN_STORAGE_KEYS_READ = ["wayword-history"];

  /**
   * Read-only migration from legacy `wayword-history` rows into the canonical document store.
   * Does not read or remove other legacy keys; leaves `wayword-history` untouched.
   *
   * @param {Object} repo Repository from `createLocalStorageRunDocumentRepository`
   * @returns {{ merged: number, skipped: number }}
   */
  function mergeLegacyHistoryMissingIntoCanonicalStore(repo) {
    if (!repo || typeof repo.upsertFromLegacyRun !== "function" || typeof repo.listDocumentsParsed !== "function") {
      return { merged: 0, skipped: 0 };
    }
    if (!window.waywordStorage || typeof window.waywordStorage.loadHistory !== "function") {
      return { merged: 0, skipped: 0 };
    }
    var hist = window.waywordStorage.loadHistory();
    if (!Array.isArray(hist)) return { merged: 0, skipped: 0 };

    var parsed = repo.listDocumentsParsed();
    var have = Object.create(null);
    for (var i = 0; i < parsed.length; i++) {
      if (parsed[i] && parsed[i].runId) have[String(parsed[i].runId)] = true;
    }

    var merged = 0;
    var skipped = 0;
    for (var j = 0; j < hist.length; j++) {
      var row = hist[j];
      if (!row || !row.runId) continue;
      var rid = String(row.runId);
      if (have[rid]) {
        skipped++;
        continue;
      }
      repo.upsertFromLegacyRun(row);
      have[rid] = true;
      merged++;
    }
    return { merged: merged, skipped: skipped };
  }

  window.waywordRunMigration = {
    LEGACY_RUN_STORAGE_KEYS_READ: LEGACY_RUN_STORAGE_KEYS_READ,
    mergeLegacyHistoryMissingIntoCanonicalStore: mergeLegacyHistoryMissingIntoCanonicalStore,
  };
})();

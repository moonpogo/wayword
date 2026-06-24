(function () {
  /**
   * Single read path for saved runs from `waywordRunDocumentRepo` for UI and analysis.
   * Normative contract: `docs/SAVED_RUNS_PERSISTENCE.md`.
   *
   * Ordering (equivalent to legacy `state.history` usage):
   * - **Chronological** = oldest → newest, same as array index order in `state.history` (push order,
   *   and matches `history.slice().sort((a,b) => savedAt ascending)` used in progression).
   * - **Newest-first** = same as `state.history.slice().reverse()` used by Review runs drawer/rail.
   *
   * Canonical rows are preferred; missing legacy rows are merged by `runId` so canonical write
   * failures do not hide a locally saved run in the same session.
   */

  function listParsedOrEmpty() {
    var repo = window.waywordRunDocumentRepo;
    if (!repo || typeof repo.listDocumentsParsed !== "function") return [];
    try {
      return repo.listDocumentsParsed();
    } catch (_) {
      return [];
    }
  }

  function toFiniteTimestamp(run) {
    var savedAt = run && run.savedAt;
    if (typeof savedAt === "number" && Number.isFinite(savedAt) && savedAt > 0) return savedAt;
    var timestamp = run && run.timestamp;
    if (typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp > 0) return timestamp;
    return NaN;
  }

  function normalizeStableRuns(inputRows) {
    var rows = Array.isArray(inputRows) ? inputRows : [];
    var entries = [];
    for (var i = 0; i < rows.length; i += 1) {
      var run = rows[i];
      var runId = String(run && run.runId ? run.runId : "").trim();
      if (!runId) continue;
      var ts = toFiniteTimestamp(run);
      if (!Number.isFinite(ts)) continue;
      entries.push({ run: run, runId: runId, ts: ts, index: i });
    }

    // Keep exactly one canonical row per run id. Winner is the newest timestamp;
    // if tied, keep the later record in storage order for deterministic behavior.
    var winners = Object.create(null);
    for (var j = 0; j < entries.length; j += 1) {
      var entry = entries[j];
      var existing = winners[entry.runId];
      if (!existing) {
        winners[entry.runId] = entry;
        continue;
      }
      if (entry.ts > existing.ts || (entry.ts === existing.ts && entry.index > existing.index)) {
        winners[entry.runId] = entry;
      }
    }

    var deduped = Object.keys(winners).map(function (id) {
      return winners[id];
    });
    deduped.sort(function (a, b) {
      if (a.ts !== b.ts) return a.ts - b.ts;
      return a.index - b.index;
    });
    return deduped.map(function (entry) {
      return entry.run;
    });
  }

  function normalizeStableCanonicalRuns(docs) {
    return normalizeStableRuns(docs);
  }

  function readLegacyHistoryRowsOrEmpty() {
    try {
      var raw = localStorage.getItem("wayword-history");
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  /**
   * @param {Record<string, unknown>} doc
   * @returns {Record<string, unknown>}
   */
  function toLegacyHistoryRow(doc) {
    if (!doc || typeof doc !== "object") return {};
    var row = Object.assign({}, doc);
    if (row.text == null || row.text === "") {
      if (row.body != null) row.text = String(row.body);
    }
    return row;
  }

  function listMergedSavedRunsChronological() {
    var canonicalRows = normalizeStableCanonicalRuns(listParsedOrEmpty()).map(toLegacyHistoryRow);
    var seenCanonicalIds = Object.create(null);
    for (var i = 0; i < canonicalRows.length; i += 1) {
      var canonicalId = String(canonicalRows[i] && canonicalRows[i].runId ? canonicalRows[i].runId : "").trim();
      if (canonicalId) seenCanonicalIds[canonicalId] = true;
    }

    var legacyRows = readLegacyHistoryRowsOrEmpty();
    var missingLegacyRows = [];
    for (var j = 0; j < legacyRows.length; j += 1) {
      var legacy = legacyRows[j];
      var legacyId = String(legacy && legacy.runId ? legacy.runId : "").trim();
      if (!legacyId || seenCanonicalIds[legacyId]) continue;
      missingLegacyRows.push(toLegacyHistoryRow(legacy));
    }

    return normalizeStableRuns(canonicalRows.concat(missingLegacyRows)).map(toLegacyHistoryRow);
  }

  /**
   * Oldest → newest (chronological). Use for progression, digests walk order, firstSessionEntry baselines, aggregates.
   * @returns {Record<string, unknown>[]}
   */
  function listSavedRunsChronological() {
    var U = window.waywordRunDocumentUtils;
    var docs = listMergedSavedRunsChronological();
    if (U && typeof U.sortRunsNewestFirst === "function") {
      var newestFirst = U.sortRunsNewestFirst(docs);
      return newestFirst.slice().reverse();
    }
    docs.sort(function (a, b) {
      var ta = typeof a.savedAt === "number" ? a.savedAt : typeof a.timestamp === "number" ? a.timestamp : 0;
      var tb = typeof b.savedAt === "number" ? b.savedAt : typeof b.timestamp === "number" ? b.timestamp : 0;
      return ta - tb;
    });
    return docs;
  }

  /**
   * Newest → oldest. Use for drawer/rail lists and recent mirror family keys (walk from newest).
   * @returns {Record<string, unknown>[]}
   */
  function listSavedRunsNewestFirst() {
    var U = window.waywordRunDocumentUtils;
    var docs = listMergedSavedRunsChronological();
    if (U && typeof U.sortRunsNewestFirst === "function") {
      return U.sortRunsNewestFirst(docs);
    }
    docs.sort(function (a, b) {
      var ta = typeof a.savedAt === "number" ? a.savedAt : typeof a.timestamp === "number" ? a.timestamp : 0;
      var tb = typeof b.savedAt === "number" ? b.savedAt : typeof b.timestamp === "number" ? b.timestamp : 0;
      return tb - ta;
    });
    return docs;
  }

  window.waywordSavedRunsRead = {
    listSavedRunsChronological: listSavedRunsChronological,
    listSavedRunsNewestFirst: listSavedRunsNewestFirst,
    toLegacyHistoryRow: toLegacyHistoryRow,
  };
})();

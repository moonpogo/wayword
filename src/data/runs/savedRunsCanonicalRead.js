(function () {
  /**
   * Single read path for saved runs from `waywordRunDocumentRepo` for UI and analysis.
   *
   * Ordering (equivalent to legacy `state.history` usage):
   * - **Chronological** = oldest → newest, same as array index order in `state.history` (push order,
   *   and matches `history.slice().sort((a,b) => savedAt ascending)` used in progression).
   * - **Newest-first** = same as `state.history.slice().reverse()` used by Review runs drawer/rail.
   *
   * Rows are adapted to the legacy history shape (`text` populated from `body`) so existing
   * renderers and mirror helpers stay unchanged.
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

  /**
   * Oldest → newest (chronological). Use for progression, digests walk order, calibration baselines, aggregates.
   * @returns {Record<string, unknown>[]}
   */
  function listSavedRunsChronological() {
    var U = window.waywordRunDocumentUtils;
    var docs = listParsedOrEmpty().slice();
    if (U && typeof U.sortRunsNewestFirst === "function") {
      var newestFirst = U.sortRunsNewestFirst(docs);
      return newestFirst.slice().reverse().map(toLegacyHistoryRow);
    }
    docs.sort(function (a, b) {
      var ta = typeof a.savedAt === "number" ? a.savedAt : typeof a.timestamp === "number" ? a.timestamp : 0;
      var tb = typeof b.savedAt === "number" ? b.savedAt : typeof b.timestamp === "number" ? b.timestamp : 0;
      return ta - tb;
    });
    return docs.map(toLegacyHistoryRow);
  }

  /**
   * Newest → oldest. Use for drawer/rail lists and recent mirror family keys (walk from newest).
   * @returns {Record<string, unknown>[]}
   */
  function listSavedRunsNewestFirst() {
    var U = window.waywordRunDocumentUtils;
    var docs = listParsedOrEmpty().slice();
    if (U && typeof U.sortRunsNewestFirst === "function") {
      return U.sortRunsNewestFirst(docs).map(toLegacyHistoryRow);
    }
    docs.sort(function (a, b) {
      var ta = typeof a.savedAt === "number" ? a.savedAt : typeof a.timestamp === "number" ? a.timestamp : 0;
      var tb = typeof b.savedAt === "number" ? b.savedAt : typeof b.timestamp === "number" ? b.timestamp : 0;
      return tb - ta;
    });
    return docs.map(toLegacyHistoryRow);
  }

  window.waywordSavedRunsRead = {
    listSavedRunsChronological: listSavedRunsChronological,
    listSavedRunsNewestFirst: listSavedRunsNewestFirst,
    toLegacyHistoryRow: toLegacyHistoryRow,
  };
})();

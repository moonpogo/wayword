(function () {
  /**
   * @param {unknown} text
   * @returns {string}
   */
  function generateRunId() {
    return "run_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Lightweight word count for body text (whitespace-delimited tokens).
   * Submit-time scoring still uses `analyze()` in the editor; this is for documents and migrations.
   * @param {unknown} text
   * @returns {number}
   */
  function computeWordCount(text) {
    var t = String(text || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }

  /**
   * @param {unknown} text
   * @returns {number}
   */
  function computeCharacterCount(text) {
    return String(text || "").length;
  }

  /**
   * @param {{ savedAt?: number, timestamp?: number }[]} runs
   * @returns {{ savedAt?: number, timestamp?: number }[]}
   */
  function sortRunsNewestFirst(runs) {
    if (!Array.isArray(runs)) return [];
    return runs.slice().sort(function (a, b) {
      var ta = typeof a.savedAt === "number" ? a.savedAt : typeof a.timestamp === "number" ? a.timestamp : 0;
      var tb = typeof b.savedAt === "number" ? b.savedAt : typeof b.timestamp === "number" ? b.timestamp : 0;
      return tb - ta;
    });
  }

  window.waywordRunDocumentUtils = {
    generateRunId: generateRunId,
    computeWordCount: computeWordCount,
    computeCharacterCount: computeCharacterCount,
    sortRunsNewestFirst: sortRunsNewestFirst,
  };
})();

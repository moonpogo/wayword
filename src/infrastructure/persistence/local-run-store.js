(function () {
  function readHistoryRows(storageApi) {
    if (!storageApi || typeof storageApi.loadHistory !== "function") return [];
    try {
      var rows = storageApi.loadHistory();
      return Array.isArray(rows) ? rows : [];
    } catch (_) {
      return [];
    }
  }

  window.waywordLocalRunStore = {
    readHistoryRows: readHistoryRows,
  };
})();

(function () {
  /**
   * Local JSON envelope stored under `WAYWORD_RUN_DOCUMENTS_STORAGE_KEY`.
   * @typedef {Object} RunDocumentStoreEnvelope
   * @property {number} storeEnvelopeVersion
   * @property {string[]} items Markdown documents (`serializeRunDocumentToMarkdown`).
   */

  var STORE_ENVELOPE_VERSION = 1;

  /**
   * @param {Storage} storage
   * @returns {RunDocumentStoreEnvelope}
   */
  function readEnvelope(storage) {
    var key = window.WAYWORD_RUN_DOCUMENTS_STORAGE_KEY;
    var raw = storage.getItem(key);
    if (!raw) return { storeEnvelopeVersion: STORE_ENVELOPE_VERSION, items: [] };
    try {
      var o = JSON.parse(raw);
      if (o && o.storeEnvelopeVersion === STORE_ENVELOPE_VERSION && Array.isArray(o.items)) return o;
    } catch (_) {}
    return { storeEnvelopeVersion: STORE_ENVELOPE_VERSION, items: [] };
  }

  /**
   * @param {Storage} storage
   * @param {RunDocumentStoreEnvelope} env
   */
  function writeEnvelope(storage, env) {
    var key = window.WAYWORD_RUN_DOCUMENTS_STORAGE_KEY;
    storage.setItem(key, JSON.stringify(env));
  }

  /**
   * Run document persistence. Implementations satisfy the same method names for swapping backends later.
   *
   * @param {{ storage?: Storage }} [options]
   */
  function createLocalStorageRunDocumentRepository(options) {
    var storage = options && options.storage ? options.storage : localStorage;

    function listSerializedMarkdown() {
      return readEnvelope(storage).items.slice();
    }

    function listDocumentsParsed() {
      var items = readEnvelope(storage).items;
      var out = [];
      for (var i = 0; i < items.length; i++) {
        try {
          out.push(window.waywordRunDocumentMarkdown.deserializeRunDocumentFromMarkdown(items[i]));
        } catch (_) {}
      }
      return out;
    }

    function getDocumentByRunId(runId) {
      var id = String(runId || "");
      var items = readEnvelope(storage).items;
      for (var i = 0; i < items.length; i++) {
        try {
          var d = window.waywordRunDocumentMarkdown.deserializeRunDocumentFromMarkdown(items[i]);
          if (d.runId === id) return d;
        } catch (_) {}
      }
      return null;
    }

    function upsertDocument(doc) {
      if (!doc || typeof doc !== "object" || !doc.runId) return;
      var md = window.waywordRunDocumentMarkdown.serializeRunDocumentToMarkdown(doc);
      var env = readEnvelope(storage);
      var idx = -1;
      for (var i = 0; i < env.items.length; i++) {
        try {
          var d = window.waywordRunDocumentMarkdown.deserializeRunDocumentFromMarkdown(env.items[i]);
          if (d.runId === doc.runId) {
            idx = i;
            break;
          }
        } catch (_) {}
      }
      if (idx >= 0) env.items[idx] = md;
      else env.items.push(md);
      writeEnvelope(storage, env);
    }

    function upsertFromLegacyRun(run) {
      var doc = window.waywordRunDocumentsModel.createRunDocumentFromLegacyRun(run);
      upsertDocument(doc);
    }

    return {
      listSerializedMarkdown: listSerializedMarkdown,
      listDocumentsParsed: listDocumentsParsed,
      getDocumentByRunId: getDocumentByRunId,
      upsertDocument: upsertDocument,
      upsertFromLegacyRun: upsertFromLegacyRun,
    };
  }

  window.waywordRunDocumentRepository = {
    createLocalStorageRunDocumentRepository: createLocalStorageRunDocumentRepository,
  };
})();

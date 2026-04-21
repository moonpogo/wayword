(function () {
  /**
   * Canonical run document schema version (increment when document shape changes).
   * @type {number}
   */
  var WAYWORD_RUN_DOCUMENT_SCHEMA_VERSION = 1;

  /**
   * localStorage key for the canonical run document store (JSON envelope of markdown blobs).
   */
  var WAYWORD_RUN_DOCUMENTS_STORAGE_KEY = "wayword-run-documents-v1";

  window.WAYWORD_RUN_DOCUMENT_SCHEMA_VERSION = WAYWORD_RUN_DOCUMENT_SCHEMA_VERSION;
  window.WAYWORD_RUN_DOCUMENTS_STORAGE_KEY = WAYWORD_RUN_DOCUMENTS_STORAGE_KEY;
})();

(function () {
  try {
    if (!window.waywordRunDocumentRepository || typeof window.waywordRunDocumentRepository.createLocalStorageRunDocumentRepository !== "function") {
      return;
    }
    var repo = window.waywordRunDocumentRepository.createLocalStorageRunDocumentRepository();
    window.waywordRunDocumentRepo = repo;
    if (window.waywordRunMigration && typeof window.waywordRunMigration.mergeLegacyHistoryMissingIntoCanonicalStore === "function") {
      window.waywordRunMigration.mergeLegacyHistoryMissingIntoCanonicalStore(repo);
    }
  } catch (_) {}
})();

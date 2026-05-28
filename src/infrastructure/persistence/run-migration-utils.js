(function () {
  function safeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeRunFingerprintInput(run) {
    var timestamp = Number(
      run && (
        run.savedAt ||
        run.timestamp ||
        run.local_created_at ||
        Date.parse(run && run.created_at) ||
        0
      )
    );
    var wordCount = Number(run && (run.wordCount || run.word_count || 0));
    var text = safeString(run && (run.originalText || run.text || run.writing_text || ""));
    return {
      timestamp: Number.isFinite(timestamp) ? timestamp : 0,
      wordCount: Number.isFinite(wordCount) ? wordCount : 0,
      text: text,
    };
  }

  function fnv1a32(seed) {
    var s = safeString(seed);
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return ("00000000" + h.toString(16)).slice(-8);
  }

  function buildRunFingerprint(run) {
    var normalized = normalizeRunFingerprintInput(run);
    var minuteBucket = Math.floor(normalized.timestamp / 60000);
    return fnv1a32([minuteBucket, normalized.wordCount, normalized.text].join("|"));
  }

  function localRunId(run) {
    return safeString(run && (run.runId || run.client_run_id || run.id || ""));
  }

  function classifyOverlap(localRun, serverRun) {
    var localFingerprint = buildRunFingerprint(localRun);
    var serverFingerprint = buildRunFingerprint(serverRun);

    var localClientRunId = localRunId(localRun);
    var serverClientRunId = localRunId(serverRun);

    if (localFingerprint && serverFingerprint && localFingerprint === serverFingerprint) {
      return { kind: "duplicate", reason: "fingerprint_match" };
    }

    if (localClientRunId && serverClientRunId && localClientRunId === serverClientRunId) {
      return { kind: "conflict", reason: "client_run_id_collision" };
    }

    return { kind: "distinct", reason: "no_overlap" };
  }

  function makeBatchId() {
    var now = Date.now();
    var salt = Math.floor(Math.random() * 1000000);
    return ["migration", now, salt].join("-");
  }

  window.waywordRunMigrationUtils = {
    buildRunFingerprint: buildRunFingerprint,
    localRunId: localRunId,
    classifyOverlap: classifyOverlap,
    makeBatchId: makeBatchId,
  };
})();

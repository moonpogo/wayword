(function () {
  try {
    if (typeof localStorage !== "undefined") {
      if (localStorage.getItem("wayword-mirror-bonsai-headlines") === "1") {
        globalThis.__WAYWORD_MIRROR_BONSAI_HEADLINES__ = true;
      }
      if (localStorage.getItem("wayword-mirror-refusal-experiment") === "1") {
        globalThis.__WAYWORD_MIRROR_REFUSAL_EXPERIMENT__ = true;
      }
      if (localStorage.getItem("wayword-experimental-the-cut") === "1") {
        globalThis.__WAYWORD_EXPERIMENTAL_THE_CUT__ = true;
      }
    }
  } catch (_) {
    /* ignore */
  }

  function mirrorPipelineAvailable() {
    return Boolean(
      typeof globalThis !== "undefined" &&
        globalThis.WaywordMirror &&
        typeof globalThis.WaywordMirror.runMirrorPipeline === "function"
    );
  }

  function mirrorSessionDigestAvailable() {
    return Boolean(
      typeof globalThis !== "undefined" &&
        globalThis.WaywordMirror &&
        typeof globalThis.WaywordMirror.buildMirrorSessionDigest === "function"
    );
  }

  function mirrorRecentTrendsPipelineAvailable() {
    return Boolean(
      typeof globalThis !== "undefined" &&
        globalThis.WaywordMirror &&
        typeof globalThis.WaywordMirror.runMirrorRecentTrendsPipeline === "function"
    );
  }

  function mirrorPatternsProfileAvailable() {
    return Boolean(
      typeof globalThis !== "undefined" &&
        globalThis.WaywordMirror &&
        typeof globalThis.WaywordMirror.getPatternsProfileFromDigests === "function"
    );
  }

  window.waywordMirrorController = {
    mirrorPipelineAvailable,
    mirrorSessionDigestAvailable,
    mirrorRecentTrendsPipelineAvailable,
    mirrorPatternsProfileAvailable,

    runMirrorPipeline(input) {
      return globalThis.WaywordMirror.runMirrorPipeline(input);
    },

    buildMirrorSessionDigest(input) {
      return globalThis.WaywordMirror.buildMirrorSessionDigest(input);
    },

    computeMirrorPipelineOutcome(text, run, recentReflectionFamilyKeys, calibrationIncomplete) {
      if (!mirrorPipelineAvailable()) {
        return { result: null, loadFailed: true };
      }
      try {
        const payload = {
          text: String(text || ""),
          sessionId: run && run.runId ? String(run.runId) : undefined,
          startedAt: run && typeof run.timestamp === "number" ? run.timestamp : undefined,
          endedAt: Date.now(),
        };
        if (Array.isArray(recentReflectionFamilyKeys) && recentReflectionFamilyKeys.length) {
          payload.recentReflectionFamilyKeys = recentReflectionFamilyKeys;
        }
        if (calibrationIncomplete === true) {
          payload.calibrationIncomplete = true;
        }
        const result = globalThis.WaywordMirror.runMirrorPipeline(payload);
        return { result, loadFailed: false };
      } catch (_) {
        return { result: null, loadFailed: true };
      }
    },

    assignMirrorSessionDigestToRunIfAvailable(run, digestInput) {
      if (!mirrorSessionDigestAvailable()) return;
      try {
        run.mirrorSessionDigest = globalThis.WaywordMirror.buildMirrorSessionDigest(digestInput);
      } catch (_) {
        run.mirrorSessionDigest = undefined;
      }
    },

    getPatternsProfileFromDigests(digests) {
      return globalThis.WaywordMirror.getPatternsProfileFromDigests(digests);
    },

    runMirrorRecentTrendsPipeline(digests) {
      return globalThis.WaywordMirror.runMirrorRecentTrendsPipeline(digests);
    },
  };
})();

(function () {
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

    computeMirrorPipelineOutcome(text, run, recentReflectionFamilyKeys) {
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

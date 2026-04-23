(function () {
  /**
   * Submit-time mirror analysis wiring.
   * Uses the existing mirror pipeline helper, then preserves the submit-path
   * state shape consumed by downstream coordinators and post-run rendering.
   */
  function coordinateSubmitMirrorAnalysis(input) {
    if (!input || typeof input !== "object") {
      throw new Error("waywordSubmitMirrorAnalysis.coordinateSubmitMirrorAnalysis: input is required");
    }
    if (!input.state || typeof input.state !== "object") {
      throw new Error("waywordSubmitMirrorAnalysis.coordinateSubmitMirrorAnalysis: state is required");
    }
    if (typeof input.computeAndStoreMirrorPipelineResult !== "function") {
      throw new Error(
        "waywordSubmitMirrorAnalysis.coordinateSubmitMirrorAnalysis: computeAndStoreMirrorPipelineResult is required"
      );
    }

    input.computeAndStoreMirrorPipelineResult(input.currentText, input.run);
    input.state.mirrorEmptyFallbackSeed = input.run && input.run.runId ? input.run.runId : "";

    return {
      lastMirrorPipelineResult: input.state.lastMirrorPipelineResult,
      lastMirrorLoadFailed: input.state.lastMirrorLoadFailed,
      mirrorEmptyFallbackSeed: input.state.mirrorEmptyFallbackSeed,
    };
  }

  window.waywordSubmitMirrorAnalysis = {
    coordinateSubmitMirrorAnalysis: coordinateSubmitMirrorAnalysis,
  };
})();

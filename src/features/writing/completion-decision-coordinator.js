(function () {
  function decideSubmitCompletion(input) {
    var priorEntries = typeof input.getRecentEntries === "function" ? input.getRecentEntries() : [];

    var runWasSaved = false;
    if (!input.savedRunIds || typeof input.savedRunIds.has !== "function" || !input.savedRunIds.has(input.runId)) {
      runWasSaved = true;
    }

    var completionKind = "unsaved";
    if (runWasSaved) completionKind = "saved";

    return {
      priorEntries: priorEntries,
      runWasSaved: runWasSaved,
      completionKind: completionKind,
    };
  }

  /**
   * Preserves submit ordering around completion classification:
   * 1. Decide saved vs unsaved outcome.
   * 2. Route completion helper state updates.
   * 3. Run mirror submit-side effects.
   * 4. Route saved-run continuation only for successful saved completions.
   */
  function coordinateSubmitCompletion(input) {
    if (!input || typeof input !== "object") {
      throw new Error("waywordCompletionDecisionCoordinator.coordinateSubmitCompletion: input is required");
    }

    var decision = decideSubmitCompletion(input);

    if (typeof input.handleRunCompleted === "function") {
      input.handleRunCompleted(input.currentText, decision.priorEntries, decision.runWasSaved);
    }

    if (typeof input.computeMirrorForSubmit === "function") {
      input.computeMirrorForSubmit(decision);
    }

    if (decision.runWasSaved && typeof input.routeSuccessfulSavedRun === "function") {
      input.routeSuccessfulSavedRun(decision);
    }

    return decision;
  }

  window.waywordCompletionDecisionCoordinator = {
    decideSubmitCompletion: decideSubmitCompletion,
    coordinateSubmitCompletion: coordinateSubmitCompletion,
  };
})();

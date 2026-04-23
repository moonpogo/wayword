(function () {
  function decideSubmitCompletion(input) {
    var priorEntries = typeof input.getRecentEntries === "function" ? input.getRecentEntries() : [];
    var nextCalibrationStep = priorEntries.length + 1;
    var inCalibrationWindow = nextCalibrationStep <= input.calibrationThreshold;
    var signalOkForCalibration =
      !inCalibrationWindow ||
      (typeof input.calibrationSubmissionHasMinimumSignal === "function"
        ? input.calibrationSubmissionHasMinimumSignal(input.currentText, input.analysis)
        : true);

    var runWasSaved = false;
    var insufficientCalibration = false;
    if (!input.savedRunIds || typeof input.savedRunIds.has !== "function" || !input.savedRunIds.has(input.runId)) {
      if (inCalibrationWindow && !signalOkForCalibration) {
        insufficientCalibration = true;
      } else {
        runWasSaved = true;
      }
    }

    var completionKind = "unsaved";
    if (insufficientCalibration) completionKind = "insufficient-calibration";
    else if (runWasSaved) completionKind = "saved";

    return {
      priorEntries: priorEntries,
      nextCalibrationStep: nextCalibrationStep,
      inCalibrationWindow: inCalibrationWindow,
      signalOkForCalibration: signalOkForCalibration,
      runWasSaved: runWasSaved,
      insufficientCalibration: insufficientCalibration,
      completionKind: completionKind,
    };
  }

  /**
   * Preserves the current submit ordering around completion classification:
   * 1. Decide saved vs unsaved vs insufficient-calibration outcome.
   * 2. Route calibration/completion helper state updates.
   * 3. Run mirror submit-side effects.
   * 4. Route saved-run continuation only for successful saved completions.
   */
  function coordinateSubmitCompletion(input) {
    if (!input || typeof input !== "object") {
      throw new Error("waywordCompletionDecisionCoordinator.coordinateSubmitCompletion: input is required");
    }

    var decision = decideSubmitCompletion(input);

    if (typeof input.handleRunCompleted === "function") {
      input.handleRunCompleted(
        input.currentText,
        decision.priorEntries,
        decision.runWasSaved,
        decision.insufficientCalibration
      );
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

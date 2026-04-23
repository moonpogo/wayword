(function () {
  function applyInsufficientCalibrationAftermath(input) {
    input.state.calibrationPostRun = {
      step: Math.min(input.priorEntries.length + 1, input.calibrationThreshold),
      observation: input.calibrationInsufficientCopy,
      insufficient: true
    };
    input.state.lastRunFeedback = "";
  }

  function applySavedRunCalibrationAftermath(input) {
    var step = input.priorEntries.length + 1;
    var observation = String(input.selectCalibrationObservation(input.text, input.priorEntries) || "").trim();
    if (step <= input.calibrationThreshold) {
      input.state.calibrationPostRun = { step: step, observation: observation, insufficient: false };
      input.state.lastRunFeedback = "";
    } else {
      input.state.calibrationPostRun = null;
      input.state.lastRunFeedback = observation;
    }
  }

  function resetCompletionAftermathState(input) {
    input.state.lastRunFeedback = "";
    input.state.calibrationPostRun = null;
  }

  /**
   * Preserves the existing completion aftermath behavior:
   * - insufficient calibration writes the calibration overlay payload and clears feedback
   * - unsaved non-insufficient completions leave state unchanged
   * - saved completions compute calibration observation / post-threshold feedback
   * - any helper failure clears aftermath state as today
   */
  function handleRunCompleted(input) {
    if (!input || typeof input !== "object") {
      throw new Error("waywordCompletionAftermathHelper.handleRunCompleted: input is required");
    }
    try {
      if (input.insufficientCalibration) {
        applyInsufficientCalibrationAftermath(input);
        return;
      }
      if (!input.runWasSaved) return;
      applySavedRunCalibrationAftermath(input);
    } catch (_) {
      resetCompletionAftermathState(input);
    }
  }

  window.waywordCompletionAftermathHelper = {
    handleRunCompleted: handleRunCompleted,
  };
})();

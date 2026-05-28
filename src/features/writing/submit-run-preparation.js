(function () {
  function collectExistingRunIds(input) {
    var ids = new Set();
    if (!input || !input.state) return ids;

    var fromSet = input.state.savedRunIds;
    if (fromSet && typeof fromSet.forEach === "function") {
      fromSet.forEach(function (value) {
        var id = String(value == null ? "" : value).trim();
        if (id) ids.add(id);
      });
    }

    var history = Array.isArray(input.state.history) ? input.state.history : [];
    for (var i = 0; i < history.length; i += 1) {
      var row = history[i];
      var runId = String(row && row.runId ? row.runId : "").trim();
      if (runId) ids.add(runId);
    }

    if (typeof input.readSavedRunsChronological === "function") {
      try {
        var canonicalRuns = input.readSavedRunsChronological();
        if (Array.isArray(canonicalRuns)) {
          for (var j = 0; j < canonicalRuns.length; j += 1) {
            var canonicalRunId = String(
              canonicalRuns[j] && canonicalRuns[j].runId ? canonicalRuns[j].runId : ""
            ).trim();
            if (canonicalRunId) ids.add(canonicalRunId);
          }
        }
      } catch (_) {
        // Keep submit flow resilient when canonical reads are unavailable.
      }
    }
    return ids;
  }

  function buildFallbackRunId(existingIds) {
    var attempts = 0;
    while (attempts < 1000) {
      attempts += 1;
      var candidate =
        "run_" +
        Date.now().toString(36) +
        "_" +
        attempts.toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8);
      if (!existingIds.has(candidate)) return candidate;
    }
    return "run_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 12);
  }

  function generateUniqueRunId(makeRunId, existingIds) {
    if (typeof makeRunId === "function") {
      for (var attempt = 0; attempt < 12; attempt += 1) {
        var raw = makeRunId();
        var candidate = String(raw == null ? "" : raw).trim();
        if (!candidate) continue;
        if (!existingIds.has(candidate)) return candidate;
      }
    }
    return buildFallbackRunId(existingIds);
  }

  /**
   * Submit-time preparation before completion routing:
   * - snapshot timer/challenge state
   * - apply submit-state semantic flags
   * - compute score inputs and success flags
   * - assemble the submitted run object
   */
  function prepareSubmitRun(input) {
    if (!input || typeof input !== "object") {
      throw new Error("waywordSubmitRunPreparation.prepareSubmitRun: input is required");
    }

    var timeRemainingSnapshot =
      input.state.timerSeconds && input.state.timerWaitingForFirstInput
        ? input.state.timerSeconds
        : input.state.timeRemaining;
    var timerConfigured = Boolean(input.state.timerSeconds);
    var activeTimerSecondsForRun = timerConfigured ? input.state.timerSeconds : null;

    var challengeWordsSnapshot = Array.isArray(input.state.exerciseWords) ? input.state.exerciseWords.slice() : [];
    var challengeActive = challengeWordsSnapshot.length > 0;
    input.clearExerciseIfCompleted(input.currentText);
    var challengeCompleted = challengeActive && input.state.exerciseWords.length === 0;

    input.state.submitted = true;
    input.state.completedUiActive = true;
    input.applyWriteDocSemanticFlagsFromAnalysisCore(input.analysis);

    input.updateEnterButtonVisibility();
    input.stopTimer();
    input.completeWordmark();

    var activeTargetWords = input.getActiveTargetWordsForScoring();
    var scoreResult = input.computeRunScoreV1(
      input.analysis,
      input.state.repeatLimit,
      activeTargetWords
    );
    var runScore = scoreResult.runScore;
    var scoreBreakdown = scoreResult.scoreBreakdown;

    var finishedWithinTime = !timerConfigured || !input.fromTimer;
    var wasSuccessful =
      input.analysis.totalWords >= activeTargetWords &&
      runScore >= 70 &&
      finishedWithinTime;

    var now = Date.now();
    var existingIds = collectExistingRunIds(input);
    var runId = generateUniqueRunId(input.makeRunId, existingIds);
    var run = window.waywordRunModel.createSubmittedRun({
      makeRunId: function () {
        return runId;
      },
      now: now,
      currentText: input.currentText,
      prompt: input.prompt,
      analysis: input.analysis,
      runScore: runScore,
      scoreBreakdown: scoreBreakdown,
      challengeActive: challengeActive,
      challengeCompleted: challengeCompleted,
      challengeWordsSnapshot: challengeWordsSnapshot,
      wasSuccessful: wasSuccessful,
      activeTargetWords: activeTargetWords,
      activeTimerSecondsForRun: activeTimerSecondsForRun,
      finishedWithinTime: finishedWithinTime,
      timeRemainingSnapshot: timeRemainingSnapshot,
      timerConfigured: timerConfigured,
      repeatLimitAtRun: input.state.repeatLimit,
    });

    return {
      timeRemainingSnapshot: timeRemainingSnapshot,
      timerConfigured: timerConfigured,
      activeTimerSecondsForRun: activeTimerSecondsForRun,
      challengeWordsSnapshot: challengeWordsSnapshot,
      challengeActive: challengeActive,
      challengeCompleted: challengeCompleted,
      activeTargetWords: activeTargetWords,
      runScore: runScore,
      scoreBreakdown: scoreBreakdown,
      finishedWithinTime: finishedWithinTime,
      wasSuccessful: wasSuccessful,
      now: now,
      run: run,
    };
  }

  window.waywordSubmitRunPreparation = {
    prepareSubmitRun: prepareSubmitRun,
  };
})();

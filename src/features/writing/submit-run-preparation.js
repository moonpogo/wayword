(function () {
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
    var run = window.waywordRunModel.createSubmittedRun({
      makeRunId: input.makeRunId,
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

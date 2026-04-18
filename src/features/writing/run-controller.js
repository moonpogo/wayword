(function () {
  let deps = null;
  let postSubmitAutoRunTimer = null;

  function D() {
    if (!deps) {
      throw new Error("waywordRunController: registerDeps must be called before lifecycle methods");
    }
    return deps;
  }

  function clearPostSubmitAutoRunTimer() {
    if (postSubmitAutoRunTimer != null) {
      clearTimeout(postSubmitAutoRunTimer);
      postSubmitAutoRunTimer = null;
    }
  }

  function runPostSubmitAutoNewRunNow() {
    clearPostSubmitAutoRunTimer();
    document.querySelector(".editor-shell")?.classList.remove("editor-shell--submit-complete");
    if (D().state.optionsOpen) return;
    if (!D().state.submitted || !D().state.completedUiActive) return;
    startWriting({ focusCaret: "start" });
  }

  /** After submit: shell completion pulse only (post-run UI stays until the user begins again). */
  function pulseEditorShellAfterSubmit() {
    clearPostSubmitAutoRunTimer();
    const shell = document.querySelector(".editor-shell");
    shell?.classList.add("editor-shell--submit-complete");

    D().scheduleEditorDotOverlaySync();
    requestAnimationFrame(() => {
      D().scheduleEditorDotOverlaySync();
    });
  }

  function handleRunCompleted(text, priorEntries, runWasSaved, insufficientCalibration = false) {
    const d = D();
    try {
      if (insufficientCalibration) {
        const step = Math.min(priorEntries.length + 1, d.CALIBRATION_THRESHOLD);
        d.state.calibrationPostRun = {
          step,
          observation: d.CALIBRATION_INSUFFICIENT_COPY,
          insufficient: true
        };
        d.state.lastRunFeedback = "";
        return;
      }
      if (!runWasSaved) return;
      const step = priorEntries.length + 1;
      const observation = String(d.selectCalibrationObservation(text, priorEntries) || "").trim();
      if (step <= d.CALIBRATION_THRESHOLD) {
        d.state.calibrationPostRun = { step, observation, insufficient: false };
        d.state.lastRunFeedback = "";
      } else {
        d.state.calibrationPostRun = null;
        d.state.lastRunFeedback = observation;
      }
    } catch (e) {
      const x = D();
      x.state.lastRunFeedback = "";
      x.state.calibrationPostRun = null;
    }
  }

  function restartRunWithCurrentSettings(options = {}) {
    const d = D();
    const keepOptionsPanelOpen = Boolean(options.keepOptionsPanelOpen);
    const reuseCurrentPrompt = Boolean(options.reuseCurrentPrompt);
    if (!d.state.active) return;

    d.state.submitted = false;
    d.state.completedUiActive = false;
    d.state.promptRerollsUsed = 0;
    if (!reuseCurrentPrompt) {
      d.state.prompt = d.generatePrompt();
    }
    d.setEditorText("");
    d.state.startSessionPlaceholder = reuseCurrentPrompt ? "" : d.pickRandomStartPlaceholderLine();

    const fb = d.$("feedbackBox");
    if (fb) {
      fb.dataset.calibrationRenderKey = "";
      fb.className = "result-card empty";
      fb.innerHTML = "";
    }
    d.state.lastRunFeedback = "";
    d.state.lastMirrorPipelineResult = null;
    d.state.lastMirrorLoadFailed = false;
    d.state.calibrationPostRun = null;
    d.waywordPostRunRenderer.renderReflectionLine("");

    d.stopTimer();
    d.state.timerWaitingForFirstInput = Boolean(d.state.timerSeconds);
    if (!keepOptionsPanelOpen) {
      d.setOptionsOpen(false);
    }

    d.renderMeta();
    d.renderWritingState();
    d.renderHighlight();
    d.renderSidebar();
    d.updateEnterButtonVisibility();

    if (!keepOptionsPanelOpen) {
      requestAnimationFrame(() => {
        d.focusEditorToStart();
      });
    }
  }

  function startWriting(options = {}) {
    const d = D();
    const {
      preserveActiveChallenge = false,
      focusCaret = "end",
      deferEditorFocus = false,
    } = options;
    clearPostSubmitAutoRunTimer();
    document.querySelector(".editor-shell")?.classList.remove("editor-shell--submit-complete");
    d.stopTimer();
    if (!preserveActiveChallenge) {
      d.setExerciseWords([]);
    }
    d.state.active = true;
    d.state.submitted = false;
    d.state.completedUiActive = false;
    d.state.promptRerollsUsed = 0;
    d.state.pendingRecentDrawerExpand = false;

    d.$("editorOverlay")?.classList.add("hidden");
    d.$("editorOverlayCard")?.classList.remove("editor-overlay-card--calibration-dismiss");

    d.applyProgressionToState();
    d.state.timerWaitingForFirstInput = Boolean(d.state.timerSeconds);
    d.state.prompt = d.generatePrompt();
    d.setEditorText("");
    d.state.startSessionPlaceholder = d.pickRandomStartPlaceholderLine();
    d.state.mirrorEmptyFallbackSeed = "";

    const fb = d.$("feedbackBox");
    if (fb) {
      fb.dataset.calibrationRenderKey = "";
      fb.className = "result-card empty";
      fb.innerHTML = "";
    }
    d.state.lastRunFeedback = "";
    d.state.lastMirrorPipelineResult = null;
    d.state.lastMirrorLoadFailed = false;
    d.state.calibrationPostRun = null;
    d.waywordPostRunRenderer.renderReflectionLine("");

    d.setBannedEditorOpen(false);
    d.setOptionsOpen(false);
    d.showProfile(false);

    d.renderMeta();
    d.renderWritingState();
    d.renderHighlight();
    d.renderSidebar();
    d.syncEditorBottomChromeForCalibrationOverlay();
    d.updateEnterButtonVisibility();

    if (!deferEditorFocus) {
      d.scheduleDeferredEditorFocus(focusCaret);
    }
  }

  /**
   * Timer reached zero with no words: no run payload to save — still a hard boundary for timed mode.
   * Starts a fresh run so the user cannot keep typing in an expired session.
   */
  function finalizeTimedRunExpiredWithNoText() {
    const d = D();
    if (!d.state.active || d.state.submitted) return;
    d.stopTimer();
    d.state.timeRemaining = 0;
    d.updateTimeFill();
    startWriting({ focusCaret: "start" });
    d.queueViewportSync();
  }

  function submitWriting(fromTimer = false) {
    const d = D();
    if (!d.state.active) return;

    if (d.state.submitted) {
      if (postSubmitAutoRunTimer != null) {
        clearPostSubmitAutoRunTimer();
        document.querySelector(".editor-shell")?.classList.remove("editor-shell--submit-complete");
        runPostSubmitAutoNewRunNow();
      }
      return;
    }

    if (d.editorInput && !d.getEditorSurfaceComposing()) {
      d.flushEditorSurfaceIntoWriteDocOnce();
    }

    const currentText = d.getEditorText();
    const analysis = d.analyze(currentText);

    if (analysis.totalWords === 0) {
      if (fromTimer) {
        finalizeTimedRunExpiredWithNoText();
      }
      return;
    }

    const timeRemainingSnapshot =
      d.state.timerSeconds && d.state.timerWaitingForFirstInput
        ? d.state.timerSeconds
        : d.state.timeRemaining;
    const timerConfigured = Boolean(d.state.timerSeconds);
    const activeTimerSecondsForRun = timerConfigured ? d.state.timerSeconds : null;

    const challengeWordsSnapshot = [...d.state.exerciseWords];
    const challengeActive = challengeWordsSnapshot.length > 0;
    d.clearExerciseIfCompleted(currentText);
    const challengeCompleted = challengeActive && d.state.exerciseWords.length === 0;

    d.state.submitted = true;
    d.state.completedUiActive = true;
    d.applyWriteDocSemanticFlagsFromAnalysisCore(analysis);

    d.updateEnterButtonVisibility();
    d.stopTimer();
    d.completeWordmark();

    const activeTargetWords = d.getActiveTargetWordsForScoring();
    const { runScore, scoreBreakdown } = d.computeRunScoreV1(
      analysis,
      d.state.repeatLimit,
      activeTargetWords
    );

    const finishedWithinTime = !timerConfigured || !fromTimer;
    const wasSuccessful =
      analysis.totalWords >= activeTargetWords &&
      runScore >= 70 &&
      finishedWithinTime;

    const now = Date.now();
    const run = window.waywordRunModel.createSubmittedRun({
      makeRunId: d.makeRunId,
      now,
      currentText,
      prompt: d.state.prompt,
      analysis,
      runScore,
      scoreBreakdown,
      challengeActive,
      challengeCompleted,
      challengeWordsSnapshot,
      wasSuccessful,
      activeTargetWords,
      activeTimerSecondsForRun,
      finishedWithinTime,
      timeRemainingSnapshot,
      timerConfigured,
      repeatLimitAtRun: d.state.repeatLimit,
    });

    const priorEntries = d.getRecentEntries();
    const nextCalibrationStep = priorEntries.length + 1;
    const inCalibrationWindow = nextCalibrationStep <= d.CALIBRATION_THRESHOLD;
    const signalOkForCalibration =
      !inCalibrationWindow || d.calibrationSubmissionHasMinimumSignal(currentText, analysis);

    let runWasSaved = false;
    let insufficientCalibration = false;

    if (!d.state.savedRunIds.has(run.runId)) {
      if (inCalibrationWindow && !signalOkForCalibration) {
        insufficientCalibration = true;
      } else {
        runWasSaved = true;
      }
    }

    handleRunCompleted(currentText, priorEntries, runWasSaved, insufficientCalibration);

    d.computeAndStoreMirrorPipelineResult(currentText, run);
    d.state.mirrorEmptyFallbackSeed = run.runId;

    if (runWasSaved) {
      const main = d.state.lastMirrorPipelineResult && d.state.lastMirrorPipelineResult.main;
      const stmt = main && String(main.statement || "").trim();
      const hadMainReflection = Boolean(stmt);
      const mainCategory = hadMainReflection ? main.category ?? null : null;
      d.state.pendingNudgeLine = d.buildRitualNudgeV1({
        priorPromptFamily: d.state.promptFamily,
        hadMainReflection,
        mainCategory,
        seed: run.runId
      });
      window.waywordRunModel.attachMirrorSnapshotToRun(
        run,
        d.state.lastMirrorPipelineResult,
        d.state.lastMirrorLoadFailed
      );
      window.waywordMirrorController.assignMirrorSessionDigestToRunIfAvailable(run, {
        text: String(currentText || ""),
        sessionId: String(run.runId),
        startedAt: typeof run.timestamp === "number" ? run.timestamp : undefined,
        endedAt: typeof run.savedAt === "number" ? run.savedAt : undefined
      });
      d.state.history.push({ ...run });
      d.state.savedRunIds.add(run.runId);
      d.state.pendingRecentDrawerExpand = true;
      window.waywordStorage.removeInactivityEaseRun(d.INACTIVITY_EASE_RUN_KEY);
      d.persist();
      d.renderHistory();
      d.renderProfileSummaryStrip();

      d.recomputeProgressionLevel({ afterRun: true });
      d.applyProgressionToState();
      d.renderProfile();
    }

    d.renderWritingState({ deferPostRunOverlaySync: false });
    d.renderMeta();
    d.renderSidebar();

    d.queueViewportSync();

    pulseEditorShellAfterSubmit();
  }

  window.waywordRunController = {
    registerDeps(nextDeps) {
      deps = nextDeps;
    },
    clearPostSubmitAutoRunTimer,
    runPostSubmitAutoNewRunNow,
    pulseEditorShellAfterSubmit,
    handleRunCompleted,
    restartRunWithCurrentSettings,
    startWriting,
    finalizeTimedRunExpiredWithNoText,
    submitWriting
  };
})();

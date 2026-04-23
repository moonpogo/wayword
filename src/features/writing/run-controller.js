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
    if (
      window.waywordCompletionAftermathHelper &&
      typeof window.waywordCompletionAftermathHelper.handleRunCompleted === "function"
    ) {
      window.waywordCompletionAftermathHelper.handleRunCompleted({
        state: d.state,
        text,
        priorEntries,
        runWasSaved,
        insufficientCalibration,
        calibrationThreshold: d.CALIBRATION_THRESHOLD,
        calibrationInsufficientCopy: d.CALIBRATION_INSUFFICIENT_COPY,
        selectCalibrationObservation: d.selectCalibrationObservation,
      });
      return;
    }

    console.error("wayword: completion aftermath helper missing; falling back to inline completion aftermath");
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
      d.state.lastRunFeedback = "";
      d.state.calibrationPostRun = null;
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

  function computeMirrorForSubmit(currentText, run) {
    const d = D();
    if (
      window.waywordSubmitMirrorAnalysis &&
      typeof window.waywordSubmitMirrorAnalysis.coordinateSubmitMirrorAnalysis === "function"
    ) {
      return window.waywordSubmitMirrorAnalysis.coordinateSubmitMirrorAnalysis({
        state: d.state,
        currentText,
        run,
        computeAndStoreMirrorPipelineResult: d.computeAndStoreMirrorPipelineResult,
      });
    }

    console.error("wayword: submit mirror analysis helper missing; falling back to inline submit mirror coordination");
    d.computeAndStoreMirrorPipelineResult(currentText, run);
    d.state.mirrorEmptyFallbackSeed = run.runId;
    return {
      lastMirrorPipelineResult: d.state.lastMirrorPipelineResult,
      lastMirrorLoadFailed: d.state.lastMirrorLoadFailed,
      mirrorEmptyFallbackSeed: d.state.mirrorEmptyFallbackSeed,
    };
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

    let timeRemainingSnapshot;
    let timerConfigured;
    let activeTimerSecondsForRun;
    let challengeWordsSnapshot;
    let challengeActive;
    let challengeCompleted;
    let activeTargetWords;
    let runScore;
    let scoreBreakdown;
    let finishedWithinTime;
    let wasSuccessful;
    let run;

    if (
      window.waywordSubmitRunPreparation &&
      typeof window.waywordSubmitRunPreparation.prepareSubmitRun === "function"
    ) {
      ({
        timeRemainingSnapshot,
        timerConfigured,
        activeTimerSecondsForRun,
        challengeWordsSnapshot,
        challengeActive,
        challengeCompleted,
        activeTargetWords,
        runScore,
        scoreBreakdown,
        finishedWithinTime,
        wasSuccessful,
        run,
      } = window.waywordSubmitRunPreparation.prepareSubmitRun({
        state: d.state,
        currentText,
        prompt: d.state.prompt,
        analysis,
        fromTimer,
        makeRunId: d.makeRunId,
        clearExerciseIfCompleted: d.clearExerciseIfCompleted,
        applyWriteDocSemanticFlagsFromAnalysisCore: d.applyWriteDocSemanticFlagsFromAnalysisCore,
        updateEnterButtonVisibility: d.updateEnterButtonVisibility,
        stopTimer: d.stopTimer,
        completeWordmark: d.completeWordmark,
        getActiveTargetWordsForScoring: d.getActiveTargetWordsForScoring,
        computeRunScoreV1: d.computeRunScoreV1,
      }));
    } else {
      console.error("wayword: submit run preparation helper missing; falling back to inline submit preparation");
      timeRemainingSnapshot =
        d.state.timerSeconds && d.state.timerWaitingForFirstInput
          ? d.state.timerSeconds
          : d.state.timeRemaining;
      timerConfigured = Boolean(d.state.timerSeconds);
      activeTimerSecondsForRun = timerConfigured ? d.state.timerSeconds : null;

      challengeWordsSnapshot = [...d.state.exerciseWords];
      challengeActive = challengeWordsSnapshot.length > 0;
      d.clearExerciseIfCompleted(currentText);
      challengeCompleted = challengeActive && d.state.exerciseWords.length === 0;

      d.state.submitted = true;
      d.state.completedUiActive = true;
      d.applyWriteDocSemanticFlagsFromAnalysisCore(analysis);

      d.updateEnterButtonVisibility();
      d.stopTimer();
      d.completeWordmark();

      activeTargetWords = d.getActiveTargetWordsForScoring();
      ({ runScore, scoreBreakdown } = d.computeRunScoreV1(
        analysis,
        d.state.repeatLimit,
        activeTargetWords
      ));

      finishedWithinTime = !timerConfigured || !fromTimer;
      wasSuccessful =
        analysis.totalWords >= activeTargetWords &&
        runScore >= 70 &&
        finishedWithinTime;

      run = window.waywordRunModel.createSubmittedRun({
        makeRunId: d.makeRunId,
        now: Date.now(),
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
    }

    if (
      window.waywordCompletionDecisionCoordinator &&
      typeof window.waywordCompletionDecisionCoordinator.coordinateSubmitCompletion === "function"
    ) {
      window.waywordCompletionDecisionCoordinator.coordinateSubmitCompletion({
        getRecentEntries: d.getRecentEntries,
        calibrationThreshold: d.CALIBRATION_THRESHOLD,
        calibrationSubmissionHasMinimumSignal: d.calibrationSubmissionHasMinimumSignal,
        savedRunIds: d.state.savedRunIds,
        runId: run.runId,
        currentText: currentText,
        analysis: analysis,
        handleRunCompleted: handleRunCompleted,
        computeMirrorForSubmit() {
          computeMirrorForSubmit(currentText, run);
        },
        routeSuccessfulSavedRun() {
          if (
            window.waywordSuccessfulSubmitCoordinator &&
            typeof window.waywordSuccessfulSubmitCoordinator.coordinateSuccessfulSavedRunSubmit === "function"
          ) {
            window.waywordSuccessfulSubmitCoordinator.coordinateSuccessfulSavedRunSubmit({
              state: d.state,
              run: run,
              currentText: currentText,
              canonicalSaveInput: {
                runId: run.runId,
                savedAt: run.savedAt,
                timestamp: run.timestamp,
                body: currentText,
                prompt: d.state.prompt,
                analysis: analysis,
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
                repeatLimitAtRun: d.state.repeatLimit,
                mirrorLoadFailed: Boolean(run.mirrorLoadFailed),
                mirrorPipelineResult: run.mirrorPipelineResult,
                mirrorSessionDigest: run.mirrorSessionDigest,
              },
              inactivityEaseRunKey: d.INACTIVITY_EASE_RUN_KEY,
              persist: d.persist,
              renderHistory: d.renderHistory,
              renderProfileSummaryStrip: d.renderProfileSummaryStrip,
              recomputeProgressionLevel: d.recomputeProgressionLevel,
              applyProgressionToState: d.applyProgressionToState,
              renderProfile: d.renderProfile,
            });
          } else {
            console.error("wayword: successful submit coordinator missing; falling back to inline submit success flow");
            d.state.pendingNudgeLine = "What stands out in the draft you just wrote?";
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
            window.waywordStorage.removeInactivityEaseRun(d.INACTIVITY_EASE_RUN_KEY);
            d.persist();
            d.state.pendingRecentDrawerExpand = true;
            d.renderHistory();
            d.renderProfileSummaryStrip();
            d.recomputeProgressionLevel({ afterRun: true });
            d.applyProgressionToState();
            d.renderProfile();
          }
        },
      });
    } else {
      console.error("wayword: completion decision coordinator missing; falling back to inline completion routing");
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
      computeMirrorForSubmit(currentText, run);

      if (runWasSaved) {
        if (
          window.waywordSuccessfulSubmitCoordinator &&
          typeof window.waywordSuccessfulSubmitCoordinator.coordinateSuccessfulSavedRunSubmit === "function"
        ) {
          window.waywordSuccessfulSubmitCoordinator.coordinateSuccessfulSavedRunSubmit({
            state: d.state,
            run: run,
            currentText: currentText,
            canonicalSaveInput: {
              runId: run.runId,
              savedAt: run.savedAt,
              timestamp: run.timestamp,
              body: currentText,
              prompt: d.state.prompt,
              analysis: analysis,
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
              repeatLimitAtRun: d.state.repeatLimit,
              mirrorLoadFailed: Boolean(run.mirrorLoadFailed),
              mirrorPipelineResult: run.mirrorPipelineResult,
              mirrorSessionDigest: run.mirrorSessionDigest,
            },
            inactivityEaseRunKey: d.INACTIVITY_EASE_RUN_KEY,
            persist: d.persist,
            renderHistory: d.renderHistory,
            renderProfileSummaryStrip: d.renderProfileSummaryStrip,
            recomputeProgressionLevel: d.recomputeProgressionLevel,
            applyProgressionToState: d.applyProgressionToState,
            renderProfile: d.renderProfile,
          });
        } else {
          console.error("wayword: successful submit coordinator missing; falling back to inline submit success flow");
          d.state.pendingNudgeLine = "What stands out in the draft you just wrote?";
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
          window.waywordStorage.removeInactivityEaseRun(d.INACTIVITY_EASE_RUN_KEY);
          d.persist();
          d.state.pendingRecentDrawerExpand = true;
          d.renderHistory();
          d.renderProfileSummaryStrip();
          d.recomputeProgressionLevel({ afterRun: true });
          d.applyProgressionToState();
          d.renderProfile();
        }
      }
    }

    if (
      window.waywordPostSubmitUiReconciler &&
      typeof window.waywordPostSubmitUiReconciler.reconcilePostSubmitUi === "function"
    ) {
      window.waywordPostSubmitUiReconciler.reconcilePostSubmitUi({
        renderWritingState: d.renderWritingState,
        renderMeta: d.renderMeta,
        renderSidebar: d.renderSidebar,
        queueViewportSync: d.queueViewportSync,
        pulseEditorShellAfterSubmit: pulseEditorShellAfterSubmit,
      });
    } else {
      console.error("wayword: post-submit UI reconciler missing; falling back to inline post-submit UI updates");
      d.renderWritingState({ deferPostRunOverlaySync: false });
      d.renderMeta();
      d.renderSidebar();
      d.queueViewportSync();
      pulseEditorShellAfterSubmit();
    }
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

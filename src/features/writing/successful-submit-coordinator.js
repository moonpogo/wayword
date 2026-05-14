(function () {
  function resolvePromptLayerFromFamily(family) {
    var value = String(family == null ? "" : family).trim().toLowerCase();
    if (value === "entry" || value === "torsion" || value === "resonance") return value;
    return "unknown";
  }

  function resolvePromptSystemMode() {
    var helper = window.waywordPromptSystemMode;
    if (!helper || typeof helper.resolvePromptSystemMode !== "function") return "v0";
    try {
      return helper.resolvePromptSystemMode({
        location: window.location,
        localStorage: window.localStorage,
      });
    } catch (_) {
      return "v0";
    }
  }

  function persistStrataSummaryForSuccessfulRun(input) {
    var strata = window.waywordStrataEngine;
    if (!strata || typeof strata.persistStrataRunSummary !== "function") return false;
    if (resolvePromptSystemMode() !== "v1") return false;

    var promptId = String(input.state && input.state.promptId ? input.state.promptId : "").trim();
    var promptLayer = resolvePromptLayerFromFamily(input.state && input.state.promptFamily);
    if (!promptId || promptLayer === "unknown") return false;

    var run = input.run || {};
    var completedAt =
      typeof run.savedAt === "number" && Number.isFinite(run.savedAt) ? run.savedAt : Date.now();
    var startedAt = Number(input.state && input.state.runStartedAtMs);
    var duration =
      Number.isFinite(startedAt) && startedAt > 0 ? Math.max(0, completedAt - startedAt) : 0;

    var summary = strata.createStrataRunSummary({
      id: run.runId,
      completedAt: completedAt,
      promptLayer: promptLayer,
      promptId: promptId,
      text: String(input.currentText || ""),
      wordsWritten: Number(input.run && input.run.wordCount),
      sentenceCount: strata.countSentences(input.currentText),
      timeToFirstTokenMs: 0,
      totalSessionDurationMs: duration,
      postStartPauseCount: 0,
      abandoned: false,
      completed: true,
    });

    try {
      strata.persistStrataRunSummary(summary, { storage: window.localStorage });
      return true;
    } catch (_) {
      return false;
    }
  }

  function computePendingNudgeLine(input) {
    var mirror = globalThis.WaywordMirror;
    var currentText = String(input.currentText || "");
    var fallbackLine =
      mirror && mirror.MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION != null
        ? String(mirror.MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION)
        : "What stands out on the page in this draft?";
    var nudgeLowSig =
      typeof window.waywordPostRunRenderer?.computeMirrorAttentionalNudgeLowSignal === "function"
        ? window.waywordPostRunRenderer.computeMirrorAttentionalNudgeLowSignal(
            currentText,
            input.lastMirrorPipelineResult,
            input.lastMirrorLoadFailed
          )
        : false;
    var submissionWordCount =
      mirror && typeof mirror.tokenizeText === "function"
        ? mirror.tokenizeText(currentText).length
        : currentText
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;

    if (mirror && typeof mirror.nextPassInstructionFromMirrorPipelineResult === "function") {
      var line = mirror.nextPassInstructionFromMirrorPipelineResult(
        input.lastMirrorPipelineResult,
        input.lastMirrorLoadFailed,
        {
          promptFamily: input.promptFamily,
          lowSignal: nudgeLowSig,
          seed: input.runId,
          submissionWordCount: submissionWordCount,
        }
      );
      return String(line || "").trim() || fallbackLine;
    }

    return fallbackLine;
  }

  function attachMirrorArtifactsToRun(input) {
    window.waywordRunModel.attachMirrorSnapshotToRun(
      input.run,
      input.lastMirrorPipelineResult,
      input.lastMirrorLoadFailed
    );
    window.waywordMirrorController.assignMirrorSessionDigestToRunIfAvailable(input.run, {
      text: String(input.currentText || ""),
      sessionId: String(input.run.runId),
      startedAt: typeof input.run.timestamp === "number" ? input.run.timestamp : undefined,
      endedAt: typeof input.run.savedAt === "number" ? input.run.savedAt : undefined
    });
  }

  function persistSuccessfulSavedRun(input) {
    if (
      window.waywordSavedRunPersistence &&
      typeof window.waywordSavedRunPersistence.persistSuccessfulSavedRun === "function"
    ) {
      return window.waywordSavedRunPersistence.persistSuccessfulSavedRun({
        run: input.run,
        canonicalSaveInput: input.canonicalSaveInput,
        history: input.state.history,
        savedRunIds: input.state.savedRunIds,
        inactivityEaseRunKey: input.inactivityEaseRunKey,
        persist: input.persist,
      });
    }

    console.error("wayword: saved run persistence helper missing; falling back to legacy-only sync");
    if (
      window.waywordSavedRunPersistence &&
      typeof window.waywordSavedRunPersistence.syncLegacySavedRunState === "function"
    ) {
      window.waywordSavedRunPersistence.syncLegacySavedRunState({
        history: input.state.history,
        savedRunIds: input.state.savedRunIds,
        runId: String(input.run.runId || ""),
        legacyRow: { ...input.run },
        inactivityEaseRunKey: input.inactivityEaseRunKey,
        persist: input.persist,
      });
    } else {
      input.state.history.push({ ...input.run });
      input.state.savedRunIds.add(input.run.runId);
      window.waywordStorage.removeInactivityEaseRun(input.inactivityEaseRunKey);
      input.persist();
    }
    return {
      canonicalDoc: null,
      legacyRow: { ...input.run },
      canonicalPersisted: false,
      legacyPersisted: true,
    };
  }

  function coordinateSuccessfulSavedRunSubmit(input) {
    var decision = input.completionDecision;
    var threshold = Number(input.calibrationThreshold) || 0;
    var priorLen =
      decision && Array.isArray(decision.priorEntries) ? decision.priorEntries.length : 0;
    var acked =
      typeof input.readCalibrationHandoffAcknowledged === "function"
        ? input.readCalibrationHandoffAcknowledged()
        : true;
    var showHandoff =
      Boolean(decision && decision.runWasSaved) &&
      threshold > 0 &&
      priorLen + 1 === threshold &&
      !acked;

    if (showHandoff) {
      input.state.pendingNudgeLine = "";
    } else {
      input.state.pendingNudgeLine = computePendingNudgeLine({
        currentText: input.currentText,
        lastMirrorPipelineResult: input.state.lastMirrorPipelineResult,
        lastMirrorLoadFailed: input.state.lastMirrorLoadFailed,
        promptFamily: input.state.promptFamily,
        runId: input.run.runId,
      });
    }

    attachMirrorArtifactsToRun({
      run: input.run,
      currentText: input.currentText,
      lastMirrorPipelineResult: input.state.lastMirrorPipelineResult,
      lastMirrorLoadFailed: input.state.lastMirrorLoadFailed,
    });

    var persistenceResult = persistSuccessfulSavedRun(input);
    persistStrataSummaryForSuccessfulRun(input);

    input.state.pendingRecentDrawerExpand = true;
    input.renderHistory();
    input.renderProfileSummaryStrip();

    input.recomputeProgressionLevel({ afterRun: true });
    input.applyProgressionToState();
    input.renderProfile();

    return persistenceResult;
  }

  window.waywordSuccessfulSubmitCoordinator = {
    coordinateSuccessfulSavedRunSubmit: coordinateSuccessfulSavedRunSubmit,
    persistStrataSummaryForSuccessfulRun: persistStrataSummaryForSuccessfulRun,
  };
})();

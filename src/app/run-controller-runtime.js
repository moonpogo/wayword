(function () {
  function buildRunControllerDeps(input) {
    return {
      state: input.state,
      $: input.$,
      editorInput: input.editorInput,
      getEditorSurfaceComposing: input.getEditorSurfaceComposing,
      flushEditorSurfaceIntoWriteDocOnce: input.flushEditorSurfaceIntoWriteDocOnce,
      getEditorText: input.getEditorText,
      analyze: input.analyze,
      getRecentEntries: input.getRecentEntries,
      makeRunId: input.makeRunId,
      persist: input.persist,
      CALIBRATION_THRESHOLD: input.CALIBRATION_THRESHOLD,
      CALIBRATION_INSUFFICIENT_COPY: input.CALIBRATION_INSUFFICIENT_COPY,
      INACTIVITY_EASE_RUN_KEY: input.INACTIVITY_EASE_RUN_KEY,
      selectCalibrationObservation: input.selectCalibrationObservation,
      calibrationSubmissionHasMinimumSignal: input.calibrationSubmissionHasMinimumSignal,
      clearExerciseIfCompleted: input.clearExerciseIfCompleted,
      applyWriteDocSemanticFlagsFromAnalysisCore: input.applyWriteDocSemanticFlagsFromAnalysisCore,
      updateEnterButtonVisibility: input.updateEnterButtonVisibility,
      stopTimer: input.stopTimer,
      completeWordmark: input.completeWordmark,
      getActiveTargetWordsForScoring: input.getActiveTargetWordsForScoring,
      computeRunScoreV1: input.computeRunScoreV1,
      computeAndStoreMirrorPipelineResult: input.computeAndStoreMirrorPipelineResult,
      recomputeProgressionLevel: input.recomputeProgressionLevel,
      applyProgressionToState: input.applyProgressionToState,
      renderHistory: input.renderHistory,
      renderProfileSummaryStrip: input.renderProfileSummaryStrip,
      renderProfile: input.renderProfile,
      renderHighlight: input.renderHighlight,
      renderWritingState: input.renderWritingState,
      renderMeta: input.renderMeta,
      renderSidebar: input.renderSidebar,
      queueViewportSync: input.queueViewportSync,
      setExerciseWords: input.setExerciseWords,
      generatePrompt: input.generatePrompt,
      setEditorText: input.setEditorText,
      setBannedEditorOpen: input.setBannedEditorOpen,
      setOptionsOpen: input.setOptionsOpen,
      showProfile: input.showProfile,
      scheduleDeferredEditorFocus: input.scheduleDeferredEditorFocus,
      scheduleEditorDotOverlaySync: input.scheduleEditorDotOverlaySync,
      syncEditorBottomChromeForCalibrationOverlay: input.syncEditorBottomChromeForCalibrationOverlay,
      focusEditorToStart: input.focusEditorToStart,
      updateTimeFill: input.updateTimeFill,
      waywordPostRunRenderer: input.waywordPostRunRenderer,
      requestMirrorReflectionAttentionSettle: input.requestMirrorReflectionAttentionSettle
    };
  }

  function registerRunControllerDeps(controller, input) {
    if (!controller || typeof controller.registerDeps !== "function") {
      throw new Error("waywordRunControllerRuntime: controller.registerDeps is required");
    }
    const deps = buildRunControllerDeps(input);
    controller.registerDeps(deps);
    return deps;
  }

  window.waywordRunControllerRuntime = {
    buildRunControllerDeps: buildRunControllerDeps,
    registerRunControllerDeps: registerRunControllerDeps
  };
})();

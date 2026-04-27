(function () {
  /**
   * Central mutable app state — initial shape only. Mutations remain in script.js.
   * `banned` is seeded from `bannedSets[0]` in script.js (same timing as before).
   * @param {string[]} initialBanned
   */
  function buildInitialState(initialBanned) {
    const bannedSource = Array.isArray(initialBanned) ? initialBanned : [];
    return {
      active: false,
      submitted: false,
      targetWords: 60,
      repeatLimit: 2,
      timerSeconds: 0,
      timeRemaining: 0,
      /** True until first meaningful edit arms `startTimer()`; focus alone does not start the countdown. */
      timerWaitingForFirstInput: false,
      timerId: null,
      progressionLevel: 1,
      banned: [...bannedSource],
      prompt: "",
      promptId: "",
      promptFamily: "",
      lastPromptKey: "",
      recentPromptIds: [],
      /** Calibration-only prompt ids (never mixed into `recentPromptIds` for the main library). */
      recentCalibrationPromptIds: [],
      recentFamilyKeys: [],
      /** Shown under the prompt for the full next active run; replaced only after the next saved run. */
      pendingNudgeLine: "",
      /** Family-level bias only; set in `generatePrompt`. */
      promptBiasTags: [],
      /** Seeds rotating mirror empty copy for the last submit’s panel. */
      mirrorEmptyFallbackSeed: "",
      theme: window.waywordStorage.loadTheme(),
      history: window.waywordStorage.loadHistory(),
      savedRunIds: window.waywordStorage.loadSavedRunIdsSet(),
      exerciseWords: [],
      patternSelectedWords: [],
      completedChallenges: window.waywordStorage.loadCompletedChallengesSet(),
      bannedEditorOpen: false,
      optionsOpen: false,
      promptRerollsUsed: 0,
      pendingRecentDrawerExpand: false,
      /** Review runs: when true, drawer + rail show full history (drawer uses tall scrollable layout). */
      recentRunsHistoryExpanded: false,
      writeDoc: { lines: [{ tokens: [], trailingSpace: false }] },
      lastRunFeedback: "",
      /** Last `runMirrorPipeline` result after submit; cleared on new run. */
      lastMirrorPipelineResult: null,
      /** True when the mirror bundle failed to load or threw during the last submit. */
      lastMirrorLoadFailed: false,
      /** After a saved run, set when step 1–5; observation lives here (not on reflection line). Cleared on new run. */
      calibrationPostRun: null,
      /** True only for the post-submit surface after the saved run that reaches the calibration threshold (if not yet acknowledged). */
      calibrationHandoffVisible: false,
      /** Last submit was a short calibration draft; post-run mirror uses micro-reflection copy instead of low-signal rejection. Cleared on new run. */
      lastSubmitCalibrationShortMirror: false,
      completedUiActive: false,
      /** Mobile writing field: when true, surrounding header/context is revealed (still in the same focus habitat). */
      isExpandedField: false
    };
  }

  window.waywordAppState = {
    state: null,
    /**
     * One-shot from script.js after `bannedSets` exists. Assigns `this.state` and returns the same object.
     * @param {string[]} initialBanned
     */
    initState(initialBanned) {
      const s = buildInitialState(initialBanned);
      this.state = s;
      return s;
    }
  };
})();

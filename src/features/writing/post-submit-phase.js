(function () {
  var PHASES = Object.freeze({
    IDLE: "idle",
    DRAFTING: "drafting",
    SUBMITTED_MIRROR_LOW_SIGNAL: "submitted_mirror_low_signal",
    SUBMITTED_MIRROR_READY: "submitted_mirror_ready",
    SUBMITTED_MIRROR_UNAVAILABLE: "submitted_mirror_unavailable",
  });

  function mirrorResultHasLowSignalMain(result) {
    return Boolean(
      result &&
        typeof result === "object" &&
        result.main &&
        typeof result.main === "object" &&
        result.main.category === "low_signal"
    );
  }

  function isSubmittedPhase(phase) {
    return (
      phase === PHASES.SUBMITTED_MIRROR_LOW_SIGNAL ||
      phase === PHASES.SUBMITTED_MIRROR_READY ||
      phase === PHASES.SUBMITTED_MIRROR_UNAVAILABLE
    );
  }

  function phaseBlocksCompletedRestart(phase) {
    return false;
  }

  function phaseAllowsCompletedRestart(phase) {
    return isSubmittedPhase(phase) && !phaseBlocksCompletedRestart(phase);
  }

  function postRunRenderFlagsFromPhase(phase) {
    return {
      firstSessionEntryHandoffVisible: false,
      firstSessionEntryBaselinePostSubmit: false,
    };
  }

  /**
   * Read-only post-submit phase derivation.
   * Does not own state, routing, rendering, persistence, or restart behavior.
   *
   * @param {{
   *   state?: {
   *     active?: boolean,
   *     submitted?: boolean,
   *     completedUiActive?: boolean,
   *     lastMirrorLoadFailed?: boolean,
   *     lastMirrorPipelineResult?: unknown
   *   },
   *   mirrorLowSignal?: boolean
   * }} input
   * @returns {string}
   */
  function derivePostSubmitPhase(input) {
    var state = input && input.state && typeof input.state === "object" ? input.state : {};

    if (!state.active) return PHASES.IDLE;
    if (!state.submitted || !state.completedUiActive) return PHASES.DRAFTING;

    if (state.lastMirrorLoadFailed) {
      return PHASES.SUBMITTED_MIRROR_UNAVAILABLE;
    }

    if (
      Boolean(input && input.mirrorLowSignal) ||
      mirrorResultHasLowSignalMain(state.lastMirrorPipelineResult)
    ) {
      return PHASES.SUBMITTED_MIRROR_LOW_SIGNAL;
    }

    return PHASES.SUBMITTED_MIRROR_READY;
  }

  window.waywordPostSubmitPhase = {
    PHASES: PHASES,
    derivePostSubmitPhase: derivePostSubmitPhase,
    phaseAllowsCompletedRestart: phaseAllowsCompletedRestart,
    phaseBlocksCompletedRestart: phaseBlocksCompletedRestart,
    postRunRenderFlagsFromPhase: postRunRenderFlagsFromPhase,
  };
})();

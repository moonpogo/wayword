(function () {
  function resetCompletionAftermathState(input) {
    input.state.lastRunFeedback = "";
  }

  /**
   * Preserves completion aftermath behavior:
   * - unsaved completions leave state unchanged
   * - saved completions clear deferred feedback payloads
   * - any helper failure clears aftermath state
   */
  function handleRunCompleted(input) {
    if (!input || typeof input !== "object") {
      throw new Error("waywordCompletionAftermathHelper.handleRunCompleted: input is required");
    }
    try {
      if (!input.runWasSaved) return;
      resetCompletionAftermathState(input);
    } catch (_) {
      resetCompletionAftermathState(input);
    }
  }

  window.waywordCompletionAftermathHelper = {
    handleRunCompleted: handleRunCompleted,
  };
})();

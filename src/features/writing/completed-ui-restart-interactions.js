(function () {
  function currentPhase(input) {
    return window.waywordPostSubmitPhase.derivePostSubmitPhase({ state: input.state });
  }

  function restartBlockedByPhase(input) {
    return window.waywordPostSubmitPhase.phaseBlocksCompletedRestart(currentPhase(input));
  }

  function restartAllowedByPhase(input) {
    return window.waywordPostSubmitPhase.phaseAllowsCompletedRestart(currentPhase(input));
  }

  function handleEditorCompletedRestartKeydown(input, e) {
    if (restartBlockedByPhase(input)) return false;
    if (input.state.optionsOpen || !restartAllowedByPhase(input)) {
      return false;
    }

    var enterBegin = e.key === "Enter" && !e.shiftKey;
    var typingKey =
      (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) ||
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === " ";

    if (enterBegin) {
      e.preventDefault();
      input.runPostSubmitAutoNewRunNow();
      return true;
    }

    if (typingKey) {
      e.preventDefault();
      return true;
    }

    return false;
  }

  function handleEditorSurfaceCompletedRestart(input, e) {
    if (restartBlockedByPhase(input)) return false;
    if (
      input.state.active &&
      restartAllowedByPhase(input) &&
      !input.state.optionsOpen &&
      e.target.closest("#editorInput")
    ) {
      input.runPostSubmitAutoNewRunNow();
      return true;
    }

    return false;
  }

  function handleDocumentCompletedRestartKeydown(input, e) {
    if (restartBlockedByPhase(input)) return false;
    if (
      e.key !== "Enter" ||
      !restartAllowedByPhase(input) ||
      e.shiftKey ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey
    ) {
      return false;
    }

    if (input.state.optionsOpen) return false;
    if (e.target && e.target.closest && e.target.closest("#editorInput")) {
      return false;
    }

    var target = e.target;
    var editable =
      target &&
      (target.closest("input,textarea,select,[contenteditable='true']") ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT");

    if (editable) return false;

    e.preventDefault();
    input.runPostSubmitAutoNewRunNow();
    return true;
  }

  window.waywordCompletedUiRestartInteractions = {
    handleEditorCompletedRestartKeydown: handleEditorCompletedRestartKeydown,
    handleEditorSurfaceCompletedRestart: handleEditorSurfaceCompletedRestart,
    handleDocumentCompletedRestartKeydown: handleDocumentCompletedRestartKeydown
  };
})();

(function () {
  function handleEditorCompletedRestartKeydown(input, e) {
    if (input.state.optionsOpen || !input.state.submitted || !input.state.completedUiActive) {
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
    if (
      input.state.active &&
      input.state.submitted &&
      input.state.completedUiActive &&
      !input.state.optionsOpen &&
      e.target.closest("#editorInput")
    ) {
      input.runPostSubmitAutoNewRunNow();
      return true;
    }

    return false;
  }

  function handleDocumentCompletedRestartKeydown(input, e) {
    if (
      e.key !== "Enter" ||
      !input.state.submitted ||
      !input.state.completedUiActive ||
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

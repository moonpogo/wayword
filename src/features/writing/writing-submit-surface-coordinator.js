(function () {
  function hasSubmittableText(input) {
    return String(input.getEditorText() || "").trim().length > 0;
  }

  function updateEnterButtonVisibility(input) {
    var btn = input.$("enterSubmitBtn");
    if (!btn || !input.editorInput) return;

    var canShow = Boolean(input.state.active && !input.state.submitted);
    btn.classList.toggle("hidden", !(hasSubmittableText(input) && canShow));
  }

  function updateSubmitButtonState(input) {
    updateEnterButtonVisibility(input);
  }

  window.waywordWritingSubmitSurfaceCoordinator = {
    updateEnterButtonVisibility: updateEnterButtonVisibility,
    updateSubmitButtonState: updateSubmitButtonState
  };
})();

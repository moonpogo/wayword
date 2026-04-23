(function () {
  function syncEditorEmptyState(editorInput, text) {
    if (!editorInput) return;
    editorInput.classList.toggle("is-empty", !String(text || "").trim());
  }

  function applyEditorWritingState(input) {
    if (!input || !input.editorInput) return;

    var isLocked = !input.state.active || input.state.submitted;
    input.editorInput.setAttribute("contenteditable", isLocked ? "false" : "true");
    input.editorInput.setAttribute("data-placeholder", "");
    syncEditorEmptyState(input.editorInput, input.getEditorText());
  }

  window.waywordEditorStatePresentation = {
    syncEditorEmptyState: syncEditorEmptyState,
    applyEditorWritingState: applyEditorWritingState
  };
})();

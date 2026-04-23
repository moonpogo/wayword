(function () {
  function afterOptionsPanelClosed(input) {
    if (!input.isMobileViewport()) return;
    if (!document.body.classList.contains("focus-mode")) return;
    if (!input.state.active || input.state.submitted || !input.editorInput) return;
    if (input.state.optionsOpen) return;
    if (document.activeElement === input.editorInput) return;
    input.focusEditorToEnd();
  }

  window.waywordEditorFocusRecovery = {
    afterOptionsPanelClosed: afterOptionsPanelClosed
  };
})();

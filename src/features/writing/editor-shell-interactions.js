(function () {
  function isBlockedEditorShellTarget(target) {
    return Boolean(
      target.closest("#optionsTrigger") ||
        target.closest(".editor-progress") ||
        target.closest("#editorOptionsPanel") ||
        target.closest("#editorOptionsBackdrop") ||
        target.closest("#enterSubmitBtn") ||
        target.closest("#editorOverlay") ||
        target.closest("#editorSemanticPicker") ||
        target.closest("#recentWritingTrigger") ||
        target.closest("#recentDrawer") ||
        target.closest("#recentDrawerBackdrop")
    );
  }

  function bindEditorShellInteractions(input) {
    if (!input || !input.editorShell) return;
    if (input.editorShell.dataset.editorShellInteractionBound === "1") return;
    input.editorShell.dataset.editorShellInteractionBound = "1";

    input.editorShell.addEventListener("pointerdown", function (e) {
      if (e.target.closest("#editorInput")) {
        input.resetAnnotationRowPendingEditorSel();
      }

      if (isBlockedEditorShellTarget(e.target)) return;

      if (
        input.handleEditorSurfaceCompletedRestart &&
        input.handleEditorSurfaceCompletedRestart(e)
      ) {
        return;
      }

      if (!input.isActiveAndEditable()) return;
      if (e.target.closest("#editorInput")) return;

      requestAnimationFrame(function () {
        input.focusEditorToEnd();
      });
    });
  }

  window.waywordEditorShellInteractions = {
    bindEditorShellInteractions: bindEditorShellInteractions
  };
})();

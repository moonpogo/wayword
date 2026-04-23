(function () {
  function saveBannedInline(input) {
    var field = input.$("bannedInlineInput");
    if (!field) return;

    input.state.banned = String(field.value || "")
      .split(",")
      .map(input.normalizeWord)
      .filter(Boolean);

    input.setBannedEditorOpen(false);

    if (input.state.active && !input.state.submitted) {
      input.applyWriteDocSemanticFlagsFromAnalysis();
      input.scheduleEditorDotOverlaySync();
      input.renderAnnotationRow();
    }

    input.renderMeta();
    input.renderHighlight();
    input.renderSidebar();
  }

  window.waywordInlineBannedEditorSaveCoordinator = {
    saveBannedInline: saveBannedInline
  };
})();

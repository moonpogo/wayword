(function () {
  function cycleRepeatLimit(input) {
    var next = input.state.repeatLimit >= 4 ? 1 : input.state.repeatLimit + 1;
    input.state.repeatLimit = next;

    if (input.state.active && !input.state.submitted) {
      input.applyWriteDocSemanticFlagsFromAnalysis();
      input.scheduleEditorDotOverlaySync();
      input.renderAnnotationRow();
    }

    input.renderMeta();
    input.renderHighlight();
    input.renderSidebar();
  }

  window.waywordWritingRepeatLimitCoordinator = {
    cycleRepeatLimit: cycleRepeatLimit
  };
})();

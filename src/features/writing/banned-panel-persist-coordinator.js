(function () {
  function flushBannedPanelPersistFromPanel(input) {
    if (input.bannedPanelPersistTimerRef.value != null) {
      clearTimeout(input.bannedPanelPersistTimerRef.value);
      input.bannedPanelPersistTimerRef.value = null;
    }

    var field = input.$("bannedInlineInputPanel");
    if (!field) return;

    var next = input.bannedWordsListFromPanelFieldValue(field.value);
    if (input.bannedListsShallowEqual(next, input.state.banned)) return;

    input.state.banned = next;
    if (input.state.active && !input.state.submitted) {
      input.applyWriteDocSemanticFlagsFromAnalysis();
      input.scheduleEditorDotOverlaySync();
      input.renderAnnotationRow();
    }

    input.renderMeta();
    input.renderHighlight();
    input.renderSidebar();
  }

  function scheduleBannedPanelPersistFromPanel(input) {
    if (input.bannedPanelPersistTimerRef.value != null) {
      clearTimeout(input.bannedPanelPersistTimerRef.value);
    }

    input.bannedPanelPersistTimerRef.value = window.setTimeout(function () {
      input.bannedPanelPersistTimerRef.value = null;
      flushBannedPanelPersistFromPanel(input);
    }, input.debounceMs);
  }

  window.waywordBannedPanelPersistCoordinator = {
    flushBannedPanelPersistFromPanel: flushBannedPanelPersistFromPanel,
    scheduleBannedPanelPersistFromPanel: scheduleBannedPanelPersistFromPanel
  };
})();

(function () {
  function setOptionsOpen(open, input) {
    if (!input || typeof input.$ !== "function") return;

    var nextOpen = Boolean(open);
    var wasOpen = Boolean(input.state && input.state.optionsOpen);
    input.state.optionsOpen = nextOpen;

    var panel = input.$("editorOptionsPanel");
    var backdrop = input.$("editorOptionsBackdrop");
    if (!panel) return;

    input.applyBodySettingsOpenClass(nextOpen);

    if (nextOpen) {
      input.setOptionsPanelDismissGuardUntil(Date.now() + input.optionsPanelDismissGuardMs);
      input.clearBannedPanelPersistTimer();

      input.syncWordModesPanel();
      input.syncTimeModesPanel();

      var bannedInput = input.$("bannedInlineInputPanel");
      if (bannedInput && document.activeElement !== bannedInput) {
        bannedInput.value = input.getBannedPanelValue();
      }

      requestAnimationFrame(function () {
        var livePanel = input.$("editorOptionsPanel");
        if (!livePanel || !input.state.optionsOpen) return;
        var lockWidth = Math.round(livePanel.getBoundingClientRect().width);
        if (lockWidth > 0) {
          livePanel.style.width = String(lockWidth) + "px";
          livePanel.style.maxWidth = String(lockWidth) + "px";
        }
      });
    } else {
      input.setOptionsPanelDismissGuardUntil(0);
      input.flushBannedPanelPersistFromPanel();
      panel.style.removeProperty("width");
      panel.style.removeProperty("max-width");
    }

    input.applyEditorOptionsPanelAriaAndBackdrop({
      open: nextOpen,
      panel: panel,
      backdrop: backdrop
    });

    if (!nextOpen && wasOpen) {
      requestAnimationFrame(function () {
        input.afterOptionsPanelClosed();
      });
    }
  }

  window.waywordOptionsPanelTransitionCoordinator = {
    setOptionsOpen: setOptionsOpen
  };
})();

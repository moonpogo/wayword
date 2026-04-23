(function () {
  function exitFocusModeForLayoutIfNeeded(input) {
    if (!input.isMobileViewport()) return false;
    if (!document.body.classList.contains("focus-mode")) return false;
    document.documentElement.classList.add("focus-mode-layout-snap");
    input.syncViewportHeightVar();
    input.syncKeyboardOpenClass();
    document.body.classList.remove("keyboard-open");
    document.body.classList.remove("focus-mode");
    document.body.classList.remove("expanded-field");
    input.state.isExpandedField = false;
    input.armPostFocusExitKeyboardLayoutSettle();
    input.resetWordmarkChromeMotionState();
    return true;
  }

  function setFocusMode(enabled, input) {
    input.logPatternsTransitionSnapshot("setFocusMode:before", { enabled: enabled });
    var shouldEnable = Boolean(enabled) && input.isMobileViewport();

    if (shouldEnable) {
      input.setSuppressKeyboardOpenTruthUntil(0);
      document.documentElement.classList.remove("focus-mode-layout-snap");
      input.resetWordmarkChromeMotionState();
      document.body.classList.add("focus-mode");
      input.setRecentDrawerOpen(false);
      input.renderProfileSummaryStrip();
      input.syncExpandedFieldClass();
      input.renderPostRunReflectionLine();
      input.queueViewportSync();
      input.logPatternsTransitionSnapshot("setFocusMode:after-enable");
      return;
    }

    if (!input.isMobileViewport()) {
      document.body.classList.remove("focus-mode");
      document.body.classList.remove("expanded-field");
      input.state.isExpandedField = false;
      input.renderProfileSummaryStrip();
      input.logPatternsTransitionSnapshot("setFocusMode:after-disable-desktop");
      return;
    }

    exitFocusModeForLayoutIfNeeded(input);
    input.renderProfileSummaryStrip();
    input.queueViewportSync();
    input.logPatternsTransitionSnapshot("setFocusMode:after-disable-mobile");
  }

  window.waywordFocusModeTransitionCoordinator = {
    exitFocusModeForLayoutIfNeeded: exitFocusModeForLayoutIfNeeded,
    setFocusMode: setFocusMode
  };
})();

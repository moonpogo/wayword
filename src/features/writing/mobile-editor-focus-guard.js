(function () {
  function isFocusExitSafeTarget(target) {
    return Boolean(
      target &&
        typeof target.closest === "function" &&
        (target.closest("#optionsTrigger") ||
          target.closest("#editorOptionsPanel") ||
          target.closest("#editorOptionsBackdrop") ||
          target.closest("#enterSubmitBtn") ||
          target.closest("#recentWritingTrigger") ||
          target.closest("#recentDrawer") ||
          target.closest("#recentDrawerBackdrop") ||
          target.closest("#recentRailExpandedBackdrop") ||
          target.closest("#recentDrawerCloseBtn") ||
          target.closest("#recentRailExpandedCloseBtn") ||
          target.closest("#recentDrawerList") ||
          target.closest("#styleTab") ||
          target.closest("#profileView") ||
          target.closest("#fieldExpandedToggle") ||
          target.closest("#promptRerollBtn"))
    );
  }

  function handleEditorBlur(input, e) {
    if (input.state.submitted && input.state.completedUiActive) {
      input.hideEditorSemanticPicker();
      return;
    }
    if (input.state.optionsOpen) {
      input.hideEditorSemanticPicker();
      return;
    }

    if (isFocusExitSafeTarget(e.relatedTarget)) {
      input.queueViewportSync();
      input.hideEditorSemanticPicker();
      return;
    }

    window.setTimeout(function () {
      if (input.state.optionsOpen) {
        input.hideEditorSemanticPicker();
        return;
      }
      if (isFocusExitSafeTarget(document.activeElement)) {
        input.queueViewportSync();
        input.hideEditorSemanticPicker();
        return;
      }
      if (document.body.classList.contains("recent-drawer-open")) {
        input.queueViewportSync();
        input.hideEditorSemanticPicker();
        return;
      }
      if (
        performance.now() < input.getSuppressFocusExitUntil() ||
        input.isMobilePatternsVisible()
      ) {
        input.queueViewportSync();
        input.hideEditorSemanticPicker();
        return;
      }
      input.syncViewportHeightVar();
      input.syncKeyboardOpenClass();
      input.setFocusMode(false);
      input.hideEditorSemanticPicker();
    }, 0);
  }

  function handleDocumentPointerDown(input, e) {
    if (!input.editorInput) return;
    if (!input.isMobileViewport()) return;
    if (!document.body.classList.contains("focus-mode")) return;
    if (document.activeElement !== input.editorInput) return;

    var target = e.target;
    var interactiveControl = target.closest(
      "button,a,input,textarea,select,[role='button']"
    );
    if (interactiveControl) return;

    var insideEditor = target.closest(".editor-shell");
    var insideOptions =
      target.closest("#editorOptionsPanel") ||
      target.closest("#optionsTrigger") ||
      target.closest("#editorOptionsBackdrop");
    var insideRecent =
      target.closest("#recentDrawer") || target.closest("#recentDrawerBackdrop");
    var insideBelowEditorStack = target.closest(".below-editor-stack");

    if (
      insideEditor ||
      insideOptions ||
      insideRecent ||
      insideBelowEditorStack ||
      target.closest("#fieldExpandedToggle") ||
      target.closest("#promptRerollBtn")
    ) {
      return;
    }

    input.editorInput.blur();
  }

  window.waywordMobileEditorFocusGuard = {
    handleEditorBlur: handleEditorBlur,
    handleDocumentPointerDown: handleDocumentPointerDown
  };
})();

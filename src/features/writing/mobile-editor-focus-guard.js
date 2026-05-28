(function () {
  function asElement(target) {
    return target && target.nodeType === 1 ? target : null;
  }

  function isFocusExitSafeTarget(target) {
    var el = asElement(target);
    return Boolean(
      el &&
        (el.closest("#optionsTrigger") ||
          el.closest("#editorOptionsPanel") ||
          el.closest("#editorOptionsBackdrop") ||
          el.closest("#enterSubmitBtn") ||
          el.closest("#recentWritingTrigger") ||
          el.closest("#recentDrawer") ||
          el.closest("#recentDrawerBackdrop") ||
          el.closest("#recentRailExpandedBackdrop") ||
          el.closest("#recentDrawerCloseBtn") ||
          el.closest("#recentRailExpandedCloseBtn") ||
          el.closest("#recentDrawerList") ||
          el.closest("#styleTab") ||
          el.closest("#profileView") ||
          el.closest("#fieldExpandedToggle") ||
          el.closest("#promptRerollBtn"))
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

    var target = asElement(e.target);
    if (!target) return;
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

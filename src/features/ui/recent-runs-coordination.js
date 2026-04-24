(function () {
  function createCoordinator(input) {
    var suppressRecentTriggerClickOpen = false;

    function transitionDeps() {
      return {
        $: input.$,
        state: input.state,
        editorInput: input.editorInput,
        isMobileViewport: input.isMobileViewport,
        isDesktopPatternsViewport: input.isDesktopPatternsViewport,
        RECENT_DRAWER_DISMISS_GUARD_MS: input.recentDrawerDismissGuardMs,
        setRecentDrawerDismissGuardUntil: input.setRecentDrawerDismissGuardUntil,
        setSuppressFocusExitUntil: input.setSuppressFocusExitUntil,
        setFocusMode: input.setFocusMode,
        renderHistory: input.renderHistory,
        hideMetricExplainer: input.hideMetricExplainer,
        queueViewportSync: input.queueViewportSync,
        applyRecentDrawerDomState: input.applyRecentDrawerDomState,
      };
    }

    function isRecentDrawerOpen() {
      return input.transition.isRecentDrawerOpen();
    }

    function syncRecentRailExpandedChrome() {
      input.transition.syncRecentRailExpandedChrome(transitionDeps());
    }

    function syncRecentRailExpandedLayoutMetrics(options) {
      input.transition.syncRecentRailExpandedLayoutMetrics(options || {}, transitionDeps());
    }

    function setRecentDrawerOpen(open, options) {
      input.transition.setRecentDrawerOpen(open, options || {}, transitionDeps());
    }

    function bindRecentRunsSurfaceInteractions(list) {
      if (
        !input.interaction ||
        typeof input.interaction.bindRecentRunsSurfaceInteractions !== "function"
      ) {
        return;
      }
      input.interaction.bindRecentRunsSurfaceInteractions({
        list: list,
        domEventTargetElement: input.domEventTargetElement,
      });
    }

    function bindRecentRunsExpandDismissUi() {
      input.transition.bindRecentRunsExpandDismissUi({
        $: input.$,
        state: input.state,
        renderHistory: input.renderHistory,
      });
    }

    function tryHandleEscapeForRecentRunsSurfaces() {
      return input.transition.tryHandleEscapeForRecentRunsSurfaces(transitionDeps());
    }

    function bindRecentRunsOpenCloseControls() {
      var trigger = input.$("recentWritingTrigger");
      if (trigger && trigger.dataset.recentRunsOpenCloseBound !== "1") {
        trigger.dataset.recentRunsOpenCloseBound = "1";
        trigger.addEventListener(
          "pointerdown",
          function (e) {
            suppressRecentTriggerClickOpen = false;
            if (isRecentDrawerOpen()) return;
            e.preventDefault();
            e.stopPropagation();
            setRecentDrawerOpen(true);
            suppressRecentTriggerClickOpen = true;
          },
          true
        );

        trigger.addEventListener("click", function (e) {
          if (suppressRecentTriggerClickOpen) {
            suppressRecentTriggerClickOpen = false;
            return;
          }
          e.stopPropagation();
          setRecentDrawerOpen(true);
        });
      }

      var closeBtn = input.$("recentDrawerCloseBtn");
      if (closeBtn && closeBtn.dataset.recentRunsOpenCloseBound !== "1") {
        closeBtn.dataset.recentRunsOpenCloseBound = "1";
        closeBtn.addEventListener("click", function () {
          setRecentDrawerOpen(false);
        });
      }

      var backdrop = input.$("recentDrawerBackdrop");
      if (backdrop && backdrop.dataset.recentRunsOpenCloseBound !== "1") {
        backdrop.dataset.recentRunsOpenCloseBound = "1";
        backdrop.addEventListener("click", function () {
          if (Date.now() < input.getRecentDrawerDismissGuardUntil()) return;
          setRecentDrawerOpen(false);
        });
      }
    }

    return {
      bindRecentRunsExpandDismissUi: bindRecentRunsExpandDismissUi,
      bindRecentRunsOpenCloseControls: bindRecentRunsOpenCloseControls,
      bindRecentRunsSurfaceInteractions: bindRecentRunsSurfaceInteractions,
      isRecentDrawerOpen: isRecentDrawerOpen,
      setRecentDrawerOpen: setRecentDrawerOpen,
      syncRecentRailExpandedChrome: syncRecentRailExpandedChrome,
      syncRecentRailExpandedLayoutMetrics: syncRecentRailExpandedLayoutMetrics,
      tryHandleEscapeForRecentRunsSurfaces: tryHandleEscapeForRecentRunsSurfaces,
    };
  }

  window.waywordRecentRunsUiCoordination = {
    createCoordinator: createCoordinator,
  };
})();

(function () {
  var viewportSyncRaf = null;
  var viewportSyncCoalescePending = false;
  var lastDesktopPatternsViewport = null;

  function handlePatternsViewportCrossing(input) {
    var isDesktopPatternsViewport = Boolean(input.isDesktopPatternsViewport());

    if (lastDesktopPatternsViewport === null) {
      lastDesktopPatternsViewport = isDesktopPatternsViewport;
      return;
    }

    var crossedIntoNarrowPatternsViewport =
      lastDesktopPatternsViewport && !isDesktopPatternsViewport;
    lastDesktopPatternsViewport = isDesktopPatternsViewport;

    if (!crossedIntoNarrowPatternsViewport) return;
    if (typeof input.isProfileVisible !== "function" || !input.isProfileVisible()) return;
    if (typeof input.showProfile !== "function") return;

    input.showProfile(false);
  }

  function queueViewportSync(input) {
    input.logPatternsTransitionSnapshot("queueViewportSync:requested", {
      alreadyQueued: viewportSyncRaf !== null
    });

    if (viewportSyncRaf !== null) {
      viewportSyncCoalescePending = true;
      return;
    }

    viewportSyncRaf = requestAnimationFrame(function () {
      input.logPatternsTransitionSnapshot("queueViewportSync:raf-start");
      viewportSyncRaf = null;
      try {
        input.syncViewportHeightVar();
        input.syncKeyboardOpenClass();
        input.syncEditorShellChamferEdge();
        input.syncEditorCalibrationOverlayClip();
        if (!input.isMobileViewport()) {
          input.setFocusMode(false);
        }
        handlePatternsViewportCrossing(input);
        input.syncPatternsLayoutMode();
        input.renderHistory();
        requestAnimationFrame(function () {
          input.syncRecentRailExpandedLayoutMetrics();
        });
        input.syncSubmittedAnnotatedEditorSurfaces();
        if (typeof input.flushEditorDotOverlaySync === "function") {
          input.flushEditorDotOverlaySync();
        } else {
          input.scheduleEditorDotOverlaySync();
        }
        input.renderProfileSummaryStrip();
        input.logPatternsTransitionSnapshot("queueViewportSync:raf-after-sync");
      } finally {
        if (viewportSyncCoalescePending) {
          viewportSyncCoalescePending = false;
          queueViewportSync(input);
        } else {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              if (document.body.classList.contains("focus-mode")) return;
              document.documentElement.classList.remove("focus-mode-layout-snap");
              input.logPatternsTransitionSnapshot("queueViewportSync:raf-snap-cleared");
            });
          });
        }
      }
    });
  }

  window.waywordViewportSyncCoordinator = {
    queueViewportSync: queueViewportSync
  };
})();

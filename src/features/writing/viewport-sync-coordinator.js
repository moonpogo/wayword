(function () {
  var viewportSyncRaf = null;
  var viewportSyncCoalescePending = false;

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
        input.syncPatternsLayoutMode();
        input.renderHistory();
        requestAnimationFrame(function () {
          input.syncRecentRailExpandedLayoutMetrics();
        });
        input.syncSubmittedAnnotatedEditorSurfaces();
        input.scheduleEditorDotOverlaySync();
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

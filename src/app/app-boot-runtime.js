(function () {
  function bindViewportObservers(input) {
    input.window.addEventListener("resize", input.queueViewportSync);
    if (input.window.visualViewport) {
      input.window.visualViewport.addEventListener("resize", input.queueViewportSync);
      input.window.visualViewport.addEventListener("scroll", input.queueViewportSync);
    }
    try {
      var desktopRailMq = input.window.matchMedia("(min-width: 981px)");
      var onDesktopRailMqChange = function () {
        input.queueViewportSync();
      };
      if (desktopRailMq.addEventListener) {
        desktopRailMq.addEventListener("change", onDesktopRailMqChange);
      } else if (desktopRailMq.addListener) {
        desktopRailMq.addListener(onDesktopRailMqChange);
      }
    } catch (_) {
      /* ignore */
    }
  }

  function bindEditorShellEdgeResizeObserver(input) {
    var shell = input.document.querySelector(".editor-shell");
    if (!shell || typeof input.ResizeObserver === "undefined") return null;
    var debounceTimer = null;
    var ro = new input.ResizeObserver(function () {
      if (debounceTimer !== null) clearTimeout(debounceTimer);
      debounceTimer = input.window.setTimeout(function () {
        debounceTimer = null;
        input.queueViewportSync();
      }, 36);
    });
    ro.observe(shell);
    return ro;
  }

  function bindEditorCalibrationOverlayResizeObserver(input) {
    var overlay = input.$("editorOverlay");
    if (!overlay || typeof input.ResizeObserver === "undefined") return null;
    var ro = new input.ResizeObserver(function () {
      if (overlay.classList.contains("editor-overlay--calibration") && !overlay.classList.contains("hidden")) {
        input.syncEditorCalibrationOverlayClip();
      }
    });
    ro.observe(overlay);
    return ro;
  }

  function runInitialRender(input) {
    input.syncViewportHeightVar();
    input.applyTheme(input.state.theme);
    input.state.progressionLevel = input.loadStoredProgressionLevel();
    input.recomputeProgressionLevel({ sessionInit: true });
    input.applyProgressionToState();
    input.ensurePromptRerollButton();
    input.bindPromptClusterControlsOnce();
    input.renderMeta();
    input.renderWritingState();
    input.projectWriteDocToEditorFromState(0, 0, false);
    input.renderHighlight();
    input.scheduleEditorDotOverlaySync();
    input.renderSidebar();
    input.renderHistory();
    input.renderProfile();
    input.syncPatternsLayoutMode();
    input.renderCalibration();
    input.renderProfileSummaryStrip();
    input.updateEnterButtonVisibility();
  }

  window.waywordAppBootRuntime = {
    bindViewportObservers: bindViewportObservers,
    bindEditorShellEdgeResizeObserver: bindEditorShellEdgeResizeObserver,
    bindEditorCalibrationOverlayResizeObserver: bindEditorCalibrationOverlayResizeObserver,
    runInitialRender: runInitialRender
  };
})();

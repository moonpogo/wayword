(function () {
  function closePanelsForAppEntry(input) {
    if (!input) return;
    input.showProfile(false);
    input.setOptionsOpen(false);
  }

  function closePanelsForFreshRun(input) {
    if (!input) return;
    input.setBannedEditorOpen(false);
    input.setOptionsOpen(false);
    input.showProfile(false);
  }

  function armMobilePatternsToggleGuard(input) {
    if (!input || typeof input.isMobileViewport !== "function") return;
    if (!input.isMobileViewport()) return;
    if (typeof input.setSuppressFocusExitUntil !== "function") return;
    input.setSuppressFocusExitUntil(input.now() + input.durationMs);
  }

  function togglePatternsPanelFromStyleTab(input) {
    if (!input || typeof input.$ !== "function" || typeof input.showProfile !== "function") {
      return;
    }
    var profileView = input.$("profileView");
    var isShowingProfile = Boolean(profileView && !profileView.classList.contains("hidden"));
    var nextShow = !isShowingProfile;
    var source = String(input.source || "styleTab");

    if (typeof input.logPatternsTransitionSnapshot === "function") {
      var beforeMeta = { isShowingProfile: isShowingProfile };
      if (input.key) beforeMeta.key = input.key;
      input.logPatternsTransitionSnapshot(source + "-before-toggle", beforeMeta);
    }

    input.showProfile(nextShow);

    if (typeof input.logPatternsTransitionSnapshot === "function") {
      var afterMeta = { nextShow: nextShow };
      if (input.key) afterMeta.key = input.key;
      input.logPatternsTransitionSnapshot(source + "-after-toggle", afterMeta);
      requestAnimationFrame(function () {
        input.logPatternsTransitionSnapshot(source + "-next-raf", afterMeta);
      });
      if (!input.skipTimeoutLog) {
        window.setTimeout(function () {
          input.logPatternsTransitionSnapshot(source + "-timeout-200ms", afterMeta);
        }, 200);
      }
    }
  }

  window.waywordPanelCoordination = {
    closePanelsForAppEntry: closePanelsForAppEntry,
    closePanelsForFreshRun: closePanelsForFreshRun,
    armMobilePatternsToggleGuard: armMobilePatternsToggleGuard,
    togglePatternsPanelFromStyleTab: togglePatternsPanelFromStyleTab,
  };
})();

(function () {
  function clampProgressionLevel(value) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.min(3, Math.max(1, Math.floor(numeric)));
  }

  function loadStoredProgressionLevel(input) {
    return clampProgressionLevel(input.storage.readProgressionLevelOrDefault(input.progressionLevelKey));
  }

  function persistProgressionLevel(input) {
    input.storage.saveProgressionLevel(input.progressionLevelKey, input.state.progressionLevel);
  }

  function getProgressionConfig(input, level) {
    return input.progressionLevels[clampProgressionLevel(level) - 1];
  }

  function applyProgressionToState(input) {
    var cfg = getProgressionConfig(input, input.state.progressionLevel);
    input.state.targetWords = cfg.targetWords;
    input.state.timerSeconds = cfg.timerSeconds;
  }

  function recomputeProgressionLevel(input, options) {
    var nextOptions = options && typeof options === "object" ? options : {};
    var sessionInit = Boolean(nextOptions.sessionInit);
    var afterRun = Boolean(nextOptions.afterRun);
    var level = clampProgressionLevel(input.state.progressionLevel);

    var runs = input
      .readSavedRunsChronological()
      .slice()
      .sort(function (a, b) {
        return (a.savedAt || 0) - (b.savedAt || 0);
      });

    if (sessionInit && runs.length) {
      var newest = runs[runs.length - 1];
      var age = input.now() - (newest.savedAt || 0);
      if (age > 7 * 86400000) {
        var marker = input.storage.getInactivityEaseRunMarker(input.inactivityEaseRunKey);
        if (marker !== newest.runId) {
          level = Math.max(1, level - 1);
          input.storage.setInactivityEaseRunMarker(input.inactivityEaseRunKey, newest.runId);
        }
      }
    }

    if (afterRun) {
      var last5 = runs.slice(-5);
      if (last5.length === 5) {
        var succ5 = last5.filter(function (run) {
          return run.wasSuccessful === true;
        }).length;
        if (succ5 < 2) level = Math.max(1, level - 1);
      }

      var last8 = runs.slice(-8);
      var succ8 = last8.filter(function (run) {
        return run.wasSuccessful === true;
      }).length;
      if (succ8 >= 5 && level < 3) level = Math.min(3, level + 1);
    }

    var prev = input.state.progressionLevel;
    input.state.progressionLevel = clampProgressionLevel(level);
    persistProgressionLevel(input);

    return { changed: prev !== input.state.progressionLevel, prevLevel: prev };
  }

  window.waywordProgressionRuntime = {
    clampProgressionLevel: clampProgressionLevel,
    loadStoredProgressionLevel: loadStoredProgressionLevel,
    persistProgressionLevel: persistProgressionLevel,
    getProgressionConfig: getProgressionConfig,
    applyProgressionToState: applyProgressionToState,
    recomputeProgressionLevel: recomputeProgressionLevel
  };
})();

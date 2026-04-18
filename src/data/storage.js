(function () {
  window.waywordStorage = {
    loadTheme() {
      return localStorage.getItem("wayword-theme") || "light";
    },

    saveTheme(theme) {
      localStorage.setItem("wayword-theme", theme);
    },

    loadHistory() {
      return JSON.parse(localStorage.getItem("wayword-history") || "[]");
    },

    loadSavedRunIdsSet() {
      return new Set(JSON.parse(localStorage.getItem("wayword-runids") || "[]"));
    },

    loadCompletedChallengesSet() {
      return new Set(JSON.parse(localStorage.getItem("wayword-completed-challenges") || "[]"));
    },

    saveHistoryAndRunIds(history, savedRunIds) {
      localStorage.setItem("wayword-history", JSON.stringify(history));
      localStorage.setItem("wayword-runids", JSON.stringify(Array.from(savedRunIds)));
    },

    saveExerciseWords(words) {
      localStorage.setItem("wayword-exercise-words", JSON.stringify(words));
      localStorage.setItem("wayword-exercise-word", words[0]);
    },

    removeExerciseWords() {
      localStorage.removeItem("wayword-exercise-words");
      localStorage.removeItem("wayword-exercise-word");
    },

    loadPatternSelectedWordsJson() {
      try {
        return JSON.parse(localStorage.getItem("wayword-pattern-selected-words") || "[]");
      } catch (_) {
        return [];
      }
    },

    savePatternSelectedWords(words) {
      localStorage.setItem("wayword-pattern-selected-words", JSON.stringify(words));
    },

    removePatternSelectedWords() {
      localStorage.removeItem("wayword-pattern-selected-words");
    },

    readProgressionLevelOrDefault(progressionLevelKey) {
      return Number(localStorage.getItem(progressionLevelKey)) || 1;
    },

    saveProgressionLevel(progressionLevelKey, level) {
      localStorage.setItem(progressionLevelKey, String(level));
    },

    getInactivityEaseRunMarker(inactivityEaseRunKey) {
      return localStorage.getItem(inactivityEaseRunKey);
    },

    setInactivityEaseRunMarker(inactivityEaseRunKey, runId) {
      localStorage.setItem(inactivityEaseRunKey, runId);
    },

    removeInactivityEaseRun(inactivityEaseRunKey) {
      localStorage.removeItem(inactivityEaseRunKey);
    },

    saveCompletedChallengesFromSet(completedChallenges) {
      localStorage.setItem(
        "wayword-completed-challenges",
        JSON.stringify(Array.from(completedChallenges))
      );
    },
  };
})();

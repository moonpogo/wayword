(function () {
  function startExerciseRun(input, wordsOrWord) {
    var words = Array.isArray(wordsOrWord) ? wordsOrWord : [wordsOrWord];
    var normalizedWords = input.normalizeExerciseWords(words);
    if (!normalizedWords.length) return;

    input.setExerciseWords(normalizedWords);
    input.startWriting({ preserveActiveChallenge: true });
    input.renderMeta();
    input.renderHighlight();
    input.renderSidebar();
  }

  window.waywordWritingExerciseStartCoordinator = {
    startExerciseRun: startExerciseRun
  };
})();

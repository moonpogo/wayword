(function () {
  function setExerciseWords(input, words) {
    input.state.exerciseWords = input.normalizeExerciseWords(words);
    if (input.state.exerciseWords.length) {
      input.storage.saveExerciseWords(input.state.exerciseWords);
    } else {
      input.storage.removeExerciseWords();
    }
  }

  window.waywordWritingExerciseWordsCoordinator = {
    setExerciseWords: setExerciseWords
  };
})();

(function () {
  function clearExerciseIfCompleted(input, text) {
    if (!input.state.exerciseWords.length) return;

    var tokens = input.tokenize(text);
    if (input.state.exerciseWords.some(function (word) { return tokens.includes(word); })) return;

    input.state.exerciseWords.forEach(function (word) {
      input.state.completedChallenges.add(word);
    });
    input.storage.saveCompletedChallengesFromSet(input.state.completedChallenges);

    input.setExerciseWords([]);
  }

  window.waywordWritingExerciseCompletionCoordinator = {
    clearExerciseIfCompleted: clearExerciseIfCompleted
  };
})();

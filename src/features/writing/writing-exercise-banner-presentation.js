(function () {
  function renderExerciseBanner(input) {
    var bannedPill = input.$("bannedPill");
    var exercisePill = input.$("exerciseLegendPill");
    if (!bannedPill) return;

    var bannedText = input.state.banned.length ? input.state.banned.join(", ") : "none";
    bannedPill.textContent = "avoid: " + bannedText;

    if (exercisePill) {
      if (input.state.exerciseWords.length) {
        exercisePill.classList.remove("hidden");
        input.$("legendChallengeCount").textContent = "0";
      } else {
        exercisePill.classList.add("hidden");
      }
    }
  }

  window.waywordWritingExerciseBannerPresentation = {
    renderExerciseBanner: renderExerciseBanner
  };
})();

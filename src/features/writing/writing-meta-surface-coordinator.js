(function () {
  function syncMetaSurface(input) {
    input.setActiveModeButton("wordModes", "words", input.state.targetWords);
    input.setActiveModeButton("timeModes", "time", input.state.timerSeconds);
    input.setActiveModeButton("wordModesPanel", "words", input.state.targetWords);
    input.setActiveModeButton("timeModesPanel", "time", input.state.timerSeconds);

    input.syncWordTargetLabels();

    input.updateWordProgress();
    input.updateTimeFill();
    input.updateEnterButtonVisibility();
  }

  window.waywordWritingMetaSurfaceCoordinator = {
    syncMetaSurface: syncMetaSurface
  };
})();

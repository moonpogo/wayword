(function () {
  function applyWordTargetFromPanel(input, nextWords) {
    var n = Number(nextWords);
    if (!Number.isFinite(n) || ![60, 75, 90].includes(n)) return;

    input.state.targetWords = input.state.targetWords === n ? 0 : n;
    input.setActiveModeButton("wordModesPanel", "words", input.state.targetWords);
    input.setActiveModeButton("wordModes", "words", input.state.targetWords);
    input.renderMeta();
    input.renderHighlight();
    input.renderSidebar();
    input.updateWordProgress();
    input.updateEnterButtonVisibility();
  }

  function applyTimerFromPanel(input, nextSeconds) {
    var n = Number(nextSeconds);
    if (!Number.isFinite(n) || ![60, 180, 300].includes(n)) return;

    input.state.timerSeconds = input.state.timerSeconds === n ? 0 : n;
    input.stopTimer();
    input.state.timeRemaining = 0;
    input.state.timerWaitingForFirstInput = Boolean(input.state.timerSeconds);
    input.setActiveModeButton("timeModesPanel", "time", input.state.timerSeconds);
    input.setActiveModeButton("timeModes", "time", input.state.timerSeconds);
    input.updateTimeFill();
    input.renderMeta();
    input.renderHighlight();
    input.renderSidebar();
    input.renderWritingState();
  }

  window.waywordWritingModeControlsCoordinator = {
    applyWordTargetFromPanel: applyWordTargetFromPanel,
    applyTimerFromPanel: applyTimerFromPanel
  };
})();

(function () {
  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function triggerShuffle(input) {
    input.state.targetWords = pickRandom(input.shuffleTargetWords);
    input.state.timerSeconds = pickRandom(input.shuffleTimerSeconds);
    input.state.banned = [].concat(pickRandom(input.bannedSets));

    input.stopTimer();
    input.state.timeRemaining = 0;
    input.state.timerWaitingForFirstInput = Boolean(input.state.timerSeconds);
    input.setActiveModeButton("wordModesPanel", "words", input.state.targetWords);
    input.setActiveModeButton("timeModesPanel", "time", input.state.timerSeconds);
    input.setActiveModeButton("wordModes", "words", input.state.targetWords);
    input.setActiveModeButton("timeModes", "time", input.state.timerSeconds);

    var panelInput = input.$("bannedInlineInputPanel");
    if (panelInput && input.document.activeElement !== panelInput) {
      panelInput.value = input.state.banned.join(", ");
    }

    input.renderMeta();
    input.renderHighlight();
    input.renderSidebar();
    input.renderWritingState();
  }

  window.waywordWritingShuffleCoordinator = {
    triggerShuffle: triggerShuffle
  };
})();

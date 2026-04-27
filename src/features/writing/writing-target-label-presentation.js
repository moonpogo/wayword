(function () {
  function syncWordTargetLabels(input) {
    var t = Number(input.state.targetWords) || 0;
    var text =
      t === 120 ? "Write to 120 words" : t === 240 ? "Write to 240 words" : "Write to 60 words";
    var panel = input.$("wordTargetLabelPanel");
    var setup = input.$("wordTargetLabelSetup");
    if (panel) panel.textContent = text;
    if (setup) setup.textContent = text;
  }

  window.waywordWritingTargetLabelPresentation = {
    syncWordTargetLabels: syncWordTargetLabels
  };
})();

(function () {
  function syncWordTargetLabels(input) {
    var t = Number(input.state.targetWords) || 0;
    var text =
      t === 75 ? "Write to 75 words" : t === 90 ? "Write to 90 words" : "Write to 60 words";
    var panel = input.$("wordTargetLabelPanel");
    var setup = input.$("wordTargetLabelSetup");
    if (panel) panel.textContent = text;
    if (setup) setup.textContent = text;
  }

  window.waywordWritingTargetLabelPresentation = {
    syncWordTargetLabels: syncWordTargetLabels
  };
})();

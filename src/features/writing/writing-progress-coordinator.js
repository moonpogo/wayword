(function () {
  function setMeterLabel(input, text) {
    var meterBg = input.$("editorProgressMeterBg");
    var meterFg = input.$("editorProgressMeterFg");
    if (meterBg) meterBg.textContent = text;
    if (meterFg) meterFg.textContent = text;
  }

  function updateWordProgress(input) {
    var fill = input.$("editorProgressFill");
    var progressRoot = fill && fill.closest(".editor-progress");
    var track = fill && fill.closest(".editor-progress-track");
    if (!fill) return;

    var words = input.state.active ? input.tokenize(input.getEditorText()).length : 0;

    if (!input.state.targetWords) {
      fill.style.width = "0%";
      fill.style.background = "var(--ink)";
      if (track) track.style.setProperty("--editor-progress-pct", "0");
      setMeterLabel(input, "");
      if (progressRoot) {
        progressRoot.classList.toggle("editor-progress--empty", words === 0);
        progressRoot.classList.add("editor-progress--no-target");
        progressRoot.setAttribute("data-phase", "none");
      }
      return;
    }

    var target = input.state.targetWords;
    var clampedPercent = Math.min((words / target) * 100, 100);
    fill.style.width = String(clampedPercent) + "%";
    if (track) track.style.setProperty("--editor-progress-pct", String(clampedPercent));
    setMeterLabel(input, String(words) + " / " + String(target));
    if (progressRoot) {
      progressRoot.classList.toggle("editor-progress--empty", words === 0);
      progressRoot.classList.remove("editor-progress--no-target");
    }

    var atTarget = words >= target;
    fill.style.background = atTarget ? "var(--success)" : "var(--ink)";

    var w1 = Math.ceil(target / 3);
    var w2 = Math.ceil((2 * target) / 3);
    var phase = "early";
    if (atTarget) phase = "done";
    else if (w1 < w2) {
      if (words >= w2) phase = "late";
      else if (words >= w1) phase = "mid";
    }
    if (progressRoot) progressRoot.setAttribute("data-phase", phase);
  }

  function updateTimeFill(input) {
    var fill = input.$("editorTimeFill");
    if (!fill) return;

    if (!input.state.active || !input.state.timerSeconds || input.state.submitted) {
      fill.style.height = "0%";
      return;
    }

    if (input.state.timerWaitingForFirstInput) {
      fill.style.height = "0%";
      return;
    }

    var elapsed = input.state.timerSeconds - input.state.timeRemaining;
    var progress = Math.min(Math.max(elapsed / input.state.timerSeconds, 0), 1);
    fill.style.height = String(progress * 100) + "%";
  }

  window.waywordWritingProgressCoordinator = {
    updateWordProgress: updateWordProgress,
    updateTimeFill: updateTimeFill
  };
})();

(function () {
  function renderPromptRerollButton(input) {
    var rerollBtn = input.$("promptRerollBtn");
    if (rerollBtn) {
      input.normalizePromptRerollButtonIfNeeded();
      rerollBtn = input.$("promptRerollBtn");
    }

    if (!rerollBtn) return;

    var remaining = Math.max(0, input.rerollLimit - input.state.promptRerollsUsed);
    var locked = !input.canRerollPrompt();

    rerollBtn.disabled = locked;
    rerollBtn.classList.toggle("locked", locked);
    rerollBtn.classList.toggle("hidden", remaining === 0);
    rerollBtn.dataset.rerolls = String(remaining);
    rerollBtn.setAttribute(
      "aria-label",
      remaining === 0
        ? "No prompt rerolls left"
        : "Get a different prompt (" + remaining + " reroll" + (remaining === 1 ? "" : "s") + " left)"
    );
  }

  window.waywordWritingPromptRerollPresentation = {
    renderPromptRerollButton: renderPromptRerollButton
  };
})();

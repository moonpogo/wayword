(function () {
  function renderPromptCard(input) {
    var promptCard = input.$("promptCard");
    var promptText = input.$("promptText");
    var promptFamily = input.$("promptFamilyLabel");

    if (promptCard) promptCard.classList.toggle("hidden", !input.state.active);
    if (promptText) promptText.textContent = input.state.prompt || "";
    if (promptFamily) promptFamily.textContent = input.state.promptFamily || "Prompt";

    var promptNudgeShell = input.$("promptNudgeShell");
    var promptNudge = input.$("promptNudge");
    var promptNudgeText = input.$("promptNudgeText") || promptNudge;
    var promptMain = promptCard ? promptCard.querySelector(".prompt-main") : null;
    var nudgeVisible =
      typeof input.isPromptNudgeVisible === "function" ? input.isPromptNudgeVisible() : false;
    var nudgeRowVisible = Boolean(input.state.active && !input.state.submitted && nudgeVisible);
    if (promptNudgeText) {
      var nudge = nudgeRowVisible ? input.getActivePromptNudgeLineForRender() : "";
      promptNudgeText.textContent = nudge;
    }
    if (promptNudgeShell) {
      promptNudgeShell.classList.toggle("prompt-nudge-shell--hidden", !nudgeRowVisible);
      promptNudgeShell.setAttribute("aria-hidden", nudgeRowVisible ? "false" : "true");
    }
    if (promptNudge) {
      promptNudge.setAttribute("aria-hidden", nudgeRowVisible ? "false" : "true");
    }
    if (nudgeRowVisible && typeof input.onPromptNudgeVisible === "function") {
      input.onPromptNudgeVisible();
    }
    if (promptMain) {
      promptMain.classList.toggle("prompt-main--with-nudge", nudgeRowVisible);
      promptMain.classList.toggle("prompt-main--latent-nudge", Boolean(input.state.active && !input.state.submitted));
    }
  }

  window.waywordWritingPromptCardPresentation = {
    renderPromptCard: renderPromptCard
  };
})();

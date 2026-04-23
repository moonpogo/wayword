(function () {
  function renderPromptCard(input) {
    var promptCard = input.$("promptCard");
    var promptText = input.$("promptText");
    var promptFamily = input.$("promptFamilyLabel");

    if (promptCard) promptCard.classList.toggle("hidden", !input.state.active);
    if (promptText) promptText.textContent = input.state.prompt || "";
    if (promptFamily) promptFamily.textContent = input.state.promptFamily || "Prompt";

    var promptNudge = input.$("promptNudge");
    var promptMain = promptCard ? promptCard.querySelector(".prompt-main") : null;
    var nudgeRowVisible = Boolean(input.state.active && !input.state.submitted);
    if (promptNudge) {
      var nudge = nudgeRowVisible ? input.getActivePromptNudgeLineForRender() : "";
      promptNudge.textContent = nudge;
      promptNudge.classList.toggle("hidden", !nudgeRowVisible);
      promptNudge.setAttribute("aria-hidden", nudgeRowVisible ? "false" : "true");
    }
    if (promptMain) {
      promptMain.classList.toggle("prompt-main--with-nudge", nudgeRowVisible);
    }
  }

  window.waywordWritingPromptCardPresentation = {
    renderPromptCard: renderPromptCard
  };
})();

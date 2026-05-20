(function () {
  function renderPromptCard(input) {
    var promptCard = input.$("promptCard");
    var promptText = input.$("promptText");

    if (promptCard) promptCard.classList.toggle("hidden", !input.state.active);
    if (promptText) promptText.textContent = input.state.prompt || "";
  }

  window.waywordWritingPromptCardPresentation = {
    renderPromptCard: renderPromptCard
  };
})();

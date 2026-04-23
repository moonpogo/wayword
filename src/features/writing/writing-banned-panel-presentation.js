(function () {
  function syncBannedPanelPresentation(input) {
    var bannedPill = input.$("bannedPill");
    if (bannedPill) {
      var bannedText = input.state.banned.length ? input.state.banned.join(", ") : "none";
      bannedPill.textContent = "avoid: " + bannedText;
    }

    var bannedInlineInputPanel = input.$("bannedInlineInputPanel");
    if (bannedInlineInputPanel && input.document.activeElement !== bannedInlineInputPanel) {
      bannedInlineInputPanel.value = input.state.banned.join(", ");
    }
  }

  window.waywordWritingBannedPanelPresentation = {
    syncBannedPanelPresentation: syncBannedPanelPresentation
  };
})();

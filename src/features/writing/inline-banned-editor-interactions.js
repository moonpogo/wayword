(function () {
  function bindInlineBannedEditorInteractions(input) {
    if (!input || typeof input.$ !== "function") return;

    var pill = input.$("bannedPill");
    if (pill && pill.dataset.inlineBannedEditorInteractionBound !== "1") {
      pill.dataset.inlineBannedEditorInteractionBound = "1";
      pill.addEventListener("click", function () {
        input.setBannedEditorOpen(!input.getBannedEditorOpen());
      });
    }

    var field = input.$("bannedInlineInput");
    if (field && field.dataset.inlineBannedEditorInteractionBound !== "1") {
      field.dataset.inlineBannedEditorInteractionBound = "1";
      field.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          input.saveBannedInline();
        }
        if (e.key === "Escape") {
          input.setBannedEditorOpen(false);
        }
      });
    }

    if (document.documentElement.dataset.inlineBannedEditorDocumentBound === "1") return;
    document.documentElement.dataset.inlineBannedEditorDocumentBound = "1";
    document.addEventListener("click", function (e) {
      var editor = input.$("metaEditorRow");
      var currentPill = input.$("bannedPill");

      if (!editor || !currentPill) return;

      var clickedInside = editor.contains(e.target);
      var clickedPill = currentPill.contains(e.target);

      if (!clickedInside && !clickedPill) {
        input.setBannedEditorOpen(false);
      }
    });
  }

  window.waywordInlineBannedEditorInteractions = {
    bindInlineBannedEditorInteractions: bindInlineBannedEditorInteractions
  };
})();

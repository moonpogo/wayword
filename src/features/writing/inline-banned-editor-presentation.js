(function () {
  function setBannedEditorOpen(input) {
    input.state.bannedEditorOpen = Boolean(input.open);
    input.$("metaEditorRow")?.classList.toggle("hidden", !input.open);
    if (!input.open) return;

    var field = input.$("bannedInlineInput");
    if (!field) return;
    field.value = input.getBannedValue();
    requestAnimationFrame(function () {
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    });
  }

  window.waywordInlineBannedEditorPresentation = {
    setBannedEditorOpen: setBannedEditorOpen
  };
})();

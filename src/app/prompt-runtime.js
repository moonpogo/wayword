(function () {
  function generatePrompt(input, options) {
    if (!Array.isArray(input.state.recentPromptIds)) input.state.recentPromptIds = [];
    if (!Array.isArray(input.state.recentFamilyKeys)) input.state.recentFamilyKeys = [];
    var opts = options && typeof options === "object" ? options : {};
    var forced =
      typeof opts.familyKey === "string" && input.promptFamiliesOrder.includes(opts.familyKey)
        ? opts.familyKey
        : null;

    var chosen = input.promptSelection.choosePromptFamilyAndEntry({
      forcedFamilyKey: forced,
      recentPromptIds: input.state.recentPromptIds,
      recentFamilyKeys: input.state.recentFamilyKeys,
      promptFamiliesOrder: input.promptFamiliesOrder,
      promptLibrary: input.promptLibrary,
      promptEntryById: input.promptEntryById,
      recentIdWindow: input.promptRecentIdWindow,
      nearDuplicateWindow: input.promptNearDuplicateWindow,
      recentFamilyWindow: input.promptRecentFamilyWindow,
    });
    var family = chosen.family;
    var entry = chosen.entry;

    input.state.promptId = entry.id;
    input.state.prompt = entry.text;
    input.state.promptFamily = family;
    input.state.lastPromptKey = family + "::" + entry.id;
    input.state.promptBiasTags = input.biasTagsForPromptFamily(family);
    input.state.recentPromptIds = input.state.recentPromptIds
      .concat([entry.id])
      .slice(-input.promptRecentIdWindow);
    input.state.recentFamilyKeys = input.state.recentFamilyKeys
      .concat([family])
      .slice(-input.promptRecentFamilyWindow);
    return entry.text;
  }

  function canRerollPrompt(input) {
    return input.promptSelection.canRerollPromptCore({
      active: input.state.active,
      submitted: input.state.submitted,
      editorTextEmpty: !input.getEditorText().trim(),
      promptRerollsUsed: input.state.promptRerollsUsed,
      rerollLimit: input.promptRerollLimit,
    });
  }

  function rerollPrompt(input) {
    if (!canRerollPrompt(input)) return false;
    var family = String(input.state.promptFamily || "").trim();
    input.state.prompt = generatePrompt(
      input,
      input.promptFamiliesOrder.includes(family) ? { familyKey: family } : {}
    );
    input.state.promptRerollsUsed += 1;
    if (typeof input.renderMeta === "function") {
      input.renderMeta();
    }
    return true;
  }

  window.waywordPromptRuntime = {
    generatePrompt: generatePrompt,
    canRerollPrompt: canRerollPrompt,
    rerollPrompt: rerollPrompt
  };
})();

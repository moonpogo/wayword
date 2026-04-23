(function () {
  function onPromptClusterControlPointerDown(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function bindPromptClusterControls(input) {
    if (!input || typeof input.$ !== "function") return;

    var reroll = input.$("promptRerollBtn");
    if (reroll) {
      reroll.removeEventListener("pointerdown", onPromptClusterControlPointerDown);
      reroll.addEventListener("pointerdown", onPromptClusterControlPointerDown);
      reroll.removeEventListener("click", input.onPromptRerollControlClick);
      reroll.addEventListener("click", input.onPromptRerollControlClick);
    }

    var field = input.$("fieldExpandedToggle");
    if (field) {
      field.removeEventListener("pointerdown", onPromptClusterControlPointerDown);
      field.addEventListener("pointerdown", onPromptClusterControlPointerDown);
      field.removeEventListener("click", input.onFieldExpandedControlClick);
      field.addEventListener("click", input.onFieldExpandedControlClick);
    }
  }

  window.waywordPromptInteractions = {
    bindPromptClusterControls: bindPromptClusterControls
  };
})();

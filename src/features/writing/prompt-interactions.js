(function () {
  function onPromptClusterControlPointerDown(e) {
    if (inputRef && typeof inputRef.armPromptControlFocusExitGuard === "function") {
      inputRef.armPromptControlFocusExitGuard();
    }
    e.stopPropagation();
  }

  var inputRef = null;

  function bindPromptClusterControls(input) {
    if (!input || typeof input.$ !== "function") return;
    inputRef = input;
    var spine = input.$("rightControlSpine");
    if (!spine) return;

    var reroll = spine.querySelector("#promptRerollBtn");
    if (reroll) {
      reroll.removeEventListener("pointerdown", onPromptClusterControlPointerDown);
      reroll.addEventListener("pointerdown", onPromptClusterControlPointerDown);
      reroll.removeEventListener("click", input.onPromptRerollControlClick);
      reroll.addEventListener("click", input.onPromptRerollControlClick);
    }

    var field = spine.querySelector("#fieldExpandedToggle");
    if (field) {
      field.removeEventListener("pointerdown", onPromptClusterControlPointerDown);
      field.addEventListener("pointerdown", onPromptClusterControlPointerDown);
      if (typeof input.onFieldExpandedControlPointerUp === "function") {
        field.removeEventListener("pointerup", input.onFieldExpandedControlPointerUp);
        field.addEventListener("pointerup", input.onFieldExpandedControlPointerUp);
      }
      field.removeEventListener("click", input.onFieldExpandedControlClick);
      field.addEventListener("click", input.onFieldExpandedControlClick);
    }
  }

  window.waywordPromptInteractions = {
    bindPromptClusterControls: bindPromptClusterControls
  };
})();

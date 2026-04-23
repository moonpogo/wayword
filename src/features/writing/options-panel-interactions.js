(function () {
  var suppressGearClickToggle = false;

  function bindOptionsPanelInteractions(input) {
    if (!input || typeof input.$ !== "function") return;

    var backdrop = input.$("editorOptionsBackdrop");
    if (backdrop && backdrop.dataset.optionsInteractionBound !== "1") {
      backdrop.dataset.optionsInteractionBound = "1";
      backdrop.addEventListener("click", function (e) {
        if (Date.now() < input.getOptionsPanelDismissGuardUntil()) return;
        var panel = input.$("editorOptionsPanel");
        if (panel && panel.contains(e.target)) return;
        input.setOptionsOpen(false);
      });
    }

    var trigger = input.$("optionsTrigger");
    if (trigger && trigger.dataset.optionsInteractionBound !== "1") {
      trigger.dataset.optionsInteractionBound = "1";
      trigger.addEventListener(
        "pointerdown",
        function () {
          suppressGearClickToggle = false;
          if (!input.getOptionsOpen()) {
            input.setOptionsOpen(true);
            suppressGearClickToggle = true;
          }
        },
        true
      );

      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        if (suppressGearClickToggle) {
          suppressGearClickToggle = false;
          return;
        }
        input.setOptionsOpen(!input.getOptionsOpen());
      });
    }

    var closeBtn = input.$("editorOptionsCloseBtn");
    if (closeBtn && closeBtn.dataset.optionsInteractionBound !== "1") {
      closeBtn.dataset.optionsInteractionBound = "1";
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        input.setOptionsOpen(false);
      });
    }
  }

  window.waywordOptionsPanelInteractions = {
    bindOptionsPanelInteractions: bindOptionsPanelInteractions
  };
})();

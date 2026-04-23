(function () {
  function setActiveModeButton(input, containerId, attribute, value) {
    var container = input.$(containerId);
    if (!container) return;

    var selector = attribute === "words" ? "button[data-words]" : "button[data-time]";
    Array.from(container.querySelectorAll(selector)).forEach(function (btn) {
      var v = Number(btn.dataset[attribute]);
      var on = Number.isFinite(v) && v === value;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  window.waywordWritingModeButtonPresentation = {
    setActiveModeButton: setActiveModeButton
  };
})();

(function () {
  var DEFAULT_MIN_DELAY_MS = 6000;
  var DEFAULT_SESSION_SECONDS = 120;

  function createEntryDelayHintController(input) {
    var timers = input && input.timers ? input.timers : window;
    var now = input && typeof input.now === "function" ? input.now : Date.now;
    var getEditorText =
      input && typeof input.getEditorText === "function" ? input.getEditorText : function () { return ""; };
    var isEligible =
      input && typeof input.isEligible === "function" ? input.isEligible : function () { return true; };
    var render =
      input && typeof input.render === "function" ? input.render : function () {};
    var hydrate =
      input && typeof input.hydrate === "function" ? input.hydrate : function () {};
    var minDelayFloorMs = Math.max(0, Number(input && input.minDelayFloorMs) || DEFAULT_MIN_DELAY_MS);

    var visible = false;
    var startedAtMs = 0;
    var firstTokenSeen = false;
    var timerId = null;

    function clearTimer() {
      if (timerId == null) return;
      timers.clearTimeout(timerId);
      timerId = null;
    }

    function hide() {
      clearTimer();
      if (!visible) return;
      visible = false;
      hydrate();
      render();
    }

    function editorHasText() {
      return String(getEditorText() || "").trim().length > 0;
    }

    function isActivePreEntry() {
      return Boolean(isEligible() && !firstTokenSeen && !editorHasText());
    }

    function delayMsForSession(sessionSeconds) {
      var seconds = Number(sessionSeconds);
      var basisSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_SESSION_SECONDS;
      return Math.max(minDelayFloorMs, Math.round(basisSeconds * 1000 * 0.2));
    }

    function revealIfStillEligible() {
      timerId = null;
      if (!isActivePreEntry()) return;
      if (visible) return;
      visible = true;
      hydrate();
      render();
    }

    function arm(sessionSeconds) {
      clearTimer();
      if (!isActivePreEntry()) return;
      var delay = delayMsForSession(sessionSeconds);
      timerId = timers.setTimeout(revealIfStillEligible, delay);
    }

    return {
      beginSession: function (sessionSeconds) {
        startedAtMs = now();
        firstTokenSeen = false;
        visible = false;
        hydrate();
        render();
        arm(sessionSeconds);
      },
      onEditorFocus: function () {
        if (!startedAtMs || firstTokenSeen || editorHasText()) return;
        arm();
      },
      onEditorInput: function () {
        firstTokenSeen = true;
        hide();
      },
      reset: function () {
        startedAtMs = 0;
        firstTokenSeen = false;
        hide();
      },
      isVisible: function () {
        return visible;
      }
    };
  }

  window.waywordEntryDelayHintController = {
    create: createEntryDelayHintController,
    DEFAULT_MIN_DELAY_MS: DEFAULT_MIN_DELAY_MS
  };
})();

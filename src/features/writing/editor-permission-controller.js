(function () {
  const DEFAULT_DELAY_MS = 12000;
  const PHRASES = [
    "One sentence is enough.",
    "Begin anywhere.",
    "Start smaller.",
    "One detail is enough.",
    "A fragment is enough.",
    "Begin with a single moment.",
    "One line will do.",
    "One exchange is enough."
  ];

  function createEditorPermissionController(input) {
    const delayMs = Number(input.delayMs) || DEFAULT_DELAY_MS;
    const stallDelayMs = Number(input.stallDelayMs) > 0 ? Number(input.stallDelayMs) : 30000;
    const getEditorText =
      typeof input.getEditorText === "function" ? input.getEditorText : function () { return ""; };
    const isEligible =
      typeof input.isEligible === "function" ? input.isEligible : function () { return true; };
    const render =
      typeof input.render === "function" ? input.render : function () {};
    const timers = input.timers || window;
    const now = typeof input.now === "function" ? input.now : Date.now;
    const phrases = Array.isArray(input.phrases) && input.phrases.length ? input.phrases : PHRASES;
    let visible = false;
    let nudgeSeen = false;
    let hasEditorStarted = false;
    let lastInputAtMs = 0;
    let phraseIndex = 0;
    let activePhrase = "";
    let timer = null;

    function clearTimer() {
      if (timer == null) return;
      timers.clearTimeout(timer);
      timer = null;
    }

    function editorIsEmpty() {
      return String(getEditorText() || "").trim().length === 0;
    }

    function getMsSinceLastInput(nowMs) {
      if (!hasEditorStarted || !Number.isFinite(lastInputAtMs) || lastInputAtMs <= 0) return Infinity;
      return Math.max(0, nowMs - lastInputAtMs);
    }

    function shouldShowEditorPermissionNudge(nowMs) {
      if (!nudgeSeen || !isEligible()) return false;
      if (!hasEditorStarted) return editorIsEmpty();
      return getMsSinceLastInput(nowMs) >= stallDelayMs;
    }

    function canReveal(nowMs) {
      return Boolean(shouldShowEditorPermissionNudge(nowMs));
    }

    function nextPhrase() {
      const phrase = String(phrases[phraseIndex % phrases.length] || "").trim();
      phraseIndex += 1;
      return phrase;
    }

    function reveal() {
      clearTimer();
      if (!canReveal(now())) return false;
      activePhrase = activePhrase || nextPhrase();
      if (!activePhrase) return false;
      if (visible) return true;
      visible = true;
      render();
      return true;
    }

    function hide(options) {
      const resetExposure = Boolean(options && options.resetExposure);
      clearTimer();
      if (resetExposure) {
        nudgeSeen = false;
        hasEditorStarted = false;
        lastInputAtMs = 0;
        activePhrase = "";
      }
      if (!visible) return;
      visible = false;
      render();
    }

    function armAfterNudge() {
      clearTimer();
      if (!canReveal(now())) return;
      timer = timers.setTimeout(function () {
        timer = null;
        reveal();
      }, delayMs);
    }

    function armAfterStall(nowMs) {
      clearTimer();
      if (!hasEditorStarted || !nudgeSeen || !isEligible()) return;
      const waitMs = Math.max(0, stallDelayMs - getMsSinceLastInput(nowMs));
      timer = timers.setTimeout(function () {
        timer = null;
        reveal();
      }, waitMs);
    }

    return {
      isVisible: function () {
        return visible;
      },
      getPhrase: function () {
        return visible ? activePhrase : "";
      },
      getDelayMs: function () {
        return delayMs;
      },
      getStallDelayMs: function () {
        return stallDelayMs;
      },
      hasEditorStarted: function () {
        return hasEditorStarted;
      },
      getMsSinceLastInput: function (atMs) {
        const value = Number.isFinite(atMs) ? atMs : now();
        return getMsSinceLastInput(value);
      },
      shouldShowEditorPermissionNudge: function (atMs) {
        const value = Number.isFinite(atMs) ? atMs : now();
        return shouldShowEditorPermissionNudge(value);
      },
      onNudgeVisible: function () {
        if (nudgeSeen || !editorIsEmpty()) return;
        nudgeSeen = true;
        activePhrase = nextPhrase();
        if (hasEditorStarted) {
          armAfterStall(now());
          return;
        }
        armAfterNudge();
      },
      onUserEdit: function () {
        hasEditorStarted = true;
        lastInputAtMs = now();
        hide({ resetExposure: false });
        armAfterStall(lastInputAtMs);
      },
      reset: function () {
        hide({ resetExposure: true });
      },
      cancel: function () {
        hide({ resetExposure: true });
      }
    };
  }

  window.waywordEditorPermissionController = {
    create: createEditorPermissionController,
    DEFAULT_DELAY_MS: DEFAULT_DELAY_MS,
    PHRASES: PHRASES.slice()
  };
})();

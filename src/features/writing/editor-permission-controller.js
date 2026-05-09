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
    const getEditorText =
      typeof input.getEditorText === "function" ? input.getEditorText : function () { return ""; };
    const isEligible =
      typeof input.isEligible === "function" ? input.isEligible : function () { return true; };
    const render =
      typeof input.render === "function" ? input.render : function () {};
    const timers = input.timers || window;
    const phrases = Array.isArray(input.phrases) && input.phrases.length ? input.phrases : PHRASES;
    let visible = false;
    let nudgeSeen = false;
    let userEdited = false;
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

    function canReveal() {
      return Boolean(nudgeSeen && !userEdited && isEligible() && editorIsEmpty());
    }

    function nextPhrase() {
      const phrase = String(phrases[phraseIndex % phrases.length] || "").trim();
      phraseIndex += 1;
      return phrase;
    }

    function reveal() {
      clearTimer();
      if (!canReveal()) return false;
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
        userEdited = false;
        activePhrase = "";
      }
      if (!visible) return;
      visible = false;
      render();
    }

    function armAfterNudge() {
      clearTimer();
      if (!canReveal()) return;
      timer = timers.setTimeout(function () {
        timer = null;
        reveal();
      }, delayMs);
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
      onNudgeVisible: function () {
        if (nudgeSeen || userEdited || !editorIsEmpty()) return;
        nudgeSeen = true;
        activePhrase = nextPhrase();
        armAfterNudge();
      },
      onUserEdit: function () {
        userEdited = true;
        hide({ resetExposure: false });
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

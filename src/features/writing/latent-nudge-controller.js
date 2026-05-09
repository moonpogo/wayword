(function () {
  const DEFAULT_IDLE_MS = 30000;
  const DEFAULT_FOCUS_MS = 5500;
  const EMPTY_REROLL_THRESHOLD = 2;

  function createLatentNudgeController(input) {
    const idleDelayMs = Number(input.idleDelayMs) || DEFAULT_IDLE_MS;
    const focusDelayMs = Number(input.focusDelayMs) || DEFAULT_FOCUS_MS;
    const getEditorText =
      typeof input.getEditorText === "function" ? input.getEditorText : function () { return ""; };
    const isEligible =
      typeof input.isEligible === "function" ? input.isEligible : function () { return true; };
    const render =
      typeof input.render === "function" ? input.render : function () {};
    const timers = input.timers || window;
    let visible = false;
    let emptyRerolls = 0;
    let idleTimer = null;
    let focusTimer = null;

    function clearTimer(kind) {
      const timer = kind === "focus" ? focusTimer : idleTimer;
      if (timer == null) return;
      timers.clearTimeout(timer);
      if (kind === "focus") {
        focusTimer = null;
      } else {
        idleTimer = null;
      }
    }

    function clearTimers() {
      clearTimer("idle");
      clearTimer("focus");
    }

    function editorIsEmpty() {
      return String(getEditorText() || "").trim().length === 0;
    }

    function canReveal() {
      return Boolean(isEligible() && editorIsEmpty());
    }

    function reveal() {
      clearTimers();
      if (!canReveal()) return false;
      if (visible) return true;
      visible = true;
      render();
      return true;
    }

    function hide(options) {
      const resetRerolls = !options || options.resetRerolls !== false;
      clearTimers();
      if (resetRerolls) emptyRerolls = 0;
      if (!visible) return;
      visible = false;
      render();
    }

    function armIdle() {
      clearTimer("idle");
      if (!canReveal()) return;
      idleTimer = timers.setTimeout(function () {
        idleTimer = null;
        reveal();
      }, idleDelayMs);
    }

    function armFocus() {
      clearTimer("focus");
      if (!canReveal()) return;
      focusTimer = timers.setTimeout(function () {
        focusTimer = null;
        reveal();
      }, focusDelayMs);
    }

    return {
      isVisible: function () {
        return visible;
      },
      getEmptyRerollCount: function () {
        return emptyRerolls;
      },
      reset: function () {
        hide({ resetRerolls: true });
      },
      beginPrompt: function () {
        hide({ resetRerolls: true });
        armIdle();
      },
      onEditorFocus: function () {
        if (visible) return;
        armFocus();
      },
      onEditorInput: function () {
        hide({ resetRerolls: true });
      },
      onPromptReroll: function () {
        const wasEligible = canReveal();
        hide({ resetRerolls: false });
        if (!wasEligible) {
          emptyRerolls = 0;
          return false;
        }
        emptyRerolls += 1;
        if (emptyRerolls >= EMPTY_REROLL_THRESHOLD) {
          return reveal();
        }
        armIdle();
        return false;
      },
      cancel: function () {
        hide({ resetRerolls: true });
      }
    };
  }

  window.waywordLatentNudgeController = {
    create: createLatentNudgeController,
    DEFAULT_IDLE_MS: DEFAULT_IDLE_MS,
    DEFAULT_FOCUS_MS: DEFAULT_FOCUS_MS
  };
})();

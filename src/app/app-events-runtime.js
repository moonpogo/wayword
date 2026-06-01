(function () {
  function detectMobileEditorContext(input) {
    try {
      if (input && typeof input.isMobileViewport === "function" && input.isMobileViewport()) {
        return true;
      }
    } catch (_err) {
      // no-op
    }
    try {
      if (
        window.waywordMobileDetection &&
        typeof window.waywordMobileDetection.isLikelyMobileViewport === "function"
      ) {
        return Boolean(window.waywordMobileDetection.isLikelyMobileViewport(window));
      }
    } catch (_err) {
      // no-op
    }
    try {
      return Number(window && window.innerWidth) > 0 && Number(window && window.innerWidth) <= 768;
    } catch (_err) {
      return false;
    }
  }

  function hasDebugInputFlag(search) {
    var rawSearch = typeof search === "string" ? search : "";
    try {
      return new URLSearchParams(rawSearch).get("debugInput") === "1";
    } catch (_err) {
      return rawSearch.indexOf("debugInput=1") >= 0;
    }
  }

  function initLandingDebugInputPanel() {
    var search = "";
    try {
      search = String((window && window.location && window.location.search) || "");
    } catch (_err) {
      search = "";
    }
    if (!hasDebugInputFlag(search)) return;
    var doc = document;
    if (!doc || !doc.body || typeof doc.createElement !== "function") return;
    if (doc.documentElement) {
      doc.documentElement.setAttribute("data-debug-input", "active");
    }
    doc.body.setAttribute("data-debug-input", "active");

    if (!doc.getElementById("debugInputBadge")) {
      var badge = doc.createElement("div");
      badge.id = "debugInputBadge";
      badge.setAttribute("data-debug-input-badge", "1");
      badge.textContent = "Input debug active";
      badge.style.position = "fixed";
      badge.style.top = "8px";
      badge.style.left = "8px";
      badge.style.right = "8px";
      badge.style.padding = "10px 12px";
      badge.style.border = "2px solid #ffcc7a";
      badge.style.borderRadius = "10px";
      badge.style.background = "rgba(255,170,64,0.22)";
      badge.style.color = "#fff3de";
      badge.style.font = "700 13px/1.2 ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial";
      badge.style.letterSpacing = "0.2px";
      badge.style.zIndex = "100000";
      badge.style.textAlign = "center";
      doc.body.appendChild(badge);
    }

    if (!doc.getElementById("debugInputPanel")) {
      var panel = doc.createElement("div");
      panel.id = "debugInputPanel";
      panel.setAttribute("data-debug-input-panel", "1");
      panel.style.position = "fixed";
      panel.style.left = "8px";
      panel.style.right = "8px";
      panel.style.bottom = "8px";
      panel.style.maxHeight = "40vh";
      panel.style.overflow = "auto";
      panel.style.padding = "8px";
      panel.style.border = "1px solid rgba(255,255,255,0.24)";
      panel.style.borderRadius = "8px";
      panel.style.background = "rgba(8,9,13,0.92)";
      panel.style.color = "#e6dccb";
      panel.style.font = "11px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      panel.style.zIndex = "99999";
      panel.style.whiteSpace = "pre-wrap";
      var title = doc.createElement("div");
      title.textContent = "Input debug active";
      title.style.fontWeight = "600";
      title.style.marginBottom = "6px";
      panel.appendChild(title);
      var list = doc.createElement("div");
      list.id = "debugInputPanelEvents";
      list.textContent = "Waiting for editor event trace...";
      panel.appendChild(list);
      doc.body.appendChild(panel);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLandingDebugInputPanel, { once: true });
  } else {
    initLandingDebugInputPanel();
  }

  function createEditorInputDebugTrace(input, editorInput) {
    var search = "";
    var host = "";
    try {
      search = String((window && window.location && window.location.search) || "");
      host = String((window && window.location && window.location.hostname) || "").toLowerCase();
    } catch (_err) {
      search = "";
      host = "";
    }
    var hasDebugFlag = hasDebugInputFlag(search);
    var isLocalDevHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local");
    var enabled = hasDebugFlag || isLocalDevHost;
    if (!enabled) {
      return {
        enabled: false,
        logEvent: function () {},
      };
    }

    var panelEnabled = hasDebugFlag;
    var state = null;
    try {
      state = input.document.__WAYWORD_INPUT_DEBUG_TRACE_STATE;
      if (!state) {
        state = { events: [] };
        input.document.__WAYWORD_INPUT_DEBUG_TRACE_STATE = state;
      }
    } catch (_err) {
      state = { events: [] };
    }
    var badge = null;
    var panel = null;
    var panelList = null;
    var events = state.events;

    function ensureBadge() {
      if (!panelEnabled || badge) return;
      if (!input || !input.document || !input.document.body || typeof input.document.createElement !== "function") return;
      var existingBadge = input.document.getElementById("debugInputBadge");
      if (existingBadge) {
        badge = existingBadge;
        return;
      }
      badge = input.document.createElement("div");
      badge.id = "debugInputBadge";
      badge.setAttribute("data-debug-input-badge", "1");
      badge.textContent = "Input debug active";
      badge.style.position = "fixed";
      badge.style.top = "8px";
      badge.style.left = "8px";
      badge.style.right = "8px";
      badge.style.padding = "10px 12px";
      badge.style.border = "2px solid #ffcc7a";
      badge.style.borderRadius = "10px";
      badge.style.background = "rgba(255,170,64,0.22)";
      badge.style.color = "#fff3de";
      badge.style.font = "700 13px/1.2 ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial";
      badge.style.letterSpacing = "0.2px";
      badge.style.zIndex = "100000";
      badge.style.textAlign = "center";
      input.document.body.appendChild(badge);
    }

    function ensurePanel() {
      if (!panelEnabled || panel) return;
      if (!input || !input.document || !input.document.body || typeof input.document.createElement !== "function") return;
      var existingPanel = input.document.getElementById("debugInputPanel");
      if (existingPanel) {
        panel = existingPanel;
        panelList =
          input.document.getElementById("debugInputPanelEvents") ||
          existingPanel.querySelector("div:last-child");
        return;
      }
      panel = input.document.createElement("div");
      panel.id = "debugInputPanel";
      panel.setAttribute("data-debug-input-panel", "1");
      panel.style.position = "fixed";
      panel.style.left = "8px";
      panel.style.right = "8px";
      panel.style.bottom = "8px";
      panel.style.maxHeight = "40vh";
      panel.style.overflow = "auto";
      panel.style.padding = "8px";
      panel.style.border = "1px solid rgba(255,255,255,0.24)";
      panel.style.borderRadius = "8px";
      panel.style.background = "rgba(8,9,13,0.92)";
      panel.style.color = "#e6dccb";
      panel.style.font = "11px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      panel.style.zIndex = "99999";
      panel.style.whiteSpace = "pre-wrap";
      var title = input.document.createElement("div");
      title.textContent = "Input debug active";
      title.style.fontWeight = "600";
      title.style.marginBottom = "6px";
      panel.appendChild(title);
      panelList = input.document.createElement("div");
      panelList.id = "debugInputPanelEvents";
      panel.appendChild(panelList);
      input.document.body.appendChild(panel);
    }

    function activeTagName() {
      try {
        var active = input.document && input.document.activeElement;
        return active && active.tagName ? String(active.tagName) : "";
      } catch (_err) {
        return "";
      }
    }

    function activeElementId() {
      try {
        var active = input.document && input.document.activeElement;
        return active && active.id ? String(active.id) : "";
      } catch (_err) {
        return "";
      }
    }

    function activeElementClassName() {
      try {
        var active = input.document && input.document.activeElement;
        return active && active.className ? String(active.className) : "";
      } catch (_err) {
        return "";
      }
    }

    function eventTargetTagName(event) {
      if (!event || !event.target || !event.target.tagName) return "";
      return String(event.target.tagName);
    }

    function eventTargetId(event) {
      return event && event.target && event.target.id ? String(event.target.id) : "";
    }

    function eventTargetClassName(event) {
      return event && event.target && event.target.className ? String(event.target.className) : "";
    }

    function isEditorCurrentlyFocused() {
      try {
        return Boolean(editorInput && input.document && input.document.activeElement === editorInput);
      } catch (_err) {
        return false;
      }
    }

    function renderPanel() {
      if (!panelEnabled || !panelList) return;
      panelList.textContent = events
        .map(function (entry) {
          return [
            entry.eventType,
            entry.inputType ? "inputType=" + entry.inputType : "",
            entry.key ? "key=" + entry.key : "",
            entry.code ? "code=" + entry.code : "",
            "mods=" + [entry.shiftKey ? "S" : "", entry.metaKey ? "M" : "", entry.ctrlKey ? "C" : "", entry.altKey ? "A" : ""].join(""),
            "composing=" + String(entry.isComposing),
            entry.targetTagName ? "target=" + entry.targetTagName : "",
            entry.targetId ? "targetId=" + entry.targetId : "",
            entry.targetClassName ? "targetClass=" + entry.targetClassName : "",
            entry.activeElement ? "active=" + entry.activeElement : "",
            entry.activeElementId ? "activeId=" + entry.activeElementId : "",
            entry.activeElementClassName ? "activeClass=" + entry.activeElementClassName : "",
            "editorFocused=" + String(entry.editorFocused),
            entry.editorTagName ? "editorTag=" + entry.editorTagName : "",
            entry.editorId ? "editorId=" + entry.editorId : "",
            entry.editorClassName ? "editorClass=" + entry.editorClassName : "",
            entry.source ? "source=" + entry.source : "",
            "vw=" + String(entry.viewportWidth),
            "mobile=" + String(entry.mobileDetected),
            "submit=" + String(entry.submitAttempted),
            "preventDefault=" + String(entry.preventDefaultCalled),
          ]
            .filter(Boolean)
            .join(" | ");
        })
        .join("\n");
    }

    ensurePanel();
    ensureBadge();
    try {
      if (input.document && input.document.documentElement) {
        input.document.documentElement.setAttribute("data-debug-input", "active");
      }
      if (input.document && input.document.body) {
        input.document.body.setAttribute("data-debug-input", "active");
      }
    } catch (_err) {
      // no-op
    }

    return {
      enabled: true,
      hasDebugFlag: hasDebugFlag,
      logEvent: function (eventType, event, meta) {
        var details = meta && typeof meta === "object" ? meta : {};
        var mobileDetected = detectMobileEditorContext(input);
        var viewportWidth = 0;
        try {
          viewportWidth = Number(window && window.innerWidth) || 0;
        } catch (_err) {
          viewportWidth = 0;
        }
        var entry = {
          eventType: String(eventType || ""),
          inputType: String((event && event.inputType) || ""),
          key: String((event && event.key) || ""),
          code: String((event && event.code) || ""),
          shiftKey: Boolean(event && event.shiftKey),
          metaKey: Boolean(event && event.metaKey),
          ctrlKey: Boolean(event && event.ctrlKey),
          altKey: Boolean(event && event.altKey),
          isComposing: Boolean(event && event.isComposing),
          targetTagName: eventTargetTagName(event),
          targetId: eventTargetId(event),
          targetClassName: eventTargetClassName(event),
          activeElement: activeTagName(),
          activeElementId: activeElementId(),
          activeElementClassName: activeElementClassName(),
          editorFocused: isEditorCurrentlyFocused(),
          viewportWidth: viewportWidth,
          mobileDetected: mobileDetected,
          submitAttempted: Boolean(details.submitAttempted),
          preventDefaultCalled: Boolean(details.preventDefaultCalled),
          editorTagName: String(details.editorTagName || ""),
          editorId: String(details.editorId || ""),
          editorClassName: String(details.editorClassName || ""),
          source: String(details.source || ""),
        };
        events.push(entry);
        if (events.length > 20) events.splice(0, events.length - 20);
        try {
          window.__WAYWORD_INPUT_DEBUG_EVENTS = events.slice();
          window.__WAYWORD_INPUT_DEBUG_LAST = entry;
          if (console && typeof console.info === "function") {
            console.info("[wayword-input-debug]", entry);
          }
        } catch (_err) {
          // no-op
        }
        if (panelEnabled) {
          ensurePanel();
          renderPanel();
        }
      },
    };
  }

  function logTraceBound(debugTrace, editorInput, source) {
    if (!debugTrace || !debugTrace.enabled) return;
    debugTrace.logEvent("trace-bound", null, {
      submitAttempted: false,
      preventDefaultCalled: false,
      editorTagName: editorInput && editorInput.tagName ? String(editorInput.tagName) : "",
      editorId: editorInput && editorInput.id ? String(editorInput.id) : "",
      editorClassName: editorInput && editorInput.className ? String(editorInput.className) : "",
      source: source || "unknown",
    });
  }

  function ensureDocumentLevelDebugFallback(input, debugTrace) {
    if (!debugTrace || !debugTrace.enabled || !debugTrace.hasDebugFlag) return;
    if (!input || !input.document || !input.document.documentElement) return;
    var root = input.document.documentElement;
    if (root.dataset.appDebugDocumentTraceBound === "1") return;
    root.dataset.appDebugDocumentTraceBound = "1";
    ["beforeinput", "input", "keydown"].forEach(function (eventType) {
      input.document.addEventListener(eventType, function (e) {
        debugTrace.logEvent("document-" + eventType, e, {
          submitAttempted: false,
          preventDefaultCalled: false,
          source: "bubble",
        });
      });
      input.document.addEventListener(eventType, function (e) {
        debugTrace.logEvent("document-" + eventType, e, {
          submitAttempted: false,
          preventDefaultCalled: false,
          source: "capture",
        });
      }, true);
    });

    ["focusin", "focusout", "selectionchange"].forEach(function (eventType) {
      input.document.addEventListener(eventType, function (e) {
        debugTrace.logEvent("document-" + eventType, e, {
          submitAttempted: false,
          preventDefaultCalled: false,
          source: "bubble",
        });
      });
      input.document.addEventListener(eventType, function (e) {
        debugTrace.logEvent("document-" + eventType, e, {
          submitAttempted: false,
          preventDefaultCalled: false,
          source: "capture",
        });
      }, true);
    });
  }

  function trySubmitFromEditor(input) {
    if (!input || !input.state) return false;
    if (input.state.submitted) {
      if (input.state.completedUiActive && !input.state.optionsOpen) {
        input.runPostSubmitAutoNewRunNow();
      }
      return true;
    }
    if (input.getEditorSurfaceComposing && input.getEditorSurfaceComposing()) return false;
    if (input.getEditorText().trim().length === 0) return false;
    input.submitWriting(false);
    return true;
  }

  function runPostEditorInputRefresh(input, editorInput) {
    if (!input.isActiveAndEditable()) return;
    input.flushEditorSurfaceIntoWriteDocOnce();
    if (typeof input.onEditorInputForEntryDelayHint === "function") {
      input.onEditorInputForEntryDelayHint();
    }
    if (typeof input.onEditorInputForTelemetry === "function") {
      input.onEditorInputForTelemetry();
    }
    input.tryStartTimerOnFirstMeaningfulInput();
    input.pulseWordmark();
    input.renderHighlight();
    input.renderSidebar();
    input.updateWordProgress();
    input.updateEnterButtonVisibility();
    input.scheduleSemanticPickerFromSelection();
    if (typeof input.renderMeta === "function") {
      input.renderMeta();
    }
    if (
      window.waywordMobileEditorCaretReveal &&
      typeof window.waywordMobileEditorCaretReveal.schedule === "function"
    ) {
      window.waywordMobileEditorCaretReveal.schedule(editorInput);
    }
  }

  function defaultInsertMobileEditorLineBreak(editorInput) {
    if (!editorInput) return false;
    var doc = editorInput.ownerDocument || document;
    if (!doc || typeof doc.createElement !== "function") return false;
    var sel = null;
    try {
      sel = window.getSelection && window.getSelection();
    } catch (_err) {
      sel = null;
    }
    if (!sel) return false;
    var range = null;
    if (sel.rangeCount > 0) {
      range = sel.getRangeAt(0);
    }
    if (!range || !editorInput.contains(range.startContainer)) {
      range = doc.createRange();
      range.selectNodeContents(editorInput);
      range.collapse(false);
    }
    range.deleteContents();
    var lineBreak = doc.createElement("br");
    var caretHost = doc.createElement("br");
    var frag = doc.createDocumentFragment();
    frag.appendChild(lineBreak);
    frag.appendChild(caretHost);
    range.insertNode(frag);
    var caretRange = doc.createRange();
    caretRange.setStartBefore(caretHost);
    caretRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(caretRange);
    return true;
  }

  function insertMobileEditorNewlineAndRefresh(input, editorInput, e, debugTrace, sourceLabel) {
    var preventDefaultCalled = false;
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
      preventDefaultCalled = true;
    }
    var inserted = false;
    if (typeof input.insertMobileEditorLineBreak === "function") {
      inserted = Boolean(input.insertMobileEditorLineBreak(editorInput, e));
    } else {
      inserted = defaultInsertMobileEditorLineBreak(editorInput);
    }
    if (inserted) {
      runPostEditorInputRefresh(input, editorInput);
    }
    debugTrace.logEvent("mobile-newline-inserted", e, {
      submitAttempted: false,
      preventDefaultCalled: preventDefaultCalled,
      source: sourceLabel || (inserted ? "manual-mobile-newline" : "manual-mobile-newline-failed"),
    });
    return { inserted: inserted, preventDefaultCalled: preventDefaultCalled };
  }

  function shouldHandleMobileEnterAsNewline(input, editorInput, e, options) {
    if (!e || e.key !== "Enter") return false;
    if (Boolean(e.shiftKey || e.metaKey || e.ctrlKey || e.altKey)) return false;
    if (e.isComposing || (input.getEditorSurfaceComposing && input.getEditorSurfaceComposing())) return false;
    if (!detectMobileEditorContext(input)) return false;
    var opts = options || {};
    var target = e.target || null;
    if (!target && opts.assumeEditorWhenTargetMissing) {
      return true;
    }
    var targetIsEditor =
      Boolean(target && target === editorInput) ||
      Boolean(target && editorInput && typeof editorInput.contains === "function" && editorInput.contains(target));
    return targetIsEditor;
  }

  function bindEditorInputEvents(input) {
    var editorInput = input.editorInput;
    if (!editorInput && typeof input.resolveEditorInput === "function") {
      editorInput = input.resolveEditorInput();
    }
    var debugTrace = createEditorInputDebugTrace(input, editorInput);
    ensureDocumentLevelDebugFallback(input, debugTrace);
    if (!editorInput) {
      if (!input || !input.document || !input.document.documentElement) return;
      var root = input.document.documentElement;
      if (root.dataset.appEditorInputRetryBound === "1") return;
      root.dataset.appEditorInputRetryBound = "1";
      var tryBindLater = function (source) {
        var resolved = typeof input.resolveEditorInput === "function" ? input.resolveEditorInput() : null;
        if (!resolved) return;
        bindEditorInputEvents({
          editorInput: resolved,
          editorInputScrollport: input.editorInputScrollport,
          resolveEditorInput: input.resolveEditorInput,
          document: input.document,
          state: input.state,
          setFocusMode: input.setFocusMode,
          mobileEditorFocusGuard: input.mobileEditorFocusGuard,
          hideEditorSemanticPicker: input.hideEditorSemanticPicker,
          queueViewportSync: input.queueViewportSync,
          getSuppressFocusExitUntil: input.getSuppressFocusExitUntil,
          isMobilePatternsVisible: input.isMobilePatternsVisible,
          syncViewportHeightVar: input.syncViewportHeightVar,
          syncKeyboardOpenClass: input.syncKeyboardOpenClass,
          setEditorSurfaceComposing: input.setEditorSurfaceComposing,
          getEditorSurfaceComposing: input.getEditorSurfaceComposing,
          isActiveAndEditable: input.isActiveAndEditable,
          flushEditorSurfaceIntoWriteDocOnce: input.flushEditorSurfaceIntoWriteDocOnce,
          captureEditorSurfaceIntoWriteDocForSubmit: input.captureEditorSurfaceIntoWriteDocForSubmit,
          tryStartTimerOnFirstMeaningfulInput: input.tryStartTimerOnFirstMeaningfulInput,
          pulseWordmark: input.pulseWordmark,
          renderHighlight: input.renderHighlight,
          renderSidebar: input.renderSidebar,
          updateWordProgress: input.updateWordProgress,
          updateEnterButtonVisibility: input.updateEnterButtonVisibility,
          scheduleSemanticPickerFromSelection: input.scheduleSemanticPickerFromSelection,
          syncScroll: input.syncScroll,
          scheduleEditorDotOverlaySync: input.scheduleEditorDotOverlaySync,
          completedUiRestartInteractions: input.completedUiRestartInteractions,
          runPostSubmitAutoNewRunNow: input.runPostSubmitAutoNewRunNow,
          getEditorText: input.getEditorText,
          submitWriting: input.submitWriting,
          renderMeta: input.renderMeta,
          onEditorFocusForEntryDelayHint: input.onEditorFocusForEntryDelayHint,
          onEditorInputForEntryDelayHint: input.onEditorInputForEntryDelayHint,
          onEditorInputForTelemetry: input.onEditorInputForTelemetry,
        });
      };
      input.document.addEventListener("focusin", function () { tryBindLater("focusin"); }, true);
      input.document.addEventListener("pointerdown", function () { tryBindLater("pointerdown"); }, true);
      return;
    }
    if (editorInput.dataset.appEventsBound === "1") return;
    editorInput.dataset.appEventsBound = "1";
    logTraceBound(debugTrace, editorInput, "editor-bind");

    editorInput.addEventListener("focus", function () {
      debugTrace.logEvent("focus", null, {
        submitAttempted: false,
        preventDefaultCalled: false,
        source: "bubble",
      });
      if (!window.__WAYWORD_DEV_VISUAL_PROFILE) {
        input.setFocusMode(true);
      }
      if (typeof input.onEditorFocusForEntryDelayHint === "function") {
        input.onEditorFocusForEntryDelayHint();
      }
    });

    editorInput.addEventListener("blur", function (e) {
      debugTrace.logEvent("blur", e, {
        submitAttempted: false,
        preventDefaultCalled: false,
        source: "bubble",
      });
      if (
        !input.mobileEditorFocusGuard ||
        typeof input.mobileEditorFocusGuard.handleEditorBlur !== "function"
      ) {
        return;
      }
      return input.mobileEditorFocusGuard.handleEditorBlur(
        {
          state: input.state,
          hideEditorSemanticPicker: input.hideEditorSemanticPicker,
          queueViewportSync: input.queueViewportSync,
          getSuppressFocusExitUntil: input.getSuppressFocusExitUntil,
          isMobilePatternsVisible: input.isMobilePatternsVisible,
          syncViewportHeightVar: input.syncViewportHeightVar,
          syncKeyboardOpenClass: input.syncKeyboardOpenClass,
          setFocusMode: input.setFocusMode
        },
        e
      );
    });

    editorInput.addEventListener("compositionstart", function (e) {
      input.setEditorSurfaceComposing(true);
      debugTrace.logEvent("compositionstart", e, {
        submitAttempted: false,
        preventDefaultCalled: false,
      });
    });

    editorInput.addEventListener("compositionend", function (e) {
      debugTrace.logEvent("compositionend", e, {
        submitAttempted: false,
        preventDefaultCalled: false,
      });
      input.setEditorSurfaceComposing(false);
      if (!input.isActiveAndEditable()) return;
      input.flushEditorSurfaceIntoWriteDocOnce();
      if (typeof input.onEditorInputForEntryDelayHint === "function") {
        input.onEditorInputForEntryDelayHint();
      }
      if (typeof input.onEditorInputForTelemetry === "function") {
        input.onEditorInputForTelemetry();
      }
      input.tryStartTimerOnFirstMeaningfulInput();
      input.pulseWordmark();
      input.renderHighlight();
      input.renderSidebar();
      input.updateWordProgress();
      input.updateEnterButtonVisibility();
      input.scheduleSemanticPickerFromSelection();
      if (typeof input.renderMeta === "function") {
        input.renderMeta();
      }
      if (
        window.waywordMobileEditorCaretReveal &&
        typeof window.waywordMobileEditorCaretReveal.schedule === "function"
      ) {
        window.waywordMobileEditorCaretReveal.schedule(editorInput);
      }
    });

    editorInput.addEventListener("input", function (e) {
      debugTrace.logEvent("input", e, {
        submitAttempted: false,
        preventDefaultCalled: false,
      });
      if (!input.isActiveAndEditable()) return;
      if (input.getEditorSurfaceComposing()) {
        if (
          window.waywordMobileEditorCaretReveal &&
          typeof window.waywordMobileEditorCaretReveal.schedule === "function"
        ) {
          window.waywordMobileEditorCaretReveal.schedule(editorInput);
        }
        return;
      }
      input.flushEditorSurfaceIntoWriteDocOnce();
      if (typeof input.onEditorInputForEntryDelayHint === "function") {
        input.onEditorInputForEntryDelayHint();
      }
      if (typeof input.onEditorInputForTelemetry === "function") {
        input.onEditorInputForTelemetry();
      }
      input.tryStartTimerOnFirstMeaningfulInput();
      input.pulseWordmark();
      input.renderHighlight();
      input.renderSidebar();
      input.updateWordProgress();
      input.updateEnterButtonVisibility();
      input.scheduleSemanticPickerFromSelection();
      if (typeof input.renderMeta === "function") {
        input.renderMeta();
      }
      if (
        window.waywordMobileEditorCaretReveal &&
        typeof window.waywordMobileEditorCaretReveal.schedule === "function"
      ) {
        window.waywordMobileEditorCaretReveal.schedule(editorInput);
      }
    });

    editorInput.addEventListener("paste", function () {});

    var editorScrollSurface = input.editorInputScrollport || editorInput;
    editorScrollSurface.addEventListener(
      "scroll",
      function () {
        input.syncScroll();
        input.scheduleSemanticPickerFromSelection();
      },
      { passive: true }
    );

    editorInput.addEventListener("keydown", function (e) {
      var submitAttempted = false;
      var preventDefaultCalled = false;
      var markPreventDefault = function () {
        preventDefaultCalled = true;
        if (e && typeof e.preventDefault === "function") {
          e.preventDefault();
        }
      };
      if (
        input.completedUiRestartInteractions &&
        typeof input.completedUiRestartInteractions.handleEditorCompletedRestartKeydown === "function" &&
        input.completedUiRestartInteractions.handleEditorCompletedRestartKeydown(
          {
            state: input.state,
            runPostSubmitAutoNewRunNow: input.runPostSubmitAutoNewRunNow
          },
          e
        )
      ) {
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        if (shouldHandleMobileEnterAsNewline(input, editorInput, e, { assumeEditorWhenTargetMissing: true })) {
          if (e.__waywordMobileNewlineHandled === true) return;
          e.__waywordMobileNewlineHandled = true;
          var mobileInsertResult = insertMobileEditorNewlineAndRefresh(
            input,
            editorInput,
            e,
            debugTrace,
            "keydown-mobile"
          );
          preventDefaultCalled = mobileInsertResult.preventDefaultCalled;
          debugTrace.logEvent("keydown", e, {
            submitAttempted: false,
            preventDefaultCalled: preventDefaultCalled,
          });
          return;
        }
        if (e.isComposing || input.getEditorSurfaceComposing()) return;
        markPreventDefault();
        submitAttempted = true;
        trySubmitFromEditor(input);
      }

      debugTrace.logEvent("keydown", e, {
        submitAttempted: submitAttempted,
        preventDefaultCalled: preventDefaultCalled,
      });

      var moveCaretKeys = {
        ArrowDown: true,
        ArrowUp: true,
        ArrowLeft: true,
        ArrowRight: true,
        Home: true,
        End: true,
        PageUp: true,
        PageDown: true
      };
      if (
        moveCaretKeys[e.key] &&
        window.waywordMobileEditorCaretReveal &&
        typeof window.waywordMobileEditorCaretReveal.schedule === "function"
      ) {
        window.requestAnimationFrame(function () {
          window.waywordMobileEditorCaretReveal.schedule(editorInput);
        });
      }
    });

    editorInput.addEventListener("keyup", function (e) {
      debugTrace.logEvent("keyup", e, {
        submitAttempted: false,
        preventDefaultCalled: false,
      });
    });

    editorInput.addEventListener("beforeinput", function (e) {
      var submitAttempted = false;
      var preventDefaultCalled = false;
      debugTrace.logEvent("beforeinput", e, {
        submitAttempted: submitAttempted,
        preventDefaultCalled: preventDefaultCalled,
      });
      if (!detectMobileEditorContext(input)) return;
      var inputType = String(e && e.inputType ? e.inputType : "");
      if (inputType !== "insertLineBreak" && inputType !== "insertParagraph") return;
      if (e.isComposing || input.getEditorSurfaceComposing()) return;
      preventDefaultCalled = insertMobileEditorNewlineAndRefresh(
        input,
        editorInput,
        e,
        debugTrace,
        "beforeinput-mobile"
      ).preventDefaultCalled;
      return;
    });

    var captureDoc =
      (input.document && typeof input.document.addEventListener === "function" ? input.document : null) ||
      (editorInput.ownerDocument && typeof editorInput.ownerDocument.addEventListener === "function"
        ? editorInput.ownerDocument
        : null);
    if (captureDoc && editorInput.dataset.appMobileKeydownCaptureBound !== "1") {
      editorInput.dataset.appMobileKeydownCaptureBound = "1";
      captureDoc.addEventListener(
        "keydown",
        function (e) {
          if (!shouldHandleMobileEnterAsNewline(input, editorInput, e)) return;
          if (e.__waywordMobileNewlineHandled === true) return;
          e.__waywordMobileNewlineHandled = true;
          insertMobileEditorNewlineAndRefresh(input, editorInput, e, debugTrace, "keydown-capture-mobile");
        },
        true
      );
    }

    editorInput.addEventListener("pointerup", function () {
      if (
        window.waywordMobileEditorCaretReveal &&
        typeof window.waywordMobileEditorCaretReveal.schedule === "function"
      ) {
        window.waywordMobileEditorCaretReveal.schedule(editorInput);
      }
    });

    var selectionDoc =
      (editorInput.ownerDocument && typeof editorInput.ownerDocument.addEventListener === "function"
        ? editorInput.ownerDocument
        : null) ||
      (input.document && typeof input.document.addEventListener === "function" ? input.document : null);
    if (selectionDoc && editorInput.dataset.appEditorSelectionRevealBound !== "1") {
      editorInput.dataset.appEditorSelectionRevealBound = "1";
      selectionDoc.addEventListener("selectionchange", function () {
        debugTrace.logEvent("selectionchange", null, {
          submitAttempted: false,
          preventDefaultCalled: false,
          source: "bubble",
        });
        if (selectionDoc.activeElement !== editorInput) {
          return;
        }
        if (
          !window.waywordMobileEditorCaretReveal ||
          typeof window.waywordMobileEditorCaretReveal.scheduleFromSelectionChange !== "function"
        ) {
          return;
        }
        window.waywordMobileEditorCaretReveal.scheduleFromSelectionChange(editorInput);
      });
    }
  }

  function bindPromptCardRestart(input) {
    var promptCard = input.$("promptCard");
    if (!promptCard || promptCard.dataset.appPromptCardBound === "1") return;
    promptCard.dataset.appPromptCardBound = "1";
    promptCard.addEventListener("click", function (e) {
      var origin = input.domEventTargetElement(e);
      var skipCut = origin && origin.closest("[data-the-cut-skip]");
      if (skipCut) {
        e.preventDefault();
        var hint = skipCut.closest("[data-the-cut-hint]");
        if (hint && hint.parentNode) {
          hint.parentNode.removeChild(hint);
        }
        return;
      }
    });
  }

  function bindDocumentEvents(input) {
    var root = input.document.documentElement;
    if (root.dataset.appDocumentKeydownBound !== "1") {
      root.dataset.appDocumentKeydownBound = "1";
      input.document.addEventListener("keydown", function (e) {
        if (
          input.completedUiRestartInteractions &&
          typeof input.completedUiRestartInteractions.handleDocumentCompletedRestartKeydown === "function" &&
          input.completedUiRestartInteractions.handleDocumentCompletedRestartKeydown(
            {
              state: input.state,
              runPostSubmitAutoNewRunNow: input.runPostSubmitAutoNewRunNow
            },
            e
          )
        ) {
          return;
        }

        if (e.key !== "Escape") return;
        if (input.tryHandleEscapeForOptionsSurface()) {
          e.preventDefault();
          return;
        }
        if (input.tryHandleEscapeForRecentRunsSurfaces()) {
          e.preventDefault();
        }
      });
    }

    if (root.dataset.appDocumentPointerdownBound !== "1") {
      root.dataset.appDocumentPointerdownBound = "1";
      input.document.addEventListener("pointerdown", function (e) {
        if (
          !input.mobileEditorFocusGuard ||
          typeof input.mobileEditorFocusGuard.handleDocumentPointerDown !== "function"
        ) {
          return;
        }
        return input.mobileEditorFocusGuard.handleDocumentPointerDown(
          {
            editorInput: input.editorInput,
            isMobileViewport: input.isMobileViewport
          },
          e
        );
      });
    }
  }

  function bindPrimaryControls(input) {
    var beginBtn = input.$("beginBtn");
    if (beginBtn && beginBtn.dataset.appBeginBound !== "1") {
      beginBtn.dataset.appBeginBound = "1";
      beginBtn.addEventListener("click", function () {
        input.enterAppState({
          afterEnter: function () {
            input.scheduleDeferredEditorFocus("end");
          },
          dockFocusModeForMobile: false,
        });
        if (input.isMobileViewport() && !window.__WAYWORD_DEV_VISUAL_PROFILE) {
          input.setFocusMode(true);
        }
        input.startWriting({ deferEditorFocus: true });
        if (typeof input.bindEditorInputEvents === "function") {
          input.bindEditorInputEvents("begin-click");
        }
        if (typeof input.onBeginClicked === "function") {
          input.onBeginClicked({ source: "begin_button" });
        }
      });
    }

    var themeToggleInPanel = input.$("themeToggleInPanel");
    if (themeToggleInPanel && themeToggleInPanel.dataset.appControlBound !== "1") {
      themeToggleInPanel.dataset.appControlBound = "1";
      themeToggleInPanel.addEventListener("click", input.toggleTheme);
    }

    var styleTab = input.$("styleTab");
    if (styleTab && styleTab.dataset.appControlBound !== "1") {
      styleTab.dataset.appControlBound = "1";
      styleTab.addEventListener("pointerdown", function () {
        input.panelCoordination.armMobilePatternsToggleGuard({
          isMobileViewport: input.isMobileViewport,
          setSuppressFocusExitUntil: input.setSuppressFocusExitUntil,
          now: input.now,
          durationMs: 320
        });
      });
      styleTab.addEventListener("click", function () {
        input.panelCoordination.togglePatternsPanelFromStyleTab({
          $: input.$,
          showProfile: input.showProfile,
          source: "styleTab:click",
          logPatternsTransitionSnapshot: input.logPatternsTransitionSnapshot
        });
      });
      styleTab.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        input.panelCoordination.armMobilePatternsToggleGuard({
          isMobileViewport: input.isMobileViewport,
          setSuppressFocusExitUntil: input.setSuppressFocusExitUntil,
          now: input.now,
          durationMs: 320
        });
        input.panelCoordination.togglePatternsPanelFromStyleTab({
          $: input.$,
          showProfile: input.showProfile,
          source: "styleTab:key",
          key: e.key,
          logPatternsTransitionSnapshot: input.logPatternsTransitionSnapshot,
          skipTimeoutLog: true
        });
      });
    }

    var shuffleBtn = input.$("shuffleBtn");
    if (shuffleBtn && shuffleBtn.dataset.appControlBound !== "1") {
      shuffleBtn.dataset.appControlBound = "1";
      shuffleBtn.addEventListener("click", input.triggerShuffle);
    }

    var repeatLimitPill = input.$("repeatLimitPill");
    if (repeatLimitPill && repeatLimitPill.dataset.appControlBound !== "1") {
      repeatLimitPill.dataset.appControlBound = "1";
      repeatLimitPill.addEventListener("click", input.cycleRepeatLimit);
    }

    var enterSubmitBtn = input.$("enterSubmitBtn");
    if (enterSubmitBtn && enterSubmitBtn.dataset.appControlBound !== "1") {
      enterSubmitBtn.dataset.appControlBound = "1";
      enterSubmitBtn.addEventListener("click", function (e) {
        var debugTrace = createEditorInputDebugTrace(input, input.editorInput);
        var submitAttempted = false;
        var allowed =
          !(input.state && input.state.submitted) &&
          !(input.getEditorSurfaceComposing && input.getEditorSurfaceComposing()) &&
          !!input.editorInput &&
          input.getEditorText().trim().length > 0;
        if (allowed) {
          submitAttempted = true;
          input.submitWriting(false);
        }
        debugTrace.logEvent("submit-click", e, {
          submitAttempted: submitAttempted,
          preventDefaultCalled: false,
        });
      });
    }

    var saveBannedBtn = input.$("saveBannedBtn");
    if (saveBannedBtn && saveBannedBtn.dataset.appControlBound !== "1") {
      saveBannedBtn.dataset.appControlBound = "1";
      saveBannedBtn.addEventListener("click", input.saveBannedInline);
    }
  }

  function bindPanelControlWiring(input) {
    input.document.querySelectorAll("#wordModesPanel button[data-words]").forEach(function (btn) {
      if (btn.dataset.appPanelControlBound === "1") return;
      btn.dataset.appPanelControlBound = "1";
      btn.addEventListener("click", function () {
        input.applyWordTargetFromPanel(btn.dataset.words);
      });
    });

    input.document.querySelectorAll("#timeModesPanel button[data-time]").forEach(function (btn) {
      if (btn.dataset.appPanelControlBound === "1") return;
      btn.dataset.appPanelControlBound = "1";
      btn.addEventListener("click", function () {
        input.applyTimerFromPanel(btn.dataset.time);
      });
    });

    var shuffleBtnPanel = input.$("shuffleBtnPanel");
    if (shuffleBtnPanel && shuffleBtnPanel.dataset.appPanelControlBound !== "1") {
      shuffleBtnPanel.dataset.appPanelControlBound = "1";
      shuffleBtnPanel.addEventListener("click", input.triggerShuffle);
    }

    var bannedInlineInputPanel = input.$("bannedInlineInputPanel");
    if (bannedInlineInputPanel && bannedInlineInputPanel.dataset.appPanelControlBound !== "1") {
      bannedInlineInputPanel.dataset.appPanelControlBound = "1";
      bannedInlineInputPanel.addEventListener("input", input.scheduleBannedPanelPersistFromPanel);
      bannedInlineInputPanel.addEventListener("blur", function () {
        input.flushBannedPanelPersistFromPanel();
      });
    }
  }

  window.waywordAppEventsRuntime = {
    bindEditorInputEvents: bindEditorInputEvents,
    bindPromptCardRestart: bindPromptCardRestart,
    bindDocumentEvents: bindDocumentEvents,
    bindPrimaryControls: bindPrimaryControls,
    bindPanelControlWiring: bindPanelControlWiring
  };
})();

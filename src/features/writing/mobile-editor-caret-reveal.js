(function () {
  var mobileMq = null;
  var selectionRaf = 0;

  function narrowMobileWritingSurface() {
    if (!mobileMq) {
      mobileMq = window.matchMedia("(max-width: 720px)");
    }
    return mobileMq.matches;
  }

  function approxCaretBottom(editorInput) {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return null;
    }
    var r0 = sel.getRangeAt(0);
    if (!editorInput.contains(r0.startContainer)) {
      return null;
    }

    var rects = r0.getClientRects();
    if (rects && rects.length > 0) {
      return rects[rects.length - 1].bottom;
    }

    var br = r0.getBoundingClientRect();
    if (br.height > 1 || br.width > 0) {
      return br.bottom;
    }

    try {
      var r = r0.cloneRange();
      if (r.startContainer.nodeType === Node.TEXT_NODE) {
        var tn = r.startContainer;
        var off = r.startOffset;
        if (off > 0) {
          r.setStart(tn, off - 1);
          r.setEnd(tn, off);
        } else if (tn.textContent && tn.textContent.length > 0) {
          r.setEnd(tn, 1);
        } else {
          return br.bottom;
        }
        var rs = r.getClientRects();
        if (rs && rs.length > 0) {
          return rs[rs.length - 1].bottom;
        }
      }
    } catch (_) {}

    return br.bottom;
  }

  function overlayTopLimit(editorInput) {
    var shell = editorInput.closest(".editor-shell");
    if (!shell) {
      return null;
    }
    var top = Infinity;
    var chrome = shell.querySelector(".editor-bottom-chrome");
    if (chrome) {
      var r = chrome.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        top = Math.min(top, r.top);
      }
    }
    var enter = shell.querySelector(".enter-submit-btn");
    if (enter && !enter.classList.contains("hidden")) {
      var er = enter.getBoundingClientRect();
      if (er.width > 0 && er.height > 0) {
        top = Math.min(top, er.top);
      }
    }
    return top === Infinity ? null : top;
  }

  function revealCaretNow(editorInput) {
    if (!editorInput || document.activeElement !== editorInput) {
      return;
    }
    if (!narrowMobileWritingSurface()) {
      return;
    }

    var caretBottom = approxCaretBottom(editorInput);
    if (caretBottom == null || !Number.isFinite(caretBottom)) {
      return;
    }

    var limit = overlayTopLimit(editorInput);
    if (limit == null || !Number.isFinite(limit)) {
      return;
    }

    var margin = 6;
    if (caretBottom <= limit - margin) {
      return;
    }

    var delta = caretBottom - (limit - margin);
    var scrollRoot = editorInput.closest(".editor-input-scrollport") || editorInput;
    scrollRoot.scrollTop += delta;
    if (
      scrollRoot === editorInput &&
      window.waywordFlushEditorDotOverlaySync &&
      typeof window.waywordFlushEditorDotOverlaySync === "function"
    ) {
      window.waywordFlushEditorDotOverlaySync();
    }
  }

  function schedule(editorInput) {
    if (!editorInput || !narrowMobileWritingSurface()) {
      return;
    }
    window.requestAnimationFrame(function () {
      revealCaretNow(editorInput);
      revealCaretNow(editorInput);
    });
  }

  function scheduleFromSelectionChange(editorInput) {
    if (!editorInput || !narrowMobileWritingSurface()) {
      return;
    }
    if (document.activeElement !== editorInput) {
      return;
    }
    if (selectionRaf) {
      window.cancelAnimationFrame(selectionRaf);
    }
    selectionRaf = window.requestAnimationFrame(function () {
      selectionRaf = 0;
      revealCaretNow(editorInput);
    });
  }

  window.waywordMobileEditorCaretReveal = {
    schedule: schedule,
    revealNow: revealCaretNow,
    scheduleFromSelectionChange: scheduleFromSelectionChange,
    narrowMobileWritingSurface: narrowMobileWritingSurface
  };
})();

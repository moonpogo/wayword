(function () {
  var semanticPickerRaf = null;

  function scheduleSemanticPickerFromSelection(input) {
    if (semanticPickerRaf !== null) return;
    semanticPickerRaf = requestAnimationFrame(function () {
      semanticPickerRaf = null;
      input.updateEditorSemanticPickerFromSelection();
    });
  }

  function hideEditorSemanticPicker(input) {
    input.editorSemanticPicker && input.editorSemanticPicker.classList.add("hidden");
  }

  function updateEditorSemanticPickerFromSelection(input) {
    var picker = input.editorSemanticPicker;
    var editorInput = input.editorInput;
    if (!picker || !editorInput) return;

    if (!input.state.active || input.state.submitted || input.getEditorSurfaceComposing()) {
      picker.classList.add("hidden");
      return;
    }

    var tn = editorInput.firstChild;
    if (!tn || tn.nodeType !== Node.TEXT_NODE) {
      picker.classList.add("hidden");
      return;
    }

    if (tn.textContent !== input.serializeWriteDoc(input.state.writeDoc)) {
      picker.classList.add("hidden");
      return;
    }

    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorInput.contains(sel.anchorNode)) {
      picker.classList.add("hidden");
      return;
    }

    var offsets = input.getSelectionOffsetsForEditorRoot(editorInput);
    var start = Math.min(offsets.anchor, offsets.focus);
    var end = Math.max(offsets.anchor, offsets.focus);
    if (end <= start) {
      picker.classList.add("hidden");
      return;
    }

    var hit = input.findExactSingleTokenForCanonicalRange(input.state.writeDoc, start, end);
    if (!hit) {
      picker.classList.add("hidden");
      return;
    }

    var shell = document.querySelector(".editor-shell");
    if (!shell) {
      picker.classList.add("hidden");
      return;
    }

    try {
      var domRange = document.createRange();
      domRange.setStart(tn, start);
      domRange.setEnd(tn, end);
      var rect = domRange.getBoundingClientRect();
      if (rect.width < 1 && rect.height < 1) {
        picker.classList.add("hidden");
        return;
      }

      picker.dataset.lineIndex = String(hit.lineIndex);
      picker.dataset.tokenIndex = String(hit.tokenIndex);
      picker.classList.remove("hidden");

      var shellRect = shell.getBoundingClientRect();
      var shellW = shell.clientWidth;
      var shellH = shell.clientHeight;
      var pw = picker.offsetWidth;
      var ph = picker.offsetHeight;
      var margin = 6;

      var left = rect.left - shellRect.left + rect.width / 2 - pw / 2;
      left = Math.max(margin, Math.min(left, shellW - pw - margin));

      var top = rect.bottom - shellRect.top + 5;
      if (top + ph > shellH - margin) {
        top = rect.top - shellRect.top - ph - 5;
      }
      top = Math.max(margin, Math.min(top, shellH - ph - margin));

      picker.style.left = String(left) + "px";
      picker.style.top = String(top) + "px";
    } catch (_err) {
      picker.classList.add("hidden");
    }
  }

  function bindEditorSemanticPicker(input) {
    var picker = input.editorSemanticPicker;
    if (!picker || picker.dataset.semanticPickerBound === "1") return;
    picker.dataset.semanticPickerBound = "1";

    picker.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });

    picker.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-semantic-choice]");
      if (!btn) return;
      e.stopPropagation();
      var choice = btn.getAttribute("data-semantic-choice");
      var li = Number(picker.dataset.lineIndex);
      var ti = Number(picker.dataset.tokenIndex);
      if (!Number.isInteger(li) || !Number.isInteger(ti)) return;
      var tokensRow = input.state.writeDoc && input.state.writeDoc.lines && input.state.writeDoc.lines[li] && input.state.writeDoc.lines[li].tokens;
      var tok = tokensRow && tokensRow[ti];
      if (!tok) return;

      if (choice === "clear") {
        input.setSemanticFlagsOnToken(li, ti, []);
      } else if (input.semanticFlagIds.includes(choice)) {
        var cur = input.getOrderedSemanticFlagsForToken(tok);
        var nextSet = new Set(cur);
        if (nextSet.has(choice)) nextSet.delete(choice);
        else nextSet.add(choice);
        var next = input.semanticFlagIds.filter(function (id) {
          return nextSet.has(id);
        });
        input.setSemanticFlagsOnToken(li, ti, next);
      } else {
        return;
      }
      hideEditorSemanticPicker(input);
      input.scheduleEditorDotOverlaySync();
      input.renderAnnotationRow();
      input.renderSidebar();
    });

    document.addEventListener("selectionchange", function () {
      scheduleSemanticPickerFromSelection(input);
    });
  }

  function bindAnnotationRowFlagInteraction(input) {
    var row = input.$("annotationRow");
    if (!row || row.dataset.flagInteractionBound === "1") return;
    row.dataset.flagInteractionBound = "1";

    row.addEventListener(
      "pointerdown",
      function (e) {
        var slot = e.target.closest(".annotation-slot[data-line-index]");
        if (!slot || !input.state.active || input.state.submitted) return;
        if (input.getEditorSurfaceComposing()) return;
        if (input.editorInput && document.activeElement === input.editorInput) {
          input.setAnnotationRowPendingEditorSel(
            input.getSelectionOffsetsForEditorRoot(input.editorInput)
          );
        } else {
          input.setAnnotationRowPendingEditorSel(null);
        }
      },
      true
    );

    function finishToggleFromSlot(slot) {
      if (!slot || input.getEditorSurfaceComposing()) return;
      var li = Number(slot.dataset.lineIndex);
      var ti = Number(slot.dataset.tokenIndex);
      if (!Number.isInteger(li) || !Number.isInteger(ti)) return;
      var pending = input.getAnnotationRowPendingEditorSel();
      input.setAnnotationRowPendingEditorSel(null);
      input.cycleAnnotationSemanticFlag(li, ti);
      input.renderAnnotationRow();
      if (input.editorInput) {
        input.editorInput.focus({ preventScroll: true });
        if (pending) {
          input.setSelectionOffsetsForEditorRoot(
            input.editorInput,
            pending.anchor,
            pending.focus,
            pending.backward
          );
        }
      }
      input.scheduleEditorDotOverlaySync();
      scheduleSemanticPickerFromSelection(input);
      input.renderSidebar();
    }

    row.addEventListener("click", function (e) {
      var slot = e.target.closest(".annotation-slot[data-line-index]");
      if (!slot || !input.state.active || input.state.submitted) return;
      if (input.getEditorSurfaceComposing()) return;
      e.preventDefault();
      finishToggleFromSlot(slot);
    });
  }

  window.waywordSemanticPickerInteractions = {
    scheduleSemanticPickerFromSelection: scheduleSemanticPickerFromSelection,
    hideEditorSemanticPicker: hideEditorSemanticPicker,
    updateEditorSemanticPickerFromSelection: updateEditorSemanticPickerFromSelection,
    bindEditorSemanticPicker: bindEditorSemanticPicker,
    bindAnnotationRowFlagInteraction: bindAnnotationRowFlagInteraction
  };
})();

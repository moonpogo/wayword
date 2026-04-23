(function () {
  function focusEditorToOffset(editorInput, offset) {
    if (!editorInput) return;

    editorInput.focus({ preventScroll: true });

    var tn = editorInput.firstChild;
    if (!tn || tn.nodeType !== Node.TEXT_NODE) return;

    var selection = window.getSelection();
    var range = document.createRange();
    range.setStart(tn, Math.max(0, Math.min(offset, tn.textContent.length)));
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function focusEditorToEnd(editorInput) {
    var tn = editorInput && editorInput.firstChild;
    var len = tn && tn.nodeType === Node.TEXT_NODE ? tn.textContent.length : 0;
    focusEditorToOffset(editorInput, len);
  }

  function focusEditorToStart(editorInput) {
    focusEditorToOffset(editorInput, 0);
  }

  function scheduleDeferredEditorFocus(input) {
    var focusCaret = input && input.focusCaret === "start" ? "start" : "end";
    setTimeout(function () {
      if (focusCaret === "start") {
        focusEditorToStart(input.editorInput);
      } else {
        focusEditorToEnd(input.editorInput);
      }
    }, 50);
  }

  window.waywordEditorFocusPresentation = {
    focusEditorToEnd: focusEditorToEnd,
    focusEditorToStart: focusEditorToStart,
    scheduleDeferredEditorFocus: scheduleDeferredEditorFocus
  };
})();

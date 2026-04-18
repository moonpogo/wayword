(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  window.waywordDomElements = {
    resolveCore() {
      return {
        input: document.querySelector('.editor-input'),
        editorInput: byId("editorInput"),
        editorDotOverlay: byId("editorDotOverlay"),
        editorSemanticPicker: byId("editorSemanticPicker"),
        highlightLayer: byId("highlightLayer"),
        wordmark: byId("wordmark"),
      };
    },
    resolveEditorShell() {
      return {
        editorShell: document.querySelector(".editor-shell"),
      };
    },
  };
})();

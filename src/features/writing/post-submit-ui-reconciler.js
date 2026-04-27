(function () {
  /**
   * Generic post-submit UI reconciliation shared across submit outcomes.
   * Ordering is intentionally explicit and preserved from `run-controller.js`:
   * 1. Refresh writing state with post-run overlay sync enabled.
   * 2. Refresh meta.
   * 3. Refresh sidebar.
   * 4. Queue viewport sync.
   * 5. Pulse the editor shell completion state.
   */
  function reconcilePostSubmitUi(input) {
    if (!input || typeof input !== "object") {
      throw new Error("waywordPostSubmitUiReconciler.reconcilePostSubmitUi: input is required");
    }
    if (typeof input.renderWritingState !== "function") {
      throw new Error("waywordPostSubmitUiReconciler.reconcilePostSubmitUi: renderWritingState is required");
    }
    if (typeof input.renderMeta !== "function") {
      throw new Error("waywordPostSubmitUiReconciler.reconcilePostSubmitUi: renderMeta is required");
    }
    if (typeof input.renderSidebar !== "function") {
      throw new Error("waywordPostSubmitUiReconciler.reconcilePostSubmitUi: renderSidebar is required");
    }
    if (typeof input.queueViewportSync !== "function") {
      throw new Error("waywordPostSubmitUiReconciler.reconcilePostSubmitUi: queueViewportSync is required");
    }
    if (typeof input.pulseEditorShellAfterSubmit !== "function") {
      throw new Error("waywordPostSubmitUiReconciler.reconcilePostSubmitUi: pulseEditorShellAfterSubmit is required");
    }

    input.renderWritingState({ deferPostRunOverlaySync: false });
    input.renderMeta();
    input.renderSidebar();
    if (typeof input.requestMirrorReflectionAttentionSettle === "function") {
      input.requestMirrorReflectionAttentionSettle();
    }
    input.queueViewportSync();
    input.pulseEditorShellAfterSubmit();
  }

  window.waywordPostSubmitUiReconciler = {
    reconcilePostSubmitUi: reconcilePostSubmitUi,
  };
})();

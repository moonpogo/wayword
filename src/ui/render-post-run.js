(function () {
  function $id(id) {
    return document.getElementById(id);
  }

  function isMobileViewport() {
    return window.matchMedia("(max-width: 720px)").matches;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * Recent-pattern block for post-run (V1.1). Returns "" when pipeline unavailable, errors, or no trends.
   * @param {unknown[]} sessionDigests
   * @param {string} idPrefix
   */
  function buildMirrorRecentTrendsBlockHtml(sessionDigests, idPrefix) {
    if (!window.waywordMirrorController.mirrorRecentTrendsPipelineAvailable()) return "";
    let result;
    try {
      result = window.waywordMirrorController.runMirrorRecentTrendsPipeline(sessionDigests);
    } catch (_) {
      return "";
    }
    if (!result || !Array.isArray(result.trends) || result.trends.length === 0) {
      return "";
    }

    const rows = result.trends.filter((t) => t && String(t.statement || "").trim());
    if (!rows.length) {
      return "";
    }

    return globalThis.WaywordMirrorDom.buildMirrorRecentTrendsBlockBodyHtml(rows, idPrefix);
  }

  /**
   * Same HTML parts post-run mirror panel uses (V1 body + next-pass nudge + recent trends).
   * @param {{
   *   submitted: boolean;
   *   completedUiActive: boolean;
   *   lastMirrorLoadFailed: unknown;
   *   lastMirrorPipelineResult: unknown;
   *   mirrorEmptyFallbackSeed: unknown;
   *   sessionDigestsForTrends: unknown[];
   * }} input
   */
  function computeMirrorPostRunPanelParts(input) {
    if (!input.submitted || !input.completedUiActive) {
      return { v1Body: "", recentBody: "", nextPassHtml: "" };
    }
    const v1Body = globalThis.WaywordMirrorDom.buildMirrorPanelBodyHtml({
      loadFailed: input.lastMirrorLoadFailed,
      result: input.lastMirrorPipelineResult,
      idPrefix: "mirror-postrun",
      emptyHintSeed: input.mirrorEmptyFallbackSeed
    });
    const recentBody = buildMirrorRecentTrendsBlockHtml(
      input.sessionDigestsForTrends,
      "mirror-postrun-recent"
    );

    let nextPassHtml = "";
    if (v1Body) {
      const mirror = globalThis.WaywordMirror;
      const line =
        mirror && typeof mirror.nextPassInstructionFromMirrorPipelineResult === "function"
          ? mirror.nextPassInstructionFromMirrorPipelineResult(
              input.lastMirrorPipelineResult,
              input.lastMirrorLoadFailed
            )
          : "Write it again. Change one thing.";
      const esc = escapeHtml(String(line || "").trim() || "Write it again. Change one thing.");
      nextPassHtml = `<button type="button" class="mirror-next-pass-nudge" data-mirror-next-pass="1" aria-label="Start another pass with the same prompt">${esc}</button>`;
    }

    return { v1Body, recentBody, nextPassHtml };
  }

  /**
   * Calibration card markup for the in-editor post-submit overlay (runs 1–5).
   * @param {{ step: number; observation: string; insufficient: boolean }} opts
   */
  function buildCalibrationPostRunOverlayCardHtml(opts) {
    const calibrationThreshold = Number(window.waywordConfig.CALIBRATION_THRESHOLD) || 5;
    const step = Number(opts.step) || 0;
    const observation = String(opts.observation || "");
    const insufficient = Boolean(opts.insufficient);
    const pct = Math.min(100, Math.round((step / calibrationThreshold) * 100));
    const mod = insufficient ? " editor-overlay-calibration--insufficient" : "";
    return `
      <div class="editor-overlay-calibration${mod}" role="dialog" aria-labelledby="editorCalibProgress">
        <div class="editor-overlay-calibration-head">
          <span class="editor-overlay-calibration-label">Finding your baseline</span>
          <span id="editorCalibProgress" class="editor-overlay-calibration-progress">${step} of ${calibrationThreshold}</span>
        </div>
        <div class="editor-overlay-calibration-meter-wrap">
          <div class="editor-overlay-calibration-meter" role="presentation">
            <div class="editor-overlay-calibration-meter-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <p class="editor-overlay-calibration-observation" aria-live="polite">${escapeHtml(observation)}</p>
      </div>`;
  }

  /** #feedbackBox: kept empty; post-run calibration uses the in-editor overlay. */
  function resetPostRunFeedbackBox() {
    const fb = $id("feedbackBox");
    if (!fb) return;
    fb.dataset.calibrationRenderKey = "";
    fb.className = "result-card empty";
    fb.innerHTML = "";
  }

  function renderReflectionLine(text) {
    const el = document.getElementById("reflection-line");
    const editorLine = $id("editorPostRunLine");
    const trimmed = String(text || "").trim();
    const useEditorSlot =
      isMobileViewport() &&
      document.body.classList.contains("focus-mode") &&
      editorLine;

    if (useEditorSlot) {
      if (el) {
        el.textContent = "";
        el.classList.add("reflection-line--hidden");
        el.setAttribute("aria-hidden", "true");
      }
      if (!trimmed) {
        editorLine.textContent = "";
        editorLine.classList.add("editor-post-run-line--empty");
        editorLine.setAttribute("aria-hidden", "true");
      } else {
        editorLine.textContent = trimmed;
        editorLine.classList.remove("editor-post-run-line--empty");
        editorLine.setAttribute("aria-hidden", "false");
      }
      return;
    }

    if (editorLine) {
      editorLine.textContent = "";
      editorLine.classList.add("editor-post-run-line--empty");
      editorLine.setAttribute("aria-hidden", "true");
    }

    if (!el) return;

    if (!trimmed) {
      el.textContent = "";
      el.classList.add("reflection-line--hidden");
      el.setAttribute("aria-hidden", "true");
      return;
    }

    el.textContent = trimmed;
    el.classList.remove("reflection-line--hidden");
    el.setAttribute("aria-hidden", "false");
  }

  /**
   * Post-run Mirror stack: visibility + innerHTML only (evidence toggles wired by script.js).
   * @param {{
   *   sectionEl: HTMLElement;
   *   rootEl: HTMLElement;
   *   submitted: boolean;
   *   completedUiActive: boolean;
   *   v1Body: string;
   *   recentBody: string;
   *   nextPassHtml: string;
   * }} opts
   * @returns {{ shouldWireEvidence: boolean }}
   */
  function updateMirrorReflectionSection(opts) {
    const { sectionEl, rootEl, submitted, completedUiActive, v1Body, recentBody, nextPassHtml } =
      opts;

    if (!submitted || !completedUiActive) {
      sectionEl.classList.add("hidden");
      rootEl.innerHTML = "";
      return { shouldWireEvidence: false };
    }

    if (!v1Body && !recentBody) {
      sectionEl.classList.add("hidden");
      rootEl.innerHTML = "";
      return { shouldWireEvidence: false };
    }

    sectionEl.classList.remove("hidden");
    rootEl.innerHTML = (v1Body || "") + (nextPassHtml || "") + recentBody;
    return { shouldWireEvidence: true };
  }

  window.waywordPostRunRenderer = {
    buildMirrorRecentTrendsBlockHtml,
    computeMirrorPostRunPanelParts,
    buildCalibrationPostRunOverlayCardHtml,
    resetPostRunFeedbackBox,
    renderReflectionLine,
    updateMirrorReflectionSection
  };
})();

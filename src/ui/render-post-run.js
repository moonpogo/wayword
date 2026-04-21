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

  /** Conservative: too little surface text to treat mirror output as grounded observation. */
  function isLowSignalMirrorSubmission(text) {
    const normalized = String(text || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!normalized) return true;
    const tokens = normalized.split(" ").filter(Boolean);
    if (normalized.length < 18) return true;
    if (tokens.length <= 1 && normalized.length <= 36) return true;
    return false;
  }

  var LOW_SIGNAL_REFLECTION_BODY_HTML =
    '<div class="mirror-reflection-eyebrow">Reflection</div>' +
    '<p class="mirror-empty mirror-empty--low-signal">Not enough language yet to notice a pattern.</p>';

  function mirrorPostRunHasSubstantiveMain(result) {
    const r = result;
    if (!r || typeof r !== "object") return false;
    const main = r.main;
    if (!main || !String(main.statement || "").trim()) return false;
    if (main.category === "fallback") return false;
    return true;
  }

  /**
   * Same predicate as the low-signal reflection swap: short text and weak/absent mirror grounding.
   * Used for Nudge v2 so the under-prompt line does not overclaim when the mirror is thin.
   * @param {string} textForSignal
   * @param {unknown} lastMirrorPipelineResult
   * @param {unknown} lastMirrorLoadFailed
   */
  function computeMirrorAttentionalNudgeLowSignal(textForSignal, lastMirrorPipelineResult, lastMirrorLoadFailed) {
    if (lastMirrorLoadFailed) return false;
    const main = lastMirrorPipelineResult && lastMirrorPipelineResult.main;
    if (main && main.category === "low_signal") return true;
    const text = textForSignal != null ? String(textForSignal) : "";
    const hasCards = globalThis.WaywordMirrorDom.mirrorPipelineResultHasEvidenceCards(
      lastMirrorPipelineResult
    );
    const substantiveMain = mirrorPostRunHasSubstantiveMain(lastMirrorPipelineResult);
    return isLowSignalMirrorSubmission(text) && (!hasCards || !substantiveMain);
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
   * Same HTML parts post-run mirror panel uses (V1 body + recent trends; next-pass HTML is separate).
   * @param {{
   *   submitted: boolean;
   *   completedUiActive: boolean;
   *   lastMirrorLoadFailed: unknown;
   *   lastMirrorPipelineResult: unknown;
   *   mirrorEmptyFallbackSeed: unknown;
   *   sessionDigestsForTrends: unknown[];
   *   submittedRunText?: string;
   *   promptFamily?: string;
   * }} input
   */
  function computeMirrorPostRunPanelParts(input) {
    if (!input.submitted || !input.completedUiActive) {
      return { v1Body: "", recentBody: "", nextPassHtml: "" };
    }
    let v1Body = globalThis.WaywordMirrorDom.buildMirrorPanelBodyHtml({
      loadFailed: input.lastMirrorLoadFailed,
      result: input.lastMirrorPipelineResult,
      idPrefix: "mirror-postrun",
      emptyHintSeed: input.mirrorEmptyFallbackSeed
    });
    const recentBody = buildMirrorRecentTrendsBlockHtml(
      input.sessionDigestsForTrends,
      "mirror-postrun-recent"
    );

    const textForSignal = input.submittedRunText != null ? input.submittedRunText : "";
    const hasCards = globalThis.WaywordMirrorDom.mirrorPipelineResultHasEvidenceCards(
      input.lastMirrorPipelineResult
    );
    const substantiveMain = mirrorPostRunHasSubstantiveMain(input.lastMirrorPipelineResult);
    const attentionalLowSignal = computeMirrorAttentionalNudgeLowSignal(
      textForSignal,
      input.lastMirrorPipelineResult,
      input.lastMirrorLoadFailed
    );
    const useLowSignalReflection =
      !input.lastMirrorLoadFailed &&
      isLowSignalMirrorSubmission(textForSignal) &&
      (!hasCards || !substantiveMain);
    if (useLowSignalReflection && v1Body) {
      v1Body = LOW_SIGNAL_REFLECTION_BODY_HTML;
    }

    let nextPassHtml = "";
    if (v1Body) {
      const mirror = globalThis.WaywordMirror;
      const fallbackLine =
        mirror && mirror.MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION != null
          ? String(mirror.MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION)
          : "What stands out in the draft you just wrote?";
      const submissionWordCount =
        mirror && typeof mirror.tokenizeText === "function"
          ? mirror.tokenizeText(String(textForSignal || "")).length
          : String(textForSignal || "")
              .trim()
              .split(/\s+/)
              .filter(Boolean).length;
      const line =
        mirror && typeof mirror.nextPassInstructionFromMirrorPipelineResult === "function"
          ? mirror.nextPassInstructionFromMirrorPipelineResult(
              input.lastMirrorPipelineResult,
              input.lastMirrorLoadFailed,
              {
                promptFamily: input.promptFamily,
                lowSignal: attentionalLowSignal,
                seed: input.mirrorEmptyFallbackSeed,
                submissionWordCount
              }
            )
          : fallbackLine;
      const esc = escapeHtml(String(line || "").trim() || fallbackLine);
      nextPassHtml = `<button type="button" class="mirror-next-pass-nudge" data-mirror-next-pass="1" aria-label="Begin a new writing run">${esc}</button>`;
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
   * }} opts
   * @returns {{ shouldWireEvidence: boolean }}
   */
  function updateMirrorReflectionSection(opts) {
    const { sectionEl, rootEl, submitted, completedUiActive, v1Body, recentBody } = opts;

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
    rootEl.innerHTML = (v1Body || "") + recentBody;
    return { shouldWireEvidence: true };
  }

  /**
   * Continuation / next-pass control: lives under the prompt (not inside the reflection stack).
   * @param {{
   *   submitted: boolean;
   *   completedUiActive: boolean;
   *   nextPassHtml: string;
   * }} opts
   */
  function updateMirrorNextPassSlot(opts) {
    const slot = $id("mirrorNextPassSlot");
    if (!slot) return;
    const html = String(opts.nextPassHtml || "").trim();
    if (!opts.submitted || !opts.completedUiActive || !html) {
      slot.innerHTML = "";
      slot.classList.add("hidden");
      slot.setAttribute("aria-hidden", "true");
      return;
    }
    slot.innerHTML = html;
    slot.classList.remove("hidden");
    slot.setAttribute("aria-hidden", "false");
  }

  window.waywordPostRunRenderer = {
    buildMirrorRecentTrendsBlockHtml,
    computeMirrorAttentionalNudgeLowSignal,
    computeMirrorPostRunPanelParts,
    buildCalibrationPostRunOverlayCardHtml,
    resetPostRunFeedbackBox,
    renderReflectionLine,
    updateMirrorReflectionSection,
    updateMirrorNextPassSlot
  };
})();

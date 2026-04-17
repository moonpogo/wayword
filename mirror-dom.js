/**
 * Pure mirror reflection card / stack HTML helpers (no state, no engine, no DOM wiring).
 * Loaded before script.js; consumed via globalThis.WaywordMirrorDom.
 */
(function () {
  "use strict";

  function escapeHtmlMirror(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var MIRROR_EMPTY_FALLBACK_LINES = [
    "A clean pass. Try pushing one element further.",
    "Nothing strong yet. Lean harder in one direction.",
    "Even a small shift would give this shape.",
    "Pick one thing and exaggerate it."
  ];

  function pickMirrorEmptyFallbackLine(seed) {
    var s = seed != null ? String(seed) : "";
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    var lines = MIRROR_EMPTY_FALLBACK_LINES;
    return lines[h % lines.length];
  }

  function renderMirrorEvidenceLinesHtml(evidence) {
    if (!Array.isArray(evidence) || !evidence.length) {
      return '<p class="mirror-card__evidence-line mirror-card__evidence-line--muted">Nothing quoted from this run for this line.</p>';
    }
    return evidence
      .map((ev) => {
        const t = escapeHtmlMirror(ev && ev.text != null ? ev.text : "");
        return `<p class="mirror-card__evidence-line">${t}</p>`;
      })
      .join("");
  }

  function mirrorReflectionCardHtml(card, opts) {
    const role = opts && opts.role === "main" ? "main" : "support";
    const firstSupport = Boolean(opts && opts.firstSupportInSupportOnlyStack);
    const stmt = escapeHtmlMirror(card.statement);
    let cls = "mirror-card";
    if (role === "main") cls += " mirror-card--main";
    else {
      cls += " mirror-card--support";
      if (firstSupport) cls += " mirror-card--support-first";
    }
    return `<article class="${cls}"><p class="mirror-card__statement">${stmt}</p></article>`;
  }

  function buildMirrorPanelBodyHtml({ loadFailed, result, idPrefix, emptyHintSeed }) {
    const pfx = String(idPrefix || "mirror");
    if (loadFailed) {
      return '<p class="mirror-empty">Reflection isn\u2019t available in this build.</p>';
    }
    const r = result;
    if (!r || typeof r !== "object") {
      return "";
    }
    const main = r.main;
    const supporting = Array.isArray(r.supporting) ? r.supporting : [];
    const hasMain = Boolean(main && String(main.statement || "").trim());
    const hasSupport = supporting.some((c) => c && String(c.statement || "").trim());

    if (!hasMain && !hasSupport) {
      const line = escapeHtmlMirror(pickMirrorEmptyFallbackLine(emptyHintSeed));
      return '<p class="mirror-empty">' + line + "</p>";
    }

    const parts = [];
    parts.push('<div class="mirror-reflection-eyebrow">Reflection</div>');
    const stackClass =
      "mirror-stack" + (!hasMain && hasSupport ? " mirror-stack--support-only" : "");
    parts.push(`<div class="${stackClass}">`);
    if (hasMain) {
      parts.push(
        mirrorReflectionCardHtml(main, {
          role: "main",
          evidencePanelId: `${pfx}-main`
        })
      );
    }
    supporting.forEach((c, i) => {
      if (!c || !String(c.statement || "").trim()) return;
      parts.push(
        mirrorReflectionCardHtml(c, {
          role: "support",
          firstSupportInSupportOnlyStack: !hasMain && i === 0,
          evidencePanelId: `${pfx}-s-${i}`
        })
      );
    });
    parts.push("</div>");
    return parts.join("");
  }

  /** True when the pipeline has at least one reflection card (headline present). */
  function mirrorPipelineResultHasEvidenceCards(result) {
    const r = result;
    if (!r || typeof r !== "object") return false;
    const main = r.main;
    const supporting = Array.isArray(r.supporting) ? r.supporting : [];
    const hasMain = Boolean(main && String(main.statement || "").trim());
    const hasSupport = supporting.some((c) => c && String(c.statement || "").trim());
    return hasMain || hasSupport;
  }

  function countMirrorReflectionCards(result) {
    const r = result;
    if (!r || typeof r !== "object") return 0;
    const main = r.main;
    const supporting = Array.isArray(r.supporting) ? r.supporting : [];
    let n = 0;
    if (main && String(main.statement || "").trim()) n += 1;
    supporting.forEach((c) => {
      if (c && String(c.statement || "").trim()) n += 1;
    });
    return n;
  }

  /**
   * Review Runs only: one strongest reflection (main if present, else first supporting)
   * plus a non-interactive depth hint when more cards exist. Full stacks stay on post-run / Patterns.
   */
  function buildReviewRunsMirrorGlanceBodyHtml({ result, idPrefix, emptyHintSeed }) {
    const pfx = String(idPrefix || "mirror");
    const r = result;
    if (!r || typeof r !== "object") {
      const line0 = escapeHtmlMirror(pickMirrorEmptyFallbackLine(emptyHintSeed));
      return '<p class="mirror-empty">' + line0 + "</p>";
    }
    const main = r.main;
    const supporting = Array.isArray(r.supporting) ? r.supporting : [];
    const hasMain = Boolean(main && String(main.statement || "").trim());
    let card = null;
    let role = "support";
    let firstSupportInSupportOnlyStack = false;
    if (hasMain) {
      card = main;
      role = "main";
    } else {
      const idx = supporting.findIndex((c) => c && String(c.statement || "").trim());
      if (idx >= 0) {
        card = supporting[idx];
        firstSupportInSupportOnlyStack = true;
      }
    }
    if (!card) {
      const line1 = escapeHtmlMirror(pickMirrorEmptyFallbackLine(emptyHintSeed));
      return '<p class="mirror-empty">' + line1 + "</p>";
    }
    const total = countMirrorReflectionCards(r);
    const moreCount = Math.max(0, total - 1);
    const parts = [];
    parts.push('<div class="mirror-reflection-eyebrow">Reflection</div>');
    const stackClass =
      "mirror-stack mirror-stack--glance-one" +
      (!hasMain ? " mirror-stack--support-only" : "");
    parts.push(`<div class="${stackClass}">`);
    parts.push(
      mirrorReflectionCardHtml(card, {
        role,
        firstSupportInSupportOnlyStack,
        evidencePanelId: `${pfx}-glance`
      })
    );
    if (moreCount > 0) {
      parts.push(
        `<p class="recent-entry-reflection-depth">${escapeHtmlMirror(`+${moreCount} more`)}</p>`
      );
    }
    parts.push("</div>");
    return parts.join("");
  }

  /**
   * Post-run “Across recent runs” block: markup for pre-filtered trend rows only (no pipeline/history).
   */
  function buildMirrorRecentTrendsBlockBodyHtml(rows, idPrefix) {
    const pfx = String(idPrefix || "mirror-recent");
    const parts = [];
    parts.push('<div class="mirror-recent-block">');
    parts.push(
      '<div class="mirror-reflection-eyebrow mirror-recent-pattern-eyebrow">Across recent runs</div>'
    );
    parts.push('<div class="mirror-stack mirror-stack--recent mirror-stack--support-only">');
    rows.forEach((t, i) => {
      parts.push(
        mirrorReflectionCardHtml(
          { statement: t.statement, evidence: t.evidence },
          {
            role: "support",
            firstSupportInSupportOnlyStack: i === 0,
            evidencePanelId: `${pfx}-t-${i}`
          }
        )
      );
    });
    parts.push("</div></div>");
    return parts.join("");
  }

  globalThis.WaywordMirrorDom = {
    escapeHtmlMirror,
    renderMirrorEvidenceLinesHtml,
    mirrorReflectionCardHtml,
    buildMirrorPanelBodyHtml,
    mirrorPipelineResultHasEvidenceCards,
    countMirrorReflectionCards,
    buildReviewRunsMirrorGlanceBodyHtml,
    buildMirrorRecentTrendsBlockBodyHtml
  };
})();

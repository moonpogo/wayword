(function () {
  function mirrorPipelineResultHasEvidenceCards(result) {
    return globalThis.WaywordMirrorDom.mirrorPipelineResultHasEvidenceCards(result);
  }

  function buildReviewRunsMirrorGlanceBodyHtml(args) {
    return globalThis.WaywordMirrorDom.buildReviewRunsMirrorGlanceBodyHtml(args);
  }

  function reviewRunSentenceCount(text) {
    return String(text || "")
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean).length;
  }

  function buildReviewRunReflectionLines(run) {
    const aspects = new Set();
    const candidates = [];
    const cfg = window.waywordConfig;
    const wc = Math.max(0, Number(run.wordCount) || Number(run.words) || 0);
    if (wc < cfg.REVIEW_RUN_MIN_WORDS) {
      return ["No strong patterns surfaced in this run."];
    }

    const repeated = Array.isArray(run.repeatedWords) ? run.repeatedWords : [];
    let bestRep = null;
    for (const row of repeated) {
      if (!Array.isArray(row) || row.length < 2) continue;
      const display = String(row[0] || "").trim();
      const c = Number(row[1]);
      if (!display || !Number.isFinite(c)) continue;
      const nw = normalizeWord(display);
      if (!nw || cfg.REVIEW_RUN_DULL_REPEATS.has(nw)) continue;
      const len = nw.length;
      const strong = (len >= 5 && c >= 3) || (len >= 4 && c >= 5);
      if (!strong) continue;
      if (!bestRep || c > bestRep.c || (c === bestRep.c && len > bestRep.len)) {
        bestRep = { display, c, len };
      }
    }
    if (bestRep) {
      candidates.push({
        aspect: "repetition",
        line: `“${bestRep.display}” appears repeatedly across the run.`,
      });
    }

    const starters = Array.isArray(run.repeatedStarters) ? run.repeatedStarters : [];
    let openingMax = 0;
    for (const row of starters) {
      if (!Array.isArray(row) || row.length < 2) continue;
      const c = Number(row[1]);
      if (Number.isFinite(c)) openingMax = Math.max(openingMax, c);
    }
    if (openingMax >= 3) {
      candidates.push({ aspect: "openings", line: "Several sentences begin the same way." });
    }

    const text = String(run.text != null && run.text !== "" ? run.text : run.body || "");
    const sc = reviewRunSentenceCount(text);
    const avg = Number(run.avgSentenceLength);
    if (wc >= 35 && sc >= 5 && Number.isFinite(avg) && avg > 0 && avg <= 12) {
      candidates.push({
        aspect: "structure",
        line: "The writing leans toward short, contained sentences.",
      });
    }

    const fillerHits = Array.isArray(run.bannedHits)
      ? run.bannedHits.reduce((sum, h) => sum + (h && !h.isExercise ? Number(h.count) || 0 : 0), 0)
      : Math.max(0, Number(run.fillerCount) || 0);
    const per100Filler = (fillerHits / wc) * 100;
    if (fillerHits >= 6 || per100Filler >= 5) {
      candidates.push({
        aspect: "language",
        line: "The language stays mostly functional, with few concrete images.",
      });
    }

    const out = [];
    for (const c of candidates) {
      if (aspects.has(c.aspect)) continue;
      aspects.add(c.aspect);
      out.push(c.line);
      if (out.length >= cfg.REVIEW_RUN_REFLECTION_MAX) break;
    }

    if (out.length === 0) {
      return ["No strong patterns surfaced in this run."];
    }
    return out;
  }

  function formatReviewRunReflectionGlanceHtml(lines, idPrefix) {
    const pfx = String(idPrefix || "mirror-review");
    const safe = Array.isArray(lines) ? lines.map((s) => String(s || "").trim()).filter(Boolean) : [];
    const bodyLines =
      safe.length > 0 ? safe : ["No strong patterns surfaced in this run."];
    const primary = bodyLines[0];
    const moreCount = bodyLines.length - 1;
    const depth =
      moreCount > 0
        ? `<p class="recent-entry-reflection-depth">${escapeHtmlMirror(`+${moreCount} more`)}</p>`
        : "";
    return (
      `<div class="recent-entry-mirror-root recent-entry-mirror recent-entry-mirror--glance recent-entry-reflection-lines">` +
      `<div class="mirror-reflection-eyebrow">Reflection</div>` +
      `<div class="recent-entry-reflection-line-stack recent-entry-reflection-line-stack--single">` +
      `<p class="recent-entry-reflection-line" id="${pfx}-line-0">${escapeHtmlMirror(primary)}</p>` +
      depth +
      `</div>` +
      `</div>`
    );
  }

  function formatRecentEntryMirrorHtml(run, idPrefix) {
    if (!run || typeof run !== "object") return "";
    const glanceRoot = "recent-entry-mirror-root recent-entry-mirror recent-entry-mirror--glance";
    if (run.mirrorLoadFailed) {
      return `<div class="${glanceRoot}"><p class="mirror-empty">Reflection isn’t available in this build.</p></div>`;
    }
    const pfx = String(idPrefix || "mirror");
    if (mirrorPipelineResultHasEvidenceCards(run.mirrorPipelineResult)) {
      const body = buildReviewRunsMirrorGlanceBodyHtml({
        result: run.mirrorPipelineResult,
        idPrefix: pfx,
        emptyHintSeed: run.runId || String(run.savedAt || run.timestamp || ""),
      });
      return `<div class="${glanceRoot}">${body}</div>`;
    }
    return formatReviewRunReflectionGlanceHtml(buildReviewRunReflectionLines(run), pfx);
  }

  function recentEntryScoreMeterHtml(label, value, max, explainerKey) {
    const v = Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
    const dash = Math.round((v / max) * 1000) / 10;
    const d = "M 4 16 A 16 16 0 0 1 36 16";
    const aria = `${label}, ${v} out of ${max}`;
    const maxClass = v === max ? " recent-entry-meter--max" : "";
    const keys = window.waywordConfig.METRIC_EXPLAINER_KEYS;
    const categoryClass =
      explainerKey && keys.has(explainerKey) ? ` recent-entry-meter--${explainerKey}` : "";
    const explainerAttr =
      explainerKey && keys.has(explainerKey)
        ? ` data-metric-explainer="${explainerKey}" tabindex="0"`
        : "";
    return `
    <div class="recent-entry-meter${maxClass}${categoryClass}" role="img" aria-label="${escapeHtml(aria)}" title="${escapeHtml(`${label} ${v} / ${max}`)}"${explainerAttr}>
      <svg class="recent-entry-meter-svg" viewBox="-4 -6 48 28" aria-hidden="true" focusable="false">
        <path class="recent-entry-meter-track" pathLength="100" d="${d}" fill="none" stroke-linecap="round" />
        <path
          class="recent-entry-meter-fill"
          pathLength="100"
          d="${d}"
          fill="none"
          stroke-linecap="round"
          stroke-dasharray="${dash} 100"
        />
      </svg>
      <span class="recent-entry-meter-value">${escapeHtml(String(v))}</span>
      <span class="recent-entry-meter-label">${escapeHtml(label)}</span>
    </div>
  `;
  }

  function formatRecentEntryScoreBlock(item) {
    const total = item.runScore ?? item.score ?? 0;
    const words = item.wordCount ?? item.words ?? 0;
    const wordsLabel = Number(words) === 1 ? "word" : "words";
    const sb = item.scoreBreakdown;
    let html = `<div class="recent-entry-stats recent-entry-stats--demoted">
    <div class="recent-entry-stats-label">Numbers for this run</div>
    <div class="recent-entry-stats-row">
      <span class="recent-entry-stats-score">${escapeHtml(String(total))}</span>
      <span class="recent-entry-stats-words">${escapeHtml(String(words))} ${wordsLabel}</span>
    </div>
  </div>`;
    if (sb && typeof sb === "object") {
      const v = (k) => (typeof sb[k] === "number" && Number.isFinite(sb[k]) ? sb[k] : 0);
      html += `<div class="recent-entry-score-meters">`;
      html += recentEntryScoreMeterHtml("Completion", v("completion"), 25, null);
      html += recentEntryScoreMeterHtml("Filler", v("filler"), 25, "filler");
      html += recentEntryScoreMeterHtml("Repetition", v("repetition"), 25, "repetition");
      html += recentEntryScoreMeterHtml("Openings", v("openings"), 25, "openings");
      html += "</div>";
    }
    return html;
  }

  function promptExcerpt(prompt, maxLen) {
    const cap = maxLen != null ? maxLen : 120;
    const text = (prompt || "").replace(/\r/g, "");
    const firstLine = text.split("\n").map((l) => l.trim()).find(Boolean) || "";
    const compact = firstLine.replace(/\s+/g, " ").trim();
    if (compact.length <= cap) return compact;
    return `${compact.slice(0, Math.max(0, cap - 1)).trim()}…`;
  }

  function formatRelativeTime(ts) {
    if (!ts || typeof ts !== "number") return "";
    const diffMs = Date.now() - ts;
    const sec = Math.max(0, Math.floor(diffMs / 1000));
    if (sec < 45) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatRunDetailHtml(run) {
    const repeated = Array.isArray(run.repeatedWords) ? run.repeatedWords : [];
    const banned = Array.isArray(run.bannedHits) ? run.bannedHits : [];
    const starters = Array.isArray(run.repeatedStarters) ? run.repeatedStarters : [];

    const REPEAT_CHIP_CAP = 5;
    const STARTER_CHIP_CAP = 4;

    const repeatedShown = repeated.slice(0, REPEAT_CHIP_CAP);
    const repeatedOverflow = repeated.length - repeatedShown.length;
    const repeatedHtml = repeated.length
      ? repeatedShown
          .map(
            ([w, c]) =>
              `<span class="chip chip--compact chip-repetition">${escapeHtml(w)} ×${escapeHtml(String(c))}</span>`
          )
          .join("") +
        (repeatedOverflow > 0
          ? `<span class="chip chip--compact">+${escapeHtml(String(repeatedOverflow))}</span>`
          : "")
      : '<span class="chip chip--compact">none</span>';

    const bannedHtml = banned.length
      ? banned
          .map((item) => {
            const cls = item.isExercise ? "exercise-chip chip--compact" : "chip chip--compact chip-filler";
            const prefix = item.isExercise ? '<span class="exercise-dot"></span>' : "";
            return `<span class="${cls}">${prefix}${escapeHtml(item.word)} ×${escapeHtml(String(item.count))}</span>`;
          })
          .join("")
      : '<span class="chip chip--compact">none</span>';

    const startersShown = starters.slice(0, STARTER_CHIP_CAP);
    const startersOverflow = starters.length - startersShown.length;
    const startersHtml = starters.length
      ? startersShown
          .map(
            ([w, c]) =>
              `<span class="chip chip--compact chip-openings">${escapeHtml(w)} ×${escapeHtml(String(c))}</span>`
          )
          .join("") +
        (startersOverflow > 0
          ? `<span class="chip chip--compact">+${escapeHtml(String(startersOverflow))}</span>`
          : "")
      : '<span class="chip chip--compact">none</span>';

    const unique =
      typeof run.unique === "number"
        ? `${run.unique} unique`
        : typeof run.uniqueRatio === "number"
          ? `${Math.round(run.uniqueRatio * 100)}% variety`
          : "";

    const avgLen =
      typeof run.avgSentenceLength === "number" && Number.isFinite(run.avgSentenceLength)
        ? `${run.avgSentenceLength.toFixed(1)} avg sentence`
        : "";

    const statTokens = [];
    if (unique) statTokens.push(`<span class="recent-run-stat-token">${escapeHtml(unique)}</span>`);
    if (avgLen) statTokens.push(`<span class="recent-run-stat-token">${escapeHtml(avgLen)}</span>`);
    const statsFoot =
      statTokens.length > 0
        ? `<div class="recent-run-detail-foot">${statTokens.join(
            '<span class="recent-run-stats-join" aria-hidden="true">·</span>'
          )}</div>`
        : "";

    return `
    <div class="recent-run-detail recent-run-detail--compact">
      <div class="recent-run-detail-inline">
        <span class="recent-run-inline-cluster" data-metric-explainer="filler" tabindex="0">
          <span class="recent-run-inline-kicker">Filler</span>
          <span class="word-list word-list--inline">${bannedHtml}</span>
        </span>
        <span class="recent-run-inline-cluster" data-metric-explainer="repetition" tabindex="0">
          <span class="recent-run-inline-kicker">Repetition</span>
          <span class="word-list word-list--inline">${repeatedHtml}</span>
        </span>
        <span class="recent-run-inline-cluster" data-metric-explainer="openings" tabindex="0">
          <span class="recent-run-inline-kicker">Openings</span>
          <span class="word-list word-list--inline">${startersHtml}</span>
        </span>
      </div>
      ${statsFoot}
    </div>
  `;
  }

  function buildRecentEntryRowHtml(item, idx, listKey) {
    const excerpt = promptExcerpt(item.prompt);
    const when = formatRelativeTime(item.savedAt);
    const meta = when ? `<div class="recent-entry-meta">${escapeHtml(when)}</div>` : "";
    const detail = formatRunDetailHtml(item);
    const scoreBlock = formatRecentEntryScoreBlock(item);
    const idPrefix = `mirror-${listKey}-${idx}-${item.runId || "run"}`;
    const mirrorBlock = formatRecentEntryMirrorHtml(item, idPrefix);
    const mirrorWrap = mirrorBlock
      ? `<div class="recent-entry-reflection" aria-label="Reflection for this run">${mirrorBlock}</div>`
      : "";
    const draftRaw = String(item.text != null && item.text !== "" ? item.text : item.body || "").trim();
    const draftDisplay = draftRaw || "Draft text wasn\u2019t kept on this device.";
    return `
          <div
            class="recent-entry"
            role="button"
            tabindex="0"
            aria-expanded="false"
            data-recent-index="${idx}"
          >
            <div class="recent-entry-compact">
              <div class="recent-entry-excerpt">${escapeHtml(excerpt || "Run")}</div>
              ${meta}
            </div>
            <div class="recent-entry-expanded" hidden>
              ${mirrorWrap}
              <div class="recent-entry-prompt-wrap">
                <div class="recent-entry-prompt-kicker">Saved draft</div>
                <div class="recent-entry-prompt">${escapeHtml(draftDisplay)}</div>
              </div>
              <div class="recent-entry-results">
                ${scoreBlock}
                <div class="recent-entry-detail">${detail}</div>
              </div>
              <div class="recent-entry-future-meta" aria-hidden="true"></div>
            </div>
          </div>
        `;
  }

  function buildRecentEntriesHtml(items, listKey) {
    return items.map((item, idx) => buildRecentEntryRowHtml(item, idx, listKey)).join("");
  }

  function getRecentListEmptyInnerHtml(isDrawer, drawerOpen, desktopPatterns) {
    const showEmpty = isDrawer ? drawerOpen : desktopPatterns;
    return showEmpty ? `<div class="recent-drawer-empty">Nothing saved to review yet.</div>` : "";
  }

  window.waywordHistoryRenderer = {
    reviewRunSentenceCount,
    buildReviewRunReflectionLines,
    formatReviewRunReflectionGlanceHtml,
    formatRecentEntryMirrorHtml,
    recentEntryScoreMeterHtml,
    formatRecentEntryScoreBlock,
    promptExcerpt,
    formatRelativeTime,
    formatRunDetailHtml,
    buildRecentEntryRowHtml,
    buildRecentEntriesHtml,
    getRecentListEmptyInnerHtml,
  };
})();

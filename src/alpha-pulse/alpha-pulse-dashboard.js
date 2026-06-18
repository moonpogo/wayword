(function (global, factory) {
  var api = factory(global);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  global.waywordAlphaPulseDashboard = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (global) {
  "use strict";

  var STAGES = [
    {
      id: "landed",
      label: "Landed",
      note: "Landing views on the opening surface.",
      help:
        "This is the widest top-of-funnel count on the page. It increments when the landing surface is shown, before anyone begins writing. Use it as the first point of comparison for the rest of the flow.",
    },
    {
      id: "started_writing",
      label: "Started writing",
      note: "Writing sessions started from the landing surface.",
      help:
        "This fires when someone moves from the landing surface into an active writing session. It tells you whether visits are turning into actual starts, not just passive page opens.",
    },
    {
      id: "submitted",
      label: "Submitted",
      note: "Run submissions before save or sync outcome.",
      help:
        "This is the moment a run is submitted, before we know the save or sync result. It is useful for separating writing completion from persistence health.",
    },
    {
      id: "saved",
      label: "Saved",
      note: "Runs that reached the save event.",
      help:
        "This counts save events after submission. It includes local-only saves as well as synced ones, so it reflects whether writing was preserved, not only whether it reached the server cleanly.",
    },
    {
      id: "returned",
      label: "Returned",
      note: "Return-session events after a gap from the prior visit.",
      help:
        "This is event-count based, not unique-user based. A single person can contribute more than once if they come back multiple times after the return threshold, so treat it as repeat engagement activity rather than a clean user total.",
    },
    {
      id: "opened_recent_runs",
      label: "Opened Recent Runs",
      note: "Recent Runs drawer opens.",
      help:
        "This shows how often people open the saved-run review surface. It helps answer whether saved writing is being revisited, not just created.",
    },
    {
      id: "opened_patterns",
      label: "Opened Patterns",
      note: "Patterns or observatory openings.",
      help:
        "This counts openings of the Patterns surface. It is the clearest signal here for curiosity about reflection and cross-run meaning, beyond simple writing completion.",
    },
    {
      id: "errors",
      label: "Errors",
      note: "Sync failures and migration failures.",
      help:
        "This is a health metric, not a behavior metric. Right now it includes save sync failures and migration failures, so it is best read as persistence friction inside the selected window.",
    },
  ];

  var RANGE_OPTIONS = [
    { id: "7", label: "7d" },
    { id: "14", label: "14d" },
    { id: "30", label: "30d" },
    { id: "all", label: "All" },
  ];

  var REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  var booted = false;
  var currentRange = "7";
  var refreshTimer = 0;
  var visibilityBound = false;
  var refreshBound = false;
  var currentRequestId = 0;
  var refreshInFlight = false;

  function safeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function safeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function escapeHtml(value) {
    return safeString(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatPercent(value) {
    if (!Number.isFinite(value) || value <= 0) return "0%";
    return Math.round(value) + "%";
  }

  function formatTimestamp(value) {
    var iso = safeString(value);
    var ms = Date.parse(iso);
    if (!Number.isFinite(ms)) return "";
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(ms));
    } catch (_) {
      return iso;
    }
  }

  function buildSummaryUrl(rangeId, requestId) {
    var range = safeString(rangeId) || "7";
    var url = "/api/alpha-pulse-summary?days=" + encodeURIComponent(range);
    if (requestId) {
      url += "&request=" + encodeURIComponent(String(requestId));
    }
    return url;
  }

  function clearRefreshTimer() {
    if (!refreshTimer || typeof global.clearTimeout !== "function") return;
    global.clearTimeout(refreshTimer);
    refreshTimer = 0;
  }

  function scheduleRefresh() {
    clearRefreshTimer();
    if (typeof global.setTimeout !== "function") return;
    refreshTimer = global.setTimeout(function () {
      initPage({ range: currentRange });
    }, REFRESH_INTERVAL_MS);
  }

  function stageMetaById(id) {
    for (var index = 0; index < STAGES.length; index += 1) {
      if (STAGES[index].id === id) return STAGES[index];
    }
    return null;
  }

  function normalizeSummary(raw) {
    var input = raw && typeof raw === "object" ? raw : {};
    var source = input.source && typeof input.source === "object" ? input.source : {};
    var stagesById = {};
    safeArray(input.stages).forEach(function (stage) {
      if (!stage || typeof stage !== "object") return;
      stagesById[safeString(stage.id)] = stage;
    });

    return {
      ok: Boolean(input.ok),
      generatedAt: safeString(input.generatedAt),
      window: input.window && typeof input.window === "object" ? input.window : { label: "Last 7 days" },
      source: {
        available: Boolean(source.available),
        telemetryTable: safeString(source.telemetryTable),
        mode: safeString(source.mode) || (source.available ? "live" : "unavailable"),
        snapshotGeneratedAt: safeString(source.snapshotGeneratedAt),
        latestEventAt: safeString(source.latestEventAt),
        unavailableReason: safeString(source.unavailableReason),
      },
      seams: safeArray(input.seams),
      stages: STAGES.map(function (stageMeta) {
        var stage = stagesById[stageMeta.id] || {};
        var coverage = safeObject(stage.coverage);
        return {
          id: stageMeta.id,
          label: stageMeta.label,
          note: stageMeta.note,
          help: stageMeta.help,
          count: Number(stage.count) || 0,
          coverage: {
            total: Number(coverage.total) || 0,
            firstSeenAt: safeString(coverage.firstSeenAt),
            lastSeenAt: safeString(coverage.lastSeenAt),
            historicallySeen: Boolean(coverage.historicallySeen),
          },
          source: safeString(stage.source) || (input.ok ? "live" : "unavailable"),
          note: safeString(stage.note),
        };
      }),
    };
  }

  function describeStageCoverage(stage) {
    var coverage = safeObject(stage && stage.coverage);
    if (!coverage.historicallySeen) {
      return "Not captured in the current dataset yet.";
    }
    if ((Number(stage && stage.count) || 0) === 0 && coverage.lastSeenAt) {
      return "No events in this window. Last seen " + (formatTimestamp(coverage.lastSeenAt) || coverage.lastSeenAt) + ".";
    }
    return safeString(stage && stage.note);
  }

  function loadDashboardData(options) {
    var range = safeString(options && options.range) || "7";
    var requestId = safeString(options && options.requestId) || String(Date.now());
    var summaryUrl = safeString(options && options.summaryUrl) || buildSummaryUrl(range, requestId);
    if (typeof fetch !== "function") {
      return Promise.resolve(
        normalizeSummary({
          ok: false,
          window: { label: range === "all" ? "All time" : "Last " + range + " days" },
          source: { available: false, telemetryTable: "", unavailableReason: "fetch_unavailable" },
          stages: STAGES.map(function (stage) {
            return { id: stage.id, count: 0, source: "unavailable" };
          }),
          seams: [{ id: "fetch_unavailable", label: "Live summary unavailable", reason: "Fetch is not available." }],
        })
      );
    }

    return fetch(summaryUrl, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("alpha_pulse_summary_http_" + response.status);
        }
        return response.json();
      })
      .then(normalizeSummary)
      .catch(function (error) {
        return normalizeSummary({
          ok: false,
          source: {
            available: false,
            telemetryTable: "",
            unavailableReason: safeString(error && error.message) || "alpha_pulse_summary_failed",
          },
          seams: [
            {
              id: "alpha_pulse_summary_failed",
              label: "Live summary unavailable",
              reason: safeString(error && error.message) || "Alpha Pulse summary request failed.",
            },
          ],
          stages: STAGES.map(function (stage) {
            return { id: stage.id, count: 0, source: "unavailable" };
          }),
          window: { label: range === "all" ? "All time" : "Last " + range + " days" },
        });
      });
  }

  function summarizeSources(data) {
    var liveCount = 0;
    var unavailableCount = 0;
    safeArray(data && data.stages).forEach(function (stage) {
      if (stage.source === "live") liveCount += 1;
      if (stage.source === "unavailable") unavailableCount += 1;
    });
    return {
      liveCount: liveCount,
      unavailableCount: unavailableCount,
    };
  }

  function renderFunnelStages(container, stages) {
    if (!container) return;
    var maxCount = 0;
    safeArray(stages).forEach(function (stage) {
      if (stage.count > maxCount) maxCount = stage.count;
    });

    container.innerHTML = safeArray(stages)
      .map(function (stage) {
        var share = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        var badgeLabel = stage.source === "unavailable" ? "Unavailable" : "";
        var stageNote = describeStageCoverage(stage);
        var countLabel = stage.coverage && stage.coverage.historicallySeen ? String(stage.count) : "\u2014";
        return (
          '<article class="alpha-pulse-stage">' +
            "<div>" +
              '<div class="alpha-pulse-stage__head">' +
                '<div class="alpha-pulse-stage__title-row">' +
                  '<h3 class="alpha-pulse-stage__title">' + escapeHtml(stage.label) + "</h3>" +
                  '<button type="button" class="alpha-pulse-stage__help" data-help="' + escapeHtml(stage.help) + '" aria-label="' + escapeHtml(stage.help) + '">?</button>' +
                "</div>" +
                (
                  badgeLabel
                    ? '<span class="alpha-pulse-badge alpha-pulse-badge--' + escapeHtml(stage.source) + '">' +
                        escapeHtml(badgeLabel) +
                      "</span>"
                    : ""
                ) +
              "</div>" +
              '<div class="alpha-pulse-stage__bar"><div class="alpha-pulse-stage__fill" style="width:' +
                formatPercent(share) +
              ';"></div></div>' +
              '<p class="alpha-pulse-stage__note">' +
                escapeHtml(stageNote || "") +
              "</p>" +
            "</div>" +
            '<div class="alpha-pulse-stage__metrics">' +
              '<div class="alpha-pulse-stage__count">' + escapeHtml(countLabel) + "</div>" +
            "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderSourceSummary(container, data) {
    if (!container) return;
    var summary = summarizeSources(data);
    var html =
      '<span class="alpha-pulse-pill alpha-pulse-pill--live">' + escapeHtml(String(summary.liveCount)) + " live</span>";
    if (summary.unavailableCount > 0) {
      html +=
        '<span class="alpha-pulse-pill alpha-pulse-pill--unavailable">' +
        escapeHtml(String(summary.unavailableCount)) +
        " unavailable</span>";
    }
    container.innerHTML = html;
  }

  function renderSourceNotes(container, data) {
    if (!container) return;
    var source = data && data.source ? data.source : {};
    var items = [];
    if (source.available) {
      items.push({
        label: source.mode === "snapshot" ? "Data source" : "Live source",
        reason:
          source.mode === "snapshot"
            ? (source.telemetryTable || "retention_events") +
              " snapshot from " +
              (formatTimestamp(source.snapshotGeneratedAt) || "recently") +
              "."
            : (source.telemetryTable || "retention_events") + " via the summary endpoint.",
      });
      if (source.latestEventAt) {
        items.push({
          label: "Latest event",
          reason: formatTimestamp(source.latestEventAt) || source.latestEventAt,
        });
      }
    } else {
      items.push({
        label: "Data status",
        reason: source.unavailableReason || "Summary access is not available in this environment.",
      });
    }
    safeArray(data && data.seams).forEach(function (seam) {
      if (!seam || typeof seam !== "object") return;
      var label = safeString(seam.label);
      var reason = safeString(seam.reason);
      if (!label || !reason) return;
      if (label === items[0].label && reason === items[0].reason) return;
      items.push({ label: label, reason: reason });
    });

    container.innerHTML = items
      .map(function (item) {
        return "<li><strong>" + escapeHtml(item.label) + ":</strong> " + escapeHtml(item.reason) + "</li>";
      })
      .join("");
  }

  function renderRangeControls(container, activeRange) {
    if (!container) return;
    safeArray(container.querySelectorAll("[data-range]")).forEach(function (button) {
      var isActive = safeString(button.getAttribute("data-range")) === activeRange;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function renderRefreshButton(doc, loading) {
    if (!doc) return;
    var button = doc.getElementById("alphaPulseRefreshButton");
    if (!button) return;
    button.disabled = Boolean(loading);
    button.textContent = loading ? "Refreshing..." : "Refresh now";
    button.setAttribute("aria-busy", loading ? "true" : "false");
  }

  function buildStatusText(data) {
    if (data && data.ok && data.source && data.source.mode === "snapshot") {
      var snapshotAt = formatTimestamp(data.source.snapshotGeneratedAt);
      return snapshotAt
        ? "Snapshot from " + snapshotAt + ". Retrying live automatically."
        : "Telemetry snapshot. Retrying live automatically.";
    }
    if (data && data.ok) {
      return "Live telemetry. Refreshes automatically.";
    }
    return "Telemetry unavailable right now. Retrying automatically.";
  }

  function initAuthRuntime() {
    try {
      if (
        global.waywordAuthSessionRuntime &&
        typeof global.waywordAuthSessionRuntime.init === "function"
      ) {
        global.waywordAuthSessionRuntime.init({
          getDraftText: function () {
            return "";
          },
          setDraftText: function () {},
          onStatus: function () {},
          onAuthStateChange: function () {},
          onAuthError: function () {},
          onRetentionHook: function () {},
        });
      }
    } catch (_) {
      /* ignore */
    }
  }

  function renderDashboard(doc, data) {
    var statusNode = doc.getElementById("alphaPulseStatus");
    var windowNode = doc.getElementById("alphaPulseWindowLabel");

    renderFunnelStages(doc.getElementById("alphaPulseFunnel"), data.stages);
    renderSourceSummary(doc.getElementById("alphaPulseSourceSummary"), data);
    renderSourceNotes(doc.getElementById("alphaPulseSeams"), data);
    renderRangeControls(doc.getElementById("alphaPulseRangeControls"), currentRange);

    if (windowNode) windowNode.textContent = data.window && data.window.label ? data.window.label : "";
    if (statusNode) {
      statusNode.textContent = buildStatusText(data);
    }
    renderRefreshButton(doc, false);
  }

  function attachRangeControlEvents(doc) {
    var controls = doc.getElementById("alphaPulseRangeControls");
    if (!controls || controls.dataset.boundAlphaPulseRange === "1") return;
    controls.dataset.boundAlphaPulseRange = "1";
    controls.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var button = target.closest("[data-range]");
      if (!button) return;
      var nextRange = safeString(button.getAttribute("data-range")) || "7";
      if (nextRange === currentRange) return;
      currentRange = nextRange;
      renderRangeControls(controls, currentRange);
      initPage({ range: currentRange });
    });
  }

  function attachVisibilityRefresh(doc) {
    if (!doc || visibilityBound || !doc.addEventListener) return;
    visibilityBound = true;
    doc.addEventListener("visibilitychange", function () {
      if (doc.visibilityState === "visible") {
        initPage({ range: currentRange });
      }
    });
  }

  function attachRefreshButton(doc) {
    var button = doc && doc.getElementById("alphaPulseRefreshButton");
    if (!button || refreshBound) return;
    refreshBound = true;
    button.addEventListener("click", function () {
      if (refreshInFlight) return;
      initPage({ range: currentRange, manual: true });
    });
  }

  function initPage(options) {
    if (!global.document) return Promise.resolve(null);
    initAuthRuntime();
    if (options && options.range) currentRange = safeString(options.range) || currentRange;
    currentRequestId += 1;
    refreshInFlight = true;
    renderRefreshButton(global.document, true);
    if (options && options.manual) {
      var statusNode = global.document.getElementById("alphaPulseStatus");
      if (statusNode) statusNode.textContent = "Refreshing telemetry...";
    }
    return loadDashboardData({ range: currentRange, requestId: currentRequestId }).then(function (data) {
      refreshInFlight = false;
      renderDashboard(global.document, data);
      attachRangeControlEvents(global.document);
      attachVisibilityRefresh(global.document);
      attachRefreshButton(global.document);
      scheduleRefresh();
      return data;
    }).catch(function (error) {
      refreshInFlight = false;
      renderRefreshButton(global.document, false);
      throw error;
    });
  }

  function bootPage() {
    if (!global.document || booted) return;
    if (!global.document.getElementById("alphaPulseFunnel")) return;
    booted = true;
    initPage({ range: currentRange });
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", bootPage);
    } else {
      bootPage();
    }
    if (typeof global.requestAnimationFrame === "function") {
      global.requestAnimationFrame(bootPage);
    }
  }

  return {
    STAGES: STAGES,
    RANGE_OPTIONS: RANGE_OPTIONS,
    REFRESH_INTERVAL_MS: REFRESH_INTERVAL_MS,
    buildSummaryUrl: buildSummaryUrl,
    buildStatusText: buildStatusText,
    normalizeSummary: normalizeSummary,
    loadDashboardData: loadDashboardData,
    bootPage: bootPage,
    initPage: initPage,
  };
});

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
  var AUTH_TOKEN_STORAGE_KEY = "wayword-alpha-pulse-token";
  var ALPHA_PULSE_ROLLUP_TABLE = "alpha_pulse_stage_daily_totals";
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

  function readStoredAuthToken() {
    try {
      if (!global.sessionStorage) return "";
      return safeString(global.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
    } catch (_) {
      return "";
    }
  }

  function storeAuthToken(token) {
    var value = safeString(token);
    if (!value) return;
    try {
      if (global.sessionStorage) {
        global.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, value);
      }
    } catch (_) {
      /* Token storage is convenience-only; the request can still use this token once. */
    }
  }

  function clearTokenHash() {
    try {
      if (!global.location || !global.history || typeof global.history.replaceState !== "function") return;
      if (!safeString(global.location.hash)) return;
      global.history.replaceState(null, "", global.location.pathname + global.location.search);
    } catch (_) {
      /* Leave the hash alone if the browser blocks history changes. */
    }
  }

  function readHashAuthToken() {
    try {
      var hash = safeString(global.location && global.location.hash).replace(/^#/, "");
      if (!hash) return "";
      var params = new URLSearchParams(hash);
      return safeString(params.get("token") || params.get("alphaPulseToken"));
    } catch (_) {
      return "";
    }
  }

  function resolveAuthToken(options) {
    var explicitToken = safeString(options && options.authToken);
    if (explicitToken) return explicitToken;
    var hashToken = readHashAuthToken();
    if (hashToken) {
      storeAuthToken(hashToken);
      clearTokenHash();
      return hashToken;
    }
    return readStoredAuthToken();
  }

  function buildFetchOptions(options) {
    var token = resolveAuthToken(options);
    var fetchOptions = { cache: "no-store" };
    if (token) {
      fetchOptions.headers = {
        Authorization: "Bearer " + token,
      };
    }
    return fetchOptions;
  }

  function buildWindow(rangeId, now) {
    var range = safeString(rangeId) || "7";
    var end = now instanceof Date && Number.isFinite(now.getTime()) ? now : new Date();
    if (range === "all") {
      return {
        label: "All time",
        startAt: "1970-01-01T00:00:00.000Z",
        endAt: end.toISOString(),
      };
    }
    var days = Math.max(1, Number(range) || 7);
    var start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      label: "Last " + days + " days",
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
  }

  function pickRollupTimestamp(row, fieldName) {
    return row && typeof row === "object" ? safeString(row[fieldName]) : "";
  }

  function isRollupDayWithinWindow(dayIso, windowInfo) {
    var day = safeString(dayIso);
    var dayStartMs = Date.parse(day ? day + "T00:00:00.000Z" : "");
    var dayEndMs = Date.parse(day ? day + "T23:59:59.999Z" : "");
    var startMs = Date.parse(windowInfo.startAt);
    var endMs = Date.parse(windowInfo.endAt);
    return (
      Number.isFinite(dayStartMs) &&
      Number.isFinite(dayEndMs) &&
      Number.isFinite(startMs) &&
      Number.isFinite(endMs) &&
      dayEndMs >= startMs &&
      dayStartMs <= endMs
    );
  }

  function buildCoverageMapFromRollups(rows) {
    var map = {};
    STAGES.forEach(function (stage) {
      map[stage.id] = {
        total: 0,
        firstSeenAt: "",
        lastSeenAt: "",
        historicallySeen: false,
      };
    });

    safeArray(rows).forEach(function (row) {
      var stageId = safeString(row && row.stage_id);
      if (!stageId || !map[stageId]) return;
      var coverage = map[stageId];
      var count = Math.max(0, Number(row && row.event_count) || 0);
      var firstSeenAt = pickRollupTimestamp(row, "first_event_at");
      var lastSeenAt = pickRollupTimestamp(row, "last_event_at");
      coverage.total += count;
      coverage.historicallySeen = coverage.total > 0;
      if (firstSeenAt && (!coverage.firstSeenAt || Date.parse(firstSeenAt) < Date.parse(coverage.firstSeenAt))) {
        coverage.firstSeenAt = firstSeenAt;
      }
      if (lastSeenAt && (!coverage.lastSeenAt || Date.parse(lastSeenAt) > Date.parse(coverage.lastSeenAt))) {
        coverage.lastSeenAt = lastSeenAt;
      }
    });

    return map;
  }

  function buildAlphaPulseSummaryFromRollups(rows, rangeId, now) {
    var windowInfo = buildWindow(rangeId, now);
    var coverageMap = buildCoverageMapFromRollups(rows);
    var stageCounts = {};
    var latestEventAt = "";

    STAGES.forEach(function (stage) {
      stageCounts[stage.id] = 0;
    });

    safeArray(rows).forEach(function (row) {
      var stageId = safeString(row && row.stage_id);
      if (!stageId || !Object.prototype.hasOwnProperty.call(stageCounts, stageId)) return;
      if (isRollupDayWithinWindow(row && row.day, windowInfo)) {
        stageCounts[stageId] += Math.max(0, Number(row && row.event_count) || 0);
      }
      var rowLastEventAt = pickRollupTimestamp(row, "last_event_at");
      if (rowLastEventAt && (!latestEventAt || Date.parse(rowLastEventAt) > Date.parse(latestEventAt))) {
        latestEventAt = rowLastEventAt;
      }
    });

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      window: windowInfo,
      source: {
        available: true,
        telemetryTable: ALPHA_PULSE_ROLLUP_TABLE,
        mode: "live",
        snapshotGeneratedAt: "",
        latestEventAt: latestEventAt,
        unavailableReason: "",
      },
      seams: [],
      stages: STAGES.map(function (stage) {
        return {
          id: stage.id,
          label: stage.label,
          count: stageCounts[stage.id] || 0,
          coverage: coverageMap[stage.id] || null,
          source: "live",
          note: "",
        };
      }),
    };
  }

  function buildPublicRollupUrl(env) {
    var url = safeString(env && env.SUPABASE_URL).replace(/\/$/, "");
    if (!url) return "";
    return (
      url +
      "/rest/v1/" +
      ALPHA_PULSE_ROLLUP_TABLE +
      "?select=day,stage_id,event_count,first_event_at,last_event_at&order=day.asc&limit=5000"
    );
  }

  function hasPublicRollupConfig() {
    var env = safeObject(global.waywordEnv);
    return Boolean(buildPublicRollupUrl(env) && safeString(env.SUPABASE_ANON_KEY));
  }

  function loadPublicRollupSummary(options) {
    var env = safeObject(global.waywordEnv);
    var url = buildPublicRollupUrl(env);
    var anonKey = safeString(env.SUPABASE_ANON_KEY);
    if (!url || !anonKey || typeof fetch !== "function") return Promise.resolve(null);
    return fetch(url, {
      cache: "no-store",
      headers: {
        apikey: anonKey,
        Authorization: "Bearer " + anonKey,
      },
    })
      .then(function (response) {
        if (!response.ok) throw new Error("alpha_pulse_rollup_http_" + response.status);
        return response.json();
      })
      .then(function (rows) {
        return buildAlphaPulseSummaryFromRollups(rows, options && options.range, options && options.now);
      });
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
    var fetchOptions = buildFetchOptions(options);
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

    if (!(fetchOptions.headers && fetchOptions.headers.Authorization) && hasPublicRollupConfig()) {
      return loadPublicRollupSummary(options)
        .then(function (summary) {
          if (summary) return normalizeSummary(summary);
          throw new Error("alpha_pulse_rollup_unavailable");
        })
        .catch(function (error) {
          var reason = safeString(error && error.message) || "alpha_pulse_rollup_unavailable";
          return normalizeSummary({
            ok: false,
            source: {
              available: false,
              telemetryTable: ALPHA_PULSE_ROLLUP_TABLE,
              unavailableReason: reason,
            },
            seams: [
              {
                id: "alpha_pulse_summary_failed",
                label: "Live summary unavailable",
                reason: reason,
              },
            ],
            stages: STAGES.map(function (stage) {
              return { id: stage.id, count: 0, source: "unavailable" };
            }),
            window: { label: range === "all" ? "All time" : "Last " + range + " days" },
          });
        });
    }

    return fetch(summaryUrl, fetchOptions)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("alpha_pulse_summary_http_" + response.status);
        }
        return response.json();
      })
      .then(normalizeSummary)
      .catch(function (error) {
        var summaryError = safeString(error && error.message) || "alpha_pulse_summary_failed";
        return loadPublicRollupSummary(options)
          .then(function (fallbackSummary) {
            if (fallbackSummary) return normalizeSummary(fallbackSummary);
            return normalizeSummary({
              ok: false,
              source: {
                available: false,
                telemetryTable: "",
                unavailableReason: summaryError,
              },
              seams: [
                {
                  id: "alpha_pulse_summary_failed",
                  label: "Live summary unavailable",
                  reason: summaryError || "Alpha Pulse summary request failed.",
                },
              ],
              stages: STAGES.map(function (stage) {
                return { id: stage.id, count: 0, source: "unavailable" };
              }),
              window: { label: range === "all" ? "All time" : "Last " + range + " days" },
            });
          })
          .catch(function (fallbackError) {
            var reason = safeString(fallbackError && fallbackError.message) || summaryError;
            return normalizeSummary({
              ok: false,
              source: {
                available: false,
                telemetryTable: ALPHA_PULSE_ROLLUP_TABLE,
                unavailableReason: reason,
              },
              seams: [
                {
                  id: "alpha_pulse_summary_failed",
                  label: "Live summary unavailable",
                  reason: reason,
                },
              ],
              stages: STAGES.map(function (stage) {
                return { id: stage.id, count: 0, source: "unavailable" };
              }),
              window: { label: range === "all" ? "All time" : "Last " + range + " days" },
            });
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
            : source.telemetryTable === ALPHA_PULSE_ROLLUP_TABLE
              ? "Aggregate daily rollups from " + ALPHA_PULSE_ROLLUP_TABLE + "."
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
    AUTH_TOKEN_STORAGE_KEY: AUTH_TOKEN_STORAGE_KEY,
    ALPHA_PULSE_ROLLUP_TABLE: ALPHA_PULSE_ROLLUP_TABLE,
    buildAlphaPulseSummaryFromRollups: buildAlphaPulseSummaryFromRollups,
    buildSummaryUrl: buildSummaryUrl,
    buildFetchOptions: buildFetchOptions,
    buildStatusText: buildStatusText,
    normalizeSummary: normalizeSummary,
    loadDashboardData: loadDashboardData,
    bootPage: bootPage,
    initPage: initPage,
  };
});

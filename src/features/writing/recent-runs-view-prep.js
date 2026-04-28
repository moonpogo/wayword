/**
 * Pure state-to-view preparation for Review Runs (drawer + rail lists).
 * No DOM, no persistence — callers supply saved runs (newest-first) and caps.
 */
(function initWaywordRecentRunsViewPrep(global) {
  "use strict";

  /**
   * @param {{
   *   runsNewestFirst: unknown[],
   *   historyExpanded: boolean,
   *   capDrawer: number,
   *   capRail: number,
   * }} input
   * @returns {(
   *   | { isEmpty: true, clearExpandedHistory: true }
   *   | {
   *       isEmpty: false,
   *       totalCount: number,
   *       expanded: boolean,
   *       drawerRunsExpandedBody: boolean,
   *       drawerSlice: unknown[],
   *       railSlice: unknown[],
   *       capDrawer: number,
   *       capRail: number,
   *     }
   * )}
   */
  function prepareRecentRunsViewModel(input) {
    const runs = Array.isArray(input.runsNewestFirst) ? input.runsNewestFirst : [];
    if (!runs.length) {
      return { isEmpty: true, clearExpandedHistory: true };
    }

    const totalCount = runs.length;
    const expanded = Boolean(input.historyExpanded);
    const capDrawer = Math.max(0, Math.floor(Number(input.capDrawer) || 0));
    const capRail = Math.max(0, Math.floor(Number(input.capRail) || 0));

    const drawerCap = expanded ? totalCount : capDrawer;
    const railCap = expanded ? totalCount : capRail;

    return {
      isEmpty: false,
      totalCount,
      expanded,
      drawerRunsExpandedBody: expanded && totalCount > 0,
      drawerSlice: runs.slice(0, drawerCap),
      railSlice: runs.slice(0, railCap),
      capDrawer,
      capRail,
    };
  }

  global.waywordRecentRunsViewPrep = {
    prepareRecentRunsViewModel,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

/**
 * Recent Runs drawer + desktop rail expanded coordination (DOM + timing guards).
 * Callers supply deps from script.js (state, $, editor, viewport, callbacks).
 * Bundled here so boot never depends on a second network resource for this global.
 */
(function initWaywordRecentRunsTransition(global) {
  "use strict";

  function isRecentDrawerOpen() {
    return Boolean(global.document?.body?.classList?.contains("recent-drawer-open"));
  }

  /** Keeps `body.recent-drawer-runs-expanded` in sync with expanded list chrome (drawer height). */
  function syncRecentDrawerRunsExpandedBodyClass(shouldExpand) {
    global.document.body.classList.toggle("recent-drawer-runs-expanded", Boolean(shouldExpand));
  }

  /**
   * @param {Record<string, unknown>} [options]
   * @param {{
   *   $: (id: string) => HTMLElement | null,
   *   editorInput: HTMLElement | null,
   *   isDesktopPatternsViewport: () => boolean,
   * }} deps
   */
  function syncRecentRailExpandedLayoutMetrics(options, deps) {
    const opts = options && typeof options === "object" ? options : {};
    const $ = deps.$;
    const writeView = $("writeView");
    if (!writeView) return;
    const forceExpanded = Boolean(opts.forceExpanded);
    const railExpanded = global.document.body.classList.contains("recent-rail-expanded");
    if (!deps.isDesktopPatternsViewport()) {
      writeView.style.removeProperty("--review-runs-rail-expanded-max-h");
      /*
       * `renderHistory` + `syncRecentRailExpandedChrome` can run in frame N while Safari still reports
       * a wide layout viewport; the follow-up `syncRecentRailExpandedLayoutMetrics` RAF often runs in
       * frame N+1 after the width settles. Without this guard, `body.recent-rail-expanded` and rail
       * backdrop chrome can stick on below the desktop rail breakpoint (dead horizontal band).
       */
      if (railExpanded) {
        syncRecentRailExpandedChrome(deps);
      }
      return;
    }
    if (!railExpanded && !forceExpanded) {
      writeView.style.removeProperty("--review-runs-rail-expanded-max-h");
      return;
    }

    const col = writeView.querySelector(".side-column");
    const textBox = deps.editorInput || writeView.querySelector(".editor-input");
    if (!col || !textBox) {
      writeView.style.removeProperty("--review-runs-rail-expanded-max-h");
      return;
    }

    const colRect = col.getBoundingClientRect();
    const textRect = textBox.getBoundingClientRect();
    const vv = global.window.visualViewport;
    const vh = vv && Number.isFinite(vv.height) ? vv.height : global.window.innerHeight;

    const viewportCapPx = Math.max(0, vh - colRect.top - 86);

    const railAlignToEditorPx = 5;
    const alignmentCapPx = textRect.bottom - colRect.top - railAlignToEditorPx;

    const maxH = Math.min(viewportCapPx, alignmentCapPx);
    if (!Number.isFinite(maxH) || maxH < 160) {
      writeView.style.removeProperty("--review-runs-rail-expanded-max-h");
      return;
    }

    writeView.style.setProperty("--review-runs-rail-expanded-max-h", `${Math.round(maxH)}px`);
  }

  /**
   * @param {{
   *   $: (id: string) => HTMLElement | null,
   *   state: { recentRunsHistoryExpanded?: boolean },
   *   isDesktopPatternsViewport: () => boolean,
   *   editorInput: HTMLElement | null,
   * }} deps
   */
  function syncRecentRailExpandedChrome(deps) {
    const expanded = Boolean(deps.state.recentRunsHistoryExpanded);
    const desktop = deps.isDesktopPatternsViewport();
    const drawerOpen = isRecentDrawerOpen();
    const show = expanded && desktop && !drawerOpen;
    const $ = deps.$;
    const writeView = $("writeView");
    const backdrop = $("recentRailExpandedBackdrop");
    const closeBtn = $("recentRailExpandedCloseBtn");
    if (backdrop) {
      backdrop.classList.toggle("hidden", !show);
      backdrop.setAttribute("aria-hidden", show ? "false" : "true");
    }
    if (closeBtn) {
      closeBtn.classList.toggle("hidden", !show);
    }

    if (!show) {
      writeView?.style.removeProperty("--review-runs-rail-expanded-max-h");
    } else {
      syncRecentRailExpandedLayoutMetrics({ forceExpanded: true }, deps);
    }

    global.document.body.classList.toggle("recent-rail-expanded", show);

    if (show) {
      global.requestAnimationFrame(() => syncRecentRailExpandedLayoutMetrics({}, deps));
    }
  }

  /**
   * @param {boolean} open
   * @param {{
   *   skipHistory?: boolean,
   *   skipFocus?: boolean,
   *   afterOpen?: (() => void) | null,
   * }} [options]
   * @param {{
   *   $: (id: string) => HTMLElement | null,
   *   state: { pendingRecentDrawerExpand?: boolean, recentRunsHistoryExpanded?: boolean },
   *   editorInput: HTMLElement | null,
   *   isMobileViewport: () => boolean,
   *   RECENT_DRAWER_DISMISS_GUARD_MS: number,
   *   setRecentDrawerDismissGuardUntil: (n: number) => void,
   *   setSuppressFocusExitUntil: (n: number) => void,
   *   setFocusMode: (enabled: boolean) => void,
   *   renderHistory: () => void,
   *   hideMetricExplainer: () => void,
   *   queueViewportSync: () => void,
   *   applyRecentDrawerDomState: (p: {
   *     shouldOpen: boolean,
   *     backdrop: HTMLElement | null,
   *     drawer: HTMLElement | null,
   *     trigger: HTMLElement | null,
   *   }) => void,
   * }} deps
   */
  function setRecentDrawerOpen(open, options, deps) {
    const backdrop = deps.$("recentDrawerBackdrop");
    const drawer = deps.$("recentDrawer");
    const trigger = deps.$("recentWritingTrigger");

    const opts = options && typeof options === "object" ? options : {};
    const shouldOpen = Boolean(open);
    const skipHistory = Boolean(opts.skipHistory);
    const skipFocus = Boolean(opts.skipFocus);
    const afterOpen = typeof opts.afterOpen === "function" ? opts.afterOpen : null;

    deps.applyRecentDrawerDomState({
      shouldOpen,
      backdrop,
      drawer,
      trigger,
    });

    if (shouldOpen) {
      deps.setRecentDrawerDismissGuardUntil(Date.now() + deps.RECENT_DRAWER_DISMISS_GUARD_MS);
      if (deps.isMobileViewport()) {
        deps.setSuppressFocusExitUntil(global.performance.now() + 380);
        if (global.document.body.classList.contains("focus-mode")) {
          deps.setFocusMode(false);
        }
      }
      if (deps.editorInput && global.document.activeElement === deps.editorInput) {
        deps.editorInput.blur();
      }
    }

    deps.queueViewportSync();

    if (shouldOpen) {
      if (!skipHistory) deps.renderHistory();
      const shouldAutoExpand = Boolean(deps.state.pendingRecentDrawerExpand);
      if (!skipFocus && !shouldAutoExpand) deps.$("recentDrawerCloseBtn")?.focus();
      global.requestAnimationFrame(() => {
        afterOpen?.();
        if (shouldAutoExpand) {
          deps.state.pendingRecentDrawerExpand = false;
          if (!skipFocus) deps.$("recentDrawerCloseBtn")?.focus();
        }
        deps.queueViewportSync();
      });
    } else {
      deps.setRecentDrawerDismissGuardUntil(0);
      deps.state.pendingRecentDrawerExpand = false;
      deps.state.recentRunsHistoryExpanded = false;
      deps.hideMetricExplainer();
      deps.renderHistory();
      if (!skipFocus) trigger?.focus();
      global.requestAnimationFrame(() => {
        deps.queueViewportSync();
      });
    }
    syncRecentRailExpandedChrome(deps);
  }

  /**
   * @param {{
   *   $: (id: string) => HTMLElement | null,
   *   state: { recentRunsHistoryExpanded?: boolean },
   *   renderHistory: () => void,
   * }} deps
   */
  function bindRecentRunsExpandDismissUi(deps) {
    const $ = deps.$;
    const drawerBtn = $("recentDrawerMoreBtn");
    if (drawerBtn && drawerBtn.dataset.recentRunsExpandBound !== "1") {
      drawerBtn.dataset.recentRunsExpandBound = "1";
      drawerBtn.addEventListener("click", (e) => {
        e.preventDefault();
        deps.state.recentRunsHistoryExpanded = !deps.state.recentRunsHistoryExpanded;
        deps.renderHistory();
      });
    }
    const railBtn = $("recentRailMoreBtn");
    if (railBtn && railBtn.dataset.recentRunsExpandBound !== "1") {
      railBtn.dataset.recentRunsExpandBound = "1";
      railBtn.addEventListener("click", (e) => {
        e.preventDefault();
        deps.state.recentRunsHistoryExpanded = !deps.state.recentRunsHistoryExpanded;
        deps.renderHistory();
      });
    }
    const railBackdrop = $("recentRailExpandedBackdrop");
    if (railBackdrop && railBackdrop.dataset.recentRailDismissBound !== "1") {
      railBackdrop.dataset.recentRailDismissBound = "1";
      railBackdrop.addEventListener("click", () => {
        if (!global.document.body.classList.contains("recent-rail-expanded")) return;
        deps.state.recentRunsHistoryExpanded = false;
        deps.renderHistory();
      });
    }
    const railClose = $("recentRailExpandedCloseBtn");
    if (railClose && railClose.dataset.recentRailDismissBound !== "1") {
      railClose.dataset.recentRailDismissBound = "1";
      railClose.addEventListener("click", () => {
        if (!global.document.body.classList.contains("recent-rail-expanded")) return;
        deps.state.recentRunsHistoryExpanded = false;
        deps.renderHistory();
      });
    }
  }

  /**
   * Escape order: expanded desktop rail first, then drawer.
   * @param {{
   *   state: { recentRunsHistoryExpanded?: boolean },
   *   renderHistory: () => void,
   *   $: (id: string) => HTMLElement | null,
   *   editorInput: HTMLElement | null,
   *   isMobileViewport: () => boolean,
   *   RECENT_DRAWER_DISMISS_GUARD_MS: number,
   *   setRecentDrawerDismissGuardUntil: (n: number) => void,
   *   setSuppressFocusExitUntil: (n: number) => void,
   *   setFocusMode: (enabled: boolean) => void,
   *   hideMetricExplainer: () => void,
   *   queueViewportSync: () => void,
   *   applyRecentDrawerDomState: (p: {
   *     shouldOpen: boolean,
   *     backdrop: HTMLElement | null,
   *     drawer: HTMLElement | null,
   *     trigger: HTMLElement | null,
   *   }) => void,
   *   isDesktopPatternsViewport: () => boolean,
   * }} deps
   * @returns {boolean} true when Escape was consumed for Recent Runs surfaces
   */
  function tryHandleEscapeForRecentRunsSurfaces(deps) {
    if (global.document.body.classList.contains("recent-rail-expanded")) {
      deps.state.recentRunsHistoryExpanded = false;
      deps.renderHistory();
      return true;
    }
    if (isRecentDrawerOpen()) {
      setRecentDrawerOpen(false, {}, deps);
      return true;
    }
    return false;
  }

  global.waywordRecentRunsTransition = {
    isRecentDrawerOpen,
    syncRecentDrawerRunsExpandedBodyClass,
    syncRecentRailExpandedLayoutMetrics,
    syncRecentRailExpandedChrome,
    setRecentDrawerOpen,
    bindRecentRunsExpandDismissUi,
    tryHandleEscapeForRecentRunsSurfaces,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

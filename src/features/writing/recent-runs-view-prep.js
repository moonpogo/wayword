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

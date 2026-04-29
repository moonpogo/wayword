(function () {
  function setRecentRunsOverflowFooter(footer, visible) {
    if (!footer) return;
    var show = Boolean(visible);
    footer.classList.toggle("hidden", !show);
    footer.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function syncRecentRunsMoreButtonLabels(expanded, drawerMoreBtn, railMoreBtn) {
    if (drawerMoreBtn) {
      drawerMoreBtn.textContent = expanded ? "Show fewer" : "View older runs";
    }
    if (railMoreBtn) {
      railMoreBtn.textContent = expanded ? "Show fewer" : "View older runs";
    }
  }

  function hideRecentRunsOverflowFooters(footers) {
    footers.forEach(function (footer) {
      if (!footer) return;
      footer.classList.add("hidden");
      footer.setAttribute("aria-hidden", "true");
    });
  }

  function renderEmptyRecentRunsState(input) {
    if (input.recentVm.clearExpandedHistory) {
      input.state.recentRunsHistoryExpanded = false;
      input.syncRecentDrawerRunsExpandedBodyClass(false);
    }

    var drawerOpen = input.isRecentDrawerOpen();
    input.allLists.forEach(function (list) {
      var isDrawer = list.id === "recentDrawerList";
      list.innerHTML = input.getRecentListEmptyInnerHtml(
        isDrawer,
        drawerOpen,
        input.isDesktopPatternsViewport()
      );
    });

    hideRecentRunsOverflowFooters([input.drawerFooter, input.railFooter]);

    if (input.trigger) {
      input.trigger.disabled = false;
      input.trigger.setAttribute("aria-disabled", "false");
    }

    input.syncRecentRailExpandedChrome();
  }

  function renderRecentRunsList(list, runsSlice, idPrefix, buildRecentEntriesHtml) {
    if (!list) return;
    list.innerHTML = buildRecentEntriesHtml(runsSlice, idPrefix);
  }

  function renderFilledRecentRunsState(input) {
    var recentVm = input.recentVm;
    var drawer = recentVm.drawer || {
      runs: recentVm.drawerSlice,
      idPrefix: "draw",
      footerVisible: !recentVm.expanded && recentVm.totalCount > recentVm.capDrawer,
    };
    var rail = recentVm.rail || {
      runs: recentVm.railSlice,
      idPrefix: "rail",
      footerVisible: !recentVm.expanded && recentVm.totalCount > recentVm.capRail,
    };
    renderRecentRunsList(
      input.drawerList,
      drawer.runs,
      drawer.idPrefix,
      input.buildRecentEntriesHtml
    );
    setRecentRunsOverflowFooter(input.drawerFooter, drawer.footerVisible);

    renderRecentRunsList(
      input.railList,
      rail.runs,
      rail.idPrefix,
      input.buildRecentEntriesHtml
    );
    setRecentRunsOverflowFooter(input.railFooter, rail.footerVisible);

    input.syncRecentDrawerRunsExpandedBodyClass(recentVm.drawerRunsExpandedBody);
    syncRecentRunsMoreButtonLabels(recentVm.expanded, input.drawerMoreBtn, input.railMoreBtn);

    if (input.trigger) {
      input.trigger.disabled = false;
      input.trigger.setAttribute("aria-disabled", "false");
    }

    input.syncRecentRailExpandedChrome();
  }

  function renderRecentRunsSurfaces(input) {
    if (!input || typeof input !== "object") {
      throw new Error("waywordRecentRunsRenderCoordinator.renderRecentRunsSurfaces: input is required");
    }
    if (input.recentVm && input.recentVm.isEmpty) {
      renderEmptyRecentRunsState(input);
      return;
    }
    renderFilledRecentRunsState(input);
  }

  window.waywordRecentRunsRenderCoordinator = {
    renderRecentRunsSurfaces: renderRecentRunsSurfaces,
  };
})();

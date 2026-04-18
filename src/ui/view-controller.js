(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function isDesktopPatternsViewport() {
    return window.matchMedia("(min-width: 981px)").matches;
  }

  function applyBodySettingsOpenClass(open) {
    document.body.classList.toggle("settings-open", Boolean(open));
  }

  function applyEditorOptionsPanelAriaAndBackdrop({ open, panel, backdrop }) {
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    if (backdrop) {
      backdrop.classList.toggle("hidden", !open);
      backdrop.setAttribute("aria-hidden", open ? "false" : "true");
    }
  }

  function applyRecentDrawerDomState({ shouldOpen, backdrop, drawer, trigger }) {
    backdrop?.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
    drawer?.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
    trigger?.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    document.body.classList.toggle("recent-drawer-open", shouldOpen);
  }

  function enterLandingState() {
    const shell = document.querySelector(".app-shell");
    const app = $("appView");
    shell?.classList.add("app-shell--landing");
    shell?.classList.remove("app-shell--landing-out");
    $("landingView")?.classList.remove("hidden");
    app?.setAttribute("aria-hidden", "true");
  }

  function applyLandingExitToAppDom({ shell, landing, app }) {
    shell.classList.remove("app-shell--landing", "app-shell--landing-out");
    landing.classList.add("hidden");
    app.removeAttribute("aria-hidden");
  }

  function syncPatternsLayoutMode() {
    const appView = $("appView");
    const writeView = $("writeView");
    const profileView = $("profileView");
    const sideColumn = document.querySelector("#writeView .side-column");
    const defaultRail = $("desktopRailDefault");
    const styleTab = $("styleTab");
    if (!writeView || !profileView) return;

    const useDesktopRail = isDesktopPatternsViewport();
    const profileVisible = !profileView.classList.contains("hidden");
    const useDesktopPatterns = profileVisible && useDesktopRail;
    const useMobilePatterns = profileVisible && !useDesktopRail;

    if (useDesktopRail && sideColumn && profileView.parentElement !== sideColumn) {
      sideColumn.appendChild(profileView);
    } else if (!useDesktopRail && appView && profileView.parentElement !== appView) {
      appView.appendChild(profileView);
    }

    writeView.classList.toggle("hidden", profileVisible && !useDesktopRail);
    document.body.classList.toggle("patterns-open", useMobilePatterns);
    appView?.classList.toggle("desktop-patterns-open", useDesktopPatterns);
    sideColumn?.classList.toggle("rail-mode-patterns", useDesktopPatterns);
    if (defaultRail) defaultRail.classList.toggle("hidden", useDesktopPatterns);

    if (styleTab) {
      styleTab.classList.toggle("is-active", profileVisible);
      styleTab.setAttribute("aria-expanded", profileVisible ? "true" : "false");
    }
    logPatternsTransitionSnapshot("syncPatternsLayoutMode:after", {
      useDesktopRail,
      profileVisible,
      useDesktopPatterns,
      useMobilePatterns
    });
  }

  /**
   * @param {HTMLElement} entry
   * @param {(root: HTMLElement | null) => void} collapseMirrorEvidenceInRoot
   */
  function toggleRecentEntry(entry, collapseMirrorEvidenceInRoot) {
    const expanded = entry.querySelector(".recent-entry-expanded");
    if (!expanded) return;

    const isOpen = entry.classList.contains("is-open");
    document.querySelectorAll(".recent-entry.is-open").forEach((el) => {
      if (el === entry) return;
      el.classList.remove("is-open");
      el.classList.remove("recent-entry--active");
      el.setAttribute("aria-expanded", "false");
      const other = el.querySelector(".recent-entry-expanded");
      if (other) other.hidden = true;
    });

    entry.classList.toggle("is-open", !isOpen);
    entry.classList.toggle("recent-entry--active", !isOpen);
    expanded.hidden = isOpen;
    entry.setAttribute("aria-expanded", String(!isOpen));
    entry.querySelectorAll(".recent-entry-mirror-root").forEach(collapseMirrorEvidenceInRoot);
  }

  window.waywordViewController = {
    applyBodySettingsOpenClass,
    applyEditorOptionsPanelAriaAndBackdrop,
    applyRecentDrawerDomState,
    enterLandingState,
    applyLandingExitToAppDom,
    syncPatternsLayoutMode,
    toggleRecentEntry
  };
})();

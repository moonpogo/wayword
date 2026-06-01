(function () {
  function safeMatchMedia(win, query) {
    if (!win || typeof win.matchMedia !== "function") return false;
    try {
      var mq = win.matchMedia(query);
      return Boolean(mq && mq.matches);
    } catch (_err) {
      return false;
    }
  }

  function viewportWidth(win) {
    if (!win) return 0;
    var width = Number(win.innerWidth) || 0;
    return width > 0 ? width : 0;
  }

  function hasCoarseTouchSignals(win) {
    if (!win) return false;
    var nav = win.navigator || {};
    var points = Number(nav.maxTouchPoints) || 0;
    if (points <= 0) return false;
    return (
      safeMatchMedia(win, "(pointer: coarse)") ||
      safeMatchMedia(win, "(any-pointer: coarse)") ||
      safeMatchMedia(win, "(hover: none)") ||
      safeMatchMedia(win, "(any-hover: none)")
    );
  }

  function hasAppleMobileUa(win) {
    if (!win || !win.navigator) return false;
    var ua = String(win.navigator.userAgent || "").toLowerCase();
    if (!ua) return false;
    return ua.indexOf("iphone") >= 0 || ua.indexOf("ipad") >= 0 || ua.indexOf("ipod") >= 0;
  }

  function isLikelyMobileViewport(win) {
    var width = viewportWidth(win);
    if (width > 0 && width <= 768) return true;
    if (hasCoarseTouchSignals(win)) return true;
    if (hasAppleMobileUa(win)) return true;
    return false;
  }

  window.waywordMobileDetection = {
    isLikelyMobileViewport: isLikelyMobileViewport,
    safeMatchMedia: safeMatchMedia,
    hasCoarseTouchSignals: hasCoarseTouchSignals,
    hasAppleMobileUa: hasAppleMobileUa,
  };
})();

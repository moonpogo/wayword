(function () {
  var profilePanelCloseMotionToken = 0;

  function syncPatternsAfterVisibilityChange(input) {
    input.syncPatternsLayoutMode();
    input.renderProfile();
    input.queueViewportSync();
  }

  function resolveMobilePatternsTransition(show, input) {
    var profileView = input.profileView;
    if (show) {
      input.editorInput && input.editorInput.blur && input.editorInput.blur();
      if (document.body.classList.contains("focus-mode")) {
        input.setFocusMode(false);
      }
      profileView.classList.remove("profile-view--enter-from", "profile-view--recede");
      profileView.classList.remove("hidden");
    } else {
      input.setFocusMode(false);
      profileView.classList.remove("profile-view--enter-from", "profile-view--recede");
      profileView.classList.add("hidden");
      document.body.classList.remove("patterns-open", "keyboard-open");
      document.documentElement.classList.remove("focus-mode-layout-snap");
      input.state.isExpandedField = false;
      input.syncExpandedFieldClass();
    }

    input.syncPatternsLayoutMode();
    input.renderProfile();
    input.syncViewportHeightVar();
    input.syncKeyboardOpenClass();
    input.queueViewportSync();
    input.logPatternsTransitionSnapshot("showProfile:mobile-resolver-return", { show: show });
    requestAnimationFrame(function () {
      input.logPatternsTransitionSnapshot("showProfile:mobile-resolver-next-raf", { show: show });
    });
  }

  function showProfile(show, input) {
    if (!input || typeof input.$ !== "function") return;
    var profileView = input.$("profileView");
    if (!profileView) return;

    var nextShow = show !== false;
    var wasVisible = !profileView.classList.contains("hidden");
    var isMobilePatternsContext =
      input.isMobileViewport() && !input.isDesktopPatternsViewport();
    var isPatternsOpen = document.body.classList.contains("patterns-open");

    input.logPatternsTransitionSnapshot("showProfile:enter", {
      show: nextShow,
      wasVisible: wasVisible,
      isMobilePatternsContext: isMobilePatternsContext,
      isPatternsOpen: isPatternsOpen
    });

    if (nextShow) {
      profilePanelCloseMotionToken++;
    }

    if (isMobilePatternsContext && (nextShow || wasVisible || isPatternsOpen)) {
      resolveMobilePatternsTransition(nextShow, {
        profileView: profileView,
        editorInput: input.editorInput,
        state: input.state,
        setFocusMode: input.setFocusMode,
        syncExpandedFieldClass: input.syncExpandedFieldClass,
        syncPatternsLayoutMode: input.syncPatternsLayoutMode,
        renderProfile: input.renderProfile,
        syncViewportHeightVar: input.syncViewportHeightVar,
        syncKeyboardOpenClass: input.syncKeyboardOpenClass,
        queueViewportSync: input.queueViewportSync,
        logPatternsTransitionSnapshot: input.logPatternsTransitionSnapshot
      });
      return;
    }

    var motion = !input.prefersReducedUiMotion();

    if (nextShow && !input.isDesktopPatternsViewport()) {
      input.editorInput && input.editorInput.blur && input.editorInput.blur();
      if (input.isMobileViewport() && document.body.classList.contains("focus-mode")) {
        input.setFocusMode(false);
      }
    }

    if (!motion) {
      profileView.classList.toggle("hidden", !nextShow);
      syncPatternsAfterVisibilityChange(input);
      input.logPatternsTransitionSnapshot("showProfile:no-motion-return", { show: nextShow });
      return;
    }

    if (nextShow && !wasVisible) {
      profileView.classList.remove("profile-view--recede");
      profileView.classList.add("profile-view--enter-from");
      profileView.classList.remove("hidden");
      input.syncPatternsLayoutMode();
      input.renderProfile();
      void profileView.offsetWidth;
      requestAnimationFrame(function () {
        profileView.classList.remove("profile-view--enter-from");
        input.queueViewportSync();
        input.logPatternsTransitionSnapshot("showProfile:open-next-raf");
      });
      input.logPatternsTransitionSnapshot("showProfile:open-return");
      return;
    }

    if (!nextShow && wasVisible) {
      if (input.isMobileViewport()) {
        input.setFocusMode(false);
        profileView.classList.remove("profile-view--enter-from", "profile-view--recede");
        profileView.classList.add("hidden");
        syncPatternsAfterVisibilityChange(input);
        input.logPatternsTransitionSnapshot("showProfile:close-mobile-return");
        return;
      }
      if (profileView.classList.contains("profile-view--recede")) {
        return;
      }
      var closeToken = profilePanelCloseMotionToken;
      var settled = false;
      var settle = function () {
        profileView.removeEventListener("transitionend", onTransitionEnd);
        if (settled) return;
        if (closeToken !== profilePanelCloseMotionToken) return;
        settled = true;
        profileView.classList.add("hidden");
        profileView.classList.remove("profile-view--recede");
        syncPatternsAfterVisibilityChange(input);
        input.logPatternsTransitionSnapshot("showProfile:close-desktop-settle");
      };
      var onTransitionEnd = function (e) {
        if (e.target !== profileView) return;
        if (e.propertyName !== "opacity" && e.propertyName !== "transform") return;
        settle();
      };
      profileView.addEventListener("transitionend", onTransitionEnd);
      void profileView.offsetWidth;
      profileView.classList.add("profile-view--recede");
      window.setTimeout(settle, 260);
      return;
    }

    profileView.classList.remove("profile-view--enter-from", "profile-view--recede");
    profileView.classList.toggle("hidden", !nextShow);
    syncPatternsAfterVisibilityChange(input);
    input.logPatternsTransitionSnapshot("showProfile:fallthrough-return", { show: nextShow });
  }

  window.waywordPatternsTransitionCoordinator = {
    showProfile: showProfile
  };
})();

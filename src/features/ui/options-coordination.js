(function () {
  function createCoordinator(input) {
    var suppressGearClickToggle = false;

    function afterOptionsPanelClosed() {
      if (
        window.waywordEditorFocusRecovery &&
        typeof window.waywordEditorFocusRecovery.afterOptionsPanelClosed === "function"
      ) {
        return window.waywordEditorFocusRecovery.afterOptionsPanelClosed({
          isMobileViewport: input.isMobileViewport,
          state: input.state,
          editorInput: input.editorInput,
          focusEditorToEnd: input.focusEditorToEnd
        });
      }

      if (!input.isMobileViewport()) return;
      if (!document.body.classList.contains("focus-mode")) return;
      if (!input.state.active || input.state.submitted || !input.editorInput) return;
      if (input.state.optionsOpen) return;
      if (document.activeElement === input.editorInput) return;
      input.focusEditorToEnd();
    }

    function setOptionsOpen(open) {
      if (
        window.waywordOptionsPanelTransitionCoordinator &&
        typeof window.waywordOptionsPanelTransitionCoordinator.setOptionsOpen === "function"
      ) {
        return window.waywordOptionsPanelTransitionCoordinator.setOptionsOpen(open, {
          $: input.$,
          state: input.state,
          optionsPanelDismissGuardMs: input.optionsPanelDismissGuardMs,
          setOptionsPanelDismissGuardUntil: input.setOptionsPanelDismissGuardUntil,
          clearBannedPanelPersistTimer: input.clearBannedPanelPersistTimer,
          syncWordModesPanel: input.syncWordModesPanel,
          syncTimeModesPanel: input.syncTimeModesPanel,
          getBannedPanelValue: input.getBannedPanelValue,
          flushBannedPanelPersistFromPanel: input.flushBannedPanelPersistFromPanel,
          afterOptionsPanelClosed: afterOptionsPanelClosed,
          applyBodySettingsOpenClass: input.applyBodySettingsOpenClass,
          applyEditorOptionsPanelAriaAndBackdrop: input.applyEditorOptionsPanelAriaAndBackdrop,
          syncViewportHeightVar: input.syncViewportHeightVar,
          queueViewportSync: input.queueViewportSync
        });
      }

      var nextOpen = Boolean(open);
      var wasOpen = input.state.optionsOpen;
      input.state.optionsOpen = nextOpen;

      var panel = input.$("editorOptionsPanel");
      var backdrop = input.$("editorOptionsBackdrop");
      if (!panel) return;
      input.applyBodySettingsOpenClass(nextOpen);

      if (nextOpen) {
        input.setOptionsPanelDismissGuardUntil(Date.now() + input.optionsPanelDismissGuardMs);
        input.clearBannedPanelPersistTimer();

        input.syncWordModesPanel();
        input.syncTimeModesPanel();

        var bannedInput = input.$("bannedInlineInputPanel");
        if (bannedInput && document.activeElement !== bannedInput) {
          bannedInput.value = input.getBannedPanelValue();
        }
        requestAnimationFrame(function () {
          var livePanel = input.$("editorOptionsPanel");
          if (!livePanel || !input.state.optionsOpen) return;
          var lockWidth = Math.round(livePanel.getBoundingClientRect().width);
          if (lockWidth > 0) {
            livePanel.style.width = String(lockWidth) + "px";
            livePanel.style.maxWidth = String(lockWidth) + "px";
          }
        });
      } else {
        input.setOptionsPanelDismissGuardUntil(0);
        input.flushBannedPanelPersistFromPanel();
        panel.style.removeProperty("width");
        panel.style.removeProperty("max-width");
      }

      input.applyEditorOptionsPanelAriaAndBackdrop({
        open: nextOpen,
        panel: panel,
        backdrop: backdrop
      });

      if (!nextOpen && wasOpen) {
        requestAnimationFrame(function () {
          afterOptionsPanelClosed();
        });
      }
    }

    function bindOptionsSurfaceEventGuards() {
      var panel = input.$("editorOptionsPanel");
      if (panel && panel.dataset.optionsSurfaceGuardBound !== "1") {
        panel.dataset.optionsSurfaceGuardBound = "1";
        panel.addEventListener("pointerdown", function (e) {
          e.stopPropagation();
        });
        panel.addEventListener("click", function (e) {
          e.stopPropagation();
        });
      }
    }

    function bindOptionsOpenCloseControls() {
      if (
        window.waywordOptionsPanelInteractions &&
        typeof window.waywordOptionsPanelInteractions.bindOptionsPanelInteractions === "function"
      ) {
        window.waywordOptionsPanelInteractions.bindOptionsPanelInteractions({
          $: input.$,
          getOptionsOpen: input.getOptionsOpen,
          getOptionsPanelDismissGuardUntil: input.getOptionsPanelDismissGuardUntil,
          setOptionsOpen: setOptionsOpen
        });
        return;
      }

      var backdrop = input.$("editorOptionsBackdrop");
      if (backdrop && backdrop.dataset.optionsInteractionBound !== "1") {
        backdrop.dataset.optionsInteractionBound = "1";
        backdrop.addEventListener("click", function (e) {
          if (Date.now() < input.getOptionsPanelDismissGuardUntil()) return;
          var panel = input.$("editorOptionsPanel");
          if (panel && panel.contains(e.target)) return;
          setOptionsOpen(false);
        });
      }

      var trigger = input.$("optionsTrigger");
      if (trigger && trigger.dataset.optionsInteractionBound !== "1") {
        trigger.dataset.optionsInteractionBound = "1";
        trigger.addEventListener(
          "pointerdown",
          function () {
            suppressGearClickToggle = false;
            if (!input.getOptionsOpen()) {
              setOptionsOpen(true);
              suppressGearClickToggle = true;
            }
          },
          true
        );

        trigger.addEventListener("click", function (e) {
          e.stopPropagation();
          if (suppressGearClickToggle) {
            suppressGearClickToggle = false;
            return;
          }
          setOptionsOpen(!input.getOptionsOpen());
        });
      }

      var closeBtn = input.$("editorOptionsCloseBtn");
      if (closeBtn && closeBtn.dataset.optionsInteractionBound !== "1") {
        closeBtn.dataset.optionsInteractionBound = "1";
        closeBtn.addEventListener("click", function (e) {
          e.preventDefault();
          if (Date.now() < input.getOptionsPanelDismissGuardUntil()) return;
          setOptionsOpen(false);
        });
      }
    }

    function tryHandleEscapeForOptionsSurface() {
      if (!input.getOptionsOpen()) return false;
      setOptionsOpen(false);
      return true;
    }

    return {
      bindOptionsOpenCloseControls: bindOptionsOpenCloseControls,
      bindOptionsSurfaceEventGuards: bindOptionsSurfaceEventGuards,
      setOptionsOpen: setOptionsOpen,
      tryHandleEscapeForOptionsSurface: tryHandleEscapeForOptionsSurface
    };
  }

  window.waywordOptionsUiCoordination = {
    createCoordinator: createCoordinator
  };
})();

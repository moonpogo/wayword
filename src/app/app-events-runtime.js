(function () {
  function bindEditorInputEvents(input) {
    var editorInput = input.editorInput;
    if (!editorInput || editorInput.dataset.appEventsBound === "1") return;
    editorInput.dataset.appEventsBound = "1";

    editorInput.addEventListener("focus", function () {
      input.setFocusMode(true);
    });

    editorInput.addEventListener("blur", function (e) {
      if (
        !input.mobileEditorFocusGuard ||
        typeof input.mobileEditorFocusGuard.handleEditorBlur !== "function"
      ) {
        return;
      }
      return input.mobileEditorFocusGuard.handleEditorBlur(
        {
          state: input.state,
          hideEditorSemanticPicker: input.hideEditorSemanticPicker,
          queueViewportSync: input.queueViewportSync,
          getSuppressFocusExitUntil: input.getSuppressFocusExitUntil,
          isMobilePatternsVisible: input.isMobilePatternsVisible,
          syncViewportHeightVar: input.syncViewportHeightVar,
          syncKeyboardOpenClass: input.syncKeyboardOpenClass,
          setFocusMode: input.setFocusMode
        },
        e
      );
    });

    editorInput.addEventListener("compositionstart", function () {
      input.setEditorSurfaceComposing(true);
    });

    editorInput.addEventListener("compositionend", function () {
      input.setEditorSurfaceComposing(false);
      if (!input.isActiveAndEditable()) return;
      input.flushEditorSurfaceIntoWriteDocOnce();
      input.tryStartTimerOnFirstMeaningfulInput();
      input.pulseWordmark();
      input.renderHighlight();
      input.renderSidebar();
      input.updateWordProgress();
      input.updateEnterButtonVisibility();
      input.scheduleSemanticPickerFromSelection();
      if (typeof input.renderMeta === "function") {
        input.renderMeta();
      }
      if (
        window.waywordMobileEditorCaretReveal &&
        typeof window.waywordMobileEditorCaretReveal.schedule === "function"
      ) {
        window.waywordMobileEditorCaretReveal.schedule(editorInput);
      }
    });

    editorInput.addEventListener("input", function () {
      if (!input.isActiveAndEditable()) return;
      if (input.getEditorSurfaceComposing()) {
        if (
          window.waywordMobileEditorCaretReveal &&
          typeof window.waywordMobileEditorCaretReveal.schedule === "function"
        ) {
          window.waywordMobileEditorCaretReveal.schedule(editorInput);
        }
        return;
      }
      input.flushEditorSurfaceIntoWriteDocOnce();
      input.tryStartTimerOnFirstMeaningfulInput();
      input.pulseWordmark();
      input.renderHighlight();
      input.renderSidebar();
      input.updateWordProgress();
      input.updateEnterButtonVisibility();
      input.scheduleSemanticPickerFromSelection();
      if (typeof input.renderMeta === "function") {
        input.renderMeta();
      }
      if (
        window.waywordMobileEditorCaretReveal &&
        typeof window.waywordMobileEditorCaretReveal.schedule === "function"
      ) {
        window.waywordMobileEditorCaretReveal.schedule(editorInput);
      }
    });

    var editorScrollSurface = input.editorInputScrollport || editorInput;
    editorScrollSurface.addEventListener(
      "scroll",
      function () {
        input.syncScroll();
        input.scheduleSemanticPickerFromSelection();
      },
      { passive: true }
    );

    editorInput.addEventListener("keydown", function (e) {
      if (
        input.completedUiRestartInteractions &&
        typeof input.completedUiRestartInteractions.handleEditorCompletedRestartKeydown === "function" &&
        input.completedUiRestartInteractions.handleEditorCompletedRestartKeydown(
          {
            state: input.state,
            runPostSubmitAutoNewRunNow: input.runPostSubmitAutoNewRunNow
          },
          e
        )
      ) {
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.state.submitted) {
          if (input.state.completedUiActive && !input.state.optionsOpen) {
            input.runPostSubmitAutoNewRunNow();
          }
          return;
        }
        if (input.getEditorText().trim().length === 0) return;
        input.submitWriting(false);
      }

      var moveCaretKeys = {
        ArrowDown: true,
        ArrowUp: true,
        ArrowLeft: true,
        ArrowRight: true,
        Home: true,
        End: true,
        PageUp: true,
        PageDown: true
      };
      if (
        moveCaretKeys[e.key] &&
        window.waywordMobileEditorCaretReveal &&
        typeof window.waywordMobileEditorCaretReveal.schedule === "function"
      ) {
        window.requestAnimationFrame(function () {
          window.waywordMobileEditorCaretReveal.schedule(editorInput);
        });
      }
    });

    editorInput.addEventListener("pointerup", function () {
      if (
        window.waywordMobileEditorCaretReveal &&
        typeof window.waywordMobileEditorCaretReveal.schedule === "function"
      ) {
        window.waywordMobileEditorCaretReveal.schedule(editorInput);
      }
    });

    var selectionDoc =
      (editorInput.ownerDocument && typeof editorInput.ownerDocument.addEventListener === "function"
        ? editorInput.ownerDocument
        : null) ||
      (input.document && typeof input.document.addEventListener === "function" ? input.document : null);
    if (selectionDoc && editorInput.dataset.appEditorSelectionRevealBound !== "1") {
      editorInput.dataset.appEditorSelectionRevealBound = "1";
      selectionDoc.addEventListener("selectionchange", function () {
        if (selectionDoc.activeElement !== editorInput) {
          return;
        }
        if (
          !window.waywordMobileEditorCaretReveal ||
          typeof window.waywordMobileEditorCaretReveal.scheduleFromSelectionChange !== "function"
        ) {
          return;
        }
        window.waywordMobileEditorCaretReveal.scheduleFromSelectionChange(editorInput);
      });
    }
  }

  function bindPromptCardRestart(input) {
    var promptCard = input.$("promptCard");
    if (!promptCard || promptCard.dataset.appPromptCardBound === "1") return;
    promptCard.dataset.appPromptCardBound = "1";
    promptCard.addEventListener("click", function (e) {
      var origin = input.domEventTargetElement(e);
      if (!origin || !origin.closest("[data-mirror-next-pass]")) return;
      e.preventDefault();
      input.runPostSubmitAutoNewRunNow();
    });
  }

  function bindDocumentEvents(input) {
    var root = input.document.documentElement;
    if (root.dataset.appDocumentKeydownBound !== "1") {
      root.dataset.appDocumentKeydownBound = "1";
      input.document.addEventListener("keydown", function (e) {
        if (
          input.completedUiRestartInteractions &&
          typeof input.completedUiRestartInteractions.handleDocumentCompletedRestartKeydown === "function" &&
          input.completedUiRestartInteractions.handleDocumentCompletedRestartKeydown(
            {
              state: input.state,
              runPostSubmitAutoNewRunNow: input.runPostSubmitAutoNewRunNow
            },
            e
          )
        ) {
          return;
        }

        if (e.key !== "Escape") return;
        if (input.tryHandleEscapeForOptionsSurface()) {
          e.preventDefault();
          return;
        }
        if (input.tryHandleEscapeForRecentRunsSurfaces()) {
          e.preventDefault();
        }
      });
    }

    if (root.dataset.appDocumentPointerdownBound !== "1") {
      root.dataset.appDocumentPointerdownBound = "1";
      input.document.addEventListener("pointerdown", function (e) {
        if (
          !input.mobileEditorFocusGuard ||
          typeof input.mobileEditorFocusGuard.handleDocumentPointerDown !== "function"
        ) {
          return;
        }
        return input.mobileEditorFocusGuard.handleDocumentPointerDown(
          {
            editorInput: input.editorInput,
            isMobileViewport: input.isMobileViewport
          },
          e
        );
      });
    }
  }

  function bindPrimaryControls(input) {
    var beginBtn = input.$("beginBtn");
    if (beginBtn && beginBtn.dataset.appBeginBound !== "1") {
      beginBtn.dataset.appBeginBound = "1";
      beginBtn.addEventListener("click", function () {
        input.enterAppState({
          afterEnter: function () {
            input.scheduleDeferredEditorFocus("end");
          },
          dockFocusModeForMobile: false,
        });
        if (input.isMobileViewport()) {
          input.setFocusMode(true);
        }
        input.startWriting({ deferEditorFocus: true });
      });
    }

    var themeToggleInPanel = input.$("themeToggleInPanel");
    if (themeToggleInPanel && themeToggleInPanel.dataset.appControlBound !== "1") {
      themeToggleInPanel.dataset.appControlBound = "1";
      themeToggleInPanel.addEventListener("click", input.toggleTheme);
    }

    var styleTab = input.$("styleTab");
    if (styleTab && styleTab.dataset.appControlBound !== "1") {
      styleTab.dataset.appControlBound = "1";
      styleTab.addEventListener("pointerdown", function () {
        input.panelCoordination.armMobilePatternsToggleGuard({
          isMobileViewport: input.isMobileViewport,
          setSuppressFocusExitUntil: input.setSuppressFocusExitUntil,
          now: input.now,
          durationMs: 320
        });
      });
      styleTab.addEventListener("click", function () {
        input.panelCoordination.togglePatternsPanelFromStyleTab({
          $: input.$,
          showProfile: input.showProfile,
          source: "styleTab:click",
          logPatternsTransitionSnapshot: input.logPatternsTransitionSnapshot
        });
      });
      styleTab.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        input.panelCoordination.armMobilePatternsToggleGuard({
          isMobileViewport: input.isMobileViewport,
          setSuppressFocusExitUntil: input.setSuppressFocusExitUntil,
          now: input.now,
          durationMs: 320
        });
        input.panelCoordination.togglePatternsPanelFromStyleTab({
          $: input.$,
          showProfile: input.showProfile,
          source: "styleTab:key",
          key: e.key,
          logPatternsTransitionSnapshot: input.logPatternsTransitionSnapshot,
          skipTimeoutLog: true
        });
      });
    }

    var shuffleBtn = input.$("shuffleBtn");
    if (shuffleBtn && shuffleBtn.dataset.appControlBound !== "1") {
      shuffleBtn.dataset.appControlBound = "1";
      shuffleBtn.addEventListener("click", input.triggerShuffle);
    }

    var repeatLimitPill = input.$("repeatLimitPill");
    if (repeatLimitPill && repeatLimitPill.dataset.appControlBound !== "1") {
      repeatLimitPill.dataset.appControlBound = "1";
      repeatLimitPill.addEventListener("click", input.cycleRepeatLimit);
    }

    var enterSubmitBtn = input.$("enterSubmitBtn");
    if (enterSubmitBtn && enterSubmitBtn.dataset.appControlBound !== "1") {
      enterSubmitBtn.dataset.appControlBound = "1";
      enterSubmitBtn.addEventListener("click", function () {
        if (!input.editorInput || input.getEditorText().trim().length === 0) return;
        input.submitWriting(false);
      });
    }

    var saveBannedBtn = input.$("saveBannedBtn");
    if (saveBannedBtn && saveBannedBtn.dataset.appControlBound !== "1") {
      saveBannedBtn.dataset.appControlBound = "1";
      saveBannedBtn.addEventListener("click", input.saveBannedInline);
    }
  }

  function bindPanelControlWiring(input) {
    input.document.querySelectorAll("#wordModesPanel button[data-words]").forEach(function (btn) {
      if (btn.dataset.appPanelControlBound === "1") return;
      btn.dataset.appPanelControlBound = "1";
      btn.addEventListener("click", function () {
        input.applyWordTargetFromPanel(btn.dataset.words);
      });
    });

    input.document.querySelectorAll("#timeModesPanel button[data-time]").forEach(function (btn) {
      if (btn.dataset.appPanelControlBound === "1") return;
      btn.dataset.appPanelControlBound = "1";
      btn.addEventListener("click", function () {
        input.applyTimerFromPanel(btn.dataset.time);
      });
    });

    var shuffleBtnPanel = input.$("shuffleBtnPanel");
    if (shuffleBtnPanel && shuffleBtnPanel.dataset.appPanelControlBound !== "1") {
      shuffleBtnPanel.dataset.appPanelControlBound = "1";
      shuffleBtnPanel.addEventListener("click", input.triggerShuffle);
    }

    var bannedInlineInputPanel = input.$("bannedInlineInputPanel");
    if (bannedInlineInputPanel && bannedInlineInputPanel.dataset.appPanelControlBound !== "1") {
      bannedInlineInputPanel.dataset.appPanelControlBound = "1";
      bannedInlineInputPanel.addEventListener("input", input.scheduleBannedPanelPersistFromPanel);
      bannedInlineInputPanel.addEventListener("blur", function () {
        input.flushBannedPanelPersistFromPanel();
      });
    }
  }

  window.waywordAppEventsRuntime = {
    bindEditorInputEvents: bindEditorInputEvents,
    bindPromptCardRestart: bindPromptCardRestart,
    bindDocumentEvents: bindDocumentEvents,
    bindPrimaryControls: bindPrimaryControls,
    bindPanelControlWiring: bindPanelControlWiring
  };
})();

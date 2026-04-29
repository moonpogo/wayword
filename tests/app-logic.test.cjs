const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createClassList,
  createMemoryStorage,
  loadBrowserScripts,
  silentConsole,
} = require("./helpers/browser-context.cjs");

function buildPromptLibrary() {
  const promptLibrary = {
    Scene: [
      { id: "obs-1", text: "Prompt 1", nearDuplicateGroup: "obs-a", active: true },
      { id: "obs-2", text: "Prompt 2", nearDuplicateGroup: "obs-a", active: true },
      { id: "obs-3", text: "Prompt 3", nearDuplicateGroup: "obs-b", active: true },
    ],
    Relation: [
      { id: "rel-1", text: "Prompt 4", nearDuplicateGroup: "rel-a", active: true },
    ],
  };
  const promptEntryById = new Map(
    Object.values(promptLibrary)
      .flat()
      .map((entry) => [entry.id, entry])
  );
  return { promptLibrary, promptEntryById };
}

function loadPromptSelectionContext() {
  return loadBrowserScripts(["src/features/writing/prompt-selection.js"], {
    console: silentConsole(),
  });
}

function loadRunControllerRuntimeContext(overrides = {}) {
  return loadBrowserScripts(["src/app/run-controller-runtime.js"], {
    console: silentConsole(),
    ...overrides,
  });
}

function loadAppBootRuntimeContext(overrides = {}) {
  return loadBrowserScripts(["src/app/app-boot-runtime.js"], {
    console: silentConsole(),
    ...overrides,
  });
}

function loadAppEventsRuntimeContext(overrides = {}) {
  return loadBrowserScripts(["src/app/app-events-runtime.js"], {
    console: silentConsole(),
    ...overrides,
  });
}

function loadEditorShellInteractionsContext(overrides = {}) {
  return loadBrowserScripts(["src/features/writing/editor-shell-interactions.js"], {
    console: silentConsole(),
    ...overrides,
  });
}

function loadProgressionRuntimeContext(overrides = {}) {
  return loadBrowserScripts(["src/app/progression-runtime.js"], {
    console: silentConsole(),
    ...overrides,
  });
}

function loadAnalysisRuntimeContext(overrides = {}) {
  return loadBrowserScripts(["src/app/analysis-runtime.js"], {
    console: silentConsole(),
    ...overrides,
  });
}

function loadPromptRuntimeContext(overrides = {}) {
  return loadBrowserScripts(["src/app/prompt-runtime.js"], {
    console: silentConsole(),
    ...overrides,
  });
}

function loadRecentRunsPrepContext() {
  return loadBrowserScripts(["src/features/writing/recent-runs-view-prep.js"], {
    console: silentConsole(),
  });
}

function loadPostSubmitPhaseContext() {
  return loadBrowserScripts(["src/features/writing/post-submit-phase.js"], {
    console: silentConsole(),
  });
}

function loadRecentRunsInteractionContext(documentStub) {
  return loadBrowserScripts(["src/features/writing/recent-runs-interaction.js"], {
    console: silentConsole(),
    document: documentStub,
  });
}

function loadPatternsTransitionCoordinatorVm() {
  const profileClass = createClassList();
  const profileView = {
    classList: profileClass,
    removeEventListener() {},
    addEventListener() {},
    offsetWidth: 100,
  };
  const bodyClass = createClassList(["patterns-open", "keyboard-open"]);
  const docElClass = createClassList(["focus-mode-layout-snap"]);
  const state = { isExpandedField: true };
  const documentStub = {
    body: { classList: bodyClass },
    documentElement: { classList: docElClass },
  };
  const context = loadBrowserScripts(["src/features/writing/patterns-transition-coordinator.js"], {
    console: silentConsole(),
    document: documentStub,
  });
  const $ = (id) => (id === "profileView" ? profileView : null);
  const deps = {
    $,
    state,
    editorInput: { blur() {} },
    isMobileViewport: () => true,
    isDesktopPatternsViewport: () => false,
    prefersReducedUiMotion: () => false,
    setFocusMode() {},
    syncExpandedFieldClass() {},
    syncPatternsLayoutMode() {},
    renderProfile() {},
    syncViewportHeightVar() {},
    syncKeyboardOpenClass() {},
    queueViewportSync() {},
    logPatternsTransitionSnapshot() {},
  };
  return { context, profileView, profileClass, bodyClass, docElClass, state, deps };
}

function loadSavedRunsContext(overrides = {}) {
  return loadBrowserScripts(
    [
      "src/data/runs/schemaVersion.js",
      "src/data/runs/runDocumentUtils.js",
      "src/data/runs/runDocumentMarkdown.js",
      "src/data/runs/runDocumentModel.js",
      "src/data/runs/runDocumentRepository.js",
      "src/data/runs/savedRunsCanonicalRead.js",
      "src/data/runs/savedRunPersistence.js",
    ],
    {
      console: silentConsole(),
      localStorage: createMemoryStorage(),
      waywordRunModel: {
        cloneMirrorPipelineResultForStorage(value) {
          return JSON.parse(JSON.stringify(value));
        },
      },
      ...overrides,
    }
  );
}

function loadRunMigrationContext(overrides = {}) {
  return loadBrowserScripts(
    [
      "src/data/runs/schemaVersion.js",
      "src/data/runs/runDocumentUtils.js",
      "src/data/runs/runDocumentMarkdown.js",
      "src/data/runs/runDocumentModel.js",
      "src/data/runs/runDocumentRepository.js",
      "src/data/runs/migrateLegacyRunDocuments.js",
    ],
    {
      console: silentConsole(),
      localStorage: createMemoryStorage(),
      ...overrides,
    }
  );
}

function makeCanonicalSaveInput(overrides = {}) {
  return {
    runId: "run-default",
    savedAt: 100,
    timestamp: 100,
    body: "alpha draft",
    prompt: "Prompt",
    analysis: {
      totalWords: 2,
      repeated: [],
      bannedHits: [],
      repeatedStarters: [],
      uniqueCount: 2,
      uniqueRatio: 1,
      avgSentenceLength: 2,
      counts: {},
      starterCounts: {},
      starterExampleList: [],
      punctuation: {},
      perspective: {},
    },
    runScore: 12,
    scoreBreakdown: { completion: 12 },
    challengeActive: false,
    challengeCompleted: false,
    challengeWordsSnapshot: [],
    wasSuccessful: true,
    activeTargetWords: 60,
    activeTimerSecondsForRun: null,
    finishedWithinTime: true,
    timeRemainingSnapshot: null,
    timerConfigured: false,
    repeatLimitAtRun: 2,
    mirrorLoadFailed: true,
    ...overrides,
  };
}

test("prompt selection avoids immediate repeat ids and near-duplicate groups when eligible", () => {
  const context = loadPromptSelectionContext();
  const { promptLibrary, promptEntryById } = buildPromptLibrary();

  const chosen = context.waywordPromptSelection.choosePromptFamilyAndEntry({
    forcedFamilyKey: "Scene",
    recentPromptIds: ["obs-1"],
    recentFamilyKeys: ["Scene"],
    promptFamiliesOrder: ["Scene", "Relation"],
    promptLibrary,
    promptEntryById,
    recentIdWindow: 8,
    nearDuplicateWindow: 3,
    recentFamilyWindow: 4,
    rng: () => 0,
  });

  assert.equal(chosen.family, "Scene");
  assert.equal(chosen.entry.id, "obs-3");
  assert.notEqual(chosen.entry.nearDuplicateGroup, "obs-a");
});

test("prompt selection falls across families when the forced family is exhausted", () => {
  const context = loadPromptSelectionContext();
  const { promptLibrary, promptEntryById } = buildPromptLibrary();

  const chosen = context.waywordPromptSelection.choosePromptFamilyAndEntry({
    forcedFamilyKey: "Scene",
    recentPromptIds: ["obs-1", "obs-2", "obs-3"],
    recentFamilyKeys: ["Scene", "Scene"],
    promptFamiliesOrder: ["Scene", "Relation"],
    promptLibrary,
    promptEntryById,
    recentIdWindow: 8,
    nearDuplicateWindow: 3,
    recentFamilyWindow: 4,
    rng: () => 0,
  });

  assert.equal(chosen.family, "Relation");
  assert.equal(chosen.entry.id, "rel-1");
});

test("reroll gating stays tied to active, unsubmitted, empty-editor state", () => {
  const context = loadPromptSelectionContext();

  assert.equal(
    context.waywordPromptSelection.canRerollPromptCore({
      active: true,
      submitted: false,
      editorTextEmpty: true,
      promptRerollsUsed: 0,
      rerollLimit: 2,
    }),
    true
  );

  assert.equal(
    context.waywordPromptSelection.canRerollPromptCore({
      active: true,
      submitted: false,
      editorTextEmpty: false,
      promptRerollsUsed: 0,
      rerollLimit: 2,
    }),
    false
  );
});

test("run controller runtime registers built deps and keeps input callable surfaces", () => {
  const context = loadRunControllerRuntimeContext();
  let registered = null;
  const controller = {
    registerDeps(value) {
      registered = value;
    },
  };
  const input = {
    state: { active: true },
    $: () => "node",
    editorInput: { id: "editor" },
    getEditorSurfaceComposing() {
      return true;
    },
    flushEditorSurfaceIntoWriteDocOnce() {},
    getEditorText() {
      return "draft";
    },
    analyze() {
      return { totalWords: 1 };
    },
    getRecentEntries() {
      return [];
    },
    makeRunId() {
      return "run-1";
    },
    persist() {},
    CALIBRATION_THRESHOLD: 4,
    CALIBRATION_INSUFFICIENT_COPY: "keep going",
    INACTIVITY_EASE_RUN_KEY: "ease",
    selectCalibrationObservation() {
      return "observe";
    },
    calibrationSubmissionHasMinimumSignal() {
      return true;
    },
    clearExerciseIfCompleted() {},
    applyWriteDocSemanticFlagsFromAnalysisCore() {},
    updateEnterButtonVisibility() {},
    stopTimer() {},
    completeWordmark() {},
    getActiveTargetWordsForScoring() {
      return 60;
    },
    computeRunScoreV1() {
      return { runScore: 80, scoreBreakdown: { completion: 25 } };
    },
    computeAndStoreMirrorPipelineResult() {},
    recomputeProgressionLevel() {},
    applyProgressionToState() {},
    renderHistory() {},
    renderProfileSummaryStrip() {},
    renderProfile() {},
    renderHighlight() {},
    renderWritingState() {},
    renderMeta() {},
    renderSidebar() {},
    queueViewportSync() {},
    setExerciseWords() {},
    generatePrompt() {
      return "Prompt";
    },
    setEditorText() {},
    setBannedEditorOpen() {},
    setOptionsOpen() {},
    showProfile() {},
    scheduleDeferredEditorFocus() {},
    scheduleEditorDotOverlaySync() {},
    syncEditorBottomChromeForCalibrationOverlay() {},
    focusEditorToStart() {},
    updateTimeFill() {},
    waywordPostRunRenderer: { renderReflectionLine() {} },
    syncCalibrationHandoffIntentAfterDecision() {},
    readCalibrationHandoffAcknowledged() {
      return false;
    },
  };

  const deps = context.waywordRunControllerRuntime.registerRunControllerDeps(controller, input);

  assert.equal(registered, deps);
  assert.equal(deps.state, input.state);
  assert.equal(deps.getEditorSurfaceComposing(), true);
  assert.equal(deps.getEditorText(), "draft");
  assert.equal(deps.CALIBRATION_THRESHOLD, 4);
  assert.equal(typeof deps.syncCalibrationHandoffIntentAfterDecision, "function");
  assert.equal(typeof deps.readCalibrationHandoffAcknowledged, "function");
});

test("app boot runtime binds viewport listeners and initial render sequence", () => {
  const context = loadAppBootRuntimeContext();
  const calls = [];
  const visualViewport = {
    addEventListener(eventName, handler) {
      calls.push(["visualViewport", eventName, typeof handler]);
    },
  };
  const windowStub = {
    visualViewport,
    addEventListener(eventName, handler) {
      calls.push(["window", eventName, typeof handler]);
    },
    setTimeout(fn) {
      calls.push(["timeout"]);
      fn();
      return 1;
    },
  };
  const state = { theme: "light", progressionLevel: 0 };

  context.waywordAppBootRuntime.bindViewportObservers({
    window: windowStub,
    queueViewportSync() {},
  });

  context.waywordAppBootRuntime.runInitialRender({
    state,
    syncViewportHeightVar() {
      calls.push("syncViewportHeightVar");
    },
    applyTheme(value) {
      calls.push(["applyTheme", value]);
    },
    loadStoredProgressionLevel() {
      calls.push("loadStoredProgressionLevel");
      return 2;
    },
    recomputeProgressionLevel(options) {
      calls.push(["recomputeProgressionLevel", options.sessionInit]);
    },
    applyProgressionToState() {
      calls.push("applyProgressionToState");
    },
    ensurePromptRerollButton() {
      calls.push("ensurePromptRerollButton");
    },
    bindPromptClusterControlsOnce() {
      calls.push("bindPromptClusterControlsOnce");
    },
    renderMeta() {
      calls.push("renderMeta");
    },
    renderWritingState() {
      calls.push("renderWritingState");
    },
    projectWriteDocToEditorFromState(a, b, c) {
      calls.push(["projectWriteDocToEditorFromState", a, b, c]);
    },
    renderHighlight() {
      calls.push("renderHighlight");
    },
    scheduleEditorDotOverlaySync() {
      calls.push("scheduleEditorDotOverlaySync");
    },
    renderSidebar() {
      calls.push("renderSidebar");
    },
    renderHistory() {
      calls.push("renderHistory");
    },
    renderProfile() {
      calls.push("renderProfile");
    },
    syncPatternsLayoutMode() {
      calls.push("syncPatternsLayoutMode");
    },
    renderCalibration() {
      calls.push("renderCalibration");
    },
    renderProfileSummaryStrip() {
      calls.push("renderProfileSummaryStrip");
    },
    updateEnterButtonVisibility() {
      calls.push("updateEnterButtonVisibility");
    },
  });

  assert.deepEqual(calls.slice(0, 3), [
    ["window", "resize", "function"],
    ["visualViewport", "resize", "function"],
    ["visualViewport", "scroll", "function"],
  ]);
  assert.equal(state.progressionLevel, 2);
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "applyTheme" && entry[1] === "light"));
  assert.ok(calls.includes("renderProfileSummaryStrip"));
});

test("app boot runtime resize observers stay inert when targets are missing", () => {
  const context = loadAppBootRuntimeContext({
    document: {
      querySelector() {
        return null;
      },
    },
  });

  class ResizeObserverStub {
    observe() {
      throw new Error("observe should not run without targets");
    }
  }

  const shellResult = context.waywordAppBootRuntime.bindEditorShellEdgeResizeObserver({
    window: { setTimeout },
    document: { querySelector: () => null },
    ResizeObserver: ResizeObserverStub,
    queueViewportSync() {},
  });
  const overlayResult = context.waywordAppBootRuntime.bindEditorCalibrationOverlayResizeObserver({
    $() {
      return null;
    },
    ResizeObserver: ResizeObserverStub,
    syncEditorCalibrationOverlayClip() {},
  });

  assert.equal(shellResult, null);
  assert.equal(overlayResult, null);
});

test("app events runtime binds editor input events once, syncs scroll, and submits on enter", () => {
  const context = loadAppEventsRuntimeContext();
  const listeners = new Map();
  const editorInput = {
    dataset: {},
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
  };
  const calls = [];
  const input = {
    editorInput,
    state: { active: true, submitted: false, completedUiActive: false, optionsOpen: false },
    setFocusMode(value) {
      calls.push(["setFocusMode", value]);
    },
    mobileEditorFocusGuard: null,
    hideEditorSemanticPicker() {},
    queueViewportSync() {},
    getSuppressFocusExitUntil() {
      return 0;
    },
    isMobilePatternsVisible() {
      return false;
    },
    syncViewportHeightVar() {},
    syncKeyboardOpenClass() {},
    setEditorSurfaceComposing(value) {
      calls.push(["setEditorSurfaceComposing", value]);
    },
    getEditorSurfaceComposing() {
      return false;
    },
    isActiveAndEditable() {
      return true;
    },
    flushEditorSurfaceIntoWriteDocOnce() {
      calls.push("flush");
    },
    tryStartTimerOnFirstMeaningfulInput() {
      calls.push("timer");
    },
    pulseWordmark() {
      calls.push("pulse");
    },
    renderHighlight() {
      calls.push("highlight");
    },
    renderSidebar() {
      calls.push("sidebar");
    },
    updateWordProgress() {
      calls.push("progress");
    },
    updateEnterButtonVisibility() {
      calls.push("button");
    },
    renderMeta() {
      calls.push("renderMeta");
    },
    scheduleSemanticPickerFromSelection() {
      calls.push("picker");
    },
    syncScroll() {
      calls.push("syncScroll");
    },
    scheduleEditorDotOverlaySync() {
      calls.push("scheduleEditorDotOverlaySync");
    },
    completedUiRestartInteractions: null,
    runPostSubmitAutoNewRunNow() {
      calls.push("restart");
    },
    getEditorText() {
      return "hello world";
    },
    submitWriting(value) {
      calls.push(["submitWriting", value]);
    },
  };

  context.waywordAppEventsRuntime.bindEditorInputEvents(input);
  context.waywordAppEventsRuntime.bindEditorInputEvents(input);

  assert.equal(editorInput.dataset.appEventsBound, "1");
  assert.equal(listeners.has("keydown"), true);

  listeners.get("focus")();
  listeners.get("scroll")();
  listeners.get("keydown")({
    key: "Enter",
    shiftKey: false,
    preventDefault() {
      calls.push("preventDefault");
    },
  });

  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "setFocusMode" && entry[1] === true));
  assert.ok(calls.includes("syncScroll"));
  assert.ok(calls.includes("picker"));
  assert.ok(calls.includes("preventDefault"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "submitWriting" && entry[1] === false));

  calls.length = 0;
  listeners.get("input")();
  assert.ok(calls.includes("renderMeta"), "expected editor input to refresh meta (including prompt reroll affordance)");
});

test("app events runtime binds document, primary controls, and panel controls once", () => {
  const documentListeners = new Map();
  const rootDataset = {};
  const wordBtn = {
    dataset: { words: "60" },
    addEventListener(name, handler) {
      this[name] = handler;
    },
  };
  wordBtn.dataset.words = "60";
  const timeBtn = {
    dataset: { time: "240" },
    addEventListener(name, handler) {
      this[name] = handler;
    },
  };
  timeBtn.dataset.time = "240";
  const nodes = new Map();
  function makeNode(id) {
    return {
      id,
      dataset: {},
      addEventListener(name, handler) {
        this[name] = handler;
      },
    };
  }
  nodes.set("beginBtn", makeNode("beginBtn"));
  nodes.set("themeToggleInPanel", makeNode("themeToggleInPanel"));
  nodes.set("styleTab", makeNode("styleTab"));
  nodes.set("shuffleBtn", makeNode("shuffleBtn"));
  nodes.set("repeatLimitPill", makeNode("repeatLimitPill"));
  nodes.set("enterSubmitBtn", makeNode("enterSubmitBtn"));
  nodes.set("saveBannedBtn", makeNode("saveBannedBtn"));
  nodes.set("shuffleBtnPanel", makeNode("shuffleBtnPanel"));
  nodes.set("bannedInlineInputPanel", makeNode("bannedInlineInputPanel"));
  nodes.set("promptCard", makeNode("promptCard"));

  const documentStub = {
    documentElement: { dataset: rootDataset },
    addEventListener(name, handler) {
      documentListeners.set(name, handler);
    },
    querySelectorAll(selector) {
      if (selector === "#wordModesPanel button[data-words]") return [wordBtn];
      if (selector === "#timeModesPanel button[data-time]") return [timeBtn];
      return [];
    },
  };

  const context = loadAppEventsRuntimeContext({ document: documentStub });
  const calls = [];
  const $ = (id) => nodes.get(id) || null;
  const mobileEditorFocusGuard = {
    handleDocumentPointerDown(payload, event) {
      calls.push(["handleDocumentPointerDown", payload.editorInput === nodes.get("enterSubmitBtn"), event.type]);
    },
  };

  context.waywordAppEventsRuntime.bindDocumentEvents({
    document: documentStub,
    state: {},
    completedUiRestartInteractions: null,
    runPostSubmitAutoNewRunNow() {},
    tryHandleEscapeForOptionsSurface() {
      calls.push("optionsEscape");
      return true;
    },
    tryHandleEscapeForRecentRunsSurfaces() {
      calls.push("recentEscape");
      return false;
    },
    mobileEditorFocusGuard,
    editorInput: nodes.get("enterSubmitBtn"),
    isMobileViewport() {
      return false;
    },
  });
  context.waywordAppEventsRuntime.bindDocumentEvents({
    document: documentStub,
    state: {},
    completedUiRestartInteractions: null,
    runPostSubmitAutoNewRunNow() {},
    tryHandleEscapeForOptionsSurface() {
      return false;
    },
    tryHandleEscapeForRecentRunsSurfaces() {
      return false;
    },
    mobileEditorFocusGuard,
    editorInput: nodes.get("enterSubmitBtn"),
    isMobileViewport() {
      return false;
    },
  });

  context.waywordAppEventsRuntime.bindPrimaryControls({
    $,
    enterAppState(options) {
      calls.push(["enterAppState", options.dockFocusModeForMobile]);
      options.afterEnter();
    },
    scheduleDeferredEditorFocus(position) {
      calls.push(["scheduleDeferredEditorFocus", position]);
    },
    isMobileViewport() {
      return false;
    },
    setFocusMode(value) {
      calls.push(["setFocusMode", value]);
    },
    startWriting(options) {
      calls.push(["startWriting", options.deferEditorFocus]);
    },
    toggleTheme() {
      calls.push("toggleTheme");
    },
    panelCoordination: {
      armMobilePatternsToggleGuard(payload) {
        calls.push(["armMobilePatternsToggleGuard", payload.durationMs]);
      },
      togglePatternsPanelFromStyleTab(payload) {
        calls.push(["togglePatternsPanelFromStyleTab", payload.source]);
      },
    },
    setSuppressFocusExitUntil(value) {
      calls.push(["setSuppressFocusExitUntil", typeof value]);
    },
    now() {
      return 123;
    },
    showProfile() {},
    logPatternsTransitionSnapshot() {},
    triggerShuffle() {
      calls.push("triggerShuffle");
    },
    cycleRepeatLimit() {
      calls.push("cycleRepeatLimit");
    },
    editorInput: {},
    getEditorText() {
      return "text";
    },
    submitWriting(value) {
      calls.push(["submitWriting", value]);
    },
    saveBannedInline() {
      calls.push("saveBannedInline");
    },
  });
  context.waywordAppEventsRuntime.bindPrimaryControls({
    $,
    enterAppState() {},
    scheduleDeferredEditorFocus() {},
    isMobileViewport() {
      return false;
    },
    setFocusMode() {},
    startWriting() {},
    toggleTheme() {},
    panelCoordination: {
      armMobilePatternsToggleGuard() {},
      togglePatternsPanelFromStyleTab() {},
    },
    setSuppressFocusExitUntil() {},
    now() {
      return 123;
    },
    showProfile() {},
    logPatternsTransitionSnapshot() {},
    triggerShuffle() {},
    cycleRepeatLimit() {},
    editorInput: {},
    getEditorText() {
      return "text";
    },
    submitWriting() {},
    saveBannedInline() {},
  });

  context.waywordAppEventsRuntime.bindPromptCardRestart({
    $,
    domEventTargetElement(event) {
      return event.target;
    },
    runPostSubmitAutoNewRunNow() {
      calls.push("runPostSubmitAutoNewRunNow");
    },
  });
  context.waywordAppEventsRuntime.bindPromptCardRestart({
    $,
    domEventTargetElement(event) {
      return event.target;
    },
    runPostSubmitAutoNewRunNow() {},
  });

  context.waywordAppEventsRuntime.bindPanelControlWiring({
    document: documentStub,
    $,
    applyWordTargetFromPanel(value) {
      calls.push(["applyWordTargetFromPanel", value]);
    },
    applyTimerFromPanel(value) {
      calls.push(["applyTimerFromPanel", value]);
    },
    triggerShuffle() {
      calls.push("panelShuffle");
    },
    scheduleBannedPanelPersistFromPanel() {
      calls.push("scheduleBannedPanelPersistFromPanel");
    },
    flushBannedPanelPersistFromPanel() {
      calls.push("flushBannedPanelPersistFromPanel");
    },
  });
  context.waywordAppEventsRuntime.bindPanelControlWiring({
    document: documentStub,
    $,
    applyWordTargetFromPanel() {},
    applyTimerFromPanel() {},
    triggerShuffle() {},
    scheduleBannedPanelPersistFromPanel() {},
    flushBannedPanelPersistFromPanel() {},
  });

  documentListeners.get("keydown")({
    key: "Escape",
    preventDefault() {
      calls.push("preventEscapeDefault");
    },
  });
  documentListeners.get("pointerdown")({ type: "pointerdown" });
  nodes.get("promptCard").click({
    preventDefault() {
      calls.push("preventPromptDefault");
    },
    target: {
      closest(selector) {
        return selector === "[data-mirror-next-pass]" ? this : null;
      },
    },
  });
  nodes.get("beginBtn").click();
  nodes.get("themeToggleInPanel").click();
  nodes.get("styleTab").pointerdown();
  nodes.get("styleTab").click();
  wordBtn.click();
  timeBtn.click();
  nodes.get("shuffleBtnPanel").click();
  nodes.get("bannedInlineInputPanel").input();
  nodes.get("bannedInlineInputPanel").blur();

  assert.ok(calls.includes("optionsEscape"));
  assert.ok(calls.includes("preventEscapeDefault"));
  assert.ok(calls.includes("preventPromptDefault"));
  assert.ok(calls.includes("runPostSubmitAutoNewRunNow"));
  assert.ok(
    calls.some(
      (entry) =>
        Array.isArray(entry) && entry[0] === "handleDocumentPointerDown" && entry[1] === true && entry[2] === "pointerdown"
    )
  );
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "startWriting" && entry[1] === true));
  assert.ok(calls.includes("toggleTheme"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "applyWordTargetFromPanel" && entry[1] === "60"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "applyTimerFromPanel" && entry[1] === "240"));
  assert.ok(calls.includes("panelShuffle"));
  assert.ok(calls.includes("flushBannedPanelPersistFromPanel"));
});

test("editor shell interactions bind once and respect blocked, restart, and focus flows", () => {
  const scheduled = [];
  const context = loadEditorShellInteractionsContext({
    requestAnimationFrame(fn) {
      scheduled.push(fn);
      return 1;
    },
  });
  const listeners = new Map();
  const editorShell = {
    dataset: {},
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
  };
  const calls = [];
  const input = {
    editorShell,
    resetAnnotationRowPendingEditorSel() {
      calls.push("resetAnnotationRowPendingEditorSel");
    },
    handleEditorSurfaceCompletedRestart(event) {
      calls.push(["handleEditorSurfaceCompletedRestart", event.kind]);
      return event.kind === "restart";
    },
    isActiveAndEditable() {
      calls.push("isActiveAndEditable");
      return true;
    },
    focusEditorToEnd() {
      calls.push("focusEditorToEnd");
    },
  };

  context.waywordEditorShellInteractions.bindEditorShellInteractions(input);
  context.waywordEditorShellInteractions.bindEditorShellInteractions(input);

  assert.equal(editorShell.dataset.editorShellInteractionBound, "1");
  assert.equal(listeners.has("pointerdown"), true);

  listeners.get("pointerdown")({
    kind: "editor",
    target: {
      closest(selector) {
        return selector === "#editorInput" ? this : null;
      },
    },
  });

  listeners.get("pointerdown")({
    kind: "blocked",
    target: {
      closest(selector) {
        return selector === "#optionsTrigger" ? this : null;
      },
    },
  });

  listeners.get("pointerdown")({
    kind: "restart",
    target: {
      closest() {
        return null;
      },
    },
  });

  listeners.get("pointerdown")({
    kind: "focus",
    target: {
      closest() {
        return null;
      },
    },
  });

  assert.ok(calls.includes("resetAnnotationRowPendingEditorSel"));
  assert.ok(
    calls.some(
      (entry) => Array.isArray(entry) && entry[0] === "handleEditorSurfaceCompletedRestart" && entry[1] === "restart"
    )
  );
  assert.ok(calls.includes("isActiveAndEditable"));
  assert.equal(scheduled.length, 1);
  scheduled[0]();
  assert.ok(calls.includes("focusEditorToEnd"));
});

test("progression runtime clamps, loads, applies, and persists levels", () => {
  const context = loadProgressionRuntimeContext();
  const writes = [];
  const state = { progressionLevel: 2, targetWords: 0, timerSeconds: 0 };
  const input = {
    state,
    storage: {
      readProgressionLevelOrDefault() {
        return "3.9";
      },
      saveProgressionLevel(key, value) {
        writes.push([key, value]);
      },
      getInactivityEaseRunMarker() {
        return null;
      },
      setInactivityEaseRunMarker() {},
    },
    progressionLevelKey: "progression-key",
    progressionLevels: [
      { level: 1, targetWords: 60, timerSeconds: 120 },
      { level: 2, targetWords: 120, timerSeconds: 240 },
      { level: 3, targetWords: 240, timerSeconds: 360 },
    ],
    inactivityEaseRunKey: "ease-key",
    readSavedRunsChronological() {
      return [];
    },
    now() {
      return 0;
    },
  };

  assert.equal(context.waywordProgressionRuntime.clampProgressionLevel("2.8"), 2);
  assert.equal(context.waywordProgressionRuntime.loadStoredProgressionLevel(input), 3);
  assert.deepEqual(context.waywordProgressionRuntime.getProgressionConfig(input, 2), {
    level: 2,
    targetWords: 120,
    timerSeconds: 240,
  });

  context.waywordProgressionRuntime.applyProgressionToState(input);
  assert.equal(state.targetWords, 120);
  assert.equal(state.timerSeconds, 240);

  context.waywordProgressionRuntime.persistProgressionLevel(input);
  assert.deepEqual(writes, [["progression-key", 2]]);
});

test("progression runtime eases on stale sessions and advances after strong runs", () => {
  const context = loadProgressionRuntimeContext();
  const markerWrites = [];
  const progressionWrites = [];
  const state = { progressionLevel: 2 };
  const chronologicalRuns = [
    { runId: "run-1", savedAt: 10, wasSuccessful: false },
    { runId: "run-2", savedAt: 20, wasSuccessful: true },
    { runId: "run-3", savedAt: 30, wasSuccessful: true },
    { runId: "run-4", savedAt: 40, wasSuccessful: true },
    { runId: "run-5", savedAt: 50, wasSuccessful: true },
    { runId: "run-6", savedAt: 60, wasSuccessful: true },
    { runId: "run-7", savedAt: 70, wasSuccessful: true },
    { runId: "run-8", savedAt: 80, wasSuccessful: true },
  ];
  const input = {
    state,
    storage: {
      readProgressionLevelOrDefault() {
        return 2;
      },
      saveProgressionLevel(key, value) {
        progressionWrites.push([key, value]);
      },
      getInactivityEaseRunMarker() {
        return null;
      },
      setInactivityEaseRunMarker(key, value) {
        markerWrites.push([key, value]);
      },
    },
    progressionLevelKey: "progression-key",
    progressionLevels: [
      { level: 1, targetWords: 60, timerSeconds: 120 },
      { level: 2, targetWords: 120, timerSeconds: 240 },
      { level: 3, targetWords: 240, timerSeconds: 360 },
    ],
    inactivityEaseRunKey: "ease-key",
    readSavedRunsChronological() {
      return chronologicalRuns;
    },
    now() {
      return 8 * 86400000;
    },
  };

  const sessionInitResult = context.waywordProgressionRuntime.recomputeProgressionLevel(input, {
    sessionInit: true,
  });
  assert.equal(state.progressionLevel, 1);
  assert.deepEqual(markerWrites, [["ease-key", "run-8"]]);
  assert.equal(sessionInitResult.prevLevel, 2);

  state.progressionLevel = 2;
  const afterRunResult = context.waywordProgressionRuntime.recomputeProgressionLevel(input, {
    afterRun: true,
  });
  assert.equal(state.progressionLevel, 3);
  assert.equal(afterRunResult.changed, true);
  assert.ok(progressionWrites.length >= 2);
});

test("analysis runtime computes run score with repeat and banned penalties", () => {
  const context = loadAnalysisRuntimeContext();
  const analysis = {
    totalWords: 12,
    bannedHits: [
      { word: "just", count: 2, isExercise: false },
      { word: "glass", count: 1, isExercise: true },
    ],
    repeated: [["hallway", 4]],
    repeatedStarters: [["i", 3]],
  };

  const result = context.waywordAnalysisRuntime.computeRunScoreV1({}, analysis, 2, 12);

  assert.equal(result.runScore, 15);
  assert.deepEqual(JSON.parse(JSON.stringify(result.scoreBreakdown)), {
    completion: 25,
    filler: 19,
    repetition: 19,
    openings: 19,
    completionMultiplier: 1,
  });
});

test("analysis runtime analyzes text with repeat, banned, and sentence signals", () => {
  const context = loadAnalysisRuntimeContext();
  const input = {
    repeatLimit: 1,
    exerciseWords: ["glass"],
    banned: ["just"],
    targetWords: 6,
    exemptWords: new Set(["the"]),
    tokenize(text) {
      return String(text || "")
        .split(/\s+/)
        .map((word) => word.toLowerCase().replace(/[^a-z']/g, ""))
        .filter(Boolean);
    },
    countWords(tokens) {
      const counts = {};
      tokens.forEach((token) => {
        counts[token] = (counts[token] || 0) + 1;
      });
      return counts;
    },
    sentenceStarters(text) {
      return String(text || "")
        .split(/[.!?]+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean)
        .map((sentence) => sentence.split(/\s+/)[0].toLowerCase().replace(/[^a-z']/g, ""));
    },
    sentenceStarterExamples(text) {
      return String(text || "")
        .split(/[.!?]+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean)
        .map((sentence) => ({
          starter: sentence.split(/\s+/)[0].toLowerCase().replace(/[^a-z']/g, ""),
          excerpt: sentence,
        }));
    },
    countPerspective(tokens) {
      return {
        first: tokens.filter((token) => token === "i").length,
        second: tokens.filter((token) => token === "you").length,
        third: tokens.filter((token) => token === "they").length,
      };
    },
    countPunctuation(text) {
      return {
        commas: (String(text || "").match(/,/g) || []).length,
      };
    },
  };

  const result = context.waywordAnalysisRuntime.analyze(
    input,
    "I just saw glass. I just saw hallway hallway."
  );

  assert.equal(result.totalWords, 9);
  assert.equal(result.uniqueCount, 5);
  assert.deepEqual(result.repeated, [["i", 2], ["just", 2], ["saw", 2], ["hallway", 2]]);
  assert.deepEqual(JSON.parse(JSON.stringify(result.bannedHits)), [
    { word: "just", count: 2, isExercise: false },
    { word: "glass", count: 1, isExercise: true },
  ]);
  assert.deepEqual(result.repeatedStarters, [["i", 2]]);
  assert.equal(result.targetDelta, 3);
  assert.equal(result.uniqueRatio, 5 / 9);
  assert.equal(result.avgSentenceLength, 4.5);
  assert.deepEqual(result.perspective, { first: 2, second: 0, third: 0 });
  assert.deepEqual(result.punctuation, { commas: 0 });
});

test("prompt runtime generates prompt and updates prompt history state", () => {
  const context = loadPromptRuntimeContext();
  const state = {
    recentPromptIds: ["obs-0"],
    recentFamilyKeys: ["Scene"],
  };
  const input = {
    state,
    promptSelection: {
      choosePromptFamilyAndEntry() {
        return {
          family: "Relation",
          entry: { id: "rel-2", text: "Prompt 2" },
        };
      },
    },
    promptFamiliesOrder: ["Scene", "Relation"],
    promptLibrary: {},
    promptEntryById: new Map(),
    promptRecentIdWindow: 3,
    promptNearDuplicateWindow: 2,
    promptRecentFamilyWindow: 2,
    promptRerollLimit: 2,
    biasTagsForPromptFamily(family) {
      return [family.toLowerCase()];
    },
    getEditorText() {
      return "";
    },
    renderMeta() {},
  };

  const text = context.waywordPromptRuntime.generatePrompt(input, {});

  assert.equal(text, "Prompt 2");
  assert.equal(state.promptId, "rel-2");
  assert.equal(state.prompt, "Prompt 2");
  assert.equal(state.promptFamily, "Relation");
  assert.equal(state.lastPromptKey, "Relation::rel-2");
  assert.deepEqual(state.promptBiasTags, ["relation"]);
  assert.deepEqual(state.recentPromptIds, ["obs-0", "rel-2"]);
  assert.deepEqual(state.recentFamilyKeys, ["Scene", "Relation"]);
});

test("prompt runtime reroll respects eligibility and rerenders meta", () => {
  const context = loadPromptRuntimeContext();
  const calls = [];
  const state = {
    active: true,
    submitted: false,
    promptRerollsUsed: 0,
    promptFamily: "Scene",
    recentPromptIds: [],
    recentFamilyKeys: [],
  };
  const input = {
    state,
    promptSelection: {
      canRerollPromptCore() {
        return true;
      },
      choosePromptFamilyAndEntry(args) {
        calls.push(["choosePromptFamilyAndEntry", args.forcedFamilyKey]);
        return {
          family: "Scene",
          entry: { id: "obs-2", text: "Prompt 2" },
        };
      },
    },
    promptFamiliesOrder: ["Scene", "Relation"],
    promptLibrary: {},
    promptEntryById: new Map(),
    promptRecentIdWindow: 8,
    promptNearDuplicateWindow: 3,
    promptRecentFamilyWindow: 4,
    promptRerollLimit: 2,
    biasTagsForPromptFamily() {
      return ["scene"];
    },
    getEditorText() {
      return "";
    },
    renderMeta() {
      calls.push("renderMeta");
    },
  };

  const rerolled = context.waywordPromptRuntime.rerollPrompt(input);

  assert.equal(rerolled, true);
  assert.equal(state.prompt, "Prompt 2");
  assert.equal(state.promptRerollsUsed, 1);
  assert.ok(calls.includes("renderMeta"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "choosePromptFamilyAndEntry" && entry[1] === "Scene"));
});

test("prompt runtime reroll is a no-op when editor text is not empty", () => {
  const promptSelection = loadPromptSelectionContext().waywordPromptSelection;
  const context = loadPromptRuntimeContext();
  const state = {
    active: true,
    submitted: false,
    promptRerollsUsed: 0,
    prompt: "Hold this copy",
    promptId: "hold-1",
    promptFamily: "Scene",
    recentPromptIds: [],
    recentFamilyKeys: [],
  };
  const input = {
    state,
    promptSelection,
    promptFamiliesOrder: ["Scene"],
    promptLibrary: {},
    promptEntryById: new Map(),
    promptRecentIdWindow: 8,
    promptNearDuplicateWindow: 3,
    promptRecentFamilyWindow: 4,
    promptRerollLimit: 2,
    biasTagsForPromptFamily() {
      return [];
    },
    getEditorText() {
      return "not empty";
    },
    renderMeta() {
      assert.fail("renderMeta should not run when reroll is blocked");
    },
  };

  const ok = context.waywordPromptRuntime.rerollPrompt(input);

  assert.equal(ok, false);
  assert.equal(state.promptRerollsUsed, 0);
  assert.equal(state.prompt, "Hold this copy");
});

test("recent runs view prep returns expected empty and expanded states", () => {
  const context = loadRecentRunsPrepContext();
  const prep = context.waywordRecentRunsViewPrep.prepareRecentRunsViewModel;

  const empty = prep({
    runsNewestFirst: [],
    historyExpanded: false,
    capDrawer: 3,
    capRail: 2,
  });
  assert.equal(empty.isEmpty, true);
  assert.equal(empty.clearExpandedHistory, true);

  const filled = prep({
    runsNewestFirst: [{ runId: "run-3" }, { runId: "run-2" }, { runId: "run-1" }],
    historyExpanded: false,
    capDrawer: 2,
    capRail: 1,
  });
  assert.equal(filled.isEmpty, false);
  assert.equal(filled.totalCount, 3);
  assert.deepEqual(filled.drawerSlice.map((run) => run.runId), ["run-3", "run-2"]);
  assert.deepEqual(filled.railSlice.map((run) => run.runId), ["run-3"]);

  const expanded = prep({
    runsNewestFirst: [{ runId: "run-2" }, { runId: "run-1" }],
    historyExpanded: true,
    capDrawer: 1,
    capRail: 1,
  });
  assert.equal(expanded.expanded, true);
  assert.equal(expanded.drawerRunsExpandedBody, true);
  assert.deepEqual(expanded.drawerSlice.map((run) => run.runId), ["run-2", "run-1"]);
  assert.deepEqual(expanded.railSlice.map((run) => run.runId), ["run-2", "run-1"]);
});

test("recent runs row expansion keeps a single open entry and toggles aria-expanded", () => {
  function makeRecentEntry() {
    const expanded = { hidden: true };
    const classList = createClassList();
    return {
      classList,
      querySelector(sel) {
        return sel === ".recent-entry-expanded" ? expanded : null;
      },
      setAttribute(name, value) {
        this._attrs = this._attrs || new Map();
        this._attrs.set(name, value);
      },
      getAttribute(name) {
        return this._attrs?.get(name) ?? null;
      },
      expanded,
    };
  }

  const entryA = makeRecentEntry();
  const entryB = makeRecentEntry();
  const allEntries = [entryA, entryB];

  const documentStub = {
    querySelectorAll(sel) {
      if (sel !== ".recent-entry.is-open") return [];
      return allEntries.filter((el) => el.classList.contains("is-open"));
    },
  };

  const context = loadRecentRunsInteractionContext(documentStub);
  const { toggleRecentEntry } = context.waywordRecentRunsInteraction;

  toggleRecentEntry(entryA);
  assert.equal(entryA.classList.contains("is-open"), true);
  assert.equal(entryA.expanded.hidden, false);
  assert.equal(entryA.getAttribute("aria-expanded"), "true");

  toggleRecentEntry(entryB);
  assert.equal(entryA.classList.contains("is-open"), false);
  assert.equal(entryA.expanded.hidden, true);
  assert.equal(entryA.getAttribute("aria-expanded"), "false");
  assert.equal(entryB.classList.contains("is-open"), true);
  assert.equal(entryB.expanded.hidden, false);

  toggleRecentEntry(entryB);
  assert.equal(entryB.classList.contains("is-open"), false);
  assert.equal(entryB.expanded.hidden, true);
});

test("patterns transition coordinator closes mobile profile shell state", () => {
  const { context, profileClass, bodyClass, docElClass, state, deps } = loadPatternsTransitionCoordinatorVm();
  const { showProfile } = context.waywordPatternsTransitionCoordinator;

  profileClass.remove("hidden");
  assert.equal(profileClass.contains("hidden"), false);

  showProfile(false, deps);

  assert.equal(profileClass.contains("hidden"), true);
  assert.equal(bodyClass.contains("patterns-open"), false);
  assert.equal(bodyClass.contains("keyboard-open"), false);
  assert.equal(docElClass.contains("focus-mode-layout-snap"), false);
  assert.equal(state.isExpandedField, false);
});

test("post-submit phase derivation names current run/post-submit scenarios", () => {
  const context = loadPostSubmitPhaseContext();
  const derive = context.waywordPostSubmitPhase.derivePostSubmitPhase;
  const P = context.waywordPostSubmitPhase.PHASES;

  assert.equal(derive({ state: { active: false } }), P.IDLE);
  assert.equal(
    derive({ state: { active: true, submitted: false, completedUiActive: false } }),
    P.DRAFTING
  );
  assert.equal(
    derive({
      state: {
        active: true,
        submitted: true,
        completedUiActive: true,
        calibrationPostRun: { step: 1, observation: "Baseline", insufficient: false },
      },
    }),
    P.SUBMITTED_CALIBRATION_BASELINE
  );
  assert.equal(
    derive({
      state: {
        active: true,
        submitted: true,
        completedUiActive: true,
        calibrationPostRun: { step: 1, observation: "Add enough writing.", insufficient: true },
      },
    }),
    P.SUBMITTED_CALIBRATION_INSUFFICIENT
  );
  assert.equal(
    derive({
      state: {
        active: true,
        submitted: true,
        completedUiActive: true,
        calibrationHandoffVisible: true,
        calibrationPostRun: { step: 5, observation: "Baseline", insufficient: false },
      },
    }),
    P.SUBMITTED_CALIBRATION_HANDOFF
  );
  assert.equal(
    derive({
      state: {
        active: true,
        submitted: true,
        completedUiActive: true,
        lastMirrorPipelineResult: {
          main: { category: "repetition", statement: "One word keeps returning." },
        },
      },
    }),
    P.SUBMITTED_MIRROR_READY
  );
  assert.equal(
    derive({
      state: {
        active: true,
        submitted: true,
        completedUiActive: true,
        lastMirrorPipelineResult: {
          main: { category: "low_signal", statement: "Signal is thin." },
        },
      },
    }),
    P.SUBMITTED_MIRROR_LOW_SIGNAL
  );
  assert.equal(
    derive({
      state: {
        active: true,
        submitted: true,
        completedUiActive: true,
        lastMirrorPipelineResult: {
          main: { category: "fallback", statement: "No strong pattern resolves yet." },
        },
      },
      mirrorLowSignal: true,
    }),
    P.SUBMITTED_MIRROR_LOW_SIGNAL
  );
  assert.equal(
    derive({
      state: {
        active: true,
        submitted: true,
        completedUiActive: true,
        lastMirrorLoadFailed: true,
      },
    }),
    P.SUBMITTED_MIRROR_UNAVAILABLE
  );
});

test("saved-run persistence writes canonical documents and reads them back in both orders", () => {
  const removedMarkers = [];
  const context = loadSavedRunsContext();
  context.waywordStorage = {
    removeInactivityEaseRun(key) {
      removedMarkers.push(key);
    },
  };
  context.waywordRunDocumentRepo =
    context.waywordRunDocumentRepository.createLocalStorageRunDocumentRepository({
      storage: context.localStorage,
    });

  const history = [];
  const savedRunIds = new Set();
  let persistCalls = 0;

  const first = context.waywordSavedRunPersistence.persistSuccessfulSavedRun({
    run: { runId: "run-1" },
    canonicalSaveInput: makeCanonicalSaveInput({
      runId: "run-1",
      savedAt: 100,
      timestamp: 100,
      body: "alpha draft",
    }),
    history,
    savedRunIds,
    inactivityEaseRunKey: "ease-key",
    persist() {
      persistCalls += 1;
    },
  });

  const second = context.waywordSavedRunPersistence.persistSuccessfulSavedRun({
    run: { runId: "run-2" },
    canonicalSaveInput: makeCanonicalSaveInput({
      runId: "run-2",
      savedAt: 200,
      timestamp: 200,
      body: "beta draft",
    }),
    history,
    savedRunIds,
    inactivityEaseRunKey: "ease-key",
    persist() {
      persistCalls += 1;
    },
  });

  assert.equal(first.canonicalPersisted, true);
  assert.equal(second.canonicalPersisted, true);
  assert.equal(persistCalls, 2);
  assert.deepEqual(removedMarkers, ["ease-key", "ease-key"]);
  assert.deepEqual(history.map((row) => row.runId), ["run-1", "run-2"]);
  assert.ok(savedRunIds.has("run-1"));
  assert.ok(savedRunIds.has("run-2"));
  assert.ok(context.localStorage.getItem(context.WAYWORD_RUN_DOCUMENTS_STORAGE_KEY));

  const chronological = context.waywordSavedRunsRead.listSavedRunsChronological();
  const newestFirst = context.waywordSavedRunsRead.listSavedRunsNewestFirst();

  assert.deepEqual(Array.from(chronological, (row) => row.runId), ["run-1", "run-2"]);
  assert.deepEqual(Array.from(newestFirst, (row) => row.runId), ["run-2", "run-1"]);
  assert.equal(newestFirst[0].text, "beta draft");
  assert.equal(chronological[0].text, "alpha draft");
});

test("saved-run persistence keeps legacy sync alive when canonical upsert fails", () => {
  const removedMarkers = [];
  const context = loadSavedRunsContext();
  const innerRepo = context.waywordRunDocumentRepository.createLocalStorageRunDocumentRepository({
    storage: context.localStorage,
  });
  context.waywordRunDocumentRepo = {
    upsertDocument() {
      throw new Error("quota");
    },
    listDocumentsParsed() {
      return innerRepo.listDocumentsParsed();
    },
    getDocumentByRunId(id) {
      return innerRepo.getDocumentByRunId(id);
    },
    clearAllDocuments() {
      return innerRepo.clearAllDocuments();
    },
  };
  context.waywordStorage = {
    removeInactivityEaseRun(key) {
      removedMarkers.push(key);
    },
  };

  const history = [];
  const savedRunIds = new Set();
  let persistCalls = 0;

  const result = context.waywordSavedRunPersistence.persistSuccessfulSavedRun({
    run: { runId: "run-fail" },
    canonicalSaveInput: makeCanonicalSaveInput({
      runId: "run-fail",
      savedAt: 100,
      timestamp: 100,
      body: "projected row body text",
    }),
    history,
    savedRunIds,
    inactivityEaseRunKey: "ease-key",
    persist() {
      persistCalls += 1;
    },
  });

  assert.equal(result.canonicalPersisted, false);
  assert.equal(result.legacyPersisted, true);
  assert.equal(history.length, 1);
  assert.equal(history[0].runId, "run-fail");
  assert.equal(String(history[0].text || "").trim(), "projected row body text");
  assert.ok(savedRunIds.has("run-fail"));
  assert.equal(persistCalls, 1);
  assert.deepEqual(removedMarkers, ["ease-key"]);
  assert.equal(innerRepo.listDocumentsParsed().length, 0, "canonical store must stay empty when upsert throws");
  assert.equal(
    context.waywordSavedRunsRead.listSavedRunsChronological().length,
    0,
    "savedRunsRead lists repo only; legacy row lives in memory until reload/migration"
  );
});

test("run document repository treats corrupt envelope JSON as empty", () => {
  const storage = createMemoryStorage();
  storage.setItem("wayword-run-documents-v1", "not-json{");
  const context = loadBrowserScripts(
    ["src/data/runs/schemaVersion.js", "src/data/runs/runDocumentRepository.js"],
    { console: silentConsole(), localStorage: storage }
  );
  const repo = context.waywordRunDocumentRepository.createLocalStorageRunDocumentRepository({
    storage,
  });
  assert.equal(repo.listDocumentsParsed().length, 0);
});

test("run document repository ignores unknown store envelope versions", () => {
  const storage = createMemoryStorage();
  storage.setItem(
    "wayword-run-documents-v1",
    JSON.stringify({ storeEnvelopeVersion: 99999, items: ["should-be-ignored"] })
  );
  const context = loadBrowserScripts(
    ["src/data/runs/schemaVersion.js", "src/data/runs/runDocumentRepository.js"],
    { console: silentConsole(), localStorage: storage }
  );
  const repo = context.waywordRunDocumentRepository.createLocalStorageRunDocumentRepository({
    storage,
  });
  assert.equal(repo.listDocumentsParsed().length, 0);
});

test("legacy migration merges rows missing from canonical store only once", () => {
  const storage = createMemoryStorage();
  const legacyRow = {
    runId: "mig-1",
    text: "one two three four",
    prompt: "Prompt",
    savedAt: 50,
    timestamp: 50,
    repeatedWords: [],
    bannedHits: [],
    repeatedStarters: [],
    wordCount: 4,
    words: 4,
    runScore: 1,
    scoreBreakdown: {},
    challengeActive: false,
    challengeCompleted: false,
    challengeWords: [],
    wasSuccessful: true,
    activeTargetWords: 60,
    finishedWithinTime: true,
    timeRemaining: null,
    activeTimerSeconds: null,
    timerConfigured: false,
    repeatLimitAtRun: 2,
  };
  const context = loadRunMigrationContext({
    localStorage: storage,
    waywordStorage: {
      loadHistory() {
        return [legacyRow];
      },
    },
  });
  const repo = context.waywordRunDocumentRepository.createLocalStorageRunDocumentRepository({
    storage,
  });
  const first = context.waywordRunMigration.mergeLegacyHistoryMissingIntoCanonicalStore(repo);
  assert.equal(first.merged, 1);
  assert.equal(first.skipped, 0);
  const listed = repo.listDocumentsParsed();
  assert.equal(listed.length, 1);
  assert.equal(listed[0].runId, "mig-1");

  const second = context.waywordRunMigration.mergeLegacyHistoryMissingIntoCanonicalStore(repo);
  assert.equal(second.merged, 0);
  assert.equal(second.skipped, 1);
});

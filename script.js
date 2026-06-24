if (!window.waywordPromptLibrary) {
  throw new Error("wayword: prompt library is required before script.js prompt data setup");
}

const PROMPT_FAMILIES_ORDER = window.waywordPromptLibrary.PROMPT_FAMILIES_ORDER;
const promptLibrary = window.waywordPromptLibrary.promptLibrary;

const promptEntryById = new Map();
for (const fam of PROMPT_FAMILIES_ORDER) {
  for (const e of promptLibrary[fam] || []) {
    promptEntryById.set(e.id, { ...e, family: fam });
  }
}

const V1_ENTRY_FAMILY = window.waywordPromptSystemMode?.V1_ENTRY_FAMILY || "Entry";

function getV1EntryPromptCatalogForRuntime() {
  const modeHelper = window.waywordPromptSystemMode;
  const layered = window.waywordLayeredPrompts;
  if (
    !modeHelper ||
    typeof modeHelper.buildStrataWeightedPromptCatalog !== "function" ||
    !layered ||
    typeof layered.getEntryPromptsV1 !== "function" ||
    typeof layered.getLayeredPromptsByLayer !== "function" ||
    !layered.PROMPT_LAYERS ||
    !layered.PROMPT_LAYERS.TORSION
  ) {
    return null;
  }
  const entryPrompts = layered.getEntryPromptsV1();
  const canReadStrata =
    window.waywordStrataEngine &&
    typeof window.waywordStrataEngine.loadStrataState === "function" &&
    typeof window.waywordStrataEngine.calculateStrataReadinessBand === "function";
  let readinessBand = "entry_support";
  const isFirstSession = completedRuns() <= 0;
  if (canReadStrata) {
    const strataState = window.waywordStrataEngine.loadStrataState(window.localStorage);
    readinessBand = window.waywordStrataEngine.calculateStrataReadinessBand(strataState);
  }
  const torsionPrompts = layered.getLayeredPromptsByLayer(layered.PROMPT_LAYERS.TORSION);
  return modeHelper.buildStrataWeightedPromptCatalog({
    readinessBand,
    isFirstSession,
    entryPrompts,
    torsionPrompts,
  });
}

/** Ritual Loop V1: internal family tags only (not shown in UI). */
function biasTagsForPromptFamily(familyKey) {
  const key = String(familyKey || "").trim();
  return key ? [`family:${key}`] : [];
}

function ritualPickIndex(seed, modulus) {
  const s = String(seed != null ? seed : "");
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return modulus <= 0 ? 0 : h % modulus;
}

const bannedSets = [
  ["like","just","really","very","thing","stuff","something","maybe","kind","sort"],
  ["very","really","just","quite","perhaps","somehow"],
  ["thing","things","stuff","something","anything","nothing"],
  ["maybe","perhaps","kind","sort","almost","basically"]
];

const exemptWords = new Set([
  "a","an","to","of","in","on","at","by","with","as","is","be","am","are","was","were","and","or","but","for"
]);
const repetitionStructuralWords = new Set([
  "the","a","an","of","to","in","on","and","but","or","is","are","was","were","be","been","it","that","this","with","for","as","at","by"
]);
const repetitionPronounWords = new Set([
  "i","me","my","mine","myself",
  "you","your","yours","yourself",
  "he","him","his","himself",
  "she","her","hers","herself",
  "we","us","our","ours","ourselves",
  "they","them","their","theirs","themselves"
]);

const firstPersonWords = new Set(["i","me","my","mine","we","us","our","ours"]);
const secondPersonWords = new Set(["you","your","yours"]);
const thirdPersonWords = new Set(["he","him","his","she","her","hers","they","them","their","theirs","it","its"]);

const punctuationMarks = {
  commas: { regex: /,/g, label: "," },
  periods: { regex: /\./g, label: "." },
  semicolons: { regex: /;/g, label: ";" },
  colons: { regex: /:/g, label: ":" },
  hyphens: { regex: /-/g, label: "-" },
  apostrophes: { regex: /'/g, label: "'" },
  questions: { regex: /\?/g, label: "?" },
  exclamations: { regex: /!/g, label: "!" },
  parentheses: { regex: /[()]/g, label: "()" },
  quotes: { regex: /["“”]/g, label: "“”" }
};

const {
  FIRST_SESSION_ENTRY_THRESHOLD,
  FIRST_SESSION_ENTRY_INSUFFICIENT_COPY,
  ZEN_GARDEN_OPENABLE,
  PROMPT_REROLL_LIMIT,
  PROMPT_RECENT_ID_WINDOW,
  PROMPT_NEAR_DUPLICATE_WINDOW,
  PROMPT_RECENT_FAMILY_WINDOW,
  PROGRESSION_LEVELS,
  PROGRESSION_LEVEL_KEY,
  INACTIVITY_EASE_RUN_KEY,
  CATEGORY_ACCENT_CSS_VARS,
  CATEGORY_COLOR_CSS,
  SEMANTIC_FLAG_IDS,
  WAYWORD_SUBMITTED_ANNOTATED_TYPOGRAPHY_STYLE_ID,
  OPTIONS_PANEL_DISMISS_GUARD_MS,
  RECENT_DRAWER_DISMISS_GUARD_MS,
  BANNED_PANEL_DEBOUNCE_MS,
  EDITOR_SEMANTIC_DOT_PX,
  EDITOR_SEMANTIC_DOT_GAP_PX,
  BOTTOM_CHROME_FIRST_SESSION_ENTRY_HIDE_MS,
  REVIEW_RUN_REFLECTION_MAX,
  REVIEW_RUN_MIN_WORDS,
  REVIEW_RUN_DULL_REPEATS,
  METRIC_EXPLAINER_KEYS,
  SHUFFLE_TARGET_WORDS,
  SHUFFLE_TIMER_SECONDS,
} = window.waywordConfig;

/**
 * DEV-ONLY — search `WAYWORD_DEV_FIRST_SESSION_ENTRY_RESET` to remove this entire block.
 * When true: `window.waywordDevResetFirstSessionEntry()` clears run history + firstSessionEntry state.
 * Enabled only for local / file URLs (not deployed previews or production).
 * One-shot URL (runs before first paint of firstSessionEntry UI): append `?resetFirstSessionEntry=1` (strip self).
 */
const WAYWORD_DEV_FIRST_SESSION_ENTRY_RESET_ENABLED =
  typeof location !== "undefined" &&
  ((location.hostname || "") === "localhost" ||
    (location.hostname || "") === "127.0.0.1" ||
    location.protocol === "file:");

function logPatternsTransitionSnapshot(_label, _extra = {}) {
  /* Intentionally empty: patterns layout snapshots were removed from default builds. */
}

const $ = (id) => document.getElementById(id);
const now = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

/** Category accent tokens live in category-colors.css; resolved at runtime via getCategoryAccentColor. */
function getCategoryAccentCssVarName(key) {
  return CATEGORY_ACCENT_CSS_VARS[key] || "";
}

function readRootCssVar(name) {
  if (typeof document === "undefined" || !name) return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Resolved accent for the active theme (reads :root custom properties from category-colors.css). */
function getCategoryAccentColor(key) {
  const n = getCategoryAccentCssVarName(key);
  return n ? readRootCssVar(n) : "";
}

const state = window.waywordAppState.initState(bannedSets[0]);

/** Active drafting session still inside the firstSessionEntry window (saved runs below threshold). */
function isFirstSessionEntryComposingMode() {
  return Boolean(state.active && !state.submitted && completedRuns() < FIRST_SESSION_ENTRY_THRESHOLD);
}

function syncFirstSessionEntryWritingModeClass() {
  try {
    document.body.classList.toggle("firstSessionEntry-writing-mode", isFirstSessionEntryComposingMode());
  } catch (_) {
    /* ignore */
  }
}

function resetEntryDelayHint() {}
function beginEntryDelayHintWatch() {}
function notifyEntryDelayHintEditorFocus() {}
function notifyEntryDelayHintEditorInput() {}

function getBehavioralTelemetry() {
  const telemetry = window.waywordBehavioralTelemetry;
  if (!telemetry || typeof telemetry.startRun !== "function") return null;
  return telemetry;
}

function resolvePromptLayerFromFamily(family) {
  const value = String(family || "").trim().toLowerCase();
  if (value === "torsion") return "torsion";
  if (value === "resonance") return "resonance";
  return "entry";
}

function startTelemetryRun() {
  const telemetry = getBehavioralTelemetry();
  if (!telemetry) return;
  const v1Catalog = getV1EntryPromptCatalogForRuntime();
  telemetry.startRun({
    now: Date.now(),
    promptId: state.promptId,
    readinessBand: v1Catalog?.readinessBand || "entry_support",
    layerWeightDistributionSnapshot: v1Catalog?.layerWeights || { entry: 100, torsion: 0, resonance: 0 },
    promptLayer: resolvePromptLayerFromFamily(state.promptFamily),
  });
}

function submitTelemetryRun(runSnapshot) {
  const telemetry = getBehavioralTelemetry();
  if (!telemetry || !runSnapshot) return;
  telemetry.submitRun({
    now: Date.now(),
    text: runSnapshot.text,
    wordCount: runSnapshot.wordCount,
  });
}

function noteTelemetryEditorInput() {
  const telemetry = getBehavioralTelemetry();
  if (!telemetry) return;
  telemetry.noteInput({
    now: Date.now(),
    hasText: getEditorText().trim().length > 0,
  });
}

let editorSurfaceComposing = false;

function normalizeExerciseWords(words) {
  const list = Array.isArray(words) ? words : [];
  const seen = new Set();
  const out = [];
  for (const word of list) {
    const normalized = normalizeWord(word);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function setExerciseWords(words) {
  if (
    window.waywordWritingExerciseWordsCoordinator &&
    typeof window.waywordWritingExerciseWordsCoordinator.setExerciseWords === "function"
  ) {
    return window.waywordWritingExerciseWordsCoordinator.setExerciseWords(
      {
        state,
        normalizeExerciseWords,
        storage: window.waywordStorage
      },
      words
    );
  }

  state.exerciseWords = normalizeExerciseWords(words);
  if (state.exerciseWords.length) {
    window.waywordStorage.saveExerciseWords(state.exerciseWords);
  } else {
    window.waywordStorage.removeExerciseWords();
  }
}

function loadPersistedPatternSelectedWords() {
  return normalizeExerciseWords(window.waywordStorage.loadPatternSelectedWordsJson());
}

function setPatternSelectedWords(words) {
  state.patternSelectedWords = normalizeExerciseWords(words);
  if (state.patternSelectedWords.length) {
    window.waywordStorage.savePatternSelectedWords(state.patternSelectedWords);
  } else {
    window.waywordStorage.removePatternSelectedWords();
  }
}

// Active challenge is intentionally session/run-scoped.
// Never restore from previous sessions.
state.exerciseWords = [];
window.waywordStorage.removeExerciseWords();
state.patternSelectedWords = loadPersistedPatternSelectedWords();

/** Selection snapshot before annotation slot takes focus away from the editor (canonical offsets). */
let annotationRowPendingEditorSel = null;

const {
  input,
  editorInputScrollport,
  editorInput,
  editorDotOverlay,
  editorSemanticPicker,
  highlightLayer,
  wordmark,
} = window.waywordDomElements.resolveCore();

function getViewportHeight() {
  if (window.visualViewport && window.visualViewport.height) {
    return Math.round(window.visualViewport.height);
  }
  return window.innerHeight;
}

function syncViewportHeightVar() {
  // Canonical non-focus baseline should use layout viewport height.
  // visualViewport can lag low after keyboard/panel transitions and leave
  // the app in a compressed intermediary state.
  const inFocusMode = document.body.classList.contains("focus-mode");
  const settingsOpen = document.body.classList.contains("settings-open");
  const h = inFocusMode || settingsOpen ? getViewportHeight() : Math.round(window.innerHeight);
  document.documentElement.style.setProperty("--vvh", `${h}px`);
  if (window.visualViewport) {
    const vv = window.visualViewport;
    document.documentElement.style.setProperty("--vv-offset-top", `${vv.offsetTop}px`);
    document.documentElement.style.setProperty("--window-inner-height", `${window.innerHeight}px`);
  } else {
    document.documentElement.style.removeProperty("--vv-offset-top");
    document.documentElement.style.removeProperty("--window-inner-height");
  }
  logPatternsTransitionSnapshot("syncViewportHeightVar:after");
}

/** Mobile: software keyboard shrinks visualViewport — toggle for compact chrome. */
function syncKeyboardOpenClass() {
  if (!isMobileViewport()) {
    document.body.classList.remove("keyboard-open");
    return;
  }
  // Non-focus layout should never use `keyboard-open` compaction geometry.
  // This prevents transient visualViewport reads (e.g. after panel close)
  // from leaving a compressed intermediary non-focus state.
  if (!document.body.classList.contains("focus-mode")) {
    document.body.classList.remove("keyboard-open");
    return;
  }
  const vv = window.visualViewport;
  if (!vv) {
    document.body.classList.remove("keyboard-open");
    return;
  }
  const layoutH = window.innerHeight;
  const visibleH = vv.height;
  const delta = layoutH - visibleH;
  const ratio = visibleH / Math.max(layoutH, 1);
  const keyboardOpen = delta > 88 || ratio < 0.74;
  document.body.classList.toggle("keyboard-open", keyboardOpen);
  logPatternsTransitionSnapshot("syncKeyboardOpenClass:after", {
    delta: Math.round(delta),
    ratio: Number(ratio.toFixed(3)),
    keyboardOpen
  });
}

function isMobileViewport() {
  if (
    window.waywordMobileDetection &&
    typeof window.waywordMobileDetection.isLikelyMobileViewport === "function"
  ) {
    return Boolean(window.waywordMobileDetection.isLikelyMobileViewport(window));
  }
  return window.matchMedia("(max-width: 720px)").matches;
}

function isDesktopPatternsViewport() {
  return window.matchMedia("(min-width: 981px)").matches;
}

/** Review Runs drawer: recent preview cap (full history may be archived later). */
function recentRunsPreviewCapDrawer() {
  return isMobileViewport() ? 3 : 4;
}

function recentRunsPreviewCapRail() {
  return 4;
}

function isMobilePatternsVisible() {
  if (!isMobileViewport() || isDesktopPatternsViewport()) return false;
  const profileView = $("profileView");
  return Boolean(profileView && !profileView.classList.contains("hidden"));
}

/**
 * Clears wordmark completion timers, idle lift loop, and transform CSS vars so header chrome
 * does not keep animating after focus exit (or re-enter) — avoids repeat-cycle stagger from
 * stale `completeWordmark` timeouts / RAF lift decay overlapping normal header layout.
 */
function resetWordmarkChromeMotionState() {
  if (!wordmark) return;
  clearTimeout(completionTimer);
  clearTimeout(settleTimer);
  completionTimer = null;
  settleTimer = null;
  if (animFrame !== null) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
  liftCurrent = 0;
  liftTarget = 0;
  liftVelocity = 0;
  wordmark.style.setProperty("--lift", "0");
  wordmark.style.setProperty("--complete-tilt", "0deg");
  wordmark.style.setProperty("--complete-drop", "0em");
  wordmark.style.setProperty("--complete-scale", "1");
}

function armPostFocusExitKeyboardLayoutSettle() {
  suppressKeyboardOpenTruthUntil = performance.now() + 450;
}

/** Mobile: leave focus mode in one layout pass (caller should end with `queueViewportSync()` to clear snap). */
function exitFocusModeForLayoutIfNeeded() {
  if (
    window.waywordFocusModeTransitionCoordinator &&
    typeof window.waywordFocusModeTransitionCoordinator.exitFocusModeForLayoutIfNeeded === "function"
  ) {
    return window.waywordFocusModeTransitionCoordinator.exitFocusModeForLayoutIfNeeded({
      isMobileViewport,
      syncViewportHeightVar,
      syncKeyboardOpenClass,
      state,
      armPostFocusExitKeyboardLayoutSettle,
      resetWordmarkChromeMotionState
    });
  }
  if (!isMobileViewport()) return false;
  if (!document.body.classList.contains("focus-mode")) return false;
  document.documentElement.classList.add("focus-mode-layout-snap");
  document.body.classList.remove("keyboard-open");
  document.body.classList.remove("focus-mode");
  document.body.classList.remove("expanded-field");
  state.isExpandedField = false;
  syncKeyboardOpenClass();
  syncViewportHeightVar();
  armPostFocusExitKeyboardLayoutSettle();
  resetWordmarkChromeMotionState();
  return true;
}

/** Single source for mobile expanded-field chrome (`body.expanded-field`). */
function syncExpandedFieldClass() {
  const btn = $("fieldExpandedToggle");
  if (!isMobileViewport() || !document.body.classList.contains("focus-mode")) {
    document.body.classList.remove("expanded-field");
    if (!isMobileViewport()) state.isExpandedField = false;
    if (btn) {
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Show surrounding context");
    }
    return;
  }
  document.body.classList.toggle("expanded-field", state.isExpandedField);
  if (btn) {
    btn.setAttribute("aria-pressed", state.isExpandedField ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      state.isExpandedField ? "Hide surrounding context" : "Show surrounding context"
    );
  }
}

function setExpandedField(expanded) {
  if (!isMobileViewport()) return;
  state.isExpandedField = Boolean(expanded);
  syncExpandedFieldClass();
  window.waywordPostRunRenderer.renderReflectionLine(getPostRunReflectionLineText());
}

function setFocusMode(enabled) {
  if (
    window.waywordFocusModeTransitionCoordinator &&
    typeof window.waywordFocusModeTransitionCoordinator.setFocusMode === "function"
  ) {
    return window.waywordFocusModeTransitionCoordinator.setFocusMode(enabled, {
      isMobileViewport,
      state,
      logPatternsTransitionSnapshot,
      setSuppressKeyboardOpenTruthUntil(value) {
        suppressKeyboardOpenTruthUntil = value;
      },
      resetWordmarkChromeMotionState,
      setRecentDrawerOpen,
      renderProfileSummaryStrip,
      syncExpandedFieldClass,
      renderPostRunReflectionLine() {
        window.waywordPostRunRenderer.renderReflectionLine(getPostRunReflectionLineText());
      },
      queueViewportSync,
      syncViewportHeightVar,
      syncKeyboardOpenClass,
      armPostFocusExitKeyboardLayoutSettle
    });
  }
  logPatternsTransitionSnapshot("setFocusMode:before", { enabled });
  const shouldEnable = Boolean(enabled) && isMobileViewport();
  if (shouldEnable) {
    suppressKeyboardOpenTruthUntil = 0;
    document.documentElement.classList.remove("focus-mode-layout-snap");
    resetWordmarkChromeMotionState();
    document.body.classList.add("focus-mode");
    setRecentDrawerOpen(false);
    renderProfileSummaryStrip();
    syncExpandedFieldClass();
    window.waywordPostRunRenderer.renderReflectionLine(getPostRunReflectionLineText());
    queueViewportSync();
    logPatternsTransitionSnapshot("setFocusMode:after-enable");
    return;
  }
  if (!isMobileViewport()) {
    document.body.classList.remove("focus-mode");
    document.body.classList.remove("expanded-field");
    state.isExpandedField = false;
    renderProfileSummaryStrip();
    logPatternsTransitionSnapshot("setFocusMode:after-disable-desktop");
    return;
  }
  exitFocusModeForLayoutIfNeeded();
  window.waywordPostRunRenderer.renderReflectionLine(getPostRunReflectionLineText());
  renderProfileSummaryStrip();
  queueViewportSync();
  logPatternsTransitionSnapshot("setFocusMode:after-disable-mobile");
}

function settleNonFocusBaselineAfterPatternsClose() {
  if (!isMobileViewport()) return;
  const profileView = $("profileView");
  editorInput?.blur();
  if (profileView) {
    profileView.classList.remove("profile-view--enter-from", "profile-view--recede");
    profileView.classList.add("hidden");
  }
  // Match normal focus-exit behavior so transient visualViewport values do not
  // leave non-focus layout in `keyboard-open` compressed geometry.
  armPostFocusExitKeyboardLayoutSettle();
  suppressKeyboardOpenTruthUntil = Math.max(
    suppressKeyboardOpenTruthUntil,
    performance.now() + 1400
  );
  document.body.classList.remove("focus-mode", "expanded-field", "keyboard-open", "patterns-open");
  document.documentElement.classList.remove("focus-mode-layout-snap");
  state.isExpandedField = false;
  syncViewportHeightVar();
  window.waywordViewController.syncPatternsLayoutMode();
  renderProfile();
  syncExpandedFieldClass();
}

let viewportSyncRaf = null;
let viewportSyncCoalescePending = false;
let lastDesktopPatternsViewport = null;
/** After leaving focus mode, ignore transient visualViewport reads so `keyboard-open` does not flicker back on while the shell reflows. */
let suppressKeyboardOpenTruthUntil = 0;
/** Ignore blur-driven focus exits during mobile Patterns toggles. */
let suppressFocusExitUntil = 0;

/** Matches `style.css` `--surface-chamfer: clamp(7px, 1.35vw, 13px)` (1.35vw of viewport). */
function editorShellChamferCssPx() {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  return Math.min(13, Math.max(7, vw * 0.0135));
}

const EDITOR_SHELL_CLIP_PATH_FROM_PATH_SUPPORTED =
  typeof CSS !== "undefined" &&
  (CSS.supports?.("clip-path", "path('M0 0 L10 0 L10 10 L0 10 Z')") ||
    CSS.supports?.("-webkit-clip-path", "path('M0 0 L10 0 L10 10 L0 10 Z')"));

function distSeg(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/** Closed path with quadratic fillets at each vertex (soft contour, not sharp kinks). */
function closedRoundPolygonPathD(points, r) {
  const n = points.length;
  if (n < 3) return "";
  const fr = Math.max(0, Math.min(r, 14));
  const fmt = (v) => Number(v.toFixed(3));
  let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = points[(i + n - 1) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const d01 = distSeg(p0[0], p0[1], p1[0], p1[1]);
    const d12 = distSeg(p1[0], p1[1], p2[0], p2[1]);
    if (d01 < 1e-4 || d12 < 1e-4) continue;
    const rr = Math.min(fr, d01 * 0.52, d12 * 0.52);
    const t1 = 1 - rr / d01;
    const ax = p0[0] + t1 * (p1[0] - p0[0]);
    const ay = p0[1] + t1 * (p1[1] - p0[1]);
    const t2 = rr / d12;
    const bx = p1[0] + t2 * (p2[0] - p1[0]);
    const by = p1[1] + t2 * (p2[1] - p1[1]);
    if (i === 0) d += `M ${fmt(ax)} ${fmt(ay)}`;
    else d += ` L ${fmt(ax)} ${fmt(ay)}`;
    d += ` Q ${fmt(p1[0])} ${fmt(p1[1])} ${fmt(bx)} ${fmt(by)}`;
  }
  d += " Z";
  return d;
}

/** Straight octagon (fallback when clip-path: path() is unsupported). */
function closedLinearPolygonPathD(points) {
  const fmt = (v) => Number(v.toFixed(3));
  let d = `M ${fmt(points[0][0])} ${fmt(points[0][1])}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${fmt(points[i][0])} ${fmt(points[i][1])}`;
  }
  d += " Z";
  return d;
}

/** SVG stroke + same path as shell clip (one geometry). */
function syncEditorShellChamferEdge() {
  const shell = document.querySelector(".editor-shell");
  const svg = shell?.querySelector(".editor-shell-edge");
  const pathEl = shell?.querySelector(".editor-shell-edge-path");
  if (!shell || !svg || !pathEl) return;

  const w = shell.clientWidth;
  const h = shell.clientHeight;
  if (w < 4 || h < 4) return;

  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  const inset = 0.62;
  const iw = w - 2 * inset;
  const ih = h - 2 * inset;
  let c = editorShellChamferCssPx();
  const maxC = Math.max(0, Math.min(iw, ih) / 2 - 0.5);
  if (c > maxC) c = maxC;

  const x0 = inset;
  const y0 = inset;
  const pts = [
    [x0 + c, y0],
    [x0 + iw - c, y0],
    [x0 + iw, y0 + c],
    [x0 + iw, y0 + ih - c],
    [x0 + iw - c, y0 + ih],
    [x0 + c, y0 + ih],
    [x0, y0 + ih - c],
    [x0, y0 + c]
  ];

  const fillet = Math.min(6.5, Math.max(3.2, c * 0.58));
  const pathD = closedRoundPolygonPathD(pts, fillet);
  const pathLinear = closedLinearPolygonPathD(pts);
  pathEl.setAttribute("d", EDITOR_SHELL_CLIP_PATH_FROM_PATH_SUPPORTED ? pathD : pathLinear);

  if (EDITOR_SHELL_CLIP_PATH_FROM_PATH_SUPPORTED) {
    const quoted = `path("${pathD}")`;
    shell.style.clipPath = quoted;
    shell.style.webkitClipPath = quoted;
  } else {
    shell.style.removeProperty("clip-path");
    shell.style.removeProperty("-webkit-clip-path");
  }
}

/** Same chamfer + quadratic fillets as the writing shell (`closedRoundPolygonPathD`), scaled to the overlay box. */
function syncEditorFirstSessionEntryOverlayClip() {
  const overlay = $("editorOverlay");
  if (!overlay) return;
  const isCalib =
    overlay.classList.contains("editor-overlay--firstSessionEntry") &&
    !overlay.classList.contains("hidden");
  if (!isCalib || !EDITOR_SHELL_CLIP_PATH_FROM_PATH_SUPPORTED) {
    overlay.style.removeProperty("clip-path");
    overlay.style.removeProperty("-webkit-clip-path");
    return;
  }
  const w = overlay.clientWidth;
  const h = overlay.clientHeight;
  if (w < 12 || h < 12) return;
  let c = editorShellChamferCssPx();
  const maxC = Math.max(4, Math.min(w, h) * 0.11);
  c = Math.min(c, maxC, w / 2 - 0.75, h / 2 - 0.75);
  const pts = [
    [c, 0],
    [w - c, 0],
    [w, c],
    [w, h - c],
    [w - c, h],
    [c, h],
    [0, h - c],
    [0, c]
  ];
  const fillet = Math.min(6.5, Math.max(3.2, c * 0.52));
  const pathD = closedRoundPolygonPathD(pts, fillet);
  const quoted = `path("${pathD}")`;
  overlay.style.webkitClipPath = quoted;
  overlay.style.clipPath = quoted;
}

function scheduleFirstSessionEntryOverlayGeometrySync() {
  requestAnimationFrame(() => {
    syncEditorFirstSessionEntryOverlayClip();
    requestAnimationFrame(() => syncEditorFirstSessionEntryOverlayClip());
  });
}

/**
 * Safari can report a transient wide layout viewport on first paint / landing exit; `queueViewportSync`
 * already runs on resize, but follow-up passes after layout commits match post-refresh state.
 */
function schedulePostLayoutViewportReconcile() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        void document.documentElement.offsetWidth;
      } catch (_) {}
      queueViewportSync();
      requestAnimationFrame(() => {
        try {
          void document.documentElement.offsetWidth;
        } catch (_) {}
        queueViewportSync();
      });
    });
  });
}

function queueViewportSync() {
  if (
    window.waywordViewportSyncCoordinator &&
    typeof window.waywordViewportSyncCoordinator.queueViewportSync === "function"
  ) {
    return window.waywordViewportSyncCoordinator.queueViewportSync({
      logPatternsTransitionSnapshot,
      syncViewportHeightVar,
      syncKeyboardOpenClass,
      syncEditorShellChamferEdge,
      syncEditorFirstSessionEntryOverlayClip,
      isMobileViewport,
      isDesktopPatternsViewport,
      isProfileVisible() {
        const profileView = $("profileView");
        return Boolean(profileView && !profileView.classList.contains("hidden"));
      },
      showProfile,
      setFocusMode,
      syncPatternsLayoutMode: window.waywordViewController.syncPatternsLayoutMode,
      renderHistory,
      syncRecentRailExpandedLayoutMetrics,
      syncSubmittedAnnotatedEditorSurfaces,
      scheduleEditorDotOverlaySync,
      flushEditorDotOverlaySync,
      renderProfileSummaryStrip
    });
  }
  logPatternsTransitionSnapshot("queueViewportSync:requested", {
    alreadyQueued: viewportSyncRaf !== null
  });
  if (viewportSyncRaf !== null) {
    viewportSyncCoalescePending = true;
    return;
  }
  viewportSyncRaf = requestAnimationFrame(() => {
    viewportSyncRaf = null;
    logPatternsTransitionSnapshot("queueViewportSync:raf-start");
    try {
      const desktopPatternsViewport = isDesktopPatternsViewport();
      syncViewportHeightVar();
      syncKeyboardOpenClass();
      syncEditorShellChamferEdge();
      syncEditorFirstSessionEntryOverlayClip();
      if (!isMobileViewport()) setFocusMode(false);
      if (lastDesktopPatternsViewport === null) {
        lastDesktopPatternsViewport = desktopPatternsViewport;
      } else {
        const crossedIntoNarrowPatternsViewport =
          lastDesktopPatternsViewport && !desktopPatternsViewport;
        lastDesktopPatternsViewport = desktopPatternsViewport;
        if (crossedIntoNarrowPatternsViewport) {
          const profileView = $("profileView");
          if (profileView && !profileView.classList.contains("hidden")) {
            showProfile(false);
          }
        }
      }
      window.waywordViewController.syncPatternsLayoutMode();
      renderHistory();
      requestAnimationFrame(() => syncRecentRailExpandedLayoutMetrics());
      syncSubmittedAnnotatedEditorSurfaces();
      flushEditorDotOverlaySync();
      renderProfileSummaryStrip();
      logPatternsTransitionSnapshot("queueViewportSync:raf-after-sync");
    }
    finally {
      if (viewportSyncCoalescePending) {
        viewportSyncCoalescePending = false;
        queueViewportSync();
      } else {
        /* Defer removing snap until after follow-up layout + ResizeObserver bursts, so padding/gap transitions stay off while the shell settles. */
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (document.body.classList.contains("focus-mode")) return;
            document.documentElement.classList.remove("focus-mode-layout-snap");
            logPatternsTransitionSnapshot("queueViewportSync:raf-snap-cleared");
          });
        });
      }
    }
  });
}

let liftCurrent = 0;
let liftTarget = 0;
let liftVelocity = 0;
let lastTypingTs = 0;
let animFrame = null;
let completionTimer = null;
let settleTimer = null;

/* -----------------------------
   landing/app state
----------------------------- */

function emptyWriteDoc() {
  return { lines: [{ tokens: [], trailingSpace: false }] };
}

/** One line’s contribution to `serializeWriteDoc` (no newline). Single source for segment length / walks. */
function writeDocLineSegmentString(line) {
  const body = (line.tokens || []).map((t) => t.text).join(" ");
  return line.trailingSpace ? `${body} ` : body;
}

function serializeWriteDoc(doc) {
  if (!doc || !Array.isArray(doc.lines) || !doc.lines.length) return "";
  return doc.lines.map(writeDocLineSegmentString).join("\n");
}

/** Deduped subset of SEMANTIC_FLAG_IDS in canonical order (not serialized into text). */
function normalizeSemanticFlagsArray(flags) {
  if (!Array.isArray(flags)) return [];
  const out = [];
  for (const id of SEMANTIC_FLAG_IDS) {
    if (flags.includes(id)) out.push(id);
  }
  return out;
}

/** Normalized active challenge words (session exercise list). */
function getNormalizedExerciseWordSet() {
  return new Set((state.exerciseWords || []).map((w) => normalizeWord(w)).filter(Boolean));
}

/**
 * Challenge and filler are mutually exclusive for the same token; challenge stacks with repetition and opening.
 * When `norm` matches an active challenge word: strip filler, ensure `challenge` is present.
 */
function mergeChallengeVsFillerSemanticFlags(tokenFlags, norm) {
  let flags = normalizeSemanticFlagsArray(Array.isArray(tokenFlags) ? tokenFlags : []);
  if (norm && getNormalizedExerciseWordSet().has(norm)) {
    flags = flags.filter((id) => id !== "filler");
    if (!flags.includes("challenge")) {
      flags = normalizeSemanticFlagsArray([...flags, "challenge"]);
    }
  }
  return flags;
}

/**
 * Effective flags for dots, legend counts, and annotation UI (same rules as writeDoc analysis).
 */
function getOrderedSemanticFlagsForToken(token) {
  const norm = normalizeWord(token?.text);
  return mergeChallengeVsFillerSemanticFlags(token?.flags, norm);
}

/** Per-category token membership: a token with k flags increments k categories (matches inline dots). */
function countWriteDocSemanticFlagsOnTokens() {
  const n = { filler: 0, repetition: 0, opening: 0, challenge: 0 };
  for (const line of state.writeDoc?.lines || []) {
    for (const token of line.tokens || []) {
      for (const id of getOrderedSemanticFlagsForToken(token)) {
        if (id === "filler") n.filler += 1;
        else if (id === "repetition") n.repetition += 1;
        else if (id === "opening") n.opening += 1;
        else if (id === "challenge") n.challenge += 1;
      }
    }
  }
  return n;
}

function writeDocHasAnySemanticFlags(writeDoc = state.writeDoc) {
  for (const line of writeDoc?.lines || []) {
    for (const token of line.tokens || []) {
      if (getOrderedSemanticFlagsForToken(token).length) return true;
    }
  }
  return false;
}

/**
 * Legacy hook: annotated post-submit must use the same typography as live (no injected overrides).
 * Removes any stale `#wayword-submitted-annotated-typography` node from older builds.
 */
function syncSubmittedAnnotatedEditorSurfaces() {
  document.getElementById(WAYWORD_SUBMITTED_ANNOTATED_TYPOGRAPHY_STYLE_ID)?.remove();
}

function writeDocCanonicalLength(doc) {
  return serializeWriteDoc(doc).length;
}

/**
 * Phase 2 step 1: canonical string offset ↔ logical position (pure; matches serialize only).
 * DOM must not be consulted. Geometry will use rects later, not these helpers.
 *
 * Position kinds:
 * - token: inside a word token (offsetInToken 0..text.length inclusive for caret endpoints)
 * - join: on the single inter-word space after tokens[afterTokenIndex]
 * - trailing: on the line’s single trailing space when line.trailingSpace
 * - newline: on the \n after line `afterLineIndex`
 * - lineEnd: immediately after this line’s segment (same canonical offset as end of trailing space +1, or after last body char)
 * - eof: empty / degenerate doc (offset clipped)
 */
function offsetToLogicalPos(writeDoc, offset) {
  const lines = writeDoc?.lines;
  const total = writeDocCanonicalLength(writeDoc);
  const o = Math.max(0, Math.min(offset, total));
  if (!lines?.length) return { kind: "eof", offset: o };

  let cursor = 0;
  for (let li = 0; li < lines.length; li++) {
    const seg = writeDocLineSegmentString(lines[li]);
    const segLen = seg.length;
    if (o < cursor + segLen) {
      return offsetToLogicalPosWithinLine(lines[li], li, o - cursor);
    }
    if (o === cursor + segLen && li < lines.length - 1) {
      return { kind: "newline", afterLineIndex: li };
    }
    cursor += segLen;
    if (li < lines.length - 1) {
      if (o === cursor) {
        return { kind: "newline", afterLineIndex: li };
      }
      cursor += 1;
    }
  }
  return { kind: "lineEnd", lineIndex: lines.length - 1 };
}

function offsetToLogicalPosWithinLine(line, lineIndex, o) {
  const tokens = line.tokens || [];
  let cur = 0;
  for (let ti = 0; ti < tokens.length; ti++) {
    const w = tokens[ti].text;
    const wlen = w.length;
    if (o < cur + wlen) {
      return { kind: "token", lineIndex, tokenIndex: ti, offsetInToken: o - cur };
    }
    cur += wlen;
    if (ti < tokens.length - 1) {
      if (o === cur) {
        return { kind: "join", lineIndex, afterTokenIndex: ti };
      }
      cur += 1;
    }
  }
  if (line.trailingSpace && o === cur) {
    return { kind: "trailing", lineIndex };
  }
  if (o === cur) {
    return { kind: "lineEnd", lineIndex };
  }
  return { kind: "lineEnd", lineIndex };
}

function offsetAtLineStart(writeDoc, lineIndex) {
  let c = 0;
  const lines = writeDoc.lines;
  for (let li = 0; li < lineIndex; li++) {
    c += writeDocLineSegmentString(lines[li]).length + 1;
  }
  return c;
}

function logicalPosToOffset(writeDoc, pos) {
  const lines = writeDoc?.lines;
  if (!lines?.length) {
    const total = writeDocCanonicalLength(writeDoc);
    return Math.min(Math.max(0, pos.offset ?? 0), total);
  }

  if (pos.kind === "eof") {
    return Math.min(Math.max(0, pos.offset ?? 0), writeDocCanonicalLength(writeDoc));
  }
  if (pos.kind === "newline") {
    const li = pos.afterLineIndex;
    return offsetAtLineStart(writeDoc, li) + writeDocLineSegmentString(lines[li]).length;
  }
  if (pos.kind === "lineEnd") {
    const li = pos.lineIndex;
    return offsetAtLineStart(writeDoc, li) + writeDocLineSegmentString(lines[li]).length;
  }

  const base = offsetAtLineStart(writeDoc, pos.lineIndex);
  const line = lines[pos.lineIndex];
  const tokens = line.tokens || [];

  if (pos.kind === "trailing") {
    const segLen = writeDocLineSegmentString(line).length;
    if (!line.trailingSpace || segLen === 0) return base;
    return base + segLen - 1;
  }
  if (pos.kind === "join") {
    let cur = 0;
    for (let ti = 0; ti <= pos.afterTokenIndex; ti++) {
      cur += tokens[ti].text.length;
      if (ti < pos.afterTokenIndex) cur += 1;
    }
    return base + cur;
  }
  if (pos.kind === "token") {
    let cur = 0;
    for (let ti = 0; ti < pos.tokenIndex; ti++) {
      cur += tokens[ti].text.length;
      if (ti < tokens.length - 1) cur += 1;
    }
    return base + cur + pos.offsetInToken;
  }
  return 0;
}

/** Half-open [start, end) canonical offsets for one word token; matches serialize layout only. */
function tokenCanonicalCharRangeHalfOpen(writeDoc, lineIndex, tokenIndex) {
  const token = writeDoc?.lines?.[lineIndex]?.tokens?.[tokenIndex];
  if (!token || !token.text) return null;
  const start = logicalPosToOffset(writeDoc, {
    kind: "token",
    lineIndex,
    tokenIndex,
    offsetInToken: 0
  });
  const end = logicalPosToOffset(writeDoc, {
    kind: "token",
    lineIndex,
    tokenIndex,
    offsetInToken: token.text.length
  });
  if (start < 0 || end < start) return null;
  return { start, end };
}

/** Half-open [start,end) equals exactly one word token span in writeDoc, or null. */
function findExactSingleTokenForCanonicalRange(writeDoc, start, end) {
  if (start >= end) return null;
  const lines = writeDoc?.lines;
  if (!lines?.length) return null;
  for (let li = 0; li < lines.length; li++) {
    const tokens = lines[li].tokens || [];
    for (let ti = 0; ti < tokens.length; ti++) {
      const range = tokenCanonicalCharRangeHalfOpen(writeDoc, li, ti);
      if (range && range.start === start && range.end === end) {
        return { lineIndex: li, tokenIndex: ti, start, end };
      }
    }
  }
  return null;
}

/** Dev-only: `?writeDocMapping=1` runs round-trip checks vs serializeWriteDoc. */
function verifyWriteDocCanonicalMappingSelfTest() {
  const samples = [
    "",
    "a",
    "a b",
    "maybe like maybe",
    "maybe ",
    "maybe like ",
    "a\nb",
    "\n",
    "a\n\nb",
    "word ",
    "  leading collapsed in parse",
    "x"
  ];
  for (const s of samples) {
    const doc = parseRawToWriteDoc(s);
    const canon = serializeWriteDoc(doc);
    const n = canon.length;
    for (let o = 0; o <= n; o++) {
      const p = offsetToLogicalPos(doc, o);
      const o2 = logicalPosToOffset(doc, p);
      if (o2 !== o) {
        console.error("writeDoc mapping mismatch", { s, canon, o, p, o2 });
        return false;
      }
    }
  }
  return true;
}

const EDITOR_BLOCK_TAGS = new Set([
  "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DIV", "DL", "DT", "DD",
  "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3",
  "H4", "H5", "H6", "HEADER", "HR", "LI", "MAIN", "NAV", "OL", "P", "PRE",
  "SECTION", "TABLE", "TR", "TD", "TH", "UL"
]);
const EDITOR_CARET_PLACEHOLDER_CHARS = /[\u200B\u200C\u200D\uFEFF]/g;
const EDITOR_TRAILING_NEWLINE_PLACEHOLDER = "\u200B";

function editorDisplayTextForCanonical(canonical) {
  const text = String(canonical || "");
  return text.endsWith("\n") ? `${text}${EDITOR_TRAILING_NEWLINE_PLACEHOLDER}` : text;
}

function editorCanonicalTextFromDisplayText(displayText) {
  return String(displayText || "").replace(EDITOR_CARET_PLACEHOLDER_CHARS, "");
}

function editorDisplayOffsetForCanonicalOffset(canonical, offset) {
  const text = String(canonical || "");
  const n = Math.max(0, Math.min(Number(offset) || 0, text.length));
  return text.endsWith("\n") && n === text.length ? n + EDITOR_TRAILING_NEWLINE_PLACEHOLDER.length : n;
}

function pushEditorBreak(out) {
  if (!out.length || out[out.length - 1] !== "\n") out.push("\n");
}

function editorNodeTagNameUpper(node) {
  return String((node && node.tagName) || "").toUpperCase();
}

function readEditorSurfaceNodeText(node, out, options) {
  if (!node) return;
  const opts = options || { isRoot: false, isLastSibling: true };
  if (node.nodeType === Node.TEXT_NODE) {
    out.push(String(node.textContent || "").replace(EDITOR_CARET_PLACEHOLDER_CHARS, ""));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }
  const tag = editorNodeTagNameUpper(node);
  if (tag === "BR") {
    // Preserve explicit consecutive `<br><br>` caret-host patterns while still
    // deduping common block-boundary + `<br>` layouts.
    if (opts.previousSiblingTag === "BR") {
      out.push("\n");
      return;
    }
    pushEditorBreak(out);
    return;
  }
  const isBlock = node.nodeType === Node.ELEMENT_NODE && !opts.isRoot && EDITOR_BLOCK_TAGS.has(tag);
  const children = Array.from(node.childNodes || []);
  const beforeLen = out.length;
  for (let i = 0; i < children.length; i++) {
    const prevSiblingTag = i > 0 ? editorNodeTagNameUpper(children[i - 1]) : "";
    readEditorSurfaceNodeText(children[i], out, {
      isRoot: false,
      isLastSibling: i === children.length - 1,
      previousSiblingTag: prevSiblingTag,
    });
  }
  if (!isBlock) return;
  const producedAny = out.length > beforeLen;
  if (!producedAny) {
    pushEditorBreak(out);
    return;
  }
  if (!opts.isLastSibling) {
    pushEditorBreak(out);
  }
}

/** DOM read for flush: preserves contenteditable visual line breaks (`<br>`, block wrappers) plus trailing spaces. */
function getEditorSurfaceRawText(root) {
  if (!root) return "";
  const out = [];
  readEditorSurfaceNodeText(root, out, { isRoot: true, isLastSibling: true });
  return out.join("").replace(/\r/g, "");
}

/** When `previousWriteDoc` is provided (flush path), copies flags for tokens where line index, token index, and text all match the previous doc — keeps flags across re-parse without changing canonical text. */
function parseRawToWriteDoc(raw, previousWriteDoc) {
  const s = String(raw ?? "").replace(/\r/g, "");
  if (s === "") return emptyWriteDoc();
  const prev = previousWriteDoc === undefined ? null : previousWriteDoc;
  const parts = s.split("\n");
  const lines = [];
  let globalIndex = 0;
  for (const lineStr of parts) {
    const pieces = lineStr.match(/[^\s]+/g) || [];
    const lineIndex = lines.length;
    const tokens = pieces.map((text, ti) => {
      const prevTok = prev?.lines?.[lineIndex]?.tokens?.[ti];
      const rawPrev =
        prevTok && prevTok.text === text && Array.isArray(prevTok.flags) ? [...prevTok.flags] : [];
      const flags = normalizeSemanticFlagsArray(rawPrev);
      return {
        text,
        flags,
        index: globalIndex++
      };
    });
    const trailingSpace = lineStr.length > 0 && /\s$/.test(lineStr);
    lines.push({ tokens, trailingSpace });
  }
  return { lines };
}

function getOffsetInEditorRoot(root, node, offsetInNode) {
  if (!root || !node) return 0;
  try {
    const range = document.createRange();
    range.setStart(root, 0);
    range.setEnd(node, Math.max(0, Number(offsetInNode) || 0));
    const fragment = range.cloneContents();
    return getEditorSurfaceRawText(fragment).length;
  } catch (_err) {
    return getEditorSurfaceRawText(root).length;
  }
}

function getSelectionOffsetsForEditorRoot(root) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !root.contains(sel.anchorNode)) {
    const len = getEditorSurfaceRawText(root).length;
    return { anchor: len, focus: len, backward: false };
  }
  const anchor = getOffsetInEditorRoot(root, sel.anchorNode, sel.anchorOffset);
  const focus = getOffsetInEditorRoot(root, sel.focusNode, sel.focusOffset);
  const backward =
    focus < anchor || (focus === anchor && String(sel.direction || "") === "backward");
  return { anchor, focus, backward };
}

function setSelectionOffsetsForEditorRoot(root, anchor, focus, backward) {
  const sel = window.getSelection();
  const tn = root.firstChild;
  if (!tn || tn.nodeType !== Node.TEXT_NODE) return;
  const len = tn.textContent.length;
  const a = Math.max(0, Math.min(anchor, len));
  const f = Math.max(0, Math.min(focus, len));
  const range = document.createRange();
  if (backward && a !== f) {
    range.setStart(tn, f);
    range.setEnd(tn, a);
  } else {
    range.setStart(tn, a);
    range.setEnd(tn, f);
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

function projectWriteDocToEditorFromState(anchor, focus, backward) {
  if (!editorInput) return;
  const canonical = serializeWriteDoc(state.writeDoc);
  editorInput.replaceChildren(document.createTextNode(editorDisplayTextForCanonical(canonical)));
  if (typeof anchor === "number" && typeof focus === "number") {
    setSelectionOffsetsForEditorRoot(
      editorInput,
      editorDisplayOffsetForCanonicalOffset(canonical, anchor),
      editorDisplayOffsetForCanonicalOffset(canonical, focus),
      Boolean(backward)
    );
  }
  if (
    window.waywordEditorStatePresentation &&
    typeof window.waywordEditorStatePresentation.syncEditorEmptyState === "function"
  ) {
    window.waywordEditorStatePresentation.syncEditorEmptyState(editorInput, canonical);
  } else {
    editorInput.classList.toggle("is-empty", !canonical.trim());
  }
}

function flushEditorSurfaceIntoWriteDocOnce() {
  if (!editorInput || !state.active || state.submitted) return;
  if (editorSurfaceComposing) return;

  const raw = getEditorSurfaceRawText(editorInput);
  const { anchor, focus, backward } = getSelectionOffsetsForEditorRoot(editorInput);

  const previousWriteDoc = state.writeDoc;
  state.writeDoc = parseRawToWriteDoc(raw, previousWriteDoc);
  applyWriteDocSemanticFlagsFromAnalysis();
  const canonical = serializeWriteDoc(state.writeDoc);

  const a = Math.min(anchor, canonical.length);
  const f = Math.min(focus, canonical.length);
  projectWriteDocToEditorFromState(a, f, backward);
  renderAnnotationRow();
  flushEditorDotOverlaySync();
}

function insertMobileEditorTextNewline() {
  if (!editorInput || !state.active || state.submitted) return false;
  const { anchor, focus } = getSelectionOffsetsForEditorRoot(editorInput);
  const raw = getEditorSurfaceRawText(editorInput);
  const start = Math.max(0, Math.min(anchor, focus));
  const end = Math.max(0, Math.max(anchor, focus));
  const nextRaw = `${raw.slice(0, start)}\n${raw.slice(end)}`;
  const previousWriteDoc = state.writeDoc;
  state.writeDoc = parseRawToWriteDoc(nextRaw, previousWriteDoc);
  applyWriteDocSemanticFlagsFromAnalysis();
  projectWriteDocToEditorFromState(start + 1, start + 1, false);
  return true;
}

function captureEditorSurfaceIntoWriteDocForSubmit() {
  if (!editorInput || !state.active || state.submitted) return getEditorText();

  const raw = getEditorSurfaceRawText(editorInput);
  const previousWriteDoc = state.writeDoc;
  state.writeDoc = parseRawToWriteDoc(raw, previousWriteDoc);
  applyWriteDocSemanticFlagsFromAnalysis();
  return serializeWriteDoc(state.writeDoc);
}

function getEditorText() {
  return serializeWriteDoc(state.writeDoc);
}

function setEditorText(text) {
  if (!editorInput) return;
  const raw = String(text ?? "").replace(/\r/g, "");
  state.writeDoc = parseRawToWriteDoc(raw, null);
  applyWriteDocSemanticFlagsFromAnalysis();
  projectWriteDocToEditorFromState(0, 0, false);
  renderAnnotationRow();
  flushEditorDotOverlaySync();
}

function focusEditorToEnd() {
  if (
    window.waywordEditorFocusPresentation &&
    typeof window.waywordEditorFocusPresentation.focusEditorToEnd === "function"
  ) {
    return window.waywordEditorFocusPresentation.focusEditorToEnd(editorInput);
  }

  if (!editorInput) return;

  editorInput.focus({ preventScroll: true });

  const tn = editorInput.firstChild;
  if (!tn || tn.nodeType !== Node.TEXT_NODE) return;

  const selection = window.getSelection();
  const range = document.createRange();
  range.setStart(tn, tn.textContent.length);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function focusEditorToStart() {
  if (
    window.waywordEditorFocusPresentation &&
    typeof window.waywordEditorFocusPresentation.focusEditorToStart === "function"
  ) {
    return window.waywordEditorFocusPresentation.focusEditorToStart(editorInput);
  }

  if (!editorInput) return;

  editorInput.focus({ preventScroll: true });

  const tn = editorInput.firstChild;
  if (!tn || tn.nodeType !== Node.TEXT_NODE) return;

  const selection = window.getSelection();
  const range = document.createRange();
  range.setStart(tn, 0);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Shared delayed focus timing for run start flows. */
function scheduleDeferredEditorFocus(focusCaret = "end") {
  if (
    window.waywordEditorFocusPresentation &&
    typeof window.waywordEditorFocusPresentation.scheduleDeferredEditorFocus === "function"
  ) {
    return window.waywordEditorFocusPresentation.scheduleDeferredEditorFocus({
      editorInput,
      focusCaret
    });
  }

  setTimeout(() => {
    if (focusCaret === "start") {
      focusEditorToStart();
    } else {
      focusEditorToEnd();
    }
  }, 50);
}

function enterLandingState() {
  window.waywordViewController.enterLandingState();
}

let landingToAppExitTimer = null;

function resetHorizontalScrollOriginForAppEntry() {
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  if (window.scrollX !== 0) {
    window.scrollTo({ left: 0, top: window.scrollY, behavior: "auto" });
  }
}

function enterAppState(options = {}) {
  const afterEnter = typeof options.afterEnter === "function" ? options.afterEnter : null;
  const dockFocusModeForMobile = Boolean(options.dockFocusModeForMobile);
  const shell = document.querySelector(".app-shell");
  const landing = $("landingView");
  const app = $("appView");
  if (!shell || !landing || !app) return;

  if (landing.classList.contains("hidden")) return;
  if (shell.classList.contains("app-shell--landing-out")) return;

  if (dockFocusModeForMobile && isMobileViewport()) {
    setFocusMode(true);
  }

  const finalizeLandingToApp = () => {
    if (landingToAppExitTimer !== null) {
      window.clearTimeout(landingToAppExitTimer);
      landingToAppExitTimer = null;
    }
    window.waywordViewController.applyLandingExitToAppDom({ shell, landing, app });
    resetHorizontalScrollOriginForAppEntry();
    syncViewportHeightVar();
    window.waywordPanelCoordination.closePanelsForAppEntry({ showProfile, setOptionsOpen });
    afterEnter?.();
    queueViewportSync();
    schedulePostLayoutViewportReconcile();
  };

  if (prefersReducedUiMotion()) {
    finalizeLandingToApp();
    return;
  }

  shell.classList.add("app-shell--landing-out");
  void landing.offsetWidth;

  const gate = landing.querySelector(".landing-gate");
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    if (landingToAppExitTimer !== null) {
      window.clearTimeout(landingToAppExitTimer);
      landingToAppExitTimer = null;
    }
    gate?.removeEventListener("transitionend", onGateTransitionEnd);
    finalizeLandingToApp();
  };

  const onGateTransitionEnd = (e) => {
    if (e.target !== gate) return;
    if (e.propertyName !== "opacity" && e.propertyName !== "transform") return;
    settle();
  };

  gate?.addEventListener("transitionend", onGateTransitionEnd);
  landingToAppExitTimer = window.setTimeout(settle, 320);
}

/* -----------------------------
   wordmark motion
----------------------------- */

function setWordmarkVars() {
  if (!wordmark) return;
  wordmark.style.setProperty("--lift", String(liftCurrent));
}

function ensureWordmarkLoop() {
  if (animFrame !== null) return;

  const tick = () => {
    const now = performance.now();
    const sinceType = now - lastTypingTs;

    if (sinceType > 180) {
      const decay = sinceType > 420 ? 0.045 : 0.018;
      liftTarget = Math.max(0, liftTarget - decay);
    }

    const spring = 0.09;
    const damping = 0.82;

    liftVelocity += (liftTarget - liftCurrent) * spring;
    liftVelocity *= damping;
    liftCurrent += liftVelocity;

    if (Math.abs(liftTarget - liftCurrent) < 0.0015 && Math.abs(liftVelocity) < 0.0015 && liftTarget <= 0.001) {
      liftCurrent = 0;
      liftTarget = 0;
      liftVelocity = 0;
      setWordmarkVars();
      animFrame = null;
      return;
    }

    setWordmarkVars();
    animFrame = requestAnimationFrame(tick);
  };

  animFrame = requestAnimationFrame(tick);
}

function pulseWordmark() {
  if (!wordmark) return;

  clearTimeout(completionTimer);
  clearTimeout(settleTimer);

  wordmark.style.setProperty("--complete-tilt", "0deg");
  wordmark.style.setProperty("--complete-drop", "0em");
  wordmark.style.setProperty("--complete-scale", "1");

  lastTypingTs = performance.now();
  liftTarget = Math.min(1.35, liftTarget + 0.28);
  ensureWordmarkLoop();
}

function completeWordmark() {
  if (!wordmark) return;

  clearTimeout(completionTimer);
  clearTimeout(settleTimer);

  liftTarget = 0;
  ensureWordmarkLoop();

  wordmark.style.setProperty("--complete-tilt", "34deg");
  wordmark.style.setProperty("--complete-drop", "0.12em");
  wordmark.style.setProperty("--complete-scale", "1");

  completionTimer = setTimeout(() => {
    wordmark.style.setProperty("--complete-tilt", "-8deg");
    wordmark.style.setProperty("--complete-drop", "-0.02em");

    settleTimer = setTimeout(() => {
      wordmark.style.setProperty("--complete-tilt", "0deg");
      wordmark.style.setProperty("--complete-drop", "0em");
      wordmark.style.setProperty("--complete-scale", "1");
    }, 220);
  }, 240);
}

/* -----------------------------
   helpers
----------------------------- */

/** Ignore backdrop/outside dismiss briefly after open (same tap would otherwise “ghost click” the backdrop). */
let optionsPanelDismissGuardUntil = 0;
let recentDrawerDismissGuardUntil = 0;

let bannedPanelPersistTimer = null;

function bannedWordsListFromPanelFieldValue(str) {
  return String(str || "")
    .split(",")
    .map(normalizeWord)
    .filter(Boolean);
}

function bannedListsShallowEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function flushBannedPanelPersistFromPanel() {
  if (
    window.waywordBannedPanelPersistCoordinator &&
    typeof window.waywordBannedPanelPersistCoordinator.flushBannedPanelPersistFromPanel === "function"
  ) {
    return window.waywordBannedPanelPersistCoordinator.flushBannedPanelPersistFromPanel({
      $,
      state,
      bannedPanelPersistTimerRef: {
        get value() {
          return bannedPanelPersistTimer;
        },
        set value(next) {
          bannedPanelPersistTimer = next;
        }
      },
      bannedWordsListFromPanelFieldValue,
      bannedListsShallowEqual,
      applyWriteDocSemanticFlagsFromAnalysis,
      scheduleEditorDotOverlaySync,
      renderAnnotationRow,
      renderMeta,
      renderHighlight,
      renderSidebar
    });
  }

  if (bannedPanelPersistTimer != null) {
    clearTimeout(bannedPanelPersistTimer);
    bannedPanelPersistTimer = null;
  }
  const input = $("bannedInlineInputPanel");
  if (!input) return;
  const next = bannedWordsListFromPanelFieldValue(input.value);
  if (bannedListsShallowEqual(next, state.banned)) return;
  state.banned = next;
  if (state.active && !state.submitted) {
    applyWriteDocSemanticFlagsFromAnalysis();
    scheduleEditorDotOverlaySync();
    renderAnnotationRow();
  }
  renderMeta();
  renderHighlight();
  renderSidebar();
}

function scheduleBannedPanelPersistFromPanel() {
  if (
    window.waywordBannedPanelPersistCoordinator &&
    typeof window.waywordBannedPanelPersistCoordinator.scheduleBannedPanelPersistFromPanel === "function"
  ) {
    return window.waywordBannedPanelPersistCoordinator.scheduleBannedPanelPersistFromPanel({
      bannedPanelPersistTimerRef: {
        get value() {
          return bannedPanelPersistTimer;
        },
        set value(next) {
          bannedPanelPersistTimer = next;
        }
      },
      debounceMs: BANNED_PANEL_DEBOUNCE_MS,
      $,
      state,
      bannedWordsListFromPanelFieldValue,
      bannedListsShallowEqual,
      applyWriteDocSemanticFlagsFromAnalysis,
      scheduleEditorDotOverlaySync,
      renderAnnotationRow,
      renderMeta,
      renderHighlight,
      renderSidebar
    });
  }

  if (bannedPanelPersistTimer != null) clearTimeout(bannedPanelPersistTimer);
  bannedPanelPersistTimer = window.setTimeout(() => {
    bannedPanelPersistTimer = null;
    flushBannedPanelPersistFromPanel();
  }, BANNED_PANEL_DEBOUNCE_MS);
}

function applyWordTargetFromPanel(nextWords) {
  if (
    window.waywordWritingModeControlsCoordinator &&
    typeof window.waywordWritingModeControlsCoordinator.applyWordTargetFromPanel === "function"
  ) {
    return window.waywordWritingModeControlsCoordinator.applyWordTargetFromPanel(
      {
        state,
        setActiveModeButton,
        renderMeta,
        renderHighlight,
        renderSidebar,
        updateWordProgress,
        updateEnterButtonVisibility
      },
      nextWords
    );
  }

  const n = Number(nextWords);
  if (!Number.isFinite(n) || ![60, 120, 240].includes(n)) return;
  state.targetWords = state.targetWords === n ? 0 : n;
  setActiveModeButton("wordModesPanel", "words", state.targetWords);
  setActiveModeButton("wordModes", "words", state.targetWords);
  renderMeta();
  renderHighlight();
  renderSidebar();
  updateWordProgress();
  updateEnterButtonVisibility();
}

function applyTimerFromPanel(nextSeconds) {
  if (
    window.waywordWritingModeControlsCoordinator &&
    typeof window.waywordWritingModeControlsCoordinator.applyTimerFromPanel === "function"
  ) {
    return window.waywordWritingModeControlsCoordinator.applyTimerFromPanel(
      {
        state,
        stopTimer,
        setActiveModeButton,
        updateTimeFill,
        renderMeta,
        renderHighlight,
        renderSidebar,
        renderWritingState
      },
      nextSeconds
    );
  }

  const n = Number(nextSeconds);
  if (!Number.isFinite(n) || ![120, 240, 360].includes(n)) return;
  state.timerSeconds = n;
  stopTimer();
  state.timeRemaining = 0;
  state.timerWaitingForFirstInput = Boolean(state.timerSeconds);
  setActiveModeButton("timeModesPanel", "time", state.timerSeconds);
  setActiveModeButton("timeModes", "time", state.timerSeconds);
  updateTimeFill();
  renderMeta();
  renderHighlight();
  renderSidebar();
  renderWritingState();
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  window.waywordStorage.saveTheme(theme);
}

function toggleTheme() {
  applyTheme(state.theme === "light" ? "dark" : "light");
}

/**
 * Saved runs for UI/analysis (progression, Patterns digests, chronological walks).
 * Uses canonical documents via `waywordSavedRunsRead` when present; else copies `state.history`
 * (oldest → newest, same index order as legacy push). The read module also merges missing
 * legacy rows so a canonical write failure does not hide a locally saved run.
 */
function readSavedRunsChronological() {
  if (window.waywordSavedRunsRead && typeof window.waywordSavedRunsRead.listSavedRunsChronological === "function") {
    return window.waywordSavedRunsRead.listSavedRunsChronological();
  }
  return Array.isArray(state.history) ? state.history.slice() : [];
}

/**
 * Saved runs newest → oldest (Recent Runs drawer/rail). Same precedence as
 * `readSavedRunsChronological`; see `docs/SAVED_RUNS_PERSISTENCE.md`.
 */
function readSavedRunsNewestFirst() {
  if (window.waywordSavedRunsRead && typeof window.waywordSavedRunsRead.listSavedRunsNewestFirst === "function") {
    return window.waywordSavedRunsRead.listSavedRunsNewestFirst();
  }
  return Array.isArray(state.history) ? state.history.slice().reverse() : [];
}

function completedRuns() {
  return readSavedRunsChronological().length;
}

function hasProfileSignal() {
  return completedRuns() >= FIRST_SESSION_ENTRY_THRESHOLD;
}

/** Canonical firstSessionEntry reset (fresh local state, used by dev hook and Clear Saved Runs). */
function resetFirstSessionEntryStateToFreshStart() {
  state.history = [];
  state.savedRunIds = new Set();
  state.lastRunFeedback = "";
  state.lastMirrorPipelineResult = null;
  state.lastMirrorLoadFailed = false;
  state.pendingRecentDrawerExpand = false;
  state.promptBiasTags = [];
  state.recentPromptIds = [];
  state.recentFamilyKeys = [];
  state.promptId = "";
  state.mirrorEmptyFallbackSeed = "";
  window.waywordStorage.removeInactivityEaseRun(INACTIVITY_EASE_RUN_KEY);

  state.progressionLevel = 1;
  persistProgressionLevel();
  persist();
  if (window.waywordRunDocumentRepo && typeof window.waywordRunDocumentRepo.clearAllDocuments === "function") {
    window.waywordRunDocumentRepo.clearAllDocuments();
  }

  const fb = $("feedbackBox");
  if (fb) {
    fb.dataset.postRunRenderKey = "";
    fb.className = "result-card empty";
    fb.innerHTML = "";
  }
  $("editorOverlay")?.classList.add("hidden");

  state.submitted = false;
  state.completedUiActive = false;
  resetEntryDelayHint();

  recomputeProgressionLevel({});
  applyProgressionToState();

  if (state.active) {
    startWriting();
  } else {
    renderMeta();
    window.waywordPostRunRenderer.renderReflectionLine("");
    window.waywordPostRunRenderer.resetPostRunFeedbackBox();
    if (editorInput) {
      renderWritingState();
      renderHighlight();
      scheduleEditorDotOverlaySync();
    }
    renderSidebar();
    updateEnterButtonVisibility();
  }

  renderHistory();
  renderFirstSessionEntry();
  renderProfileSummaryStrip();
  renderProfile();
  queueViewportSync();
}

function waywordDevResetFirstSessionEntryForTesting() {
  resetFirstSessionEntryStateToFreshStart();
}

function persist() {
  window.waywordStorage.saveHistoryAndRunIds(state.history, state.savedRunIds);
}

function buildProgressionRuntimeInput() {
  return {
    state,
    storage: window.waywordStorage,
    progressionLevelKey: PROGRESSION_LEVEL_KEY,
    progressionLevels: PROGRESSION_LEVELS,
    inactivityEaseRunKey: INACTIVITY_EASE_RUN_KEY,
    readSavedRunsChronological,
    now: () => Date.now()
  };
}

function getProgressionRuntime() {
  const runtime = window.waywordProgressionRuntime;
  if (!runtime) {
    throw new Error("wayword: progression runtime is required before script.js progression orchestration");
  }
  return runtime;
}

function clampProgressionLevel(n) {
  return getProgressionRuntime().clampProgressionLevel(n);
}

function loadStoredProgressionLevel() {
  return getProgressionRuntime().loadStoredProgressionLevel(buildProgressionRuntimeInput());
}

function persistProgressionLevel() {
  getProgressionRuntime().persistProgressionLevel(buildProgressionRuntimeInput());
}

function getProgressionConfig(level) {
  return getProgressionRuntime().getProgressionConfig(buildProgressionRuntimeInput(), level);
}

function applyProgressionToState() {
  getProgressionRuntime().applyProgressionToState(buildProgressionRuntimeInput());
}

function recomputeProgressionLevel(options = {}) {
  return getProgressionRuntime().recomputeProgressionLevel(buildProgressionRuntimeInput(), options);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeWord(word) {
  return String(word || "")
    .toLowerCase()
    .replace(/[“”‘’]/g, "")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, "");
}

/** Patterns repeated-word chips: delegated to `patterns-repeat-lexical-gate.js` (single source of truth). */
function waywordPatternsRepeatLexemeOk(word) {
  const g = window.waywordPatternsLexicalGate;
  if (!g || typeof g.lexemeOk !== "function") return false;
  return g.lexemeOk(word);
}

function waywordPatternsRepeatLexemeChallengeworthy(word, count) {
  const g = window.waywordPatternsLexicalGate;
  if (!g || typeof g.lexemeChallengeworthy !== "function") return false;
  return g.lexemeChallengeworthy(word, count);
}

function tokenize(text) {
  return String(text || "")
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

function countWords(tokens) {
  const counts = {};
  for (const token of tokens) counts[token] = (counts[token] || 0) + 1;
  return counts;
}

function sentenceStarters(text) {
  return String(text || "")
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => normalizeWord((s.match(/[A-Za-z0-9']+/) || [""])[0]))
    .filter(Boolean);
}

function sentenceStarterExamples(text) {
  return String(text || "")
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const match = s.match(/[A-Za-z0-9']+/);
      return {
        starter: normalizeWord(match ? match[0] : ""),
        excerpt: s.length > 42 ? s.slice(0, 42) + "…" : s
      };
    })
    .filter(item => item.starter);
}

function countPerspective(tokens) {
  const result = { first: 0, second: 0, third: 0 };
  tokens.forEach(token => {
    if (firstPersonWords.has(token)) result.first++;
    if (secondPersonWords.has(token)) result.second++;
    if (thirdPersonWords.has(token)) result.third++;
  });
  return result;
}

function countPunctuation(text) {
  const result = {};
  Object.entries(punctuationMarks).forEach(([key, meta]) => {
    const matches = String(text || "").match(meta.regex);
    result[key] = matches ? matches.length : 0;
  });
  return result;
}

/**
 * @param {{ familyKey?: string }} [options]
 * @returns {string} prompt text (also sets state.promptId, promptFamily, lastPromptKey, history).
 */
function buildPromptRuntimeInput() {
  const v1Catalog = getV1EntryPromptCatalogForRuntime();

  return {
    state,
    promptSelection: window.waywordPromptSelection,
    promptFamiliesOrder: v1Catalog ? v1Catalog.promptFamiliesOrder : PROMPT_FAMILIES_ORDER,
    promptLibrary: v1Catalog ? v1Catalog.promptLibrary : promptLibrary,
    promptEntryById: v1Catalog ? v1Catalog.promptEntryById : promptEntryById,
    promptRecentIdWindow: PROMPT_RECENT_ID_WINDOW,
    promptNearDuplicateWindow: PROMPT_NEAR_DUPLICATE_WINDOW,
    promptRecentFamilyWindow: PROMPT_RECENT_FAMILY_WINDOW,
    promptRerollLimit: PROMPT_REROLL_LIMIT,
    getCompletedRunCount: completedRuns,
    biasTagsForPromptFamily: v1Catalog
      ? function (familyKey) {
          const key = familyKey === V1_ENTRY_FAMILY ? "entry" : familyKey;
          return biasTagsForPromptFamily(key);
        }
      : biasTagsForPromptFamily,
    getEditorText,
    renderMeta
  };
}

function getPromptRuntime() {
  const runtime = window.waywordPromptRuntime;
  if (!runtime) {
    throw new Error("wayword: prompt runtime is required before script.js prompt orchestration");
  }
  return runtime;
}

function generatePrompt(options) {
  return getPromptRuntime().generatePrompt(buildPromptRuntimeInput(), options);
}

function makeRunId() {
  if (window.waywordRunDocumentUtils && typeof window.waywordRunDocumentUtils.generateRunId === "function") {
    return window.waywordRunDocumentUtils.generateRunId();
  }
  return "run_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function updateEnterButtonVisibility() {
  if (
    window.waywordWritingSubmitSurfaceCoordinator &&
    typeof window.waywordWritingSubmitSurfaceCoordinator.updateEnterButtonVisibility === "function"
  ) {
    return window.waywordWritingSubmitSurfaceCoordinator.updateEnterButtonVisibility({
      $,
      state,
      editorInput,
      getEditorText
    });
  }

  const btn = $("enterSubmitBtn");
  if (!btn || !editorInput) return;

  const hasText = getEditorText().trim().length > 0;
  const canShow = state.active && !state.submitted;

  btn.classList.toggle("hidden", !(hasText && canShow));
}

function canRerollPrompt() {
  return getPromptRuntime().canRerollPrompt(buildPromptRuntimeInput());
}

function rerollPrompt() {
  const rerolled = getPromptRuntime().rerollPrompt(buildPromptRuntimeInput());
  if (rerolled) resetEntryDelayHint();
  return rerolled;
}

/** Reprompt control only — never field toggle (explicit target + propagation guard). */
function onPromptRerollControlClick(e) {
  if (e.currentTarget?.id !== "promptRerollBtn") return;
  const t = e.target;
  if (t instanceof Element && t.closest("#fieldExpandedToggle")) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  rerollPrompt();
}

function onPromptClusterControlPointerDownFallback(e) {
  armPromptControlFocusExitGuard();
  e.stopPropagation();
}

function armPromptControlFocusExitGuard() {
  if (!isMobileViewport()) return;
  suppressFocusExitUntil = performance.now() + 420;
}

let lastFieldTogglePointerUpAtMs = 0;

function normalizeCanonicalLayoutStateBeforeFoldToggle() {
  if (!isMobileViewport()) return;
  const profileView = $("profileView");
  // Fold/full toggle is a strict two-state control; expanded-field is not part of it.
  state.isExpandedField = false;
  document.body.classList.remove("expanded-field");
  if (!document.body.classList.contains("focus-mode")) {
    document.body.classList.remove("keyboard-open");
    if (profileView?.classList.contains("hidden")) {
      document.body.classList.remove("patterns-open");
    }
    document.documentElement.classList.remove("focus-mode-layout-snap");
  }
  syncExpandedFieldClass();
}

function runFieldExpandedToggleAction() {
  if (!isMobileViewport()) return;
  suppressFocusExitUntil = performance.now() + 520;
  normalizeCanonicalLayoutStateBeforeFoldToggle();
  const currentlyFocus = document.body.classList.contains("focus-mode");
  if (currentlyFocus) {
    setFocusMode(false);
  } else {
    setFocusMode(true);
  }
  // Keep fold/full as strict two-state control.
  state.isExpandedField = false;
  syncExpandedFieldClass();

  if (editorInput) {
    requestAnimationFrame(() => {
      if (document.body.classList.contains("focus-mode")) {
        editorInput.focus({ preventScroll: true });
      }
    });
  }
  queueViewportSync();
}

/** Field expanded toggle only — never prompt reroll (explicit target + propagation guard). */
function onFieldExpandedControlClick(e) {
  if (e.currentTarget?.id !== "fieldExpandedToggle") return;
  if (performance.now() - lastFieldTogglePointerUpAtMs < 420) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return;
  }
  const t = e.target;
  if (t instanceof Element && t.closest("#promptRerollBtn")) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  runFieldExpandedToggleAction();
}

function onFieldExpandedControlPointerUp(e) {
  if (e.currentTarget?.id !== "fieldExpandedToggle") return;
  if (e.button != null && e.button !== 0) return;
  const t = e.target;
  if (t instanceof Element && t.closest("#promptRerollBtn")) return;
  lastFieldTogglePointerUpAtMs = performance.now();
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  runFieldExpandedToggleAction();
}

function bindPromptClusterControlsOnce() {
  if (
    window.waywordPromptInteractions &&
    typeof window.waywordPromptInteractions.bindPromptClusterControls === "function"
  ) {
    window.waywordPromptInteractions.bindPromptClusterControls({
      $,
      armPromptControlFocusExitGuard,
      onPromptRerollControlClick,
      onFieldExpandedControlClick,
      onFieldExpandedControlPointerUp
    });
    return;
  }

  const reroll = $("promptRerollBtn");
  if (reroll) {
    reroll.removeEventListener("pointerdown", onPromptClusterControlPointerDownFallback);
    reroll.addEventListener("pointerdown", onPromptClusterControlPointerDownFallback);
    reroll.removeEventListener("click", onPromptRerollControlClick);
    reroll.addEventListener("click", onPromptRerollControlClick);
  }
  const field = $("fieldExpandedToggle");
  if (field) {
    field.removeEventListener("pointerdown", onPromptClusterControlPointerDownFallback);
    field.addEventListener("pointerdown", onPromptClusterControlPointerDownFallback);
    field.removeEventListener("pointerup", onFieldExpandedControlPointerUp);
    field.addEventListener("pointerup", onFieldExpandedControlPointerUp);
    field.removeEventListener("click", onFieldExpandedControlClick);
    field.addEventListener("click", onFieldExpandedControlClick);
  }
}

function buildFieldExpandedToggleButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "fieldExpandedToggle";
  btn.className = "field-expand-toggle";
  btn.setAttribute("aria-label", "Show surrounding context");
  btn.setAttribute("aria-pressed", "false");
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2.75" y="2.75" width="4.5" height="4.5" rx="1.1" stroke="currentColor" stroke-width="1.1"></rect>
      <rect x="10.75" y="2.75" width="4.5" height="4.5" rx="1.1" stroke="currentColor" stroke-width="1.1"></rect>
      <rect x="2.75" y="10.75" width="4.5" height="4.5" rx="1.1" stroke="currentColor" stroke-width="1.1"></rect>
      <rect x="10.75" y="10.75" width="4.5" height="4.5" rx="1.1" stroke="currentColor" stroke-width="1.1"></rect>
    </svg>`;
  return btn;
}

function detachNodeIfAttached(node) {
  if (!node || !node.parentElement) return;
  node.parentElement.removeChild(node);
}

let controlSpineMutationInProgress = false;
let controlSpineOwnershipObserverInstalled = false;
let controlSpineOwnershipObserver = null;

const CONTROL_SPINE_IDS = new Set(["promptRerollBtn", "fieldExpandedToggle"]);

function warnControlSpineViolation(controlId, contextLabel, node) {
  const parentId = node?.parentElement?.id || node?.parentElement?.className || "unknown-parent";
  const stack = new Error(`[wayword-control-spine-violation:${contextLabel}] ${controlId} found under ${parentId}`).stack;
  console.warn(stack);
}

function enforceSingleControlNodeById(id, preferredParent) {
  const all = Array.from(document.querySelectorAll(`#${id}`));
  if (!all.length) return null;
  const preferred =
    (preferredParent && all.find((node) => node.parentElement === preferredParent)) || all[0];
  for (const node of all) {
    if (node === preferred) continue;
    detachNodeIfAttached(node);
  }
  return preferred;
}

function getControlNodesById(id) {
  return Array.from(document.querySelectorAll(`#${id}`));
}

function mountControlIntoRightSpine(spine, control, beforeNode = null) {
  if (!spine || !control) return;
  controlSpineMutationInProgress = true;
  try {
    if (control.parentElement !== spine) {
      if (control.parentElement) {
        warnControlSpineViolation(control.id || "unknown-control", "mount", control);
      }
      detachNodeIfAttached(control);
      if (beforeNode && beforeNode.parentElement === spine) {
        spine.insertBefore(control, beforeNode);
      } else {
        spine.appendChild(control);
      }
    } else if (beforeNode && control.nextElementSibling !== beforeNode) {
      spine.insertBefore(control, beforeNode);
    }
  } finally {
    controlSpineMutationInProgress = false;
  }
}

/** Keep controls in the fixed right header spine; prompt card must not host control nodes. */
function normalizePromptRerollButtonIfNeeded() {
  const spine = $("rightControlSpine");
  if (!spine) return;
  let rerollBtn = enforceSingleControlNodeById("promptRerollBtn", spine) || spine.querySelector("#promptRerollBtn");
  if (!rerollBtn) {
    rerollBtn = document.createElement("button");
    rerollBtn.type = "button";
    rerollBtn.id = "promptRerollBtn";
    rerollBtn.className = "prompt-reroll-btn";
    rerollBtn.setAttribute("aria-label", "Get a different prompt");
    rerollBtn.dataset.rerolls = String(PROMPT_REROLL_LIMIT);
  }
  if (!rerollBtn.querySelector(".prompt-reroll-icon")) {
    rerollBtn.innerHTML = `<span class="prompt-reroll-icon" aria-hidden="true">✎</span>`;
  }
  if (!rerollBtn.dataset.rerolls) rerollBtn.dataset.rerolls = String(PROMPT_REROLL_LIMIT);

  let fieldToggle = enforceSingleControlNodeById("fieldExpandedToggle", spine) || spine.querySelector("#fieldExpandedToggle");
  if (!fieldToggle) fieldToggle = buildFieldExpandedToggleButton();

  mountControlIntoRightSpine(spine, fieldToggle, spine.firstChild || null);
  mountControlIntoRightSpine(spine, rerollBtn, fieldToggle.nextSibling || null);
}

function ensurePromptRerollButton() {
  if (!$("rightControlSpine")) return;
  normalizePromptRerollButtonIfNeeded();
  bindPromptClusterControlsOnce();
}

function enforceRightControlSpineOwnership(contextLabel = "unspecified") {
  const spine = $("rightControlSpine");
  if (!spine) return;
  const rerolls = getControlNodesById("promptRerollBtn");
  const fields = getControlNodesById("fieldExpandedToggle");

  for (const reroll of rerolls) {
    if (reroll.parentElement !== spine) {
      warnControlSpineViolation("promptRerollBtn", contextLabel, reroll);
    }
  }
  for (const field of fields) {
    if (field.parentElement !== spine) {
      warnControlSpineViolation("fieldExpandedToggle", contextLabel, field);
    }
  }

  normalizePromptRerollButtonIfNeeded();
  bindPromptClusterControlsOnce();
}

function installRightControlSpineOwnershipObserver() {
  if (controlSpineOwnershipObserverInstalled) return;
  if (typeof MutationObserver === "undefined") return;
  if (!document.body) return;
  controlSpineOwnershipObserverInstalled = true;
  controlSpineOwnershipObserver = new MutationObserver(() => {
    if (controlSpineMutationInProgress) return;
    const spine = $("rightControlSpine");
    if (!spine) return;
    const rerolls = getControlNodesById("promptRerollBtn");
    const fields = getControlNodesById("fieldExpandedToggle");
    const rerollViolation = rerolls.length !== 1 || rerolls.some((node) => node.parentElement !== spine);
    const fieldViolation = fields.length !== 1 || fields.some((node) => node.parentElement !== spine);
    const violation = rerollViolation || fieldViolation;
    if (!violation) return;
    enforceRightControlSpineOwnership("observer");
  });
  controlSpineOwnershipObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function startRightControlSpineStabilizer(durationMs = 5000) {
  const startedAt = now();
  function tick() {
    enforceRightControlSpineOwnership("raf-stabilizer");
    if (now() - startedAt < durationMs) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* -----------------------------
   progress + timer UI
----------------------------- */

function updateWordProgress() {
  if (
    window.waywordWritingProgressCoordinator &&
    typeof window.waywordWritingProgressCoordinator.updateWordProgress === "function"
  ) {
    return window.waywordWritingProgressCoordinator.updateWordProgress({
      $,
      state,
      tokenize,
      getEditorText
    });
  }

  const fill = $("editorProgressFill");
  const progressRoot = fill?.closest(".editor-progress");
  const track = fill?.closest(".editor-progress-track");
  const meterBg = $("editorProgressMeterBg");
  const meterFg = $("editorProgressMeterFg");
  if (!fill) return;

  const words = state.active ? tokenize(getEditorText()).length : 0;

  const setMeterLabel = (text) => {
    if (meterBg) meterBg.textContent = text;
    if (meterFg) meterFg.textContent = text;
  };

  if (!state.targetWords) {
    fill.style.width = "0%";
    fill.style.background = "var(--ink)";
    track?.style.setProperty("--editor-progress-pct", "0");
    setMeterLabel("");
    progressRoot?.classList.toggle("editor-progress--empty", words === 0);
    progressRoot?.classList.add("editor-progress--no-target");
    progressRoot?.setAttribute("data-phase", "none");
    return;
  }

  const target = state.targetWords;
  const clampedPercent = Math.min((words / target) * 100, 100);
  fill.style.width = `${clampedPercent}%`;
  track?.style.setProperty("--editor-progress-pct", String(clampedPercent));
  setMeterLabel(`${words} / ${target}`);
  progressRoot?.classList.toggle("editor-progress--empty", words === 0);
  progressRoot?.classList.remove("editor-progress--no-target");

  const atTarget = words >= target;
  fill.style.background = atTarget ? "var(--success)" : "var(--ink)";

  const w1 = Math.ceil(target / 3);
  const w2 = Math.ceil((2 * target) / 3);
  let phase = "early";
  if (atTarget) phase = "done";
  else if (w1 < w2) {
    if (words >= w2) phase = "late";
    else if (words >= w1) phase = "mid";
  }
  progressRoot?.setAttribute("data-phase", phase);
}

function updateTimeFill() {
  if (
    window.waywordWritingProgressCoordinator &&
    typeof window.waywordWritingProgressCoordinator.updateTimeFill === "function"
  ) {
    return window.waywordWritingProgressCoordinator.updateTimeFill({
      $,
      state
    });
  }

  const fill = $("editorTimeFill");
  if (!fill) return;

  if (!state.active || !state.timerSeconds || state.submitted) {
    fill.style.height = "0%";
    return;
  }

  if (state.timerWaitingForFirstInput) {
    fill.style.height = "0%";
    return;
  }

  const elapsed = state.timerSeconds - state.timeRemaining;
  const progress = Math.min(Math.max(elapsed / state.timerSeconds, 0), 1);
  fill.style.height = `${progress * 100}%`;
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function tryStartTimerOnFirstMeaningfulInput() {
  if (!state.active || state.submitted || !state.timerSeconds) return;
  if (!state.timerWaitingForFirstInput) return;
  if (!String(getEditorText() || "").length) return;
  state.timerWaitingForFirstInput = false;
  startTimer();
}

function startTimer() {
  stopTimer();

  if (!state.timerSeconds) {
    state.timeRemaining = 0;
    state.timerWaitingForFirstInput = false;
    updateTimeFill();
    return;
  }

  state.timerWaitingForFirstInput = false;
  state.timeRemaining = state.timerSeconds;
  updateTimeFill();

  state.timerId = setInterval(() => {
    state.timeRemaining -= 1;
    updateTimeFill();

    if (state.timeRemaining <= 0) {
      stopTimer();
      if (state.active && !state.submitted) submitWriting(true);
    }
  }, 1000);
}

/* -----------------------------
   analysis
----------------------------- */

function getActiveTargetWordsForScoring() {
  return getProgressionConfig(state.progressionLevel).targetWords;
}

function buildAnalysisRuntimeInput() {
  return {
    repeatLimit: state.repeatLimit,
    exerciseWords: state.exerciseWords,
    banned: state.banned,
    targetWords: state.targetWords,
    exemptWords,
    repetitionThresholds: {
      contentMinCount: Math.max(2, Number(state.repeatLimit) + 1 || 3),
      pronounMinCount: 4,
      structuralMinCount: 5,
      singleLetterMinCount: 8,
      pronounWords: repetitionPronounWords,
      structuralWords: repetitionStructuralWords
    },
    tokenize,
    countWords,
    sentenceStarters,
    sentenceStarterExamples,
    countPerspective,
    countPunctuation
  };
}

function getAnalysisRuntime() {
  const runtime = window.waywordAnalysisRuntime;
  if (!runtime) {
    throw new Error("wayword: analysis runtime is required before script.js analysis orchestration");
  }
  return runtime;
}

function scoreDeductionFromIncidentCount(n) {
  return getAnalysisRuntime().scoreDeductionFromIncidentCount(n);
}

function scoreCompletionFromTargetRatio(totalWords, activeTargetWords) {
  return getAnalysisRuntime().scoreCompletionFromTargetRatio(totalWords, activeTargetWords);
}

function runScoreSampleCapFromWordCount(totalWords) {
  return getAnalysisRuntime().runScoreSampleCapFromWordCount(totalWords);
}

function computeRunScoreV1(analysis, repeatLimit, activeTargetWords) {
  return getAnalysisRuntime().computeRunScoreV1(
    buildAnalysisRuntimeInput(),
    analysis,
    repeatLimit,
    activeTargetWords
  );
}

function analyze(text) {
  return getAnalysisRuntime().analyze(buildAnalysisRuntimeInput(), text);
}

/**
 * Global word indices (same order as `tokenize(text)` / writeDoc tokens line-major) for the first
 * word of a sentence when that sentence starter has already opened a sentence before — matches
 * openings incident counting (repeated starters) without re-parsing differently from `analyze`.
 */
function computeOpeningRepeatedStarterFirstWordIndices(text) {
  const parts = String(text || "")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = Object.create(null);
  const indices = new Set();
  let g = 0;
  for (const sent of parts) {
    const words = sent.match(/[^\s]+/g) || [];
    if (words.length) {
      const st = normalizeWord(words[0]);
      if (st) {
        seen[st] = (seen[st] || 0) + 1;
        if (seen[st] > 1) indices.add(g);
      }
    }
    g += words.length;
  }
  return indices;
}

/**
 * Phase 3 Step 4 + 7: set each token's semantic flags from `analyze(serializeWriteDoc)` heuristics only.
 * Challenge suppresses filler only; repetition and opening can stack with challenge on the same token.
 * Optional `analysisPre` avoids a second analyze() when the caller already has results (e.g. submit).
 */
function applyWriteDocSemanticFlagsFromAnalysisCore(analysisPre) {
  const lines = state.writeDoc?.lines;
  if (!lines?.length) return;

  const text = serializeWriteDoc(state.writeDoc);
  const analysis = analysisPre || analyze(text);

  const exerciseSet = getNormalizedExerciseWordSet();
  const plainBannedSet = new Set((state.banned || []).map((w) => normalizeWord(w)).filter(Boolean));
  const repeatedSet = new Set(analysis.repeated.map(([w]) => w));
  const openingIndices = computeOpeningRepeatedStarterFirstWordIndices(text);

  let g = 0;
  const newLines = lines.map((line) => {
    const tokens = line.tokens || [];
    const newTokens = tokens.map((token) => {
      const norm = normalizeWord(token.text);
      const raw = [];
      if (norm && exerciseSet.has(norm)) {
        raw.push("challenge");
      } else if (norm && plainBannedSet.has(norm)) {
        raw.push("filler");
      }
      if (norm && repeatedSet.has(norm)) raw.push("repetition");
      if (openingIndices.has(g)) raw.push("opening");
      g += 1;
      return { ...token, flags: normalizeSemanticFlagsArray(raw) };
    });
    return { ...line, tokens: newTokens };
  });
  state.writeDoc = { ...state.writeDoc, lines: newLines };
}

/**
 * Phase 3 Step 4 + 7: set each token's semantic flags from `analyze(serializeWriteDoc)` heuristics only.
 * Skips while `state.submitted` so post-submit snapshots use {@link applyWriteDocSemanticFlagsFromAnalysisCore}.
 */
function applyWriteDocSemanticFlagsFromAnalysis() {
  if (!state.active || state.submitted) return;
  applyWriteDocSemanticFlagsFromAnalysisCore();
}

function buildStarterIndexSet(text) {
  const sentenceParts = String(text || "").match(/[^.!?]+[.!?]?\s*/g) || [];
  const startersSeen = {};
  let globalWordIndex = 0;
  const repeatedStarterWordIndices = new Set();

  sentenceParts.forEach(sentence => {
    const words = sentence.match(/[^\s]+/g) || [];
    if (!words.length) return;

    const starter = normalizeWord(words[0]);
    if (starter) {
      startersSeen[starter] = (startersSeen[starter] || 0) + 1;
      if (startersSeen[starter] > 1) repeatedStarterWordIndices.add(globalWordIndex);
    }

    globalWordIndex += words.length;
  });

  return repeatedStarterWordIndices;
}

/* -----------------------------
   editor rendering
----------------------------- */

function syncScroll() {
  if (!editorInput) return;
  const port = editorInputScrollport;
  if (highlightLayer && !highlightLayer.classList.contains("hidden") && !port) {
    highlightLayer.scrollTop = editorInput.scrollTop;
    highlightLayer.scrollLeft = editorInput.scrollLeft;
  }
  /* Legacy (no scrollport): dots are a sibling layer — keep in lockstep with scroll. */
  if (!port) {
    flushEditorDotOverlaySync();
  }
}

function renderHighlight() {
  if (highlightLayer) highlightLayer.innerHTML = "";
  syncScroll();
  if (editorInputScrollport) {
    flushEditorDotOverlaySync();
  }
}

let editorDotOverlayRaf = null;

function flushEditorDotOverlaySync() {
  if (editorDotOverlayRaf !== null) {
    cancelAnimationFrame(editorDotOverlayRaf);
    editorDotOverlayRaf = null;
  }
  syncEditorDotOverlay();
}

/** Coalesced geometry pass: writeDoc + Range rects only; never mutates text or writeDoc. */
function scheduleEditorDotOverlaySync() {
  if (editorDotOverlayRaf !== null) return;
  editorDotOverlayRaf = requestAnimationFrame(() => {
    editorDotOverlayRaf = null;
    syncEditorDotOverlay();
  });
}

window.waywordFlushEditorDotOverlaySync = flushEditorDotOverlaySync;

/**
 * Dot placement from Range.getClientRects():
 * - Horizontal: center of the widest fragment (stable “body” of a wrapped token).
 * - Vertical anchor: max(bottom) over all fragments so dots sit below the full token block.
 *   Using only the widest fragment’s bottom was wrong for wrapped tokens (narrow focus layout
 *   wraps more): dots could land above a lower fragment or collide with the next ink row.
 */
function pickDotAnchorMetricsFromClientRects(rects) {
  const list = Array.from(rects).filter((r) => r.width > 0.5 && r.height > 0.5);
  if (!list.length) return null;
  let widest = list[0];
  for (let i = 1; i < list.length; i++) {
    const r = list[i];
    if (r.width > widest.width + 0.5) {
      widest = r;
      continue;
    }
    if (Math.abs(r.width - widest.width) <= 0.5) {
      if (r.top < widest.top - 0.5) widest = r;
      else if (Math.abs(r.top - widest.top) <= 0.5 && r.left < widest.left) widest = r;
    }
  }
  let anchorBottom = list[0].bottom;
  for (const r of list) {
    anchorBottom = Math.max(anchorBottom, r.bottom);
  }
  return { cx: widest.left + widest.width / 2, anchorBottom };
}

function editorSemanticDotGroupHalfWidthPx(flagCount) {
  const n = Math.max(0, Math.floor(Number(flagCount)) || 0);
  if (n <= 0) return 0;
  return (n * EDITOR_SEMANTIC_DOT_PX + Math.max(0, n - 1) * EDITOR_SEMANTIC_DOT_GAP_PX) / 2;
}

/**
 * Phase 2 step 5 + Phase 3 step 7: grouped dots per token (1–3), geometry only; group centered on anchor when it fits.
 */
function syncEditorDotOverlay() {
  const overlay = editorDotOverlay;
  if (!overlay || !editorInput) {
    return;
  }

  if (!state.active) {
    overlay.replaceChildren();
    return;
  }

  if (editorInputScrollport) {
    overlay.style.left = "";
    overlay.style.top = "";
    overlay.style.width = "";
    overlay.style.height = "";
  } else if (editorInput) {
    overlay.style.left = `${editorInput.offsetLeft}px`;
    overlay.style.top = `${editorInput.offsetTop}px`;
    overlay.style.width = `${editorInput.offsetWidth}px`;
    overlay.style.height = `${editorInput.offsetHeight}px`;
  }

  const tn = editorInput.firstChild;
  if (!tn || tn.nodeType !== Node.TEXT_NODE) {
    overlay.replaceChildren();
    return;
  }

  const live = tn.textContent;
  const canon = serializeWriteDoc(state.writeDoc);
  if (editorCanonicalTextFromDisplayText(live) !== canon) {
    overlay.replaceChildren();
    return;
  }

  const lines = state.writeDoc?.lines;
  if (!lines?.length) {
    overlay.replaceChildren();
    return;
  }

  const frag = document.createDocumentFragment();
  const oRect = overlay.getBoundingClientRect();
  const overlayW = oRect.width;
  const port = editorInputScrollport;
  const viewH = port ? port.clientHeight : oRect.height;
  const scTop = port ? port.scrollTop : 0;
  const submittedAnnotatedSpacing =
    state.submitted &&
    state.completedUiActive &&
    writeDocHasAnySemanticFlags();
  /* Gap below token ink box before dot row (px); keep small so dots track line boxes after line-height fix. */
  const gapBelowAnchorPx = 5;
  const bottomReservePx = submittedAnnotatedSpacing
    ? EDITOR_SEMANTIC_DOT_PX + 36
    : EDITOR_SEMANTIC_DOT_PX + 7;

  for (let li = 0; li < lines.length; li++) {
    const tokens = lines[li].tokens || [];
    for (let ti = 0; ti < tokens.length; ti++) {
      const token = tokens[ti];
      const sems = getOrderedSemanticFlagsForToken(token);
      if (!sems.length) continue;

      const range = tokenCanonicalCharRangeHalfOpen(state.writeDoc, li, ti);
      if (!range || range.end > canon.length) continue;

      try {
        const domRange = document.createRange();
        domRange.setStart(tn, range.start);
        domRange.setEnd(tn, range.end);
        const rects = domRange.getClientRects();
        const anchor = pickDotAnchorMetricsFromClientRects(rects);
        if (!anchor) continue;

        const cxIdeal = anchor.cx - oRect.left;
        const top = anchor.anchorBottom - oRect.top + gapBelowAnchorPx;
        const halfW = editorSemanticDotGroupHalfWidthPx(sems.length);
        const edgePad = 2;
        let cx = cxIdeal;
        if (overlayW > 0 && halfW > 0) {
          if (overlayW <= halfW * 2 + edgePad * 2) {
            cx = overlayW / 2;
          } else {
            cx = Math.max(halfW + edgePad, Math.min(overlayW - halfW - edgePad, cxIdeal));
          }
        } else {
          cx = Math.max(0, Math.min(overlayW, cxIdeal));
        }
        /* Submitted annotated: do not upper-clamp toward 0 — that pulled dots up into the next line’s text. */
        const topClampMax = scTop + viewH - bottomReservePx;
        const topClamped = submittedAnnotatedSpacing
          ? Math.max(0, top)
          : Math.max(0, Math.min(topClampMax, top));

        const group = document.createElement("span");
        group.className = "editor-token-dot-group";
        group.setAttribute("aria-hidden", "true");
        group.style.left = `${cx}px`;
        group.style.top = `${topClamped}px`;

        for (const id of sems) {
          if (!SEMANTIC_FLAG_IDS.includes(id)) {
            console.warn("Unknown semantic category for editor dot:", id);
            continue;
          }
          const dot = document.createElement("span");
          dot.className = `editor-token-dot editor-token-dot--${id}`;
          group.appendChild(dot);
        }

        frag.appendChild(group);
      } catch {
        /* transient range errors — skip dot */
      }
    }
  }

  overlay.replaceChildren(frag);
}

/**
 * writeDoc-first (debug row): add next missing flag in filler → repetition → opening → challenge order, or clear when full.
 * Canonical text unchanged; preserves multi-flag state until full then resets.
 */
function cycleAnnotationSemanticFlag(lineIndex, tokenIndex) {
  const lines = state.writeDoc?.lines;
  if (!lines?.length) return;
  if (lineIndex < 0 || lineIndex >= lines.length) return;
  const tokens = lines[lineIndex].tokens || [];
  if (tokenIndex < 0 || tokenIndex >= tokens.length) return;

  const token = tokens[tokenIndex];
  const cur = getOrderedSemanticFlagsForToken(token);
  const have = new Set(cur);
  for (const id of SEMANTIC_FLAG_IDS) {
    if (!have.has(id)) {
      setSemanticFlagsOnToken(lineIndex, tokenIndex, [...cur, id]);
      return;
    }
  }
  setSemanticFlagsOnToken(lineIndex, tokenIndex, []);
}

/** writeDoc-only semantic assignment; canonical text unchanged; no editor re-project. */
function setSemanticFlagsOnToken(lineIndex, tokenIndex, rawFlags) {
  const lines = state.writeDoc?.lines;
  if (!lines?.length) return;
  if (lineIndex < 0 || lineIndex >= lines.length) return;
  const tokens = lines[lineIndex].tokens || [];
  if (tokenIndex < 0 || tokenIndex >= tokens.length) return;

  const token = tokens[tokenIndex];
  const norm = normalizeWord(token.text);
  let flags = !rawFlags || rawFlags.length === 0 ? [] : normalizeSemanticFlagsArray(rawFlags);
  flags = mergeChallengeVsFillerSemanticFlags(flags, norm);

  const newLines = lines.map((line, li) => {
    if (li !== lineIndex) return line;
    return {
      ...line,
      tokens: line.tokens.map((t, ti) => {
        if (ti !== tokenIndex) return t;
        return { ...t, flags: [...flags] };
      })
    };
  });
  state.writeDoc = { ...state.writeDoc, lines: newLines };
}

let semanticPickerRaf = null;

function scheduleSemanticPickerFromSelection() {
  if (
    window.waywordSemanticPickerInteractions &&
    typeof window.waywordSemanticPickerInteractions.scheduleSemanticPickerFromSelection === "function"
  ) {
    return window.waywordSemanticPickerInteractions.scheduleSemanticPickerFromSelection({
      updateEditorSemanticPickerFromSelection
    });
  }
  if (semanticPickerRaf !== null) return;
  semanticPickerRaf = requestAnimationFrame(() => {
    semanticPickerRaf = null;
    updateEditorSemanticPickerFromSelection();
  });
}

function hideEditorSemanticPicker() {
  if (
    window.waywordSemanticPickerInteractions &&
    typeof window.waywordSemanticPickerInteractions.hideEditorSemanticPicker === "function"
  ) {
    return window.waywordSemanticPickerInteractions.hideEditorSemanticPicker({
      editorSemanticPicker
    });
  }
  editorSemanticPicker?.classList.add("hidden");
}

/**
 * Phase 3 Step 2: show a minimal picker when selection is exactly one token (canonical offsets).
 * Geometry from Range only; semantics from writeDoc mapping only.
 */
function updateEditorSemanticPickerFromSelection() {
  if (
    window.waywordSemanticPickerInteractions &&
    typeof window.waywordSemanticPickerInteractions.updateEditorSemanticPickerFromSelection === "function"
  ) {
    return window.waywordSemanticPickerInteractions.updateEditorSemanticPickerFromSelection({
      editorSemanticPicker,
      editorInput,
      state,
      getEditorSurfaceComposing() {
        return editorSurfaceComposing;
      },
      serializeWriteDoc,
      getSelectionOffsetsForEditorRoot,
      findExactSingleTokenForCanonicalRange
    });
  }
  const picker = editorSemanticPicker;
  if (!picker || !editorInput) return;

  if (!state.active || state.submitted || editorSurfaceComposing) {
    picker.classList.add("hidden");
    return;
  }

  const tn = editorInput.firstChild;
  if (!tn || tn.nodeType !== Node.TEXT_NODE) {
    picker.classList.add("hidden");
    return;
  }

  if (editorCanonicalTextFromDisplayText(tn.textContent) !== serializeWriteDoc(state.writeDoc)) {
    picker.classList.add("hidden");
    return;
  }

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !editorInput.contains(sel.anchorNode)) {
    picker.classList.add("hidden");
    return;
  }

  const { anchor, focus } = getSelectionOffsetsForEditorRoot(editorInput);
  const start = Math.min(anchor, focus);
  const end = Math.max(anchor, focus);
  if (end <= start) {
    picker.classList.add("hidden");
    return;
  }

  const hit = findExactSingleTokenForCanonicalRange(state.writeDoc, start, end);
  if (!hit) {
    picker.classList.add("hidden");
    return;
  }

  const shell = document.querySelector(".editor-shell");
  if (!shell) {
    picker.classList.add("hidden");
    return;
  }

  try {
    const domRange = document.createRange();
    domRange.setStart(tn, start);
    domRange.setEnd(tn, end);
    const rect = domRange.getBoundingClientRect();
    if (rect.width < 1 && rect.height < 1) {
      picker.classList.add("hidden");
      return;
    }

    picker.dataset.lineIndex = String(hit.lineIndex);
    picker.dataset.tokenIndex = String(hit.tokenIndex);
    picker.classList.remove("hidden");

    const shellRect = shell.getBoundingClientRect();
    const shellW = shell.clientWidth;
    const shellH = shell.clientHeight;
    const pw = picker.offsetWidth;
    const ph = picker.offsetHeight;
    const margin = 6;

    let left = rect.left - shellRect.left + rect.width / 2 - pw / 2;
    left = Math.max(margin, Math.min(left, shellW - pw - margin));

    let top = rect.bottom - shellRect.top + 5;
    if (top + ph > shellH - margin) {
      top = rect.top - shellRect.top - ph - 5;
    }
    top = Math.max(margin, Math.min(top, shellH - ph - margin));

    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
  } catch {
    picker.classList.add("hidden");
  }
}

function bindEditorSemanticPicker() {
  if (
    window.waywordSemanticPickerInteractions &&
    typeof window.waywordSemanticPickerInteractions.bindEditorSemanticPicker === "function"
  ) {
    return window.waywordSemanticPickerInteractions.bindEditorSemanticPicker({
      editorSemanticPicker,
      state,
      semanticFlagIds: SEMANTIC_FLAG_IDS,
      setSemanticFlagsOnToken,
      getOrderedSemanticFlagsForToken,
      scheduleEditorDotOverlaySync,
      renderAnnotationRow,
      renderSidebar,
      $,
      updateEditorSemanticPickerFromSelection
    });
  }
  const picker = editorSemanticPicker;
  if (!picker || picker.dataset.semanticPickerBound === "1") return;
  picker.dataset.semanticPickerBound = "1";

  picker.addEventListener("mousedown", (e) => {
    e.preventDefault();
  });

  picker.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-semantic-choice]");
    if (!btn) return;
    e.stopPropagation();
    const choice = btn.getAttribute("data-semantic-choice");
    const li = Number(picker.dataset.lineIndex);
    const ti = Number(picker.dataset.tokenIndex);
    if (!Number.isInteger(li) || !Number.isInteger(ti)) return;
    const tokensRow = state.writeDoc?.lines?.[li]?.tokens;
    const tok = tokensRow?.[ti];
    if (!tok) return;

    if (choice === "clear") {
      setSemanticFlagsOnToken(li, ti, []);
    } else if (SEMANTIC_FLAG_IDS.includes(choice)) {
      const cur = getOrderedSemanticFlagsForToken(tok);
      const nextSet = new Set(cur);
      if (nextSet.has(choice)) nextSet.delete(choice);
      else nextSet.add(choice);
      const next = SEMANTIC_FLAG_IDS.filter((id) => nextSet.has(id));
      setSemanticFlagsOnToken(li, ti, next);
    } else {
      return;
    }
    hideEditorSemanticPicker();
    scheduleEditorDotOverlaySync();
    renderAnnotationRow();
    renderSidebar();
  });

  document.addEventListener("selectionchange", () => {
    scheduleSemanticPickerFromSelection();
  });
}

/** Dev-only: `?annotationDots=1` shows sample dots without mutating writeDoc (display path only). */
function annotationDotsDebugEnabled() {
  try {
    return new URLSearchParams(window.location.search).get("annotationDots") === "1";
  } catch {
    return false;
  }
}

/** Dev-only: `?annotationRow=1` shows the token annotation row (Phase 3 debug/scaffolding; not primary UI). */
function annotationRowDebugEnabled() {
  try {
    return new URLSearchParams(window.location.search).get("annotationRow") === "1";
  } catch {
    return false;
  }
}

/**
 * Effective flags for annotation visuals only. Never used for serialize/score/submit.
 * Uses normalized semantic flags when set; otherwise optional debug samples (no state mutation).
 */
function annotationRowEffectiveFlags(token, lineIndex, tokenIndex) {
  const ordered = getOrderedSemanticFlagsForToken(token);
  if (ordered.length) return ordered;
  if (!annotationDotsDebugEnabled()) return [];
  if (
    (lineIndex === 0 && tokenIndex === 0) ||
    (lineIndex === 0 && tokenIndex === 1) ||
    (lineIndex === 1 && tokenIndex === 0)
  ) {
    return ["filler"];
  }
  return [];
}

/**
 * Debug / scaffolding row only when `?annotationRow=1`. Primary semantics: editor selection picker + inline dots.
 * Row-only DOM; no editor re-project.
 */
function renderAnnotationRow() {
  const row = $("annotationRow");
  if (!row) return;

  if (!state.active || state.submitted) {
    row.classList.add("hidden");
    row.classList.remove("annotation-row--debug-scaffold");
    row.replaceChildren();
    scheduleEditorDotOverlaySync();
    return;
  }

  if (!annotationRowDebugEnabled()) {
    row.classList.add("hidden");
    row.classList.remove("annotation-row--debug-scaffold");
    row.replaceChildren();
    scheduleEditorDotOverlaySync();
    return;
  }

  row.classList.remove("hidden");
  row.classList.add("annotation-row--debug-scaffold");
  const lines = state.writeDoc?.lines || [];
  const frag = document.createDocumentFragment();

  for (let li = 0; li < lines.length; li++) {
    const tokens = lines[li].tokens || [];
    if (li > 0) {
      const gap = document.createElement("span");
      gap.className = "annotation-line-gap";
      gap.setAttribute("aria-hidden", "true");
      gap.textContent = "↵";
      frag.appendChild(gap);
    }
    for (let ti = 0; ti < tokens.length; ti++) {
      const token = tokens[ti];
      const slot = document.createElement("span");
      slot.className = "annotation-slot annotation-slot--toggle";
      slot.dataset.lineIndex = String(li);
      slot.dataset.tokenIndex = String(ti);
      slot.setAttribute("role", "button");
      const effective = annotationRowEffectiveFlags(token, li, ti);
      const displayLabel = effective.length ? effective.join(", ") : "none";
      const displaySem = effective[0] || null;
      slot.setAttribute("aria-pressed", effective.length ? "true" : "false");
      slot.setAttribute(
        "aria-label",
        `Cycle annotation on «${token.text || "·"}», line ${li + 1}. Current: ${displayLabel}. Adds next flag in order or clears when all set.`
      );
      if (displaySem && SEMANTIC_FLAG_IDS.includes(displaySem)) {
        slot.classList.add(`annotation-slot--${displaySem}`);
      }

      if (effective.length) {
        const dotWrap = document.createElement("span");
        dotWrap.className = "annotation-slot-dots";
        dotWrap.setAttribute("aria-hidden", "true");
        for (const id of effective) {
          if (!SEMANTIC_FLAG_IDS.includes(id)) {
            console.warn("Unknown semantic category for annotation dot:", id);
            continue;
          }
          const dot = document.createElement("span");
          dot.className = `annotation-dot annotation-dot--${id}`;
          dotWrap.appendChild(dot);
        }
        slot.appendChild(dotWrap);
      }

      const label = document.createElement("span");
      label.className = "annotation-slot-text";
      label.setAttribute("aria-hidden", "true");
      label.textContent = token.text || "·";
      slot.appendChild(label);

      slot.title = `Click: add filler → repetition → opening → challenge in order; clears after all set. Now: ${displayLabel} · line ${li + 1} · ${token.text || "·"}`;

      frag.appendChild(slot);
    }
  }

  if (frag.childNodes.length === 0) {
    const ph = document.createElement("span");
    ph.className = "annotation-slot";
    ph.setAttribute("aria-hidden", "true");
    ph.title = "No word tokens yet";
    ph.textContent = "—";
    frag.appendChild(ph);
  }

  row.replaceChildren(frag);
  scheduleEditorDotOverlaySync();
}

function bindAnnotationRowFlagInteraction() {
  if (
    window.waywordSemanticPickerInteractions &&
    typeof window.waywordSemanticPickerInteractions.bindAnnotationRowFlagInteraction === "function"
  ) {
    return window.waywordSemanticPickerInteractions.bindAnnotationRowFlagInteraction({
      $,
      state,
      editorInput,
      getEditorSurfaceComposing() {
        return editorSurfaceComposing;
      },
      getSelectionOffsetsForEditorRoot,
      getAnnotationRowPendingEditorSel() {
        return annotationRowPendingEditorSel;
      },
      setAnnotationRowPendingEditorSel(value) {
        annotationRowPendingEditorSel = value;
      },
      cycleAnnotationSemanticFlag,
      renderAnnotationRow,
      setSelectionOffsetsForEditorRoot,
      scheduleEditorDotOverlaySync,
      renderSidebar,
      scheduleSemanticPickerFromSelection
    });
  }
  const row = $("annotationRow");
  if (!row || row.dataset.flagInteractionBound === "1") return;
  row.dataset.flagInteractionBound = "1";

  /* Capture on the row only — never document-level — so editor pointer paths stay native. */
  row.addEventListener(
    "pointerdown",
    (e) => {
      const slot = e.target.closest(".annotation-slot[data-line-index]");
      if (!slot || !state.active || state.submitted) return;
      if (editorSurfaceComposing) return;
      if (editorInput && document.activeElement === editorInput) {
        annotationRowPendingEditorSel = getSelectionOffsetsForEditorRoot(editorInput);
      } else {
        annotationRowPendingEditorSel = null;
      }
    },
    true
  );

  function finishToggleFromSlot(slot) {
    if (!slot || editorSurfaceComposing) return;
    const li = Number(slot.dataset.lineIndex);
    const ti = Number(slot.dataset.tokenIndex);
    if (!Number.isInteger(li) || !Number.isInteger(ti)) return;
    const pending = annotationRowPendingEditorSel;
    annotationRowPendingEditorSel = null;
    cycleAnnotationSemanticFlag(li, ti);
    renderAnnotationRow();
    if (editorInput) {
      editorInput.focus({ preventScroll: true });
      if (pending) {
        setSelectionOffsetsForEditorRoot(
          editorInput,
          pending.anchor,
          pending.focus,
          pending.backward
        );
      }
    }
    scheduleEditorDotOverlaySync();
    scheduleSemanticPickerFromSelection();
    renderSidebar();
  }

  row.addEventListener("click", (e) => {
    const slot = e.target.closest(".annotation-slot[data-line-index]");
    if (!slot || !state.active || state.submitted) return;
    if (editorSurfaceComposing) return;
    e.preventDefault();
    finishToggleFromSlot(slot);
  });
}

function showEditorOverlay(message = "Submitted", persist = false) {
  const overlay = $("editorOverlay");
  const card = $("editorOverlayCard");
  if (!overlay || !card) return;

  card.textContent = message;
  overlay.classList.remove("hidden");

  if (!persist) {
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 900);
  }
}

let bottomChromeFirstSessionEntrySettleTimer = null;

function clearBottomChromeFirstSessionEntrySettleTimer() {
  if (bottomChromeFirstSessionEntrySettleTimer != null) {
    window.clearTimeout(bottomChromeFirstSessionEntrySettleTimer);
    bottomChromeFirstSessionEntrySettleTimer = null;
  }
}

/** Fade + slight drift for gear + progress when firstSessionEntry overlay is up (not display:none). */
function syncEditorBottomChromeForFirstSessionEntryOverlay() {
  const overlay = $("editorOverlay");
  const gear = $("optionsTrigger");
  const progress = document.querySelector(".editor-bottom-chrome-center .editor-progress");
  if (!overlay || !gear || !progress) return;

  const hide =
    !overlay.classList.contains("hidden") && overlay.classList.contains("editor-overlay--firstSessionEntry");

  if (hide) {
    clearBottomChromeFirstSessionEntrySettleTimer();
    gear.classList.remove("ui-hidden--settled");
    progress.classList.remove("ui-hidden--settled");
    gear.style.removeProperty("display");
    progress.style.removeProperty("display");
    gear.classList.add("ui-hidden");
    progress.classList.add("ui-hidden");
    bottomChromeFirstSessionEntrySettleTimer = window.setTimeout(() => {
      bottomChromeFirstSessionEntrySettleTimer = null;
      if (
        !overlay.classList.contains("hidden") &&
        overlay.classList.contains("editor-overlay--firstSessionEntry")
      ) {
        gear.classList.add("ui-hidden--settled");
        progress.classList.add("ui-hidden--settled");
      }
    }, BOTTOM_CHROME_FIRST_SESSION_ENTRY_HIDE_MS);
    return;
  }

  clearBottomChromeFirstSessionEntrySettleTimer();
  gear.classList.remove("ui-hidden--settled", "ui-hidden");
  progress.classList.remove("ui-hidden--settled", "ui-hidden");
  gear.style.removeProperty("display");
  progress.style.removeProperty("display");
}

/** Post-submit overlay sync. */
function syncEditorPostRunOverlay() {
  try {
    const overlay = $("editorOverlay");
    const card = $("editorOverlayCard");
    if (!overlay || !card) {
      return;
    }

    if (!state.active || !state.submitted || !state.completedUiActive) {
      overlay.classList.add("hidden");
      overlay.classList.remove("editor-overlay--firstSessionEntry");
      card.className = "editor-overlay-card";
      card.textContent = "";
      card.innerHTML = "";
      card.removeAttribute("data-firstSessionEntry-overlay-key");
      overlay.style.removeProperty("clip-path");
      overlay.style.removeProperty("-webkit-clip-path");
      scheduleFirstSessionEntryOverlayGeometrySync();
      return;
    }

    card.removeAttribute("data-firstSessionEntry-overlay-key");
    overlay.classList.remove("editor-overlay--firstSessionEntry");
    card.className = "editor-overlay-card";
    card.innerHTML = "";
    card.textContent = "";
    overlay.classList.add("hidden");
    overlay.style.removeProperty("clip-path");
    overlay.style.removeProperty("-webkit-clip-path");
    scheduleFirstSessionEntryOverlayGeometrySync();
  } finally {
    renderProfileSummaryStrip();
    syncEditorBottomChromeForFirstSessionEntryOverlay();
  }
}

function prefersReducedUiMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {
    return false;
  }
}

/** Throttle for {@link requestMirrorReflectionAttentionSettle} across post-submit re-renders. */
let waywordMirrorReflectionSettleLastAt = 0;

/**
 * After submit, gently bring Mirror into view when the reflection panel has content.
 * Skipped for reduced motion; throttled so `renderWritingState` re-entries do not repeat scroll.
 */
function requestMirrorReflectionAttentionSettle() {
  if (!state.submitted || !state.completedUiActive) return;
  if (prefersReducedUiMotion()) return;
  const section = $("mirrorReflectionSection");
  if (!section || section.classList.contains("hidden")) return;
  const root = $("mirrorReflectionRoot");
  if (!root || !String(root.innerHTML || "").trim()) return;

  const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  if (now - waywordMirrorReflectionSettleLastAt < 900) return;
  waywordMirrorReflectionSettleLastAt = now;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        section.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      } catch (_) {}
    });
  });
}

let recentRunsUi = null;
let optionsUi = null;

function isRecentDrawerOpen() {
  return recentRunsUi.isRecentDrawerOpen();
}

function syncRecentRailExpandedChrome() {
  recentRunsUi.syncRecentRailExpandedChrome();
}

/**
 * Desktop expanded Review Runs: cap rail height to the editor chamfer box (measured), still bounded by the
 * viewport band in CSS (`--review-runs-rail-desktop-viewport-floor`). Sets `--review-runs-rail-expanded-max-h`
 * on `#writeView` for `body.recent-rail-expanded #writeView .side-column`.
 */
function syncRecentRailExpandedLayoutMetrics(options = {}) {
  recentRunsUi.syncRecentRailExpandedLayoutMetrics(options);
}

recentRunsUi = window.waywordRecentRunsUiCoordination.createCoordinator({
  $,
  state,
  editorInput,
  isMobileViewport,
  isDesktopPatternsViewport,
  recentDrawerDismissGuardMs: RECENT_DRAWER_DISMISS_GUARD_MS,
  getRecentDrawerDismissGuardUntil() {
    return recentDrawerDismissGuardUntil;
  },
  setRecentDrawerDismissGuardUntil(n) {
    recentDrawerDismissGuardUntil = n;
  },
  setSuppressFocusExitUntil(n) {
    suppressFocusExitUntil = n;
  },
  setFocusMode,
  renderHistory,
  hideMetricExplainer,
  queueViewportSync,
  applyRecentDrawerDomState: window.waywordViewController.applyRecentDrawerDomState.bind(
    window.waywordViewController
  ),
  domEventTargetElement,
  interaction: window.waywordRecentRunsInteraction,
  transition: window.waywordRecentRunsTransition
});

optionsUi = window.waywordOptionsUiCoordination.createCoordinator({
  $,
  state,
  editorInput,
  isMobileViewport,
  focusEditorToEnd,
  optionsPanelDismissGuardMs: OPTIONS_PANEL_DISMISS_GUARD_MS,
  getOptionsOpen() {
    return state.optionsOpen;
  },
  getOptionsPanelDismissGuardUntil() {
    return optionsPanelDismissGuardUntil;
  },
  setOptionsPanelDismissGuardUntil(value) {
    optionsPanelDismissGuardUntil = value;
  },
  clearBannedPanelPersistTimer() {
    if (bannedPanelPersistTimer != null) {
      clearTimeout(bannedPanelPersistTimer);
      bannedPanelPersistTimer = null;
    }
  },
  syncWordModesPanel() {
    setActiveModeButton("wordModesPanel", "words", state.targetWords);
  },
  syncTimeModesPanel() {
    setActiveModeButton("timeModesPanel", "time", state.timerSeconds);
  },
  getBannedPanelValue() {
    return state.banned.join(", ");
  },
  flushBannedPanelPersistFromPanel,
  applyBodySettingsOpenClass: window.waywordViewController.applyBodySettingsOpenClass,
  applyEditorOptionsPanelAriaAndBackdrop:
    window.waywordViewController.applyEditorOptionsPanelAriaAndBackdrop,
  syncViewportHeightVar,
  queueViewportSync
});

function setOptionsOpen(open) {
  return optionsUi.setOptionsOpen(open);
}

function initEditorCompletedFlow() {
  const overlay = $("editorOverlay");
  const card = $("editorOverlayCard");
  if (!overlay || !card) return;
  if (overlay.dataset.completedFlowBound === "1") return;
  overlay.dataset.completedFlowBound = "1";

  overlay.addEventListener("click", () => {
    if (state.optionsOpen) return;
    runPostSubmitAutoNewRunNow();
  });
}

function setActiveModeButton(containerId, attribute, value) {
  if (
    window.waywordWritingModeButtonPresentation &&
    typeof window.waywordWritingModeButtonPresentation.setActiveModeButton === "function"
  ) {
    return window.waywordWritingModeButtonPresentation.setActiveModeButton(
      { $ },
      containerId,
      attribute,
      value
    );
  }

  const container = $(containerId);
  if (!container) return;
  const sel = attribute === "words" ? "button[data-words]" : "button[data-time]";
  Array.from(container.querySelectorAll(sel)).forEach(btn => {
    const v = Number(btn.dataset[attribute]);
    const on = Number.isFinite(v) && v === value;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function setBannedEditorOpen(open) {
  if (
    window.waywordInlineBannedEditorPresentation &&
    typeof window.waywordInlineBannedEditorPresentation.setBannedEditorOpen === "function"
  ) {
    return window.waywordInlineBannedEditorPresentation.setBannedEditorOpen({
      $,
      state,
      open,
      getBannedValue() {
        return state.banned.join(", ");
      }
    });
  }

  state.bannedEditorOpen = open;
  $("metaEditorRow")?.classList.toggle("hidden", !open);
  if (open) {
    const input = $("bannedInlineInput");
    if (input) {
      input.value = state.banned.join(", ");
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      });
    }
  }
}

/* -----------------------------
   meta + layout rendering
----------------------------- */

function renderExerciseBanner() {
  if (
    window.waywordWritingExerciseBannerPresentation &&
    typeof window.waywordWritingExerciseBannerPresentation.renderExerciseBanner === "function"
  ) {
    return window.waywordWritingExerciseBannerPresentation.renderExerciseBanner({
      $,
      state
    });
  }

  const bannedPill = $("bannedPill");
  const exercisePill = $("exerciseLegendPill");
  if (!bannedPill) return;

  const bannedText = state.banned.length ? state.banned.join(", ") : "none";
  bannedPill.textContent = `avoid: ${bannedText}`;

  if (exercisePill) {
    if (state.exerciseWords.length) {
      exercisePill.classList.remove("hidden");
      $("legendChallengeCount").textContent = "0";
    } else {
      exercisePill.classList.add("hidden");
    }
  }
}

function updateSubmitButtonState() {
  if (
    window.waywordWritingSubmitSurfaceCoordinator &&
    typeof window.waywordWritingSubmitSurfaceCoordinator.updateSubmitButtonState === "function"
  ) {
    return window.waywordWritingSubmitSurfaceCoordinator.updateSubmitButtonState({
      $,
      state,
      editorInput,
      getEditorText
    });
  }

  updateEnterButtonVisibility();
}

function syncWordTargetLabels() {
  if (
    window.waywordWritingTargetLabelPresentation &&
    typeof window.waywordWritingTargetLabelPresentation.syncWordTargetLabels === "function"
  ) {
    return window.waywordWritingTargetLabelPresentation.syncWordTargetLabels({
      $,
      state
    });
  }

  const t = Number(state.targetWords) || 0;
  const text =
    t === 120 ? "Write to 120 words" : t === 240 ? "Write to 240 words" : "Write to 60 words";
  const panel = $("wordTargetLabelPanel");
  const setup = $("wordTargetLabelSetup");
  if (panel) panel.textContent = text;
  if (setup) setup.textContent = text;
}

function renderMeta() {
  if (
    window.waywordWritingPromptCardPresentation &&
    typeof window.waywordWritingPromptCardPresentation.renderPromptCard === "function"
  ) {
    window.waywordWritingPromptCardPresentation.renderPromptCard({
      $,
      state
    });
  } else {
    const promptCard = $("promptCard");
    const promptText = $("promptText");

    if (promptCard) promptCard.classList.toggle("hidden", !state.active);
    if (promptText) promptText.textContent = state.prompt || "";
  }

  ensurePromptRerollButton();
  bindPromptClusterControlsOnce();

  if (
    window.waywordWritingBannedPanelPresentation &&
    typeof window.waywordWritingBannedPanelPresentation.syncBannedPanelPresentation === "function"
  ) {
    window.waywordWritingBannedPanelPresentation.syncBannedPanelPresentation({
      $,
      document,
      state
    });
  } else {
    const bannedPill = $("bannedPill");
    if (bannedPill) {
      const bannedText = state.banned.length ? state.banned.join(", ") : "none";
      bannedPill.textContent = `avoid: ${bannedText}`;
    }

    const bannedInlineInputPanel = $("bannedInlineInputPanel");
    if (bannedInlineInputPanel && document.activeElement !== bannedInlineInputPanel) {
      bannedInlineInputPanel.value = state.banned.join(", ");
    }
  }

  renderExerciseBanner();

  if (
    window.waywordWritingMetaSurfaceCoordinator &&
    typeof window.waywordWritingMetaSurfaceCoordinator.syncMetaSurface === "function"
  ) {
    window.waywordWritingMetaSurfaceCoordinator.syncMetaSurface({
      state,
      setActiveModeButton,
      syncWordTargetLabels,
      updateWordProgress,
      updateTimeFill,
      updateEnterButtonVisibility
    });
  } else {
    setActiveModeButton("wordModes", "words", state.targetWords);
    setActiveModeButton("timeModes", "time", state.timerSeconds);
    setActiveModeButton("wordModesPanel", "words", state.targetWords);
    setActiveModeButton("timeModesPanel", "time", state.timerSeconds);

    syncWordTargetLabels();

    updateWordProgress();
    updateTimeFill();
    updateEnterButtonVisibility();
  }

  if (
    window.waywordWritingPromptRerollPresentation &&
    typeof window.waywordWritingPromptRerollPresentation.renderPromptRerollButton === "function"
  ) {
    window.waywordWritingPromptRerollPresentation.renderPromptRerollButton({
      $,
      state,
      rerollLimit: PROMPT_REROLL_LIMIT,
      canRerollPrompt,
      normalizePromptRerollButtonIfNeeded
    });
  } else {
    let rerollBtn = $("promptRerollBtn");
    if (rerollBtn) {
      normalizePromptRerollButtonIfNeeded();
      rerollBtn = $("promptRerollBtn");
    }

    if (rerollBtn) {
      const remaining = Math.max(0, PROMPT_REROLL_LIMIT - state.promptRerollsUsed);
      const locked = !canRerollPrompt();

      rerollBtn.disabled = locked;
      rerollBtn.classList.toggle("locked", locked);
      rerollBtn.classList.toggle("hidden", remaining === 0);
      rerollBtn.dataset.rerolls = String(remaining);
      rerollBtn.setAttribute(
        "aria-label",
        remaining === 0
          ? "No prompt rerolls left"
          : `Get a different prompt (${remaining} reroll${remaining === 1 ? "" : "s"} left)`
      );
    }
  }

  syncFirstSessionEntryWritingModeClass();
  enforceRightControlSpineOwnership("renderMeta:final");
}

/** FirstSessionEntry progress lives in the in-editor overlay only; this keeps header chrome in sync. */
function renderFirstSessionEntry() {
  const runs = completedRuns();
  const profileBtn = $("profileBtn");
  if (profileBtn) {
    profileBtn.classList.add("hidden");
  }

  const styleTab = $("styleTab");
  if (styleTab) {
    styleTab.classList.toggle("hidden", runs < FIRST_SESSION_ENTRY_THRESHOLD);
  }
}

function renderWritingState(options = {}) {
  if (!editorInput) return;

  if (!state.submitted || !state.completedUiActive) {
    waywordMirrorReflectionSettleLastAt = 0;
  }

  const deferPostRunOverlaySync = Boolean(options.deferPostRunOverlaySync);

  if (
    window.waywordEditorStatePresentation &&
    typeof window.waywordEditorStatePresentation.applyEditorWritingState === "function"
  ) {
    window.waywordEditorStatePresentation.applyEditorWritingState({
      state,
      editorInput,
      getEditorText
    });
  } else {
    const isLocked = !state.active || state.submitted;

    editorInput.setAttribute("contenteditable", isLocked ? "false" : "true");
    editorInput.setAttribute("data-placeholder", "");
    editorInput.classList.toggle("is-empty", !getEditorText().trim());
  }

  updateSubmitButtonState();
  updateWordProgress();
  updateTimeFill();
  renderAnnotationRow();
  const mirrorPostRunParts = window.waywordPostRunRenderer.computeMirrorPostRunPanelParts(
    postRunMirrorPanelInputs()
  );
  window.waywordPostRunRenderer.renderReflectionLine(getPostRunReflectionLineText(mirrorPostRunParts));
  window.waywordPostRunRenderer.resetPostRunFeedbackBox();
  renderMirrorReflectionPanel(mirrorPostRunParts);
  if (!deferPostRunOverlaySync) {
    syncEditorPostRunOverlay();
  }
  renderFirstSessionEntry();
  renderProfileSummaryStrip();

  const shell = document.querySelector(".editor-shell");
  if (shell) {
    shell.classList.toggle(
      "editor-shell--submitted-annotated-spacing",
      Boolean(
        state.active &&
          state.submitted &&
          state.completedUiActive &&
          writeDocHasAnySemanticFlags()
      )
    );
  }
  syncSubmittedAnnotatedEditorSurfaces();
  scheduleEditorDotOverlaySync();
  requestAnimationFrame(() => scheduleEditorDotOverlaySync());
  syncFirstSessionEntryWritingModeClass();
}

function setSemanticLegendPillState(pillEl, count) {
  if (!pillEl) return;
  const c = Math.max(0, Math.floor(Number(count)) || 0);
  const countEl = pillEl.querySelector(".legend-count");
  if (countEl) countEl.textContent = String(c);
  pillEl.classList.toggle("legend-pill--inactive", c === 0);
  pillEl.classList.toggle("hidden", c === 0);
}

function renderLegend(analysis) {
  const bar = $("editorSemanticStatusBar");
  const bluePill = $("exerciseLegendPill");
  const fillerPill = $("legendPillFiller");
  const repetitionPill = $("legendPillRepetition");
  const openingPill = $("legendPillOpening");

  if (!state.active || !analysis) {
    setSemanticLegendPillState(fillerPill, 0);
    setSemanticLegendPillState(repetitionPill, 0);
    setSemanticLegendPillState(openingPill, 0);
    setSemanticLegendPillState(bluePill, 0);
    if (bar) {
      const pills = [fillerPill, repetitionPill, openingPill, bluePill].filter(Boolean);
      bar.classList.toggle("hidden", !pills.some((p) => !p.classList.contains("hidden")));
      bar.classList.remove("semantic-status-bar--post-run-muted");
    }
    return;
  }

  const sem = countWriteDocSemanticFlagsOnTokens();
  setSemanticLegendPillState(fillerPill, sem.filler);
  setSemanticLegendPillState(repetitionPill, sem.repetition);
  setSemanticLegendPillState(openingPill, sem.opening);

  const blueCount = analysis.bannedHits.filter(i => i.isExercise).reduce((sum, item) => sum + item.count, 0);
  const challengeCount = state.exerciseWords.length ? blueCount : 0;
  setSemanticLegendPillState(bluePill, challengeCount);

  if (bar) {
    const pills = [fillerPill, repetitionPill, openingPill, bluePill].filter(Boolean);
    bar.classList.toggle("hidden", !pills.some((p) => !p.classList.contains("hidden")));
    const mutePostRunSemanticBar =
      Boolean(state.submitted && state.completedUiActive) && !bar.classList.contains("hidden");
    bar.classList.toggle("semantic-status-bar--post-run-muted", mutePostRunSemanticBar);
  }
}

function renderSidebar() {
  renderLegend(state.active ? analyze(getEditorText()) : null);
}

function getRecentEntries() {
  return readSavedRunsChronological().map((entry) => ({ text: String(entry?.text || "") }));
}

/**
 * 4+ letter tokens in MIRROR_STOPWORDS (src/features/mirror/constants/stopwords.ts).
 * Repetition scoring uses \\b\\w{4,}\\b, so shorter stopwords never enter the repetition bucket.
 */
const FIRST_SESSION_ENTRY_REPETITION_LOW_SIGNAL_WORDS = new Set([
  "about",
  "above",
  "across",
  "after",
  "against",
  "again",
  "also",
  "among",
  "another",
  "around",
  "because",
  "before",
  "below",
  "between",
  "both",
  "been",
  "being",
  "down",
  "during",
  "each",
  "even",
  "ever",
  "every",
  "from",
  "further",
  "here",
  "into",
  "just",
  "like",
  "more",
  "most",
  "much",
  "only",
  "once",
  "onto",
  "other",
  "over",
  "same",
  "some",
  "such",
  "than",
  "then",
  "there",
  "these",
  "this",
  "those",
  "that",
  "through",
  "until",
  "upon",
  "very",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "whom",
  "whose",
  "with",
  "within",
  "without"
]);

function analyzeDraftStats(text) {
  const raw = String(text || "");
  const sentenceParts = raw
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const wordMatches = raw.match(/\b\w+\b/g) || [];
  const totalWords = wordMatches.length;
  let sentenceWordTotal = 0;

  for (const sentence of sentenceParts) {
    const words = sentence.match(/\b\w+\b/g) || [];
    sentenceWordTotal += words.length;
  }

  const avgSentenceLength = sentenceParts.length
    ? sentenceWordTotal / sentenceParts.length
    : totalWords;

  const units = raw
    .split(/\n|(?<=[.!?])/)
    .map((unit) => unit.trim())
    .filter(Boolean);
  let fragmentCount = 0;
  for (const unit of units) {
    const endsWithPunctuation = /[.!?]\s*$/.test(unit);
    const unitWordCount = (unit.match(/\b\w+\b/g) || []).length;
    if (!endsWithPunctuation && unitWordCount < 8) {
      fragmentCount += 1;
    }
  }

  const repetitions = Object.create(null);
  const repetitionsContent = Object.create(null);
  const repetitionWords = raw.toLowerCase().match(/\b\w{4,}\b/g) || [];
  for (const word of repetitionWords) {
    repetitions[word] = (repetitions[word] || 0) + 1;
    if (!FIRST_SESSION_ENTRY_REPETITION_LOW_SIGNAL_WORDS.has(word)) {
      repetitionsContent[word] = (repetitionsContent[word] || 0) + 1;
    }
  }
  let repetitionCount = 0;
  let maxRepeat4 = 0;
  for (const count of Object.values(repetitions)) {
    maxRepeat4 = Math.max(maxRepeat4, count);
    if (count > 1) repetitionCount += 1;
  }
  let repetitionCountContent = 0;
  let maxRepeat4Content = 0;
  for (const count of Object.values(repetitionsContent)) {
    maxRepeat4Content = Math.max(maxRepeat4Content, count);
    if (count > 1) repetitionCountContent += 1;
  }

  return {
    avgSentenceLength,
    fragmentCount,
    repetitionCount,
    maxRepeat4,
    repetitionCountContent,
    maxRepeat4Content,
    totalWords
  };
}

function buildBaseline(entries) {
  const source = Array.isArray(entries) ? entries : [];
  if (source.length < 2) {
    return {
      avgSentenceLength: 0,
      fragmentCount: 0,
      repetitionCount: 0,
      sampleSize: 0
    };
  }

  let totalAvgSentenceLength = 0;
  let totalFragmentCount = 0;
  let totalRepetitionCount = 0;

  for (const entry of source) {
    const metrics = analyzeDraftStats(String(entry?.text || ""));
    totalAvgSentenceLength += metrics.avgSentenceLength;
    totalFragmentCount += metrics.fragmentCount;
    totalRepetitionCount += metrics.repetitionCount;
  }

  return {
    avgSentenceLength: totalAvgSentenceLength / source.length,
    fragmentCount: totalFragmentCount / source.length,
    repetitionCount: totalRepetitionCount / source.length,
    sampleSize: source.length
  };
}

const FIRST_SESSION_ENTRY_OBS_REPETITION = [
  "Certain words are beginning to recur.",
  "One word returns in short spans.",
  "The same word surfaces again."
];
const FIRST_SESSION_ENTRY_OBS_OPENINGS = [
  "Sentence openings begin to repeat.",
  "Opening phrases are starting to echo.",
  "The same line start returns."
];
const FIRST_SESSION_ENTRY_OBS_FRAGMENTATION = [
  "Lines stay short.",
  "Thought arrives in short fragments."
];
const FIRST_SESSION_ENTRY_OBS_LONG = [
  "Sentences are running longer than recent traces.",
  "This run leans longer than your last few saved runs."
];
const FIRST_SESSION_ENTRY_OBS_FALLBACK = [
  "A baseline is still forming.",
  "The trace is still light.",
  "A pattern has not settled yet.",
  "The shape is beginning, but still quiet."
];

function pickFirstSessionEntryObservationPhrase(phrases, seed) {
  if (!phrases.length) return "";
  const i = Math.abs(Math.floor(seed)) % phrases.length;
  return phrases[i];
}

/**
 * FirstSessionEntry observation: one plain line, dominant signal only (repetition → openings → fragmentation → long sentences → fallback).
 * @param {boolean} [ensureBaselineCardNonEmpty] When true (runs 1–threshold on the baseline overlay), never return an empty string; uses FIRST_SESSION_ENTRY_OBS_FALLBACK deterministically. Post-threshold runs pass false so lastRunFeedback stays unchanged when no line matches.
 */
function selectFirstSessionEntryObservation(text, priorEntries, ensureBaselineCardNonEmpty) {
  const raw = String(text || "").trim();
  const t = analyzeDraftStats(raw);
  const baseline = buildBaseline(priorEntries);
  const seed =
    (t.totalWords || 0) * 131 +
    (t.fragmentCount || 0) * 57 +
    (t.repetitionCount || 0) * 19 +
    (t.avgSentenceLength || 0) * 41;

  const minWordsForLexical = 10;
  const full = analyze(raw);
  const openingIncidents = full.repeatedStarters.reduce((s, [, c]) => s + Math.max(0, c - 1), 0);
  const sentenceCount = raw
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;

  const rc = t.repetitionCountContent || 0;
  const mr = t.maxRepeat4Content || 0;
  const repetitionApplies =
    (t.totalWords || 0) >= minWordsForLexical &&
    (rc >= 2 || (rc >= 1 && mr >= 4));

  if (repetitionApplies) {
    if (rc === 1 && mr >= 5) return "One word returns in short spans.";
    if (rc >= 3 || mr >= 6) return "Certain words are beginning to recur.";
    if (rc === 1) return "The same word surfaces again.";
    if (rc === 2) return pickFirstSessionEntryObservationPhrase(FIRST_SESSION_ENTRY_OBS_REPETITION, seed);
    return pickFirstSessionEntryObservationPhrase(FIRST_SESSION_ENTRY_OBS_REPETITION, seed);
  }

  const openingsApplies =
    (t.totalWords || 0) >= minWordsForLexical &&
    sentenceCount >= 2 &&
    openingIncidents >= 1;

  if (openingsApplies) {
    return pickFirstSessionEntryObservationPhrase(FIRST_SESSION_ENTRY_OBS_OPENINGS, seed);
  }

  const baselineOk = baseline && baseline.sampleSize >= 2;
  const fragmentationApplies =
    t.fragmentCount >= 3 ||
    (t.fragmentCount >= 2 && t.avgSentenceLength < 12) ||
    (baselineOk &&
      t.fragmentCount >= 2 &&
      t.fragmentCount > baseline.fragmentCount * 1.22);

  if (fragmentationApplies) {
    return pickFirstSessionEntryObservationPhrase(FIRST_SESSION_ENTRY_OBS_FRAGMENTATION, seed);
  }

  const longApplies =
    (baselineOk &&
      t.avgSentenceLength >= 12 &&
      t.avgSentenceLength > baseline.avgSentenceLength * 1.28) ||
    (t.avgSentenceLength >= 20 && t.fragmentCount <= 1);

  if (longApplies) {
    return baselineOk && t.avgSentenceLength > baseline.avgSentenceLength * 1.28
      ? "Sentences are running longer than recent traces."
      : pickFirstSessionEntryObservationPhrase(FIRST_SESSION_ENTRY_OBS_LONG, seed);
  }

  if (ensureBaselineCardNonEmpty) {
    return pickFirstSessionEntryObservationPhrase(FIRST_SESSION_ENTRY_OBS_FALLBACK, seed);
  }
  return "";
}

/** Digests from saved runs (chronological, oldest → newest); pipeline sorts internally. */
function collectMirrorSessionDigestsFromHistory() {
  const rows = readSavedRunsChronological();
  if (!Array.isArray(rows)) return [];
  const out = [];
  for (const entry of rows) {
    const d = entry && entry.mirrorSessionDigest;
    if (d && typeof d === "object" && d.v === 1) {
      out.push(d);
    }
  }
  return out;
}

function countWordsFromTextForUnlock(text) {
  const t = String(text || "").toLowerCase();
  const tokens = t.match(/[a-z][a-z'-]*/g) || [];
  return tokens;
}

function runQualifiesForFirstPatternUnlock(run) {
  const text = String(run?.text || "");
  const tokens = countWordsFromTextForUnlock(text);
  const wordCount = Math.max(0, Number(run?.wordCount ?? run?.words) || tokens.length);
  const alphaChars = (text.match(/[A-Za-z]/g) || []).length;
  const uniqueCount = new Set(tokens).size;
  const uniqueRatio = wordCount > 0 ? uniqueCount / wordCount : 0;
  const sentenceCount = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  const obviousTestLike =
    /\b(asdf|qwerty|lorem ipsum|test run|testing)\b/i.test(text) ||
    (wordCount >= 18 && uniqueCount <= 5) ||
    (wordCount >= 24 && uniqueRatio < 0.2);
  if (obviousTestLike) return false;
  const baselineLength = wordCount >= 24 || alphaChars >= 90;
  const baselineSubstance = uniqueCount >= 8 || sentenceCount >= 2;
  return baselineLength && baselineSubstance;
}

function countQualifyingRunsForFirstPatternUnlock(runs) {
  const list = Array.isArray(runs) ? runs : [];
  return list.reduce((count, run) => count + (runQualifiesForFirstPatternUnlock(run) ? 1 : 0), 0);
}

function computePatternUnlockProgress() {
  const requiredCount = 3;
  const agg = aggregateProfile();
  const runs = readSavedRunsChronological();
  const qualifyingCount = countQualifyingRunsForFirstPatternUnlock(runs);
  return {
    totalSavedRuns: Math.max(0, Number(agg?.totalRuns) || 0),
    totalWords: Math.max(0, Number(agg?.totalWords) || 0),
    qualifyingPatternRunsCount: qualifyingCount,
    requiredCount,
    cappedProgressCount: Math.min(qualifyingCount, requiredCount),
  };
}

function renderProfileHeroSummary(unlockProgress) {
  const hero = $("profileHeroSummary");
  if (!hero) return;
  hero.textContent = "";
}

function deriveCurrentPostSubmitPhase(options = {}) {
  return window.waywordPostSubmitPhase.derivePostSubmitPhase({
    state,
    mirrorLowSignal: Boolean(options.mirrorLowSignal)
  });
}

function postRunMirrorPanelInputs() {
  const phase = deriveCurrentPostSubmitPhase();
  const phaseRenderFlags = window.waywordPostSubmitPhase.postRunRenderFlagsFromPhase(phase);
  return {
    submitted: state.submitted,
    completedUiActive: state.completedUiActive,
    lastMirrorLoadFailed: state.lastMirrorLoadFailed,
    lastMirrorPipelineResult: state.lastMirrorPipelineResult,
    mirrorEmptyFallbackSeed: state.mirrorEmptyFallbackSeed,
    sessionDigestsForTrends: collectMirrorSessionDigestsFromHistory(),
    submittedRunText: getEditorText(),
    promptFamily: state.promptFamily,
    postSubmitPhase: phase,
    firstSessionEntrySubmitShortMirror: Boolean(state.lastSubmitFirstSessionEntryShortMirror),
  };
}

/**
 * Main-line reflection family keys from prior runs (newest first) for mirror recency suppression.
 * The run being submitted is not yet in the saved-run list returned here.
 */
function collectRecentMirrorFamilyKeys(maxRuns) {
  const keys = [];
  if (!Number.isFinite(maxRuns) || maxRuns <= 0) return keys;
  if (
    typeof globalThis.WaywordMirror?.mirrorReflectionFamilyKey !== "function"
  ) {
    return keys;
  }
  const newestFirst = readSavedRunsNewestFirst();
  if (!Array.isArray(newestFirst) || !newestFirst.length) return keys;
  for (let i = 0; i < newestFirst.length && keys.length < maxRuns; i += 1) {
    const run = newestFirst[i];
    const main = run && run.mirrorPipelineResult && run.mirrorPipelineResult.main;
    if (!main || typeof main.statement !== "string") continue;
    try {
      const k = globalThis.WaywordMirror.mirrorReflectionFamilyKey(main);
      if (k) keys.push(k);
    } catch (_) {
      /* ignore */
    }
  }
  return keys;
}

function computeAndStoreMirrorPipelineResult(text, run) {
  const recentKeys = collectRecentMirrorFamilyKeys(4);
  const out = window.waywordMirrorController.computeMirrorPipelineOutcome(
    text,
    run,
    recentKeys,
    completedRuns() < FIRST_SESSION_ENTRY_THRESHOLD
  );
  state.lastMirrorPipelineResult = out.result;
  state.lastMirrorLoadFailed = out.loadFailed;
}

function escapeHtmlMirror(s) {
  return globalThis.WaywordMirrorDom.escapeHtmlMirror(s);
}

function mirrorReflectionCardHtml(card, opts) {
  return globalThis.WaywordMirrorDom.mirrorReflectionCardHtml(card, opts);
}

function buildMirrorPanelBodyHtml(args) {
  return globalThis.WaywordMirrorDom.buildMirrorPanelBodyHtml(args);
}

function countMirrorReflectionCards(result) {
  return globalThis.WaywordMirrorDom.countMirrorReflectionCards(result);
}

/**
 * One-line firstSessionEntry read for #reflection-line / mobile post-run slot.
 * Suppressed when the Mirror block would be visible (including empty-state copy).
 */
function getPostRunReflectionLineText(precomputedParts) {
  if (!state.submitted) {
    return "";
  }
  const parts =
    precomputedParts ||
    window.waywordPostRunRenderer.computeMirrorPostRunPanelParts(postRunMirrorPanelInputs());
  if (state.completedUiActive && Boolean(parts.v1Body || parts.recentBody)) {
    return "";
  }
  return String(state.lastRunFeedback || "").trim();
}

function renderMirrorReflectionPanel(precomputedParts) {
  const section = $("mirrorReflectionSection");
  const root = $("mirrorReflectionRoot");
  if (!section || !root) return;

  const parts =
    precomputedParts ||
    window.waywordPostRunRenderer.computeMirrorPostRunPanelParts(postRunMirrorPanelInputs());
  window.waywordPostRunRenderer.updateMirrorReflectionSection({
    sectionEl: section,
    rootEl: root,
    submitted: state.submitted,
    completedUiActive: state.completedUiActive,
    v1Body: parts.v1Body,
    recentBody: parts.recentBody
  });
  window.waywordPostRunRenderer.updateMirrorNextPassSlot({
    submitted: state.submitted,
    completedUiActive: state.completedUiActive,
    nextPassHtml: parts.nextPassHtml
  });
}

const METRIC_EXPLAINER_COPY = {
  filler: {
    title: "Filler",
    body: "Common words or phrases used unnecessarily.",
    example: 'Example: "like, just, really"'
  },
  repetition: {
    title: "Repetition",
    body: "Words used multiple times in close proximity.",
    example: 'Example: "time, time, time"'
  },
  openings: {
    title: "Openings",
    body: "Repeated ways of starting sentences.",
    example: 'Example: "You… You… You…"'
  }
};

let metricExplainerHideTimer = null;
let metricExplainerAnchorEl = null;
let metricExplainerOpenKey = null;

function hideMetricExplainer() {
  clearTimeout(metricExplainerHideTimer);
  metricExplainerHideTimer = null;
  const pop = $("metricExplainerPopover");
  if (pop) {
    pop.classList.add("hidden");
    pop.style.left = "";
    pop.style.top = "";
    pop.removeAttribute("data-metric-category");
  }
  metricExplainerAnchorEl = null;
  metricExplainerOpenKey = null;
}

function ensureMetricExplainerPopover() {
  let pop = $("metricExplainerPopover");
  if (pop) return pop;
  pop = document.createElement("div");
  pop.id = "metricExplainerPopover";
  pop.className = "metric-explainer hidden";
  pop.setAttribute("role", "tooltip");
  pop.innerHTML = `
    <div class="metric-explainer-title" id="metricExplainerTitle"></div>
    <p class="metric-explainer-body" id="metricExplainerBody"></p>
    <p class="metric-explainer-example" id="metricExplainerExample"></p>
  `;
  document.body.appendChild(pop);
  pop.addEventListener("mouseenter", () => {
    clearTimeout(metricExplainerHideTimer);
    metricExplainerHideTimer = null;
  });
  pop.addEventListener("mouseleave", () => {
    if (!metricExplainerIsCoarsePointer()) {
      metricExplainerHideTimer = setTimeout(hideMetricExplainer, 140);
    }
  });
  return pop;
}

function metricExplainerIsCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function positionMetricExplainer(anchorEl, popEl) {
  const pad = 10;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const ar = anchorEl.getBoundingClientRect();
      const pr = popEl.getBoundingClientRect();
      let left = ar.left + ar.width / 2 - pr.width / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - pr.width - pad));
      let top = ar.bottom + pad;
      if (top + pr.height > window.innerHeight - pad) {
        top = Math.max(pad, ar.top - pr.height - pad);
      }
      popEl.style.position = "fixed";
      popEl.style.left = `${Math.round(left)}px`;
      popEl.style.top = `${Math.round(top)}px`;
    });
  });
}

function showMetricExplainer(key, anchorEl) {
  const copy = METRIC_EXPLAINER_COPY[key];
  if (!copy || !anchorEl) return;
  const drawerVisible = isRecentDrawerOpen();
  const rail = $("recentRailList");
  const railVisible = rail && isDesktopPatternsViewport() && rail.closest(".hidden") === null;
  if (!drawerVisible && !railVisible) return;

  const pop = ensureMetricExplainerPopover();
  const titleEl = $("metricExplainerTitle");
  const bodyEl = $("metricExplainerBody");
  const exampleEl = $("metricExplainerExample");
  if (titleEl) titleEl.textContent = copy.title;
  if (bodyEl) bodyEl.textContent = copy.body;
  if (exampleEl) exampleEl.textContent = copy.example;
  pop.dataset.metricCategory = key;
  pop.classList.remove("hidden");
  positionMetricExplainer(anchorEl, pop);
}

/** `Event.target` may be a Text node; `Element#closest` is undefined there (e.g. Safari on excerpt text). */
function domEventTargetElement(ev) {
  const t = ev.target;
  return t && t.nodeType === 1 ? /** @type {Element} */ (t) : t && t.parentElement;
}

function bindMetricExplainerDelegation(listId = "recentDrawerList") {
  const list = $(listId);
  if (!list || list.dataset.metricExplainerBound === "1") return;
  list.dataset.metricExplainerBound = "1";

  list.addEventListener(
    "pointerdown",
    (e) => {
      const origin = domEventTargetElement(e);
      if (!origin) return;
      const anchor = origin.closest("[data-metric-explainer]");
      if (!anchor || !list.contains(anchor)) return;
      const key = anchor.getAttribute("data-metric-explainer");
      if (!METRIC_EXPLAINER_KEYS.has(key)) return;
      e.stopPropagation();
    },
    true
  );

  list.addEventListener(
    "click",
    (e) => {
      const origin = domEventTargetElement(e);
      if (!origin) return;
      const anchor = origin.closest("[data-metric-explainer]");
      if (!anchor || !list.contains(anchor)) return;
      const key = anchor.getAttribute("data-metric-explainer");
      if (!METRIC_EXPLAINER_KEYS.has(key)) return;
      e.stopPropagation();
      if (!metricExplainerIsCoarsePointer()) return;
      const pop = $("metricExplainerPopover");
      if (
        pop &&
        !pop.classList.contains("hidden") &&
        metricExplainerOpenKey === key &&
        metricExplainerAnchorEl === anchor
      ) {
        hideMetricExplainer();
      } else {
        metricExplainerAnchorEl = anchor;
        metricExplainerOpenKey = key;
        showMetricExplainer(key, anchor);
      }
    },
    true
  );

  list.addEventListener("mouseover", (e) => {
    if (metricExplainerIsCoarsePointer()) return;
    const origin = domEventTargetElement(e);
    if (!origin) return;
    const anchor = origin.closest("[data-metric-explainer]");
    if (!anchor || !list.contains(anchor)) return;
    const key = anchor.getAttribute("data-metric-explainer");
    if (!METRIC_EXPLAINER_KEYS.has(key)) return;
    clearTimeout(metricExplainerHideTimer);
    metricExplainerHideTimer = null;
    metricExplainerAnchorEl = anchor;
    metricExplainerOpenKey = key;
    showMetricExplainer(key, anchor);
  });

  list.addEventListener("mouseout", (e) => {
    if (metricExplainerIsCoarsePointer()) return;
    const origin = domEventTargetElement(e);
    if (!origin) return;
    const anchor = origin.closest("[data-metric-explainer]");
    if (!anchor || !list.contains(anchor)) return;
    const rel = e.relatedTarget;
    const pop = $("metricExplainerPopover");
    if (rel && (anchor.contains(rel) || pop?.contains(rel))) return;
    metricExplainerHideTimer = setTimeout(hideMetricExplainer, 160);
  });

  list.addEventListener("scroll", hideMetricExplainer, { passive: true });

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (metricExplainerIsCoarsePointer()) return;
      const pop = $("metricExplainerPopover");
      if (!pop || pop.classList.contains("hidden")) return;
      if (pop.contains(e.target)) return;
      const origin = domEventTargetElement(e);
      if (origin && origin.closest("[data-metric-explainer]")) return;
      hideMetricExplainer();
    },
    true
  );

  document.addEventListener(
    "click",
    (e) => {
      if (!metricExplainerIsCoarsePointer()) return;
      const pop = $("metricExplainerPopover");
      if (!pop || pop.classList.contains("hidden")) return;
      if (pop.contains(e.target)) return;
      const origin = domEventTargetElement(e);
      const onExplainer = origin && origin.closest("[data-metric-explainer]");
      if (onExplainer && list.contains(onExplainer)) return;
      hideMetricExplainer();
    },
    true
  );

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const pop = $("metricExplainerPopover");
    if (pop && !pop.classList.contains("hidden")) {
      hideMetricExplainer();
      e.preventDefault();
    }
  });
}

function syncWaywordResearchFormLinks() {
  const url = window.waywordConfig && window.waywordConfig.WAYWORD_RESEARCH_FORM_URL;
  if (!url || typeof url !== "string") return;
  document.querySelectorAll('a[data-wayword-research-form="1"]').forEach((a) => {
    a.setAttribute("href", url);
  });
}

function syncClearSavedRunsFooter() {
  const clearWrap = $("profilePatternsClearWrap");
  if (!clearWrap) return;
  const show = completedRuns() > 0;
  clearWrap.classList.toggle("hidden", !show);
  clearWrap.setAttribute("aria-hidden", show ? "false" : "true");
}

function setClearSavedRunsConfirmModalOpen(open) {
  const backdrop = $("clearSavedRunsBackdrop");
  const panel = $("clearSavedRunsPanel");
  if (!backdrop || !panel) return;
  const isOpen = Boolean(open);
  backdrop.classList.toggle("hidden", !isOpen);
  backdrop.setAttribute("aria-hidden", isOpen ? "false" : "true");
  panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
  document.body.classList.toggle("clear-saved-runs-confirm-open", isOpen);
}

function openClearSavedRunsConfirmModal() {
  const n = completedRuns();
  if (n === 0) return;
  const title = $("clearSavedRunsTitle");
  if (title) title.textContent = `Clear ${n} saved runs?`;
  setClearSavedRunsConfirmModalOpen(true);
  $("clearSavedRunsCancelBtn")?.focus();
}

function closeClearSavedRunsConfirmModal() {
  setClearSavedRunsConfirmModalOpen(false);
  const clearWrap = $("profilePatternsClearWrap");
  const clearBtn = $("clearSavedRunsOpenBtn");
  if (clearWrap && !clearWrap.classList.contains("hidden") && clearBtn) {
    clearBtn.focus();
  }
}

function clearAllSavedRunsFromStorageAndState() {
  if (completedRuns() === 0) return;
  resetFirstSessionEntryStateToFreshStart();
  const profileView = $("profileView");
  const patternsNowAvailable = hasProfileSignal();
  const patternsVisible = Boolean(profileView && !profileView.classList.contains("hidden"));
  if (!patternsNowAvailable && patternsVisible) {
    if (isMobileViewport()) {
      settleNonFocusBaselineAfterPatternsClose();
    } else if (profileView) {
      profileView.classList.remove("profile-view--enter-from", "profile-view--recede");
      profileView.classList.add("hidden");
      window.waywordViewController.syncPatternsLayoutMode();
      queueViewportSync();
    }
  }
}

function bindClearSavedRunsPatternsControlsOnce() {
  if (document.documentElement.dataset.clearSavedRunsUiBound === "1") return;
  document.documentElement.dataset.clearSavedRunsUiBound = "1";

  $("clearSavedRunsOpenBtn")?.addEventListener("click", () => openClearSavedRunsConfirmModal());

  $("clearSavedRunsCancelBtn")?.addEventListener("click", () => closeClearSavedRunsConfirmModal());

  $("clearSavedRunsConfirmBtn")?.addEventListener("click", () => {
    clearAllSavedRunsFromStorageAndState();
    setClearSavedRunsConfirmModalOpen(false);
  });

  $("clearSavedRunsBackdrop")?.addEventListener("click", (e) => {
    if (e.target === $("clearSavedRunsBackdrop")) closeClearSavedRunsConfirmModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const backdrop = $("clearSavedRunsBackdrop");
    if (!backdrop || backdrop.classList.contains("hidden")) return;
    e.preventDefault();
    closeClearSavedRunsConfirmModal();
  });
}

/**
 * Review Runs (drawer + rail) — invariants for `renderHistory`:
 * - Drawer (#recentDrawerList) and rail (#recentRailList) must stay in sync on row shape and per-run data.
 * - Preview caps differ: `recentRunsPreviewCapDrawer` vs `recentRunsPreviewCapRail`.
 * - Expanded history (`recentRunsHistoryExpanded`) grows the drawer height (~max 88vh) with a scrolling list.
 * - Empty state rules differ (drawer vs rail visibility).
 * - Drawer open/close, rail expanded chrome, and focus live in `waywordRecentRunsTransition` + `waywordViewController.applyRecentDrawerDomState`.
 * - Row expansion and list click/key wiring live in `waywordRecentRunsInteraction` (loaded before `script.js`).
 * - Row data comes from the canonical run document repo via `readSavedRunsNewestFirst()` (newest first).
 */
function renderHistory() {
  try {
  const drawerList = $("recentDrawerList");
  const railList = $("recentRailList");
  const drawerFooter = $("recentDrawerFooter");
  const railFooter = $("recentRailFooter");
  const trigger = $("recentWritingTrigger");
  const allLists = [drawerList, railList].filter(Boolean);
  allLists.forEach((list) => recentRunsUi.bindRecentRunsSurfaceInteractions(list));

  const runsNewestFirst = readSavedRunsNewestFirst();
  const recentVm = window.waywordRecentRunsViewPrep.prepareRecentRunsViewModel({
    runsNewestFirst,
    historyExpanded: state.recentRunsHistoryExpanded,
    capDrawer: recentRunsPreviewCapDrawer(),
    capRail: recentRunsPreviewCapRail(),
  });

  if (
    window.waywordRecentRunsRenderCoordinator &&
    typeof window.waywordRecentRunsRenderCoordinator.renderRecentRunsSurfaces === "function"
  ) {
    window.waywordRecentRunsRenderCoordinator.renderRecentRunsSurfaces({
      recentVm,
      state,
      allLists,
      drawerList,
      railList,
      drawerFooter,
      railFooter,
      drawerMoreBtn: $("recentDrawerMoreBtn"),
      railMoreBtn: $("recentRailMoreBtn"),
      trigger,
      isRecentDrawerOpen,
      isDesktopPatternsViewport,
      getRecentListEmptyInnerHtml: window.waywordHistoryRenderer.getRecentListEmptyInnerHtml,
      buildRecentEntriesHtml: window.waywordHistoryRenderer.buildRecentEntriesHtml,
      syncRecentDrawerRunsExpandedBodyClass:
        window.waywordRecentRunsTransition.syncRecentDrawerRunsExpandedBodyClass,
      syncRecentRailExpandedChrome,
    });
    return;
  }

  if (recentVm.isEmpty) {
    if (recentVm.clearExpandedHistory) {
      state.recentRunsHistoryExpanded = false;
      window.waywordRecentRunsTransition.syncRecentDrawerRunsExpandedBodyClass(false);
    }
    const drawerOpen = isRecentDrawerOpen();
    allLists.forEach((list) => {
      const isDrawer = list.id === "recentDrawerList";
      list.innerHTML = window.waywordHistoryRenderer.getRecentListEmptyInnerHtml(
        isDrawer,
        drawerOpen,
        isDesktopPatternsViewport()
      );
    });
    [drawerFooter, railFooter].forEach((footer) => {
      if (!footer) return;
      footer.classList.add("hidden");
      footer.setAttribute("aria-hidden", "true");
    });
    if (trigger) {
      trigger.disabled = false;
      trigger.setAttribute("aria-disabled", "false");
    }
    syncRecentRailExpandedChrome();
    return;
  }

  const { totalCount, expanded, drawerRunsExpandedBody, drawerSlice, railSlice, capDrawer, capRail } =
    recentVm;
  if (drawerList) {
    drawerList.innerHTML = window.waywordHistoryRenderer.buildRecentEntriesHtml(drawerSlice, "draw");
    const showDrawerFooter = !expanded && totalCount > capDrawer;
    drawerFooter?.classList.toggle("hidden", !showDrawerFooter);
    drawerFooter?.setAttribute("aria-hidden", showDrawerFooter ? "false" : "true");
  }
  if (railList) {
    railList.innerHTML = window.waywordHistoryRenderer.buildRecentEntriesHtml(railSlice, "rail");
    const showRailFooter = !expanded && totalCount > capRail;
    railFooter?.classList.toggle("hidden", !showRailFooter);
    railFooter?.setAttribute("aria-hidden", showRailFooter ? "false" : "true");
  }
  window.waywordRecentRunsTransition.syncRecentDrawerRunsExpandedBodyClass(drawerRunsExpandedBody);
  const drawerBtn = $("recentDrawerMoreBtn");
  if (drawerBtn) drawerBtn.textContent = expanded ? "Show fewer" : "View older runs";
  const railBtn = $("recentRailMoreBtn");
  if (railBtn) railBtn.textContent = expanded ? "Show fewer" : "View older runs";
  if (trigger) {
    trigger.disabled = false;
    trigger.setAttribute("aria-disabled", "false");
  }
  syncRecentRailExpandedChrome();
  } finally {
    syncClearSavedRunsFooter();
  }
}

function setRecentDrawerOpen(open, options = {}) {
  recentRunsUi.setRecentDrawerOpen(open, options);
}

function aggregateProfile() {
  const runs = readSavedRunsChronological();
  const agg = {
    totalRuns: runs.length,
    totalWords: 0,
    totalUniqueRatio: 0,
    avgSentenceLength: 0,
    repetitionPressure: 0,
    fillerHits: 0,
    wordFreq: {},
    starterFreq: {},
    starterExamples: {},
    punctuation: Object.fromEntries(Object.keys(punctuationMarks).map(k => [k, 0])),
    perspective: { first: 0, second: 0, third: 0 }
  };

  runs.forEach(run => {
    agg.totalWords += run.wordCount ?? run.words ?? 0;
    agg.totalUniqueRatio += run.uniqueRatio || 0;
    agg.avgSentenceLength += run.avgSentenceLength || 0;
    agg.repetitionPressure += run.repeatedCount || 0;
    agg.fillerHits += run.fillerCount || 0;

    Object.entries(run.wordFreq || {}).forEach(([w, c]) => {
      agg.wordFreq[w] = (agg.wordFreq[w] || 0) + c;
    });

    Object.entries(run.starterFreq || {}).forEach(([w, c]) => {
      agg.starterFreq[w] = (agg.starterFreq[w] || 0) + c;
    });

    Object.entries(run.starterExamples || {}).forEach(([w, ex]) => {
      if (!agg.starterExamples[w]) agg.starterExamples[w] = ex;
    });

    Object.entries(run.punctuation || {}).forEach(([k, c]) => {
      agg.punctuation[k] = (agg.punctuation[k] || 0) + c;
    });

    Object.entries(run.perspective || {}).forEach(([k, c]) => {
      agg.perspective[k] = (agg.perspective[k] || 0) + c;
    });
  });

  return agg;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDayKeyLocal(dateObj) {
  return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`;
}

/* season wheel timestamp contract: begin */
function parseRunTimestampMsForSeason(run) {
  const candidates = [
    run?.savedAt,
    run?.timestamp,
    run?.saved_at,
    run?.local_created_at,
    run?.createdAt,
    run?.created_at,
    run?.completedAt,
    run?.date,
    run?.ts,
    run?.meta?.savedAt,
    run?.meta?.saved_at,
    run?.meta?.local_created_at,
    run?.meta?.timestamp,
    run?.meta?.createdAt,
    run?.meta?.created_at,
  ];
  for (const raw of candidates) {
    if (raw == null) continue;
    if (raw instanceof Date && Number.isFinite(raw.getTime())) return raw.getTime();
    if (typeof raw === "number" && Number.isFinite(raw)) {
      if (raw > 1e12) return raw;
      if (raw > 1e9) return raw * 1000;
    }
    if (typeof raw === "string") {
      const asNum = Number(raw);
      if (Number.isFinite(asNum)) {
        if (asNum > 1e12) return asNum;
        if (asNum > 1e9) return asNum * 1000;
      }
      const parsed = Date.parse(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function seasonalRunsLast90DaysFromSavedRuns(runs, options = {}) {
  const all = Array.isArray(runs) ? runs : [];
  const now = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const windowMs = 90 * 24 * 60 * 60 * 1000;
  const start = now - windowMs;
  const seasonal = [];
  for (const run of all) {
    const ms = parseRunTimestampMsForSeason(run);
    if (!Number.isFinite(ms)) continue;
    if (ms < start || ms > now) continue;
    seasonal.push({ run, timestampMs: ms });
  }
  return seasonal;
}

function seasonalRunsForCalendarWindow(savedRuns, seasonCalendar) {
  const all = Array.isArray(savedRuns) ? savedRuns : [];
  const startMs = Number(seasonCalendar?.seasonStartLocal?.getTime?.());
  const endMs = Number(seasonCalendar?.seasonEndLocal?.getTime?.());
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return [];
  const seasonal = [];
  for (const run of all) {
    const ms = parseRunTimestampMsForSeason(run);
    if (!Number.isFinite(ms)) continue;
    if (ms < startMs || ms > endMs) continue;
    seasonal.push({ run, timestampMs: ms });
  }
  return seasonal;
}
/* season wheel timestamp contract: end */

let devSeasonFixtureName = null;

function seasonDayKeysLast90Local() {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const keys = [];
  for (let i = 89; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(toDayKeyLocal(d));
  }
  return keys;
}

function buildFixtureCountMapSparse() {
  return new Map([[4, 1], [19, 1], [37, 2], [58, 1], [82, 1]]);
}

function buildFixtureCountMapModerate() {
  const out = new Map();
  for (let i = 0; i < 90; i += 1) {
    if (i % 4 === 0 || i % 9 === 2) out.set(i, i % 12 === 0 ? 2 : 1);
  }
  out.set(34, 2);
  out.set(35, 2);
  out.set(62, 3);
  return out;
}

function buildFixtureCountMapHeavy() {
  const out = new Map();
  for (let i = 0; i < 90; i += 1) {
    if (i % 5 === 0) continue;
    let count = 1;
    if (i % 7 === 0) count = 2;
    if (i % 13 === 0) count = 3;
    out.set(i, count);
  }
  return out;
}

function buildFixtureCountMapClustered() {
  const out = new Map();
  for (let i = 8; i <= 18; i += 1) out.set(i, i === 13 ? 3 : i % 3 === 0 ? 2 : 1);
  for (let i = 34; i <= 45; i += 1) out.set(i, i === 40 ? 3 : i % 4 === 0 ? 2 : 1);
  for (let i = 62; i <= 72; i += 1) out.set(i, i === 67 ? 3 : i % 3 === 1 ? 2 : 1);
  for (let i = 82; i <= 88; i += 1) out.set(i, i === 85 ? 2 : 1);
  return out;
}

function buildFixtureCountMapSteady() {
  const out = new Map();
  for (let i = 1; i < 90; i += 3) out.set(i, i % 12 === 1 ? 2 : 1);
  return out;
}

function buildFixtureCountMapExtreme() {
  const out = new Map();
  for (let i = 0; i < 90; i += 1) {
    if (i % 17 === 0) {
      out.set(i, 0);
      continue;
    }
    out.set(i, i % 3 === 0 ? 4 : i % 2 === 0 ? 3 : 2);
  }
  return out;
}

function buildFixtureCountMapClustered10Rapid() {
  // One dense same-day cluster to stress aggregation and observability.
  return new Map([[67, 10]]);
}

function fixtureCountMapByName(name) {
  const n = String(name || "").toLowerCase();
  if (n === "sparse") return buildFixtureCountMapSparse();
  if (n === "moderate") return buildFixtureCountMapModerate();
  if (n === "heavy") return buildFixtureCountMapHeavy();
  if (n === "clustered") return buildFixtureCountMapClustered();
  if (n === "steady") return buildFixtureCountMapSteady();
  if (n === "extreme") return buildFixtureCountMapExtreme();
  if (n === "clustered10rapid") return buildFixtureCountMapClustered10Rapid();
  return null;
}

function buildDevSeasonFixtureViewModel(name) {
  const countMap = fixtureCountMapByName(name);
  if (!countMap) return null;
  const dayKeys = seasonDayKeysLast90Local();
  const dayBuckets = new Map();
  const seasonalRows = [];
  let runsCount = 0;
  for (const [index, count] of countMap.entries()) {
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i >= dayKeys.length) continue;
    const c = Math.max(0, Number(count) || 0);
    if (c <= 0) continue;
    dayBuckets.set(dayKeys[i], c);
    runsCount += c;
    const dayDate = new Date(dayKeys[i] + "T12:00:00");
    for (let runIndex = 0; runIndex < c; runIndex += 1) {
      const startMinute =
        name === "clustered10rapid"
          ? (13 * 60 + runIndex) % 1440
          : (runIndex * 210 + i * 17) % 1440;
      const startAt = new Date(dayDate);
      startAt.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
      const durationMinutes = name === "extreme"
        ? Math.max(18, Math.min(240, 70 + ((i * 11 + runIndex * 29) % 150)))
        : Math.max(6, 12 + ((i * 7 + runIndex * 19) % 72));
      const wordCount = name === "extreme"
        ? Math.max(120, 300 + ((i * 53 + runIndex * 97) % 900))
        : Math.max(35, 60 + ((i * 31 + runIndex * 43) % 420));
      const phase = (i + runIndex) % 9;
      const completed = phase <= 5;
      const interrupted = phase === 6 || phase === 7;
      const abandoned = phase === 8;
      seasonalRows.push({
        timestampMs: startAt.getTime(),
        run: {
          startedAt: startAt.toISOString(),
          durationMinutes,
          wordCount,
          completed,
          submitted: completed,
          interrupted,
          abandoned,
        },
      });
    }
  }
  return { dayBuckets, runsCount, seasonalRows };
}

/* season wheel instrument contract: begin */
function seasonWheelResolveStartMinuteLocal(run, fallbackTimestampMs) {
  const candidates = [
    run?.startedAt,
    run?.startAt,
    run?.startTime,
    run?.meta?.startedAt,
    run?.meta?.startAt,
    run?.meta?.startTime,
    fallbackTimestampMs,
  ];
  for (const raw of candidates) {
    if (raw == null) continue;
    let ms = null;
    if (raw instanceof Date && Number.isFinite(raw.getTime())) ms = raw.getTime();
    else if (typeof raw === "number" && Number.isFinite(raw)) {
      ms = raw > 1e12 ? raw : raw > 1e9 ? raw * 1000 : null;
    } else if (typeof raw === "string") {
      const parsedNum = Number(raw);
      if (Number.isFinite(parsedNum)) ms = parsedNum > 1e12 ? parsedNum : parsedNum > 1e9 ? parsedNum * 1000 : null;
      if (ms == null) {
        const parsedDate = Date.parse(raw);
        if (Number.isFinite(parsedDate)) ms = parsedDate;
      }
    }
    if (!Number.isFinite(ms)) continue;
    const d = new Date(ms);
    const minute = d.getHours() * 60 + d.getMinutes();
    if (minute >= 0 && minute <= 1439) return minute;
  }
  return 0;
}

function seasonWheelResolveDurationMinutes(run, wordCount) {
  const timerConfigured = Number(run?.activeTimerSeconds);
  const timerRemaining = Number(run?.timeRemaining);
  if (Number.isFinite(timerConfigured) && timerConfigured > 0) {
    const spent = Number.isFinite(timerRemaining) ? Math.max(0, timerConfigured - Math.max(0, timerRemaining)) : timerConfigured;
    const spentMinutes = spent / 60;
    if (Number.isFinite(spentMinutes) && spentMinutes > 0) {
      return Math.min(360, Math.max(1, Math.round(spentMinutes)));
    }
  }
  const durationCandidates = [
    run?.durationMinutes,
    run?.durationMin,
    run?.minutes,
    run?.durationSeconds != null ? Number(run.durationSeconds) / 60 : null,
    run?.durationSec != null ? Number(run.durationSec) / 60 : null,
    run?.durationMs != null ? Number(run.durationMs) / 60000 : null,
    run?.elapsedMs != null ? Number(run.elapsedMs) / 60000 : null,
    run?.meta?.durationMinutes,
    run?.meta?.durationSeconds != null ? Number(run.meta.durationSeconds) / 60 : null,
  ];
  for (const raw of durationCandidates) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.min(360, Math.max(1, Math.round(n)));
  }
  const fallback = Math.ceil(Math.max(1, Number(wordCount) || 0) / 35);
  return Math.min(180, Math.max(3, fallback));
}

function seasonWheelResolveWordCount(run) {
  const explicit = Math.max(0, Number(run?.wordCount ?? run?.words) || 0);
  if (explicit > 0) return explicit;
  const text = String(run?.text || "");
  const tokens = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(0, tokens);
}

function seasonWheelResolveIntegrity(run, durationMinutes, wordCount) {
  if (run?.abandoned === true || run?.aborted === true) return "abandoned";
  if (run?.interrupted === true) return "interrupted";
  if (run?.completed === true || run?.submitted === true) return "complete";
  if (run?.wasSuccessful === true) return "complete";
  if (run?.finishedWithinTime === true && wordCount >= 35) return "complete";
  if (durationMinutes <= 7 || wordCount <= 25) return "interrupted";
  if (run?.completed === false || run?.submitted === false) return "partial";
  return "partial";
}

const SEASON_WHEEL_CLUSTER_GAP_MINUTES = 5;

function buildSeasonWheelDisplayClusters(segments, options = {}) {
  const clusterGapMinutes = Math.max(1, Number(options.clusterGapMinutes) || SEASON_WHEEL_CLUSTER_GAP_MINUTES);
  const items = Array.isArray(segments) ? segments : [];
  const clusters = [];
  let current = null;
  const closeCurrent = () => {
    if (!current) return;
    const startMinute = current.startMinute;
    const endMinute = Math.max(startMinute + 1, current.endMinute);
    const durationMinutes = Math.max(1, endMinute - startMinute);
    const dominantIntegrity = Object.entries(current.integrityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "partial";
    clusters.push({
      dayIndex: current.dayIndex,
      startMinute,
      durationMinutes,
      wordCount: current.wordCount,
      integrity: dominantIntegrity,
      runCount: current.runCount,
      completeRuns: current.integrityCounts.complete,
      partialRuns: current.integrityCounts.partial,
      interruptedRuns: current.integrityCounts.interrupted,
      abandonedRuns: current.integrityCounts.abandoned,
      firstTimestampMs: current.firstTimestampMs,
      lastTimestampMs: current.lastTimestampMs,
    });
  };
  for (const segment of items) {
    if (!segment || !Number.isFinite(segment.timestampMs)) continue;
    const segDayIndex = Number(segment.dayIndex);
    const segStartMinute = Math.max(0, Math.min(1439, Number(segment.startMinute) || 0));
    const segDuration = Math.max(1, Number(segment.durationMinutes) || 1);
    const segEndMinute = Math.max(segStartMinute + 1, Math.min(1440, segStartMinute + segDuration));
    const segWordCount = Math.max(0, Number(segment.wordCount) || 0);
    const segIntegrity = String(segment.integrity || "partial");
    const startsNewCluster =
      !current ||
      current.dayIndex !== segDayIndex ||
      (segment.timestampMs - current.lastTimestampMs) / 60000 > clusterGapMinutes;
    if (startsNewCluster) {
      closeCurrent();
      current = {
        dayIndex: segDayIndex,
        startMinute: segStartMinute,
        endMinute: segEndMinute,
        wordCount: segWordCount,
        runCount: 1,
        firstTimestampMs: segment.timestampMs,
        lastTimestampMs: segment.timestampMs,
        integrityCounts: {
          complete: segIntegrity === "complete" ? 1 : 0,
          partial: segIntegrity === "partial" ? 1 : 0,
          interrupted: segIntegrity === "interrupted" ? 1 : 0,
          abandoned: segIntegrity === "abandoned" ? 1 : 0,
        },
      };
      continue;
    }
    current.startMinute = Math.min(current.startMinute, segStartMinute);
    current.endMinute = Math.max(current.endMinute, segEndMinute);
    current.wordCount += segWordCount;
    current.runCount += 1;
    current.lastTimestampMs = segment.timestampMs;
    if (segIntegrity === "complete") current.integrityCounts.complete += 1;
    else if (segIntegrity === "partial") current.integrityCounts.partial += 1;
    else if (segIntegrity === "abandoned") current.integrityCounts.abandoned += 1;
    else current.integrityCounts.interrupted += 1;
  }
  closeCurrent();
  return { clusterGapMinutes, clusters };
}

function buildSeasonWheelInstrumentModel(seasonalRows, options = {}) {
  const startOfDayLocal = (dateObj) => {
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const endOfDayLocal = (dateObj) => {
    const d = new Date(dateObj);
    d.setHours(23, 59, 59, 999);
    return d;
  };
  const addDaysLocal = (dateObj, days) => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() + Number(days || 0));
    return d;
  };
  const dayDiffLocal = (laterDate, earlierDate) => {
    const dayMs = 24 * 60 * 60 * 1000;
    const a = startOfDayLocal(laterDate);
    const b = startOfDayLocal(earlierDate);
    const aOrdinal = Math.floor(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) / dayMs);
    const bOrdinal = Math.floor(Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) / dayMs);
    return aOrdinal - bOrdinal;
  };
  const seasonLengthDays = Math.max(1, Number(options.seasonLengthDays) || 90);
  const nowDate = options.nowDate instanceof Date ? new Date(options.nowDate) : new Date();
  const nowMs = nowDate.getTime();
  const seasonStartInput = options.seasonStartDate instanceof Date ? startOfDayLocal(options.seasonStartDate) : null;
  const seasonEndInput = options.seasonEndDate instanceof Date ? endOfDayLocal(options.seasonEndDate) : null;
  const seasonStart = seasonStartInput || startOfDayLocal(addDaysLocal(nowDate, -(seasonLengthDays - 1)));
  const seasonEnd = seasonEndInput || endOfDayLocal(addDaysLocal(seasonStart, seasonLengthDays - 1));

  const rows = Array.isArray(seasonalRows) ? seasonalRows : [];
  const segments = [];
  for (const row of rows) {
    const timestampMs = Number(row?.timestampMs);
    if (!Number.isFinite(timestampMs)) continue;
    if (timestampMs > nowMs) continue;
    if (timestampMs < seasonStart.getTime() || timestampMs > seasonEnd.getTime()) continue;
    const run = row?.run || {};
    const d = new Date(timestampMs);
    const dayIndex = dayDiffLocal(d, seasonStart);
    if (dayIndex < 0 || dayIndex >= seasonLengthDays) continue;
    const wordCount = seasonWheelResolveWordCount(run);
    const startMinute = seasonWheelResolveStartMinuteLocal(run, timestampMs);
    const durationMinutes = seasonWheelResolveDurationMinutes(run, wordCount);
    const integrity = seasonWheelResolveIntegrity(run, durationMinutes, wordCount);
    segments.push({ dayIndex, startMinute, durationMinutes, wordCount, integrity, timestampMs });
  }

  segments.sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
    if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute;
    return a.timestampMs - b.timestampMs;
  });
  const clustered = buildSeasonWheelDisplayClusters(segments, {
    clusterGapMinutes: options.clusterGapMinutes,
  });
  return {
    seasonLengthDays,
    segments,
    clusterGapMinutes: clustered.clusterGapMinutes,
    clusters: clustered.clusters,
  };
}

function seasonWheelHueFromMinute(minute) {
  const m = Math.max(0, Math.min(1439, Number(minute) || 0));
  if (m < 240) return 252;
  if (m < 360) return 272;
  if (m < 540) return 228;
  if (m < 720) return 44;
  if (m < 840) return 54;
  if (m < 1020) return 30;
  if (m < 1200) return 16;
  return 306;
}

function seasonWheelStrokeWidthFromWords(wordCount) {
  const words = Math.max(1, Number(wordCount) || 1);
  const scaled = Math.log10(words);
  if (scaled < 1.45) return 0.7;
  if (scaled < 1.8) return 1.2;
  if (scaled < 2.1) return 1.9;
  if (scaled < 2.4) return 2.9;
  if (scaled < 2.7) return 4.2;
  return 5.8;
}

function seasonWheelStyleFromIntegrity(integrity) {
  if (integrity === "complete") return { opacity: 0.9, dash: "" };
  if (integrity === "partial") return { opacity: 0.56, dash: "" };
  if (integrity === "abandoned") return { opacity: 0.19, dash: "1 3" };
  return { opacity: 0.31, dash: "1 2.2" };
}

function buildSeasonWheelInstrumentSvgMarkup(model) {
  const safeModel = model && typeof model === "object" ? model : {};
  const seasonLengthDays = Math.max(1, Number(safeModel.seasonLengthDays) || 90);
  const segments = Array.isArray(safeModel.segments) ? safeModel.segments : [];

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 86;
  const minuteRadius = 30;
  const dayAngle = (Math.PI * 2) / seasonLengthDays;

  let daySpokes = "";
  const baselineSpokes = Math.max(1, Math.min(3, seasonLengthDays));
  for (let i = 0; i < baselineSpokes; i += 1) {
    const theta = -Math.PI / 2 + i * dayAngle;
    const x = cx + Math.cos(theta) * radius;
    const y = cy + Math.sin(theta) * radius;
    daySpokes += `<line x1="${cx.toFixed(2)}" y1="${cy.toFixed(2)}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="hsl(38 31% 66%)" stroke-opacity="0.09" stroke-width="0.6"/>`;
  }

  let runSegments = "";
  for (const segment of segments) {
    const dayIndex = Math.max(0, Math.min(seasonLengthDays - 1, Number(segment?.dayIndex) || 0));
    const startMinute = Math.max(0, Math.min(1439, Number(segment?.startMinute) || 0));
    const runDuration = Math.max(1, Number(segment?.durationMinutes) || 1);
    const runWordCount = Math.max(1, Number(segment?.wordCount) || 1);

    const theta = -Math.PI / 2 + dayIndex * dayAngle;
    const minuteOffset = ((startMinute / 1440) * 2 - 1) * minuteRadius;
    const segmentCenterRadius = radius + minuteOffset;
    const segmentLength = Math.max(2, Math.min(26, Math.sqrt(runDuration) * 2.8));
    const x1 = cx + Math.cos(theta) * (segmentCenterRadius - segmentLength / 2);
    const y1 = cy + Math.sin(theta) * (segmentCenterRadius - segmentLength / 2);
    const x2 = cx + Math.cos(theta) * (segmentCenterRadius + segmentLength / 2);
    const y2 = cy + Math.sin(theta) * (segmentCenterRadius + segmentLength / 2);

    const hue = seasonWheelHueFromMinute(startMinute);
    const style = seasonWheelStyleFromIntegrity(segment?.integrity);
    const strokeWidth = seasonWheelStrokeWidthFromWords(runWordCount);
    const dash = style.dash ? ` stroke-dasharray="${style.dash}"` : "";

    runSegments += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="hsl(${hue} 67% 58%)" stroke-opacity="${style.opacity}" stroke-width="${strokeWidth.toFixed(2)}" stroke-linecap="round"${dash}/>`;
  }

  return `<svg class="season-wheel__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="hsl(36 42% 77%)" stroke-opacity="0.2" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="${(radius * 0.66).toFixed(2)}" fill="none" stroke="hsl(36 42% 77%)" stroke-opacity="0.2" stroke-width="0.9"/>${daySpokes}${runSegments}</svg>`;
}
/* season wheel instrument contract: end */

function seasonalWordsSaved(seasonalRows) {
  return seasonalRows.reduce((sum, row) => {
    const run = row?.run || {};
    const words = Math.max(0, Number(run.wordCount ?? run.words) || 0);
    return sum + words;
  }, 0);
}

function selectSeasonalQuietLine(runsCount, activeDays) {
  if (runsCount <= 2 || activeDays <= 2) return "A season is beginning to take shape.";
  if (activeDays >= 18) return "Several active days are now visible in this season.";
  if (activeDays >= 10) return "A steadier seasonal trace is forming.";
  return "This season is still sparse, but gathering.";
}

/* season wheel calendar contract: begin */
function localStartOfDay(dateObj) {
  const d = new Date(dateObj);
  d.setHours(0, 0, 0, 0);
  return d;
}

function localEndOfDay(dateObj) {
  const d = new Date(dateObj);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addLocalDays(dateObj, days) {
  const d = new Date(dateObj);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

function differenceInLocalCalendarDays(laterDate, earlierDate) {
  const dayMs = 24 * 60 * 60 * 1000;
  const a = localStartOfDay(laterDate);
  const b = localStartOfDay(earlierDate);
  const aOrdinal = Math.floor(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) / dayMs);
  const bOrdinal = Math.floor(Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) / dayMs);
  return aOrdinal - bOrdinal;
}

function inclusiveLocalCalendarDayCount(startDate, endDate) {
  return Math.max(1, differenceInLocalCalendarDays(endDate, startDate) + 1);
}

function buildCurrentSeasonCalendar(dateObj = new Date()) {
  const d = new Date(dateObj);
  const y = d.getFullYear();
  const value = (d.getMonth() + 1) * 100 + d.getDate();
  let seasonLabel = "SPRING";
  let seasonStartLocal = localStartOfDay(new Date(y, 2, 20));
  let seasonEndLocal = localEndOfDay(new Date(y, 5, 20));

  if (value >= 321 && value <= 620) {
    seasonLabel = "SPRING";
    seasonStartLocal = localStartOfDay(new Date(y, 2, 20));
    seasonEndLocal = localEndOfDay(new Date(y, 5, 20));
  } else if (value >= 621 && value <= 922) {
    seasonLabel = "SUMMER";
    seasonStartLocal = localStartOfDay(new Date(y, 5, 21));
    seasonEndLocal = localEndOfDay(new Date(y, 8, 22));
  } else if (value >= 923 && value <= 1220) {
    seasonLabel = "AUTUMN";
    seasonStartLocal = localStartOfDay(new Date(y, 8, 23));
    seasonEndLocal = localEndOfDay(new Date(y, 11, 20));
  } else if (value >= 1221) {
    seasonLabel = "WINTER";
    seasonStartLocal = localStartOfDay(new Date(y, 11, 21));
    seasonEndLocal = localEndOfDay(new Date(y + 1, 2, 19));
  } else {
    seasonLabel = "WINTER";
    seasonStartLocal = localStartOfDay(new Date(y - 1, 11, 21));
    seasonEndLocal = localEndOfDay(new Date(y, 2, 19));
  }

  const spokeCount = inclusiveLocalCalendarDayCount(seasonStartLocal, seasonEndLocal);
  return {
    seasonLabel,
    seasonStartLocal,
    seasonEndLocal,
    spokeCount,
  };
}

function currentMeteorologicalSeasonLabel(dateObj = new Date()) {
  return buildCurrentSeasonCalendar(dateObj).seasonLabel;
}

function currentMeteorologicalSeasonLengthDays(dateObj = new Date()) {
  return buildCurrentSeasonCalendar(dateObj).spokeCount;
}

function currentMeteorologicalSeasonStart(dateObj = new Date()) {
  return buildCurrentSeasonCalendar(dateObj).seasonStartLocal;
}
/* season wheel calendar contract: end */

function formatShortMonthDay(dateObj) {
  return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildSeasonWheelSingleSpokeDebugSvg(options = {}) {
  const size = 2200;
  const cx = 1100;
  const cy = 1100;
  const canonScaffold = options.scaffoldPreset === "canon";
  const innerR = canonScaffold ? 18 : 122;
  const outerR = 900;
  const radialSpan = outerR - innerR;
  const seasonCalendar = options.seasonCalendar && typeof options.seasonCalendar === "object" ? options.seasonCalendar : null;
  const seasonDays = Math.max(
    1,
    Number(options.seasonDays) || Number(seasonCalendar?.spokeCount) || (canonScaffold ? 93 : 93)
  );
  const dayIndex = Number.isInteger(options.dayIndex) ? options.dayIndex : 42;
  const startMinute = Math.max(0, Math.min(1439, Number(options.startMinute) || 1080));
  const durationMinutes = Math.max(1, Math.min(360, Number(options.durationMinutes) || 120));
  const endMinute = Math.max(startMinute + 1, Math.min(1440, startMinute + durationMinutes));
  const wordCount = Math.max(1, Number(options.wordCount) || 520);
  const integrity = options.integrity || "complete";
  const seasonLabel = String(options.seasonLabel || "SPRING").toUpperCase();
  const isDesktop = Boolean(options.isDesktop);
  const highlightDay = options.highlightDay !== false;
  const seasonStartDate = options.seasonStartDate instanceof Date
    ? localStartOfDay(options.seasonStartDate)
    : (seasonCalendar?.seasonStartLocal instanceof Date ? localStartOfDay(seasonCalendar.seasonStartLocal) : null);
  const seasonEndDate = options.seasonEndDate instanceof Date
    ? localEndOfDay(options.seasonEndDate)
    : (seasonCalendar?.seasonEndLocal instanceof Date ? localEndOfDay(seasonCalendar.seasonEndLocal) : null);

  const polar = (r, angleDeg) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const minuteToRadius = (minute) => innerR + (minute / 1440) * radialSpan;

  let spokes = "";
  for (let d = 0; d < seasonDays; d += 1) {
    const angle = (d / seasonDays) * 360;
    const [x1, y1] = polar(innerR, angle);
    const [x2, y2] = polar(outerR, angle);
    const isActiveSpoke = highlightDay && d === dayIndex;
    if (canonScaffold) {
      spokes += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="var(--sw-spoke, #d9c5a4)" stroke-opacity="0.25" stroke-width="1.05"/>`;
    } else {
      spokes += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${isActiveSpoke ? "var(--sw-spoke-active, #d8cdbf)" : "var(--sw-spoke, #d8cdbf)"}" stroke-opacity="${isActiveSpoke ? 0.52 : 0.2}" stroke-width="${isActiveSpoke ? 1.5 : 1.05}"/>`;
    }
  }

  // Canon-like outer perimeter ticks: tangent-oriented dashes outside the season ring,
  // with a clear minor/major cadence.
  let outerTicks = "";
  for (let d = 0; d < seasonDays; d += 1) {
    // Canon-like sparse rhythm: minor every 6 spokes, major every 12.
    if (d % 6 !== 0) continue;
    const angle = (d / seasonDays) * 360;
    const isMajor = d % 12 === 0;
    const tickLen = isMajor ? 34 : 13;
    const tickW = isMajor ? 3.8 : 2.0;
    const tickCenterR = outerR + (isMajor ? 33 : 23);
    const [tx, ty] = polar(tickCenterR, angle);
    const tickColor = isMajor ? "var(--sw-major-tick, #f0c47b)" : "var(--sw-minor-tick, #e8d2ad)";
    const tickOpacity = isMajor ? 0.54 : 0.27;
    // Tangent alignment (angle + 90) better matches canon perimeter tick posture.
    outerTicks += `<rect x="${(tx - tickW * 0.5).toFixed(2)}" y="${(ty - tickLen * 0.5).toFixed(2)}" width="${tickW.toFixed(2)}" height="${tickLen.toFixed(2)}" rx="${(tickW * 0.5).toFixed(2)}" ry="${(tickW * 0.5).toFixed(2)}" fill="${tickColor}" fill-opacity="${tickOpacity}" transform="rotate(${(angle + 90).toFixed(4)} ${tx.toFixed(2)} ${ty.toFixed(2)})"/>`;
  }

  let fourHourRings = "";
  if (canonScaffold) {
    fourHourRings = `
      <circle cx="${cx}" cy="${cy}" r="251.67" fill="none" stroke="var(--sw-grid-minor, #e8d2ad)" stroke-opacity="0.33" stroke-width="1.45" stroke-dasharray="2 8"/>
      <circle cx="${cx}" cy="${cy}" r="381.33" fill="none" stroke="var(--sw-grid-major, #f0c47b)" stroke-opacity="0.44" stroke-width="1.7" stroke-dasharray="3 9"/>
      <circle cx="${cx}" cy="${cy}" r="511.00" fill="none" stroke="var(--sw-grid-minor, #e8d2ad)" stroke-opacity="0.33" stroke-width="1.45" stroke-dasharray="2 8"/>
      <circle cx="${cx}" cy="${cy}" r="640.67" fill="none" stroke="var(--sw-grid-major, #f0c47b)" stroke-opacity="0.44" stroke-width="1.7" stroke-dasharray="3 9"/>
      <circle cx="${cx}" cy="${cy}" r="770.33" fill="none" stroke="var(--sw-grid-minor, #e8d2ad)" stroke-opacity="0.33" stroke-width="1.45" stroke-dasharray="2 8"/>
    `;
  } else {
    for (let hours = 4; hours <= 24; hours += 4) {
      const r = minuteToRadius(hours * 60);
      const isMajor = hours % 8 === 0;
      fourHourRings += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(2)}" fill="none" stroke="${isMajor ? "var(--sw-grid-major, #f0c47b)" : "var(--sw-grid-minor, #e8d2ad)"}" stroke-opacity="${isMajor ? 0.44 : 0.3}" stroke-width="${isMajor ? 1.4 : 1.1}" stroke-dasharray="${isMajor ? "3 8" : "2 8"}"/>`;
    }
  }

  const canonRuns = [
    { startMinute: 180, durationMinutes: 62, wordCount: 420, integrity: "complete" },   // 03:00 pre-dawn
    { startMinute: 435, durationMinutes: 38, wordCount: 210, integrity: "partial" },    // 07:15 dawn/morning
    { startMinute: 710, durationMinutes: 22, wordCount: 110, integrity: "interrupted" },// 11:50 midday short
    { startMinute: 915, durationMinutes: 96, wordCount: 760, integrity: "complete" },    // 15:15 afternoon long
    { startMinute: 1120, durationMinutes: 54, wordCount: 520, integrity: "complete" },   // 18:40 evening
    { startMinute: 1365, durationMinutes: 14, wordCount: 72, integrity: "abandoned" },   // 22:45 night faint
  ];
  const userRun = {
    startMinute,
    durationMinutes,
    wordCount,
    integrity,
  };
  const runs = Array.isArray(options.runs) && options.runs.length ? options.runs : [...canonRuns, userRun];
  const normalizedRuns = runs
    .map((run) => {
      const runDayIndex = Number.isInteger(run.dayIndex) ? run.dayIndex : dayIndex;
      const runStart = Math.max(0, Math.min(1439, Number(run.startMinute) || 0));
      const runDuration = Math.max(1, Math.min(360, Number(run.durationMinutes) || 1));
      const runEnd = Math.max(runStart + 1, Math.min(1440, runStart + runDuration));
      return {
        ...run,
        dayIndex: runDayIndex,
        startMinute: runStart,
        durationMinutes: runDuration,
        endMinute: runEnd,
      };
    })
    .sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute;
      return (Number(b.wordCount) || 0) - (Number(a.wordCount) || 0);
    });

  // For same-day clustered runs, preserve temporal order while adding a tiny
  // outward separation so consecutive runs read as cumulative habitation.
  const runLayout = [];
  let activeDay = -1;
  let prevEndForDay = -1;
  for (const run of normalizedRuns) {
    if (run.dayIndex !== activeDay) {
      activeDay = run.dayIndex;
      prevEndForDay = -1;
    }
    const minGap = 3;
    let layoutStart = run.startMinute;
    let layoutEnd = run.endMinute;
    if (prevEndForDay >= 0 && layoutStart < prevEndForDay + minGap) {
      const shift = (prevEndForDay + minGap) - layoutStart;
      layoutStart = Math.min(1439, layoutStart + shift);
      layoutEnd = Math.min(1440, layoutEnd + shift);
      if (layoutEnd <= layoutStart) layoutEnd = Math.min(1440, layoutStart + 1);
    }
    prevEndForDay = Math.max(prevEndForDay, layoutEnd);
    runLayout.push({ ...run, layoutStart, layoutEnd });
  }
  const runCount = runLayout.reduce((sum, r) => sum + Math.max(1, Number(r.runCount) || 1), 0);
  const completedCount = runLayout.reduce((sum, r) => sum + Math.max(0, Number(r.completeRuns) || ((r.integrity || "partial") === "complete" ? Number(r.runCount) || 1 : 0)), 0);
  const totalWords = runLayout.reduce((sum, r) => sum + Math.max(0, Number(r.wordCount) || 0), 0);
  const activeDaysCount = new Set(runLayout.map((r) => Number.isInteger(r.dayIndex) ? r.dayIndex : dayIndex)).size;
  const completePct = runCount ? Math.round((completedCount / runCount) * 100) : 0;
  const activePct = seasonDays ? Math.round((activeDaysCount / seasonDays) * 100) : 0;

  let runSegmentsGlow = "";
  let runSegmentsCore = "";
  let runSegmentsAccent = "";
  let runBloom = "";
  let runHitTargets = "";
  let runOrdinal = 0;
  for (const run of runLayout) {
    const runDayIndex = Number.isInteger(run.dayIndex) ? run.dayIndex : dayIndex;
    const runAngle = (runDayIndex / seasonDays) * 360;
    const runStart = Math.max(0, Math.min(1439, Number(run.layoutStart) || Number(run.startMinute) || 0));
    const runDuration = Math.max(1, Math.min(360, Number(run.durationMinutes) || 1));
    const runEnd = Math.max(runStart + 1, Math.min(1440, Number(run.layoutEnd) || (runStart + runDuration)));
    const runWords = Math.max(1, Number(run.wordCount) || 1);
    const runIntegrity = run.integrity || "partial";
    const runCountChunk = Math.max(1, Math.min(16, Math.round(Number(run.runCount) || (runWords >= 260 ? (runWords / 90) : 1))));
    let completeRuns = Math.max(0, Number(run.completeRuns) || 0);
    let partialRuns = Math.max(0, Number(run.partialRuns) || 0);
    let interruptedRuns = Math.max(0, Number(run.interruptedRuns) || 0);
    let abandonedRuns = Math.max(0, Number(run.abandonedRuns) || 0);
    if (completeRuns + partialRuns + interruptedRuns + abandonedRuns <= 0) {
      if (runIntegrity === "complete") completeRuns = runCountChunk;
      else if (runIntegrity === "partial") {
        completeRuns = Math.max(0, runCountChunk - 1);
        partialRuns = 1;
      } else if (runIntegrity === "abandoned") {
        abandonedRuns = Math.max(1, Math.ceil(runCountChunk * 0.5));
        partialRuns = Math.max(0, runCountChunk - abandonedRuns);
      } else {
        interruptedRuns = Math.max(1, Math.ceil(runCountChunk * 0.5));
        partialRuns = Math.max(0, runCountChunk - interruptedRuns);
      }
    }
    const mixTotal = completeRuns + partialRuns + interruptedRuns + abandonedRuns;
    if (mixTotal !== runCountChunk) {
      const delta = runCountChunk - mixTotal;
      completeRuns = Math.max(0, completeRuns + delta);
    }
    const r0 = minuteToRadius(runStart);
    const r1 = minuteToRadius(runEnd);
    const [sx, sy] = polar(r0, runAngle);
    const [ex, ey] = polar(r1, runAngle);
    const hue = seasonWheelHueFromMinute(runStart);
    const style = seasonWheelStyleFromIntegrity(runIntegrity);
    const coreWidth = seasonWheelStrokeWidthFromWords(runWords) * 2.15;
    const glowWidth = coreWidth + 5.8;
    const accentWidth = Math.max(1.6, coreWidth * 0.52);
    const light = runIntegrity === "complete" ? 62 : runIntegrity === "partial" ? 66 : 72;
    const runLen = Math.max(8, Math.hypot(ex - sx, ey - sy));
    const runMidR = (r0 + r1) * 0.5;
    const capsuleColor = `hsl(${hue} 88% ${light}%)`;
    const coreOpacity = runIntegrity === "complete" ? 0.98 : runIntegrity === "partial" ? 0.72 : style.opacity;
    const glowOpacity = runIntegrity === "abandoned" || runIntegrity === "interrupted" ? 0.14 : 0.21;
    const accentColor = `hsl(${hue} 88% ${Math.max(56, light - 6)}%)`;

    const addLineStack = (xA, yA, xB, yB, dashed = false) => {
      const dashAttr = dashed ? ` stroke-dasharray="5 5"` : "";
      runSegmentsGlow += `<line x1="${xA.toFixed(2)}" y1="${yA.toFixed(2)}" x2="${xB.toFixed(2)}" y2="${yB.toFixed(2)}" stroke="${capsuleColor}" stroke-opacity="${glowOpacity.toFixed(3)}" stroke-width="${glowWidth.toFixed(2)}" stroke-linecap="round"${dashAttr} filter="url(#runGlow)"/>`;
      runSegmentsCore += `<line x1="${xA.toFixed(2)}" y1="${yA.toFixed(2)}" x2="${xB.toFixed(2)}" y2="${yB.toFixed(2)}" stroke="${capsuleColor}" stroke-opacity="${coreOpacity.toFixed(3)}" stroke-width="${coreWidth.toFixed(2)}" stroke-linecap="round"${dashed ? ` stroke-dasharray="5 5"` : ""}/>`;
      if (!dashed && (runIntegrity === "complete" || runIntegrity === "partial")) {
        runSegmentsAccent += `<line x1="${xA.toFixed(2)}" y1="${yA.toFixed(2)}" x2="${xB.toFixed(2)}" y2="${yB.toFixed(2)}" stroke="${accentColor}" stroke-opacity="0.34" stroke-width="${accentWidth.toFixed(2)}" stroke-linecap="round"/>`;
      }
    };

    if (runIntegrity === "complete" || runIntegrity === "partial") {
      const [bx, by] = polar(runMidR, runAngle);
      const bloomR = Math.max(9.6, coreWidth * 1.08);
      runBloom += `<circle cx="${bx.toFixed(2)}" cy="${by.toFixed(2)}" r="${bloomR.toFixed(2)}" fill="${capsuleColor}" opacity=".04" filter="url(#softBloom)"/>`;
    }

    runOrdinal += 1;
    const runDate = seasonStartDate
      ? (() => {
          const d = new Date(seasonStartDate);
          d.setDate(d.getDate() + runDayIndex);
          return d;
        })()
      : null;
    const dateLabel = runDate
      ? runDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : `Day ${runDayIndex + 1}`;
    const hour24 = Math.floor(runStart / 60);
    const minute = runStart % 60;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    const timeLabel = `${hour12}:${String(minute).padStart(2, "0")} ${ampm}`;
    const radiusRatio = runStart / 1440;
    runHitTargets += `<line x1="${sx.toFixed(2)}" y1="${sy.toFixed(2)}" x2="${ex.toFixed(2)}" y2="${ey.toFixed(2)}" stroke="transparent" stroke-opacity="0" stroke-width="${Math.max(26, coreWidth + 10).toFixed(2)}" stroke-linecap="round" class="sw-run-hit" data-run-id="${runOrdinal}" data-day-index="${runDayIndex}" data-date-label="${dateLabel}" data-start-minute="${runStart}" data-duration-minutes="${runDuration}" data-word-count="${runWords}" data-integrity="${runIntegrity}" data-time-label="${timeLabel}" data-run-count="${runCountChunk}" data-complete-runs="${completeRuns}" data-partial-runs="${partialRuns}" data-interrupted-runs="${interruptedRuns}" data-abandoned-runs="${abandonedRuns}" data-radius-ratio="${radiusRatio.toFixed(6)}"/>`;

    addLineStack(sx, sy, ex, ey, Boolean(style.dash));
  }

  const integrityLabel = String(integrity || "partial").toUpperCase();
  const hh = String(Math.floor(startMinute / 60)).padStart(2, "0");
  const mm = String(startMinute % 60).padStart(2, "0");
  const medallionInfo = isDesktop
    ? `<text x="${cx}" y="${cy - 22}" text-anchor="middle" font-size="14" letter-spacing="3.2" fill="var(--sw-medallion-sub, #bda889)" font-family="Georgia, 'Times New Roman', serif">CURRENT SEASON</text>
       <text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="28" letter-spacing="2.4" fill="var(--sw-medallion-label, #d6c8b2)" font-family="Georgia, 'Times New Roman', serif">${seasonLabel}</text>
       <text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="11" letter-spacing="1.9" fill="var(--sw-medallion-sub, #bda889)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${hh}:${mm}  +${durationMinutes}M  ${wordCount}W  ${integrityLabel}</text>`
    : ``;

  const mobileHeader = !isDesktop
    ? `<text x="186" y="152" text-anchor="start" font-size="29" letter-spacing="7.4" fill="var(--sw-medallion-sub, #bda889)" font-family="Georgia, 'Times New Roman', serif">CURRENT SEASON</text>
       <text x="186" y="238" text-anchor="start" font-size="92" letter-spacing="2.8" fill="var(--sw-medallion-label, #d6c8b2)" font-family="Georgia, 'Times New Roman', serif">${seasonLabel}</text>`
    : ``;
  let mobileQuadrantLabels = ``;
  if (!isDesktop && seasonStartDate) {
    const labelRadius = outerR + 114;
    const quarterIndex = (fraction) =>
      Math.max(0, Math.min(seasonDays - 1, Math.round((seasonDays - 1) * fraction)));
    const anchors = [
      { key: "north", angle: 0, dayIndex: 0 },
      { key: "east", angle: 90, dayIndex: quarterIndex(0.25) },
      { key: "south", angle: 180, dayIndex: quarterIndex(0.5) },
      { key: "west", angle: 270, dayIndex: quarterIndex(0.75) },
    ];
    mobileQuadrantLabels = anchors
      .map((anchor) => {
        const dateObj = addLocalDays(seasonStartDate, anchor.dayIndex);
        const [lx, ly] = polar(labelRadius, anchor.angle);
        return `<text x="${lx.toFixed(2)}" y="${(ly + 8).toFixed(2)}" text-anchor="middle" font-size="23" letter-spacing="1.7" fill="var(--sw-medallion-label, #d6c8b2)" font-family="Georgia, 'Times New Roman', serif" data-label-anchor="${anchor.key}" data-label-day-index="${anchor.dayIndex}" data-label-date="${toDayKeyLocal(dateObj)}">${formatShortMonthDay(dateObj)}</text>`;
      })
      .join("");
  }

  const avgRunsPerActiveDay = activeDaysCount > 0 ? (runCount / activeDaysCount) : 0;

  return `<svg class="current-season-canon-tile__image season-wheel-debug-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2200 2200" role="img" aria-label="Season wheel debug single-spoke" data-season-days="${seasonDays}" data-days-written="${activeDaysCount}" data-total-runs="${runCount}" data-completed-runs="${completedCount}" data-completed-pct="${completePct}" data-total-words="${totalWords}" data-avg-runs-day="${avgRunsPerActiveDay.toFixed(1)}" data-season-start-local="${seasonStartDate ? seasonStartDate.toISOString() : ""}" data-season-end-local="${seasonEndDate ? seasonEndDate.toISOString() : ""}">
  <defs>
    <filter id="runGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softBloom" x="-120%" y="-120%" width="340%" height="340%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="2200" height="2200" fill="var(--sw-bg, #08090d)"/>
  <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="var(--sw-season-ring, #e4ac5f)" stroke-opacity="${canonScaffold ? 0.58 : 0.56}" stroke-width="2"/>
  ${fourHourRings}
  ${spokes}
  ${outerTicks}
  ${runBloom}
  ${runSegmentsGlow}
  ${runSegmentsCore}
  ${runSegmentsAccent}
  <g class="sw-hit-layer">${runHitTargets}</g>
  <circle cx="${cx}" cy="${cy}" r="${innerR - 34}" fill="var(--sw-bg, #08090d)" stroke="var(--sw-hub-ring, #c9a173)" stroke-opacity="0.4" stroke-width="1.2"/>
  ${mobileHeader}
  ${mobileQuadrantLabels}
  ${medallionInfo}
  </svg>`;
}

function buildSeasonWheelPairSpokeDebugSvg(options = {}) {
  const dayIndex = Number.isInteger(options.dayIndex) ? options.dayIndex : 42;
  const seasonDays = Math.max(1, Number(options.seasonDays) || 92);
  const seasonLabel = String(options.seasonLabel || "SPRING").toUpperCase();
  const isDesktop = Boolean(options.isDesktop);
  const dayA = [
    { startMinute: 210, durationMinutes: 55, wordCount: 380, integrity: "complete" },
    { startMinute: 890, durationMinutes: 70, wordCount: 640, integrity: "complete" },
    { startMinute: 1330, durationMinutes: 18, wordCount: 90, integrity: "abandoned" },
  ];
  const dayB = [
    { startMinute: 460, durationMinutes: 38, wordCount: 190, integrity: "partial" },
    { startMinute: 1010, durationMinutes: 110, wordCount: 840, integrity: "complete" },
    { startMinute: 1210, durationMinutes: 11, wordCount: 42, integrity: "interrupted" },
  ];
  return buildSeasonWheelSingleSpokeDebugSvg({
    dayIndex,
    seasonDays,
    seasonLabel,
    isDesktop,
    runs: dayA.concat(dayB.map((r) => ({ ...r, dayIndex: dayIndex + 1 }))),
    pairMode: true,
    pairDayIndex: dayIndex + 1,
  });
}

function buildSeasonWheelFullRingDebugSvg(options = {}) {
  const seasonDays = Math.max(1, Number(options.seasonDays) || 91);
  const seasonLabel = String(options.seasonLabel || "SPRING").toUpperCase();
  const isDesktop = Boolean(options.isDesktop);
  const seasonStartDate = options.seasonStartDate instanceof Date ? options.seasonStartDate : null;
  const runs = [];
  const hash01 = (a, b) => {
    const x = Math.sin((a + 1) * 12.9898 + (b + 1) * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  const buildBurst = (dayIndex, startMinute, runBand, avgWordsBand, integrity) => {
    const runsInBurst = Math.max(1, Math.min(6, Math.round(1 + hash01(dayIndex, runBand) * 3.8)));
    const wordsPerRun = Math.round(28 + hash01(dayIndex, avgWordsBand) * 68);
    const totalWordsBurst = Math.round(wordsPerRun * runsInBurst);
    const avgMinutesPerRun = 1.5 + hash01(dayIndex, avgWordsBand + 100) * 3.7;
    const durationMinutes = Math.max(2, Math.min(46, Math.round(runsInBurst * avgMinutesPerRun + Math.max(0, runsInBurst - 1) * 1.1)));
    let completeRuns = 0;
    let partialRuns = 0;
    let interruptedRuns = 0;
    let abandonedRuns = 0;
    if (integrity === "complete") {
      completeRuns = Math.max(1, runsInBurst - (hash01(dayIndex, runBand + 200) > 0.82 ? 1 : 0));
      partialRuns = runsInBurst - completeRuns;
    } else if (integrity === "partial") {
      completeRuns = Math.max(0, Math.floor(runsInBurst * 0.45));
      partialRuns = Math.max(1, runsInBurst - completeRuns);
    } else if (integrity === "abandoned") {
      abandonedRuns = Math.max(1, Math.ceil(runsInBurst * 0.55));
      partialRuns = Math.max(0, runsInBurst - abandonedRuns);
    } else {
      interruptedRuns = Math.max(1, Math.ceil(runsInBurst * 0.5));
      partialRuns = Math.max(0, runsInBurst - interruptedRuns);
    }
    return {
      dayIndex,
      startMinute,
      durationMinutes,
      runCount: runsInBurst,
      wordCount: totalWordsBurst,
      completeRuns,
      partialRuns,
      interruptedRuns,
      abandonedRuns,
      integrity,
    };
  };

  for (let dayIndex = 0; dayIndex < seasonDays; dayIndex += 1) {
    // Preserve occasional silent spokes so interruption remains visible.
    if (hash01(dayIndex, 99) < 0.12) continue;

    const phase = dayIndex / seasonDays;
    const hasPreDawn = hash01(dayIndex, 1) > 0.34;
    const hasMorning = hash01(dayIndex, 2) > 0.29;
    const hasAfternoon = hash01(dayIndex, 3) > 0.12;
    const hasEvening = hash01(dayIndex, 4) > 0.22;
    const hasNight = hash01(dayIndex, 5) > 0.53;

    if (hasPreDawn) {
      const jitter = hash01(dayIndex, 11);
      runs.push(buildBurst(dayIndex, Math.round(145 + jitter * 145), 12, 13, hash01(dayIndex, 14) > 0.86 ? "partial" : "complete"));
    }

    if (hasMorning) {
      const jitter = hash01(dayIndex, 21);
      runs.push(buildBurst(dayIndex, Math.round(360 + jitter * 210), 22, 23, hash01(dayIndex, 24) > 0.79 ? "interrupted" : "partial"));
    }

    if (hasAfternoon) {
      const jitter = hash01(dayIndex, 31);
      runs.push(buildBurst(dayIndex, Math.round(780 + jitter * 330), 32, 33, "complete"));
    }

    if (hasEvening) {
      const jitter = hash01(dayIndex, 41);
      runs.push(buildBurst(dayIndex, Math.round(1020 + jitter * 250), 42, 43, phase > 0.7 && hash01(dayIndex, 44) > 0.72 ? "partial" : "complete"));
    }

    if (hasNight) {
      const jitter = hash01(dayIndex, 51);
      runs.push(buildBurst(dayIndex, Math.round(1275 + jitter * 155), 52, 53, hash01(dayIndex, 54) > 0.58 ? "abandoned" : "interrupted"));
    }
  }

  return buildSeasonWheelSingleSpokeDebugSvg({
    dayIndex: Math.floor(seasonDays * 0.48),
    seasonDays,
    seasonLabel,
    isDesktop,
    seasonStartDate,
    highlightDay: false,
    scaffoldPreset: "canon",
    runs,
  });
}

function buildSeasonWheelFullRingFromSeasonalRows(seasonalRows, options = {}) {
  const seasonCalendar = options.seasonCalendar && typeof options.seasonCalendar === "object"
    ? options.seasonCalendar
    : buildCurrentSeasonCalendar(new Date());
  const seasonDays = Math.max(1, Number(options.seasonDays) || Number(seasonCalendar.spokeCount) || 1);
  const seasonLabel = String(options.seasonLabel || seasonCalendar.seasonLabel || currentMeteorologicalSeasonLabel(new Date())).toUpperCase();
  const isDesktop = Boolean(options.isDesktop);
  const seasonStartDate = options.seasonStartDate instanceof Date
    ? localStartOfDay(options.seasonStartDate)
    : localStartOfDay(seasonCalendar.seasonStartLocal || currentMeteorologicalSeasonStart(new Date()));
  const seasonEndDate = options.seasonEndDate instanceof Date
    ? localEndOfDay(options.seasonEndDate)
    : localEndOfDay(seasonCalendar.seasonEndLocal || addLocalDays(seasonStartDate, seasonDays - 1));
  const model = buildSeasonWheelInstrumentModel(Array.isArray(seasonalRows) ? seasonalRows : [], {
    seasonLengthDays: seasonDays,
    nowDate: new Date(),
    seasonStartDate,
    seasonEndDate,
  });
  const runs = (Array.isArray(model?.clusters) ? model.clusters : []).map((seg) => {
    const integrity = String(seg.integrity || "partial");
    const runCount = Math.max(1, Number(seg.runCount) || 1);
    return {
      dayIndex: seg.dayIndex,
      startMinute: seg.startMinute,
      durationMinutes: seg.durationMinutes,
      wordCount: seg.wordCount,
      integrity,
      runCount,
      completeRuns: Math.max(0, Number(seg.completeRuns) || 0),
      partialRuns: Math.max(0, Number(seg.partialRuns) || 0),
      interruptedRuns: Math.max(0, Number(seg.interruptedRuns) || 0),
      abandonedRuns: Math.max(0, Number(seg.abandonedRuns) || 0),
    };
  });
  return buildSeasonWheelSingleSpokeDebugSvg({
    dayIndex: Math.floor(seasonDays * 0.5),
    seasonDays,
    seasonLabel,
    isDesktop,
    seasonStartDate,
    seasonEndDate,
    seasonCalendar: {
      seasonLabel,
      seasonStartLocal: seasonStartDate,
      seasonEndLocal: seasonEndDate,
      spokeCount: seasonDays,
    },
    highlightDay: false,
    scaffoldPreset: "canon",
    runs,
  });
}

let canonSeasonWheelSvgCache = null;

async function loadCanonSeasonWheelSvgText() {
  if (canonSeasonWheelSvgCache) return canonSeasonWheelSvgCache;
  const res = await fetch("assets/wayword_season_wheel_v15_subtext_removed.svg", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load canon SVG: ${res.status}`);
  const raw = await res.text();
  const cleaned = raw
    .replace(/<\?xml[^>]*>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .trim();
  canonSeasonWheelSvgCache = cleaned;
  return canonSeasonWheelSvgCache;
}

function initSeasonWheelZoom(root) {
  const tile = root.querySelector(".current-season-canon-tile");
  if (!tile || tile.dataset.zoomReady === "true") return;
  const graphic = tile.querySelector(".season-wheel-debug-svg, .current-season-canon-tile__image");
  if (!(graphic instanceof Element)) return;

  const viewport = document.createElement("div");
  viewport.className = "season-wheel-zoom-viewport";
  const content = document.createElement("div");
  content.className = "season-wheel-zoom-content";

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "season-wheel-zoom-reset";
  resetBtn.setAttribute("aria-label", "Reset season wheel view");
  resetBtn.title = "Reset view";
  resetBtn.innerHTML = "&#8634;";

  tile.insertBefore(viewport, tile.firstChild);
  viewport.appendChild(content);
  content.appendChild(graphic);
  tile.appendChild(resetBtn);

  const pointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let pinchAnchor = null;
  let panStartX = 0;
  let panStartY = 0;
  let panStartVx = 0;
  let panStartVy = 0;
  let isPanning = false;

  const minScale = 1;
  const maxScale = 8;
  let scale = 1;

  const isSvgGraphic = graphic instanceof SVGSVGElement;
  const baseViewBox = (() => {
    if (!isSvgGraphic) return null;
    const raw = graphic.getAttribute("viewBox");
    if (raw) {
      const nums = raw.trim().split(/\s+/).map(Number);
      if (nums.length === 4 && nums.every(Number.isFinite) && nums[2] > 0 && nums[3] > 0) {
        return { x: nums[0], y: nums[1], w: nums[2], h: nums[3] };
      }
    }
    const w = Number(graphic.getAttribute("width")) || 100;
    const h = Number(graphic.getAttribute("height")) || 100;
    return { x: 0, y: 0, w, h };
  })();
  let vx = baseViewBox ? baseViewBox.x : 0;
  let vy = baseViewBox ? baseViewBox.y : 0;
  let vw = baseViewBox ? baseViewBox.w : 0;
  let vh = baseViewBox ? baseViewBox.h : 0;
  let tx = 0;
  let ty = 0;

  const getViewportRect = () => viewport.getBoundingClientRect();
  const clampViewBox = () => {
    if (!baseViewBox) return;
    const maxX = baseViewBox.x + baseViewBox.w - vw;
    const maxY = baseViewBox.y + baseViewBox.h - vh;
    vx = Math.min(maxX, Math.max(baseViewBox.x, vx));
    vy = Math.min(maxY, Math.max(baseViewBox.y, vy));
  };
  const applyViewBox = () => {
    if (!isSvgGraphic || !baseViewBox) return;
    clampViewBox();
    graphic.setAttribute("viewBox", `${vx} ${vy} ${vw} ${vh}`);
    resetBtn.classList.toggle("is-active", scale > 1.001);
  };
  const applyFallbackTransform = () => {
    const rect = getViewportRect();
    const maxX = ((scale - 1) * rect.width) / 2;
    const maxY = ((scale - 1) * rect.height) / 2;
    tx = Math.min(maxX, Math.max(-maxX, tx));
    ty = Math.min(maxY, Math.max(-maxY, ty));
    content.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    resetBtn.classList.toggle("is-active", scale > 1.001 || Math.abs(tx) > 0.2 || Math.abs(ty) > 0.2);
  };
  const apply = () => {
    if (isSvgGraphic) applyViewBox();
    else applyFallbackTransform();
  };
  const clientToSvg = (clientX, clientY) => {
    const rect = getViewportRect();
    const nx = (clientX - rect.left) / Math.max(1, rect.width);
    const ny = (clientY - rect.top) / Math.max(1, rect.height);
    return {
      x: vx + nx * vw,
      y: vy + ny * vh,
    };
  };

  // Prefer native SVG viewBox zoom for crisp vector fidelity; fallback transform only for non-SVG content.
  const zoomAtClientPoint = (nextScale, clientX, clientY) => {
    const safeScale = Math.min(maxScale, Math.max(minScale, nextScale));
    if (Math.abs(safeScale - scale) < 0.0001) return;
    if (isSvgGraphic && baseViewBox) {
      const p = clientToSvg(clientX, clientY);
      const nextW = baseViewBox.w / safeScale;
      const nextH = baseViewBox.h / safeScale;
      const rect = getViewportRect();
      const nx = (clientX - rect.left) / Math.max(1, rect.width);
      const ny = (clientY - rect.top) / Math.max(1, rect.height);
      vx = p.x - nx * nextW;
      vy = p.y - ny * nextH;
      vw = nextW;
      vh = nextH;
      scale = safeScale;
      applyViewBox();
      return;
    }
    const deltaScale = safeScale / scale;
    const rect = getViewportRect();
    const px = clientX - rect.left - rect.width / 2;
    const py = clientY - rect.top - rect.height / 2;
    tx = px - (px - tx) * deltaScale;
    ty = py - (py - ty) * deltaScale;
    scale = safeScale;
    applyFallbackTransform();
  };

  const resetView = () => {
    scale = 1;
    if (isSvgGraphic && baseViewBox) {
      vx = baseViewBox.x;
      vy = baseViewBox.y;
      vw = baseViewBox.w;
      vh = baseViewBox.h;
    } else {
      tx = 0;
      ty = 0;
    }
    apply();
  };

  resetBtn.addEventListener("click", resetView);
  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    const delta = -event.deltaY;
    const zoomFactor = Math.exp(delta * 0.0016);
    zoomAtClientPoint(scale * zoomFactor, event.clientX, event.clientY);
  }, { passive: false });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      pinchStartDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartScale = scale;
      pinchAnchor = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      isPanning = false;
    } else if (scale > 1.001 && pointers.size === 1) {
      isPanning = true;
      panStartX = event.clientX;
      panStartY = event.clientY;
      panStartVx = vx;
      panStartVy = vy;
      viewport.setPointerCapture?.(event.pointerId);
    }
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinchStartDistance > 0 && pinchAnchor) {
      const pts = [...pointers.values()];
      const nextDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (nextDistance > 0) {
        zoomAtClientPoint(pinchStartScale * (nextDistance / pinchStartDistance), pinchAnchor.x, pinchAnchor.y);
      }
      return;
    }
    if (!isPanning || pointers.size !== 1) return;
    if (isSvgGraphic && baseViewBox) {
      const rect = getViewportRect();
      const dxPx = event.clientX - panStartX;
      const dyPx = event.clientY - panStartY;
      vx = panStartVx - (dxPx / Math.max(1, rect.width)) * vw;
      vy = panStartVy - (dyPx / Math.max(1, rect.height)) * vh;
      applyViewBox();
      return;
    }
    tx += event.movementX;
    ty += event.movementY;
    applyFallbackTransform();
  });

  const finishPointer = (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) {
      pinchStartDistance = 0;
      pinchAnchor = null;
    }
    if (pointers.size === 0) {
      isPanning = false;
    } else if (pointers.size === 1 && scale > 1.001) {
      const [pt] = [...pointers.values()];
      panStartX = pt.x;
      panStartY = pt.y;
      panStartVx = vx;
      panStartVy = vy;
      isPanning = true;
    }
  };

  viewport.addEventListener("pointerup", finishPointer);
  viewport.addEventListener("pointercancel", finishPointer);
  viewport.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") finishPointer(event);
  });
  window.addEventListener("resize", apply);
  tile.dataset.zoomReady = "true";
  apply();
}

function renderCurrentSeasonPanel() {
  const root = $("currentSeasonRoot");
  const wrap = $("currentSeasonPanel");
  if (!root || !wrap) return;
  let debugMode = "";
  const nowDate = new Date();
  const seasonCalendarNow = buildCurrentSeasonCalendar(nowDate);
  const seasonLengthDays = seasonCalendarNow.spokeCount;
  const seasonLabelNow = seasonCalendarNow.seasonLabel;
  const seasonStartNow = seasonCalendarNow.seasonStartLocal;
  const seasonEndNow = seasonCalendarNow.seasonEndLocal;
  const isDesktop = isDesktopPatternsViewport();
  let seasonWheelRows = [];
  if (devSeasonFixtureName) {
    const fixtureVm = buildDevSeasonFixtureViewModel(devSeasonFixtureName);
    seasonWheelRows = Array.isArray(fixtureVm?.seasonalRows) ? fixtureVm.seasonalRows : [];
  } else {
    seasonWheelRows = seasonalRunsForCalendarWindow(readSavedRunsChronological(), seasonCalendarNow);
  }
  try {
    if (WAYWORD_DEV_FIRST_SESSION_ENTRY_RESET_ENABLED) {
      const params = new URLSearchParams(location.search);
      debugMode = String(params.get("seasonWheelDebug") || "").toLowerCase();
    }
  } catch (_) {
    debugMode = "";
  }
  root.innerHTML = `
    <div class="current-season-canon-tile">
      ${
        debugMode === "single"
          ? buildSeasonWheelSingleSpokeDebugSvg({
              dayIndex: 42,
              startMinute: 1080,
              durationMinutes: 120,
              wordCount: 520,
              integrity: "complete",
              seasonLabel: seasonLabelNow,
              seasonDays: seasonLengthDays,
              seasonStartDate: seasonStartNow,
              seasonEndDate: seasonEndNow,
              seasonCalendar: seasonCalendarNow,
              isDesktop,
            })
          : debugMode === "pair"
            ? buildSeasonWheelPairSpokeDebugSvg({
                dayIndex: 42,
                seasonDays: seasonLengthDays,
                seasonLabel: seasonLabelNow,
                isDesktop,
              })
            : debugMode === "canonexact"
              ? `<div id="seasonWheelCanonExactMount" class="current-season-canon-exact-mount" aria-label="Canon exact season wheel"></div>`
            : buildSeasonWheelFullRingFromSeasonalRows(seasonWheelRows, {
                seasonDays: seasonLengthDays,
                seasonLabel: seasonLabelNow,
                seasonStartDate: seasonStartNow,
                seasonEndDate: seasonEndNow,
                seasonCalendar: seasonCalendarNow,
                isDesktop,
              })
      }
    </div>
    <div id="seasonWheelMobileLegend"></div>
  `;
  if (!isDesktop && (debugMode === "single" || debugMode === "pair" || debugMode === "full" || !debugMode)) {
    const svg = root.querySelector(".season-wheel-debug-svg");
    const legendRoot = root.querySelector("#seasonWheelMobileLegend");
    if (svg && legendRoot) {
      const seasonDays = Number(svg.getAttribute("data-season-days") || 0);
      const daysWritten = Number(svg.getAttribute("data-days-written") || 0);
      const totalRuns = Number(svg.getAttribute("data-total-runs") || 0);
      const completedRuns = Number(svg.getAttribute("data-completed-runs") || 0);
      const completedPct = Number(svg.getAttribute("data-completed-pct") || 0);
      const totalWords = Number(svg.getAttribute("data-total-words") || 0);
      const avgRunsDay = Number(svg.getAttribute("data-avg-runs-day") || 0);
      legendRoot.innerHTML = `<div class="season-wheel-mobile-legend" aria-label="Season summary">
        <div><span>Season Length</span><strong>${seasonDays} days</strong></div>
        <div><span>Days Written</span><strong>${daysWritten}</strong></div>
        <div><span>Total Runs</span><strong>${totalRuns}</strong></div>
        <div><span>Completed</span><strong>${completedRuns} (${completedPct}%)</strong></div>
        <div><span>Total Words</span><strong>${totalWords.toLocaleString()}</strong></div>
        <div><span>Avg Runs / Day</span><strong>${avgRunsDay}</strong></div>
      </div>`;
    }
  }
  if (debugMode === "canonexact") {
    const mount = root.querySelector("#seasonWheelCanonExactMount");
    if (mount) {
      loadCanonSeasonWheelSvgText()
        .then((svgText) => {
          mount.innerHTML = svgText;
          const inlineSvg = mount.querySelector("svg");
          if (inlineSvg) inlineSvg.classList.add("current-season-canon-tile__image");
          initSeasonWheelZoom(root);
        })
        .catch(() => {
          mount.innerHTML = `<img class="current-season-canon-tile__image" src="assets/wayword_season_wheel_v15_subtext_removed.svg" alt="Canon season wheel"/>`;
          initSeasonWheelZoom(root);
        });
    }
  }
  initSeasonWheelZoom(root);
  if (debugMode === "single" || debugMode === "pair" || debugMode === "full" || !debugMode) {
    initSeasonWheelDebugInspector(root);
  }
  wrap.classList.remove("hidden");
  wrap.setAttribute("aria-hidden", "false");
}

/* season wheel tooltip placement contract: begin */
function placeTooltipWithinBounds(anchorRect, tooltipRect, containerRect, options = {}) {
  const gap = Math.max(0, Number(options.gap) || 10);
  const inset = Math.max(0, Number(options.inset) || 10);
  const anchorCenterX = anchorRect.left + anchorRect.width / 2;

  let left = anchorCenterX - tooltipRect.width / 2;
  const minLeft = containerRect.left + inset;
  const maxLeft = containerRect.right - inset - tooltipRect.width;
  left = Math.min(maxLeft, Math.max(minLeft, left));

  let top = anchorRect.bottom + gap;
  const maxTop = containerRect.bottom - inset - tooltipRect.height;
  if (top > maxTop) {
    top = anchorRect.top - tooltipRect.height - gap;
  }
  const minTop = containerRect.top + inset;
  top = Math.min(maxTop, Math.max(minTop, top));

  return {
    left: Math.round(left),
    top: Math.round(top),
  };
}
/* season wheel tooltip placement contract: end */

function initSeasonWheelDebugInspector(root) {
  const tile = root.querySelector(".current-season-canon-tile");
  const svg = tile?.querySelector(".season-wheel-debug-svg");
  if (!tile || !svg) return;
  let tip = tile.querySelector(".season-wheel-run-tooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "season-wheel-run-tooltip";
    tip.setAttribute("aria-hidden", "true");
    tile.appendChild(tip);
  }
  let isPinned = false;
  const placeTipForAnchor = (anchorEl) => {
    const anchorRect = anchorEl.getBoundingClientRect();
    const containerRect = tile.getBoundingClientRect();
    const tooltipRect = tip.getBoundingClientRect();
    const pos = placeTooltipWithinBounds(anchorRect, tooltipRect, containerRect, { gap: 10, inset: 10 });
    tip.style.left = `${pos.left - containerRect.left}px`;
    tip.style.top = `${pos.top - containerRect.top}px`;
  };
  const renderTip = (el) => {
    const dateLabel = el.getAttribute("data-date-label") || "";
    const runWords = Number(el.getAttribute("data-word-count") || 0);
    const runMinutes = Number(el.getAttribute("data-duration-minutes") || 0);
    const runCount = Math.max(1, Number(el.getAttribute("data-run-count") || 1));
    const completeRuns = Math.max(0, Number(el.getAttribute("data-complete-runs") || 0));
    const partialRuns = Math.max(0, Number(el.getAttribute("data-partial-runs") || 0));
    const interruptedRuns = Math.max(0, Number(el.getAttribute("data-interrupted-runs") || 0));
    const abandonedRuns = Math.max(0, Number(el.getAttribute("data-abandoned-runs") || 0));
    const timeLabel = el.getAttribute("data-time-label") || "";
    let mixLabel = "";
    if (completeRuns === runCount) mixLabel = "all complete";
    else if (partialRuns === runCount) mixLabel = "all partial";
    else if (interruptedRuns === runCount) mixLabel = "all interrupted";
    else if (abandonedRuns === runCount) mixLabel = "all abandoned";
    else {
      const mix = [];
      if (completeRuns > 0) mix.push(`${completeRuns} complete`);
      if (partialRuns > 0) mix.push(`${partialRuns} partial`);
      if (interruptedRuns > 0) mix.push(`${interruptedRuns} interrupted`);
      if (abandonedRuns > 0) mix.push(`${abandonedRuns} abandoned`);
      mixLabel = mix.join(" · ");
    }
    tip.innerHTML = `<div class="season-wheel-run-tooltip__date">${dateLabel}</div>
      <div class="season-wheel-run-tooltip__rule" aria-hidden="true"></div>
      <div>${runCount} run${runCount === 1 ? "" : "s"}</div>
      <div>${runWords} words</div>
      <div>${runMinutes} min</div>
      <div>${mixLabel}</div>
      <div>${timeLabel}</div>`;
    tip.classList.add("is-visible");
    tip.setAttribute("aria-hidden", "false");
  };
  const hideTip = () => {
    isPinned = false;
    tip.classList.remove("is-visible");
    tip.setAttribute("aria-hidden", "true");
  };
  svg.querySelectorAll(".sw-run-hit").forEach((el) => {
    if (!el.hasAttribute("tabindex")) {
      el.setAttribute("tabindex", "0");
    }
    el.addEventListener("mouseenter", (event) => {
      if (isPinned) return;
      renderTip(el);
      placeTipForAnchor(el);
    });
    el.addEventListener("mouseleave", () => {
      if (!isPinned) hideTip();
    });
    el.addEventListener("click", (event) => {
      renderTip(el);
      placeTipForAnchor(el);
      isPinned = true;
    });
    el.addEventListener("touchstart", (event) => {
      renderTip(el);
      placeTipForAnchor(el);
      isPinned = true;
    }, { passive: true });
    el.addEventListener("focus", () => {
      renderTip(el);
      placeTipForAnchor(el);
    });
    el.addEventListener("blur", () => {
      if (!isPinned) hideTip();
    });
    el.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideTip();
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        renderTip(el);
        placeTipForAnchor(el);
        isPinned = true;
      }
    });
  });
  tile.addEventListener("mouseleave", () => {
    if (!isPinned) hideTip();
  });
  tile.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".sw-run-hit")) return;
    if (target.closest(".season-wheel-run-tooltip")) return;
    hideTip();
  });
}

function renderProfileLocked() {
  try {
    const unlockProgress = computePatternUnlockProgress();
    const lockedHtml = window.waywordPatternsRenderer.buildProfileLockedPanelInnerHtml(unlockProgress);

    /* Locked state belongs in hero copy only; repeated-words card is unlocked-only (same HTML in both caused duplicate blocks). */
    const calloutsEl = $("patternCallouts");
    if (calloutsEl) calloutsEl.innerHTML = lockedHtml;

    const challengeRoot = $("patternsRepeatedChallengeRoot");
    if (challengeRoot) challengeRoot.innerHTML = "";

    const patternsUtilityWrap = document.querySelector("#profileView .profile-patterns-utility");
    if (patternsUtilityWrap) {
      patternsUtilityWrap.classList.add("hidden");
      patternsUtilityWrap.setAttribute("aria-hidden", "true");
    }
    const seasonWrap = $("currentSeasonPanel");
    const seasonRoot = $("currentSeasonRoot");
    if (seasonRoot) seasonRoot.innerHTML = "";
    if (seasonWrap) {
      seasonWrap.classList.add("hidden");
      seasonWrap.setAttribute("aria-hidden", "true");
    }

    renderProfileHeroSummary(unlockProgress);
  } finally {
    syncClearSavedRunsFooter();
  }
}

/** Suggested challenge target from repeated-word tallies only (existing ≥4 + not completed rule). */
function buildRepeatedWordChallengeSuggestion(topWords) {
  const list = Array.isArray(topWords) ? topWords : [];
  const first = list[0];
  if (
    first &&
    waywordPatternsRepeatLexemeChallengeworthy(first[0], first[1]) &&
    !state.completedChallenges.has(first[0])
  ) {
    return first[0];
  }
  return "";
}

function shouldHideRunsWordsStrip() {
  /* Hide Runs/Words strip for the whole first-session entry window. */
  if (completedRuns() < FIRST_SESSION_ENTRY_THRESHOLD) return true;
  /* Main writing column: strip is desktop-only (matches @media min-width 981px layout). */
  if (!isDesktopPatternsViewport()) return true;
  if (document.body.classList.contains("focus-mode")) return true;
  return false;
}

function renderProfileSummaryStrip() {
  const el = $("profileSummary");
  if (!el) return;

  const section = $("profileSummarySection");
  const runs = completedRuns();

  if (!runs) {
    section?.classList.add("hidden");
    el.textContent = "";
    return;
  }

  const agg = aggregateProfile();
  el.textContent = `Runs ${agg.totalRuns} · Words ${agg.totalWords}`;

  if (shouldHideRunsWordsStrip()) {
    section?.classList.add("hidden");
    return;
  }

  section?.classList.remove("hidden");
}

function renderProfile() {
  try {
  if (!hasProfileSignal()) {
    renderProfileLocked();
    return;
  }

  const patternsUtilityWrap = document.querySelector("#profileView .profile-patterns-utility");
  if (patternsUtilityWrap) {
    patternsUtilityWrap.classList.remove("hidden");
    patternsUtilityWrap.setAttribute("aria-hidden", "false");
  }
  renderCurrentSeasonPanel();

  const agg = aggregateProfile();
  const runs = Math.max(agg.totalRuns, 1);
  const avgUniqueRatio = agg.totalUniqueRatio / runs;
  const avgFiller = agg.fillerHits / runs;

  renderProfileHeroSummary(computePatternUnlockProgress());

  const topWords = Object.entries(agg.wordFreq)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .filter(([w]) => waywordPatternsRepeatLexemeOk(w))
    .slice(0, 8);

  const topStarters = Object.entries(agg.starterFreq)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const topRepeatedWords = topWords.map(([word]) => word);
  const topRepeatedWordsSet = new Set(topRepeatedWords);
  const selectedChallengeWords = state.patternSelectedWords.filter((word) => topRepeatedWordsSet.has(word));
  if (selectedChallengeWords.length !== state.patternSelectedWords.length) {
    setPatternSelectedWords(selectedChallengeWords);
  }
  const selectedChallengeSet = new Set(selectedChallengeWords);
  const draftChallengeWords = selectedChallengeWords;
  const patternsExerciseWords = draftChallengeWords;

  const patternsUtilityRoot = $("patternsRepeatedChallengeRoot");
  if (patternsUtilityRoot) {
    patternsUtilityRoot.innerHTML = window.waywordPatternsRenderer.buildPatternsRepeatedChallengeRootInnerHtml({
      topWords,
      selectedChallengeSet,
      draftChallengeWords,
    });

    patternsUtilityRoot.querySelectorAll("[data-challenge-word]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const word = normalizeWord(btn.getAttribute("data-challenge-word") || "");
        if (!word) return;
        const nextWords = state.patternSelectedWords.includes(word)
          ? state.patternSelectedWords.filter((w) => w !== word)
          : [...state.patternSelectedWords, word];
        setPatternSelectedWords(nextWords);
        renderProfile();
      });
    });
    const startBtn = $("startExerciseBtn");
    if (startBtn) startBtn.addEventListener("click", () => startExerciseRun(patternsExerciseWords));
  }

  if ($("patternCallouts")) {
    if (window.waywordMirrorController.mirrorPatternsProfileAvailable()) {
      const patternsMirrorHero = window.waywordPatternsRenderer.buildPatternsMirrorHeroHtml(
        collectMirrorSessionDigestsFromHistory(),
        computePatternUnlockProgress()
      );
      $("patternCallouts").innerHTML =
        patternsMirrorHero != null
          ? patternsMirrorHero
          : window.waywordPatternsRenderer.patternsMirrorHeroEmptyHtml();
    } else {
      const calloutsWithStarters = window.waywordPatternsRenderer.buildPatternCallouts(
        agg,
        avgUniqueRatio,
        avgFiller,
        topWords,
        topStarters,
        state.completedChallenges
      );
      $("patternCallouts").innerHTML =
        window.waywordPatternsRenderer.buildPatternCalloutsLegacySectionHtml(calloutsWithStarters);
    }
  }
  } finally {
    syncClearSavedRunsFooter();
  }
}

/* -----------------------------
   actions
----------------------------- */

function cycleRepeatLimit() {
  if (
    window.waywordWritingRepeatLimitCoordinator &&
    typeof window.waywordWritingRepeatLimitCoordinator.cycleRepeatLimit === "function"
  ) {
    return window.waywordWritingRepeatLimitCoordinator.cycleRepeatLimit({
      state,
      applyWriteDocSemanticFlagsFromAnalysis,
      scheduleEditorDotOverlaySync,
      renderAnnotationRow,
      renderMeta,
      renderHighlight,
      renderSidebar
    });
  }

  const next = state.repeatLimit >= 4 ? 1 : state.repeatLimit + 1;
  state.repeatLimit = next;
  if (state.active && !state.submitted) {
    applyWriteDocSemanticFlagsFromAnalysis();
    scheduleEditorDotOverlaySync();
    renderAnnotationRow();
  }
  renderMeta();
  renderHighlight();
  renderSidebar();
}

function saveBannedInline() {
  if (
    window.waywordInlineBannedEditorSaveCoordinator &&
    typeof window.waywordInlineBannedEditorSaveCoordinator.saveBannedInline === "function"
  ) {
    return window.waywordInlineBannedEditorSaveCoordinator.saveBannedInline({
      $,
      state,
      normalizeWord,
      setBannedEditorOpen,
      applyWriteDocSemanticFlagsFromAnalysis,
      scheduleEditorDotOverlaySync,
      renderAnnotationRow,
      renderMeta,
      renderHighlight,
      renderSidebar
    });
  }

  const input = $("bannedInlineInput");
  if (!input) return;

  state.banned = input.value
    .split(",")
    .map(normalizeWord)
    .filter(Boolean);

  setBannedEditorOpen(false);
  if (state.active && !state.submitted) {
    applyWriteDocSemanticFlagsFromAnalysis();
    scheduleEditorDotOverlaySync();
    renderAnnotationRow();
  }
  renderMeta();
  renderHighlight();
  renderSidebar();
}

function triggerShuffle() {
  if (
    window.waywordWritingShuffleCoordinator &&
    typeof window.waywordWritingShuffleCoordinator.triggerShuffle === "function"
  ) {
    return window.waywordWritingShuffleCoordinator.triggerShuffle({
      $,
      document,
      state,
      shuffleTargetWords: SHUFFLE_TARGET_WORDS,
      shuffleTimerSeconds: SHUFFLE_TIMER_SECONDS,
      bannedSets,
      stopTimer,
      setActiveModeButton,
      renderMeta,
      renderHighlight,
      renderSidebar,
      renderWritingState
    });
  }

  state.targetWords =
    SHUFFLE_TARGET_WORDS[Math.floor(Math.random() * SHUFFLE_TARGET_WORDS.length)];
  state.timerSeconds =
    SHUFFLE_TIMER_SECONDS[Math.floor(Math.random() * SHUFFLE_TIMER_SECONDS.length)];
  state.banned = [...bannedSets[Math.floor(Math.random() * bannedSets.length)]];

  stopTimer();
  state.timeRemaining = 0;
  state.timerWaitingForFirstInput = Boolean(state.timerSeconds);
  setActiveModeButton("wordModesPanel", "words", state.targetWords);
  setActiveModeButton("timeModesPanel", "time", state.timerSeconds);
  setActiveModeButton("wordModes", "words", state.targetWords);
  setActiveModeButton("timeModes", "time", state.timerSeconds);
  const panelInput = $("bannedInlineInputPanel");
  if (panelInput && document.activeElement !== panelInput) {
    panelInput.value = state.banned.join(", ");
  }
  renderMeta();
  renderHighlight();
  renderSidebar();
  renderWritingState();
}

function startExerciseRun(wordsOrWord) {
  if (
    window.waywordWritingExerciseStartCoordinator &&
    typeof window.waywordWritingExerciseStartCoordinator.startExerciseRun === "function"
  ) {
    return window.waywordWritingExerciseStartCoordinator.startExerciseRun(
      {
        normalizeExerciseWords,
        setExerciseWords,
        startWriting,
        renderMeta,
        renderHighlight,
        renderSidebar
      },
      wordsOrWord
    );
  }

  const words = Array.isArray(wordsOrWord)
    ? wordsOrWord
    : [wordsOrWord];
  const normalizedWords = normalizeExerciseWords(words);
  if (!normalizedWords.length) return;
  setExerciseWords(normalizedWords);
  startWriting({ preserveActiveChallenge: true });
  renderMeta();
  renderHighlight();
  renderSidebar();
}

function clearExerciseIfCompleted(text) {
  if (
    window.waywordWritingExerciseCompletionCoordinator &&
    typeof window.waywordWritingExerciseCompletionCoordinator.clearExerciseIfCompleted === "function"
  ) {
    return window.waywordWritingExerciseCompletionCoordinator.clearExerciseIfCompleted(
      {
        state,
        tokenize,
        storage: window.waywordStorage,
        setExerciseWords
      },
      text
    );
  }

  if (!state.exerciseWords.length) return;

  const tokens = tokenize(text);
  if (state.exerciseWords.some((word) => tokens.includes(word))) return;
  state.exerciseWords.forEach((word) => state.completedChallenges.add(word));
  window.waywordStorage.saveCompletedChallengesFromSet(state.completedChallenges);

  setExerciseWords([]);
}

function startWriting(options = {}) {
  return window.waywordRunController.startWriting(options);
}

function finalizeTimedRunExpiredWithNoText() {
  return window.waywordRunController.finalizeTimedRunExpiredWithNoText();
}

function submitWriting(fromTimer = false) {
  return window.waywordRunController.submitWriting(fromTimer);
}

function restartRunWithCurrentSettings(options = {}) {
  return window.waywordRunController.restartRunWithCurrentSettings(options);
}

function runPostSubmitAutoNewRunNow() {
  return window.waywordRunController.runPostSubmitAutoNewRunNow();
}

function buildRunControllerRegistrationInput() {
  return {
    state,
    $,
    editorInput,
    getEditorSurfaceComposing() {
      return editorSurfaceComposing;
    },
    flushEditorSurfaceIntoWriteDocOnce,
    captureEditorSurfaceIntoWriteDocForSubmit,
    getEditorText,
    analyze,
    getRecentEntries,
    makeRunId,
    persist,
    INACTIVITY_EASE_RUN_KEY,
    clearExerciseIfCompleted,
    applyWriteDocSemanticFlagsFromAnalysisCore,
    updateEnterButtonVisibility,
    stopTimer,
    completeWordmark,
    getActiveTargetWordsForScoring,
    computeRunScoreV1,
    computeAndStoreMirrorPipelineResult,
    recomputeProgressionLevel,
    applyProgressionToState,
    renderHistory,
    renderProfileSummaryStrip,
    renderProfile,
    renderHighlight,
    renderWritingState,
    renderMeta,
    renderSidebar,
    resetEntryDelayHint,
    beginEntryDelayHintWatch,
    queueViewportSync,
    setExerciseWords,
    generatePrompt,
    setEditorText,
    setBannedEditorOpen,
    setOptionsOpen,
    showProfile,
    scheduleDeferredEditorFocus,
    scheduleEditorDotOverlaySync,
    syncEditorBottomChromeForFirstSessionEntryOverlay,
    focusEditorToStart,
    updateTimeFill,
    waywordPostRunRenderer: window.waywordPostRunRenderer,
    requestMirrorReflectionAttentionSettle,
    startTelemetryRun,
    submitTelemetryRun
  };
}

function getRunControllerRuntime() {
  const runtime = window.waywordRunControllerRuntime;
  if (!runtime) {
    throw new Error(
      "wayword: run controller runtime is required before script.js run-controller orchestration"
    );
  }
  return runtime;
}

function registerRunControllerDeps() {
  getRunControllerRuntime().registerRunControllerDeps(
    window.waywordRunController,
    buildRunControllerRegistrationInput()
  );
}

registerRunControllerDeps();

window.addEventListener("pagehide", () => {
  getBehavioralTelemetry()?.endSession({ now: Date.now() });
});

function showProfile(show = true) {
  if (
    !window.waywordPatternsTransitionCoordinator ||
    typeof window.waywordPatternsTransitionCoordinator.showProfile !== "function"
  ) {
    return;
  }
  const result = window.waywordPatternsTransitionCoordinator.showProfile(show, {
    $,
    state,
    editorInput,
    isMobileViewport,
    isDesktopPatternsViewport,
    prefersReducedUiMotion,
    setFocusMode,
    syncExpandedFieldClass,
    syncViewportHeightVar,
    syncKeyboardOpenClass,
    queueViewportSync,
    renderProfile,
    syncPatternsLayoutMode: window.waywordViewController.syncPatternsLayoutMode,
    logPatternsTransitionSnapshot
  });
  if (show !== false) {
    try {
      window.waywordRetentionEvents?.markObservatoryRevisited({
        surface_name: "patterns",
        available: true,
        sparse_state: Array.isArray(state.history) ? state.history.length < 3 : true,
      });
    } catch (_) {
      /* ignore */
    }
  }
  return result;
}

/* -----------------------------
   zen hooks
----------------------------- */

function initZenGarden() {
  const overlay = $("zenGarden");
  const closeBtn = $("zenCloseBtn");
  const wordmarkEl = $("wordmark");
  if (!overlay || !closeBtn || !wordmarkEl) return;

  function closeGarden() {
    overlay.classList.add("hidden");
  }

  if (ZEN_GARDEN_OPENABLE) {
    wordmarkEl.addEventListener("click", () => {
      if (overlay.classList.contains("hidden")) overlay.classList.remove("hidden");
      else closeGarden();
    });
  }

  closeBtn.addEventListener("click", closeGarden);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeGarden();
  });

}

/* -----------------------------
   events
----------------------------- */

function getAppEventsRuntime() {
  const runtime = window.waywordAppEventsRuntime;
  if (!runtime) {
    throw new Error("wayword: app events runtime is required before script.js event orchestration");
  }
  return runtime;
}

function bindEditorInputEvents() {
  getAppEventsRuntime().bindEditorInputEvents({
    editorInputScrollport,
    editorInput,
    resolveEditorInput() {
      return document.getElementById("editorInput");
    },
    document,
    state,
    setFocusMode,
    mobileEditorFocusGuard: window.waywordMobileEditorFocusGuard,
    hideEditorSemanticPicker,
    queueViewportSync,
    getSuppressFocusExitUntil() {
      return suppressFocusExitUntil;
    },
    isMobilePatternsVisible,
    syncViewportHeightVar,
    syncKeyboardOpenClass,
    setEditorSurfaceComposing(value) {
      editorSurfaceComposing = Boolean(value);
    },
    getEditorSurfaceComposing() {
      return editorSurfaceComposing;
    },
    isActiveAndEditable() {
      return state.active && !state.submitted;
    },
    flushEditorSurfaceIntoWriteDocOnce,
    captureEditorSurfaceIntoWriteDocForSubmit,
    tryStartTimerOnFirstMeaningfulInput,
    pulseWordmark,
    renderHighlight,
    renderSidebar,
    updateWordProgress,
    updateEnterButtonVisibility,
    scheduleSemanticPickerFromSelection,
    syncScroll,
    scheduleEditorDotOverlaySync,
    insertMobileEditorTextNewline,
    completedUiRestartInteractions: window.waywordCompletedUiRestartInteractions,
    runPostSubmitAutoNewRunNow,
    getEditorText,
    submitWriting,
    renderMeta,
    onEditorFocusForEntryDelayHint: notifyEntryDelayHintEditorFocus,
    onEditorInputForEntryDelayHint: notifyEntryDelayHintEditorInput,
    onEditorInputForTelemetry: noteTelemetryEditorInput
  });
}

bindEditorInputEvents();

const { editorShell } = window.waywordDomElements.resolveEditorShell();

function getEditorShellInteractions() {
  const runtime = window.waywordEditorShellInteractions;
  if (!runtime || typeof runtime.bindEditorShellInteractions !== "function") {
    throw new Error(
      "wayword: editor shell interactions are required before script.js editor-shell orchestration"
    );
  }
  return runtime;
}

getEditorShellInteractions().bindEditorShellInteractions({
  editorShell,
  resetAnnotationRowPendingEditorSel() {
    annotationRowPendingEditorSel = null;
  },
  handleEditorSurfaceCompletedRestart(e) {
    return Boolean(
      window.waywordCompletedUiRestartInteractions &&
        typeof window.waywordCompletedUiRestartInteractions.handleEditorSurfaceCompletedRestart ===
          "function" &&
        window.waywordCompletedUiRestartInteractions.handleEditorSurfaceCompletedRestart(
          {
            state,
            runPostSubmitAutoNewRunNow
          },
          e
        )
    );
  },
  isActiveAndEditable() {
    return state.active && !state.submitted;
  },
  focusEditorToEnd
});

function bindFirstSessionEntryHandoffControls() {}

function bindPrimaryEventControls() {
  const runtime = getAppEventsRuntime();
  runtime.bindPromptCardRestart({
    $,
    domEventTargetElement,
    runPostSubmitAutoNewRunNow
  });
  runtime.bindDocumentEvents({
    document,
    state,
    completedUiRestartInteractions: window.waywordCompletedUiRestartInteractions,
    runPostSubmitAutoNewRunNow,
    tryHandleEscapeForOptionsSurface: () => optionsUi.tryHandleEscapeForOptionsSurface(),
    tryHandleEscapeForRecentRunsSurfaces: () => recentRunsUi.tryHandleEscapeForRecentRunsSurfaces(),
    mobileEditorFocusGuard: window.waywordMobileEditorFocusGuard,
    editorInput,
    isMobileViewport
  });
  runtime.bindPrimaryControls({
    $,
    enterAppState,
    scheduleDeferredEditorFocus,
    isMobileViewport,
    setFocusMode,
    startWriting,
    toggleTheme,
    panelCoordination: window.waywordPanelCoordination,
    setSuppressFocusExitUntil(value) {
      suppressFocusExitUntil = value;
    },
    now: () => performance.now(),
    showProfile,
    logPatternsTransitionSnapshot,
    triggerShuffle,
    cycleRepeatLimit,
    editorInput,
    bindEditorInputEvents,
    getEditorText,
    submitWriting,
    saveBannedInline,
    onBeginClicked(payload) {
      try {
        window.waywordRetentionEvents?.markOnboardingCompleted({
          source: payload && payload.source ? payload.source : "begin_button",
        });
        window.waywordRetentionEvents?.markWritingStarted({
          source: payload && payload.source ? payload.source : "begin_button",
        });
      } catch (_) {
        /* ignore */
      }
    }
  });
}

bindPrimaryEventControls();
syncWaywordResearchFormLinks();
bindFirstSessionEntryHandoffControls();
optionsUi.bindOptionsSurfaceEventGuards();
optionsUi.bindOptionsOpenCloseControls();

if (
  window.waywordInlineBannedEditorInteractions &&
  typeof window.waywordInlineBannedEditorInteractions.bindInlineBannedEditorInteractions === "function"
) {
  window.waywordInlineBannedEditorInteractions.bindInlineBannedEditorInteractions({
    $,
    getBannedEditorOpen() {
      return state.bannedEditorOpen;
    },
    setBannedEditorOpen,
    saveBannedInline
  });
} else {
  $("bannedPill")?.addEventListener("click", () => {
    setBannedEditorOpen(!state.bannedEditorOpen);
  });

  $("bannedInlineInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveBannedInline();
    }
    if (e.key === "Escape") {
      setBannedEditorOpen(false);
    }
  });

  document.addEventListener("click", e => {
    const editor = $("metaEditorRow");
    const pill = $("bannedPill");

    if (!editor || !pill) return;

    const clickedInside = editor.contains(e.target);
    const clickedPill = pill.contains(e.target);

    if (!clickedInside && !clickedPill) {
      setBannedEditorOpen(false);
    }
  });
}

/* -----------------------------
   panel control wiring
----------------------------- */

function bindPanelControlWiring() {
  getAppEventsRuntime().bindPanelControlWiring({
    document,
    $,
    applyWordTargetFromPanel,
    applyTimerFromPanel,
    triggerShuffle,
    scheduleBannedPanelPersistFromPanel,
    flushBannedPanelPersistFromPanel
  });
}

function registerDevOnlyHelpers() {
  if (!WAYWORD_DEV_FIRST_SESSION_ENTRY_RESET_ENABLED) return;
  function devVisualSeedRng(seedText) {
    let h = 2166136261;
    const s = String(seedText || "");
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let t = h >>> 0;
    return function () {
      t += 0x6d2b79f5;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function devVisualBuildRuns(profileName) {
    const p = String(profileName || "").toLowerCase();
    const rng = devVisualSeedRng(`wayword-dev-visual:${p}`);
    const now = Date.now();
    const dayMs = 86400000;
    const runs = [];
    let runIndex = 0;
    const promptPool = [
      "Describe a sound nearby and follow it into detail.",
      "Write one sentence you almost deleted, then keep it.",
      "Name a room detail that changed the tone of a conversation.",
      "Start with the line you keep repeating.",
      "Write from a moment you softened a direct statement.",
      "Describe what was visible just before you answered.",
      "Write the same scene twice: broad, then concrete.",
      "Follow one repeated word until it reveals the edge.",
      "Describe the pause before a short reply.",
      "Write toward what the sentence avoids saying.",
      "Begin with a plain fact, then complicate it.",
      "Describe how your tone changed mid-paragraph.",
      "Write one paragraph without summary language.",
      "Start with a concrete noun and stay with it.",
      "Describe the shift between intention and phrasing.",
      "Write the line you keep circling, then revise once.",
      "Name one object and let it carry the scene.",
      "Write from the sentence that feels too safe.",
      "Describe a small gesture that altered the room.",
      "Start with what happened, not what it meant.",
      "Write a version that cuts two qualifiers.",
      "Describe the same moment from two distances.",
      "Follow the verb that keeps reappearing.",
      "Write from the detail you first ignored.",
      "Name the exact point where tone turned.",
      "Describe the sentence that finally held."
    ];

    function buildSyntheticText(targetWords, rngLocal) {
      const fragments = [
        "I returned to the same line and revised it toward concrete detail.",
        "The sentence moved from summary into the surface of what happened.",
        "I kept one grounded image in place and trimmed safer phrasing.",
        "The cadence shifted from broad explanation to direct language.",
        "I held the final sentence long enough to stay specific.",
      ];
      const out = [];
      let words = 0;
      while (words < targetWords) {
        const frag = fragments[Math.floor(rngLocal() * fragments.length)];
        out.push(frag);
        words += frag.split(/\s+/).length;
      }
      return out.join(" ");
    }

    const addRun = (savedAtMs, options = {}) => {
      runIndex += 1;
      const runId = `dev-${p}-${String(runIndex).padStart(5, "0")}`;
      const prompt =
        String(options.prompt || "").trim() ||
        promptPool[(runIndex - 1) % promptPool.length];
      const complete = options.complete !== false;
      const interrupted = options.interrupted === true;
      const abandoned = options.abandoned === true;
      const wordCount = Math.max(8, Number(options.wordCount) || (complete ? 70 : 28));
      const durationMinutes = Math.max(1, Number(options.durationMinutes) || (complete ? 14 : 5));
      const text = buildSyntheticText(wordCount, rng);
      const startedAtMs = savedAtMs - durationMinutes * 60000;
      runs.push({
        runId,
        savedAt: savedAtMs,
        timestamp: savedAtMs,
        startedAt: startedAtMs,
        durationMinutes,
        text,
        prompt,
        score: 80,
        runScore: 80,
        scoreBreakdown: { completion: 20, filler: 20, repetition: 20, openings: 20 },
        repeatedWords: [["line", 3]],
        bannedHits: [],
        repeatedStarters: [["i", 2]],
        challengeActive: false,
        challengeCompleted: false,
        challengeWords: [],
        wasSuccessful: complete && !interrupted && !abandoned,
        activeTargetWords: 120,
        activeTimerSeconds: 240,
        finishedWithinTime: complete,
        timeRemaining: 18,
        wordCount,
        words: wordCount,
        unique: 22,
        uniqueRatio: 0.79,
        avgSentenceLength: 14,
        repeatedCount: 1,
        fillerCount: 0,
        wordFreq: { line: 3 },
        starterFreq: { i: 2 },
        starterExamples: { i: "I revised the sentence toward detail." },
        punctuation: { commas: 2, periods: 2, exclamations: 0, parentheses: 0, quotes: 0 },
        perspective: { first: 6, second: 0, third: 0 },
        completed: complete,
        submitted: complete,
        interrupted,
        abandoned,
        mirrorLoadFailed: false,
        mirrorPipelineResult: null,
      });
    };

    if (p === "recent20") {
      for (let i = 0; i < 20; i += 1) {
        const d = Math.floor(i * 1.5);
        const h = Math.floor(rng() * 10) + 10;
        const m = Math.floor(rng() * 60);
        const complete = rng() < 0.9;
        const wc = complete ? 60 + Math.floor(rng() * 60) : 20 + Math.floor(rng() * 35);
        const dur = complete ? 8 + Math.floor(rng() * 16) : 3 + Math.floor(rng() * 8);
        addRun(now - d * dayMs - h * 3600000 - m * 60000, {
          prompt: promptPool[i % promptPool.length],
          complete,
          interrupted: !complete && rng() < 0.6,
          wordCount: wc,
          durationMinutes: dur,
        });
      }
      return runs.sort((a, b) => a.savedAt - b.savedAt);
    }

    if (p === "seasonextreme") {
      const seasonDays = 92;
      const start = now - (seasonDays - 1) * dayMs;
      for (let d = 0; d < seasonDays; d += 1) {
        const dailyCount = 8 + Math.floor(rng() * 5); // 8..12/day
        const clusterMode = rng();
        for (let i = 0; i < dailyCount; i += 1) {
          // Mix times each day; some days morning-heavy, some evening-heavy, most mixed.
          let hour;
          if (clusterMode < 0.2) hour = 6 + Math.floor(rng() * 8); // morning block
          else if (clusterMode < 0.4) hour = 14 + Math.floor(rng() * 8); // afternoon/evening block
          else hour = Math.floor(rng() * 24); // mixed full-day
          const minute = Math.floor(rng() * 60);
          const complete = rng() < 0.8;
          const wc = complete ? 58 + Math.floor(rng() * 150) : 14 + Math.floor(rng() * 60);
          const dur = complete ? 7 + Math.floor(rng() * 28) : 2 + Math.floor(rng() * 10);
          addRun(start + d * dayMs + hour * 3600000 + minute * 60000, {
            complete,
            interrupted: !complete && rng() < 0.65,
            abandoned: !complete && rng() < 0.15,
            wordCount: wc,
            durationMinutes: dur,
          });
        }
      }
      return runs.sort((a, b) => a.savedAt - b.savedAt);
    }

    return [];
  }

  function installDevVisualProfileRuns(profileName) {
    const runs = devVisualBuildRuns(profileName);
    if (!runs.length) return false;
    window.__WAYWORD_DEV_VISUAL_PROFILE = String(profileName);
    window.__WAYWORD_DEV_VISUAL_RUNS__ = runs.slice();
    try {
      localStorage.setItem("wayword-history", JSON.stringify(runs));
      localStorage.setItem("wayword-runids", JSON.stringify(runs.map((r) => r.runId)));
      let items = [];
      try {
        if (
          window.waywordRunDocumentsModel &&
          typeof window.waywordRunDocumentsModel.createRunDocumentFromLegacyRun === "function" &&
          window.waywordRunDocumentMarkdown &&
          typeof window.waywordRunDocumentMarkdown.serializeRunDocumentToMarkdown === "function"
        ) {
          items = runs.map((run) =>
            window.waywordRunDocumentMarkdown.serializeRunDocumentToMarkdown(
              window.waywordRunDocumentsModel.createRunDocumentFromLegacyRun(run)
            )
          );
        }
      } catch (_) {
        items = [];
      }
      localStorage.setItem("wayword-run-documents-v1", JSON.stringify({ storeEnvelopeVersion: 1, items }));
    } catch (_) {
      return false;
    }
    return true;
  }

  function refreshDevVisualProfileUi() {
    try {
      renderHistory();
      renderProfile();
      renderProfileSummaryStrip();
      renderFirstSessionEntry();
      renderMeta();
      queueViewportSync();
    } catch (_) {
      /* ignore */
    }
  }

  window.waywordDevResetFirstSessionEntry = waywordDevResetFirstSessionEntryForTesting;
  window.waywordDevSeasonFixtures = {
    availableFixtures: Object.freeze([
      "sparse",
      "moderate",
      "heavy",
      "clustered",
      "steady",
      "extreme",
      "clustered10rapid",
    ]),
    useFixture(name) {
      const normalized = String(name || "").toLowerCase();
      if (!fixtureCountMapByName(normalized)) {
        console.warn("waywordDevSeasonFixtures: unknown fixture", name);
        return false;
      }
      devSeasonFixtureName = normalized;
      console.info(`waywordDevSeasonFixtures: using fixture \"${normalized}\"`);
      renderCurrentSeasonPanel();
      return true;
    },
    clearFixture() {
      devSeasonFixtureName = null;
      console.info("waywordDevSeasonFixtures: cleared fixture");
      renderCurrentSeasonPanel();
      return true;
    },
  };
  window.waywordDevVisualProfiles = {
    availableProfiles: Object.freeze(["recent20", "seasonExtreme"]),
    applyProfile(name) {
      const ok = installDevVisualProfileRuns(name);
      if (!ok) {
        console.warn("waywordDevVisualProfiles: unknown profile", name);
        return false;
      }
      // Keep the real season panel driven by seeded runs (no synthetic wheel fixture override).
      refreshDevVisualProfileUi();
      return true;
    },
    clearProfile() {
      delete window.__WAYWORD_DEV_VISUAL_PROFILE;
      delete window.__WAYWORD_DEV_VISUAL_RUNS__;
      return true;
    }
  };
}

function runDevOnlyBootActions() {
  if (!WAYWORD_DEV_FIRST_SESSION_ENTRY_RESET_ENABLED) return;
  try {
    const params = new URLSearchParams(location.search);
    if (params.get("visualExport") === "1") {
      try {
        document.documentElement.dataset.waywordVisualExport = "1";
        document.body.classList.add("visual-export-mode");
        const fixture = String(params.get("fixture") || "").trim().toLowerCase();
        if (fixture) {
          window.__WAYWORD_VISUAL_EXPORT_FIXTURE__ = fixture;
          document.documentElement.dataset.waywordVisualExportFixture = fixture;
        }
      } catch (_) {
        /* ignore */
      }
    }
    if (params.get("resetFirstSessionEntry") === "1") {
      waywordDevResetFirstSessionEntryForTesting();
      params.delete("resetFirstSessionEntry");
    }
    const fixtureParam = String(params.get("seasonFixture") || "").toLowerCase();
    if (fixtureParam && fixtureCountMapByName(fixtureParam)) {
      devSeasonFixtureName = fixtureParam;
    }
    const visualProfile = String(params.get("visualProfile") || "").trim();
    if (visualProfile && window.waywordDevVisualProfiles && typeof window.waywordDevVisualProfiles.applyProfile === "function") {
      window.waywordDevVisualProfiles.applyProfile(visualProfile);
    }
    const visualView = String(params.get("view") || "").trim().toLowerCase();
    if (visualView === "patterns") {
      window.__WAYWORD_DEV_VISUAL_VIEW = "patterns";
    } else if (visualView === "recent") {
      window.__WAYWORD_DEV_VISUAL_VIEW = "recent";
    }
    const q = params.toString();
    history.replaceState(null, "", location.pathname + (q ? `?${q}` : "") + location.hash);
  } catch (_) {
    /* ignore */
  }
}

registerDevOnlyHelpers();
bindPanelControlWiring();
/* -----------------------------
   boot
----------------------------- */
runDevOnlyBootActions();

function getAppBootRuntime() {
  const runtime = window.waywordAppBootRuntime;
  if (!runtime) {
    throw new Error("wayword: app boot runtime is required before script.js boot orchestration");
  }
  return runtime;
}

function bindBootObservers() {
  const runtime = getAppBootRuntime();
  runtime.bindViewportObservers({
    window,
    queueViewportSync
  });
  runtime.bindEditorShellEdgeResizeObserver({
    window,
    document,
    ResizeObserver: typeof ResizeObserver === "undefined" ? undefined : ResizeObserver,
    queueViewportSync
  });
  runtime.bindEditorFirstSessionEntryOverlayResizeObserver({
    $,
    ResizeObserver: typeof ResizeObserver === "undefined" ? undefined : ResizeObserver,
    syncEditorFirstSessionEntryOverlayClip
  });
}

function runInitialBootRender() {
  getAppBootRuntime().runInitialRender({
    state,
    syncViewportHeightVar,
    applyTheme,
    loadStoredProgressionLevel,
    recomputeProgressionLevel,
    applyProgressionToState,
    ensurePromptRerollButton,
    bindPromptClusterControlsOnce,
    renderMeta,
    renderWritingState,
    projectWriteDocToEditorFromState,
    renderHighlight,
    scheduleEditorDotOverlaySync,
    renderSidebar,
    renderHistory,
    renderProfile,
    syncPatternsLayoutMode: window.waywordViewController.syncPatternsLayoutMode,
    renderFirstSessionEntry,
    renderProfileSummaryStrip,
    updateEnterButtonVisibility
  });
}

function initAccountContinuityAuthScaffold() {
  const runtime = window.waywordAuthSessionRuntime;
  if (!runtime || typeof runtime.init !== "function") return;

  runtime.init({
    getDraftText: getEditorText,
    setDraftText: setEditorText,
    onStatus(status) {
      const accountState = state.account || (state.account = {});
      accountState.mode = status && status.mode ? status.mode : "local-only";
      accountState.hasSession = Boolean(status && status.hasSession);
      renderAccountSurface();
    },
    onAuthStateChange(eventInfo) {
      const accountState = state.account || (state.account = {});
      accountState.lastAuthEvent = eventInfo && eventInfo.event ? String(eventInfo.event) : "";
      accountState.hasSession = Boolean(eventInfo && eventInfo.hasSession);
      renderAccountSurface();
    },
    onAuthError() {
      // Draft preservation is handled inside the runtime; keep UX steady here.
      setAccountMessage("Account sign-in is not available right now. Your writing is still here.");
    },
    onRetentionHook() {
      try {
        window.waywordTelemetryRuntime?.detectReturnSession({ thresholdHours: 12 });
      } catch (_) {
        /* ignore */
      }
    },
  });
}

function initPersistenceContinuityRuntime() {
  var runtime = window.waywordPersistenceRuntime;
  if (!runtime || typeof runtime.init !== "function") return;
  runtime.init({
    onStatus: function (status) {
      var migrationState = state.continuityMigration || (state.continuityMigration = {});
      migrationState.status = status && status.migrationStatus ? status.migrationStatus : migrationState.status || "not_started";
      renderAccountSurface();
    },
  });
}

function initRetentionInstrumentationRuntime() {
  try {
    window.waywordRetentionEvents?.markLandingViewed({ source: "landing_screen" });
  } catch (_) {
    /* ignore */
  }
  try {
    window.waywordTelemetryRuntime?.detectReturnSession({ thresholdHours: 12 });
  } catch (_) {
    /* ignore */
  }
}

function setAccountMessage(text, kind = "info") {
  const msg = $("accountPanelMessage");
  if (!msg) return;
  const content = String(text || "").trim();
  msg.textContent = content;
  msg.classList.toggle("hidden", !content);
  msg.dataset.kind = kind;
}

function isAccountPanelOpen() {
  return !$("accountBackdrop")?.classList.contains("hidden");
}

function openAccountPanel() {
  const backdrop = $("accountBackdrop");
  const panel = $("accountPanel");
  const btn = $("accountBtn");
  if (!backdrop || !panel || !btn) return;
  backdrop.classList.remove("hidden");
  backdrop.setAttribute("aria-hidden", "false");
  panel.setAttribute("aria-hidden", "false");
  btn.setAttribute("aria-expanded", "true");
  document.body.classList.add("settings-open");
  renderAccountSurface();
}

function closeAccountPanel() {
  const backdrop = $("accountBackdrop");
  const panel = $("accountPanel");
  const btn = $("accountBtn");
  if (!backdrop || !panel || !btn) return;
  backdrop.classList.add("hidden");
  backdrop.setAttribute("aria-hidden", "true");
  panel.setAttribute("aria-hidden", "true");
  btn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("settings-open");
}

function isAccountEnvConfigured() {
  return Boolean(window.waywordEnv && window.waywordEnv.isSupabaseConfigured);
}

function isAccountRlsVerified() {
  var env = window.waywordEnv || {};
  return env.SUPABASE_RLS_VERIFIED === true || env.SUPABASE_RLS_VERIFIED === "true";
}

function selectAccountSummaryCopy(input) {
  var configured = Boolean(input && input.configured);
  var hasSession = Boolean(input && input.hasSession);
  var syncGuarded = Boolean(input && input.syncGuarded);
  if (!configured) return "Account sync is not set up in this preview.";
  if (hasSession) return "Signed in. Writing can continue across devices.";
  if (syncGuarded) {
    return "Sign in is available. Account sync is not available right now.";
  }
  return "Sign in to keep writing available across devices.";
}

function getAccountRuntimeUnavailableMessage(configured) {
  if (!configured) return "Account sync is not set up in this preview.";
  return "Account sign-in is not available right now.";
}

function shouldEnableAccountDebugMode() {
  try {
    var host = String(window.location && window.location.hostname ? window.location.hostname : "").toLowerCase();
    var isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (isLocalHost) return true;
    var search = String(window.location && window.location.search ? window.location.search : "");
    var params = new URLSearchParams(search);
    return params.get("waywordAccountDebug") === "1";
  } catch (_) {
    return false;
  }
}

function publishAccountDebugState(nextState) {
  if (!shouldEnableAccountDebugMode()) return;
  var prior = window.waywordAccountDebug && typeof window.waywordAccountDebug === "object"
    ? window.waywordAccountDebug
    : {};
  var merged = Object.assign({}, prior, nextState || {}, { capturedAt: new Date().toISOString() });
  window.waywordAccountDebug = merged;
  try {
    console.info("[wayword-account-debug]", merged);
  } catch (_) {
    /* ignore */
  }
}

function renderAccountSurface() {
  const summary = $("accountPanelSummary");
  const fallback = $("accountPanelFallback");
  const signInForm = $("accountSignInForm");
  const signOutBtn = $("accountSignOutBtn");
  const actions = $("accountActions");
  const accountState = state.account || {};
  const configured = isAccountEnvConfigured();
  const hasSession = Boolean(accountState.hasSession);
  const migrationStatus = String(state.continuityMigration?.status || "not_started");
  const syncGuarded = configured && migrationStatus === "skipped_unverified_rls";
  const summaryBranch = !configured
    ? "missing_env"
    : hasSession
      ? "signed_in"
      : syncGuarded
        ? "sync_guarded"
        : "signed_out_ready";
  const summaryCopy = selectAccountSummaryCopy({ configured, hasSession, syncGuarded });

  if (summary) {
    summary.textContent = summaryCopy;
  }

  if (fallback) {
    fallback.textContent = "Your writing is still here on this device.";
  }

  if (signInForm) {
    signInForm.classList.toggle("hidden", !configured || hasSession);
  }
  if (signOutBtn) {
    signOutBtn.classList.toggle("hidden", !configured || !hasSession);
  }
  if (actions) {
    const canAccountActions =
      configured &&
      hasSession &&
      window.waywordPersistenceRuntime &&
      typeof window.waywordPersistenceRuntime.exportOwnedRuns === "function" &&
      typeof window.waywordPersistenceRuntime.deleteAllOwnedRuns === "function";
    actions.classList.toggle("hidden", !canAccountActions);
  }

  if (isAccountPanelOpen()) {
    const existing = $("accountPanelMessage")?.textContent || "";
    if (!existing.trim() && configured && migrationStatus === "skipped_unverified_rls") {
      setAccountMessage("Account sync is not available right now. Writing is still saved on this device.");
    }
  }

  let authRuntimeReady = false;
  try {
    const runtime = window.waywordAuthSessionRuntime;
    authRuntimeReady = Boolean(runtime && typeof runtime.signInWithMagicLink === "function");
  } catch (_) {
    authRuntimeReady = false;
  }

  let supabaseClientReady = false;
  try {
    const clientApi = window.waywordSupabaseClient;
    const client = clientApi && typeof clientApi.getClient === "function" ? clientApi.getClient() : null;
    supabaseClientReady = Boolean(client);
  } catch (_) {
    supabaseClientReady = false;
  }

  publishAccountDebugState({
    envConfigured: configured,
    rlsVerified: isAccountRlsVerified(),
    hasSession: hasSession,
    migrationStatus: migrationStatus,
    summaryBranch: summaryBranch,
    summaryCopy: summaryCopy,
    authRuntimeReady: authRuntimeReady,
    supabaseClientReady: supabaseClientReady,
    messageCopy: String($("accountPanelMessage")?.textContent || ""),
  });
}

function bindAccountSurface() {
  const accountBtn = $("accountBtn");
  const backdrop = $("accountBackdrop");
  const closeBtn = $("accountCloseBtn");
  const signInForm = $("accountSignInForm");
  const emailInput = $("accountEmailInput");
  const signOutBtn = $("accountSignOutBtn");
  const exportBtn = $("accountExportBtn");
  const deleteAllBtn = $("accountDeleteAllBtn");

  accountBtn?.addEventListener("click", () => {
    if (isAccountPanelOpen()) closeAccountPanel();
    else openAccountPanel();
  });

  closeBtn?.addEventListener("click", () => closeAccountPanel());
  backdrop?.addEventListener("click", (e) => {
    if (e.target === backdrop) closeAccountPanel();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isAccountPanelOpen()) return;
    e.preventDefault();
    closeAccountPanel();
  });

  signInForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = String(emailInput?.value || "").trim();
    if (!email) {
      setAccountMessage("Enter an email address.");
      return;
    }
    const runtime = window.waywordAuthSessionRuntime;
    if (!runtime || typeof runtime.signInWithMagicLink !== "function") {
      const configured = isAccountEnvConfigured();
      setAccountMessage(getAccountRuntimeUnavailableMessage(configured));
      publishAccountDebugState({
        submitBranch: configured ? "runtime_missing_configured_env" : "runtime_missing_no_env",
        envConfigured: configured,
        authRuntimeReady: false,
      });
      return;
    }
    const result = await runtime.signInWithMagicLink(email);
    if (result && result.error) {
      try {
        console.info("[wayword-auth-ui] sign-in link send failed", {
          errorCode: result.error.code || "",
          errorStatus: result.error.status || "",
          errorMessage: result.error.message || "",
        });
      } catch (_) {
        /* ignore */
      }
      setAccountMessage("Account sign-in is not available right now. Writing is still saved on this device.");
      return;
    }
    setAccountMessage("Check your email for a sign-in link.");
  });

  signOutBtn?.addEventListener("click", async () => {
    const runtime = window.waywordAuthSessionRuntime;
    if (!runtime || typeof runtime.signOut !== "function") return;
    const result = await runtime.signOut();
    if (result && result.error) {
      setAccountMessage("Sign out is not available right now.");
      return;
    }
    setAccountMessage("Signed out.");
  });

  exportBtn?.addEventListener("click", async () => {
    const runtime = window.waywordPersistenceRuntime;
    if (!runtime || typeof runtime.exportOwnedRuns !== "function") return;
    const result = await runtime.exportOwnedRuns();
    if (!result || !result.ok) {
      setAccountMessage("Export is not available right now.");
      return;
    }
    try {
      const payload = JSON.stringify(result.exportData || {}, null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wayword-runs-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setAccountMessage("Writing archive downloaded.");
    } catch (_) {
      setAccountMessage("Writing archive is ready, but download did not start.");
    }
  });

  deleteAllBtn?.addEventListener("click", async () => {
    const ok = window.confirm("Delete saved writing? Writing on this device stays available.");
    if (!ok) return;
    const runtime = window.waywordPersistenceRuntime;
    if (!runtime || typeof runtime.deleteAllOwnedRuns !== "function") return;
    const result = await runtime.deleteAllOwnedRuns();
    if (!result || !result.ok) {
      setAccountMessage("Delete is not available right now.");
      return;
    }
    setAccountMessage("Saved cloud writing deleted. Writing on this device is unchanged.");
  });

  renderAccountSurface();
}

bindBootObservers();
runInitialBootRender();
initAccountContinuityAuthScaffold();
initPersistenceContinuityRuntime();
initRetentionInstrumentationRuntime();
bindAccountSurface();
installRightControlSpineOwnershipObserver();
enforceRightControlSpineOwnership("boot:post-initial-render");
startRightControlSpineStabilizer(8000);

try {
  if (new URLSearchParams(location.search).get("writeDocMapping") === "1") {
    if (!verifyWriteDocCanonicalMappingSelfTest()) {
      console.warn("writeDoc canonical mapping self-test failed (see errors above)");
    }
  }
} catch (_) {
  /* ignore */
}

enterLandingState();
initZenGarden();
initEditorCompletedFlow();
bindAnnotationRowFlagInteraction();
bindEditorSemanticPicker();
bindMetricExplainerDelegation("recentDrawerList");
bindMetricExplainerDelegation("recentRailList");
recentRunsUi.bindRecentRunsOpenCloseControls();
recentRunsUi.bindRecentRunsExpandDismissUi();
bindClearSavedRunsPatternsControlsOnce();

function runDevVisualProfileHealthCheckWhenReady() {
  const hasDevProfile = Boolean(window.__WAYWORD_DEV_VISUAL_PROFILE);
  if (!hasDevProfile) return;
  const view = String(window.__WAYWORD_DEV_VISUAL_VIEW || "").toLowerCase();
  let attempts = 0;
  const maxAttempts = 80;
  const timer = window.setInterval(() => {
    attempts += 1;
    try {
      const appVisible = $("appView")?.getAttribute("aria-hidden") !== "true";
      const hasEditor = Boolean($("editorInput"));
      if (!appVisible || !hasEditor) {
        if (attempts >= maxAttempts) window.clearInterval(timer);
        return;
      }

      try {
        const promptText = String($("promptText")?.textContent || "").trim();
        if (!promptText && typeof generatePrompt === "function") {
          generatePrompt();
          renderMeta();
        }
        if (typeof renderHistory === "function") renderHistory();
        if (typeof renderProfile === "function") renderProfile();
      } catch (_) {
        /* ignore */
      }

      setFocusMode(false);

      if (view === "patterns") {
        if (typeof showProfile === "function") {
          showProfile(true);
          window.clearInterval(timer);
          return;
        }
      } else if (view === "recent") {
        if (typeof setRecentDrawerOpen === "function") {
          setRecentDrawerOpen(true);
          window.clearInterval(timer);
          return;
        }
        const first = document.querySelector("#recentRailList .recent-entry");
        if (first) {
          first.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          window.clearInterval(timer);
          return;
        }
      } else {
        window.clearInterval(timer);
        return;
      }
    } catch (_) {
      /* ignore */
    }
    if (attempts >= maxAttempts) window.clearInterval(timer);
  }, 120);
}

try {
  runDevVisualProfileHealthCheckWhenReady();
} catch (_) {
  /* ignore */
}

queueViewportSync();
schedulePostLayoutViewportReconcile();

try {
  window.addEventListener(
    "load",
    () => {
      schedulePostLayoutViewportReconcile();
    },
    { once: true }
  );
} catch (_) {
  /* ignore */
}

try {
  window.addEventListener(
    "pageshow",
    () => {
      schedulePostLayoutViewportReconcile();
    },
    { passive: true }
  );
} catch (_) {
  /* ignore */
}

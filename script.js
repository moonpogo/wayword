const promptFamilies = {
  Observation: [
    "Describe a room without mentioning doors or windows.",
    "Describe a city rooftop at dusk without using cliché language.",
    "Describe a kitchen after everyone has left.",
    "Describe a cheap object with absolute seriousness.",
    "Describe a neighborhood corner as if it had a private life.",
    "Describe an empty bus as if it were full."
  ],
  Indirection: [
    "Write about hunger without naming food.",
    "Write about shame without naming any emotion.",
    "Write about a body indirectly, through strain, weight, and gesture.",
    "Write about a person through the things they leave behind.",
    "Write about a meal that felt heavier than the food itself.",
    "Write about relief that arrives too late."
  ],
  Social: [
    "Write a scene where someone lies kindly and the other person knows it.",
    "Write about a conversation that never quite happened.",
    "Write about a phone call that changed nothing and everything.",
    "Write about a friend you have already started losing.",
    "Write a scene in which someone is kind for the wrong reason.",
    "Write a note to someone you avoid, but never send it."
  ],
  Object: [
    "Write about a cracked cup without using the word broken.",
    "Describe an old phone as if it were an organ.",
    "Describe a storm drain as if it were a mouth.",
    "Describe a public park bench as if it were a witness.",
    "Describe a hallway as if it remembers everyone who passed through it.",
    "Describe a waiting room as if it were sacred."
  ],
  Tension: [
    "Write a confession that avoids the actual wrongdoing.",
    "Write a small story where the only violence is in the tone.",
    "Write about envy without admitting it.",
    "Write about forgiveness as if it were a household chore.",
    "Describe grief using only physical details.",
    "Write about love as if it were civic infrastructure."
  ]
};

const bannedSets = [
  ["like","just","really","very","thing","stuff","something","maybe","kind","sort"],
  ["very","really","just","quite","perhaps","somehow"],
  ["thing","things","stuff","something","anything","nothing"],
  ["maybe","perhaps","kind","sort","almost","basically"]
];

const exemptWords = new Set([
  "a","an","the","to","of","in","on","at","by","with","as","is","be","am","are","was","were","and","or","but","for"
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

const CALIBRATION_THRESHOLD = 5;
/** Minimum material for a run to count toward calibration (avoid fake insight). */
const CALIBRATION_MIN_WORDS = 40;
const CALIBRATION_MIN_SENTENCE_UNITS = 3;
const CALIBRATION_INSUFFICIENT_COPY = "Write a little more for calibration.";

/** Zen garden entry (wordmark toggle). Set to true when the garden is ready to ship. */
const ZEN_GARDEN_OPENABLE = false;

/** Bumped when opening Patterns so an in-flight close animation cannot hide the panel after reopen. */
let profilePanelCloseMotionToken = 0;

/**
 * DEV-ONLY — search `WAYWORD_DEV_CALIBRATION_RESET` to remove this entire block.
 * When true: `window.waywordDevResetCalibration()` clears run history + calibration state.
 * Also enabled on `*.vercel.app` (previews share browser storage with past opens; use reset below).
 * One-shot URL (runs before first paint of calibration UI): append `?resetCalibration=1` (strip self).
 */
const WAYWORD_DEV_CALIBRATION_RESET_ENABLED =
  typeof location !== "undefined" &&
  ((location.hostname || "") === "localhost" ||
    (location.hostname || "") === "127.0.0.1" ||
    location.protocol === "file:" ||
    new URLSearchParams(location.search).get("waywordDev") === "1" ||
    /\.vercel\.app$/i.test(location.hostname || ""));

const WAYWORD_DEBUG_PATTERNS_TRANSITIONS_ENABLED =
  typeof location !== "undefined" &&
  (() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("debugPatterns") === "1") return true;
      if (params.get("debugPatterns") === "0") return false;
      return localStorage.getItem("waywordDebugPatterns") === "1";
    } catch (_) {
      return false;
    }
  })();

function logPatternsTransitionSnapshot(label, extra = {}) {
  if (!WAYWORD_DEBUG_PATTERNS_TRANSITIONS_ENABLED) return;
  const root = document.documentElement;
  const body = document.body;
  const appView = $("appView");
  const writeView = $("writeView");
  const profileView = $("profileView");
  const mainColumn = document.querySelector("#writeView .main-column");
  const belowEditorStack = document.querySelector(".below-editor-stack");
  const appShell = document.querySelector(".app-shell");
  const vv = window.visualViewport || null;
  const rootStyle = getComputedStyle(root);
  const appRect = appView?.getBoundingClientRect() || null;
  const mainRect = mainColumn?.getBoundingClientRect() || null;
  const belowRect = belowEditorStack?.getBoundingClientRect() || null;
  const profileRect = profileView?.getBoundingClientRect() || null;
  const payload = {
    label,
    now: Math.round(performance.now()),
    classes: {
      html: root.className,
      body: body.className,
      appShell: appShell?.className || "",
      appView: appView?.className || "",
      writeView: writeView?.className || "",
      profileView: profileView?.className || ""
    },
    flags: {
      isMobileViewport: isMobileViewport(),
      focusMode: body.classList.contains("focus-mode"),
      keyboardOpen: body.classList.contains("keyboard-open"),
      patternsOpen: body.classList.contains("patterns-open"),
      profileHidden: Boolean(profileView?.classList.contains("hidden")),
      writeHidden: Boolean(writeView?.classList.contains("hidden")),
      expandedFieldClass: body.classList.contains("expanded-field"),
      expandedFieldState: state.isExpandedField
    },
    cssVars: {
      vvh: rootStyle.getPropertyValue("--vvh").trim(),
      vvOffsetTop: rootStyle.getPropertyValue("--vv-offset-top").trim(),
      windowInnerHeightVar: rootStyle.getPropertyValue("--window-inner-height").trim()
    },
    viewport: {
      innerHeight: window.innerHeight,
      vvHeight: vv ? Math.round(vv.height) : null,
      vvOffsetTop: vv ? Math.round(vv.offsetTop) : null,
      vvPageTop: vv ? Math.round(vv.pageTop) : null
    },
    geometry: {
      appTop: appRect ? Math.round(appRect.top) : null,
      appHeight: appRect ? Math.round(appRect.height) : null,
      mainTop: mainRect ? Math.round(mainRect.top) : null,
      mainHeight: mainRect ? Math.round(mainRect.height) : null,
      belowTop: belowRect ? Math.round(belowRect.top) : null,
      belowHeight: belowRect ? Math.round(belowRect.height) : null,
      profileTop: profileRect ? Math.round(profileRect.top) : null,
      profileHeight: profileRect ? Math.round(profileRect.height) : null
    },
    extra
  };
  console.log("[patterns-debug]", payload);
}

const PROMPT_REROLL_LIMIT = 2;

const PROGRESSION_LEVELS = [
  { level: 1, targetWords: 60, timerSeconds: 0 },
  { level: 2, targetWords: 75, timerSeconds: 120 },
  { level: 3, targetWords: 90, timerSeconds: 90 }
];
const PROGRESSION_LEVEL_KEY = "wayword-progression-level";
const INACTIVITY_EASE_RUN_KEY = "wayword-inactivity-eased-for-run";

const $ = (id) => document.getElementById(id);

/**
 * Category accent colors — canonical values live in category-colors.css; JS must not hardcode hex.
 * Use getCategoryAccentColor() when a runtime string is needed (e.g. canvas); otherwise rely on CSS classes.
 */
const CATEGORY_ACCENT_CSS_VARS = Object.freeze({
  filler: "--color-filler",
  repetition: "--color-repetition",
  openings: "--color-openings",
  challenge: "--color-challenge",
});

/** `var(--color-*)` strings — same tokens as category-colors.css; use with styles or resolve via getCategoryAccentColor. */
const CATEGORY_COLOR_CSS = Object.freeze(
  Object.fromEntries(Object.entries(CATEGORY_ACCENT_CSS_VARS).map(([k, prop]) => [k, `var(${prop})`]))
);

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

const state = {
  active: false,
  submitted: false,
  targetWords: 60,
  repeatLimit: 2,
  timerSeconds: 0,
  timeRemaining: 0,
  /** True until first meaningful edit arms `startTimer()`; focus alone does not start the countdown. */
  timerWaitingForFirstInput: false,
  timerId: null,
  progressionLevel: 1,
  banned: [...bannedSets[0]],
  prompt: "",
  promptFamily: "",
  lastPromptKey: "",
  theme: localStorage.getItem("wayword-theme") || "light",
  history: JSON.parse(localStorage.getItem("wayword-history") || "[]"),
  savedRunIds: new Set(JSON.parse(localStorage.getItem("wayword-runids") || "[]")),
  exerciseWords: [],
  patternSelectedWords: [],
  completedChallenges: new Set(
  JSON.parse(localStorage.getItem("wayword-completed-challenges") || "[]")
),
  bannedEditorOpen: false,
  optionsOpen: false,
  promptRerollsUsed: 0,
  pendingRecentDrawerExpand: false,
  writeDoc: { lines: [{ tokens: [], trailingSpace: false }] },
  lastRunFeedback: "",
  /** Last `runMirrorPipeline` result after submit; cleared on new run. */
  lastMirrorPipelineResult: null,
  /** True when the mirror bundle failed to load or threw during the last submit. */
  lastMirrorLoadFailed: false,
  /** After a saved run, set when step 1–5; observation lives here (not on reflection line). Cleared on new run. */
  calibrationPostRun: null,
  completedUiActive: false,
  /** Mobile writing field: when true, surrounding header/context is revealed (still in the same focus habitat). */
  isExpandedField: false
};

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
  state.exerciseWords = normalizeExerciseWords(words);
  if (state.exerciseWords.length) {
    localStorage.setItem("wayword-exercise-words", JSON.stringify(state.exerciseWords));
    localStorage.setItem("wayword-exercise-word", state.exerciseWords[0]);
  } else {
    localStorage.removeItem("wayword-exercise-words");
    localStorage.removeItem("wayword-exercise-word");
  }
}

function loadPersistedPatternSelectedWords() {
  try {
    const stored = JSON.parse(localStorage.getItem("wayword-pattern-selected-words") || "[]");
    return normalizeExerciseWords(stored);
  } catch (_) {
    return [];
  }
}

function setPatternSelectedWords(words) {
  state.patternSelectedWords = normalizeExerciseWords(words);
  if (state.patternSelectedWords.length) {
    localStorage.setItem("wayword-pattern-selected-words", JSON.stringify(state.patternSelectedWords));
  } else {
    localStorage.removeItem("wayword-pattern-selected-words");
  }
}

// Active challenge is intentionally session/run-scoped.
// Never restore from previous sessions.
state.exerciseWords = [];
localStorage.removeItem("wayword-exercise-words");
localStorage.removeItem("wayword-exercise-word");
state.patternSelectedWords = loadPersistedPatternSelectedWords();

/** Selection snapshot before annotation slot takes focus away from the editor (canonical offsets). */
let annotationRowPendingEditorSel = null;

const input = document.querySelector('.editor-input');

const editorInput = $("editorInput");
const editorDotOverlay = $("editorDotOverlay");
const editorSemanticPicker = $("editorSemanticPicker");
const highlightLayer = $("highlightLayer");
const wordmark = $("wordmark");

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
  const h = inFocusMode ? getViewportHeight() : Math.round(window.innerHeight);
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
  return window.matchMedia("(max-width: 720px)").matches;
}

function isDesktopPatternsViewport() {
  return window.matchMedia("(min-width: 981px)").matches;
}

function isMobilePatternsVisible() {
  if (!isMobileViewport() || isDesktopPatternsViewport()) return false;
  const profileView = $("profileView");
  return Boolean(profileView && !profileView.classList.contains("hidden"));
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
  if (!isMobileViewport()) return false;
  if (!document.body.classList.contains("focus-mode")) return false;
  document.documentElement.classList.add("focus-mode-layout-snap");
  syncViewportHeightVar();
  syncKeyboardOpenClass();
  document.body.classList.remove("keyboard-open");
  document.body.classList.remove("focus-mode");
  document.body.classList.remove("expanded-field");
  state.isExpandedField = false;
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
  const showReflection =
    state.submitted && !state.calibrationPostRun ? state.lastRunFeedback : "";
  renderReflection(showReflection);
}

function setFocusMode(enabled) {
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
    const showReflectionLine =
      state.submitted && !state.calibrationPostRun ? state.lastRunFeedback : "";
    renderReflection(showReflectionLine);
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
  syncViewportHeightVar();
  document.body.classList.remove("focus-mode", "expanded-field", "keyboard-open", "patterns-open");
  document.documentElement.classList.remove("focus-mode-layout-snap");
  state.isExpandedField = false;
  syncPatternsLayoutMode();
  renderProfile();
  syncExpandedFieldClass();
}

let viewportSyncRaf = null;
let viewportSyncCoalescePending = false;
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
function syncEditorCalibrationOverlayClip() {
  const overlay = $("editorOverlay");
  if (!overlay) return;
  const isCalib =
    overlay.classList.contains("editor-overlay--calibration") &&
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

function scheduleCalibrationOverlayGeometrySync() {
  requestAnimationFrame(() => {
    syncEditorCalibrationOverlayClip();
    requestAnimationFrame(() => syncEditorCalibrationOverlayClip());
  });
}

function queueViewportSync() {
  logPatternsTransitionSnapshot("queueViewportSync:requested", {
    alreadyQueued: viewportSyncRaf !== null
  });
  if (viewportSyncRaf !== null) {
    viewportSyncCoalescePending = true;
    return;
  }
  viewportSyncRaf = requestAnimationFrame(() => {
    logPatternsTransitionSnapshot("queueViewportSync:raf-start");
    viewportSyncRaf = null;
    try {
      syncViewportHeightVar();
      syncKeyboardOpenClass();
      syncEditorShellChamferEdge();
      syncEditorCalibrationOverlayClip();
      if (!isMobileViewport()) setFocusMode(false);
      syncPatternsLayoutMode();
      renderHistory();
      syncSubmittedAnnotatedEditorSurfaces();
      scheduleEditorDotOverlaySync();
      renderProfileSummaryStrip();
      logPatternsTransitionSnapshot("queueViewportSync:raf-after-sync");
    } finally {
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

let postSubmitAutoRunTimer = null;

function clearPostSubmitAutoRunTimer() {
  if (postSubmitAutoRunTimer != null) {
    clearTimeout(postSubmitAutoRunTimer);
    postSubmitAutoRunTimer = null;
  }
}

function runPostSubmitAutoNewRunNow() {
  clearPostSubmitAutoRunTimer();
  document.querySelector(".editor-shell")?.classList.remove("editor-shell--submit-complete");
  if (state.optionsOpen) return;
  if (!state.submitted || !state.completedUiActive) return;
  startWriting({ focusCaret: "start" });
}

/** After submit: shell completion pulse only (post-run UI stays until the user begins again). */
function pulseEditorShellAfterSubmit() {
  clearPostSubmitAutoRunTimer();
  const shell = document.querySelector(".editor-shell");
  shell?.classList.add("editor-shell--submit-complete");

  scheduleEditorDotOverlaySync();
  requestAnimationFrame(() => {
    scheduleEditorDotOverlaySync();
  });
}

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

/** Supported semantic ids; stable merge / render order (must match CSS .editor-token-dot--* / .annotation-dot--*). */
const SEMANTIC_FLAG_IDS = ["filler", "repetition", "opening", "challenge"];

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

const WAYWORD_SUBMITTED_ANNOTATED_TYPOGRAPHY_STYLE_ID =
  "wayword-submitted-annotated-typography";

/**
 * Submitted + semantic dots: inject a late document `<style>` with `#editorInput` / `#highlightLayer`
 * rules so nothing in the cascade (focus, media queries) can override. Inline styles were still
 * ineffective for some users; ID selectors + last stylesheet win.
 */
function syncSubmittedAnnotatedEditorSurfaces() {
  const on =
    state.active &&
    state.submitted &&
    state.completedUiActive &&
    writeDocHasAnySemanticFlags();

  const existing = document.getElementById(WAYWORD_SUBMITTED_ANNOTATED_TYPOGRAPHY_STYLE_ID);
  if (!on) {
    existing?.remove();
    return;
  }

  const narrow =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 680px)").matches;
  const fontSize = narrow ? "17px" : "18px";
  const padTop = narrow ? "16px" : "20px";
  const padInline = narrow ? "18px" : "28px";
  const padBottom = narrow ? "72px" : "80px";

  let style = existing;
  if (!style) {
    style = document.createElement("style");
    style.id = WAYWORD_SUBMITTED_ANNOTATED_TYPOGRAPHY_STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
#editorInput.editor-input,
#highlightLayer.highlight-layer {
  font-family: Georgia, "Times New Roman", serif !important;
  font-size: ${fontSize} !important;
  font-weight: 400 !important;
  font-style: normal !important;
  line-height: 4.25 !important;
  letter-spacing: normal !important;
  padding: ${padTop} ${padInline} ${padBottom} !important;
}
`;
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

/** DOM read for flush: must match actual text nodes (preserves trailing spaces). `innerText` strips trailing whitespace and breaks the token round-trip. */
function getEditorSurfaceRawText(root) {
  if (!root) return "";
  return String(root.textContent ?? "").replace(/\r/g, "");
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
  if (!root) return 0;
  if (node === root) {
    let total = 0;
    for (let i = 0; i < Math.min(offsetInNode, root.childNodes.length); i++) {
      const c = root.childNodes[i];
      if (c && c.nodeType === Node.TEXT_NODE) total += c.textContent.length;
    }
    return total;
  }
  let total = 0;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walk.nextNode())) {
    const len = n.textContent.length;
    if (n === node) return total + Math.min(Math.max(0, offsetInNode), len);
    total += len;
  }
  return total;
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
  editorInput.replaceChildren(document.createTextNode(canonical));
  if (typeof anchor === "number" && typeof focus === "number") {
    setSelectionOffsetsForEditorRoot(editorInput, anchor, focus, Boolean(backward));
  }
  editorInput.classList.toggle("is-empty", !canonical.trim());
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
  scheduleEditorDotOverlaySync();
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
  scheduleEditorDotOverlaySync();
}

function focusEditorToEnd() {
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
  setTimeout(() => {
    if (focusCaret === "start") {
      focusEditorToStart();
    } else {
      focusEditorToEnd();
    }
  }, 50);
}

function enterLandingState() {
  const shell = document.querySelector(".app-shell");
  const app = $("appView");
  shell?.classList.add("app-shell--landing");
  shell?.classList.remove("app-shell--landing-out");
  $("landingView")?.classList.remove("hidden");
  app?.setAttribute("aria-hidden", "true");
}

let landingToAppExitTimer = null;

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
    shell.classList.remove("app-shell--landing", "app-shell--landing-out");
    landing.classList.add("hidden");
    app.removeAttribute("aria-hidden");
    showProfile(false);
    setOptionsOpen(false);
    afterEnter?.();
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
const OPTIONS_PANEL_DISMISS_GUARD_MS = 380;
let optionsPanelDismissGuardUntil = 0;
const RECENT_DRAWER_DISMISS_GUARD_MS = 260;
let recentDrawerDismissGuardUntil = 0;

let bannedPanelPersistTimer = null;
const BANNED_PANEL_DEBOUNCE_MS = 220;

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
  if (bannedPanelPersistTimer != null) clearTimeout(bannedPanelPersistTimer);
  bannedPanelPersistTimer = window.setTimeout(() => {
    bannedPanelPersistTimer = null;
    flushBannedPanelPersistFromPanel();
  }, BANNED_PANEL_DEBOUNCE_MS);
}

function applyWordTargetFromPanel(nextWords) {
  const n = Number(nextWords);
  if (!Number.isFinite(n) || ![60, 75, 90].includes(n)) return;
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
  const n = Number(nextSeconds);
  if (!Number.isFinite(n) || ![60, 180, 300].includes(n)) return;
  state.timerSeconds = state.timerSeconds === n ? 0 : n;
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

function afterOptionsPanelClosed() {
  if (!isMobileViewport()) return;
  if (!document.body.classList.contains("focus-mode")) return;
  if (!state.active || state.submitted || !editorInput) return;
  if (state.optionsOpen) return;
  if (document.activeElement === editorInput) return;
  focusEditorToEnd();
}

function setOptionsOpen(open) {
  const wasOpen = state.optionsOpen;
  state.optionsOpen = open;

  const panel = $("editorOptionsPanel");
  const backdrop = $("editorOptionsBackdrop");
  if (!panel) return;
  document.body.classList.toggle("settings-open", open);

  if (open) {
    optionsPanelDismissGuardUntil = Date.now() + OPTIONS_PANEL_DISMISS_GUARD_MS;
    if (bannedPanelPersistTimer != null) {
      clearTimeout(bannedPanelPersistTimer);
      bannedPanelPersistTimer = null;
    }

    setActiveModeButton("wordModesPanel", "words", state.targetWords);
    setActiveModeButton("timeModesPanel", "time", state.timerSeconds);

    const input = $("bannedInlineInputPanel");
    if (input && document.activeElement !== input) {
      input.value = state.banned.join(", ");
    }
    requestAnimationFrame(() => {
      const livePanel = $("editorOptionsPanel");
      if (!livePanel || !state.optionsOpen) return;
      const lockWidth = Math.round(livePanel.getBoundingClientRect().width);
      if (lockWidth > 0) {
        livePanel.style.width = `${lockWidth}px`;
        livePanel.style.maxWidth = `${lockWidth}px`;
      }
    });
  } else {
    optionsPanelDismissGuardUntil = 0;
    flushBannedPanelPersistFromPanel();
    panel.style.removeProperty("width");
    panel.style.removeProperty("max-width");
  }

  panel.setAttribute("aria-hidden", open ? "false" : "true");
  if (backdrop) {
    backdrop.classList.toggle("hidden", !open);
    backdrop.setAttribute("aria-hidden", open ? "false" : "true");
  }

  if (!open && wasOpen) {
    requestAnimationFrame(() => {
      afterOptionsPanelClosed();
    });
  }
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("wayword-theme", theme);
}

function toggleTheme() {
  applyTheme(state.theme === "light" ? "dark" : "light");
}

function completedRuns() {
  return state.history.length;
}

function countCalibrationSentenceLikeUnits(text) {
  const raw = String(text || "").trim();
  if (!raw) return 0;
  return raw
    .split(/[.!?]+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => (s.match(/\b\w+\b/g) || []).length >= 3).length;
}

/** True when submission has enough text for calibration observation / step advance. */
function calibrationSubmissionHasMinimumSignal(text, analysis) {
  const words = Math.max(0, Number(analysis?.totalWords) || 0);
  if (words >= CALIBRATION_MIN_WORDS) return true;
  return countCalibrationSentenceLikeUnits(text) >= CALIBRATION_MIN_SENTENCE_UNITS;
}

function hasProfileSignal() {
  return completedRuns() >= CALIBRATION_THRESHOLD;
}

/** WAYWORD_DEV_CALIBRATION_RESET — local/testing only; not for production UX. */
function waywordDevResetCalibrationForTesting() {
  state.history = [];
  state.savedRunIds = new Set();
  state.calibrationPostRun = null;
  state.lastRunFeedback = "";
  state.lastMirrorPipelineResult = null;
  state.lastMirrorLoadFailed = false;
  state.pendingRecentDrawerExpand = false;
  localStorage.removeItem(INACTIVITY_EASE_RUN_KEY);

  state.progressionLevel = 1;
  persistProgressionLevel();
  persist();

  const fb = $("feedbackBox");
  if (fb) {
    fb.dataset.calibrationRenderKey = "";
    fb.className = "result-card empty";
    fb.innerHTML = "";
  }
  $("editorOverlay")?.classList.add("hidden");

  state.submitted = false;
  state.completedUiActive = false;

  recomputeProgressionLevel({});
  applyProgressionToState();

  if (state.active) {
    startWriting();
  } else {
    renderMeta();
    renderReflection("");
    renderPostRunFeedbackContainer();
    if (editorInput) {
      renderWritingState();
      renderHighlight();
      scheduleEditorDotOverlaySync();
    }
    renderSidebar();
    updateEnterButtonVisibility();
  }

  renderHistory();
  renderCalibration();
  renderProfileSummaryStrip();
  renderProfile();
  queueViewportSync();
}

function persist() {
  localStorage.setItem("wayword-history", JSON.stringify(state.history));
  localStorage.setItem("wayword-runids", JSON.stringify(Array.from(state.savedRunIds)));
}

function clampProgressionLevel(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 1;
  return Math.min(3, Math.max(1, Math.floor(x)));
}

function loadStoredProgressionLevel() {
  return clampProgressionLevel(Number(localStorage.getItem(PROGRESSION_LEVEL_KEY)) || 1);
}

function persistProgressionLevel() {
  localStorage.setItem(PROGRESSION_LEVEL_KEY, String(state.progressionLevel));
}

function getProgressionConfig(level) {
  return PROGRESSION_LEVELS[clampProgressionLevel(level) - 1];
}

function applyProgressionToState() {
  const cfg = getProgressionConfig(state.progressionLevel);
  state.targetWords = cfg.targetWords;
  state.timerSeconds = cfg.timerSeconds;
}

function recomputeProgressionLevel(options = {}) {
  const sessionInit = Boolean(options.sessionInit);
  const afterRun = Boolean(options.afterRun);
  let level = clampProgressionLevel(state.progressionLevel);

  const runs = state.history
    .slice()
    .sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));

  if (sessionInit && runs.length) {
    const newest = runs[runs.length - 1];
    const age = Date.now() - (newest.savedAt || 0);
    if (age > 7 * 86400000) {
      const marker = localStorage.getItem(INACTIVITY_EASE_RUN_KEY);
      if (marker !== newest.runId) {
        level = Math.max(1, level - 1);
        localStorage.setItem(INACTIVITY_EASE_RUN_KEY, newest.runId);
      }
    }
  }

  if (afterRun) {
    const last5 = runs.slice(-5);
    if (last5.length === 5) {
      const succ5 = last5.filter((r) => r.wasSuccessful === true).length;
      if (succ5 < 2) level = Math.max(1, level - 1);
    }

    const last8 = runs.slice(-8);
    const succ8 = last8.filter((r) => r.wasSuccessful === true).length;
    if (succ8 >= 5 && level < 3) level = Math.min(3, level + 1);
  }

  const prev = state.progressionLevel;
  state.progressionLevel = clampProgressionLevel(level);
  persistProgressionLevel();

  return { changed: prev !== state.progressionLevel, prevLevel: prev };
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

function generatePrompt() {
  const families = Object.keys(promptFamilies);
  let family = families[Math.floor(Math.random() * families.length)];
  let options = promptFamilies[family];
  let prompt = options[Math.floor(Math.random() * options.length)];
  let key = `${family}::${prompt}`;

  while (key === state.lastPromptKey && families.length > 1) {
    family = families[Math.floor(Math.random() * families.length)];
    options = promptFamilies[family];
    prompt = options[Math.floor(Math.random() * options.length)];
    key = `${family}::${prompt}`;
  }

  state.lastPromptKey = key;
  state.promptFamily = family;
  return prompt;
}

function makeRunId() {
  return "run_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function updateEnterButtonVisibility() {
  const btn = $("enterSubmitBtn");
  if (!btn || !editorInput) return;

  const hasText = getEditorText().trim().length > 0;
  const canShow = state.active && !state.submitted;

  btn.classList.toggle("hidden", !(hasText && canShow));
}

function canRerollPrompt() {
  return (
    state.active &&
    !state.submitted &&
    !getEditorText().trim() &&
    state.promptRerollsUsed < PROMPT_REROLL_LIMIT
  );
}

function rerollPrompt() {
  if (!canRerollPrompt()) return;

  state.prompt = generatePrompt();
  state.promptRerollsUsed += 1;

  renderMeta();

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

function onPromptClusterControlPointerDown(e) {
  e.preventDefault();
  e.stopPropagation();
}

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
  const t = e.target;
  if (t instanceof Element && t.closest("#promptRerollBtn")) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  runFieldExpandedToggleAction();
}

function bindPromptClusterControlsOnce() {
  const reroll = $("promptRerollBtn");
  if (reroll) {
    reroll.removeEventListener("pointerdown", onPromptClusterControlPointerDown);
    reroll.addEventListener("pointerdown", onPromptClusterControlPointerDown);
    reroll.removeEventListener("click", rerollPrompt);
    reroll.removeEventListener("click", onPromptRerollControlClick);
    reroll.addEventListener("click", onPromptRerollControlClick);
  }
  const field = $("fieldExpandedToggle");
  if (field) {
    field.removeEventListener("pointerdown", onPromptClusterControlPointerDown);
    field.addEventListener("pointerdown", onPromptClusterControlPointerDown);
    field.removeEventListener("click", onFieldExpandedControlClick);
    field.addEventListener("click", onFieldExpandedControlClick);
  }
}

/** Keep reroll DOM minimal: icon in button, count via `data-rerolls` pseudo-element. */
function normalizePromptRerollButtonIfNeeded() {
  const btn = $("promptRerollBtn");
  if (!btn) return;
  const targetLeftGroup =
    btn.closest(".prompt-meta-left") ||
    document.querySelector("#promptCard .prompt-meta-left");
  if (targetLeftGroup) {
    const slot = $("promptRerollSlot");
    if (slot && btn.parentElement === slot) {
      targetLeftGroup.appendChild(btn);
      slot.remove();
    }
    if (btn.parentElement !== targetLeftGroup) {
      targetLeftGroup.appendChild(btn);
    }
  }

  if (!btn.querySelector(".prompt-reroll-icon")) {
    btn.innerHTML = `<span class="prompt-reroll-icon" aria-hidden="true">✎</span>`;
  }
  if (!btn.dataset.rerolls) btn.dataset.rerolls = String(PROMPT_REROLL_LIMIT);
}

function ensurePromptRerollButton() {
  const promptCard = $("promptCard");
  let btn = $("promptRerollBtn");

  if (!promptCard) return;

  promptCard.classList.add("has-reroll");

  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "promptRerollBtn";
    btn.className = "prompt-reroll-btn";
    btn.setAttribute("aria-label", "Get a different prompt");
    btn.dataset.rerolls = String(PROMPT_REROLL_LIMIT);
    btn.innerHTML = `<span class="prompt-reroll-icon" aria-hidden="true">✎</span>`;
    const leftGroup = promptCard.querySelector(".prompt-meta-left");
    if (leftGroup) {
      leftGroup.appendChild(btn);
    } else {
      promptCard.appendChild(btn);
    }
  }

  normalizePromptRerollButtonIfNeeded();
  bindPromptClusterControlsOnce();
}

/* -----------------------------
   progress + timer UI
----------------------------- */

function updateWordProgress() {
  const fill = $("editorProgressFill");
  const progressRoot = fill?.closest(".editor-progress");
  if (!fill) return;

  const words = state.active ? tokenize(getEditorText()).length : 0;

  if (!state.targetWords) {
    fill.style.width = "0%";
    fill.style.background = "var(--ink)";
    progressRoot?.classList.toggle("editor-progress--empty", words === 0);
    progressRoot?.classList.add("editor-progress--no-target");
    progressRoot?.setAttribute("data-phase", "none");
    return;
  }

  const target = state.targetWords;
  const clampedPercent = Math.min((words / target) * 100, 100);
  fill.style.width = `${clampedPercent}%`;
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

function scoreDeductionFromIncidentCount(n) {
  const c = Math.max(0, Math.floor(Number(n)) || 0);
  if (c <= 0) return 25;
  if (c === 1) return 22;
  if (c === 2) return 19;
  if (c === 3) return 16;
  if (c === 4) return 13;
  return 10;
}

function scoreCompletionFromTargetRatio(totalWords, activeTargetWords) {
  const words = Math.max(0, Number(totalWords) || 0);
  const target = Math.max(1, Number(activeTargetWords) || 1);
  const ratio = words / target;
  if (ratio >= 1) return { completion: 25, completionMultiplier: 1.0 };
  if (ratio >= 0.75) return { completion: 20, completionMultiplier: 0.85 };
  if (ratio >= 0.5) return { completion: 15, completionMultiplier: 0.6 };
  if (ratio >= 0.25) return { completion: 10, completionMultiplier: 0.35 };
  return { completion: 5, completionMultiplier: 0.1 };
}

function runScoreSampleCapFromWordCount(totalWords) {
  const w = Math.max(0, Math.floor(Number(totalWords) || 0));
  if (w <= 4) return 5;
  if (w <= 9) return 10;
  if (w <= 14) return 15;
  return 100;
}

function computeRunScoreV1(analysis, repeatLimit, activeTargetWords) {
  const limit = Math.max(1, Number(repeatLimit) || 1);
  const targetForScore = Math.max(1, Number(activeTargetWords) || 1);

  const fillerIncidents = analysis.bannedHits
    .filter((item) => !item.isExercise)
    .reduce((sum, item) => sum + item.count, 0);
  const repetitionIncidents = analysis.repeated.reduce(
    (sum, [, count]) => sum + Math.max(0, count - limit),
    0
  );
  const openingsIncidents = analysis.repeatedStarters.reduce(
    (sum, [, count]) => sum + Math.max(0, count - 1),
    0
  );

  const { completion, completionMultiplier } = scoreCompletionFromTargetRatio(
    analysis.totalWords,
    targetForScore
  );
  const filler = scoreDeductionFromIncidentCount(fillerIncidents);
  const repetition = scoreDeductionFromIncidentCount(repetitionIncidents);
  const openings = scoreDeductionFromIncidentCount(openingsIncidents);
  const constraintRaw = filler + repetition + openings;
  const runScorePreCap = Math.min(100, completion + Math.round(completionMultiplier * constraintRaw));
  const runScore = Math.min(runScorePreCap, runScoreSampleCapFromWordCount(analysis.totalWords));
  const scoreBreakdown = {
    completion,
    filler,
    repetition,
    openings,
    completionMultiplier
  };
  return { runScore, scoreBreakdown };
}

function analyze(text) {
  const tokens = tokenize(text);
  const counts = countWords(tokens);
  const totalWords = tokens.length;
  const uniqueCount = Object.keys(counts).length;

  const repeated = Object.entries(counts)
    .filter(([word, count]) => !exemptWords.has(word) && count > state.repeatLimit)
    .sort((a, b) => b[1] - a[1]);

  const exerciseWordsSet = new Set(state.exerciseWords);
  const effectiveBanned = [...new Set([...state.banned, ...state.exerciseWords])];

  const bannedHits = effectiveBanned
    .map(word => ({ word, count: counts[word] || 0, isExercise: exerciseWordsSet.has(word) }))
    .filter(item => item.count > 0);

  const starters = sentenceStarters(text);
  const starterCounts = countWords(starters);
  const repeatedStarters = Object.entries(starterCounts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  const targetDelta = state.targetWords ? totalWords - state.targetWords : totalWords;

  const uniqueRatio = totalWords ? uniqueCount / totalWords : 0;
  const sentences = String(text || "").split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const avgSentenceLength = sentences.length ? totalWords / sentences.length : 0;
  const perspective = countPerspective(tokens);
  const punctuation = countPunctuation(text);
  const starterExampleList = sentenceStarterExamples(text);

  return {
    tokens,
    counts,
    totalWords,
    uniqueCount,
    repeated,
    bannedHits,
    repeatedStarters,
    targetDelta,
    starterCounts,
    uniqueRatio,
    avgSentenceLength,
    perspective,
    punctuation,
    starterExampleList
  };
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
  if (!highlightLayer || !editorInput) return;
  if (highlightLayer.classList.contains("hidden")) return;
  highlightLayer.scrollTop = editorInput.scrollTop;
  highlightLayer.scrollLeft = editorInput.scrollLeft;
}

function renderHighlight() {
  if (highlightLayer) highlightLayer.innerHTML = "";
  syncScroll();
}

let editorDotOverlayRaf = null;

/** Coalesced geometry pass: writeDoc + Range rects only; never mutates text or writeDoc. */
function scheduleEditorDotOverlaySync() {
  if (editorDotOverlayRaf !== null) return;
  editorDotOverlayRaf = requestAnimationFrame(() => {
    editorDotOverlayRaf = null;
    syncEditorDotOverlay();
  });
}

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

/** Must match `.editor-token-dot` width and `.editor-token-dot-group` gap in CSS. */
const EDITOR_SEMANTIC_DOT_PX = 6;
const EDITOR_SEMANTIC_DOT_GAP_PX = 4;

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

  if (editorInput) {
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
  if (live !== canon) {
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
  const overlayH = oRect.height;
  const submittedAnnotatedSpacing =
    state.submitted &&
    state.completedUiActive &&
    writeDocHasAnySemanticFlags();
  /* Submitted annotated: gap below glyph/line rect before dot row; keep in sync with CSS line-height slack. */
  const gapBelowAnchorPx = submittedAnnotatedSpacing ? 20 : 5;
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
      if (!range || range.end > live.length) continue;

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
        const topClamped = submittedAnnotatedSpacing
          ? Math.max(0, top)
          : Math.max(0, Math.min(overlayH - bottomReservePx, top));

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
  if (semanticPickerRaf !== null) return;
  semanticPickerRaf = requestAnimationFrame(() => {
    semanticPickerRaf = null;
    updateEditorSemanticPickerFromSelection();
  });
}

function hideEditorSemanticPicker() {
  editorSemanticPicker?.classList.add("hidden");
}

/**
 * Phase 3 Step 2: show a minimal picker when selection is exactly one token (canonical offsets).
 * Geometry from Range only; semantics from writeDoc mapping only.
 */
function updateEditorSemanticPickerFromSelection() {
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

  if (tn.textContent !== serializeWriteDoc(state.writeDoc)) {
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

const BOTTOM_CHROME_CALIBRATION_HIDE_MS = 200;
let bottomChromeCalibrationSettleTimer = null;

function clearBottomChromeCalibrationSettleTimer() {
  if (bottomChromeCalibrationSettleTimer != null) {
    window.clearTimeout(bottomChromeCalibrationSettleTimer);
    bottomChromeCalibrationSettleTimer = null;
  }
}

/** Fade + slight drift for gear + progress when calibration overlay is up (not display:none). */
function syncEditorBottomChromeForCalibrationOverlay() {
  const overlay = $("editorOverlay");
  const gear = $("optionsTrigger");
  const progress = document.querySelector(".editor-bottom-chrome-center .editor-progress");
  if (!overlay || !gear || !progress) return;

  const hide =
    !overlay.classList.contains("hidden") && overlay.classList.contains("editor-overlay--calibration");

  if (hide) {
    clearBottomChromeCalibrationSettleTimer();
    gear.classList.remove("ui-hidden--settled");
    progress.classList.remove("ui-hidden--settled");
    gear.style.removeProperty("display");
    progress.style.removeProperty("display");
    gear.classList.add("ui-hidden");
    progress.classList.add("ui-hidden");
    bottomChromeCalibrationSettleTimer = window.setTimeout(() => {
      bottomChromeCalibrationSettleTimer = null;
      if (
        !overlay.classList.contains("hidden") &&
        overlay.classList.contains("editor-overlay--calibration")
      ) {
        gear.classList.add("ui-hidden--settled");
        progress.classList.add("ui-hidden--settled");
      }
    }, BOTTOM_CHROME_CALIBRATION_HIDE_MS);
    return;
  }

  clearBottomChromeCalibrationSettleTimer();
  gear.classList.remove("ui-hidden--settled", "ui-hidden");
  progress.classList.remove("ui-hidden--settled", "ui-hidden");
  gear.style.removeProperty("display");
  progress.style.removeProperty("display");
}

/** Post-submit overlay: calibration (runs 1–5) inside editor shell, or “Begin again”. */
function syncEditorPostRunOverlay() {
  try {
    const overlay = $("editorOverlay");
    const card = $("editorOverlayCard");
    if (!overlay || !card) {
      return;
    }

    if (!state.active || !state.submitted || !state.completedUiActive) {
      overlay.classList.add("hidden");
      overlay.classList.remove("editor-overlay--calibration");
      card.className = "editor-overlay-card";
      card.textContent = "";
      card.innerHTML = "";
      card.removeAttribute("data-calibration-overlay-key");
      overlay.style.removeProperty("clip-path");
      overlay.style.removeProperty("-webkit-clip-path");
      scheduleCalibrationOverlayGeometrySync();
      return;
    }

    if (state.calibrationPostRun) {
      const { step, observation, insufficient } = state.calibrationPostRun;
      const ins = insufficient ? "1" : "0";
      const key = `${step}|${ins}|${observation}`;
      if (card.dataset.calibrationOverlayKey === key) {
        overlay.classList.remove("hidden");
        scheduleCalibrationOverlayGeometrySync();
        return;
      }
      card.dataset.calibrationOverlayKey = key;
      overlay.classList.add("editor-overlay--calibration");
      overlay.classList.remove("hidden");
      card.className = "editor-overlay-card editor-overlay-card--calibration";
      const pct = Math.min(100, Math.round((step / CALIBRATION_THRESHOLD) * 100));
      const mod = insufficient ? " editor-overlay-calibration--insufficient" : "";
      card.innerHTML = `
      <div class="editor-overlay-calibration${mod}" role="dialog" aria-labelledby="editorCalibProgress">
        <div class="editor-overlay-calibration-head">
          <span class="editor-overlay-calibration-label">Calibration</span>
          <span id="editorCalibProgress" class="editor-overlay-calibration-progress">${step} of ${CALIBRATION_THRESHOLD}</span>
        </div>
        <div class="editor-overlay-calibration-meter-wrap">
          <div class="editor-overlay-calibration-meter" role="presentation">
            <div class="editor-overlay-calibration-meter-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <p class="editor-overlay-calibration-observation" aria-live="polite">${escapeHtml(observation)}</p>
      </div>`;
      scheduleCalibrationOverlayGeometrySync();
      return;
    }

    card.removeAttribute("data-calibration-overlay-key");
    overlay.classList.remove("editor-overlay--calibration");
    card.className = "editor-overlay-card";
    card.innerHTML = "";
    card.textContent = "";
    overlay.classList.add("hidden");
    overlay.style.removeProperty("clip-path");
    overlay.style.removeProperty("-webkit-clip-path");
    scheduleCalibrationOverlayGeometrySync();
  } finally {
    renderProfileSummaryStrip();
    syncEditorBottomChromeForCalibrationOverlay();
  }
}

function prefersReducedUiMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {
    return false;
  }
}

function isRecentDrawerOpen() {
  return Boolean(document.body?.classList.contains("recent-drawer-open"));
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
  updateEnterButtonVisibility();
}
function renderMeta() {
  const promptCard = $("promptCard");
  const promptText = $("promptText");
  const promptFamily = $("promptFamilyLabel");
  const bannedPill = $("bannedPill");
  const bannedInlineInputPanel = $("bannedInlineInputPanel");

  if (promptCard) promptCard.classList.toggle("hidden", !state.active);
  if (promptText) promptText.textContent = state.prompt || "";
  if (promptFamily) promptFamily.textContent = state.promptFamily || "Prompt";

  if (bannedPill) {
    const bannedText = state.banned.length ? state.banned.join(", ") : "none";
    bannedPill.textContent = `avoid: ${bannedText}`;
  }

  if (bannedInlineInputPanel && document.activeElement !== bannedInlineInputPanel) {
    bannedInlineInputPanel.value = state.banned.join(", ");
  }

  renderExerciseBanner();

  setActiveModeButton("wordModes", "words", state.targetWords);
  setActiveModeButton("timeModes", "time", state.timerSeconds);
  setActiveModeButton("wordModesPanel", "words", state.targetWords);
  setActiveModeButton("timeModesPanel", "time", state.timerSeconds);

  updateWordProgress();
  updateTimeFill();
  updateEnterButtonVisibility();

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

/** Calibration progress lives in the in-editor overlay only; this keeps header chrome in sync. */
function renderCalibration() {
  const runs = completedRuns();
  const profileBtn = $("profileBtn");
  if (profileBtn) {
    profileBtn.classList.add("hidden");
  }

  const styleTab = $("styleTab");
  if (styleTab) {
    styleTab.classList.toggle("hidden", runs < CALIBRATION_THRESHOLD);
  }
}

function renderWritingState(options = {}) {
  if (!editorInput) return;

  const deferPostRunOverlaySync = Boolean(options.deferPostRunOverlaySync);

  const isLocked = !state.active || state.submitted;

  editorInput.setAttribute("contenteditable", isLocked ? "false" : "true");
  editorInput.setAttribute(
    "data-placeholder",
    state.active && !state.submitted && !getEditorText().trim()
      ? "Start typing here..."
      : ""
  );
  editorInput.classList.toggle("is-empty", !getEditorText().trim());

  updateSubmitButtonState();
  updateWordProgress();
  updateTimeFill();
  renderAnnotationRow();
  const showReflection =
    state.submitted && !state.calibrationPostRun ? state.lastRunFeedback : "";
  renderReflection(showReflection);
  renderPostRunFeedbackContainer();
  renderMirrorReflectionPanel();
  if (!deferPostRunOverlaySync) {
    syncEditorPostRunOverlay();
  }
  renderCalibration();
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
}

function setSemanticLegendPillState(pillEl, count) {
  if (!pillEl) return;
  const c = Math.max(0, Math.floor(Number(count)) || 0);
  const countEl = pillEl.querySelector(".legend-count");
  if (countEl) countEl.textContent = String(c);
  pillEl.classList.toggle("legend-pill--inactive", c === 0);
}

function renderLegend(analysis) {
  const bluePill = $("exerciseLegendPill");
  const fillerPill = $("legendPillFiller");
  const repetitionPill = $("legendPillRepetition");
  const openingPill = $("legendPillOpening");

  if (!state.active || !analysis) {
    setSemanticLegendPillState(fillerPill, 0);
    setSemanticLegendPillState(repetitionPill, 0);
    setSemanticLegendPillState(openingPill, 0);
    if ($("legendChallengeCount")) $("legendChallengeCount").textContent = "0";
    if (bluePill && !state.exerciseWords.length) bluePill.classList.add("hidden");
    return;
  }

  const sem = countWriteDocSemanticFlagsOnTokens();
  setSemanticLegendPillState(fillerPill, sem.filler);
  setSemanticLegendPillState(repetitionPill, sem.repetition);
  setSemanticLegendPillState(openingPill, sem.opening);

  const blueCount = analysis.bannedHits.filter(i => i.isExercise).reduce((sum, item) => sum + item.count, 0);
  if ($("legendChallengeCount")) $("legendChallengeCount").textContent = blueCount;

  if (bluePill) {
    if (state.exerciseWords.length) bluePill.classList.remove("hidden");
    else bluePill.classList.add("hidden");
  }
}

function renderSidebar() {
  renderLegend(state.active ? analyze(getEditorText()) : null);
  renderRunScoreStrip();
}

function renderRunScoreStrip() {
  const section = $("runScoreSection");
  const el = $("runScoreSummary");
  if (!section || !el) return;

  if (!state.active || !state.submitted) {
    section.classList.add("hidden");
    el.textContent = "";
    return;
  }

  if (state.calibrationPostRun) {
    section.classList.add("hidden");
    el.textContent = "";
    return;
  }

  const analysis = analyze(getEditorText());
  const { runScore } = computeRunScoreV1(
    analysis,
    state.repeatLimit,
    getActiveTargetWordsForScoring()
  );
  el.textContent = `Run score: ${runScore}`;
  section.classList.remove("hidden");
}

function getRecentEntries() {
  return state.history.map((entry) => ({ text: String(entry?.text || "") }));
}

function analyzeText(text) {
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
  const repetitionWords = raw.toLowerCase().match(/\b\w{4,}\b/g) || [];
  for (const word of repetitionWords) {
    repetitions[word] = (repetitions[word] || 0) + 1;
  }
  let repetitionCount = 0;
  let maxRepeat4 = 0;
  for (const count of Object.values(repetitions)) {
    maxRepeat4 = Math.max(maxRepeat4, count);
    if (count > 1) repetitionCount += 1;
  }

  return {
    avgSentenceLength,
    fragmentCount,
    repetitionCount,
    maxRepeat4,
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
    const metrics = analyzeText(String(entry?.text || ""));
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

const CALIBRATION_OBS_REPETITION = [
  "You repeat certain words.",
  "One word appears often.",
  "You return to the same word."
];
const CALIBRATION_OBS_OPENINGS = [
  "You start lines the same way.",
  "Your openings are similar.",
  "You reuse the same start."
];
const CALIBRATION_OBS_FRAGMENTATION = ["Your lines are short.", "You break your thoughts up."];
const CALIBRATION_OBS_LONG = [
  "Average sentence length sits above your recent baseline.",
  "Sentences run longer than in your last few saved runs."
];
const CALIBRATION_OBS_FALLBACK = ["This is steady.", "Your structure is consistent.", "No strong change."];

function pickCalibrationObservationPhrase(phrases, seed) {
  if (!phrases.length) return "";
  const i = Math.abs(Math.floor(seed)) % phrases.length;
  return phrases[i];
}

/**
 * Calibration observation: one plain line, dominant signal only (repetition → openings → fragmentation → long sentences → fallback).
 */
function selectCalibrationObservation(text, priorEntries) {
  const raw = String(text || "").trim();
  const t = analyzeText(raw);
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

  const repetitionApplies =
    (t.totalWords || 0) >= minWordsForLexical &&
    (t.repetitionCount >= 2 || (t.repetitionCount >= 1 && t.maxRepeat4 >= 4));

  if (repetitionApplies) {
    if (t.repetitionCount === 1 && t.maxRepeat4 >= 5) return "One word appears often.";
    if (t.repetitionCount >= 3 || t.maxRepeat4 >= 6) return "You repeat certain words.";
    if (t.repetitionCount === 1) return "You return to the same word.";
    if (t.repetitionCount === 2) return pickCalibrationObservationPhrase(CALIBRATION_OBS_REPETITION, seed);
    return pickCalibrationObservationPhrase(CALIBRATION_OBS_REPETITION, seed);
  }

  const openingsApplies =
    (t.totalWords || 0) >= minWordsForLexical &&
    sentenceCount >= 2 &&
    openingIncidents >= 1;

  if (openingsApplies) {
    return pickCalibrationObservationPhrase(CALIBRATION_OBS_OPENINGS, seed);
  }

  const baselineOk = baseline && baseline.sampleSize >= 2;
  const fragmentationApplies =
    t.fragmentCount >= 3 ||
    (t.fragmentCount >= 2 && t.avgSentenceLength < 12) ||
    (baselineOk &&
      t.fragmentCount >= 2 &&
      t.fragmentCount > baseline.fragmentCount * 1.22);

  if (fragmentationApplies) {
    return pickCalibrationObservationPhrase(CALIBRATION_OBS_FRAGMENTATION, seed);
  }

  const longApplies =
    (baselineOk &&
      t.avgSentenceLength >= 12 &&
      t.avgSentenceLength > baseline.avgSentenceLength * 1.28) ||
    (t.avgSentenceLength >= 20 && t.fragmentCount <= 1);

  if (longApplies) {
    return baselineOk && t.avgSentenceLength > baseline.avgSentenceLength * 1.28
      ? "Average sentence length sits above your recent baseline."
      : pickCalibrationObservationPhrase(CALIBRATION_OBS_LONG, seed);
  }

  return pickCalibrationObservationPhrase(CALIBRATION_OBS_FALLBACK, seed);
}

function renderReflection(text) {
  const el = document.getElementById("reflection-line");
  const editorLine = $("editorPostRunLine");
  const trimmed = String(text || "").trim();
  const useEditorSlot =
    isMobileViewport() &&
    document.body.classList.contains("focus-mode") &&
    editorLine;

  if (useEditorSlot) {
    if (el) {
      el.textContent = "";
      el.classList.add("reflection-line--hidden");
      el.setAttribute("aria-hidden", "true");
    }
    if (!trimmed) {
      editorLine.textContent = "";
      editorLine.classList.add("editor-post-run-line--empty");
      editorLine.setAttribute("aria-hidden", "true");
    } else {
      editorLine.textContent = trimmed;
      editorLine.classList.remove("editor-post-run-line--empty");
      editorLine.setAttribute("aria-hidden", "false");
    }
    return;
  }

  if (editorLine) {
    editorLine.textContent = "";
    editorLine.classList.add("editor-post-run-line--empty");
    editorLine.setAttribute("aria-hidden", "true");
  }

  if (!el) return;

  if (!trimmed) {
    el.textContent = "";
    el.classList.add("reflection-line--hidden");
    el.setAttribute("aria-hidden", "true");
    return;
  }

  el.textContent = trimmed;
  el.classList.remove("reflection-line--hidden");
  el.setAttribute("aria-hidden", "false");
}

/** #feedbackBox: kept empty; post-run calibration uses the in-editor overlay. */
function renderPostRunFeedbackContainer() {
  const fb = $("feedbackBox");
  if (!fb) return;
  fb.dataset.calibrationRenderKey = "";
  fb.className = "result-card empty";
  fb.innerHTML = "";
}

function mirrorPipelineAvailable() {
  return Boolean(
    typeof globalThis !== "undefined" &&
      globalThis.WaywordMirror &&
      typeof globalThis.WaywordMirror.runMirrorPipeline === "function"
  );
}

function computeAndStoreMirrorPipelineResult(text, run) {
  state.lastMirrorPipelineResult = null;
  state.lastMirrorLoadFailed = false;
  if (!mirrorPipelineAvailable()) {
    state.lastMirrorLoadFailed = true;
    return;
  }
  try {
    state.lastMirrorPipelineResult = globalThis.WaywordMirror.runMirrorPipeline({
      text: String(text || ""),
      sessionId: run && run.runId ? String(run.runId) : undefined,
      startedAt: run && typeof run.timestamp === "number" ? run.timestamp : undefined,
      endedAt: Date.now(),
    });
  } catch (_) {
    state.lastMirrorPipelineResult = null;
    state.lastMirrorLoadFailed = true;
  }
}

function cloneMirrorPipelineResultForStorage(src) {
  if (src == null || typeof src !== "object") return null;
  try {
    return JSON.parse(JSON.stringify(src));
  } catch (_) {
    return null;
  }
}

function attachMirrorSnapshotToRunFromState(run) {
  if (state.lastMirrorLoadFailed) {
    run.mirrorLoadFailed = true;
    run.mirrorPipelineResult = null;
    return;
  }
  run.mirrorLoadFailed = false;
  run.mirrorPipelineResult = cloneMirrorPipelineResultForStorage(state.lastMirrorPipelineResult);
}

function escapeHtmlMirror(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMirrorEvidenceLinesHtml(evidence) {
  if (!Array.isArray(evidence) || !evidence.length) {
    return '<p class="mirror-card__evidence-line">No evidence attached.</p>';
  }
  return evidence
    .map((ev) => {
      const t = escapeHtmlMirror(ev && ev.text != null ? ev.text : "");
      return `<p class="mirror-card__evidence-line">${t}</p>`;
    })
    .join("");
}

function mirrorReflectionCardHtml(card, opts) {
  const role = opts && opts.role === "main" ? "main" : "support";
  const firstSupport = Boolean(opts && opts.firstSupportInSupportOnlyStack);
  const uid =
    opts && opts.evidencePanelId
      ? String(opts.evidencePanelId)
      : `mirror-ev-${Math.random().toString(36).slice(2, 11)}`;
  const stmt = escapeHtmlMirror(card.statement);
  const evHtml = renderMirrorEvidenceLinesHtml(card.evidence);
  let cls = "mirror-card";
  if (role === "main") cls += " mirror-card--main";
  else {
    cls += " mirror-card--support";
    if (firstSupport) cls += " mirror-card--support-first";
  }
  return (
    `<article class="${cls}">` +
    `<p class="mirror-card__statement">${stmt}</p>` +
    `<button type="button" class="mirror-card__evidence-toggle" aria-expanded="false" aria-controls="${uid}">Evidence</button>` +
    `<div class="mirror-card__evidence" id="${uid}" hidden>${evHtml}</div>` +
    `</article>`
  );
}

function buildMirrorPanelBodyHtml({ loadFailed, result, idPrefix }) {
  const pfx = String(idPrefix || "mirror");
  if (loadFailed) {
    return '<p class="mirror-empty">Mirror readings are not available in this build.</p>';
  }
  const r = result;
  if (!r || typeof r !== "object") {
    return "";
  }
  const main = r.main;
  const supporting = Array.isArray(r.supporting) ? r.supporting : [];
  const hasMain = Boolean(main && String(main.statement || "").trim());
  const hasSupport = supporting.some((c) => c && String(c.statement || "").trim());

  if (!hasMain && !hasSupport) {
    return '<p class="mirror-empty">Nothing surfaced clearly enough for mirror cards in this run.</p>';
  }

  const parts = [];
  parts.push('<div class="mirror-reflection-eyebrow">Mirror</div>');
  parts.push('<div class="mirror-stack">');
  if (hasMain) {
    parts.push(
      mirrorReflectionCardHtml(main, {
        role: "main",
        evidencePanelId: `${pfx}-main`
      })
    );
  }
  supporting.forEach((c, i) => {
    if (!c || !String(c.statement || "").trim()) return;
    parts.push(
      mirrorReflectionCardHtml(c, {
        role: "support",
        firstSupportInSupportOnlyStack: !hasMain && i === 0,
        evidencePanelId: `${pfx}-s-${i}`
      })
    );
  });
  parts.push("</div>");
  return parts.join("");
}

function formatRecentEntryMirrorHtml(run, idPrefix) {
  if (!run || typeof run !== "object") return "";
  if (run.mirrorLoadFailed) {
    return `<div class="recent-entry-mirror-root recent-entry-mirror"><p class="mirror-empty">Mirror readings are not available in this build.</p></div>`;
  }
  if (run.mirrorPipelineResult == null) return "";
  const body = buildMirrorPanelBodyHtml({
    loadFailed: false,
    result: run.mirrorPipelineResult,
    idPrefix
  });
  if (!body) return "";
  return `<div class="recent-entry-mirror-root recent-entry-mirror">${body}</div>`;
}

function wireMirrorEvidenceToggles(root) {
  if (!root) return;
  root.querySelectorAll(".mirror-card__evidence-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      const panelId = btn.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;
      const next = !open;
      btn.setAttribute("aria-expanded", String(next));
      if (next) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });
  });
}

function renderMirrorReflectionPanel() {
  const section = $("mirrorReflectionSection");
  const root = $("mirrorReflectionRoot");
  if (!section || !root) return;

  if (!state.submitted || !state.completedUiActive) {
    section.classList.add("hidden");
    root.innerHTML = "";
    return;
  }

  const body = buildMirrorPanelBodyHtml({
    loadFailed: state.lastMirrorLoadFailed,
    result: state.lastMirrorPipelineResult,
    idPrefix: "mirror-postrun"
  });
  if (!body) {
    section.classList.add("hidden");
    root.innerHTML = "";
    return;
  }

  section.classList.remove("hidden");
  root.innerHTML = body;
  wireMirrorEvidenceToggles(root);
}

function handleRunCompleted(text, priorEntries, runWasSaved, insufficientCalibration = false) {
  try {
    if (insufficientCalibration) {
      const step = Math.min(priorEntries.length + 1, CALIBRATION_THRESHOLD);
      state.calibrationPostRun = {
        step,
        observation: CALIBRATION_INSUFFICIENT_COPY,
        insufficient: true
      };
      state.lastRunFeedback = "";
      return;
    }
    if (!runWasSaved) return;
    const step = priorEntries.length + 1;
    const observation = String(selectCalibrationObservation(text, priorEntries) || "").trim();
    if (step <= CALIBRATION_THRESHOLD) {
      state.calibrationPostRun = { step, observation, insufficient: false };
      state.lastRunFeedback = "";
    } else {
      state.calibrationPostRun = null;
      state.lastRunFeedback = observation;
    }
  } catch (e) {
    state.lastRunFeedback = "";
    state.calibrationPostRun = null;
  }
}

const METRIC_EXPLAINER_KEYS = new Set(["filler", "repetition", "openings"]);

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

function bindMetricExplainerDelegation(listId = "recentDrawerList") {
  const list = $(listId);
  if (!list || list.dataset.metricExplainerBound === "1") return;
  list.dataset.metricExplainerBound = "1";

  list.addEventListener(
    "pointerdown",
    (e) => {
      const anchor = e.target.closest("[data-metric-explainer]");
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
      const anchor = e.target.closest("[data-metric-explainer]");
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
    const anchor = e.target.closest("[data-metric-explainer]");
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
    const anchor = e.target.closest("[data-metric-explainer]");
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
      if (e.target.closest("[data-metric-explainer]")) return;
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
      const onExplainer = e.target.closest("[data-metric-explainer]");
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

function recentEntryScoreMeterHtml(label, value, max = 25, explainerKey = null) {
  const v = Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
  const dash = Math.round((v / max) * 1000) / 10;
  const d = "M 4 16 A 16 16 0 0 1 36 16";
  const aria = `${label}, ${v} out of ${max}`;
  const maxClass = v === max ? " recent-entry-meter--max" : "";
  const categoryClass =
    explainerKey && METRIC_EXPLAINER_KEYS.has(explainerKey) ? ` recent-entry-meter--${explainerKey}` : "";
  const explainerAttr =
    explainerKey && METRIC_EXPLAINER_KEYS.has(explainerKey)
      ? ` data-metric-explainer="${explainerKey}" tabindex="0"`
      : "";
  return `
    <div class="recent-entry-meter${maxClass}${categoryClass}" role="img" aria-label="${escapeHtml(aria)}" title="${escapeHtml(`${label} ${v} / ${max}`)}"${explainerAttr}>
      <svg class="recent-entry-meter-svg" viewBox="-4 -6 48 28" aria-hidden="true" focusable="false">
        <path class="recent-entry-meter-track" pathLength="100" d="${d}" fill="none" stroke-linecap="round" />
        <path
          class="recent-entry-meter-fill"
          pathLength="100"
          d="${d}"
          fill="none"
          stroke-linecap="round"
          stroke-dasharray="${dash} 100"
        />
      </svg>
      <span class="recent-entry-meter-value">${escapeHtml(String(v))}</span>
      <span class="recent-entry-meter-label">${escapeHtml(label)}</span>
    </div>
  `;
}

function formatRecentEntryScoreBlock(item) {
  const total = item.runScore ?? item.score ?? 0;
  const words = item.wordCount ?? item.words ?? 0;
  const wordsLabel = Number(words) === 1 ? "word" : "words";
  const sb = item.scoreBreakdown;
  let html = `<div class="recent-entry-stats">
    <div class="recent-entry-stats-label">Run score</div>
    <div class="recent-entry-stats-row">
      <span class="recent-entry-stats-score">${escapeHtml(String(total))}</span>
      <span class="recent-entry-stats-words">${escapeHtml(String(words))} ${wordsLabel}</span>
    </div>
  </div>`;
  if (sb && typeof sb === "object") {
    const v = (k) => (typeof sb[k] === "number" && Number.isFinite(sb[k]) ? sb[k] : 0);
    html += `<div class="recent-entry-score-meters">`;
    html += recentEntryScoreMeterHtml("Completion", v("completion"), 25, null);
    html += recentEntryScoreMeterHtml("Filler", v("filler"), 25, "filler");
    html += recentEntryScoreMeterHtml("Repetition", v("repetition"), 25, "repetition");
    html += recentEntryScoreMeterHtml("Openings", v("openings"), 25, "openings");
    html += "</div>";
  }
  return html;
}

function promptExcerpt(prompt, maxLen = 120) {
  const text = (prompt || "").replace(/\r/g, "");
  const firstLine = text.split("\n").map(l => l.trim()).find(Boolean) || "";
  const compact = firstLine.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLen) return compact;
  return `${compact.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

function formatRelativeTime(ts) {
  if (!ts || typeof ts !== "number") return "";
  const diffMs = Date.now() - ts;
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatRunDetailHtml(run) {
  const repeated = Array.isArray(run.repeatedWords) ? run.repeatedWords : [];
  const banned = Array.isArray(run.bannedHits) ? run.bannedHits : [];
  const starters = Array.isArray(run.repeatedStarters) ? run.repeatedStarters : [];

  const REPEAT_CHIP_CAP = 5;
  const STARTER_CHIP_CAP = 4;

  const repeatedShown = repeated.slice(0, REPEAT_CHIP_CAP);
  const repeatedOverflow = repeated.length - repeatedShown.length;
  const repeatedHtml = repeated.length
    ? repeatedShown
        .map(
          ([w, c]) =>
            `<span class="chip chip--compact chip-repetition">${escapeHtml(w)} ×${escapeHtml(String(c))}</span>`
        )
        .join("") +
      (repeatedOverflow > 0
        ? `<span class="chip chip--compact">+${escapeHtml(String(repeatedOverflow))}</span>`
        : "")
    : '<span class="chip chip--compact">none</span>';

  const bannedHtml = banned.length
    ? banned
        .map((item) => {
          const cls = item.isExercise ? "exercise-chip chip--compact" : "chip chip--compact chip-filler";
          const prefix = item.isExercise ? '<span class="exercise-dot"></span>' : "";
          return `<span class="${cls}">${prefix}${escapeHtml(item.word)} ×${escapeHtml(String(item.count))}</span>`;
        })
        .join("")
    : '<span class="chip chip--compact">none</span>';

  const startersShown = starters.slice(0, STARTER_CHIP_CAP);
  const startersOverflow = starters.length - startersShown.length;
  const startersHtml = starters.length
    ? startersShown
        .map(
          ([w, c]) =>
            `<span class="chip chip--compact chip-openings">${escapeHtml(w)} ×${escapeHtml(String(c))}</span>`
        )
        .join("") +
      (startersOverflow > 0
        ? `<span class="chip chip--compact">+${escapeHtml(String(startersOverflow))}</span>`
        : "")
    : '<span class="chip chip--compact">none</span>';

  const unique =
    typeof run.unique === "number"
      ? `${run.unique} unique`
      : typeof run.uniqueRatio === "number"
        ? `${Math.round(run.uniqueRatio * 100)}% variety`
        : "";

  const avgLen =
    typeof run.avgSentenceLength === "number" && Number.isFinite(run.avgSentenceLength)
      ? `${run.avgSentenceLength.toFixed(1)} avg sentence`
      : "";

  const statTokens = [];
  if (unique) statTokens.push(`<span class="recent-run-stat-token">${escapeHtml(unique)}</span>`);
  if (avgLen) statTokens.push(`<span class="recent-run-stat-token">${escapeHtml(avgLen)}</span>`);
  const statsFoot =
    statTokens.length > 0
      ? `<div class="recent-run-detail-foot">${statTokens.join(
          '<span class="recent-run-stats-join" aria-hidden="true">·</span>'
        )}</div>`
      : "";

  return `
    <div class="recent-run-detail recent-run-detail--compact">
      <div class="recent-run-detail-inline">
        <span class="recent-run-inline-cluster" data-metric-explainer="filler" tabindex="0">
          <span class="recent-run-inline-kicker">Filler</span>
          <span class="word-list word-list--inline">${bannedHtml}</span>
        </span>
        <span class="recent-run-inline-cluster" data-metric-explainer="repetition" tabindex="0">
          <span class="recent-run-inline-kicker">Repetition</span>
          <span class="word-list word-list--inline">${repeatedHtml}</span>
        </span>
        <span class="recent-run-inline-cluster" data-metric-explainer="openings" tabindex="0">
          <span class="recent-run-inline-kicker">Openings</span>
          <span class="word-list word-list--inline">${startersHtml}</span>
        </span>
      </div>
      ${statsFoot}
    </div>
  `;
}

function renderHistory() {
  const drawerList = $("recentDrawerList");
  const railList = $("recentRailList");
  const trigger = $("recentWritingTrigger");
  const allLists = [drawerList, railList].filter(Boolean);

  function buildRecentEntries(items, listKey) {
    return items
      .map((item, idx) => {
        const excerpt = promptExcerpt(item.prompt);
        const when = formatRelativeTime(item.savedAt);
        const meta = when ? `<div class="recent-entry-meta">${escapeHtml(when)}</div>` : "";
        const detail = formatRunDetailHtml(item);
        const scoreBlock = formatRecentEntryScoreBlock(item);
        const idPrefix = `mirror-${listKey}-${idx}-${item.runId || "run"}`;
        const mirrorBlock = formatRecentEntryMirrorHtml(item, idPrefix);
        return `
          <button class="recent-entry" type="button" data-recent-index="${idx}">
            <div class="recent-entry-compact">
              <div class="recent-entry-excerpt">${escapeHtml(excerpt || "Run")}</div>
              ${meta}
            </div>
            <div class="recent-entry-expanded" hidden>
              <div class="recent-entry-prompt">${escapeHtml((item.text || "").trim() || "Writing text wasn’t saved for this run.")}</div>
              <div class="recent-entry-results">
                ${scoreBlock}
                ${mirrorBlock}
                <div class="recent-entry-detail">${detail}</div>
              </div>
              <div class="recent-entry-future-meta" aria-hidden="true"></div>
            </div>
          </button>
        `;
      })
      .join("");
  }

  if (!state.history.length) {
    const drawerOpen = isRecentDrawerOpen();
    allLists.forEach((list) => {
      const isDrawer = list.id === "recentDrawerList";
      const showEmpty = isDrawer ? drawerOpen : isDesktopPatternsViewport();
      list.innerHTML = showEmpty ? `<div class="recent-drawer-empty">No runs yet.</div>` : "";
    });
    if (trigger) {
      trigger.disabled = false;
      trigger.setAttribute("aria-disabled", "false");
    }
    return;
  }

  const items = state.history.slice().reverse().slice(0, 5);
  allLists.forEach((list) => {
    const listKey = list.id === "recentRailList" ? "rail" : "draw";
    list.innerHTML = buildRecentEntries(items, listKey);
    list.querySelectorAll(".recent-entry-mirror-root").forEach((el) => {
      wireMirrorEvidenceToggles(el);
    });
  });

  if (trigger) {
    trigger.disabled = false;
    trigger.setAttribute("aria-disabled", "false");
  }
}

function setRecentDrawerOpen(open, options = {}) {
  const backdrop = $("recentDrawerBackdrop");
  const drawer = $("recentDrawer");
  const trigger = $("recentWritingTrigger");

  const shouldOpen = Boolean(open);
  const skipHistory = Boolean(options.skipHistory);
  const skipFocus = Boolean(options.skipFocus);
  const afterOpen = typeof options.afterOpen === "function" ? options.afterOpen : null;

  backdrop?.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
  drawer?.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
  trigger?.setAttribute("aria-expanded", shouldOpen ? "true" : "false");

  document.body.classList.toggle("recent-drawer-open", shouldOpen);

  if (shouldOpen) {
    recentDrawerDismissGuardUntil = Date.now() + RECENT_DRAWER_DISMISS_GUARD_MS;
    if (isMobileViewport()) {
      suppressFocusExitUntil = performance.now() + 380;
      if (document.body.classList.contains("focus-mode")) {
        setFocusMode(false);
      }
    }
    if (document.activeElement === editorInput) {
      editorInput.blur();
    }
  }

  queueViewportSync();

  if (shouldOpen) {
    if (!skipHistory) renderHistory();
    const shouldAutoExpand = Boolean(state.pendingRecentDrawerExpand);
    if (!skipFocus && !shouldAutoExpand) $("recentDrawerCloseBtn")?.focus();
    requestAnimationFrame(() => {
      afterOpen?.();
      if (shouldAutoExpand) {
        state.pendingRecentDrawerExpand = false;
        expandFirstRecentDrawerEntry({ focusClose: true });
      }
      queueViewportSync();
    });
  } else {
    recentDrawerDismissGuardUntil = 0;
    state.pendingRecentDrawerExpand = false;
    hideMetricExplainer();
    if (!skipFocus) trigger?.focus();
    requestAnimationFrame(() => {
      queueViewportSync();
    });
  }
}

function toggleRecentEntry(button) {
  const expanded = button.querySelector(".recent-entry-expanded");
  if (!expanded) return;

  const isOpen = button.classList.contains("is-open");
  document.querySelectorAll(".recent-entry.is-open").forEach(el => {
    if (el === button) return;
    el.classList.remove("is-open");
    const other = el.querySelector(".recent-entry-expanded");
    if (other) other.hidden = true;
  });

  button.classList.toggle("is-open", !isOpen);
  expanded.hidden = isOpen;
}

function expandFirstRecentDrawerEntry({ focusClose = false } = {}) {
  const list = $("recentDrawerList");
  if (!list) return;

  list.scrollTop = 0;

  const first = list.querySelector(".recent-entry");
  if (!first) return;

  document.querySelectorAll(".recent-entry.is-open").forEach(el => {
    el.classList.remove("is-open");
    const other = el.querySelector(".recent-entry-expanded");
    if (other) other.hidden = true;
  });

  first.classList.add("is-open");
  const expanded = first.querySelector(".recent-entry-expanded");
  if (expanded) expanded.hidden = false;

  if (focusClose) $("recentDrawerCloseBtn")?.focus();
}

function aggregateProfile() {
  const agg = {
    totalRuns: state.history.length,
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

  state.history.forEach(run => {
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

function renderProfileLocked() {
  const runs = completedRuns();
  const remaining = Math.max(0, CALIBRATION_THRESHOLD - runs);

  const lockedHtml = `
    <div class="profile-locked">
      <div class="profile-locked-title">Profile forming.</div>
      <div class="profile-locked-copy">You need ${remaining} more ${remaining === 1 ? "round" : "rounds"} before your first reliable read.</div>
      <div class="profile-locked-copy">${runs} of ${CALIBRATION_THRESHOLD} completed.</div>
    </div>
  `;

  ["topWordsProfile","startersProfile","punctuationProfile","perspectiveProfile","patternCallouts"]
    .forEach(id => {
      const el = $(id);
      if (el) el.innerHTML = lockedHtml;
    });

  if ($("profileHeroSummary")) {
    const hero = $("profileHeroSummary");
    if (runs) {
      const agg = aggregateProfile();
      hero.textContent = `Runs ${agg.totalRuns} · Words ${agg.totalWords}`;
    } else {
      hero.textContent = "";
    }
  }
  if ($("profileActionArea")) $("profileActionArea").innerHTML = "";
}

function buildPatternCallouts(agg, avgUniqueRatio, avgFiller, topWords, topStarters) {
  if (
    topWords[0] &&
    topWords[0][1] >= 4 &&
    !state.completedChallenges.has(topWords[0][0])
  ) {
    return {
      headline: "Repetition is one of your clearest signatures.",
      support: `Your most repeated word so far is "${topWords[0][0]}".`,
      direction: "",
      suggestedExerciseWord: topWords[0][0]
    };
}

  if (topStarters[0] && topStarters[0][1] >= 3) {
    return {
      headline: "Your sentences tend to enter the same way.",
      support: `You most often begin with "${topStarters[0][0]}".`,
      direction: "Try changing how you start sentences before you change their content.",
      suggestedExerciseWord: ""
    };
  }

  if (avgFiller > 2) {
    return {
      headline: "You use filler to keep movement going.",
      support: "The writing moves, but some of that movement is padded by softening words.",
      direction: "Try a stricter run and let silence force a cleaner next word.",
      suggestedExerciseWord: ""
    };
  }

  if (avgUniqueRatio > 0.72) {
    return {
      headline: "Your vocabulary spread stays relatively open.",
      support: "You are not writing with a tiny palette.",
      direction: "Watch whether variety sharpens precision or hides repetition.",
      suggestedExerciseWord: ""
    };
  }

  return {
    headline: "Your pattern is still forming.",
    support: "There is enough structure to continue, but not enough yet for a sharper read.",
    direction: "Do a few more runs under pressure and the profile will start to speak more clearly.",
    suggestedExerciseWord: ""
  };
}

function buildChallengeCopy(words) {
  if (!words.length) return "";
  if (words.length === 1) {
    return `Start one run without using the word <strong>${escapeHtml(words[0])}</strong>.`;
  }
  const wordsText = words.map((word) => `<strong>${escapeHtml(word)}</strong>`).join(", ");
  return `Start one run without using these words: ${wordsText}.`;
}

function renderPunctuationChart(punctuationData) {
  const el = $("punctuationProfile");
  if (!el) return;

  const entries = Object.entries(punctuationMarks).map(([key, meta], idx) => ({
    key,
    label: meta.label,
    value: punctuationData[key] || 0,
    patternClass: `punct-pattern-${idx % 10}`
  }));

  const maxValue = Math.max(1, ...entries.map(e => e.value));

  el.innerHTML = `
    <div class="punctuation-chart">
      ${entries.map(entry => {
        const heightPct = Math.min(100, Math.max(4, (entry.value / maxValue) * 100));
        return `
          <div class="punct-col">
            <div class="punct-bar-wrap">
              <div class="punct-bar ${entry.patternClass}" style="height:${heightPct}%"></div>
            </div>
            <div class="punct-label">${escapeHtml(entry.label)}</div>
            <div class="punct-value">${entry.value}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function shouldHideRunsWordsStrip() {
  /* Main writing column: strip is desktop-only (matches @media min-width 981px layout). */
  if (!isDesktopPatternsViewport()) return true;
  if (document.body.classList.contains("focus-mode")) return true;
  if (
    state.calibrationPostRun &&
    state.active &&
    state.submitted &&
    state.completedUiActive
  ) {
    return true;
  }
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
  if (!hasProfileSignal()) {
    renderProfileLocked();
    return;
  }

  const agg = aggregateProfile();
  const runs = Math.max(agg.totalRuns, 1);
  const avgUniqueRatio = agg.totalUniqueRatio / runs;
  const avgSentenceLength = agg.avgSentenceLength / runs;
  const avgFiller = agg.fillerHits / runs;

  if ($("profileHeroSummary")) {
    $("profileHeroSummary").textContent = `Runs ${agg.totalRuns} · Words ${agg.totalWords}`;
  }

  const topWords = Object.entries(agg.wordFreq)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const topStarters = Object.entries(agg.starterFreq)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const calloutsWithStarters = buildPatternCallouts(agg, avgUniqueRatio, avgFiller, topWords, topStarters);
  const suggestedChallengeWord = calloutsWithStarters.suggestedExerciseWord || "";
  const topRepeatedWords = topWords.map(([word]) => word);
  const topRepeatedWordsSet = new Set(topRepeatedWords);
  const selectedChallengeWords = state.patternSelectedWords.filter((word) => topRepeatedWordsSet.has(word));
  if (selectedChallengeWords.length !== state.patternSelectedWords.length) {
    setPatternSelectedWords(selectedChallengeWords);
  }
  const selectedChallengeSet = new Set(selectedChallengeWords);
  const suggestedChallengeWords = suggestedChallengeWord && topRepeatedWordsSet.has(suggestedChallengeWord)
    ? [suggestedChallengeWord]
    : [];
  const draftChallengeWords = selectedChallengeWords.length ? selectedChallengeWords : suggestedChallengeWords;

  if ($("topWordsProfile")) {
    $("topWordsProfile").innerHTML = topWords.length
      ? `<div class="word-cloud">
          ${topWords.map(([w, c]) => `
            <button
              type="button"
              class="word-bubble word-bubble-btn ${selectedChallengeSet.has(w) ? "is-selected" : ""}"
              data-challenge-word="${escapeHtml(w)}"
              aria-pressed="${selectedChallengeSet.has(w) ? "true" : "false"}"
              style="font-size:${12 + Math.min(c * 2, 18)}px"
            >${escapeHtml(w)}</button>
          `).join("")}
         </div>`
      : '<div class="history-item">No repeated words yet.</div>';

    const challengeWordButtons = $("topWordsProfile").querySelectorAll("[data-challenge-word]");
    challengeWordButtons.forEach((btn) => {
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
  }

  if ($("startersProfile")) {
    $("startersProfile").innerHTML = topStarters.length
      ? topStarters.map(([w, c]) => {
          const example = agg.starterExamples[w] || `Sentence opening seen ${c} times so far`;
          return `
            <div class="opening-row">
              <div class="opening-word">${escapeHtml(w)}</div>
              <div class="opening-example">${escapeHtml(example)}</div>
              <div class="opening-count">${c} times</div>
            </div>
          `;
        }).join("")
      : '<div class="history-item">No repeated starters yet.</div>';
  }

  renderPunctuationChart(agg.punctuation);

  const perspectiveTotal = agg.perspective.first + agg.perspective.second + agg.perspective.third;
  if ($("perspectiveProfile")) {
    $("perspectiveProfile").innerHTML = perspectiveTotal
      ? `
        <div class="perspective-grid">
          <div class="perspective-tile">
            <div class="perspective-label">First person</div>
            <div class="perspective-value">${agg.perspective.first}</div>
          </div>
          <div class="perspective-tile">
            <div class="perspective-label">Second person</div>
            <div class="perspective-value">${agg.perspective.second}</div>
          </div>
          <div class="perspective-tile">
            <div class="perspective-label">Third person</div>
            <div class="perspective-value">${agg.perspective.third}</div>
          </div>
        </div>
      `
      : '<div class="history-item">No stance data yet.</div>';
  }

  if ($("patternCallouts")) {
    $("patternCallouts").innerHTML = `
      <div class="history-item"><strong>${calloutsWithStarters.headline}</strong></div>
      <div class="history-item">${calloutsWithStarters.support}</div>
      ${calloutsWithStarters.direction ? `<div class="history-item">${calloutsWithStarters.direction}</div>` : ""}
    `;
  }

  if ($("profileActionArea")) {
    $("profileActionArea").innerHTML = draftChallengeWords.length
      ? `
        <div class="exercise-card">
          <div class="challenge-title">Suggested challenge</div>
          <div class="challenge-copy">
            ${buildChallengeCopy(draftChallengeWords)}
          </div>
          <button id="startExerciseBtn" class="exercise-btn" type="button">
            <span class="exercise-dot"></span>
            Begin challenge
          </button>
        </div>
      `
      : "";

    const btn = $("startExerciseBtn");
    if (btn) btn.addEventListener("click", () => startExerciseRun(draftChallengeWords));
  }
}

/* -----------------------------
   actions
----------------------------- */

function cycleRepeatLimit() {
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

function restartRunWithCurrentSettings(options = {}) {
  const keepOptionsPanelOpen = Boolean(options.keepOptionsPanelOpen);
  if (!state.active) return;

  state.submitted = false;
  state.completedUiActive = false;
  state.promptRerollsUsed = 0;
  state.prompt = generatePrompt();
  setEditorText("");

  const fb = $("feedbackBox");
  if (fb) {
    fb.dataset.calibrationRenderKey = "";
    fb.className = "result-card empty";
    fb.innerHTML = "";
  }
  state.lastRunFeedback = "";
  state.lastMirrorPipelineResult = null;
  state.lastMirrorLoadFailed = false;
  state.calibrationPostRun = null;
  renderReflection("");

  stopTimer();
  state.timerWaitingForFirstInput = Boolean(state.timerSeconds);
  if (!keepOptionsPanelOpen) {
    setOptionsOpen(false);
  }

  renderMeta();
  renderWritingState();
  renderHighlight();
  renderSidebar();
  updateEnterButtonVisibility();

  if (!keepOptionsPanelOpen) {
    requestAnimationFrame(() => {
      focusEditorToStart();
    });
  }
}

function saveBannedInline() {
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

const SHUFFLE_TARGET_WORDS = [60, 75, 90];
const SHUFFLE_TIMER_SECONDS = [60, 180, 300];

function triggerShuffle() {
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
  if (!state.exerciseWords.length) return;

  const tokens = tokenize(text);
  if (state.exerciseWords.some((word) => tokens.includes(word))) return;
  state.exerciseWords.forEach((word) => state.completedChallenges.add(word));
  localStorage.setItem(
    "wayword-completed-challenges",
    JSON.stringify(Array.from(state.completedChallenges))
  );

  setExerciseWords([]);
}

function startWriting(options = {}) {
  const {
    preserveActiveChallenge = false,
    focusCaret = "end",
    deferEditorFocus = false,
  } = options;
  clearPostSubmitAutoRunTimer();
  document.querySelector(".editor-shell")?.classList.remove("editor-shell--submit-complete");
  stopTimer();
  if (!preserveActiveChallenge) {
    setExerciseWords([]);
  }
  state.active = true;
  state.submitted = false;
  state.completedUiActive = false;
  state.promptRerollsUsed = 0;
  state.pendingRecentDrawerExpand = false;

  $("editorOverlay")?.classList.add("hidden");
  $("editorOverlayCard")?.classList.remove("editor-overlay-card--calibration-dismiss");

  applyProgressionToState();
  state.timerWaitingForFirstInput = Boolean(state.timerSeconds);
  state.prompt = generatePrompt();
  setEditorText("");

  const fb = $("feedbackBox");
  if (fb) {
    fb.dataset.calibrationRenderKey = "";
    fb.className = "result-card empty";
    fb.innerHTML = "";
  }
  state.lastRunFeedback = "";
  state.lastMirrorPipelineResult = null;
  state.lastMirrorLoadFailed = false;
  state.calibrationPostRun = null;
  renderReflection("");

  setBannedEditorOpen(false);
  setOptionsOpen(false);
  showProfile(false);

  renderMeta();
  renderWritingState();
  renderHighlight();
  renderSidebar();
  syncEditorBottomChromeForCalibrationOverlay();
  updateEnterButtonVisibility();

  if (!deferEditorFocus) {
    scheduleDeferredEditorFocus(focusCaret);
  }
}

/**
 * Timer reached zero with no words: no run payload to save — still a hard boundary for timed mode.
 * Starts a fresh run so the user cannot keep typing in an expired session.
 */
function finalizeTimedRunExpiredWithNoText() {
  if (!state.active || state.submitted) return;
  stopTimer();
  state.timeRemaining = 0;
  updateTimeFill();
  startWriting({ focusCaret: "start" });
  queueViewportSync();
}

function submitWriting(fromTimer = false) {
  if (!state.active) return;

  if (state.submitted) {
    if (postSubmitAutoRunTimer != null) {
      clearPostSubmitAutoRunTimer();
      document.querySelector(".editor-shell")?.classList.remove("editor-shell--submit-complete");
      runPostSubmitAutoNewRunNow();
    }
    return;
  }

  if (editorInput && !editorSurfaceComposing) {
    flushEditorSurfaceIntoWriteDocOnce();
  }

  const currentText = getEditorText();
  const analysis = analyze(currentText);

  if (analysis.totalWords === 0) {
    if (fromTimer) {
      finalizeTimedRunExpiredWithNoText();
    }
    return;
  }

  const timeRemainingSnapshot =
    state.timerSeconds && state.timerWaitingForFirstInput
      ? state.timerSeconds
      : state.timeRemaining;
  const timerConfigured = Boolean(state.timerSeconds);
  const activeTimerSecondsForRun = timerConfigured ? state.timerSeconds : null;

  const challengeWordsSnapshot = [...state.exerciseWords];
  const challengeActive = challengeWordsSnapshot.length > 0;
  clearExerciseIfCompleted(currentText);
  const challengeCompleted = challengeActive && state.exerciseWords.length === 0;

  state.submitted = true;
  state.completedUiActive = true;
  applyWriteDocSemanticFlagsFromAnalysisCore(analysis);

  updateEnterButtonVisibility();
  stopTimer();
  completeWordmark();

  const starterExamplesMap = {};
  analysis.starterExampleList.forEach(item => {
    if (!starterExamplesMap[item.starter]) starterExamplesMap[item.starter] = item.excerpt;
  });

  const activeTargetWords = getActiveTargetWordsForScoring();
  const { runScore, scoreBreakdown } = computeRunScoreV1(
    analysis,
    state.repeatLimit,
    activeTargetWords
  );

  const finishedWithinTime = !timerConfigured || !fromTimer;
  const wasSuccessful =
    analysis.totalWords >= activeTargetWords &&
    runScore >= 70 &&
    finishedWithinTime;

  const now = Date.now();
  const run = {
    runId: makeRunId(),
    savedAt: now,
    timestamp: now,
    text: currentText,
    prompt: state.prompt,
    repeatedWords: analysis.repeated,
    bannedHits: analysis.bannedHits,
    repeatedStarters: analysis.repeatedStarters,
    score: runScore,
    runScore,
    scoreBreakdown,
    challengeActive,
    challengeCompleted,
    challengeWords: challengeWordsSnapshot,
    wasSuccessful,
    activeTargetWords,
    activeTimerSeconds: activeTimerSecondsForRun,
    finishedWithinTime,
    timeRemaining: timerConfigured ? timeRemainingSnapshot : null,
    wordCount: analysis.totalWords,
    repeatLimitAtRun: state.repeatLimit,
    words: analysis.totalWords,
    unique: analysis.uniqueCount,
    uniqueRatio: analysis.uniqueRatio,
    avgSentenceLength: analysis.avgSentenceLength,
    repeatedCount: analysis.repeated.length,
    fillerCount: analysis.bannedHits.reduce((sum, item) => sum + item.count, 0),
    wordFreq: analysis.counts,
    starterFreq: analysis.starterCounts,
    starterExamples: starterExamplesMap,
    punctuation: analysis.punctuation,
    perspective: analysis.perspective
  };

  const priorEntries = getRecentEntries();
  const nextCalibrationStep = priorEntries.length + 1;
  const inCalibrationWindow = nextCalibrationStep <= CALIBRATION_THRESHOLD;
  const signalOkForCalibration =
    !inCalibrationWindow || calibrationSubmissionHasMinimumSignal(currentText, analysis);

  let runWasSaved = false;
  let insufficientCalibration = false;

  if (!state.savedRunIds.has(run.runId)) {
    if (inCalibrationWindow && !signalOkForCalibration) {
      insufficientCalibration = true;
    } else {
      runWasSaved = true;
    }
  }

  handleRunCompleted(currentText, priorEntries, runWasSaved, insufficientCalibration);

  computeAndStoreMirrorPipelineResult(currentText, run);

  if (runWasSaved) {
    attachMirrorSnapshotToRunFromState(run);
    state.history.push({ ...run });
    state.savedRunIds.add(run.runId);
    state.pendingRecentDrawerExpand = true;
    localStorage.removeItem(INACTIVITY_EASE_RUN_KEY);
    persist();
    renderHistory();
    renderProfileSummaryStrip();

    recomputeProgressionLevel({ afterRun: true });
    applyProgressionToState();
    renderProfile();
  }

  renderWritingState({ deferPostRunOverlaySync: false });
  renderMeta();
  renderSidebar();

  queueViewportSync();

  pulseEditorShellAfterSubmit();
}

function showProfile(show = true) {
  const profileView = $("profileView");
  if (!profileView) return;
  const wasVisible = !profileView.classList.contains("hidden");
  const isMobilePatternsContext = isMobileViewport() && !isDesktopPatternsViewport();
  const isPatternsOpen = document.body.classList.contains("patterns-open");
  logPatternsTransitionSnapshot("showProfile:enter", {
    show,
    wasVisible,
    isMobilePatternsContext,
    isPatternsOpen
  });

  if (show) {
    profilePanelCloseMotionToken++;
  }

  if (isMobilePatternsContext && (show || wasVisible || isPatternsOpen)) {
    if (show) {
      editorInput?.blur();
      if (document.body.classList.contains("focus-mode")) {
        setFocusMode(false);
      }
      profileView.classList.remove("profile-view--enter-from", "profile-view--recede");
      profileView.classList.remove("hidden");
    } else {
      // Canonical destination for mobile Patterns close: explicit non-focus baseline.
      setFocusMode(false);
      profileView.classList.remove("profile-view--enter-from", "profile-view--recede");
      profileView.classList.add("hidden");
      document.body.classList.remove("patterns-open", "keyboard-open");
      document.documentElement.classList.remove("focus-mode-layout-snap");
      state.isExpandedField = false;
      syncExpandedFieldClass();
    }
    syncPatternsLayoutMode();
    renderProfile();
    syncViewportHeightVar();
    syncKeyboardOpenClass();
    queueViewportSync();
    logPatternsTransitionSnapshot("showProfile:mobile-resolver-return", { show });
    requestAnimationFrame(() => {
      logPatternsTransitionSnapshot("showProfile:mobile-resolver-next-raf", { show });
    });
    return;
  }

  const motion = !prefersReducedUiMotion();

  if (show && !isDesktopPatternsViewport()) {
    editorInput?.blur();
    if (isMobileViewport() && document.body.classList.contains("focus-mode")) {
      setFocusMode(false);
    }
  }

  if (!motion) {
    profileView.classList.toggle("hidden", !show);
    syncPatternsLayoutMode();
    renderProfile();
    queueViewportSync();
    logPatternsTransitionSnapshot("showProfile:no-motion-return", { show });
    return;
  }

  if (show && !wasVisible) {
    profileView.classList.remove("profile-view--recede");
    profileView.classList.add("profile-view--enter-from");
    profileView.classList.remove("hidden");
    syncPatternsLayoutMode();
    renderProfile();
    void profileView.offsetWidth;
    requestAnimationFrame(() => {
      profileView.classList.remove("profile-view--enter-from");
      queueViewportSync();
      logPatternsTransitionSnapshot("showProfile:open-next-raf");
    });
    logPatternsTransitionSnapshot("showProfile:open-return");
    return;
  }

  if (!show && wasVisible) {
    if (isMobileViewport()) {
      setFocusMode(false);
      profileView.classList.remove("profile-view--enter-from", "profile-view--recede");
      profileView.classList.add("hidden");
      syncPatternsLayoutMode();
      renderProfile();
      queueViewportSync();
      logPatternsTransitionSnapshot("showProfile:close-mobile-return");
      return;
    }
    if (profileView.classList.contains("profile-view--recede")) {
      return;
    }
    const closeToken = profilePanelCloseMotionToken;
    let settled = false;
    const settle = () => {
      profileView.removeEventListener("transitionend", onTransitionEnd);
      if (settled) return;
      if (closeToken !== profilePanelCloseMotionToken) return;
      settled = true;
      profileView.classList.add("hidden");
      profileView.classList.remove("profile-view--recede");
      syncPatternsLayoutMode();
      renderProfile();
      queueViewportSync();
      logPatternsTransitionSnapshot("showProfile:close-desktop-settle");
    };
    const onTransitionEnd = (e) => {
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
  profileView.classList.toggle("hidden", !show);
  syncPatternsLayoutMode();
  renderProfile();
  queueViewportSync();
  logPatternsTransitionSnapshot("showProfile:fallthrough-return", { show });
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

if (editorInput) {
  editorInput.addEventListener("focus", () => {
    setFocusMode(true);
  });

  editorInput.addEventListener("blur", (e) => {
    if (state.submitted && state.completedUiActive) {
      hideEditorSemanticPicker();
      return;
    }
    if (state.optionsOpen) {
      hideEditorSemanticPicker();
      return;
    }
    const rt = e.relatedTarget;
    if (
      rt &&
      typeof rt.closest === "function" &&
      (rt.closest("#optionsTrigger") ||
        rt.closest("#editorOptionsPanel") ||
        rt.closest("#editorOptionsBackdrop") ||
        rt.closest("#recentWritingTrigger") ||
        rt.closest("#recentDrawer") ||
        rt.closest("#recentDrawerBackdrop") ||
        rt.closest("#recentDrawerCloseBtn") ||
        rt.closest("#recentDrawerList") ||
        rt.closest("#styleTab") ||
        rt.closest("#profileView") ||
        rt.closest("#fieldExpandedToggle") ||
        rt.closest("#promptRerollBtn"))
    ) {
      queueViewportSync();
      hideEditorSemanticPicker();
      return;
    }
    window.setTimeout(() => {
      if (state.optionsOpen) {
        hideEditorSemanticPicker();
        return;
      }
      const ae = document.activeElement;
      if (
        ae &&
        typeof ae.closest === "function" &&
        (ae.closest("#optionsTrigger") ||
          ae.closest("#editorOptionsPanel") ||
          ae.closest("#editorOptionsBackdrop") ||
          ae.closest("#recentWritingTrigger") ||
          ae.closest("#recentDrawer") ||
          ae.closest("#recentDrawerBackdrop") ||
          ae.closest("#recentDrawerCloseBtn") ||
          ae.closest("#recentDrawerList") ||
          ae.closest("#styleTab") ||
          ae.closest("#profileView") ||
          ae.closest("#fieldExpandedToggle") ||
          ae.closest("#promptRerollBtn"))
      ) {
        queueViewportSync();
        hideEditorSemanticPicker();
        return;
      }
      if (document.body.classList.contains("recent-drawer-open")) {
        queueViewportSync();
        hideEditorSemanticPicker();
        return;
      }
      if (performance.now() < suppressFocusExitUntil || isMobilePatternsVisible()) {
        queueViewportSync();
        hideEditorSemanticPicker();
        return;
      }
      syncViewportHeightVar();
      syncKeyboardOpenClass();
      setFocusMode(false);
      hideEditorSemanticPicker();
    }, 0);
  });

  editorInput.addEventListener("compositionstart", () => {
    editorSurfaceComposing = true;
  });

  editorInput.addEventListener("compositionend", () => {
    editorSurfaceComposing = false;
    if (!state.active || state.submitted) return;
    flushEditorSurfaceIntoWriteDocOnce();
    tryStartTimerOnFirstMeaningfulInput();
    pulseWordmark();
    renderHighlight();
    renderSidebar();
    updateWordProgress();
    updateEnterButtonVisibility();
    scheduleSemanticPickerFromSelection();
  });

  editorInput.addEventListener("input", () => {
    if (!state.active || state.submitted) return;
    if (editorSurfaceComposing) return;
    flushEditorSurfaceIntoWriteDocOnce();
    tryStartTimerOnFirstMeaningfulInput();
    pulseWordmark();
    renderHighlight();
    renderSidebar();
    updateWordProgress();
    updateEnterButtonVisibility();
    scheduleSemanticPickerFromSelection();
  });

  editorInput.addEventListener("scroll", () => {
    syncScroll();
    scheduleEditorDotOverlaySync();
    scheduleSemanticPickerFromSelection();
  });

  editorInput.addEventListener("keydown", (e) => {
    if (
      !state.optionsOpen &&
      state.submitted &&
      state.completedUiActive
    ) {
      const enterBegin = e.key === "Enter" && !e.shiftKey;
      const typingKey =
        (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) ||
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === " ";
      if (enterBegin) {
        e.preventDefault();
        runPostSubmitAutoNewRunNow();
        return;
      }
      if (typingKey) {
        e.preventDefault();
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (state.submitted) {
        if (state.completedUiActive && !state.optionsOpen) {
          runPostSubmitAutoNewRunNow();
        }
        return;
      }
      if (getEditorText().trim().length === 0) return;
      submitWriting(false);
    }
  });
}

const editorShell = document.querySelector(".editor-shell");

editorShell?.addEventListener("pointerdown", (e) => {
  if (e.target.closest("#editorInput")) {
    annotationRowPendingEditorSel = null;
  }

  const blocked =
    e.target.closest("#optionsTrigger") ||
    e.target.closest(".editor-progress") ||
    e.target.closest("#editorOptionsPanel") ||
    e.target.closest("#editorOptionsBackdrop") ||
    e.target.closest("#enterSubmitBtn") ||
    e.target.closest("#editorOverlay") ||
    e.target.closest("#editorSemanticPicker") ||
    e.target.closest("#recentWritingTrigger") ||
    e.target.closest("#recentDrawer") ||
    e.target.closest("#recentDrawerBackdrop");

  if (blocked) return;
  if (!state.active || state.submitted) return;
  /* Clicks on the editable surface must use native caret/selection; only chrome hits focus the end. */
  if (e.target.closest("#editorInput")) return;

  requestAnimationFrame(() => {
    focusEditorToEnd();
  });
});

let suppressRecentTriggerClickOpen = false;
$("recentWritingTrigger")?.addEventListener(
  "pointerdown",
  (e) => {
    suppressRecentTriggerClickOpen = false;
    if (isRecentDrawerOpen()) return;
    e.preventDefault();
    e.stopPropagation();
    setRecentDrawerOpen(true);
    suppressRecentTriggerClickOpen = true;
  },
  true
);

$("recentWritingTrigger")?.addEventListener("click", (e) => {
  if (suppressRecentTriggerClickOpen) {
    suppressRecentTriggerClickOpen = false;
    return;
  }
  e.stopPropagation();
  setRecentDrawerOpen(true);
});

$("recentDrawerCloseBtn")?.addEventListener("click", () => {
  setRecentDrawerOpen(false);
});

$("recentDrawerBackdrop")?.addEventListener("click", () => {
  if (Date.now() < recentDrawerDismissGuardUntil) return;
  setRecentDrawerOpen(false);
});

$("recentDrawerList")?.addEventListener("click", (e) => {
  const entry = e.target.closest(".recent-entry");
  if (!entry) return;
  toggleRecentEntry(entry);
});
$("recentRailList")?.addEventListener("click", (e) => {
  const entry = e.target.closest(".recent-entry");
  if (!entry) return;
  toggleRecentEntry(entry);
});

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    state.submitted &&
    state.completedUiActive &&
    !e.shiftKey &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.altKey
  ) {
    if (state.optionsOpen) return;
    if (e.target && e.target.closest && e.target.closest("#editorInput")) {
      return;
    }
    const target = e.target;
    const editable =
      target &&
      (target.closest("input,textarea,select,[contenteditable='true']") ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT");
    if (!editable) {
      e.preventDefault();
      runPostSubmitAutoNewRunNow();
      return;
    }
  }

  if (e.key !== "Escape") return;
  if (state.optionsOpen) {
    setOptionsOpen(false);
    e.preventDefault();
    return;
  }
  if (isRecentDrawerOpen()) {
    setRecentDrawerOpen(false);
  }
});

$("beginBtn")?.addEventListener("click", () => {
  if (isMobileViewport()) {
    setFocusMode(true);
  }
  startWriting({ deferEditorFocus: true });
  enterAppState({
    afterEnter: () => scheduleDeferredEditorFocus("end"),
    dockFocusModeForMobile: false,
  });
});
$("themeToggleInPanel")?.addEventListener("click", toggleTheme);
$("styleTab")?.addEventListener("pointerdown", () => {
  if (!isMobileViewport()) return;
  suppressFocusExitUntil = performance.now() + 320;
});
$("styleTab")?.addEventListener("click", () => {
  const profileView = $("profileView");
  const isShowingProfile = profileView && !profileView.classList.contains("hidden");
  logPatternsTransitionSnapshot("styleTab:click-before-toggle", { isShowingProfile });
  showProfile(!isShowingProfile);
  logPatternsTransitionSnapshot("styleTab:click-after-toggle", { nextShow: !isShowingProfile });
  requestAnimationFrame(() => {
    logPatternsTransitionSnapshot("styleTab:click-next-raf", { nextShow: !isShowingProfile });
  });
  window.setTimeout(() => {
    logPatternsTransitionSnapshot("styleTab:click-timeout-200ms", { nextShow: !isShowingProfile });
  }, 200);
});
$("styleTab")?.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  if (isMobileViewport()) suppressFocusExitUntil = performance.now() + 320;
  const profileView = $("profileView");
  const isShowingProfile = profileView && !profileView.classList.contains("hidden");
  logPatternsTransitionSnapshot("styleTab:key-before-toggle", {
    key: e.key,
    isShowingProfile
  });
  showProfile(!isShowingProfile);
  logPatternsTransitionSnapshot("styleTab:key-after-toggle", { nextShow: !isShowingProfile });
  requestAnimationFrame(() => {
    logPatternsTransitionSnapshot("styleTab:key-next-raf", { nextShow: !isShowingProfile });
  });
});
$("shuffleBtn")?.addEventListener("click", triggerShuffle);
$("repeatLimitPill")?.addEventListener("click", cycleRepeatLimit);
$("enterSubmitBtn")?.addEventListener("click", () => {
  if (!editorInput || getEditorText().trim().length === 0) return;
  submitWriting(false);
});
$("bannedPill")?.addEventListener("click", () => {
  setBannedEditorOpen(!state.bannedEditorOpen);
});

$("saveBannedBtn")?.addEventListener("click", saveBannedInline);

$("bannedInlineInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    saveBannedInline();
  }
  if (e.key === "Escape") {
    setBannedEditorOpen(false);
  }
});

$("editorOptionsBackdrop")?.addEventListener("click", e => {
  if (Date.now() < optionsPanelDismissGuardUntil) return;
  const panel = $("editorOptionsPanel");
  if (panel?.contains(e.target)) return;
  setOptionsOpen(false);
});

let suppressGearClickToggle = false;
$("optionsTrigger")?.addEventListener(
  "pointerdown",
  (e) => {
    suppressGearClickToggle = false;
    if (!state.optionsOpen) {
      setOptionsOpen(true);
      suppressGearClickToggle = true;
    }
  },
  true
);

$("optionsTrigger")?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (suppressGearClickToggle) {
    suppressGearClickToggle = false;
    return;
  }
  setOptionsOpen(!state.optionsOpen);
});

$("editorOptionsPanel")?.addEventListener("pointerdown", e => {
  e.stopPropagation();
});

$("editorOptionsPanel")?.addEventListener("click", e => {
  e.stopPropagation();
});

$("editorOptionsCloseBtn")?.addEventListener("click", e => {
  e.stopPropagation();
  if (Date.now() < optionsPanelDismissGuardUntil) return;
  setOptionsOpen(false);
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

document.addEventListener("pointerdown", (e) => {
  if (!editorInput) return;
  if (!isMobileViewport()) return;
  if (!document.body.classList.contains("focus-mode")) return;
  if (document.activeElement !== editorInput) return;

  const interactiveControl = e.target.closest(
    "button,a,input,textarea,select,[role='button']"
  );
  if (interactiveControl) return;

  const insideEditor = e.target.closest(".editor-shell");
  const insideOptions =
    e.target.closest("#editorOptionsPanel") ||
    e.target.closest("#optionsTrigger") ||
    e.target.closest("#editorOptionsBackdrop");
  const insideRecent =
    e.target.closest("#recentDrawer") || e.target.closest("#recentDrawerBackdrop");
  const insideBelowEditorStack = e.target.closest(".below-editor-stack");
  if (
    insideEditor ||
    insideOptions ||
    insideRecent ||
    insideBelowEditorStack ||
    e.target.closest("#fieldExpandedToggle") ||
    e.target.closest("#promptRerollBtn")
  ) {
    return;
  }

  editorInput.blur();
});

/* -----------------------------
   panel control wiring
----------------------------- */

document.querySelectorAll("#wordModesPanel button[data-words]").forEach(btn => {
  btn.addEventListener("click", () => {
    applyWordTargetFromPanel(btn.dataset.words);
  });
});
document.querySelectorAll("#timeModesPanel button[data-time]").forEach(btn => {
  btn.addEventListener("click", () => {
    applyTimerFromPanel(btn.dataset.time);
  });
});
$("shuffleBtnPanel")?.addEventListener("click", triggerShuffle);

$("bannedInlineInputPanel")?.addEventListener("input", scheduleBannedPanelPersistFromPanel);
$("bannedInlineInputPanel")?.addEventListener("blur", () => {
  flushBannedPanelPersistFromPanel();
});
/* -----------------------------
   boot
----------------------------- */

if (WAYWORD_DEV_CALIBRATION_RESET_ENABLED) {
  window.waywordDevResetCalibration = waywordDevResetCalibrationForTesting;
  try {
    const params = new URLSearchParams(location.search);
    if (params.get("resetCalibration") === "1") {
      waywordDevResetCalibrationForTesting();
      params.delete("resetCalibration");
      const q = params.toString();
      history.replaceState(null, "", location.pathname + (q ? `?${q}` : "") + location.hash);
    }
  } catch (_) {
    /* ignore */
  }
}

if (WAYWORD_DEBUG_PATTERNS_TRANSITIONS_ENABLED) {
  window.waywordDebugPatterns = {
    snapshot: (label = "manual") => logPatternsTransitionSnapshot(label),
    enable() {
      try {
        localStorage.setItem("waywordDebugPatterns", "1");
      } catch (_) {
        /* ignore */
      }
    },
    disable() {
      try {
        localStorage.removeItem("waywordDebugPatterns");
      } catch (_) {
        /* ignore */
      }
    }
  };
  logPatternsTransitionSnapshot("debugPatterns:boot");
}

window.addEventListener("resize", queueViewportSync);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", queueViewportSync);
  window.visualViewport.addEventListener("scroll", queueViewportSync);
}

(function bindEditorShellEdgeResizeObserver() {
  const shell = document.querySelector(".editor-shell");
  if (!shell || typeof ResizeObserver === "undefined") return;
  let debounceTimer = null;
  const ro = new ResizeObserver(() => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      debounceTimer = null;
      queueViewportSync();
    }, 36);
  });
  ro.observe(shell);
})();

(function bindEditorCalibrationOverlayResizeObserver() {
  const overlay = $("editorOverlay");
  if (!overlay || typeof ResizeObserver === "undefined") return;
  const ro = new ResizeObserver(() => {
    if (overlay.classList.contains("editor-overlay--calibration") && !overlay.classList.contains("hidden")) {
      syncEditorCalibrationOverlayClip();
    }
  });
  ro.observe(overlay);
})();

syncViewportHeightVar();
applyTheme(state.theme);
state.progressionLevel = loadStoredProgressionLevel();
recomputeProgressionLevel({ sessionInit: true });
applyProgressionToState();
ensurePromptRerollButton();
bindPromptClusterControlsOnce();
renderMeta();
renderWritingState();
projectWriteDocToEditorFromState(0, 0, false);
renderHighlight();
scheduleEditorDotOverlaySync();
renderSidebar();
renderHistory();
renderProfile();
syncPatternsLayoutMode();
renderCalibration();
renderProfileSummaryStrip();
updateEnterButtonVisibility();

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

queueViewportSync();

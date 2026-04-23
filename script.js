/** v1.1 prompt families (fixed set). See `docs/PROMPT_SYSTEM_V1_1.md`. */
const PROMPT_FAMILIES_ORDER = ["Observation", "Relation", "Tension", "Possibility", "Constraint"];

/**
 * @typedef {{ id: string, text: string, nearDuplicateGroup: string, intensity: number, structure: string, active: boolean }} PromptEntryV11
 */

/** @type {Record<string, PromptEntryV11[]>} */
const promptLibrary = {
  Observation: [
    {
      id: "observation_kitchen_left",
      text: "Describe a kitchen after everyone has left.",
      nearDuplicateGroup: "empty_after",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "observation_cheap_object_serious",
      text: "Describe a cheap object with absolute seriousness.",
      nearDuplicateGroup: "object_focus",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "observation_corner_private_life",
      text: "Describe a neighborhood corner as if it had a private life.",
      nearDuplicateGroup: "place_animacy",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "observation_bus_empty_full",
      text: "Describe an empty bus as if it were full.",
      nearDuplicateGroup: "empty_container",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "observation_room_residue",
      text: "Describe a room using only what stays in it when you cannot name doors or windows.",
      nearDuplicateGroup: "room_rule",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "observation_rooftop_surface",
      text: "Describe a rooftop at the hour the light goes thin: underfoot, rim, heat—not the postcard skyline.",
      nearDuplicateGroup: "rooftop",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "observation_bench_witness",
      text: "Describe a public park bench as if it were a witness.",
      nearDuplicateGroup: "witness_object",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "observation_hallway_memory",
      text: "Describe a hallway as if it remembers everyone who passed through it.",
      nearDuplicateGroup: "corridor_memory",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "observation_waiting_room_plain",
      text: "Describe a waiting room: light, vinyl, posture, and the clock—without turning the room into metaphor.",
      nearDuplicateGroup: "waiting_room",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "observation_cup_crack",
      text: "Write about a cup with a crack in it. Do not use the word broken or any clear synonym for broken.",
      nearDuplicateGroup: "withhold_word",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "observation_stairwell_gravity",
      text: "Describe a stairwell as if gravity there were personal.",
      nearDuplicateGroup: "vertical_place",
      intensity: 2,
      structure: "describe_scene",
      active: true
    }
  ],
  Relation: [
    {
      id: "relation_kind_lie_known",
      text: "Write a scene where someone lies kindly and the other person knows it.",
      nearDuplicateGroup: "kind_deception",
      intensity: 3,
      structure: "scene_dialogue",
      active: true
    },
    {
      id: "relation_conversation_unhappened",
      text: "Write about a conversation that never quite happened.",
      nearDuplicateGroup: "unsaid",
      intensity: 2,
      structure: "scene_dialogue",
      active: true
    },
    {
      id: "relation_kind_wrong_reason",
      text: "Write a scene in which someone is kind for the wrong reason.",
      nearDuplicateGroup: "wrong_kindness",
      intensity: 3,
      structure: "scene_dialogue",
      active: true
    },
    {
      id: "relation_call_after_silence",
      text: "Two people finish a call. Neither names what changed. Write only the silence after the line goes dead.",
      nearDuplicateGroup: "call_gap",
      intensity: 3,
      structure: "interpersonal_gap",
      active: true
    },
    {
      id: "relation_being_let_go",
      text: "Write a scene where someone realizes they are already being let go—without accusation or summary.",
      nearDuplicateGroup: "loss_edge",
      intensity: 3,
      structure: "scene_dialogue",
      active: true
    },
    {
      id: "relation_unsent_surface",
      text: "Someone writes a message they will not send. Show only the writing surface and the hand.",
      nearDuplicateGroup: "unsent",
      intensity: 2,
      structure: "scene_dialogue",
      active: true
    },
    {
      id: "relation_person_through_leavings",
      text: "Write about a person through the things they leave behind.",
      nearDuplicateGroup: "trace",
      intensity: 2,
      structure: "describe_scene",
      active: true
    }
  ],
  Tension: [
    {
      id: "tension_confession_avoids_wrong",
      text: "Write a confession that avoids the actual wrongdoing.",
      nearDuplicateGroup: "withhold_act",
      intensity: 3,
      structure: "withhold_category",
      active: true
    },
    {
      id: "tension_violence_in_tone",
      text: "Write a small story where the only violence is in the tone.",
      nearDuplicateGroup: "tone_violence",
      intensity: 3,
      structure: "scene_dialogue",
      active: true
    },
    {
      id: "tension_envy_unadmitted",
      text: "Write about envy without admitting it.",
      nearDuplicateGroup: "withhold_emotion",
      intensity: 3,
      structure: "withhold_category",
      active: true
    },
    {
      id: "tension_grief_physical_only",
      text: "Describe grief using only physical details.",
      nearDuplicateGroup: "grief_body",
      intensity: 3,
      structure: "physical_channel",
      active: true
    },
    {
      id: "tension_relief_too_late",
      text: "Write about relief that arrives too late.",
      nearDuplicateGroup: "aftermath",
      intensity: 3,
      structure: "fork_aftermath",
      active: true
    },
    {
      id: "tension_forgiveness_movement",
      text: "Write about forgiveness as movement through a house: doors, hands, small tasks—not a verdict on anyone.",
      nearDuplicateGroup: "forgiveness",
      intensity: 2,
      structure: "physical_channel",
      active: true
    },
    {
      id: "tension_care_as_upkeep",
      text: "Write about care that looks like upkeep—what gets checked, tightened, or left quietly running.",
      nearDuplicateGroup: "care_work",
      intensity: 2,
      structure: "describe_scene",
      active: true
    }
  ],
  Possibility: [
    {
      id: "possibility_day_almost",
      text: "Write about a day that almost went differently—only near misses; do not use the phrase what if.",
      nearDuplicateGroup: "near_miss",
      intensity: 2,
      structure: "fork_aftermath",
      active: true
    },
    {
      id: "possibility_choice_in_space",
      text: "Write about a decision that still takes up space in a room—something that keeps getting moved, avoided, or walked around.",
      nearDuplicateGroup: "unmade_choice",
      intensity: 2,
      structure: "describe_scene",
      active: true
    },
    {
      id: "possibility_after_refusal",
      text: "Write a scene that opens the moment after the better offer was refused.",
      nearDuplicateGroup: "refusal_after",
      intensity: 3,
      structure: "fork_aftermath",
      active: true
    }
  ],
  Constraint: [
    {
      id: "constraint_hunger_channels",
      text: "Write about hunger using only smell, temperature, and motion—never name food or eating.",
      nearDuplicateGroup: "withhold_food",
      intensity: 2,
      structure: "withhold_category",
      active: true
    },
    {
      id: "constraint_shame_posture",
      text: "Write about shame using only posture and distance—no emotion words.",
      nearDuplicateGroup: "withhold_emotion",
      intensity: 3,
      structure: "withhold_category",
      active: true
    },
    {
      id: "constraint_body_channels",
      text: "Write about a body using only weight, torque, and where the hands go—no anatomy labels.",
      nearDuplicateGroup: "body_channel",
      intensity: 2,
      structure: "physical_channel",
      active: true
    },
    {
      id: "constraint_meal_non_food",
      text: "Write about a meal as weight, warmth, and silence between people—not what is on the plate.",
      nearDuplicateGroup: "meal_non_food",
      intensity: 2,
      structure: "physical_channel",
      active: true
    }
  ]
};

const promptEntryById = new Map();
for (const fam of PROMPT_FAMILIES_ORDER) {
  for (const e of promptLibrary[fam] || []) {
    promptEntryById.set(e.id, { ...e, family: fam });
  }
}

/** Ritual Loop V1 — internal family tags only (not shown in UI). */
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

const RITUAL_NO_MAIN_NUDGE_BY_FAMILY = Object.freeze({
  Observation: [
    "Keep this in one place.",
    "Stay with one moment.",
    "Use only what can be seen.",
    "Pick one detail and stay with it."
  ],
  Relation: [
    "Use only spoken lines.",
    "Two people. One exchange.",
    "No summary of how they feel.",
    "Keep it to one room and one moment."
  ],
  Tension: [
    "Stop before it blows up.",
    "Keep one worry present. Don't solve it.",
    "Let someone almost say the hard thing.",
    "Stop before anyone wins."
  ],
  Possibility: [
    "Hold one fork in view.",
    "Stay with the near-miss.",
    "Keep the refusal felt, not explained.",
    "One path not taken—keep it concrete."
  ],
  Constraint: [
    "Don't name the feeling yet.",
    "Show what happened. Don't name the feeling.",
    "Leave the obvious label out.",
    "Leave the main feeling unnamed."
  ]
});

const RITUAL_WITH_MAIN_NUDGE_BY_CATEGORY = Object.freeze({
  repetition: [
    "Use the same word twice, but change what it does.",
    "Repeat one word once, then move on.",
    "Swap a repeated word for a plainer one.",
    "Repeat one word once, then leave it."
  ],
  abstraction_concrete: [
    "Keep this in what can be seen.",
    "Three sentences on one thing someone can touch.",
    "Add one line that shows only action.",
    "Trade one vague line for one clear image."
  ],
  cadence: [
    "Keep the sentences short.",
    "Write one long sentence, then two short ones.",
    "Make the first sentence short. Let the next one open up.",
    "Let the sentences change length as you go."
  ],
  opening: [
    "Let the first beat land before you widen the lens.",
    "Hold the opening image one beat longer.",
    "Start with one clear motion, then widen.",
    "Keep the first paragraph to one room of attention."
  ],
  shift: [
    "Let one turn stay sharp before the next move.",
    "After one pivot, stay with the new angle a while.",
    "Hold the lane change long enough to feel it.",
    "One swerve, then commit to the new line."
  ],
  hesitation_qualification: [
    "Say it plainly.",
    "Say it without maybe or kind of.",
    "Open with one plain sentence.",
    "One straight fact. No cushion."
  ],
  fallback: [
    "Keep this in one place.",
    "Stay with one moment.",
    "Don't explain anything.",
    "Let the ending stay open."
  ],
  low_signal: [
    "Write a few more sentences, then look again.",
    "Add a little more on the page before the next run.",
    "Give the next stretch a bit more room to land.",
    "Let the next pass carry a little more language."
  ]
});

/**
 * Ritual nudge for the run after this one. Deterministic; never quotes mirror text.
 * @param {{ priorPromptFamily: string, hadMainReflection: boolean, mainCategory: string | null, seed: string }} input
 */

function buildRitualNudgeV1({ priorPromptFamily, hadMainReflection, mainCategory, seed }) {
  const family = String(priorPromptFamily || "").trim() || "Observation";
  const s = seed != null ? String(seed) : "";
  if (!hadMainReflection) {
    const pool = RITUAL_NO_MAIN_NUDGE_BY_FAMILY[family] || RITUAL_NO_MAIN_NUDGE_BY_FAMILY.Observation;
    const idx = ritualPickIndex(`${s}|no-main|${family}`, pool.length);
    return pool[idx];
  }
  let cat = mainCategory != null ? String(mainCategory) : "fallback";
  if (!RITUAL_WITH_MAIN_NUDGE_BY_CATEGORY[cat]) cat = "fallback";
  const pool = RITUAL_WITH_MAIN_NUDGE_BY_CATEGORY[cat];
  const idx = ritualPickIndex(`${s}|with-main|${cat}|${family}`, pool.length);
  return pool[idx];
}

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

const {
  CALIBRATION_THRESHOLD,
  CALIBRATION_MIN_WORDS,
  CALIBRATION_MIN_SENTENCE_UNITS,
  CALIBRATION_INSUFFICIENT_COPY,
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
  BOTTOM_CHROME_CALIBRATION_HIDE_MS,
  REVIEW_RUN_REFLECTION_MAX,
  REVIEW_RUN_MIN_WORDS,
  REVIEW_RUN_DULL_REPEATS,
  METRIC_EXPLAINER_KEYS,
  SHUFFLE_TARGET_WORDS,
  SHUFFLE_TIMER_SECONDS,
} = window.waywordConfig;

/** Bumped when opening Patterns so an in-flight close animation cannot hide the panel after reopen. */
let profilePanelCloseMotionToken = 0;

/**
 * DEV-ONLY — search `WAYWORD_DEV_CALIBRATION_RESET` to remove this entire block.
 * When true: `window.waywordDevResetCalibration()` clears run history + calibration state.
 * Enabled only for local / file URLs (not deployed previews or production).
 * One-shot URL (runs before first paint of calibration UI): append `?resetCalibration=1` (strip self).
 */
const WAYWORD_DEV_CALIBRATION_RESET_ENABLED =
  typeof location !== "undefined" &&
  ((location.hostname || "") === "localhost" ||
    (location.hostname || "") === "127.0.0.1" ||
    location.protocol === "file:");

function logPatternsTransitionSnapshot(_label, _extra = {}) {
  /* Intentionally empty: patterns layout snapshots were removed from default builds. */
}

const $ = (id) => document.getElementById(id);

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

/** Ritual line under the prompt for the current run: carryover after submit, else cold-start pool for this prompt. */
function getActivePromptNudgeLineForRender() {
  const carried = String(state.pendingNudgeLine || "").trim();
  if (carried) return carried;
  const family = String(state.promptFamily || "").trim() || "Observation";
  const seed =
    String(state.lastPromptKey || "").trim() ||
    String(state.prompt || "").trim() ||
    "wayword";
  return buildRitualNudgeV1({
    priorPromptFamily: family,
    hadMainReflection: false,
    mainCategory: null,
    seed
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
  window.waywordViewController.syncPatternsLayoutMode();
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
  if (
    window.waywordViewportSyncCoordinator &&
    typeof window.waywordViewportSyncCoordinator.queueViewportSync === "function"
  ) {
    return window.waywordViewportSyncCoordinator.queueViewportSync({
      logPatternsTransitionSnapshot,
      syncViewportHeightVar,
      syncKeyboardOpenClass,
      syncEditorShellChamferEdge,
      syncEditorCalibrationOverlayClip,
      isMobileViewport,
      setFocusMode,
      syncPatternsLayoutMode: window.waywordViewController.syncPatternsLayoutMode,
      renderHistory,
      syncRecentRailExpandedLayoutMetrics,
      syncSubmittedAnnotatedEditorSurfaces,
      scheduleEditorDotOverlaySync,
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
      syncViewportHeightVar();
      syncKeyboardOpenClass();
      syncEditorShellChamferEdge();
      syncEditorCalibrationOverlayClip();
      if (!isMobileViewport()) setFocusMode(false);
      window.waywordViewController.syncPatternsLayoutMode();
      renderHistory();
      requestAnimationFrame(() => syncRecentRailExpandedLayoutMetrics());
      syncSubmittedAnnotatedEditorSurfaces();
      scheduleEditorDotOverlaySync();
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
    showProfile(false);
    setOptionsOpen(false);
    afterEnter?.();
    queueViewportSync();
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
  if (
    window.waywordEditorFocusRecovery &&
    typeof window.waywordEditorFocusRecovery.afterOptionsPanelClosed === "function"
  ) {
    return window.waywordEditorFocusRecovery.afterOptionsPanelClosed({
      isMobileViewport,
      state,
      editorInput,
      focusEditorToEnd
    });
  }

  if (!isMobileViewport()) return;
  if (!document.body.classList.contains("focus-mode")) return;
  if (!state.active || state.submitted || !editorInput) return;
  if (state.optionsOpen) return;
  if (document.activeElement === editorInput) return;
  focusEditorToEnd();
}

function setOptionsOpen(open) {
  if (
    window.waywordOptionsPanelTransitionCoordinator &&
    typeof window.waywordOptionsPanelTransitionCoordinator.setOptionsOpen === "function"
  ) {
    return window.waywordOptionsPanelTransitionCoordinator.setOptionsOpen(open, {
      $,
      state,
      optionsPanelDismissGuardMs: OPTIONS_PANEL_DISMISS_GUARD_MS,
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
      afterOptionsPanelClosed,
      applyBodySettingsOpenClass: window.waywordViewController.applyBodySettingsOpenClass,
      applyEditorOptionsPanelAriaAndBackdrop:
        window.waywordViewController.applyEditorOptionsPanelAriaAndBackdrop,
      syncViewportHeightVar,
      queueViewportSync,
    });
  }

  const wasOpen = state.optionsOpen;
  state.optionsOpen = open;

  const panel = $("editorOptionsPanel");
  const backdrop = $("editorOptionsBackdrop");
  if (!panel) return;
  window.waywordViewController.applyBodySettingsOpenClass(open);

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

  window.waywordViewController.applyEditorOptionsPanelAriaAndBackdrop({ open, panel, backdrop });

  if (!open && wasOpen) {
    requestAnimationFrame(() => {
      afterOptionsPanelClosed();
    });
  }
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
 * Saved runs for UI/analysis: canonical document repo (`waywordSavedRunsRead`), oldest → newest.
 * Matches legacy `state.history` index order. Falls back to `state.history` if the read module is absent.
 */
function readSavedRunsChronological() {
  if (window.waywordSavedRunsRead && typeof window.waywordSavedRunsRead.listSavedRunsChronological === "function") {
    return window.waywordSavedRunsRead.listSavedRunsChronological();
  }
  return Array.isArray(state.history) ? state.history.slice() : [];
}

/**
 * Saved runs newest → oldest (same iteration order as `state.history.slice().reverse()`).
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
  state.pendingNudgeLine = "";
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
  renderCalibration();
  renderProfileSummaryStrip();
  renderProfile();
  queueViewportSync();
}

function persist() {
  window.waywordStorage.saveHistoryAndRunIds(state.history, state.savedRunIds);
}

function clampProgressionLevel(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 1;
  return Math.min(3, Math.max(1, Math.floor(x)));
}

function loadStoredProgressionLevel() {
  return clampProgressionLevel(window.waywordStorage.readProgressionLevelOrDefault(PROGRESSION_LEVEL_KEY));
}

function persistProgressionLevel() {
  window.waywordStorage.saveProgressionLevel(PROGRESSION_LEVEL_KEY, state.progressionLevel);
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

  const runs = readSavedRunsChronological()
    .slice()
    .sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));

  if (sessionInit && runs.length) {
    const newest = runs[runs.length - 1];
    const age = Date.now() - (newest.savedAt || 0);
    if (age > 7 * 86400000) {
      const marker = window.waywordStorage.getInactivityEaseRunMarker(INACTIVITY_EASE_RUN_KEY);
      if (marker !== newest.runId) {
        level = Math.max(1, level - 1);
        window.waywordStorage.setInactivityEaseRunMarker(INACTIVITY_EASE_RUN_KEY, newest.runId);
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
function generatePrompt(options) {
  if (!Array.isArray(state.recentPromptIds)) state.recentPromptIds = [];
  if (!Array.isArray(state.recentFamilyKeys)) state.recentFamilyKeys = [];
  const opts = options && typeof options === "object" ? options : {};
  const forced =
    typeof opts.familyKey === "string" && PROMPT_FAMILIES_ORDER.includes(opts.familyKey)
      ? opts.familyKey
      : null;

  const { family, entry } = window.waywordPromptSelection.choosePromptFamilyAndEntry({
    forcedFamilyKey: forced,
    recentPromptIds: state.recentPromptIds,
    recentFamilyKeys: state.recentFamilyKeys,
    promptFamiliesOrder: PROMPT_FAMILIES_ORDER,
    promptLibrary,
    promptEntryById,
    recentIdWindow: PROMPT_RECENT_ID_WINDOW,
    nearDuplicateWindow: PROMPT_NEAR_DUPLICATE_WINDOW,
    recentFamilyWindow: PROMPT_RECENT_FAMILY_WINDOW,
  });
  state.promptId = entry.id;
  state.prompt = entry.text;
  state.promptFamily = family;
  state.lastPromptKey = `${family}::${entry.id}`;
  state.promptBiasTags = biasTagsForPromptFamily(family);
  state.recentPromptIds = [...state.recentPromptIds, entry.id].slice(-PROMPT_RECENT_ID_WINDOW);
  state.recentFamilyKeys = [...state.recentFamilyKeys, family].slice(-PROMPT_RECENT_FAMILY_WINDOW);
  return entry.text;
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
  return window.waywordPromptSelection.canRerollPromptCore({
    active: state.active,
    submitted: state.submitted,
    editorTextEmpty: !getEditorText().trim(),
    promptRerollsUsed: state.promptRerollsUsed,
    rerollLimit: PROMPT_REROLL_LIMIT,
  });
}

function rerollPrompt() {
  if (!canRerollPrompt()) return;

  const fam = String(state.promptFamily || "").trim();
  state.prompt = generatePrompt(
    PROMPT_FAMILIES_ORDER.includes(fam) ? { familyKey: fam } : {}
  );
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

function onPromptClusterControlPointerDownFallback(e) {
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
  if (
    window.waywordPromptInteractions &&
    typeof window.waywordPromptInteractions.bindPromptClusterControls === "function"
  ) {
    window.waywordPromptInteractions.bindPromptClusterControls({
      $,
      onPromptRerollControlClick,
      onFieldExpandedControlClick
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
      card.innerHTML = window.waywordPostRunRenderer.buildCalibrationPostRunOverlayCardHtml({
        step,
        observation,
        insufficient
      });
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

function recentRunsTransitionDeps() {
  return {
    $,
    state,
    editorInput,
    isMobileViewport,
    isDesktopPatternsViewport,
    RECENT_DRAWER_DISMISS_GUARD_MS,
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
  };
}

function isRecentDrawerOpen() {
  return window.waywordRecentRunsTransition.isRecentDrawerOpen();
}

function syncRecentRailExpandedChrome() {
  window.waywordRecentRunsTransition.syncRecentRailExpandedChrome(recentRunsTransitionDeps());
}

/**
 * Desktop expanded Review Runs: cap rail height to the editor chamfer box (measured), still bounded by the
 * viewport band in CSS (`--review-runs-rail-desktop-viewport-floor`). Sets `--review-runs-rail-expanded-max-h`
 * on `#writeView` for `body.recent-rail-expanded #writeView .side-column`.
 */
function syncRecentRailExpandedLayoutMetrics(options = {}) {
  window.waywordRecentRunsTransition.syncRecentRailExpandedLayoutMetrics(
    options,
    recentRunsTransitionDeps()
  );
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
    t === 75 ? "Write to 75 words" : t === 90 ? "Write to 90 words" : "Write to 60 words";
  const panel = $("wordTargetLabelPanel");
  const setup = $("wordTargetLabelSetup");
  if (panel) panel.textContent = text;
  if (setup) setup.textContent = text;
}

function renderMeta() {
  const bannedPill = $("bannedPill");
  const bannedInlineInputPanel = $("bannedInlineInputPanel");

  if (
    window.waywordWritingPromptCardPresentation &&
    typeof window.waywordWritingPromptCardPresentation.renderPromptCard === "function"
  ) {
    window.waywordWritingPromptCardPresentation.renderPromptCard({
      $,
      state,
      getActivePromptNudgeLineForRender
    });
  } else {
    const promptCard = $("promptCard");
    const promptText = $("promptText");
    const promptFamily = $("promptFamilyLabel");

    if (promptCard) promptCard.classList.toggle("hidden", !state.active);
    if (promptText) promptText.textContent = state.prompt || "";
    if (promptFamily) promptFamily.textContent = state.promptFamily || "Prompt";

    const promptNudge = $("promptNudge");
    const promptMain = promptCard?.querySelector(".prompt-main") ?? null;
    const nudgeRowVisible = Boolean(state.active && !state.submitted);
    if (promptNudge) {
      const nudge = nudgeRowVisible ? getActivePromptNudgeLineForRender() : "";
      promptNudge.textContent = nudge;
      promptNudge.classList.toggle("hidden", !nudgeRowVisible);
      promptNudge.setAttribute("aria-hidden", nudgeRowVisible ? "false" : "true");
    }
    if (promptMain) {
      promptMain.classList.toggle("prompt-main--with-nudge", nudgeRowVisible);
    }
  }

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

  syncWordTargetLabels();

  updateWordProgress();
  updateTimeFill();
  updateEnterButtonVisibility();

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
  }
}

function renderSidebar() {
  renderLegend(state.active ? analyze(getEditorText()) : null);
}

function getRecentEntries() {
  return readSavedRunsChronological().map((entry) => ({ text: String(entry?.text || "") }));
}

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

function postRunMirrorPanelInputs() {
  return {
    submitted: state.submitted,
    completedUiActive: state.completedUiActive,
    lastMirrorLoadFailed: state.lastMirrorLoadFailed,
    lastMirrorPipelineResult: state.lastMirrorPipelineResult,
    mirrorEmptyFallbackSeed: state.mirrorEmptyFallbackSeed,
    sessionDigestsForTrends: collectMirrorSessionDigestsFromHistory(),
    submittedRunText: getEditorText(),
    promptFamily: state.promptFamily
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
  const out = window.waywordMirrorController.computeMirrorPipelineOutcome(text, run, recentKeys);
  state.lastMirrorPipelineResult = out.result;
  state.lastMirrorLoadFailed = out.loadFailed;
}

function escapeHtmlMirror(s) {
  return globalThis.WaywordMirrorDom.escapeHtmlMirror(s);
}

function renderMirrorEvidenceLinesHtml(evidence) {
  return globalThis.WaywordMirrorDom.renderMirrorEvidenceLinesHtml(evidence);
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

/** Collapse all Mirror evidence panels under `root` (Recent drawer, rail, post-run, Patterns). */
function collapseMirrorEvidenceInRoot(root) {
  if (!root) return;
  root.querySelectorAll(".mirror-card__evidence-toggle").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Context";
    btn.setAttribute(
      "aria-label",
      "Show where this line comes from in the run"
    );
    const panelId = btn.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (panel) panel.setAttribute("hidden", "");
    const card = btn.closest(".mirror-card");
    if (card) card.classList.remove("mirror-card--evidence-open");
  });
}

function toggleRecentEntry(entry) {
  return window.waywordViewController.toggleRecentEntry(entry, collapseMirrorEvidenceInRoot);
}

function wireMirrorEvidenceToggles(root) {
  if (!root) return;
  root.querySelectorAll(".mirror-card__evidence-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = btn.getAttribute("aria-expanded") === "true";
      const panelId = btn.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;
      const next = !open;
      btn.setAttribute("aria-expanded", String(next));
      btn.textContent = next ? "Hide" : "Context";
      btn.setAttribute(
        "aria-label",
        next ? "Hide grounding from the run" : "Show where this line comes from in the run"
      );
      if (next) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
      const card = btn.closest(".mirror-card");
      if (card) card.classList.toggle("mirror-card--evidence-open", next);
    });
  });
}

/**
 * One-line calibration read for #reflection-line / mobile post-run slot.
 * Suppressed when the Mirror block would be visible (including empty-state copy).
 */
function getPostRunReflectionLineText(precomputedParts) {
  if (!state.submitted || state.calibrationPostRun) {
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
  const { shouldWireEvidence } = window.waywordPostRunRenderer.updateMirrorReflectionSection({
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
  if (shouldWireEvidence) {
    wireMirrorEvidenceToggles(root);
    collapseMirrorEvidenceInRoot(root);
  }
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

/**
 * Review Runs (drawer + rail) — invariants for `renderHistory`:
 * - Drawer (#recentDrawerList) and rail (#recentRailList) must stay in sync on row shape and per-run data.
 * - Preview caps differ: `recentRunsPreviewCapDrawer` vs `recentRunsPreviewCapRail`.
 * - Expanded history (`recentRunsHistoryExpanded`) grows the drawer height (~max 88vh) with a scrolling list.
 * - Empty state rules differ (drawer vs rail visibility).
 * - Some interactions stay surface-specific (drawer open/close, focus) and live outside this renderer.
 * - Row data comes from the canonical run document repo via `readSavedRunsNewestFirst()` (newest first).
 */
function renderHistory() {
  const drawerList = $("recentDrawerList");
  const railList = $("recentRailList");
  const drawerFooter = $("recentDrawerFooter");
  const railFooter = $("recentRailFooter");
  const trigger = $("recentWritingTrigger");
  const allLists = [drawerList, railList].filter(Boolean);
  allLists.forEach((list) => bindRecentRunsSurfaceInteractions(list));

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
      wireMirrorEvidenceToggles,
      collapseMirrorEvidenceInRoot,
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
    drawerList.querySelectorAll(".recent-entry-mirror-root").forEach((el) => {
      wireMirrorEvidenceToggles(el);
      collapseMirrorEvidenceInRoot(el);
    });
    const showDrawerFooter = !expanded && totalCount > capDrawer;
    drawerFooter?.classList.toggle("hidden", !showDrawerFooter);
    drawerFooter?.setAttribute("aria-hidden", showDrawerFooter ? "false" : "true");
  }
  if (railList) {
    railList.innerHTML = window.waywordHistoryRenderer.buildRecentEntriesHtml(railSlice, "rail");
    railList.querySelectorAll(".recent-entry-mirror-root").forEach((el) => {
      wireMirrorEvidenceToggles(el);
      collapseMirrorEvidenceInRoot(el);
    });
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
}

function setRecentDrawerOpen(open, options = {}) {
  window.waywordRecentRunsTransition.setRecentDrawerOpen(open, options, recentRunsTransitionDeps());
}

function bindRecentRunsSurfaceInteractions(list) {
  if (
    window.waywordRecentRunsInteraction &&
    typeof window.waywordRecentRunsInteraction.bindRecentRunsSurfaceInteractions === "function"
  ) {
    window.waywordRecentRunsInteraction.bindRecentRunsSurfaceInteractions({
      list,
      domEventTargetElement,
      collapseMirrorEvidenceInRoot,
    });
    return;
  }

  if (!list || list.dataset.recentEntryInteractionsBound === "1") return;
  list.dataset.recentEntryInteractionsBound = "1";
  list.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const ae = document.activeElement;
    if (!ae || !ae.classList.contains("recent-entry") || !list.contains(ae)) return;
    e.preventDefault();
    window.waywordViewController.toggleRecentEntry(ae, collapseMirrorEvidenceInRoot);
  });
  list.addEventListener("click", (e) => {
    const origin = domEventTargetElement(e);
    if (!origin) return;
    const entry = origin.closest(".recent-entry");
    if (!entry) return;
    if (origin.closest("button, a")) return;
    window.waywordViewController.toggleRecentEntry(entry, collapseMirrorEvidenceInRoot);
  });
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

function renderProfileLocked() {
  const runs = completedRuns();
  const remaining = Math.max(0, CALIBRATION_THRESHOLD - runs);

  const lockedHtml = window.waywordPatternsRenderer.buildProfileLockedPanelInnerHtml(remaining, runs);

  ["patternsRepeatedChallengeRoot", "patternCallouts"].forEach((id) => {
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
  const avgFiller = agg.fillerHits / runs;

  if ($("profileHeroSummary")) {
    $("profileHeroSummary").textContent = `Runs ${agg.totalRuns} · Words ${agg.totalWords}`;
  }

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
        collectMirrorSessionDigestsFromHistory()
      );
      $("patternCallouts").innerHTML =
        patternsMirrorHero != null
          ? patternsMirrorHero
          : window.waywordPatternsRenderer.patternsMirrorHeroEmptyHtml();
      wireMirrorEvidenceToggles($("patternCallouts"));
      collapseMirrorEvidenceInRoot($("patternCallouts"));
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

window.waywordRunController.registerDeps({
  state,
  $,
  editorInput,
  getEditorSurfaceComposing() {
    return editorSurfaceComposing;
  },
  flushEditorSurfaceIntoWriteDocOnce,
  getEditorText,
  analyze,
  getRecentEntries,
  makeRunId,
  persist,
  CALIBRATION_THRESHOLD,
  CALIBRATION_INSUFFICIENT_COPY,
  INACTIVITY_EASE_RUN_KEY,
  selectCalibrationObservation,
  calibrationSubmissionHasMinimumSignal,
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
  queueViewportSync,
  setExerciseWords,
  generatePrompt,
  setEditorText,
  setBannedEditorOpen,
  setOptionsOpen,
  showProfile,
  scheduleDeferredEditorFocus,
  scheduleEditorDotOverlaySync,
  syncEditorBottomChromeForCalibrationOverlay,
  focusEditorToStart,
  updateTimeFill,
  waywordPostRunRenderer: window.waywordPostRunRenderer
});

function showProfile(show = true) {
  if (
    window.waywordPatternsTransitionCoordinator &&
    typeof window.waywordPatternsTransitionCoordinator.showProfile === "function"
  ) {
    return window.waywordPatternsTransitionCoordinator.showProfile(show, {
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
  }

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
    window.waywordViewController.syncPatternsLayoutMode();
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
    window.waywordViewController.syncPatternsLayoutMode();
    renderProfile();
    queueViewportSync();
    logPatternsTransitionSnapshot("showProfile:no-motion-return", { show });
    return;
  }

  if (show && !wasVisible) {
    profileView.classList.remove("profile-view--recede");
    profileView.classList.add("profile-view--enter-from");
    profileView.classList.remove("hidden");
    window.waywordViewController.syncPatternsLayoutMode();
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
      window.waywordViewController.syncPatternsLayoutMode();
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
      window.waywordViewController.syncPatternsLayoutMode();
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
  window.waywordViewController.syncPatternsLayoutMode();
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
    if (
      window.waywordMobileEditorFocusGuard &&
      typeof window.waywordMobileEditorFocusGuard.handleEditorBlur === "function"
    ) {
      return window.waywordMobileEditorFocusGuard.handleEditorBlur(
        {
          state,
          hideEditorSemanticPicker,
          queueViewportSync,
          getSuppressFocusExitUntil() {
            return suppressFocusExitUntil;
          },
          isMobilePatternsVisible,
          syncViewportHeightVar,
          syncKeyboardOpenClass,
          setFocusMode
        },
        e
      );
    }
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
        rt.closest("#enterSubmitBtn") ||
        rt.closest("#recentWritingTrigger") ||
        rt.closest("#recentDrawer") ||
        rt.closest("#recentDrawerBackdrop") ||
        rt.closest("#recentRailExpandedBackdrop") ||
        rt.closest("#recentDrawerCloseBtn") ||
        rt.closest("#recentRailExpandedCloseBtn") ||
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
          ae.closest("#enterSubmitBtn") ||
          ae.closest("#recentWritingTrigger") ||
          ae.closest("#recentDrawer") ||
          ae.closest("#recentDrawerBackdrop") ||
          ae.closest("#recentRailExpandedBackdrop") ||
          ae.closest("#recentDrawerCloseBtn") ||
          ae.closest("#recentRailExpandedCloseBtn") ||
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
      window.waywordCompletedUiRestartInteractions &&
      typeof window.waywordCompletedUiRestartInteractions.handleEditorCompletedRestartKeydown ===
        "function" &&
      window.waywordCompletedUiRestartInteractions.handleEditorCompletedRestartKeydown(
        {
          state,
          runPostSubmitAutoNewRunNow
        },
        e
      )
    ) {
      return;
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

const { editorShell } = window.waywordDomElements.resolveEditorShell();

if (
  window.waywordEditorShellInteractions &&
  typeof window.waywordEditorShellInteractions.bindEditorShellInteractions === "function"
) {
  window.waywordEditorShellInteractions.bindEditorShellInteractions({
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
} else {
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
    if (
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
    ) {
      return;
    }
    if (!state.active || state.submitted) return;
    if (e.target.closest("#editorInput")) return;

    requestAnimationFrame(() => {
      focusEditorToEnd();
    });
  });
}

let suppressRecentTriggerClickOpen = false;
$("promptCard")?.addEventListener("click", (e) => {
  const origin = domEventTargetElement(e);
  if (!origin || !origin.closest("[data-mirror-next-pass]")) return;
  e.preventDefault();
  runPostSubmitAutoNewRunNow();
});

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

document.addEventListener("keydown", (e) => {
  if (
    window.waywordCompletedUiRestartInteractions &&
    typeof window.waywordCompletedUiRestartInteractions.handleDocumentCompletedRestartKeydown ===
      "function" &&
    window.waywordCompletedUiRestartInteractions.handleDocumentCompletedRestartKeydown(
      {
        state,
        runPostSubmitAutoNewRunNow
      },
      e
    )
  ) {
    return;
  }

  if (e.key !== "Escape") return;
  if (state.optionsOpen) {
    setOptionsOpen(false);
    e.preventDefault();
    return;
  }
  if (window.waywordRecentRunsTransition.tryHandleEscapeForRecentRunsSurfaces(recentRunsTransitionDeps())) {
    e.preventDefault();
    return;
  }
});

$("beginBtn")?.addEventListener("click", () => {
  enterAppState({
    afterEnter: () => scheduleDeferredEditorFocus("end"),
    dockFocusModeForMobile: false,
  });
  if (isMobileViewport()) {
    setFocusMode(true);
  }
  startWriting({ deferEditorFocus: true });
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
$("saveBannedBtn")?.addEventListener("click", saveBannedInline);

$("editorOptionsPanel")?.addEventListener("pointerdown", e => {
  e.stopPropagation();
});

$("editorOptionsPanel")?.addEventListener("click", e => {
  e.stopPropagation();
});

if (
  window.waywordOptionsPanelInteractions &&
  typeof window.waywordOptionsPanelInteractions.bindOptionsPanelInteractions === "function"
) {
  window.waywordOptionsPanelInteractions.bindOptionsPanelInteractions({
    $,
    getOptionsOpen() {
      return state.optionsOpen;
    },
    getOptionsPanelDismissGuardUntil() {
      return optionsPanelDismissGuardUntil;
    },
    setOptionsOpen
  });
} else {
  $("editorOptionsBackdrop")?.addEventListener("click", e => {
    if (Date.now() < optionsPanelDismissGuardUntil) return;
    const panel = $("editorOptionsPanel");
    if (panel?.contains(e.target)) return;
    setOptionsOpen(false);
  });

  let suppressGearClickToggle = false;
  $("optionsTrigger")?.addEventListener(
    "pointerdown",
    () => {
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

  $("editorOptionsCloseBtn")?.addEventListener("click", e => {
    e.stopPropagation();
    if (Date.now() < optionsPanelDismissGuardUntil) return;
    setOptionsOpen(false);
  });
}

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

document.addEventListener("pointerdown", (e) => {
  if (
    window.waywordMobileEditorFocusGuard &&
    typeof window.waywordMobileEditorFocusGuard.handleDocumentPointerDown === "function"
  ) {
    return window.waywordMobileEditorFocusGuard.handleDocumentPointerDown(
      {
        editorInput,
        isMobileViewport
      },
      e
    );
  }
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
window.waywordViewController.syncPatternsLayoutMode();
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

window.waywordRecentRunsTransition.bindRecentRunsExpandDismissUi({
  $,
  state,
  renderHistory
});

queueViewportSync();

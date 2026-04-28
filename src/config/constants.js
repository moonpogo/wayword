(function () {
  const CATEGORY_ACCENT_CSS_VARS = Object.freeze({
    filler: "--color-filler",
    repetition: "--color-repetition",
    openings: "--color-openings",
    challenge: "--color-challenge",
  });
  const CATEGORY_COLOR_CSS = Object.freeze(
    Object.fromEntries(Object.entries(CATEGORY_ACCENT_CSS_VARS).map(([k, prop]) => [k, `var(${prop})`]))
  );

  window.waywordConfig = Object.freeze({
    CALIBRATION_THRESHOLD: 5,
    CALIBRATION_MIN_WORDS: 40,
    CALIBRATION_MIN_SENTENCE_UNITS: 3,
    CALIBRATION_INSUFFICIENT_COPY: "Add enough writing for the next save to register.",
    ZEN_GARDEN_OPENABLE: false,
    PROMPT_REROLL_LIMIT: 2,
    /** Last N picked prompt ids: same id cannot repeat while still in this window. */
    PROMPT_RECENT_ID_WINDOW: 8,
    /** Last N picks’ `nearDuplicateGroup` values block matching groups. */
    PROMPT_NEAR_DUPLICATE_WINDOW: 3,
    /** Soft family spacing: weight inversely to recent picks of same family in this window. */
    PROMPT_RECENT_FAMILY_WINDOW: 4,
    PROGRESSION_LEVELS: [
      { level: 1, targetWords: 60, timerSeconds: 120 },
      { level: 2, targetWords: 120, timerSeconds: 240 },
      { level: 3, targetWords: 240, timerSeconds: 360 },
    ],
    PROGRESSION_LEVEL_KEY: "wayword-progression-level",
    INACTIVITY_EASE_RUN_KEY: "wayword-inactivity-eased-for-run",
    CATEGORY_ACCENT_CSS_VARS,
    CATEGORY_COLOR_CSS,
    SEMANTIC_FLAG_IDS: ["filler", "repetition", "opening", "challenge"],
    WAYWORD_SUBMITTED_ANNOTATED_TYPOGRAPHY_STYLE_ID: "wayword-submitted-annotated-typography",
    OPTIONS_PANEL_DISMISS_GUARD_MS: 380,
    RECENT_DRAWER_DISMISS_GUARD_MS: 260,
    BANNED_PANEL_DEBOUNCE_MS: 220,
    EDITOR_SEMANTIC_DOT_PX: 6,
    EDITOR_SEMANTIC_DOT_GAP_PX: 4,
    BOTTOM_CHROME_CALIBRATION_HIDE_MS: 200,
    REVIEW_RUN_REFLECTION_MAX: 3,
    REVIEW_RUN_MIN_WORDS: 28,
    REVIEW_RUN_DULL_REPEATS: new Set([
      "thing",
      "things",
      "stuff",
      "something",
      "anything",
      "nothing",
      "way",
      "ways",
      "kind",
      "sort",
      "time",
      "life",
      "world",
      "people",
      "person",
      "moment",
      "day",
      "night",
    ]),
    METRIC_EXPLAINER_KEYS: new Set(["filler", "repetition", "openings"]),
    SHUFFLE_TARGET_WORDS: [60, 120, 240],
    SHUFFLE_TIMER_SECONDS: [120, 240, 360],
  });
})();

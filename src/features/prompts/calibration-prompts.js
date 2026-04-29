(function () {
  const CALIBRATION_PROMPT_FAMILY = "Calibration";

  const CALIBRATION_PROMPT_RECENT_WINDOW = 5;

  const CALIBRATION_PROMPT_ENTRIES = Object.freeze([
    {
      id: "cal_room_after",
      text: "Write one room after departure.",
      nearDuplicateGroup: "cal",
      intensity: 1,
      structure: "calibration",
      active: true,
    },
    {
      id: "cal_small_object",
      text: "Describe one small object near you. No explanation.",
      nearDuplicateGroup: "cal",
      intensity: 1,
      structure: "calibration",
      active: true,
    },
    {
      id: "cal_returning_thought",
      text: "Write one thought; return to it in a new sentence.",
      nearDuplicateGroup: "cal",
      intensity: 1,
      structure: "calibration",
      active: true,
    },
    {
      id: "cal_visible_room",
      text: "Describe the room you are in using only what can be seen.",
      nearDuplicateGroup: "cal",
      intensity: 1,
      structure: "calibration",
      active: true,
    },
    {
      id: "cal_almost_missed",
      text: "One sentence: what you almost missed today.",
      nearDuplicateGroup: "cal",
      intensity: 1,
      structure: "calibration",
      active: true,
    },
  ]);

  window.waywordCalibrationPrompts = {
    CALIBRATION_PROMPT_FAMILY,
    CALIBRATION_PROMPT_RECENT_WINDOW,
    CALIBRATION_PROMPT_ENTRIES,
  };
})();

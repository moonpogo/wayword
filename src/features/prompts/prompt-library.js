(function () {
  /** Mirror Keeper Redaction v1 - production families. Calibration is a separate mode. */
  const PROMPT_FAMILIES_ORDER = ["Scene", "Relation", "Pressure", "Constraint"];

  /**
   * @typedef {{ id: string, text: string, nearDuplicateGroup: string, intensity: number, structure: string, active: boolean }} PromptEntryV11
   */

  /** @type {Record<string, PromptEntryV11[]>} */
  const promptLibrary = {
    Scene: [
      {
        id: "observation_kitchen_left",
        text: "A kitchen after everyone left.",
        nearDuplicateGroup: "empty_after",
        intensity: 2,
        structure: "describe_scene",
        active: true,
      },
      {
        id: "observation_room_residue",
        text: "A room read through residue: doors and windows unnamed.",
        nearDuplicateGroup: "room_rule",
        intensity: 2,
        structure: "describe_scene",
        active: true,
      },
      {
        id: "observation_bench_witness",
        text: "A public bench scored where hands brace.",
        nearDuplicateGroup: "witness_object",
        intensity: 2,
        structure: "describe_scene",
        active: true,
      },
      {
        id: "observation_hallway_memory",
        text: "A hallway narrowed by footfall and closing doors.",
        nearDuplicateGroup: "corridor_memory",
        intensity: 2,
        structure: "describe_scene",
        active: true,
      },
      {
        id: "observation_waiting_room_plain",
        text: "Waiting room: light, vinyl, posture, clock. No metaphor.",
        nearDuplicateGroup: "waiting_room",
        intensity: 2,
        structure: "describe_scene",
        active: true,
      },
      {
        id: "observation_cup_crack",
        text: "A cracked cup. Do not use broken or a clear synonym.",
        nearDuplicateGroup: "withhold_word",
        intensity: 2,
        structure: "describe_scene",
        active: true,
      },
      {
        id: "scene_room_after_departure",
        text: "Write one room after departure.",
        nearDuplicateGroup: "room_after_departure",
        intensity: 2,
        structure: "describe_scene",
        active: true,
      },
      {
        id: "scene_object_carries_decision",
        text: "One object staged where a decision lands.",
        nearDuplicateGroup: "object_decision",
        intensity: 2,
        structure: "describe_scene",
        active: true,
      },
      {
        id: "scene_one_paragraph_place",
        text: "One paragraph, one place, no explanation.",
        nearDuplicateGroup: "one_place",
        intensity: 2,
        structure: "describe_scene",
        active: true,
      },
    ],
    Relation: [
      {
        id: "relation_kind_lie_known",
        text: "Someone lies kindly; the other knows.",
        nearDuplicateGroup: "kind_deception",
        intensity: 3,
        structure: "scene_dialogue",
        active: true,
      },
      {
        id: "relation_call_after_silence",
        text: "Two people end a call. Write the silence only.",
        nearDuplicateGroup: "call_gap",
        intensity: 3,
        structure: "interpersonal_gap",
        active: true,
      },
      {
        id: "relation_being_let_go",
        text: "Someone realizes they are already being let go. No accusation, no summary.",
        nearDuplicateGroup: "loss_edge",
        intensity: 3,
        structure: "scene_dialogue",
        active: true,
      },
      {
        id: "relation_unsent_surface",
        text: "A message unsent. Only the surface and the hand.",
        nearDuplicateGroup: "unsent",
        intensity: 2,
        structure: "scene_dialogue",
        active: true,
      },
    ],
    Pressure: [
      {
        id: "tension_confession_avoids_wrong",
        text: "Write a confession that avoids the act.",
        nearDuplicateGroup: "withhold_act",
        intensity: 3,
        structure: "withhold_category",
        active: true,
      },
      {
        id: "tension_violence_in_tone",
        text: "The only violence is in the tone.",
        nearDuplicateGroup: "tone_violence",
        intensity: 3,
        structure: "scene_dialogue",
        active: true,
      },
      {
        id: "tension_envy_unadmitted",
        text: "Envy without naming it.",
        nearDuplicateGroup: "withhold_emotion",
        intensity: 3,
        structure: "withhold_category",
        active: true,
      },
      {
        id: "tension_grief_physical_only",
        text: "Show grief through motion only.",
        nearDuplicateGroup: "grief_body",
        intensity: 3,
        structure: "physical_channel",
        active: true,
      },
      {
        id: "tension_forgiveness_movement",
        text: "Forgiveness as movement through a house: doors, hands, tasks. No verdict.",
        nearDuplicateGroup: "forgiveness",
        intensity: 2,
        structure: "physical_channel",
        active: true,
      },
      {
        id: "possibility_choice_in_space",
        text: "A decision still in the room: moved, avoided, walked around.",
        nearDuplicateGroup: "unmade_choice",
        intensity: 2,
        structure: "describe_scene",
        active: true,
      },
      {
        id: "possibility_after_refusal",
        text: "An offer declined. Start one minute later.",
        nearDuplicateGroup: "refusal_after",
        intensity: 3,
        structure: "fork_aftermath",
        active: true,
      },
    ],
    Constraint: [
      {
        id: "constraint_hunger_channels",
        text: "Write hunger without naming food.",
        nearDuplicateGroup: "withhold_food",
        intensity: 2,
        structure: "withhold_category",
        active: true,
      },
      {
        id: "constraint_shame_posture",
        text: "Write shame through distance and posture only.",
        nearDuplicateGroup: "withhold_emotion",
        intensity: 3,
        structure: "withhold_category",
        active: true,
      },
      {
        id: "constraint_body_channels",
        text: "Write the body through weight, torque, and hands.",
        nearDuplicateGroup: "body_channel",
        intensity: 2,
        structure: "physical_channel",
        active: true,
      },
    ],
  };

  window.waywordPromptLibrary = {
    PROMPT_FAMILIES_ORDER,
    promptLibrary,
  };
})();

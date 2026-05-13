(function initWaywordLayeredPrompts(global) {
  "use strict";

  const PROMPT_LAYERS = Object.freeze({
    ENTRY: "entry",
    TORSION: "torsion",
    RESONANCE: "resonance",
  });

  const LAYERED_PROMPTS_V1 = Object.freeze([
    { id: "entry-001", layer: PROMPT_LAYERS.ENTRY, text: "Describe the closest thing near you. Don’t overthink it.", status: "foundation" },
    { id: "entry-002", layer: PROMPT_LAYERS.ENTRY, text: "Pick a sound nearby and follow it.", status: "foundation" },
    { id: "entry-003", layer: PROMPT_LAYERS.ENTRY, text: "Write about something that looks better from far away.", status: "foundation" },
    { id: "entry-004", layer: PROMPT_LAYERS.ENTRY, text: "If today had a color palette, what’s in it?", status: "foundation" },
    { id: "entry-005", layer: PROMPT_LAYERS.ENTRY, text: "Pick an object in the room and make it seem mysterious.", status: "foundation" },
    { id: "entry-006", layer: PROMPT_LAYERS.ENTRY, text: "Start with something ordinary and make it worse.", status: "foundation" },
    { id: "entry-007", layer: PROMPT_LAYERS.ENTRY, text: "Write about a small inconvenience like it altered history.", status: "foundation" },
    { id: "entry-008", layer: PROMPT_LAYERS.ENTRY, text: "Take something annoying seriously.", status: "foundation" },
    { id: "entry-009", layer: PROMPT_LAYERS.ENTRY, text: "What’s the most forgettable part of your day so far?", status: "foundation" },
    { id: "entry-010", layer: PROMPT_LAYERS.ENTRY, text: "Write about a moment that felt longer than it was.", status: "foundation" },
    { id: "entry-011", layer: PROMPT_LAYERS.ENTRY, text: "A sentence you overheard. Invent the rest.", status: "foundation" },
    { id: "entry-012", layer: PROMPT_LAYERS.ENTRY, text: "If white noise could talk, what would it say?", status: "foundation" },
    { id: "entry-013", layer: PROMPT_LAYERS.ENTRY, text: "Are you more of a window or a door today?", status: "foundation" },
    { id: "entry-014", layer: PROMPT_LAYERS.ENTRY, text: "Pick a word to wear for the day.", status: "foundation" },
    { id: "entry-015", layer: PROMPT_LAYERS.ENTRY, text: "A sentence you can’t finish yet. Write it anyway.", status: "foundation" },
    { id: "entry-016", layer: PROMPT_LAYERS.ENTRY, text: "Describe something that looks different upside down.", status: "foundation" },
    { id: "entry-017", layer: PROMPT_LAYERS.ENTRY, text: "Continue a conversation that never happened.", status: "foundation" },
    { id: "entry-018", layer: PROMPT_LAYERS.ENTRY, text: "Explain something badly on purpose.", status: "foundation" },
    { id: "entry-019", layer: PROMPT_LAYERS.ENTRY, text: "Try a word you’ve never used before.", status: "foundation" },
    { id: "entry-020", layer: PROMPT_LAYERS.ENTRY, text: "Continue from: “That’s not what happened.”", status: "foundation" },
    { id: "entry-021", layer: PROMPT_LAYERS.ENTRY, text: "Write one true sentence and one false one. Don’t say which is which.", status: "foundation" },
    { id: "entry-022", layer: PROMPT_LAYERS.ENTRY, text: "Give a brief history of something that has no history.", status: "foundation" },
    { id: "entry-023", layer: PROMPT_LAYERS.ENTRY, text: "Name the feeling you don’t have a word for yet.", status: "foundation" },
    { id: "entry-024", layer: PROMPT_LAYERS.ENTRY, text: "Describe something twice. Make the second description contradict the first.", status: "foundation" },
    { id: "entry-025", layer: PROMPT_LAYERS.ENTRY, text: "Try selling something in the room to someone who doesn’t want it.", status: "foundation" },
    { id: "entry-026", layer: PROMPT_LAYERS.ENTRY, text: "Take the last word you said out loud. Write from it.", status: "foundation" },
    { id: "entry-027", layer: PROMPT_LAYERS.ENTRY, text: "Start with “Technically…”", status: "foundation" },
    { id: "entry-028", layer: PROMPT_LAYERS.ENTRY, text: "An appliance in the room has a complaint. What is it?", status: "foundation" },
    { id: "entry-029", layer: PROMPT_LAYERS.ENTRY, text: "Start with the wrong word on purpose.", status: "foundation" },
    { id: "entry-030", layer: PROMPT_LAYERS.ENTRY, text: "Write the worst possible opening sentence. Then keep going.", status: "foundation" },
  ]);

  function getLayeredPromptsByLayer(layer) {
    return LAYERED_PROMPTS_V1.filter((prompt) => prompt.layer === layer);
  }

  function getEntryPromptsV1() {
    return getLayeredPromptsByLayer(PROMPT_LAYERS.ENTRY);
  }

  function getPromptLayerCounts() {
    return {
      entry: getLayeredPromptsByLayer(PROMPT_LAYERS.ENTRY).length,
      torsion: getLayeredPromptsByLayer(PROMPT_LAYERS.TORSION).length,
      resonance: getLayeredPromptsByLayer(PROMPT_LAYERS.RESONANCE).length,
    };
  }

  global.waywordLayeredPrompts = {
    PROMPT_LAYERS,
    LAYERED_PROMPTS_V1,
    getLayeredPromptsByLayer,
    getEntryPromptsV1,
    getPromptLayerCounts,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

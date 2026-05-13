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
    { id: "torsion-001", layer: PROMPT_LAYERS.TORSION, text: "Tell the same thing twice. Make the second version accuse the first.", status: "foundation" },
    { id: "torsion-002", layer: PROMPT_LAYERS.TORSION, text: "A message arrives too late. Reply without mentioning time.", status: "foundation" },
    { id: "torsion-003", layer: PROMPT_LAYERS.TORSION, text: "Make a case for something. Let one detail weaken it.", status: "foundation" },
    { id: "torsion-004", layer: PROMPT_LAYERS.TORSION, text: "Decline something. Let one detail give you away.", status: "foundation" },
    { id: "torsion-005", layer: PROMPT_LAYERS.TORSION, text: "Take a harmless sentence and make it carry pressure.", status: "foundation" },
    { id: "torsion-006", layer: PROMPT_LAYERS.TORSION, text: "Two people remember the same moment differently. Let neither explain.", status: "foundation" },
    { id: "torsion-007", layer: PROMPT_LAYERS.TORSION, text: "Write an apology that keeps arriving at the wrong thing.", status: "foundation" },
    { id: "torsion-008", layer: PROMPT_LAYERS.TORSION, text: "Begin with agreement. End somewhere less certain.", status: "foundation" },
    { id: "torsion-009", layer: PROMPT_LAYERS.TORSION, text: "Describe the thing before and after it was named.", status: "foundation" },
    { id: "torsion-010", layer: PROMPT_LAYERS.TORSION, text: "Give one object two owners. Let the difference show.", status: "foundation" },
    { id: "torsion-011", layer: PROMPT_LAYERS.TORSION, text: "Write a warning that sounds like ordinary advice.", status: "foundation" },
    { id: "torsion-012", layer: PROMPT_LAYERS.TORSION, text: "Let someone answer the wrong question. Keep the missed question visible.", status: "foundation" },
    { id: "torsion-013", layer: PROMPT_LAYERS.TORSION, text: "Say what happened, then remove the most important word.", status: "foundation" },
    { id: "torsion-014", layer: PROMPT_LAYERS.TORSION, text: "Write from the side that lost the argument.", status: "foundation" },
    { id: "torsion-015", layer: PROMPT_LAYERS.TORSION, text: "Change one word. Track what follows.", status: "foundation" },
    { id: "torsion-016", layer: PROMPT_LAYERS.TORSION, text: "Show what was offered. Then show why it could not be accepted.", status: "foundation" },
    { id: "torsion-017", layer: PROMPT_LAYERS.TORSION, text: "Use the same sentence as a greeting and a threat.", status: "foundation" },
    { id: "torsion-018", layer: PROMPT_LAYERS.TORSION, text: "Describe a room as evidence, not setting.", status: "foundation" },
    { id: "torsion-019", layer: PROMPT_LAYERS.TORSION, text: "Let someone agree to something. Show what the agreement costs without naming it.", status: "foundation" },
    { id: "torsion-020", layer: PROMPT_LAYERS.TORSION, text: "Write the version told in public. Then let one private detail interrupt it.", status: "foundation" },
    { id: "torsion-021", layer: PROMPT_LAYERS.TORSION, text: "Make something look solved. Then show the loose edge.", status: "foundation" },
    { id: "torsion-022", layer: PROMPT_LAYERS.TORSION, text: "Write a complaint that accidentally becomes praise.", status: "foundation" },
    { id: "torsion-023", layer: PROMPT_LAYERS.TORSION, text: "Use the wrong tool. Let it almost work.", status: "foundation" },
    { id: "torsion-024", layer: PROMPT_LAYERS.TORSION, text: "Put two explanations beside each other. Let both fail a little.", status: "foundation" },
    { id: "torsion-025", layer: PROMPT_LAYERS.TORSION, text: "Let the last line disagree with the first without correcting it.", status: "foundation" },
    { id: "resonance-001", layer: PROMPT_LAYERS.RESONANCE, text: "A door is open and still blocks the way.", status: "foundation" },
    { id: "resonance-002", layer: PROMPT_LAYERS.RESONANCE, text: "Translate a gesture into instructions.", status: "foundation" },
    { id: "resonance-003", layer: PROMPT_LAYERS.RESONANCE, text: "Something is missing, but the shape around it is exact.", status: "foundation" },
    { id: "resonance-004", layer: PROMPT_LAYERS.RESONANCE, text: "Write the answer before the question appears.", status: "foundation" },
    { id: "resonance-005", layer: PROMPT_LAYERS.RESONANCE, text: "Make a contradiction hold still for one paragraph.", status: "foundation" },
    { id: "resonance-006", layer: PROMPT_LAYERS.RESONANCE, text: "Describe what remains after the explanation works.", status: "foundation" },
    { id: "resonance-007", layer: PROMPT_LAYERS.RESONANCE, text: "The map is accurate. The place is wrong.", status: "foundation" },
    { id: "resonance-008", layer: PROMPT_LAYERS.RESONANCE, text: "Name the thing by listing what it is not.", status: "foundation" },
    { id: "resonance-009", layer: PROMPT_LAYERS.RESONANCE, text: "Circle the sentence you cannot write. Do not write it.", status: "foundation" },
    { id: "resonance-010", layer: PROMPT_LAYERS.RESONANCE, text: "Empty the room. List what stays.", status: "foundation" },
    { id: "resonance-011", layer: PROMPT_LAYERS.RESONANCE, text: "The proof is correct and changes nothing.", status: "foundation" },
    { id: "resonance-012", layer: PROMPT_LAYERS.RESONANCE, text: "Write the return of something that never left.", status: "foundation" },
    { id: "resonance-013", layer: PROMPT_LAYERS.RESONANCE, text: "A sign points both ways. Follow it.", status: "foundation" },
    { id: "resonance-014", layer: PROMPT_LAYERS.RESONANCE, text: "Let the center stay empty. Build around it.", status: "foundation" },
    { id: "resonance-015", layer: PROMPT_LAYERS.RESONANCE, text: "Write the translation that loses the original on purpose.", status: "foundation" },
    { id: "resonance-016", layer: PROMPT_LAYERS.RESONANCE, text: "Describe a boundary that only exists after it is crossed.", status: "foundation" },
    { id: "resonance-017", layer: PROMPT_LAYERS.RESONANCE, text: "The object is ordinary until it is repeated.", status: "foundation" },
    { id: "resonance-018", layer: PROMPT_LAYERS.RESONANCE, text: "Keep one question unanswered. Let everything else move around it.", status: "foundation" },
    { id: "resonance-019", layer: PROMPT_LAYERS.RESONANCE, text: "Write from inside a pause that has already ended.", status: "foundation" },
    { id: "resonance-020", layer: PROMPT_LAYERS.RESONANCE, text: "Start counting. Reach the thing that stops the count.", status: "foundation" },
    { id: "resonance-021", layer: PROMPT_LAYERS.RESONANCE, text: "The room has no secret. Treat that as the secret.", status: "foundation" },
    { id: "resonance-022", layer: PROMPT_LAYERS.RESONANCE, text: "Let the wrong word remain useful.", status: "foundation" },
    { id: "resonance-023", layer: PROMPT_LAYERS.RESONANCE, text: "Describe something that becomes less clear when seen closely.", status: "foundation" },
    { id: "resonance-024", layer: PROMPT_LAYERS.RESONANCE, text: "Write something that has nowhere to go. Let it finish anyway.", status: "foundation" },
    { id: "resonance-025", layer: PROMPT_LAYERS.RESONANCE, text: "Let the final sentence make the beginning impossible.", status: "foundation" },
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

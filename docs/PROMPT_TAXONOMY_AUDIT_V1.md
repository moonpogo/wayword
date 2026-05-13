# Prompt Taxonomy Audit V1

This audit extracts the current visible prompt corpus from runtime code. It does not rewrite prompts, implement layers, or change prompt behavior.

## Prompt Inventory

| Prompt | Source file |
| --- | --- |
| A kitchen after everyone left. | `src/features/prompts/prompt-library.js` |
| A room read through residue: doors and windows unnamed. | `src/features/prompts/prompt-library.js` |
| A public bench scored where hands brace. | `src/features/prompts/prompt-library.js` |
| A hallway narrowed by footfall and closing doors. | `src/features/prompts/prompt-library.js` |
| Waiting room: light, vinyl, posture, clock. No metaphor. | `src/features/prompts/prompt-library.js` |
| A cracked cup. Do not use broken or a clear synonym. | `src/features/prompts/prompt-library.js` |
| Write one room after departure. | `src/features/prompts/prompt-library.js`; `src/features/prompts/calibration-prompts.js` |
| One object staged where a decision lands. | `src/features/prompts/prompt-library.js` |
| One paragraph, one place, no explanation. | `src/features/prompts/prompt-library.js` |
| Someone lies kindly; the other knows. | `src/features/prompts/prompt-library.js` |
| Two people end a call. Write the silence only. | `src/features/prompts/prompt-library.js` |
| Someone realizes they are already being let go. No accusation, no summary. | `src/features/prompts/prompt-library.js` |
| A message unsent. Only the surface and the hand. | `src/features/prompts/prompt-library.js` |
| Write a confession that avoids the act. | `src/features/prompts/prompt-library.js` |
| The only violence is in the tone. | `src/features/prompts/prompt-library.js` |
| Envy without naming it. | `src/features/prompts/prompt-library.js` |
| Show grief through motion only. | `src/features/prompts/prompt-library.js` |
| Forgiveness as movement through a house: doors, hands, tasks. No verdict. | `src/features/prompts/prompt-library.js` |
| A decision still in the room: moved, avoided, walked around. | `src/features/prompts/prompt-library.js` |
| An offer declined. Start one minute later. | `src/features/prompts/prompt-library.js` |
| Write hunger without naming food. | `src/features/prompts/prompt-library.js` |
| Write shame through distance and posture only. | `src/features/prompts/prompt-library.js` |
| Write the body through weight, torque, and hands. | `src/features/prompts/prompt-library.js` |
| Describe one small object near you. No explanation. | `src/features/prompts/calibration-prompts.js` |
| Write one thought; return to it in a new sentence. | `src/features/prompts/calibration-prompts.js` |
| Describe the room you are in using only what can be seen. | `src/features/prompts/calibration-prompts.js` |
| One sentence: what you almost missed today. | `src/features/prompts/calibration-prompts.js` |
| Write for one uninterrupted stretch. | `src/features/writing/prompt-selection.js` |

Exact duplicates removed from the canonical list: 1.

## Classification Table

| Prompt | Proposed Layer | Confidence | Notes |
| --- | --- | --- | --- |
| A kitchen after everyone left. | Layer 1 | High | Concrete and immediate; atmosphere is present but does not require interpretation. |
| A room read through residue: doors and windows unnamed. | Reject | Medium | High-friction phrasing; "read through residue" and "unnamed" may create decoding before writing. |
| A public bench scored where hands brace. | Layer 2 | Medium | Concrete object, but "scored" adds literary ambiguity and slows entry. |
| A hallway narrowed by footfall and closing doors. | Layer 2 | High | Atmospheric and suggestive; still imageable. |
| Waiting room: light, vinyl, posture, clock. No metaphor. | Layer 1 | High | Strong immediate inventory prompt with useful anti-abstraction guard. |
| A cracked cup. Do not use broken or a clear synonym. | Layer 1 | High | Simple object plus small constraint; low latency. |
| Write one room after departure. | Layer 1 | High | Direct, bounded, and easy to start. |
| One object staged where a decision lands. | Layer 2 | Medium | Concrete object helps, but "decision lands" requires interpretation. |
| One paragraph, one place, no explanation. | Layer 1 | High | Clean ignition prompt; constraint is simple. |
| Someone lies kindly; the other knows. | Layer 2 | High | Relational tension with immediate story traction. |
| Two people end a call. Write the silence only. | Layer 2 | High | Relational and atmospheric; clear scene boundary. |
| Someone realizes they are already being let go. No accusation, no summary. | Layer 2 | Medium | Strong relational tension, but emotionally heavier than ideal for ignition. |
| A message unsent. Only the surface and the hand. | Layer 2 | Medium | Good tactile path into relational implication; slightly stylized. |
| Write a confession that avoids the act. | Layer 2 | Medium | Tension is clear, but "confession" can feel workshop-like. |
| The only violence is in the tone. | Layer 2 | Medium | Compact and charged; may be too conceptual for fast start. |
| Envy without naming it. | Layer 2 | Medium | Clear constraint, but emotion-withholding form is familiar workshop terrain. |
| Show grief through motion only. | Reject | Medium | Reads like a craft assignment and carries therapy/journaling gravity. |
| Forgiveness as movement through a house: doors, hands, tasks. No verdict. | Reject | High | Too therapeutic/conceptual for the stated editorial rules; likely hesitation-heavy. |
| A decision still in the room: moved, avoided, walked around. | Layer 2 | Medium | Evocative with physical handles, but "decision still in the room" is abstract. |
| An offer declined. Start one minute later. | Layer 1 | High | Immediate situation, concrete time jump, strong low-latency candidate. |
| Write hunger without naming food. | Layer 1 | Medium | Easy constraint with bodily access; slightly exercise-like but fast. |
| Write shame through distance and posture only. | Reject | High | Therapist-like emotional target plus craft-instruction phrasing. |
| Write the body through weight, torque, and hands. | Layer 1 | Medium | Concrete channels are useful; "torque" is specific enough to be generative. |
| Describe one small object near you. No explanation. | Layer 1 | High | Very strong immediate ignition prompt. |
| Write one thought; return to it in a new sentence. | Reject | Medium | Abstract and assignment-like; likely to produce journaling hesitation. |
| Describe the room you are in using only what can be seen. | Layer 1 | High | Direct and concrete; good calibration prompt. |
| One sentence: what you almost missed today. | Reject | Medium | Easy to answer, but leans journaling-app/personal reflection. |
| Write for one uninterrupted stretch. | Layer 1 | Medium | Functional fallback; low-friction but generic and not very generative. |

## Reject List

| Prompt | Reason |
| --- | --- |
| A room read through residue: doors and windows unnamed. | Too vague and poetically compressed; asks the writer to decode the sentence before writing. |
| Show grief through motion only. | Too workshop-like and emotionally heavy. |
| Forgiveness as movement through a house: doors, hands, tasks. No verdict. | Too therapeutic and conceptually loaded; likely to increase creative latency. |
| Write shame through distance and posture only. | Therapist-like emotional target; also resembles a craft exercise. |
| Write one thought; return to it in a new sentence. | Abstract, school-assignment feel; little concrete traction. |
| One sentence: what you almost missed today. | Journal-app tone; personal reflection arrives before scene or movement. |

## Observations

Recurring strengths:

- The best prompts are short, bounded, and imageable.
- Concrete nouns and physical channels are already a major asset: kitchen, room, bench, hallway, waiting room, cup, object, house, hands, posture.
- Several prompts successfully create story pressure without explaining it, especially "Someone lies kindly; the other knows." and "An offer declined. Start one minute later."

Recurring weaknesses:

- Some prompts lean toward compressed literary phrasing that may feel like "AI trying to sound deep."
- Emotion-name constraints appear often: grief, forgiveness, envy, shame, hunger. Hunger works better because it is bodily and less therapeutic; shame/grief/forgiveness feel heavier.
- A few prompts ask for interpretation before action: "read through residue," "decision lands," "decision still in the room."

Tonal inconsistencies:

- Calibration prompts are generally plain and usable, while some production prompts are much more stylized.
- The corpus moves between spare physical observation and MFA-workshop constraint language.
- The strongest Wayword tone seems restrained, concrete, and slightly strange; the weakest tone is solemn abstraction.

Overused structures:

- "Write X without naming Y."
- "Only..." / "No..."
- Abstract/emotional noun plus physical-channel constraint.
- One-object/one-room/one-place boundaries.

Likely Layer 1 candidates already present:

- A kitchen after everyone left.
- Waiting room: light, vinyl, posture, clock. No metaphor.
- A cracked cup. Do not use broken or a clear synonym.
- Write one room after departure.
- One paragraph, one place, no explanation.
- An offer declined. Start one minute later.
- Write hunger without naming food.
- Describe one small object near you. No explanation.
- Describe the room you are in using only what can be seen.
- Write for one uninterrupted stretch.

# Prompt Editorial Analysis V1

Source of truth: `docs/PROMPT_TAXONOMY_AUDIT_V1.md`.

This is an editorial synthesis of the current prompt system. It does not rewrite prompts, generate new prompt batches, implement layers, or change runtime behavior.

## 1. Recurring Successful Mechanics

### Immediate Scene Ignition

The strongest current mechanic is a fast scene seed: a place, object, or aftermath with enough specificity to begin writing immediately.

Examples from the audit:

- "A kitchen after everyone left."
- "Waiting room: light, vinyl, posture, clock. No metaphor."
- "Write one room after departure."
- "An offer declined. Start one minute later."

This mechanic is highly compatible with the new doctrine. It reduces creative latency because the writer does not need to solve the prompt before beginning. The prompt supplies a frame and lets language move.

### Perceptual Anchoring

Prompts that point attention toward visible, tactile, or spatial details are working well.

Examples:

- "Describe one small object near you. No explanation."
- "Describe the room you are in using only what can be seen."
- "A cracked cup. Do not use broken or a clear synonym."
- "Write the body through weight, torque, and hands."

This is one of the system's most valuable mechanics. It is immediate, non-extractive, and consistent with Wayword's observational posture.

### Bounded Constraint

The best constraints are simple, physical, and easy to obey.

Examples:

- "One paragraph, one place, no explanation."
- "A cracked cup. Do not use broken or a clear synonym."
- "Waiting room: light, vinyl, posture, clock. No metaphor."

These constraints reduce hesitation when they narrow the surface of the task. They fail when the constraint becomes a craft lesson or an emotional extraction device.

### Relational Tension With Traction

Layer 2 works best when the interpersonal situation is instantly legible.

Examples:

- "Someone lies kindly; the other knows."
- "Two people end a call. Write the silence only."
- "An offer declined. Start one minute later."

These prompts create implication without becoming therapeutic. The writer can begin with action, silence, setting, or gesture.

### Continuation / Aftermath Prompts

The current corpus has a useful instinct for entering just after an event.

Examples:

- "A kitchen after everyone left."
- "Write one room after departure."
- "An offer declined. Start one minute later."

This mechanic should be expanded. It gives the writer momentum without demanding exposition.

## 2. Recurring Failure Modes

### Interpretive Burden

The most damaging failure mode is asking the writer to interpret the prompt before writing from it.

Examples:

- "A room read through residue: doors and windows unnamed."
- "One object staged where a decision lands."
- "A decision still in the room: moved, avoided, walked around."

These are not unusable ideas, but they are poor Layer 1 candidates. They create a decoding step.

Never-do rule: Do not make Layer 1 prompts depend on abstract syntax, symbolic compression, or private metaphor.

### Therapist Extraction

Prompts that name heavy emotional states push the product toward therapy or journaling.

Examples:

- "Show grief through motion only."
- "Forgiveness as movement through a house: doors, hands, tasks. No verdict."
- "Write shame through distance and posture only."

The issue is not emotion itself. The issue is direct emotional assignment. It makes the writer feel examined.

Never-do rule: Do not ask the writer to produce grief, shame, forgiveness, healing, confession, or personal revelation as the core task.

### Workshop-Writing Tone

Several prompts sound like craft exercises.

Examples:

- "Write a confession that avoids the act."
- "Envy without naming it."
- "Show grief through motion only."
- "Write one thought; return to it in a new sentence."

The pattern is usually: name an abstract/emotional target, then impose a technique. This can be useful in a classroom, but it conflicts with Wayword's ritual minimalism.

Never-do rule: Avoid prompts that sound like they are teaching technique.

### Faux Profundity / Over-Authored Phrasing

The system sometimes reaches for literary compression where plain ignition would work better.

Examples:

- "A public bench scored where hands brace."
- "A room read through residue: doors and windows unnamed."
- "The only violence is in the tone."

These prompts may be aesthetically coherent, but they risk sounding like the app wants the writing to be serious before it has begun.

Never-do rule: Do not make the prompt itself perform profundity.

### Journaling-App Drift

Some prompts pull the writer toward personal reflection rather than perceptual ignition.

Example:

- "One sentence: what you almost missed today."

This is easy to answer, but it moves toward mindfulness-product language.

Never-do rule: Avoid direct "today / your life / what you noticed" framing unless it remains concrete and non-extractive.

## 3. Structural Patterns

### Overused Sentence Structures

The audit shows repeated reliance on a few constructions:

- "Write X without naming Y."
- "Write X through Y only."
- "Only..."
- "No..."
- "One [unit], one [container], no explanation."
- Abstract noun plus physical channel.

These structures are useful but over-concentrated. They create a recognizable house style too quickly.

### Repeated Opening Styles

Common openings include:

- "A..."
- "Someone..."
- "Write..."
- "Describe..."
- "One..."

"A..." and "One..." are generally stronger because they hand the writer an object or frame. "Write..." and "Describe..." are functional but can become assignment-like when repeated.

### Verb Habits

"Write" and "Describe" dominate the instructional prompts.

"Describe" currently works best in calibration because it is paired with immediate sensory material. "Write" becomes weaker when followed by an abstract or emotional noun.

### Prompt Rhythm

The strongest rhythm is short + concrete + one twist.

Examples:

- "A kitchen after everyone left."
- "An offer declined. Start one minute later."
- "A cracked cup. Do not use broken or a clear synonym."

The weakest rhythm is compressed abstraction + modifier stack + prohibition.

Example:

- "A room read through residue: doors and windows unnamed."

### Density Issues

Some prompts carry too many editorial intentions at once: atmosphere, abstraction, restraint, physical channel, and prohibition. The better prompts usually carry one main instruction.

## 4. Layer Distribution Analysis

Approximate distribution from the audit:

- Layer 1: 10 prompts
- Layer 2: 12 prompts
- Layer 3: 0 prompts
- Reject: 6 prompts

The corpus is not formally Layer 3-heavy, but several prompts behave like "crippled Layer 3" prompts: they contain symbolic or conceptual pressure while still posing as universal writing starters.

Examples:

- "A room read through residue: doors and windows unnamed."
- "One object staged where a decision lands."
- "A decision still in the room: moved, avoided, walked around."
- "The only violence is in the tone."

The old system overweights Layer 2 tendencies: implication, atmosphere, emotional pressure, withholding, and relational tension. That gives Wayword a distinctive seriousness, but it under-supports the new priority of low-latency ignition.

The calibration prompts are closer to the new Layer 1 doctrine than much of the production library. They are plainer, more usable, and less self-consciously literary.

## 5. Salvage Analysis

### Preserve Aggressively

These prompts are aligned with the new direction and should be treated as core pattern evidence:

- "A kitchen after everyone left."
- "Waiting room: light, vinyl, posture, clock. No metaphor."
- "A cracked cup. Do not use broken or a clear synonym."
- "Write one room after departure."
- "One paragraph, one place, no explanation."
- "An offer declined. Start one minute later."
- "Describe one small object near you. No explanation."
- "Describe the room you are in using only what can be seen."

### Preserve As Layer 2 Pattern Evidence

These are useful, but should not define Layer 1:

- "Someone lies kindly; the other knows."
- "Two people end a call. Write the silence only."
- "A message unsent. Only the surface and the hand."
- "A hallway narrowed by footfall and closing doors."

### Lightly Modify Later

These contain useful mechanics but carry friction, abstraction, or workshop residue:

- "A public bench scored where hands brace."
- "One object staged where a decision lands."
- "Someone realizes they are already being let go. No accusation, no summary."
- "Write a confession that avoids the act."
- "The only violence is in the tone."
- "Envy without naming it."
- "A decision still in the room: moved, avoided, walked around."
- "Write hunger without naming food."
- "Write the body through weight, torque, and hands."
- "Write for one uninterrupted stretch."

### Fundamentally Incompatible

These conflict most clearly with the new direction:

- "A room read through residue: doors and windows unnamed."
- "Show grief through motion only."
- "Forgiveness as movement through a house: doors, hands, tasks. No verdict."
- "Write shame through distance and posture only."
- "Write one thought; return to it in a new sentence."
- "One sentence: what you almost missed today."

## 6. Editorial Recommendations

### Expand

- Immediate scene ignition.
- Physical object prompts.
- Room/place prompts with plain constraints.
- Aftermath and continuation prompts.
- Low-stakes perceptual tasks.
- Lightly playful displacement that gives the writer a concrete entry point.

### Reduce

- Direct emotion-name prompts.
- "Without naming it" structures.
- "Only / no" prohibitions when they stack up.
- Prompts that announce literary seriousness.
- Abstract nouns used as the prompt's central engine.

### Ban

- Therapy-coded targets: grief, shame, forgiveness, healing, confession as self-extraction.
- Journaling-app phrasing: "today," "what you missed," "what you feel," "what you need."
- School/workshop syntax: technique-first assignments, especially emotion plus constraint.
- Cryptic fragments that require interpretation before writing.
- Prompts that sound profound before the writer has done anything.

### Preserve Aggressively

- Plain, imageable nouns.
- Short aftermath frames.
- Visible rooms, objects, surfaces, hands, light, posture, clocks, doors.
- One clear constraint at a time.
- Relational implication that can be entered through action rather than explanation.

## Closing Read

The current system already knows something important: Wayword prompts work when they are restrained, physical, and slightly charged. The next editorial move is not to make them deeper. It is to make the best ones faster to enter, less extractive, and more consistently concrete.

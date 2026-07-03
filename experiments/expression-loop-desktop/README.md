# Expression Loop Desktop Experiment

This isolated desktop V2 experiment implements and refines the first functional Expression Loop session for `certainty-memory-01`.

The desktop product thesis is that Wayword can keep the user's language spatially present while the practice moves through opener, expression, encounter, selection, movement, second expression, and artifact. Desktop should feel text-forward, continuous, and grounded in the current Wayword writing surface, not like the preserved mobile voice prototype.

This refinement pass prepares the prototype for founder review. It does not establish production architecture, persistence, telemetry, saved-run shape, or a desktop replacement for V1.

## Shared Grammar

```text
opener
-> expression
-> encounter
-> selection
-> movement
-> second expression
-> artifact
```

The experiment loads `docs/product/expression-loop-prototype-sessions.json` and renders only `certainty-memory-01`. The fixture is not duplicated or forked.

## Certainty Session Flow

```text
Tell a memory as if you are certain.
-> write or use OS dictation
-> settle the first expression into readable text
-> choose the sentence you trust least
-> keep that sentence bolded in context
-> repeat the sentence at the point of action
-> begin from that sentence and describe what could be wrong about it
-> write the second expression
-> finish into a restrained artifact
```

## Sentence Selection

After the first expression is settled, deterministic local segmentation turns each sentence into an inline selectable element inside the original passage. Hover and keyboard focus reveal a subtle background treatment. Enter, Space, or click commits a sentence.

The selected sentence remains bolded and underlined in context so the user can see where the choice came from. Unselected sentences return to normal.

Selection may change until meaningful second-expression input begins. Whitespace-only second-field input does not lock selection. Once typed, pasted, or OS-dictated text creates non-whitespace second-expression content, selection locks while shaping. If all second-field content is cleared before completion, selection unlocks again. After the final artifact state, selection remains locked.

## Point Of Action

The selected sentence is repeated below the passage under `You chose`. This lower instance has a different job from the bolded sentence above: it becomes the active material for the movement.

The point-of-action repeat stays synchronized with the committed selection until the selection locks.

## Flags Buffer

The area between the first expression and the movement is reserved for the future semantic channel:

- repeaters
- openings
- filler
- challenge

This pass does not detect, generate, score, or label flags. Inline highlight and bolding are only for user selection; future flags belong to a separate annotation channel.

## Second Field

The second writing field is revealed only after selection. The opener, first expression, selected sentence, and movement stay visible while the user writes. Reselection is allowed before meaningful second input begins.

## Final Artifact

The final artifact focuses on:

```text
You selected
"..."

What followed
"..."
```

The full first expression remains visible above as context, with the selected sentence still marked in place. It is not duplicated inside the artifact summary.

## Voice And Dictation

The desktop prototype supports typing and operating-system dictation as ordinary text input. It does not include browser microphone controls, browser speech recognition, or a speech lifecycle.

## State And Privacy

All state is memory-only. The prototype does not use localStorage, sessionStorage, IndexedDB, cookies, Supabase, analytics, telemetry, production APIs, or saved-run persistence. Reloading the page resets the session.

## Intended To Test

- Whether desktop can express the shared V2 grammar through spatial continuity.
- Whether inline sentence selection lets the user act without leaving the original passage.
- Whether the selected sentence can remain bolded in context while also repeating below as movement material.
- Whether the flags buffer can occupy a separate semantic channel without analysis.
- Whether the final artifact can stay restrained and user-material-first.

## Does Not Prove

- Production saved-run shape.
- Mirror, Recent Runs, or Patterns behavior for V2 runs.
- Flag detection or semantic analysis.
- Whether this layout is the final desktop design.
- Mobile voice behavior.
- Transcription accuracy.
- Any personalization or training behavior.

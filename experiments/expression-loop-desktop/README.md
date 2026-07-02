# Expression Loop Desktop Scaffold

This is the desktop V2 experiment scaffold. It starts from stable `main`, consumes the shared Expression Loop fixture, and does not copy the mobile prototype implementation.

The current Wayword desktop design canon remains the visual authority. This scaffold is intentionally unfinished: it identifies the desktop experiment, proves the route can load, and leaves room for the real interaction design.

## Boundaries

- No microphone control.
- No browser speech dependency.
- No persistence.
- No production runtime imports.
- No Supabase, authentication, telemetry, Mirror, Recent Runs, Patterns, or saved-run schema changes.
- No mobile card-flow implementation.
- No fake finished desktop design.

## Intended First Desktop Session

```text
Tell a memory as if you are certain.
-> write or use OS dictation
-> settle the first expression into readable text
-> hover/focus selectable sentences
-> click one sentence
-> leave it bolded in context
-> repeat it at the point of action
-> roll out the movement below
-> reveal the second writing field
-> keep both expressions visible
```

## Semantic Separation

- Inline background and hover treatment are for selection preview.
- Bolded text indicates committed selection.
- Repeaters, openings, filler, and challenge flags remain in a separate buffer or annotation channel.
- The selected sentence may be repeated below because its lower occurrence serves as active movement material.

## Shared Inputs

The scaffold reads:

```text
docs/product/expression-loop-prototype-sessions.json
```

Do not duplicate that fixture into mobile and desktop copies.

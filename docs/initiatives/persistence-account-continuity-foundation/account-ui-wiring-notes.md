# Account UI Wiring Notes (Account Surface Visual Refinement Pass)

## Scope

Applied a visual-only refinement pass to make Account controls distinct from Patterns tab treatment while preserving existing account behavior wiring.

## UI Surface Updates

- Header entry moved from tab-style treatment to a restrained top-right icon control:
  - `#accountBtn` remains the same runtime hook
  - visual changed from word tab to small circular glyph control
  - accessible label remains `Account`
- Patterns tab left unchanged.
- Minimal account panel with:
  - signed-out continuity note
  - email field + magic-link action
  - sign-out action
  - continuity fallback note
  - restrained account actions for export/delete when signed in
- Account panel close control refined:
  - standalone `X` presentation
  - no boxed square/pill container
  - accessible hit target preserved

## Runtime Wiring Used

- `waywordAuthSessionRuntime`
  - `signInWithMagicLink(email)`
  - `signOut()`
  - existing session callbacks in `initAccountContinuityAuthScaffold`
- `waywordPersistenceRuntime`
  - `exportOwnedRuns()`
  - `deleteAllOwnedRuns()`

## Safety Behaviors

- If Supabase is not configured:
  - panel states account continuity is not configured
  - sign-in controls stay hidden
  - no crash path introduced
- Local fallback remains explicit:
  - "Writing still saves locally if sync is unavailable."
- Draft preservation behavior remains owned by auth runtime.

## Scope Guardrails Preserved

- no profile/dashboard expansion
- no onboarding expansion
- no observatory changes
- no telemetry expansion
- no auth logic changes

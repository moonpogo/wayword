# Strata Engine V1 Plan

## 1. Purpose

Strata Engine V1 is a local/dev-only prompt pacing layer for Prompt System V1. Its job is to decide when Torsion and Resonance may enter the V1 prompt pool after Entry has had enough time to do its work.

The engine is not ranking the user. It is pacing pressure.

The core question is:

"Can this writing currently hold more pressure?"

not:

"Is this user advanced?"

The system should not expose levels publicly. Any strata, bands, or eligibility states are internal runtime terms for prompt selection only.

Production/default runtime remains V0. Local/dev V1 currently serves Entry only, and this plan does not change that behavior.

### Phase 1 Status

Phase 1 has added the signal helper module at `src/features/prompts/strata-engine.js`.

This phase is pure helpers only. There is no runtime integration yet, no routing change, and no public UI. Production/default runtime remains V0. Local/dev V1 still serves Entry only.

## 2. Non-Goals

Strata Engine V1 must not:

- infer mood
- infer personality
- diagnose the writer
- score the writer
- gamify progression
- expose levels publicly
- change production default behavior
- use LLMs
- analyze private content semantically

The engine should stay close to behavioral pacing. It should not convert writing behavior into a claim about the writer.

## 3. Signals

V1 should use lightweight behavioral signals only:

- time to first token
- words written
- sentence count
- typing continuity
- long pauses after typing begins
- rerolls
- abandoned/empty runs
- completed runs
- prompt layer used
- prompt id used
- prompt exposure history

These signals describe interaction shape: entry, motion, stall, completion, and exposure. They should not inspect private meaning, theme, sentiment, topic, or emotional content.

## 4. Local State Model

V1 pacing memory should be localStorage-only and scoped to local/dev prompt experimentation. It is behavioral pacing memory, not profiling.

Proposed storage key:

```js
waywordStrataEngineV1
```

Proposed shape:

```js
{
  version: 1,
  recentRuns: [
    {
      id: "local-run-id-or-timestamp",
      completedAt: 1710000000000,
      promptLayer: "entry",
      promptId: "entry-001",
      wordsWritten: 86,
      sentenceCount: 5,
      timeToFirstTokenMs: 4200,
      postStartPauseCount: 1,
      longestPostStartPauseMs: 9000,
      typingContinuity: 0.72,
      rerollsUsedBeforeRun: 0,
      abandoned: false,
      completed: true
    }
  ],
  completedCountsByLayer: {
    entry: 0,
    torsion: 0,
    resonance: 0
  },
  seenPromptIds: {
    entry: [],
    torsion: [],
    resonance: []
  },
  recentLatencyStats: {
    medianTimeToFirstTokenMs: null,
    trend: "unknown"
  },
  recentStallStats: {
    postStartStallRate: 0,
    repeatedShortRunRate: 0
  },
  recentRerollStats: {
    rerollRate: 0,
    excessiveRerollRate: 0
  },
  currentStratum: "entry_only",
  lastServedLayers: []
}
```

The exact field names can change during implementation, but the boundary should not: local-only, deterministic, behavior-only, and safe to discard.

State should tolerate missing fields, corrupt JSON, older versions, unavailable localStorage, and private browsing storage failures. Failure should fall back to Entry-only.

## 5. Readiness Bands

Provisional internal bands:

- `entry_only`
- `entry_with_light_torsion`
- `entry_with_torsion`
- `entry_torsion_rare_resonance`

These bands are internal only. They should never be displayed as user "levels," achievements, progress states, badges, or diagnostic labels.

The band describes the current prompt-pressure envelope, not the user's capability, identity, or development.

## 6. Provisional Weighting

Initial layer weights are provisional and should be tuned through local testing:

| Internal band | Entry | Torsion | Resonance |
| --- | ---: | ---: | ---: |
| `entry_only` | 100% | 0% | 0% |
| `entry_with_light_torsion` | 85% | 15% | 0% |
| `entry_with_torsion` | 65% | 35% | 0% |
| `entry_torsion_rare_resonance` | 55% | 35% | 10% |

These numbers are starting points only. Conservative pressure pacing matters more than reaching a target distribution.

## 7. Advancement Logic

Advancement should be conservative. A higher-pressure layer becomes eligible only when recent writing behavior suggests the current layer is not blocking entry or motion.

Initial conditions for allowing Torsion:

- enough completed Entry runs
- low or improving first-token latency
- low post-start stall rate
- low abandonment
- reasonable word count and sentence count completion
- meaningful exposure to the Entry prompt pool

Initial conditions for allowing Resonance should be stricter:

- stable Entry behavior
- some completed Torsion runs
- low abandonment after Torsion prompts
- sustained writing motion after Torsion enters the pool
- near-target completion across recent runs

Advancement should not be a one-way ladder. The engine should recalculate from recent behavior and prefer under-pressure to over-pressure when signals are mixed.

## 8. Recovery Logic

When recent behavior suggests pressure is too high, the engine should reduce pressure quietly.

Recovery triggers may include:

- stalls after typing begins
- abandoned or empty runs
- excessive rerolls
- repeated very short responses
- sharp regression in first-token latency
- repeated non-completion after Torsion or Resonance prompts

Recovery actions:

- reduce pressure
- suppress Resonance
- return toward Entry
- avoid public judgment

No recovery state should be shown as failure. The user should simply receive prompts that are easier to enter.

## 9. Prompt Selection Integration

Future integration should affect only V1 local/dev prompt selection:

- default remains V0
- V1 flag is required
- calibration remains untouched
- current stratum determines layer weights
- selected layer pulls from `LAYERED_PROMPTS_V1`
- reroll respects current layer weights
- no public UI toggle is added

The selection path should continue to use the local/dev V1 gate already described in `docs/PROMPT_SYSTEM_V1_IMPLEMENTATION_PLAN.md` and implemented through `prompt-system-mode.js`.

Calibration must remain outside strata routing. Strata should not alter calibration prompts, calibration thresholds, calibration handoff, or saved-run eligibility.

## 10. Dev Diagnostics

Dev-only diagnostics may expose:

- current stratum
- recent signal summary
- active layer weights
- last prompt layer and id
- reason Torsion is or is not eligible
- reason Resonance is or is not eligible

Diagnostics should be available only in local/dev contexts and should not create user-facing progression language. A console helper or guarded debug object is preferable to visible UI.

## 11. Testing Plan

Expected tests:

- V0 remains default
- V1 local flag required
- first V1 sessions are Entry-only
- Torsion cannot appear too early
- Resonance cannot appear too early
- stable Entry can enable light Torsion
- stable Torsion can enable rare Resonance
- stalls reduce pressure
- calibration unaffected
- state migration and fallback are safe

Tests should cover unavailable localStorage, corrupt state, missing fields, unknown strata, unknown prompt ids, and empty prompt pools. All unsafe or unreadable states should fall back to Entry-only.

## 12. Implementation Sequence

Recommended sequence:

1. Phase 1: pure signal helpers and tests
2. Phase 2: localStorage state model
3. Phase 3: readiness band calculation
4. Phase 4: weighted layer selection behind V1 local flag
5. Phase 5: dev diagnostics
6. Phase 6: lived local testing before any production consideration

Each phase should preserve the V0 default path and keep V1 behavior behind the existing local/dev flag.

## 13. Open Questions

Unresolved questions:

- exact latency thresholds
- exact word and sentence thresholds
- how many recent runs count
- how prompt exposure history should affect selection
- whether to track session-level versus lifetime behavior
- how nudges eventually tie to prompt/layer state

These should be answered through local observation and small deterministic tests before any runtime broadening.

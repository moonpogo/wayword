# Complexity Audit (Tracks 1-6)

## Snapshot

Selected size indicators:
- `script.js`: 7017 lines
- `src/infrastructure/persistence/persistence-runtime.js`: 378 lines
- `src/data/runs/savedRunPersistence.js`: 160 lines
- `src/infrastructure/telemetry/*.js` combined: 374 lines

## Complexity Findings

1. Core risk concentration remains in `script.js` orchestration size.
- Assessment: moderate-to-high maintenance drag risk
- Why: new infra hooks are safe but still wired through a very large coordinator file

2. Persistence responsibilities are mostly centralized but still span multiple seams.
- Assessment: acceptable for current phase
- Why: `persistence-runtime`, `supabase-run-store`, `savedRunPersistence`, and migration utils are coherent but cross-linked

3. Telemetry complexity is bounded and explicit.
- Assessment: good
- Why: allowlist registry + runtime + retention helper is small and test-covered

4. Auth runtime coupling is low-to-moderate.
- Assessment: good
- Why: session, snapshot, and continuity hooks remain in one runtime with narrow interface

## Hidden Complexity Growth Checks

- Persistence logic scattering: present but controlled.
- Auth/runtime dependency spread: controlled.
- Migration utility cohesion: good.
- Telemetry surface area: constrained by allowlist and tests.

## Is This Understandable By A Small Disciplined Team?

Answer: Yes, with one caution.  
Caution: `script.js` size is the main cognitive burden and should be reduced incrementally to prevent future coordination regressions.

## Simplification Pressure Areas

1. Move additional continuity/telemetry wiring seams out of `script.js` into focused runtime coordinators.
2. Keep migration status/event shaping in one persistence boundary.
3. Keep telemetry schema ownership exclusively in `event-registry.js`.

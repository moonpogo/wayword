# ADR: Expression Loop Platform Renderers

## Decision

Use one shared Expression Loop grammar with platform-specific mobile and desktop renderers.

## Context

- Mobile browser speech proved unreliable.
- Desktop browser speech created repeated permission friction.
- OS dictation works as text input, but cannot support Wayword-controlled ritual speech behavior.
- Mobile and desktop have different physical and cognitive strengths.
- The language loop, not the input modality, is the product constant.

## Consequences

Positive:

- Mobile can become voice-forward.
- Desktop can remain text-forward.
- Session content can be shared.
- Future artifacts can sync across platforms.
- Each device can use its strongest interaction model.

Costs:

- Two platform-specific interfaces must be designed and maintained.
- Shared contracts must be maintained deliberately.
- Testing and accessibility requirements differ by platform.
- Native mobile development may become necessary.

## Guardrails

- No platform may invent incompatible session semantics.
- Mobile sessions must be complete on mobile.
- Desktop must not treat speech as inferior raw material.
- Desktop must not inherit mobile card-flow assumptions.
- Shared content definitions must remain renderer-neutral.
- No production schema decision is implied by this ADR.

# Implementation Sequencing

## Phase Sequence

1. Supabase project bootstrap
2. Auth integration (email + magic link)
3. Core schema migrations
4. RLS policy deployment
5. Session persistence integration
6. Save/load continuity integration
7. localStorage migration layer
8. Minimal retention hooks
9. QA regression run and hardening

## Stop Gates

Stop and escalate if:
- auth flow adds friction beyond minimal entry
- RLS cannot guarantee tenant isolation
- migration path risks run loss/duplication
- telemetry scope expands beyond approved metrics
- framework rewrite pressure appears

## Track Dependencies

- Schema depends on identity model agreement
- RLS depends on schema ownership fields
- Continuity layer depends on auth + schema
- Migration depends on continuity conflict strategy
- Retention hooks depend on meaningful-session definition

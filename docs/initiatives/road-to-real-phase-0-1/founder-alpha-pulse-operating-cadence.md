# Founder Alpha Pulse Operating Cadence

Date: 2026-05-26
Status: Active

## Daily Rhythm

1. Run `npm run alpha:pulse` each morning.
2. Open the newly generated report in `docs/alpha-pulse/`.
3. Review only the five pulse sections.
4. Complete the Founder Notes Prompt lines manually.
5. Use notes to prioritize same-day follow-ups and interviews.

Precondition:

- the active Supabase project must already contain phase persistence tables (`users`, `runs`, `observatory_summaries`, `prompt_state`, `subscription_state`) with RLS policies from migration Track 3.

## Interpretation Guardrails

- This is founder observability, not product analytics expansion.
- Treat signals as directional, then verify with direct user conversation.
- Do not add new metrics without explicit founder approval + privacy review.
- If telemetry source is unavailable, use account/run continuity signals and proceed with manual interview cadence.

## Operational Escalation

Escalate for same-day investigation when:

- `local_only_sync_failed` rises above baseline
- `local_only_no_session` rises unexpectedly
- `migration_failed` or `migration_skipped_unverified_rls` appears
- one-run/no-return count climbs for multiple consecutive days

## Optional Scheduling (Later, not in v1)

- Optional local cron can be added later.
- Optional GitHub Action can be added later only after secrets posture review.
- No external automation services in this phase.

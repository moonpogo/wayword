# Founder Alpha Pulse Spec

Date: 2026-05-26
Status: v1
Owner: Founder operations (internal only)

## Objective

Provide one calm, founder-facing daily pulse for alpha continuity without introducing public dashboards or telemetry expansion.

## Scope

Allowed in v1:

- internal report script
- local markdown report output
- daily rollup aggregation
- existing Supabase tables (`users`, `runs`, `observatory_summaries`)
- existing approved telemetry events, when telemetry storage is available

Not allowed in v1:

- user-facing analytics dashboard
- telemetry allowlist expansion
- content analysis of writing text
- user scoring, profiling, streak systems, or engagement loops

## Report Path + Command

- script: `scripts/generate-founder-alpha-pulse.js`
- command: `npm run alpha:pulse`
- output: `docs/alpha-pulse/YYYY-MM-DD-founder-alpha-pulse.md`

## Data Boundaries

Approved event set (no additions):

- `onboarding_completed`
- `run_saved`
- `meaningful_session_completed`
- `observatory_revisited`
- `return_session_detected`
- `migration_previewed`
- `migration_completed`
- `migration_failed`
- `migration_skipped_unverified_rls`

Query policy:

- Use aggregated account/run/sync metadata only.
- Do not query or print writing bodies (`writing_text`) in the report.
- Prefer anonymized internal IDs in any internal debugging follow-up; no personal identifiers in report output.

## Fail-Safe Behavior

- Missing Supabase env (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`): hard fail with explicit message and no report written.
- Missing telemetry table/source: report still generates and marks telemetry metrics as "telemetry source unavailable."
- Empty cohort: report generates with honest zero-state values.

## Required Sections

1. Alpha Pulse Summary
2. Recurrence Signals
3. Drop-Off Watch
4. Trust / Continuity Health
5. Founder Notes Prompt

## QA Baseline

- `node --check script.js`
- `node --check scripts/generate-founder-alpha-pulse.js`
- `npm run test:logic`

## Privacy Constraints

Never include:

- writing body/content
- draft text
- prompt response content
- psychological/personality labels
- inferred sensitive traits

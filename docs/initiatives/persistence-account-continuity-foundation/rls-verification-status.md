# RLS Verification Status

Status: FAIL (BLOCKED - LIVE AUTH CREDENTIAL FAILURE)

## Migration Apply Pass Addendum (2026-05-26)

- Founder Alpha Pulse run now reaches live Supabase with service-role auth.
- Alpha pulse still fails against the currently targeted project with:
  - `Could not find the table 'public.users' in the schema cache`
- Result: table/RLS verification remains blocked until the target project has the phase migrations applied and schema cache reflects those tables.
- No RLS policies were disabled or relaxed in this pass.

## Last Updated

- date: 2026-05-24
- pass: Live Configured Account QA + RLS Verification (rerun attempted)
- environment: `.env` present with real project host and all required keys
- tester/operator: Codex

## Execution Attempt Summary

What succeeded:

- required env keys are present (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, dual-user credentials, `SUPABASE_RLS_VERIFIED`)
- `SUPABASE_URL` format passes basic `http(s)` validation
- project logic/test baseline remains healthy (`node --check script.js`, `npm run test:logic`)

What failed:

- live sign-in for User A failed with:
  - `Invalid login credentials`
- rerun result remained the same after credential update notice
- because authenticated sessions could not be established, dual-user RLS isolation cases could not proceed

Without successful authenticated user sessions, dual-user authenticated RLS isolation checks cannot be executed.

## Required Live Cases (Still Pending)

0. User A and User B credentials authenticate successfully
1. user A cannot read user B runs
2. user A cannot insert rows for user B
3. user A cannot update user B rows
4. user A cannot delete user B rows
5. unauthenticated access denied appropriately
6. migration executor respects ownership constraints
7. export respects ownership constraints
8. delete respects ownership constraints

## Non-Negotiable Rule

Do not mark PASS until all live cases above execute successfully with real user sessions.

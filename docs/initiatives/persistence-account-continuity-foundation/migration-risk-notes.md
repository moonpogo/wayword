# Migration Risk Notes (Track 5 Update)

## Key Risks

1. Duplicate run migration risk
- mitigated by deterministic fingerprint comparison
- local-only uploads filtered against server fingerprint set

2. client_run_id collision risk
- mitigated by conflict classification path
- same client_run_id + different fingerprint is flagged as conflict (no overwrite)

3. Silent draft loss risk during auth boundaries
- mitigated by auth runtime draft snapshot preservation

4. Ownership mismatch risk
- mitigated by RLS ownership enforcement migration

5. Premature migration risk
- mitigated by RLS verification gate (`SUPABASE_RLS_VERIFIED`)
- executor status becomes `skipped_unverified_rls` when verification is not complete

6. Trust overclaim risk
- mitigated by explicit trust baseline and explicit pending-status language
- no claim may state verified isolation while RLS live verification is pending

7. Telemetry drift risk
- mitigated by Track 5 telemetry minimum registry and prohibited event list

## Residual Risk

- live RLS verification is still procedural, not automated in-repo
- export/delete behavior is defined but full execution wiring remains pending authorization
- large-corpus conflict policy still needs real cohort validation

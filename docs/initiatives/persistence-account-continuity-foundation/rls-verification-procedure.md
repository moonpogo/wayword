# RLS Verification Procedure (Track 3)

Status: manual SQL verification procedure (local Supabase harness not yet integrated in repo)

## Preconditions

- migrations `20260524_0001_phase1_persistence_foundation.sql` and `20260524_0002_phase1_rls_ownership_enforcement.sql` applied
- two test users exist in auth.users (User A, User B)

## Verify Cases

1. User A can select own runs
- auth as User A
- query `select * from public.runs where user_id = auth.uid();`
- expect: success

2. User A cannot select User B runs
- auth as User A
- query rows known to belong to User B
- expect: zero rows returned

3. User A cannot insert run for User B
- auth as User A
- attempt insert with `user_id = <User B id>`
- expect: RLS violation / insert denied

4. User A cannot update User B run
- auth as User A
- attempt update on User B row
- expect: zero rows affected / denied

5. User A cannot delete User B run
- auth as User A
- attempt delete on User B row
- expect: zero rows affected / denied

6. Unauthenticated access is denied
- run select/insert against protected tables without auth session
- expect: denied or zero rows per policy boundary

## Additional Table Checks

Repeat ownership checks for:
- observatory_summaries
- prompt_state
- subscription_state
- users (id = auth.uid() mapping)

## Acceptance

Track 3 is accepted only if all above checks pass with no cross-user leakage.

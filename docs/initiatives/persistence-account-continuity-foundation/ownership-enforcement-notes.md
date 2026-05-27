# Ownership Enforcement Notes (Track 3)

## Coverage

RLS enabled on:
- users
- runs
- observatory_summaries
- prompt_state
- subscription_state

## Ownership Model

- users: row id must equal auth.uid()
- all other user-owned tables: user_id must equal auth.uid()

## Policy Surface

Each covered table includes:
- SELECT own rows only
- INSERT own rows only
- UPDATE own rows only
- DELETE own rows only

## Enforcement Boundary

Security is database-enforced (RLS), not client-filter enforced.
Any query path that relies only on frontend filtering is out of policy.

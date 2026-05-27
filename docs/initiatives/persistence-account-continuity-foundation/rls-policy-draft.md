# RLS Policy Draft

## Objective

Guarantee strict user data isolation.

## Ownership Boundary

- users may only read/write rows where row.user_id == auth.uid()
- service-role access restricted to server-side trusted operations only

## Required Policies

For runs / observatory_summaries / prompt_state / subscription_state:
- SELECT: own rows only
- INSERT: own user_id only
- UPDATE: own rows only
- DELETE: own rows only

## Safety Rules

- no cross-user joins in client-exposed queries
- reject anonymous write paths for persistent tables
- verify policy coverage before feature enablement

## Verification Cases

- authenticated user can access own records
- authenticated user cannot access other user records
- unauthenticated actor cannot access protected tables

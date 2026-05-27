# Auth Flow Definitions

## Auth Lock

- Provider: Supabase Auth
- Modes: email auth + magic link
- Deferred: social and enterprise auth

## Required Flows

1. Sign up (email)
2. Sign in (email/magic link)
3. Session restore on reload
4. Sign out
5. Expired session recovery

## UX Constraints

- minimal friction
- calm language
- no auth complexity theater
- no intimidation copy

## Failure States

- invalid link
- expired link
- network interruption during auth
- stale session token

## Recovery Rules

- always return user to writing continuity context when possible
- preserve unsaved local draft state during auth failures
- never drop user into dead-end auth screens

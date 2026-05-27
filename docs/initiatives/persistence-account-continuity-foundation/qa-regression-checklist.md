# QA Regression Checklist

## Auth + Session

- sign up works
- sign in works
- sign out works
- session recovers after reload
- expired session recovers without data loss

## Persistence + Continuity

- run save integrity preserved
- load integrity preserved
- continuity survives reload
- continuity survives sign in/out boundary
- continuity survives multi-device fetch consistency (alpha scope simulation)

## Migration

- local-only user migrates cleanly
- merge path avoids duplication
- failed migration preserves local backup
- migrated runs remain readable in observatory dependencies

## Security

- unauthorized cross-user access denied
- RLS policies enforce ownership boundaries
- unauthenticated protected-table access denied

## Retention Hooks

- meaningful-session events recorded correctly
- observatory revisit events recorded correctly
- no unauthorized telemetry categories emitted

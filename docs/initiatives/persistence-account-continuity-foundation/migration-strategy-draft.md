# Continuity Migration Strategy Draft

## Migration Goal

Safely transition from local continuity to account-backed continuity without loss, duplication, or confusion.

## Source States

- local-only runs in localStorage
- authenticated account with no server runs
- authenticated account with existing server runs

## Merge Strategy

1. Detect local continuity payload at auth boundary.
2. If server-empty: migrate local runs as authoritative seed.
3. If server-nonempty: merge by deterministic conflict rules.
4. Mark migrated runs with save_source=migrated.

## Duplicate Prevention

- deterministic run fingerprint (timestamp window + content hash)
- idempotent migration operation token per user/session

## Fallback Strategy

- if migration fails, preserve local payload and retry path
- block destructive local cleanup until migration verification passes

## User Trust Rules

- no silent data discard
- no hidden overwrite of newer user-authored run
- continuity messaging remains calm and plain-language

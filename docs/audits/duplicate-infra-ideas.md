# Duplicate Infra Ideas Audit

Date: 2026-05-29
Scope: Extract useful behavioral ideas from duplicate infrastructure files before deletion.

## Source Files Audited

- `src/infrastructure/persistence/persistence-runtime 2.js`
- `src/infrastructure/telemetry/event-registry 2.js`

## Preserved Ideas (Behavioral / Architectural)

### From `persistence-runtime 2.js`

1. **Server-only classification output**
- Add explicit `serverOnly` results during migration preview/classification.
- Purpose: reveals runs present remotely but absent locally, improving migration observability and reconciliation diagnostics.

2. **Client-run-id conflict bucketing**
- Group server rows by `client_run_id` and report conflicts as grouped buckets rather than first-hit conflict only.
- Purpose: improves conflict transparency when multiple server rows collide with one local client run identity.

3. **Richer migration telemetry payload counts**
- Emit structured migration metrics in telemetry payloads (for preview/completed/failed), including:
  - local count
  - server count
  - duplicate count
  - local-only count
  - conflict count
  - upload count
  - status
- Purpose: enables stronger internal migration health monitoring without relying on raw content.

### From `event-registry 2.js`

1. **Expanded prohibited payload key list**
- Broaden blocked keys for telemetry payload sanitization (e.g., keys related to writing content, draft/body, and sensitive interaction traces like keystrokes/cursor path).
- Purpose: reduce privacy/compliance risk by rejecting more potentially sensitive payload fields.

## Deletion Decision

These ideas are now documented so duplicate files can be removed without losing candidate design directions.
Canonical runtime behavior remains unchanged in this pass.

# Implementation Simplification Opportunities (Post Tracks 1-6)

## Objective

Reduce complexity without weakening trust, continuity, or safety gates.

## Opportunities

1. Extract continuity + retention hook orchestration from `script.js`.
- Current cost: high central-file cognitive load
- Benefit: safer incremental changes, clearer ownership boundaries
- Constraint: no behavior change during extraction

2. Consolidate migration event emission shaping in one helper inside persistence runtime.
- Current cost: repeated payload-shaping patterns
- Benefit: fewer drift points between migration states and telemetry

3. Keep save-sync status mapping (`server_synced` vs `local_only_fallback`) as a shared utility.
- Current cost: mapping logic can duplicate over time
- Benefit: consistent trust language and analytics semantics

4. Add a single implementation-status table doc section in morning report templates.
- Current cost: status is clear but repeated across multiple docs
- Benefit: less reporting overhead, faster founder scanning

5. Add targeted race-condition test cases for migration executor before wider cohorts.
- Current cost: unresolved confidence for overlap edge scenarios
- Benefit: stronger continuity confidence without scope expansion

## Explicit Non-Opportunities (Do Not Do)

- No framework rewrite
- No telemetry scope expansion
- No observatory expansion in this initiative
- No auth complexity layering beyond current scope

## Priority Order

1. migration + RLS risk closure
2. script.js seam extraction for continuity/telemetry
3. migration race-condition tests

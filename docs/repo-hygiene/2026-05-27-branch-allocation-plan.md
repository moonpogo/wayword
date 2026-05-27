# Branch Allocation Plan - 2026-05-27

Source snapshot commit: `4fee5b7` on `recover/repo-state-2026-05-27`

## 1) feature/persistence-foundation
- Proposed commit message: `feat: add persistence foundation runtime, stores, migrations, and continuity docs`
- Risk level: High
- Runtime/tests affected: Yes (runtime + tests)
- Paths:
  - `src/infrastructure/persistence/local-run-store.js`
  - `src/infrastructure/persistence/persistence-runtime.js`
  - `src/infrastructure/persistence/run-migration-utils.js`
  - `src/infrastructure/persistence/supabase-run-store.js`
  - `src/infrastructure/telemetry/event-registry.js`
  - `src/infrastructure/telemetry/retention-events.js`
  - `src/data/runs/savedRunPersistence.js`
  - `supabase/migrations/20260524_0001_phase1_persistence_foundation.sql`
  - `supabase/migrations/20260524_0002_phase1_rls_ownership_enforcement.sql`
  - `tests/persistence-migration.test.cjs`
  - `tests/retention-telemetry.test.cjs`
  - `docs/initiatives/persistence-account-continuity-foundation/**`
  - `docs/TRACE_FIELD_V0_EVIDENCE_SPEC.md`
  - `docs/TRACE_FIELD_SAFETY_QA_CHECKLIST.md`

## 2) feature/trace-field-v0
- Proposed commit message: `feat: add trace-field v0 harness, fixtures, prototype rail, and visual grammar docs`
- Risk level: Medium-High
- Runtime/tests affected: Yes (feature harness + tests)
- Paths:
  - `src/features/trace-field/trace-field-v0-harness.js`
  - `tests/trace-field-v0-harness.test.cjs`
  - `tests/fixtures/trace-field-v0-fixture.json`
  - `tests/fixtures/trace-field-v0-edge-cases.json`
  - `scripts/run-trace-field-v0-harness.js`
  - `field-rail-v1/index.html`
  - `field-rail-v1/mockSignals.js`
  - `field-rail-v1/rail.js`
  - `field-rail-v1/styles.css`
  - `docs/trace-field-approved-language.md`
  - `docs/TRACE_FIELD_RESEARCH_BRIEF.md`
  - `docs/initiatives/trace-field-visual-grammar/**`
  - `docs/initiatives/trace-field-internal-proposal-review/**`

## 3) feature/season-wheel-fixes
- Proposed commit message: `fix: align season wheel parity, calendar truth rendering, and post-run messaging`
- Risk level: Medium
- Runtime/tests affected: Yes (UI/runtime behavior)
- Paths:
  - `src/ui/render-patterns.js`
  - `src/ui/render-post-run.js`
  - `scripts/compare-current-wheel-to-canon.mjs`
  - `scripts/compare-wheel-scaffold-to-canon.mjs`
  - `scripts/validate-season-wheel-pixel-parity.mjs`
  - `tests/app-logic.test.cjs` (already updated on `main`; include only if snapshot delta exists during separation)

## 4) docs/founder-presence-system
- Proposed commit message: `docs: add founder presence language system, alpha pulse artifacts, and social generation tooling`
- Risk level: Low-Medium
- Runtime/tests affected: Mixed (mostly docs; some script/test)
- Paths:
  - `docs/brand-language/founder-presence-posts.md`
  - `docs/brand-language/wayword-canonical-language-shortlist.md`
  - `docs/brand-language/wayword-language-base.md`
  - `docs/brand-language/wayword-social-fragment-packs.md`
  - `docs/alpha-pulse/2026-05-25-founder-alpha-pulse.md`
  - `docs/initiatives/road-to-real-phase-0-1/**`
  - `docs/initiatives/operating-kernel-retrospective/**`
  - `docs/initiatives/encrypted-local-first-observatory/**`
  - `docs/domains/**`
  - `scripts/generate-founder-alpha-pulse.js`
  - `scripts/generate-social-assets.js`
  - `scripts/helpers/social-state-seeds.js`
  - `scripts/export-visual-assets.js`
  - `tests/founder-alpha-pulse.test.cjs`
  - `package.json` (script additions)

## 5) chore/repo-cleanup-assets
- Proposed commit message: `chore: normalize repo metadata and review brand asset/env hygiene`
- Risk level: High (potentially destructive if mishandled)
- Runtime/tests affected: Possibly (asset references + env handling)
- Paths:
  - `assets/.DS_Store`
  - `assets/brand/o-blob-pack-v1/light/svg/.o-blob-light.svg.icloud`
  - `assets/brand/o-blob-pack-v1/dark/png/o-blob-dark-4096.png` (deleted in snapshot)
  - `assets/brand/o-blob-pack-v1/dark/png/o-blob-dark-8192.png` (deleted in snapshot)
  - `assets/brand/o-blob-pack-v1/dark/svg/o-blob-dark.svg` (deleted in snapshot)
  - `assets/brand/o-blob-pack-v1/light/png/o-blob-light-4096.png` (deleted in snapshot)
  - `assets/brand/o-blob-pack-v1/light/png/o-blob-light-8192.png` (deleted in snapshot)
  - `assets/brand/o-blob-pack-v1/light/svg/o-blob-light.svg` (deleted in snapshot)
  - `assets/brand/o-blob-pack-v1/preview-on-dark/o-blob-dark-8192-on-dark.jpg` (deleted in snapshot)
  - `.env.save`
  - `.env.example`

## Cross-branch notes
- `index.html` should be reviewed before allocation; it mixes landing copy and cache-bust versioning and may belong with seasonal UX/copy or docs/editorial depending on intent.
- `docs/OBSERVATORY_SAFETY_DOCTRINE.md` can stay with persistence/observatory policy, but may also be split to docs branch if kept non-runtime.
- `docs/repo-hygiene/2026-05-27-state-audit.md` and `docs/repo-hygiene/2026-05-27-main-sync-review.md` should remain hygiene-only artifacts.

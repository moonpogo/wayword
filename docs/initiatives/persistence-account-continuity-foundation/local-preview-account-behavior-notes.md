# Local Preview Account Behavior Notes

## Current State

- Account surface is available in local preview.
- No crash path observed in baseline checks.
- Logic test suite remains fully passing.
- Preview server now injects browser runtime env from `.env`.
- Magic-link hash callback handling is now active on page load.
- Account entry is now a top-right icon control (no tab styling).
- Account panel close control is now a standalone `X` (no boxed container).

## Live Configured QA Status

Local runtime configuration + callback behavior:

- `window.__WAYWORD_ENV` now exists in served HTML during preview.
- `window.waywordEnv` now resolves Supabase configured/unconfigured state from injected values.
- account continuity no longer relies on missing static build-time env exposure.
- hash callback now attempts session restore before initial auth status settles.
- sensitive auth hash is scrubbed from URL after callback processing.

Operational note:

- restart preview server after `.env` changes so injected runtime values stay current.
- mobile layout guardrail preserved (no auth behavior or feature-scope changes in this pass).

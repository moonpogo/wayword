# Auth QA Notes (Supabase Magic-Link Send Failure Debug)

## Pass Status

Status: PASS (failure condition identified)

## Diagnosis Summary

Magic-link send path now has exact safe diagnostics.

Captured live Supabase responses:

- `Signups not allowed for otp` (`code=otp_disabled`, `status=422`) when forcing no-create OTP in direct diagnostic call
- `Unable to validate email address: invalid format` (`code=validation_failed`, `status=400`) when test email source was placeholder (`...`)
- `email rate limit exceeded` (`code=over_email_send_rate_limit`, `status=429`) with valid-format address attempts

These responses confirm the auth request is reaching Supabase and failing on concrete auth conditions, not missing runtime configuration.

## Verification Checks

- Email provider is enabled on project (`/auth/v1/settings` reports `external.email=true`)
- Anon key is valid for active project (auth settings and auth API responses returned successfully)
- Runtime auth API usage matches Supabase JS v2:
  - using `supabase.auth.signInWithOtp`
  - using `options.emailRedirectTo`
- Redirect target is now set explicitly to current local app URL (`origin + pathname`)

## Temporary Safe Logging Added

- `src/infrastructure/auth/auth-session-runtime.js`:
  - auth request start log
  - auth result log with `code/status/message` only
- `script.js`:
  - UI-layer send failure log with `code/status/message` only

No secrets or token values are logged.

## Current Failing Condition

- Current send failures are explained by:
  - invalid email input placeholders (if used), and/or
  - Supabase email send rate limiting (`429`)

Successful send should resume after:
- valid real email format is used
- provider rate-limit window clears

## QA Commands

- `node --check script.js` -> PASS
- `npm run test:logic` -> PASS (101/101)

# Stack Decisions Lock Packet

Initiative: Road to Real - Phase 0 to Phase 1 Operationalization  
Phase: 0 (Operationalization)  
Status: Locked for alpha-scale execution

## Mission

Lock production stack and operational constraints required to move Wayword from local prototype into persistent alpha infrastructure.

This packet is:
- architectural lock
- execution simplification
- anti-drift enforcement

This packet is not:
- implementation
- deployment
- optimization
- experimentation

## ELI5 Execution Debrief

Wayword is moving from:
- local prototype continuity

to:
- persistent, trustworthy, multi-session, account-based continuity with retention and payment readiness

The goal is simple trusted continuity, not infrastructure complexity.

## Primary Objective

Create the simplest trustworthy infrastructure capable of supporting:
- observatories
- persistence
- accounts
- subscriptions
- retention measurement
- longitudinal continuity

Without:
- overengineering
- framework churn
- architecture fantasy
- premature scale complexity

## Canonical Stack Locks

### Frontend (LOCK)

- existing SPA architecture retained
- no framework rewrite authorized
- existing observatory interaction grammar preserved

Rationale:
- current system already contains doctrine alignment, interaction cadence, observatory logic, and continuity behavior
- rewrite adds entropy without retention leverage

### Deployment (LOCK)

- Vercel

Rationale:
- fast deployment velocity
- sufficient alpha-scale stability
- low operational overhead

### Auth (LOCK)

- Supabase Auth

Initial modes:
- email auth
- magic link acceptable

Deferred:
- social auth
- enterprise auth
- advanced auth provider expansion

Rationale:
- prioritizes persistence + low-friction onboarding without auth overbuild

### Database (LOCK)

- Supabase PostgreSQL

Rationale:
- Wayword data is relational, temporal, and longitudinal

Canonical entity direction:
- users
- runs
- observatory summaries
- prompt state
- subscription state
- seasonal continuity

Explicit lock:
- no vector database authorized in this phase

### Analytics (LOCK)

- minimal PostHog instrumentation

Track:
- onboarding completion
- save events
- observatory interactions
- return frequency
- retention intervals

Do not track:
- invasive behavioral telemetry
- excessive clickstream analysis
- manipulative engagement metrics

Rationale:
- trust posture requires restraint and telemetry minimum

### Payments (LOCK)

- Stripe

Initial model:
- monthly subscription only

Deferred:
- annual pricing
- lifetime pricing
- discount systems
- referral systems

Rationale:
- first validation target is sustained willingness to return and pay, not pricing complexity

### Telemetry Posture (LOCK)

- telemetry minimum
- explicit privacy boundaries
- export/delete capability required
- non-extractive posture mandatory

User trust target:
- respected
- calm
- unharvested
- unmanipulated

## Meaningful Session Definition (Canonical Draft)

A meaningful session includes:
- completed writing pass
- and save event or observatory interaction
- and evidence of voluntary continuation behavior

Rationale:
- raw session count is insufficient for product truth

## Anti-Delusion Metrics (Lock)

Track:
- percent of users who correctly understand Wayword purpose
- percent returning voluntarily
- percent revisiting observatories
- percent repeatedly saving runs
- percent misclassifying Wayword as:
  - productivity app
  - therapy tool
  - AI assistant
  - journaling tracker

Rationale:
- aesthetic fascination alone is not validation

## Conductor Prune Authority (Operational Lock)

Conductor is explicitly authorized to:
- freeze low-leverage initiatives
- reject speculative expansion
- collapse duplicate workstreams
- require retention justification for new systems

Rationale:
- primary existential risk is uncontrolled conceptual expansion

## Phase 0 Success Condition (Stack Packet Context)

Success if:
- stack decisions finalized
- observatory freeze packet complete
- alpha definition packet complete
- implementation ambiguity materially reduced
- infrastructure drift risk constrained

## No-Go Conditions

Stop if:
- framework rewrite pressure emerges
- observatory scope expands during infra hardening
- telemetry posture becomes extractive
- implementation exceeds retention justification
- architecture complexity exceeds alpha-scale needs

## Decision Effect

This packet locks the stack and operational constraints for Phase 0.
No stack churn is authorized unless founder explicitly reopens a lock with retention-justified rationale.

## Next Valid Continuation

Observatory Architecture Freeze Packet with canonical definitions for:
- Season Wheel
- Trace Field
- Pulse
- Drift Atlas

Required per instrument:
- emotional purpose
- interaction grammar
- sparse-state behavior
- heavy-state behavior
- mobile constraints
- data dependencies
- doctrine risks
- failure conditions

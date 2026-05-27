# Safety/Privacy Output

Initiative: Encrypted Local-First Observatory Architecture  
Lane: Safety/Privacy  
Scope: Privacy red lines and trust constraints

## Core Safety Position

Wayword observes language behavior and does not diagnose the user.
This architecture initiative must preserve that doctrine and user ownership posture.

## Privacy Red Lines

1. Source writing
- Source writing must not be server-readable by default or fallback.
- Any architecture path requiring server-readable writing is NO-GO.

2. Derived observatory artifacts
- Derived artifacts are part of user writing trust surface.
- Derived artifacts must inherit deletion guarantees.
- Derived artifacts must not be retained after source deletion.

3. Indexes and caches
- Local and synced indexes/caches must be deletion-cascaded.
- Cache convenience cannot override deletion commitments.

4. Future embeddings
- Embedding-like artifacts are out of scope for this initiative.
- If considered later, they inherit same deletion and privacy constraints as source/derived text.

5. Sync posture
- Sync may store ciphertext and minimal operational metadata only.
- No server-side plaintext observatory reconstruction.

6. Export posture
- Export must include user-owned source and relevant derived artifacts required for continuity verification.
- Export language must not imply hidden analysis certainty.

## Required Answers

Should derived observatory artifacts inherit deletion guarantees?
- Yes. Mandatory. No exceptions.

Can server-readable writing ever be allowed?
- Not within this initiative or current privacy posture.
- Any proposal requiring it triggers NO-GO and founder escalation.

What privacy posture must remain true before accounts/payments?
- local-first ownership remains primary
- no server-readable writing
- deletion guarantees include source + derived artifacts
- billing/account identity remains logically separated from observatory semantics

## Additional Safety Constraints

- no hidden inference expansion through metadata accumulation
- no “privacy by marketing” claims without verifiable architecture backing
- no trust language beyond tested guarantees

## Safety Status

Safety gate is conditionally PASS for docs planning only, with hard blockers:
- reject any architecture path requiring server-readable writing
- reject any path that cannot delete derived artifacts with source lifecycle

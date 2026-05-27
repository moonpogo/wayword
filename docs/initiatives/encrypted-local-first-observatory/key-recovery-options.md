# Key Recovery Options

Initiative: Encrypted Local-First Observatory Architecture  
Continuation: Key Recovery + Metadata Boundary Decision Packet  
Scope: Docs-only planning for Gate 1

## Decision Context

Gate 1 requires selecting a key recovery philosophy that preserves:
- local-first as non-negotiable floor
- no server-readable user writing
- deletion parity for source + derived artifacts

Any model requiring server-readable writing is rejected.

## Option 1: No Recovery (User-Held Key Only)

Description:
- user holds the only decryption key
- no backup recovery path managed by Wayword

User experience:
- strongest control posture
- highest risk of permanent data loss if key/device is lost

Privacy strength:
- very high

Failure modes:
- irrevocable loss from key/device loss
- increased user error impact

Support burden:
- low technical recovery burden
- high user education burden

Doctrine alignment:
- strong alignment with ownership and restraint

Deletion implications:
- straightforward local/source/derived deletion coherence

Sync implications:
- difficult cross-device continuity unless separate user-managed key transfer exists

No-go risks:
- user attrition due to no-recovery friction

Recommendation:
- viable as strict baseline/fallback mode, but likely insufficient as sole model

## Option 2: Recovery Phrase Model

Description:
- user receives recovery phrase that can recreate key material
- phrase is never server-resolved into readable content

User experience:
- moderate complexity
- familiar mental model for key backup

Privacy strength:
- high if phrase generation/storage remains user-controlled

Failure modes:
- phrase loss compromises recoverability
- phrase theft compromises confidentiality

Support burden:
- moderate onboarding and safety warning burden

Doctrine alignment:
- good alignment if phrasing avoids certainty/overpromise and preserves ownership

Deletion implications:
- deletion parity unaffected if recovered key only restores user-held ciphertext

Sync implications:
- compatible with encrypted sync and device replacement

No-go risks:
- unsafe UX could cause phrase mishandling

Recommendation:
- strong candidate for staged exploration with strict UX safety constraints

## Option 3: Device-Held Keychain Model

Description:
- key stored in platform keychain/secure enclave layers on each trusted device
- recovery depends on device/platform trust features

User experience:
- low friction on a single device
- variable cross-device experience by platform

Privacy strength:
- high for local compromise resistance

Failure modes:
- platform lockout
- device loss without other recovery path
- vendor ecosystem dependence

Support burden:
- medium to high due to platform differences

Doctrine alignment:
- acceptable if framed as local security convenience, not absolute guarantee

Deletion implications:
- local deletion straightforward; multi-device deletion needs sync-aware tombstone handling

Sync implications:
- requires a complementary encrypted key portability/recovery path for continuity

No-go risks:
- hidden platform assumptions may confuse user trust posture

Recommendation:
- useful as supporting mechanism, not full recovery philosophy by itself

## Option 4: Multi-Device Encrypted Sync Key Model

Description:
- a dedicated sync key is encrypted and shared between trusted devices
- devices perform key exchange without exposing readable writing to server

User experience:
- better continuity once trust graph is established
- more complex device onboarding

Privacy strength:
- high if key exchange remains end-to-end and server-blind

Failure modes:
- key graph desync
- malicious device enrollment risk
- difficult recovery if all trusted devices are lost

Support burden:
- high protocol and support complexity

Doctrine alignment:
- aligned only if complexity does not force fallback to server-readable flows

Deletion implications:
- deletion parity requires robust propagation of tombstones and key revocation semantics

Sync implications:
- strong multi-device continuity candidate

No-go risks:
- complexity can create trust gaps if poorly explained or partially implemented

Recommendation:
- candidate for later stage exploration after metadata and revocation policies are explicit

## Option 5: Account-Assisted Recovery (No Server-Readable Content)

Description:
- account assists identity/re-auth flows while recovery material remains encrypted and unreadable to server
- possible split-key or escrow-like design where server never has complete readable key path

User experience:
- potentially smoother recovery than phrase-only model
- requires careful trust communication

Privacy strength:
- medium-high to high depending on exact cryptographic split and metadata minimization

Failure modes:
- account compromise risk
- recovery channel hijack risk
- metadata linkage pressure

Support burden:
- high operational and policy burden

Doctrine alignment:
- conditional alignment if account layer does not weaken local-first ownership or privacy posture

Deletion implications:
- account deletion and content deletion must both preserve source+derived parity and finality

Sync implications:
- compatible with encrypted sync if server remains ciphertext-only

No-go risks:
- accidental drift into server-readable recovery pathways
- marketing pressure to overclaim recovery certainty

Recommendation:
- exploratory only until founder resolves metadata boundary and recovery trust policy

## Explicitly Rejected Unsafe Models

1. Server-readable escrow
- model where server can decrypt user writing or recovery material directly
- rejected: violates founder ruling and safety red lines

2. Support-staff plaintext recovery
- model requiring staff/admin access to readable user writing
- rejected: violates doctrine and privacy posture

3. “Temporary plaintext for recovery” pathways
- any fallback that exposes readable writing to server during recovery workflows
- rejected: hard NO-GO

## Comparative Summary

Most doctrine-aligned immediate exploration path:
- Option 2 (Recovery Phrase) + Option 3 (Device Keychain support)

Extended continuity exploration path:
- Option 5 (Account-assisted, server-blind) only after metadata boundary is settled

Deferred high-complexity path:
- Option 4 until revocation, trust graph, and deletion-propagation details are mature

## Gate 1 Recommendation

Recommended founder direction:
1. adopt a baseline philosophy:
- recovery is user-controlled and server-blind

2. approve staged path:
- Stage A: phrase-first + device keychain support
- Stage B exploratory: account-assisted server-blind recovery under strict metadata constraints

3. prohibit permanently:
- any server-readable writing recovery model

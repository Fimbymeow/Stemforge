# STEM Forge Confirmed Guest Progress Import

Updated: 16 July 2026
Status: Sprint 14 implementation

## Outcome

An authenticated learner can explicitly add canonical V4 evidence saved in the current browser to their trusted application owner. Import includes attempts, support events, stage achievement snapshots and path achievement snapshots. Nothing uploads on sign-in or before confirmation. Canonical local evidence remains untouched after success, partial result or failure.

This is a one-time or explicitly repeated import boundary. It is not continuous cross-device synchronization.

## Browser boundary

The active evidence key remains `stemforge.localProgress.v1`. `inspectLocalProgress()` parses and invokes the existing conservative migration without rewriting raw storage. Malformed JSON and unsupported future versions are not uploaded or overwritten. Repaired V4 imports only valid recovered records and tells the learner when records were dropped.

Import acknowledgement metadata is separate under `stemforge.progressImport.v1`. It stores only a domain-separated account fingerprint and per-event accepted/already-present/conflict-retained acknowledgement. Pending work is always derived as canonical event IDs minus acknowledged IDs for the current fingerprint. `stemforge.pathCelebration.v1` is never inspected or imported.

Metadata writes reload the latest value and union acknowledgements. Supporting browsers also use an exclusive Web Lock across tabs. A lost local acknowledgement remains safe: stable remote event identity makes retry idempotent.

## Protocol

`POST /api/progress/import` accepts only:

```json
{"protocolVersion":1,"evidence":{"version":4,"data":{"attempts":[],"supportEvents":[],"achievementSnapshots":[]}}}
```

Unknown envelope fields—including any owner, user, account, email or provider-subject field—are rejected. The route requires `application/json`, configured same-origin integrity, a maximum 1,050,000-byte raw envelope, canonical V4 validation, at most 500 evidence records and at most 1,000,000 evidence bytes.

The server resolves ownership only through `resolveCurrentAuthenticatedOwner()`. It returns minimum per-event metadata for `accepted`, `alreadyPresent`, `conflictRetained`, `rejected` and `notProcessed`. Owner IDs, provider identities, emails, answers, payloads, hashes, SQL errors and credentials are never returned.

Accepted, duplicate and conflict acknowledgements are returned only after the repository transaction commits or after an already durable row is read. Unexpected SQL failure rolls back all valid records in that batch. Unknown delivery outcome remains pending locally and may be retried.

## Database integrity

`1752670800000_guest-progress-owner-integrity.js` adds four forward-only `NOT VALID` foreign keys to `stemforge_identity.application_owners`. `NOT VALID` preserves historical Sprint 12 rows but enforces every new attempt, support event, snapshot and conflict. Existing owner-first indexes, receive order, uniqueness, payload hashing, append-only triggers and privilege revocations are unchanged.

## Privacy and account switching

Old anonymous evidence cannot prove who created it. Import therefore always requires confirmation. If this browser has acknowledgements for another non-sensitive account fingerprint, the learner sees a warning and must take a separate continue action before the normal import confirmation. No automatic ownership claim is made, and local evidence is never deleted.

## Deferred boundary

Sprint 15 may add incremental retry-safe push, cursor-based pull and deterministic convergence using the same event IDs, fingerprints, receive cursors and acknowledgement dispositions. Background upload, automatic remote merge, distributed reset, tombstones, deletion, account erasure and continuous sync remain absent in Sprint 14.

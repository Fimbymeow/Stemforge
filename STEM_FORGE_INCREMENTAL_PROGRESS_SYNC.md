# STEM Forge Incremental Cross-Device Evidence Sync

Updated: 17 July 2026
Status: Sprint 17 compatible implementation

## Outcome

Authenticated learners may explicitly associate a browser with their account, then continue learning locally while immutable V4 evidence synchronizes incrementally. Question submission, support actions, completion and mastery never wait for the network. Two associated browsers converge by unioning attempts, support events and structural achievement snapshots; neither side replaces a progress document.

Sprint 14 remains the separate, confirmed `/api/progress/import` recovery boundary. Sprint 15 shares its trusted append service and acknowledgement format but does not change the import user journey.

## Protocol and ownership

- `GET /api/progress/sync/context` reports signed-out state or an opaque account fingerprint, active account data generation and account-data status.
- `POST /api/progress/sync/push` accepts bounded canonical V4 batches and the expected account generation, then uses the same durable classifications as import.
- `GET /api/progress/sync/pull?generation=<generation>&after=<cursor>` returns at most 200 owner-scoped records and 512,000 encoded bytes in trusted receive order.

Every route resolves the owner from the verified server session. No browser owner ID, provider subject, email, database hash or credential is accepted or returned. Authenticated responses are private and non-cacheable; cross-site browser requests are refused. Pull cursors are exclusive `v2.<account-fingerprint>.<generation>.<receive-order>` tokens and cannot be reused for another account or an erased account generation.

PostgreSQL remains append-only for normal application traffic. A transaction-scoped, per-owner advisory lock makes receive-cursor allocation reflect commit order for concurrent appends. Pull reads accepted evidence and retained incoming conflicts in one deterministic owner-filtered order. Sprint 17 adds account generations; confirmed remote learning-data erasure is the only request-scoped delete exception and advances the generation afterward.

## Browser metadata and atomic merge

`stemforge.progressSync.v1` stores only per-fingerprint acknowledgements, pull cursor, successful timestamps, permanent rejection fingerprints, retry state and explicit association state. Sprint 14 acknowledgements in `stemforge.progressImport.v1` are continuously unioned without silently enabling sync.

A pull transaction takes `navigator.locks` when available or an IndexedDB lease, reloads the latest canonical payload, merges deterministically, saves and reload-verifies the union, and only then saves the cursor. If either persistence step fails, the cursor does not advance. Local evidence created during a pull is preserved.

## Scheduling and failure behaviour

Synchronization runs only after explicit account association: after local evidence settles for two seconds, on authenticated navigation/load, when connectivity returns, after a tab has been hidden for at least five minutes, every ten visible minutes, or through **Sync now**. One browser cycle and one cross-tab network leader run at a time.

Requests time out after 15 seconds. Temporary failure uses persisted jittered backoff around 5 seconds, 15 seconds, 1 minute, 5 minutes and a 15-minute cap. Permanently rejected immutable records are identified by evidence reference plus deterministic record digest and are not retried forever. Session expiry pauses transport without deleting local progress.

## Product boundary

Sign-out pauses and de-associates synchronization but leaves browser evidence intact. A different account must be explicitly associated before any browser evidence uploads. Reset remains browser-local: already synchronized evidence is not remotely deleted and may return on a later pull. Distributed reset, deletion tombstones, account erasure, device revocation, WebSockets and shared-device isolation are not implemented in Sprint 15.

Sprint 16 superseded the shared-device UX limitation. Sprint 17 adds account-generation fencing for remote erasure. Same-account consent may be remembered only for the same generation; a changed generation marks the browser for cleanup before sync can resume. See `STEM_FORGE_ACCOUNT_DATA_AND_SHARED_DEVICE_SAFETY.md`.

## Verification

Focused unit/service tests cover metadata migration, pending calculation, account binding, cursors, pull bounds, conflicts, retry bounds, private headers and trusted ownership. PostgreSQL tests cover owner isolation, exclusive pagination, retained conflicts and concurrent cursor ordering. The real-auth browser path uses a real Supabase test session with disposable PostgreSQL and proves two-device convergence, replay safety, concurrent local preservation, cursor failure safety, offline retention, account-change pause, mobile status, reset wording and a clean console.

```powershell
pnpm run test:sync
pnpm run test:database
pnpm run test:e2e:sync:real
pnpm run test:all
```

The real synchronization command requires the permitted test-user variables already documented for Sprint 14. It never prints them and never targets the configured development evidence database.

# STEM Forge Account Data and Shared-Device Safety

Updated: 17 July 2026
Status: Sprint 17 first-stage implementation

## Outcome

The account page is the control centre for synchronization, browser-resident learning data, remote learning-data export and confirmed remote learning-data deletion. Synchronization remains an explicit choice for each browser/account pairing. A remembered choice may resume when the same account returns to the same browser; a different account must confirm before either push or pull. Confirmed Sprint 14 import does not enable continuous synchronization.

Learning remains local-first and guest learning is unchanged. Network work never blocks recording an attempt or support event.

## Browser evidence provenance

Canonical V4 evidence remains immutable under `stemforge.localProgress.v1`. The separate `stemforge.evidenceProvenance.v1` record maps an evidence reference to one of:

- `local_anonymous`: created in this browser without a confirmed sync association;
- `local_associated`: created locally while this browser was associated with an opaque account fingerprint;
- `remote_pull`: first entered this browser through that account's pull;
- `legacy_unknown`: evidence that predates provenance or cannot be attributed safely.

Provenance stores no email, provider subject, owner ID, answer or credential. Existing evidence is migrated deterministically to `legacy_unknown`; it is never guessed to belong to the current account. Confirmed import acknowledges remote durability but does not relabel the local origin. Pull provenance is saved and verified before its cursor advances.

## Consent and account switching

`stemforge.progressSync.v1` continues to keep acknowledgements, pull cursors, retry state and consent per opaque account fingerprint. Sign-in alone never uploads or pulls evidence. When the fingerprint changes, scheduled and in-flight work is stopped, volatile state is cleared, and the account page warns that another account was associated. The new account cannot reuse the previous account's cursor or acknowledgements.

Signing back into the same account can resume a remembered enabled association. Removing association metadata removes that remembered consent, so the next sign-in requires confirmation.

## Sign out safely

The learner chooses between:

1. **Sign out and keep progress on this browser.** Synchronization is suspended before server sign-out. Canonical evidence, provenance and per-account metadata remain, so another person using the browser may see the learning history.
2. **Remove this account's data from this browser, then sign out.** Synchronization is cancelled and awaited, then the local transaction removes evidence safely attributable to the current account plus its sync/import association metadata. Anonymous, legacy-unknown and other-account evidence remains. Cleanup is re-read and verified before sign-out; a failure keeps the learner signed in and offers retry or the explicit keep-data path.

Neither choice deletes remote evidence or data on another device.

## Browser data controls

All destructive actions suspend transport, acquire the existing Web Locks/IndexedDB transaction boundary, reload the latest state, save and verify the requested scope, and broadcast the change.

- **Remove this account's sync information from this browser** removes the current fingerprint's sync/import metadata and remembered association. Evidence and provenance remain.
- **Remove this account's progress from this browser** removes only `local_associated` and `remote_pull` evidence attributed to the current fingerprint, their provenance, and the current fingerprint's sync/import metadata. Anonymous, unknown and other-account evidence remains.
- **Clear all STEM Forge progress from this browser** removes canonical progress, provenance, sync metadata, import metadata and path-celebration acknowledgement. Unrelated preferences are not included.

Each destructive evidence action has an explicit accessible confirmation. Browser removal never rewinds a cursor to simulate remote deletion.

## Remote learning-data export

Signed-in learners can export the learning evidence stored in their STEM Forge account after password reauthentication. The export is private, non-cacheable JSON with a stable schema version, category counts, trusted receive metadata and a SHA-256 digest over the canonical export body. It includes accepted remote attempts, support events, achievement snapshots and retained conflict evidence for that account. It does not expose owner IDs, provider subjects, payload hashes, credentials or `.env` values.

The current-browser export remains separate and also works when accounts are disabled. It contains only data stored in that browser, including local progress, provenance, import/sync metadata and completion acknowledgements.

## Remote learning-data erasure

Sprint 17 first stage implements deletion of account learning evidence only. It does not delete the Supabase identity, close the login account, delete support/admin/audit data outside the learning evidence tables, or claim backup expiry completion.

The erasure flow is:

1. Start a learning-data deletion request.
2. Reauthenticate with the current password.
3. Type the exact confirmation phrase.
4. Wait through a 10-minute cancellation window.
5. Once processing starts, deletion is irreversible.

While a request is scheduled or processing, the account state is not `active`, sync and import writes are rejected, and clients pause transport. Processing deletes accepted attempts, support events, achievement snapshots and retained conflicts for the request owner inside a request-scoped database function, then advances the account data generation. Old browser generations cannot push or pull until reviewed.

After completion, each browser can reconcile local data. Reconciliation removes locally stored evidence attributable to the erased account generation, records a local receipt and preserves anonymous, unknown-origin and other-account evidence unless it was acknowledged as remote account evidence for the erased generation.

## Reset and remote retention

A path reset removes current attempts and support events for that path from this browser while structural historical snapshots may remain. It does not delete already synchronized account evidence and does not affect another device. Remote evidence may therefore return through a later recovery or pull.

PostgreSQL evidence remains append-only for normal application traffic. Sprint 17 adds a narrow, request-scoped exception for confirmed learning-data erasure. Distributed path reset, selective device revocation, Supabase identity deletion, full account closure, audit-log deletion and legally reviewed backup expiry remain separately deferred.

The UI states that deleted learning data may remain in restricted backups until backups expire. The provisional operational target documented in-product is a 30-day rolling retention window, subject to deployment and legal confirmation.

## Session expiry and recovery

A 401 enters an explicit authentication-required state, aborts scheduling and prevents retry storms. Local evidence, pending acknowledgements, cursor and association remain. The UI says, “Sign in again to continue syncing. Your browser progress is safe.” Reauthentication to the same account can resume; a different account still requires confirmation.

## Diagnostics

The account panel shows enabled, paused, offline, syncing, attention and authentication-required states; pending upload and permanent-rejection counts; last successful push and pull; last fully caught-up time; retry time; local payload/provenance health; and coordination availability. It exposes manual sync and pause/resume controls without displaying fingerprints, identities, answers or payloads.

Permanent rejection is digest-bound: an unchanged invalid record is not retried forever, but a changed record digest becomes retryable. Evidence is never silently deleted.

## Verification paths

Credential-free unit and ordinary browser tests cover provenance, removal scopes, browser export, guest behavior, reset copy and confirmations. Embedded PostgreSQL tests cover account generations, scheduled write blocking, cancellation and request-scoped hard delete. `pnpm run test:e2e:account-safety:real` is the isolated real-Supabase/disposable-PostgreSQL path for shared-device, two-context, session-expiry, account-switching, remote export, confirmed erasure and stale-device reconciliation. It does not print configured values or target the configured development evidence database.

## Sprint 17 boundary

Implemented in this first stage: remote learning-data export, confirmed learning-evidence erasure, account generation fencing, stale-device cleanup and verification. Still deferred: Supabase identity deletion, full account closure, selective device revocation, distributed reset tombstones, legal retention automation and admin/support workflows.

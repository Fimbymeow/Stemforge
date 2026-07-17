# STEM Forge Account Data and Shared-Device Safety

Updated: 17 July 2026
Status: Sprint 16 implementation

## Outcome

The account page is the control centre for synchronization and browser-resident learning data. Synchronization remains an explicit choice for each browser/account pairing. A remembered choice may resume when the same account returns to the same browser; a different account must confirm before either push or pull. Confirmed Sprint 14 import does not enable continuous synchronization.

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

## Reset and remote retention

A path reset removes current attempts and support events for that path from this browser while structural historical snapshots may remain. It does not delete already synchronized account evidence and does not affect another device. Remote evidence may therefore return through a later recovery or pull.

PostgreSQL evidence remains append-only. Sprint 16 adds no migration and no delete endpoint. Account erasure, legal retention, tombstones, distributed reset, selective device revocation and remote evidence deletion require a separately designed and authorized workflow.

## Session expiry and recovery

A 401 enters an explicit authentication-required state, aborts scheduling and prevents retry storms. Local evidence, pending acknowledgements, cursor and association remain. The UI says, “Sign in again to continue syncing. Your browser progress is safe.” Reauthentication to the same account can resume; a different account still requires confirmation.

## Diagnostics

The account panel shows enabled, paused, offline, syncing, attention and authentication-required states; pending upload and permanent-rejection counts; last successful push and pull; last fully caught-up time; retry time; local payload/provenance health; and coordination availability. It exposes manual sync and pause/resume controls without displaying fingerprints, identities, answers or payloads.

Permanent rejection is digest-bound: an unchanged invalid record is not retried forever, but a changed record digest becomes retryable. Evidence is never silently deleted.

## Verification paths

Credential-free unit and ordinary browser tests cover provenance, removal scopes, guest behavior, reset copy and confirmations. `pnpm run test:e2e:account-safety:real` is the isolated real-Supabase/disposable-PostgreSQL path for shared-device, two-context, session-expiry, account-switching, mobile, focus and remote-retention behavior. It does not print configured values or target the configured development evidence database.

## Sprint 17 boundary

The next sprint should begin with a separately approved design for remote account-data export/erasure and retention policy only if product and legal requirements are ready. Sprint 16 does not provide or imply distributed deletion.

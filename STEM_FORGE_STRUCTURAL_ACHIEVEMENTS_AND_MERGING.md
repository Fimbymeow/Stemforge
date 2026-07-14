# STEM Forge Structural Achievements and Merging

## 1. Purpose

Progress payload V4 preserves exact stage/path achievements and defines deterministic, database-ready evidence merging without adding a database, accounts, or sync.

## 2. Current readiness versus historical achievement

Current completion and mastery are recalculated from active content, active question versions, and matching evidence. Immutable snapshots only prove that a structural achievement happened previously; they never make current content ready.

## 3. Progress payload V4

`{ version: 4, data: { attempts, supportEvents, achievementSnapshots } }` uses the unchanged `stemforge.localProgress.v1` key. Every array contains append-oriented evidence with an explicit ID.

## 4. Event identity strategy

New records use the platform `crypto.randomUUID()` through an injectable factory. A dependency-free fallback exists for platforms without it. Tests inject predictable IDs. IDs are serializable strings and timestamps are not identity.

## 5. Attempt IDs

New attempts use `attempt_<uuid>`. Migrated records use `migrated_attempt_<original-index>_<stable-content-hash>`; index distinguishes repeated identical submissions and the stable hash detects repeat migration.

## 6. Support-event IDs

New events use `support_<uuid>`. Migration uses the same index-and-content fingerprint policy with a `migrated_support_` prefix.

## 7. Achievement snapshot IDs

New snapshots use `snapshot_<uuid>`. Snapshot creation and learner evidence are written in one repository save.

## 8. Snapshot kinds

The six kinds are `stage_completed`, `stage_secure`, `stage_mastered`, `path_completed`, `path_secure`, and `path_mastered`.

## 9. Snapshot field model

Snapshots store `snapshotId`, kind, subject/course/path IDs, positive path version, optional stage ID and positive stage version for stage kinds, ISO achievement time, mastery score, independent-performance percentage, completion/required counts, and source. They contain no wording or personal data.

## 10. Snapshot emission rules

Repository recording compares pure before/after calculations. Each newly crossed tier is appended. A direct jump to Mastered records Completed, Secure, and Mastered. Passive load, migration, refresh, weaker later work, and content revision alone emit nothing.

## 11. Stage snapshots

Stage snapshots require the canonical stage ID/version and capture the stage metrics at transition time.

## 12. Path snapshots

Path snapshots omit stage fields and capture the canonical path version and path metrics.

## 13. Structural versions

Duplicate suppression is scoped by kind, logical structure, and structural version. Re-earning the same tier after a local reset does not duplicate it for that version. A later path/stage version may earn a distinct snapshot.

## 14. Reset behaviour

Path reset removes that path's visible attempts and support events but preserves every achievement snapshot. It resets current readiness, not historical achievement.

## 15. Snapshot validation

Validation enforces IDs, kinds, identifiers, positive versions, exact stage/path field consistency, ISO time, 0–100 metric ranges, non-negative counts, completion not exceeding total, and source. Structurally valid archived or missing references survive; lookup can classify unknown paths as orphaned.

## 16. Strongest historical achievement

Pure queries expose latest and strongest stage/path events, events by structural version, tier predicates, and known completion time. Strength is `mastered > secure > completed`; a later weaker event never erases a stronger one. Derived stage/path structural models expose current status/version separately from strongest historical status/version/date and reassessment state.

## 17. Merge inputs and outputs

`mergeProgressEvidence(leftV4, rightV4)` returns `{ payload, conflicts }`. `mergeSupportedProgressPayloads(left, right)` first migrates supported older shapes and refuses an unsupported future version by returning a null payload and a conflict.

## 18. Duplicate rules

Only equal explicit IDs identify duplicates. Identical records with the same ID keep one. Different IDs retain both even when other fields match. Repeated legitimate activity is never collapsed by timestamp or value.

## 19. Conflict rules

Different payloads sharing an ID produce `same_id_conflict`. A stable lexical representation selects the same canonical record independent of input order. Malformed migrated records and unsupported versions also produce structured conflicts at the supported-input boundary.

## 20. Canonical ordering

Each record type is ordered by its client timestamp and then event ID. Valid times are normalized only for comparison; stored timestamps are not rewritten. Invalid time strings sort deterministically after valid times.

## 21. Clock ambiguity

Clock skew, ties, and future client times never delete evidence or establish truth. IDs break ties. A future server may add trusted receive time separately.

## 22. Idempotency

`merge(A, A) = A` after canonical ordering; focused tests pass.

## 23. Commutativity

`merge(A, B) = merge(B, A)` after canonical ordering; focused tests pass, including same-ID conflicts.

## 24. Associativity

Canonical minimum selection for an ID conflict and stable sorting make payload merge associative; focused three-way tests pass.

## 25. Guest-to-account merge policy

Future account adoption must union guest and server evidence, recalculate live state, and preserve snapshots and uncertainty. Neither side wins wholesale. A local backup must be cleared only after confirmed future persistence.

## 26. Multi-device merge policy

Distinct correct, incorrect, hint, solution, versioned, legacy, and snapshot records all survive. Stronger derived evidence therefore survives naturally. Equal device timestamps use IDs for deterministic chronology.

## 27. Reset limitations across devices

Today reset is a local-view reset. A later merge can reintroduce evidence held elsewhere. Cross-device deletion needs an explicit reset/deletion event model; V4 intentionally adds no tombstones.

## 28. Historical legacy handling

V3 preserves version evidence and gains deterministic IDs. V2, V1, and unversioned data retain unknown legacy evidence. Migration never invents snapshot time or structural version, so `achievementSnapshots` starts empty.

## 29. Completion-acknowledgement boundary

`stemforge.pathCelebration.v1` remains independent UI acknowledgement state. It neither stores snapshots nor calculates readiness, and snapshot creation does not replay a celebration.

## 30. Remote database foundation

Sprint 12 implements the server-only PostgreSQL boundary described in `STEM_FORGE_REMOTE_EVIDENCE_FOUNDATION.md`. Attempts, support events and snapshots are immutable owner-scoped rows with trusted receive metadata. Identical IDs and payloads are idempotent; same-ID/different-payload arrivals preserve accepted evidence and append a deduplicated conflict record. The learner application is not connected to this repository.

## 31. Future sync implications

Sync should exchange evidence sets, surface integrity conflicts, record trusted receive metadata separately, and acknowledge persistence before removing any local backup.

## 32. Deferred deletion/tombstone model

Global erase, reset propagation, retention, consent, and tombstone compaction are deferred until identity and account requirements exist.

## 33. Commands

Use `pnpm run test:achievements`, `pnpm run test:merge`, `pnpm test`, `pnpm run test:e2e`, and `pnpm run test:all`.

## 34. Testing strategy

Pure tests cover migration identities, validation, transitions, reset, history, duplicate/conflict behavior, algebra, ordering, and immutability. Browser tests inspect V4 persistence, event IDs, completion snapshots, refresh, reset, corruption, future protection, and unchanged celebration behavior.

## 35. Known limitations

Client timestamps remain untrusted event chronology, the fallback runtime ID generator is weaker than UUID, there is no authenticated remote transport or conflict telemetry, local reset cannot propagate, migration cannot reconstruct old structural achievements, and no historical-achievement UI is exposed.

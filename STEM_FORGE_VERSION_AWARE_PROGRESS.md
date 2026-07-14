# STEM Forge Version-Aware Progress

Updated: 13 July 2026  
Status: Sprint 8 version-evidence rules, retained inside the Sprint 9 V4 payload

## 1. Purpose

Progress evidence now records which assessment version a learner actually used. The model preserves earlier achievement while preventing older or unknown attempts from silently proving readiness for materially changed questions.

## 2. Historical achievement versus current readiness

Historical achievement asks whether the logical question was ever attempted, completed, or mastered. Current readiness asks whether evidence is known to match the active assessment version. These are separate derived states.

## 3. Progress payload V3

The LocalStorage key remains `stemforge.localProgress.v1`; only the payload schema changes:

```ts
{ version: 3, data: { attempts: QuestionAttempt[], supportEvents: QuestionSupportEvent[] } }
```

## 4. Attempt version evidence

Every V3 attempt retains the V2 fields and adds required `versionEvidence`. New canonical Higher Maths submissions resolve the active question from the registry and store its exact positive `questionVersion`.

## 5. Support-event version evidence

Hint and worked-solution events carry their own required evidence. Support for one assessment version cannot satisfy or suppress a later version’s support event. Worked-solution eligibility requires a genuine attempt with matching version evidence.

## 6. Known versus unknown evidence

```ts
type VersionEvidence =
  | { kind: "known"; questionVersion: number }
  | { kind: "unknown_legacy"; questionVersion: null };
```

Known versions must be positive integers. Unknown history is explicit; missing fields and magic sentinel numbers are invalid.

## 7. V2-to-V3 migration

Every structurally valid V2 attempt and support event is retained in order and receives `{ kind: "unknown_legacy", questionVersion: null }`. Repeated attempts are not deduplicated. Malformed individual records follow the existing repair policy.

## 8. V1 and unversioned migration

V1 wrappers and unversioned arrays retain their established conservative completion marker and support ambiguity, then receive explicit unknown version evidence. They are written as V3 on the next valid mutation.

## 9. No-invented-evidence rule

Migration never assigns question version 1 merely because production content currently uses version 1. Historical records cannot prove what was rendered when created.

## 10. Current-version completion

Strict current completion requires a matching known-version correct attempt or matching known-version worked-solution event after a genuine attempt. Incorrect-only work remains unresolved.

## 11. Historical completion

Historical completion derives across every valid version for the stable question ID, including older known versions and unknown legacy evidence. History remains when a question leaves active stage membership.

## 12. Current-version mastery

Current mastery uses only matching known-version attempts/events. Existing contributions, stage weights, thresholds, independence rules, and Past Paper-style requirements are unchanged.

## 13. Historical mastery

Historical best outcome and contribution derive independently across all retained evidence. Stage/path historical mastery is separate and never proves current readiness.

## 14. First-attempt accuracy by version

Current first-attempt accuracy uses the first genuine matching-known-version attempt for each active question. A major version creates a new first-attempt opportunity. Unknown or older attempts do not enter the current denominator.

## 15. Minor revisions

`contentRevision` is not learner evidence. If `questionVersion` is unchanged, known evidence remains current; completion, mastery, accuracy, and celebration acknowledgement do not reset.

## 16. Major versions

When the active assessment version increases, older known completion/mastery remains historical. Current readiness becomes incomplete and reassessment is required until current-version evidence is earned.

## 17. Archived questions

Archived questions are excluded by active selectors and leave current totals. Stored attempts and events remain queryable by stable logical ID.

## 18. Added questions

New active questions enter current denominators with no evidence. Prior records are preserved and `newPracticeAvailable` can be derived. V4 captures future genuine structural transitions but does not invent prior snapshots.

## 19. Removed questions

Removal from active membership does not delete progress. The remaining active set is recalculated without the removed question.

## 20. Stage and path implications

Stage/path output exposes current-version and historical completed IDs, percentages, mastery scores, and statuses. Attempts do not store invented historical stage/path versions.

## 21. Review versus reassessment

Review remains the signal for weak or supported current evidence. Unknown legacy evidence against unchanged version-1 content produces `recommended`; older known evidence, or unknown evidence against version 2+, produces `required`. Matching current completion clears reassessment.

## 22. UI mapping

Ordinary V4 evidence carrying current-version records renders as before. The path page adds one calm notice only for unknown evidence, required reassessment, or new practice. Raw version numbers are not shown.

## 23. Completion acknowledgement boundary

`stemforge.pathCelebration.v1` and its payload are unchanged. Migration does not replay completion. The acknowledgement store never calculates completion or mastery; version-aware celebration replay remains deferred.

## 24. Future database implications

An append-oriented database can represent the union with an evidence kind and nullable positive question version. Server validation must preserve orphaned historical logical IDs and immutable history.

## 25. Future account merging

Merging must retain valid attempts/events, preserve evidence kinds, avoid converting unknown records, establish deterministic ordering, and recompute derived state instead of overwriting whole histories.

## 26. Structural snapshots delivered in V4

Sprint 9 replaces the earlier deferral: genuine before/after transitions now append immutable stage/path structural snapshots with canonical versions. Migration still invents none. These snapshots preserve exact historical achievement while all current readiness remains derived from active question versions.

Attempts and support events now carry stable IDs; older records receive deterministic migration IDs. Pure union merge rules are documented in `STEM_FORGE_STRUCTURAL_ACHIEVEMENTS_AND_MERGING.md`.

## Historical Sprint 8 deferral

Claims such as “stage complete under structural version 1” require explicit completion events carrying stage/path versions. Sprint 8 does not invent these from attempts.

## 27. Commands

Use `pnpm run test:version-progress`, `pnpm run test:progress`, `pnpm test`, `pnpm run test:e2e`, `pnpm run test:all`, and `pnpm build`.

## 28. Testing strategy

Pure tests cover validation, migrations, current/historical completion and mastery, first attempts, minor/major changes, added/removed content, reassessment, and canonical version resolution. Browser tests cover real capture, V2 migration, refresh, support events, corruption, future protection, and celebration non-replay.

## 29. Known limitations

Unknown history cannot prove current mastery. V4 persists newly observed structural achievements and provides a pure local merge engine, but there is still no database, account workflow, remote sync, publishing workflow, history UI, distributed reset, or version-aware celebration replay. Legacy Physics remains separate.

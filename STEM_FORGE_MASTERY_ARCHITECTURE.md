# STEM Forge Mastery Architecture

Updated: 13 July 2026  
Scope: V4 version-aware browser-local evidence and the approved MVP mastery model

## Sprint 8 evidence scopes

Current mastery now uses only evidence whose known question version matches the active assessment version. Historical mastery is derived separately across older known and unknown legacy evidence. No mastery contribution, stage weight, threshold, independence rule, or Past Paper-style requirement changed. Unknown evidence may preserve historical achievement but cannot prove current mastery.

## 1. Product philosophy

Completion answers “Has the student worked through this?” Mastery answers “Can the student do this independently and reliably?” Support is useful, but supported completion must not be presented as independent mastery.

## 2. Rule implementation matrix

| Rule | Previous | V2 implementation | UI | Migration | Tests/module |
|---|---|---|---|---|---|
| Genuine attempt | UI blocked blank | trimmed non-empty submission | submit remains disabled | old non-empty records genuine | `isGenuineAnswer`; progress tests |
| Incorrect submission | completed | attempted, unresolved | stays on current question | legacy completion preserved | calculations/boundary tests |
| Correct submission | completed | completed with classified outcome | positive feedback | correctness retained, support unknown | calculations |
| Hint use | not stored | event + attempt snapshot | explicit Show hint | cannot be inferred | workspace/transitions |
| Solution use | automatically shown | explicit gated event after attempt | View worked solution | cannot be inferred | repository/transitions |
| Best outcome | latest only | strongest deterministic evidence | compact status only | conservative legacy outcomes | calculations/mastery tests |
| Completion | any attempt | correct or valid solution event | progress bars | `legacyCompleted` protects V1 | stage/path tests |
| Mastery | absent | weighted outcome evidence | status label | no false independence | mastery tests |
| Accuracy | latest | first and latest are distinct | first-attempt shown | sequence retained | calculation tests |

## 3. Question-state model

`QuestionProgressState` derives attempted, completed, latest result, best outcome, mastery contribution, support use, review need, and navigation eligibility. It is never persisted because it can be reproduced from evidence.

## 4. Attempt model

V4 attempts retain the version-aware fields, require explicit known or unknown-legacy evidence, and add stable event identity. History remains append-oriented.

## 5. Hint and solution events

`QuestionSupportEvent` stores `hint_viewed` or `solution_viewed`, IDs, timestamp, sequence, whether a genuine matching-version attempt existed, and its own version evidence. No analytics identity or session identifier is collected.

## 6. Genuine-attempt rule

A trimmed non-empty submitted answer is genuine. Invalid but non-empty answers count. Blank/whitespace input, typing, navigation, hints, and solution requests alone do not.

## 7. Completion rule

A current V2 question completes after a correct genuine attempt or a `solution_viewed` event recorded after a genuine attempt. A V1 migrated record may remain complete through its explicit compatibility marker.

## 8. Best-outcome calculation

Outcomes are derived across all attempts/events. The highest mastery contribution wins. A later incorrect answer changes latest accuracy and can recommend review, but cannot erase stronger historical evidence.

## 9. Mastery weights

Constants live once in `lib/progress/calculations.ts`: 1.00, 0.85, 0.70, 0.35, 0.10, 0.00. Legacy correct with unknown support is conservatively 0.70; legacy incorrect completion is 0.10.

## 10. Accuracy metrics

First-attempt accuracy uses one first genuine attempt per active attempted question. Latest accuracy uses one latest genuine attempt per active attempted question. Empty denominators return `null`. Student percentages and mastery are rounded with `Math.round`.

## 11. Stage status rules

Not started, In progress, Completed, Secure (complete + 75%), and Mastered (complete + 90% + 70% correct without solutions). Correct-with-hint satisfies “without solution” but carries only 0.70 evidence.

## 12. Path status rules

The same base statuses apply. Mastered additionally requires Past Paper-style mastery of 80% where present. All required stages must be complete for Completed, Secure, or Mastered.

## 13. Stage weighting

Foundations 25%, Applications 35%, Past Paper-style Questions 40%. Only present, non-empty stages participate; weights are divided by the included weight total.

## 14. Review recommendation

Deterministic triggers are solution use, at least two incorrect attempts, hint-assisted correctness, stronger historical correctness followed by latest incorrect, or uncertain legacy completion. Time-based review is deferred.

## 15. V1/V2-to-V3 migration

Every valid V1 attempt is retained in order, assigned a sequence, and marked support/version unknown. V2 attempts and support events retain their fields and receive explicit unknown version evidence. `legacyCompleted` preserves V1 visible completion. Invalid records are dropped individually; no valid record is deduplicated.

## 16. Legacy ambiguity handling

V1 cannot prove hint or solution independence. Historical correct records are correct but do not satisfy independent-performance thresholds. Historical incorrect-only records stay complete for compatibility, contribute 0.10, and recommend review.

## Structural achievement boundary (V4)

Mastery weights and thresholds are unchanged. Crossing a live current-version stage/path threshold emits an immutable versioned snapshot at the repository boundary. Snapshots expose strongest historical status but never feed current mastery. A weaker result, reset, archive, or content revision cannot delete them; a new structural version can earn a distinct event.

## 17. Added/removed/versioned content

Derivation uses current stage question IDs. Removed records remain stored but stop contributing. New active questions increase totals. V4 snapshots preserve known structural achievement moments separately.

Sprint 8 scoped derivation to current active assessment versions. Sprint 9 adds exact snapshots only for newly observed genuine transitions; migration remains conservative.

## 18. Reset behaviour

The existing confirmed path reset removes attempts and support events for that path only. Browser-local deletion is real deletion; the app does not claim server-side history exists.

## 19. UI mapping

Progress bars show completion. Path/stage labels show the derived status. The compact visible performance metric is first-attempt accuracy. Incorrect feedback offers retry, hint, or an explicitly gated worked solution. Viewing the solution changes feedback to a calm completed-with-solution state and unlocks progression.

## 20. Pure-function boundaries

Payload migration, genuine-attempt checks, outcomes, question state, review, mastery, accuracy, stage/path status, weighting, next-question selection, recording, and reset are pure. React and LocalStorage remain outside them.

## 21. Storage implications

The storage key remains `stemforge.localProgress.v1`; key names do not define payload schema. Newly saved data is V4. Unsupported future versions are not overwritten. Malformed JSON and unavailable storage fail safely.

## 22. Database readiness

The repository/storage boundary remains synchronous for current LocalStorage. A later remote repository should be append-oriented and server-validated, combine attempts/events rather than overwrite whole payloads, and recalculate outcomes.

## 23. Deferred features

Sessions, time decay, spaced scheduling, content versions, historical completion snapshots, per-question/stage reset UI, guest/account merge, multi-device conflict resolution, analytics, auth, database, and Physics marking.

## 24. Commands

`pnpm run test:progress`, `pnpm run test:mastery`, `pnpm test`, `pnpm run validate-content`, `pnpm run typecheck`, `pnpm run lint`, and `pnpm build`.

## 25. Testing strategy

Pure tests cover state transitions, outcomes, weights, thresholds, active-content recalculation, V1/unversioned migration, corruption, storage failures, and reset. Submission-boundary tests keep the answer engine connected without changing accepted/rejected forms. Browser checks cover gating, feedback, persistence, navigation, dashboard totals, migration, and reset.

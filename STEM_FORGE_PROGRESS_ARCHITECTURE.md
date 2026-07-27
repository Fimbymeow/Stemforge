# STEM Forge Progress Architecture

Updated: 27 July 2026
Scope: browser-local V5 evidence persistence, structural achievements, practice attribution, and migration

## Current architecture

```text
Question submission/support action
-> pure progress mutation
-> ProgressRepository
-> ProgressStorage
-> LocalStorage adapter
-> UI update event
```

Sprint 19 graph and nature-table interactions use this same path. Structured mathematical answers are serialized into the existing attempt `answer` field only at submission time. Pointer movement, hover state, sampled graph arrays, SVG paths and screenshots are not progress evidence.

The current payload is:

```ts
{
  version: 5,
  data: {
    attempts: QuestionAttempt[], // stable ID + required version evidence
    supportEvents: QuestionSupportEvent[], // stable ID + required version evidence
    guidedSelfAssessments: GuidedSelfAssessmentEvent[], // append-only session self-checks
    achievementSnapshots: AchievementSnapshot[] // immutable structural history
  }
}
```

Derived completion, mastery, status, accuracy, and review values are not stored. See `STEM_FORGE_MASTERY_ARCHITECTURE.md` for their rules.

## Persistence

- Storage key remains `stemforge.localProgress.v1` for backwards compatibility.
- `ProgressStorage` exposes synchronous `load`, `save`, and `clear` for browser storage.
- `ProgressRepository` records attempts/events and performs path reset.
- `lib/local-progress.ts` is the compatibility boundary used by React components.
- The existing `stemforge:local-progress-updated` event and native `storage` listener behavior remain.

## Version evidence and migration

- New canonical evidence stores `{ kind: "known", questionVersion }` from the active question registry.
- Unversioned arrays and V1 wrappers -> V5 through conservative legacy migration.
- V2 attempts/events -> V5 with `{ kind: "unknown_legacy", questionVersion: null }`.
- V3 -> V5 with preserved version evidence and deterministic migration IDs.
- V4 -> V5 with prior evidence preserved and an empty guided self-assessment stream.
- V5 -> V5 idempotently, repairing malformed records within each array individually.
- Future versions -> safe default in memory with writes blocked.
- Valid historical records are preserved in sequence.
- Malformed subrecords are dropped individually.
- Unsupported and malformed stored data is not overwritten merely by reading.

V1 previously counted every attempt as completion. Migration preserves that visible completion with `legacyCompleted`, while support and version ambiguity prevent false claims of independent or current-version mastery. See `STEM_FORGE_VERSION_AWARE_PROGRESS.md`.

## Browser safety

Missing `window`, blocked LocalStorage, read/write failures, malformed JSON, and invalid payloads do not crash rendering. Mounted-state empty evidence prevents SSR hydration disagreement.

## Reset and content

Path reset removes that path's attempts, support events and guided self-assessments after confirmation and preserves immutable achievement snapshots. Other paths remain. Removed questions remain historical but do not affect current totals; newly added active questions enter current denominators.

## Commands

```text
pnpm run test:progress
pnpm run test:mastery
pnpm test
pnpm run validate-content
pnpm run typecheck
pnpm run lint
pnpm build
```

## Current and historical derivation

Question, stage, and path derivation exposes strict current-version completion/mastery separately from historical achievement. Unknown evidence against unchanged version-1 content can remain compatibility-visible with reassessment recommended, but cannot prove current-version mastery. Older known evidence against a newer version requires reassessment.

## V5 evidence and merging

V5 retains V4 stable IDs and structural snapshots, adds optional `practiceSessionId` attribution to attempts/support events, and adds append-only guided self-assessments. Standalone records omit session identity. A self-assessment requires a real session ID, question/version identity, timestamp, sequence and one of Confident, Unsure or Needs review.

Pure merging unions all four evidence types by ID, reports conflicts, and applies canonical timestamp/ID ordering. Import batching, sync acknowledgement, provenance, remote storage, account export and erasure use the same fourth kind. Guided outcomes are excluded from mastery and correctness derivation. Structural snapshots remain historical only.

## Historical note

V1 treated any submitted answer as completion and used the latest result as its single accuracy measure. That behavior is retained only when interpreting migrated historical completion. New V5 activity follows the approved mastery model, records exact canonical question-version evidence, and assigns stable event identity.
## Practice-session boundary

Practice session records are not progress evidence. `stemforge.practiceSessions.v1` stores local session references, origin, subject, current index, timing, Skip and summary context only. Session-originated attempts, hints and worked-solution events are canonical V5 evidence tagged with that session ID. Guided self-assessments are a separate append-only V5 stream. Legacy session attribution uses timestamps only when an evidence record has no session ID; an explicit different ID always prevents fallback double counting.

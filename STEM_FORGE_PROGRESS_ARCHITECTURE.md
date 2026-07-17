# STEM Forge Progress Architecture

Updated: 13 July 2026  
Scope: browser-local V4 evidence persistence, structural achievements, and migration

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
  version: 4,
  data: {
    attempts: QuestionAttempt[], // stable ID + required version evidence
    supportEvents: QuestionSupportEvent[], // stable ID + required version evidence
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
- Unversioned arrays and V1 wrappers -> V4 through conservative legacy migration.
- V2 attempts/events -> V4 with `{ kind: "unknown_legacy", questionVersion: null }`.
- V3 -> V4 with preserved version evidence and deterministic migration IDs.
- V4 -> V4 idempotently.
- Future versions -> safe default in memory with writes blocked.
- Valid historical records are preserved in sequence.
- Malformed subrecords are dropped individually.
- Unsupported and malformed stored data is not overwritten merely by reading.

V1 previously counted every attempt as completion. Migration preserves that visible completion with `legacyCompleted`, while support and version ambiguity prevent false claims of independent or current-version mastery. See `STEM_FORGE_VERSION_AWARE_PROGRESS.md`.

## Browser safety

Missing `window`, blocked LocalStorage, read/write failures, malformed JSON, and invalid payloads do not crash rendering. Mounted-state empty evidence prevents SSR hydration disagreement.

## Reset and content

Path reset removes that path's attempts and support events after confirmation and preserves immutable achievement snapshots. Other paths remain. Removed questions remain historical but do not affect current totals; newly added active questions enter current denominators.

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

## V4 structural achievements and merging

Payload V4 adds stable IDs to attempts/support events and an append-oriented `achievementSnapshots` array. Repository writes compare before/after current-version state and atomically append newly crossed stage/path Completed, Secure, and Mastered tiers. Passive migration creates no snapshots. Path reset preserves snapshots while clearing current path evidence.

Pure merging unions all three evidence types by ID, reports conflicts, and applies canonical timestamp/ID ordering. Focused tests establish idempotency, commutativity, and associativity. Live status remains calculated; snapshots are historical only. See `STEM_FORGE_STRUCTURAL_ACHIEVEMENTS_AND_MERGING.md`.

## Historical note

V1 treated any submitted answer as completion and used the latest result as its single accuracy measure. That behavior is retained only when interpreting migrated historical completion. New V4 activity follows the approved mastery model, records exact canonical question-version evidence, and assigns stable event identity.
## Practice-session boundary

Sprint 20 practice sessions are not progress evidence. `stemforge.practiceSessions.v1` stores local session references, current index, timing and summary context only. Submitted answers, hints and worked-solution events remain canonical V4 progress evidence and continue through existing import, sync and erasure rules.

# STEM Forge Content Version Policy

Updated: 13 July 2026  
Status: active policy with Sprint 7 metadata, Sprint 8 question-version evidence, and Sprint 9 V4 structural snapshots implemented.

## Sprint 7 implementation status

Canonical Higher Maths questions now carry `questionVersion`, `contentRevision`, and `contentStatus`; stages carry `stageVersion` and lifecycle; paths carry `pathVersion` and lifecycle; resources carry revision and lifecycle; hierarchy parents carry lifecycle. All existing records conservatively start at version/revision 1 and `active`. Central selectors exclude archives from learner flows, and validation enforces version and lifecycle invariants. See `STEM_FORGE_CONTENT_VERSION_ARCHITECTURE.md`.

Sprint 8 now records exact active assessment versions on new canonical Higher Maths evidence. Existing V2, V1, and unversioned records migrate to explicit unknown legacy evidence; none are assigned an invented version 1. Current readiness and historical achievement are derived separately. Answer evaluation, mastery weights/thresholds, completion acknowledgement, and legacy Physics behaviour remain unchanged.

## Principles

Content identity answers “Which logical learning item is this?” Content version answers “Which assessable form of that item did the student attempt?” IDs must remain stable across non-material edits. Materially different tasks must not silently inherit old mastery evidence.

## Identity and revision fields

- `questionId`: permanent logical identity. Never reused for an unrelated task.
- `questionVersion`: monotonic positive integer for materially assessable versions. Increment only when old evidence is no longer fully comparable.
- `contentRevision`: publish revision for every released edit, suitable for patch/minor bookkeeping without requiring reassessment.
- `stageId` / `pathId`: stable logical identities.
- `stageVersion`: increments when required membership or mastery meaning changes.
- `pathVersion`: increments when required stages, weighting meaning, or completion structure changes.

Display-name edits do not change identity. A replacement task receives a new question ID and archives the old one.

## Minor and patch changes

Spelling, punctuation, formatting, accessibility labels, visual-only changes, and clearer wording that preserves the mathematical task do not increment `questionVersion`. They increment `contentRevision` when published. Existing completion, mastery, and attempt history remain current.

An accepted-answer expansion that only recognises an already-valid equivalent answer is a minor revision. It does not invalidate prior correct or incorrect evidence; future marking simply becomes more complete.

## Major question changes

Increment `questionVersion` when the mathematical task, canonical correctness, materially accepted answer set, required fields, method, meaningful marks, or assessed difficulty changes. Previous attempts remain historical under their recorded version. They do not establish current-version mastery. Reassessment is required when the old evidence could produce a different result under the new version.

Old attempts should remain viewable as “Previously completed” or “Mastered on an earlier version,” not rewritten or deleted.

## Removed and archived questions

Remove a question from active stage membership and archive it rather than deleting it. Historical attempts and their versions remain. Archived questions no longer affect current completion or mastery. Removal must not lower the student's current completion percentage; implementation should retain a historical completion acknowledgement if denominator changes would otherwise present a regression.

## Newly added questions

New active questions enter current totals. A previously completed stage/path remains historically completed, while current coverage may fall below 100%. Existing mastery is acknowledged against the older stage/path version. Show “New practice available”; recommend the new work without claiming the prior achievement vanished.

The future model therefore needs both a completion snapshot/version and current-content derivation.

## Historical completion states

- **Currently complete:** all requirements for the active stage/path version are complete.
- **Historically completed:** a prior version was complete at a recorded time/version.
- **Current mastery:** thresholds are met against active version evidence.
- **Earlier-version mastery:** thresholds were met for an older version and remain an achievement, but not a claim about unattempted new material.

## Legacy V2 compatibility

V2 local attempts have no question content version. Current V4 migration retains them as explicit `unknown_legacy` version evidence rather than inventing a version. Existing completion remains visible under the same conservative principle used for V1 progress migration. A later valid attempt can attach known current-version evidence and improve current readiness.

## Future database implications

Likely persisted evidence will need `questionId`, `questionVersion`, `stageId`, `stageVersion`, `pathId`, `pathVersion`, `contentRevision`, `attemptedAt`, result/outcome evidence, and `legacyVersionUnknown`. Attempts/events remain append-oriented. Current status is derived rather than overwriting history. This is not a database schema commitment.

## Publishing policy

- **No version change:** draft-only edit not yet published.
- **Patch revision:** typography, formatting, spelling, punctuation, accessibility, or visual edits.
- **Minor revision:** clearer equivalent wording or accepted-answer expansion without changing the assessed task.
- **Major revision:** correctness, requirements, mathematical task, method, material marks/difficulty, or answer restrictions change.
- **Archive and replace:** the logical question is replaced rather than corrected.

Every published edit should record author/reviewer, reason, revision class, and effective time in future tooling. Major changes require content review and migration impact review before publication.

## Student-facing language

Prefer calm labels: “New practice available,” “Updated question,” “Reassessment recommended,” “Previously completed,” and “Mastered on an earlier version.” Minor corrections normally need no student notice.

## Historical-completion decision table

| Change | Question version | Stage/path version | Old completion current? | Old mastery current? | Reassessment | Student message |
|---|---|---|---|---|---|---|
| Minor wording fix, same task | No; patch/minor revision | No | Yes | Yes | None | None normally |
| Correct-answer fix | Increment | Only if stage meaning changes | Historical only | No | Required | Updated question; reassessment required |
| Accepted-answer expansion | No; minor revision | No | Yes | Yes | None | None normally |
| Accepted-answer restriction | Increment | No unless broad impact | Historical only | No | Required | Updated question; reassessment required |
| Material marks change | Increment | Increment if thresholds/requirements change | Historical only | No | Required | Updated question |
| Stage reassignment, same task | No | Increment old/new stages and path | Question completion yes; stage completion historical | Recalculate stage/path | Recommended | Learning path updated |
| Substantial difficulty change | Increment | Increment if stage role changes | Historical only | No | Required | Reassessment recommended/required |
| Question replacement | New ID; archive old | Increment | Old item historical only | No for replacement | Required for new item | New/updated practice |
| Question removal | Archive; no ID reuse | Increment | Preserve acknowledgement; exclude from current total | Recalculate without reducing displayed achievement | None | Usually none |
| New question in completed stage | New ID | Increment stage/path minor | Prior version historically complete; current may be incomplete | Earlier-version mastery retained, current recalculated | Recommended | New practice available |
| New question in mastered path | New ID | Increment stage/path minor | Prior path historically complete | “Mastered on earlier version”; current recalculated | Recommended | New practice available |
| Stage renamed only | No | No; patch revision | Yes | Yes | None | None |
| Stage reordered, same requirements | No | Minor path revision | Yes | Yes | None | Learning path updated only if useful |
| Path structure/required stages changed | No unless questions change | Increment path; affected stages as needed | Prior path historical; current recalculated | Earlier-version mastery only until requirements met | Recommended or required when new required evidence exists | Learning path updated / New practice available |

## Historical Sprint 7 boundary and current extension

Sprint 7 added canonical version fields and validation, conservative data defaults, and active/archived filtering. Sprint 8 subsequently delivered persisted version-aware derivation, and Sprint 9 delivered V4 stable event IDs, structural snapshots, and deterministic merge rules. None invent legacy question versions, delete history, or collapse historical and current readiness.

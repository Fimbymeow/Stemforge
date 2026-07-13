# STEM Forge Content Version Architecture

Updated: 13 July 2026  
Status: Sprint 7 implemented foundation

## Outcome

STEM Forge now has an explicit, validated content-version and lifecycle foundation for canonical Higher Maths content. It is intentionally small: it identifies the current published content, retains room for archived history, and prevents archived records from entering learner-facing selectors. It does not change marking, progress, mastery, completion acknowledgements, routes, or learner-visible behaviour.

## Canonical fields

| Record | Stable logical identity | Version/revision metadata | Lifecycle |
|---|---|---|---|
| Question | `id` | `questionVersion`, `contentRevision` | `contentStatus` |
| Learning stage | `id` | `stageVersion` | `contentStatus` |
| Skill path | `slug` | `pathVersion` | `contentStatus` |
| Resource | `id` | `contentRevision` | `contentStatus` |
| Subject/course/spec area | existing slug | none in this sprint | `contentStatus` |

Versions and revisions are positive whole numbers. Lifecycle is exactly `active` or `archived`. Availability (`available`, `coming-soon`, `locked`) remains a separate product concept: a coming-soon path can still be active canonical content.

## Conservative migration defaults

All existing canonical records are version/revision `1` and `active`. Here, `1` means “the first version represented by the canonical version model”; it does not claim to be the first draft or first historical publication. No legacy attempt is assigned a content version.

## Identity decisions

No stable ID, slug, route, stage membership, or display order changed. The current mapping is:

| Record type | Logical identity | Source | Active use | Version/lifecycle |
|---|---|---|---|---|
| Subject | `higher-maths` | `data/higher-maths.ts` | Current beta subject | active |
| Course/spec | `calculus` / `differentiation` | `data/higher-maths.ts` | Current hierarchy | active |
| Available path | `basic-differentiation` | `data/higher-maths.ts` | Current learner path | path v1, active |
| Coming-soon paths | `chain-rule`, `trigonometric-differentiation`, `stationary-points`, `nature-of-stationary-points`, `optimisation`, `tangents-and-normals`, `mixed-differentiation-practice` | `data/higher-maths.ts` | Visible availability states | path v1, active |
| Canonical stages | `basic-diff-stage-foundations`, `basic-diff-stage-applications`, `basic-diff-stage-past-paper-style` | `data/higher-maths.ts` | Required path order 3/3/2 | stage v1, active |
| Canonical questions | `hm-calc-diff-basic-f-001..003`, `hm-calc-diff-basic-a-001..003`, `hm-calc-diff-basic-ppq-001..002` | `content/questions/higher-maths/differentiation.ts` | Active stage membership | question v1/revision 1, active |
| Resources | 11 existing `basic-diff-*` IDs | `data/higher-maths.ts` | Current notes/cards/examples/practice | revision 1, active |
| Compatibility stages | three `higher-maths-stage-*` IDs and three Higher Physics stages | subject data | Compatibility presentation only | stage v1, active |
| Legacy questions | 15 existing Physics IDs | `data/questions.ts` | Retained legacy flow | unversioned legacy schema |

## Selector boundary

`lib/content-selectors.ts` is the central pure selector layer. It provides ordered active-only selection for subjects, hierarchy records, stages, questions, and resources. `createActiveSkillPathView` removes archived stages and question references and recalculates learner-facing counts without mutating source data. `createActiveSubjectView` applies the same boundary to downward navigation.

Normal learner flows use `getActiveQuestionById`. `getQuestionByIdIncludingArchived` is an explicit historical/admin lookup: with a version it returns that exact version; without one it prefers the active version and otherwise returns the highest archived version. This separation makes accidental archive leakage less likely.

Stage question order remains authoritative. Active question resolution maps the stage IDs in their declared order rather than filtering the question dataset’s incidental order.

## Lifecycle invariants

- A logical question may have archived historical versions but at most one active version.
- A logical question ID plus `questionVersion` pair is unique.
- An active stage must resolve every required question ID to an active version.
- An archived question may remain unreferenced for history.
- An active path cannot contain an archived stage.
- An archived path cannot contain an active stage.
- An archived parent cannot contain an active course/spec/path child.
- Archived records are excluded from learner-facing totals and navigation.
- IDs are never reused for unrelated content.

## Validation and reporting

`lib/content-validation.ts` validates positive integer versions/revisions, lifecycle values, duplicate version pairs, multiple active versions, parent/child lifecycle conflicts, archived-only active-stage references, existing hierarchy relationships, answers, resources, and legacy compatibility. Errors include the record identity and source location. Production builds still run validation first.

The report now separates total, active, archived, and versioned counts. The Sprint 7 baseline is 8 active paths, 9 active stages, 8 active/versioned canonical questions, 11 active resources, zero archived canonical records, and one expected warning for 15 legacy Physics questions.

## Progress, mastery, and completion boundary

Sprint 8 introduced V3 progress evidence. New canonical Higher Maths attempts/events store their known active question assessment version. Existing V2, V1, and unversioned records migrate to explicit unknown legacy evidence rather than invented version `1`. Current and historical completion/mastery are derived separately; see `STEM_FORGE_VERSION_AWARE_PROGRESS.md`.

The completion acknowledgement store, key, replay prevention, and reset behaviour remain unchanged. Lifecycle metadata cannot grant progress, mastery, or completion. Selector-derived counts only describe active content.

## Archive workflow

For a future archive operation: retain the logical record and historical version, set it to `archived`, remove it from active required membership where appropriate, publish a valid active replacement only when policy requires one, increment affected structural versions, run validation and all regressions, and review historical-completion implications. Never delete attempt history or silently relabel it as current-version evidence.

## Publishing workflow

Minor equivalent edits increment `contentRevision`; materially assessable question changes increment `questionVersion`; required stage membership changes increment `stageVersion`; required path structure changes increment `pathVersion`. A future publishing tool should record author, reviewer, reason, class, and effective time. This sprint adds no CMS or database.

## Tests

`tests/content-version.test.ts` covers defaults, selector ordering, archive exclusion, historical lookup, learner-facing count recalculation, invalid versions/revisions/statuses, duplicate version pairs, multiple active versions, valid archived history, archived-only stage references, active-path/archive conflicts, and the retained legacy warning. Run `pnpm run test:content-version` for the focused suite or `pnpm run test:content` for all content tests.

## Deferred work

Sprint 8 completed persisted question-version evidence. Historical stage/path completion snapshots, database event schemas, account merging, admin publishing, legacy Physics migration, multiple-version authoring storage, and a fuller student-facing version-history UI remain deferred.

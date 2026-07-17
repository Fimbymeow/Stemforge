# STEM Forge Content Architecture

Updated: 14 July 2026
Scope: canonical static content model and validation infrastructure

## Purpose

STEM Forge content is loaded from typed TypeScript records. Before this sprint, those records were consumed directly by the application. The repository now has an explicit validation step:

```text
TypeScript content
-> content validation
-> tests/build
-> application
```

Validation protects the existing student experience without changing routes, question wording, marking, progression or local progress.

## Content hierarchy

The current learner hierarchy is:

```text
Subject
-> CourseArea
-> SpecificationStrand
-> SkillPath
-> LearningStage
-> Question
```

Resources are attached to a `SkillPath`:

```text
SkillPath
-> Notes
-> Formula cards
-> Worked examples
-> Flashcards
-> Practice sets
```

### Current canonical records

| Content | Type | Current location |
|---|---|---|
| Shared definitions | types in `data/types.ts` | `data/types.ts` |
| Higher Maths hierarchy | `Subject` | `data/higher-maths.ts` |
| Higher Physics hierarchy | `Subject` | `data/higher-physics.ts` |
| Basic differentiation questions | `Question[]` | `content/questions/higher-maths/differentiation.ts` |
| Legacy Physics questions | `StemForgeQuestion[]` | `data/questions.ts` |
| Canonical production registry | `CanonicalContentSource` | `data/canonical-content.ts` |
| Catalog traversal and ownership | pure resolver | `lib/content-resolver.ts` |
| Bank querying | pure query contract | `lib/question-bank-query.ts` |
| Validation | pure validator and formatter | `lib/content-validation.ts` |
| Validation command | repository entry point | `scripts/validate-content.ts` |
| Integrity tests | Node test suite | `tests/content-validation.test.ts` |

## Canonical TypeScript types

`data/types.ts` remains the authoritative model file. This sprint did not duplicate or replace the content types.

Sprint 19 extends `Question` with optional graph and nature-table metadata:

- `graphConfig`
- `natureTableConfig`
- `structuredAnswer`

These fields are build-time validated in `lib/content-validation.ts`. They are authored content only; the first graph foundation does not accept arbitrary student-entered executable expressions. See `STEM_FORGE_INTERACTIVE_MATHS_GRAPHS_AND_NATURE_TABLES.md`.

### Subject

A subject owns:

- stable `subjectSlug`;
- display name, subject and level;
- availability state;
- descriptive copy and route;
- course areas;
- compatibility/fallback learning stages.

### CourseArea

A course area owns:

- stable scoped `slug`;
- name, description and route;
- availability/progress presentation data;
- spec areas.

### Specification strand

An official, explicitly ordered curriculum grouping with a stable ID, label, route and active/archive lifecycle. It owns navigation grouping but not learner progress or mastery. Higher Maths Calculus uses the six official SQA course-specification headings.

### SpecArea / Topic

`SpecArea` is currently an alias of `Topic`. It owns:

- stable scoped `slug`;
- name, description and route;
- question/progress presentation data;
- optional skill paths.

The alias is preserved because changing it would be a broader domain refactor.

In the Higher Maths runtime, existing route topics remain URL containers while specification strands are the learner-facing canonical grouping. The resolver owns the relationship so components do not infer it from URLs.

### SkillPath

A skill path owns:

- globally unique `slug`, used as `skillPathId` by questions;
- name, description, route and availability;
- UI/recommendation metadata;
- resources;
- learning stages.

The skill-path slug must be globally unique because current lookup code searches all subjects by this value.

### LearningStage

A stage owns:

- globally unique `id`;
- one of the current stage names;
- copy, availability and presentation metadata;
- ordered `questionIds`;
- declared question count.

The ordered `questionIds` array is the canonical path order used by progression.

### Question

The canonical active question type includes:

- `id`;
- subject/course/spec-area names;
- `skillPathId` and `stageId` references;
- stage, skill and title;
- Markdown/LaTeX question text;
- marks and answer type;
- canonical and accepted answers;
- optional multiple-choice options and unit;
- worked solution, final answer, hint and common mistake;
- calculator flag, source, readiness status and display order.

No marking semantics were changed. `correctAnswer` and `acceptedAnswers` remain plain strings interpreted by the existing answer engine.

### Resources

Resources use the existing `NoteBlock`, `FormulaCard`, `WorkedExample`, `Flashcard` and `PracticeSet` types. They remain embedded in their skill path for the current proof of concept.

## Stable ID rules

All stable IDs and slugs must:

- exist;
- be non-empty strings;
- use lowercase kebab-case;
- match `^[a-z0-9]+(?:-[a-z0-9]+)*$`;
- not use a reserved ID;
- remain unchanged after content is published if progress may reference them.

Reserved IDs are:

```text
admin
new
null
root
undefined
unknown
```

### Uniqueness scopes

- Subject slugs: globally unique.
- Course slugs: unique within a subject.
- Spec-area slugs: unique within a course.
- Skill-path slugs: globally unique.
- Stage IDs: globally unique.
- Canonical question IDs: globally unique.
- Legacy question IDs: globally unique within the legacy registry.
- Resource IDs: globally unique across current canonical resources.

### Current question ID convention

```text
hm-calc-diff-basic-f-001
```

This convention is readable but not generated automatically:

- `hm`: Higher Maths
- `calc`: Calculus
- `diff`: Differentiation
- `basic`: Basic differentiation
- `f`: Foundations
- `001`: sequence

The validator enforces the generic kebab-case rule, not the subject-specific abbreviation pattern. The abbreviation policy should be decided before bulk import tooling generates IDs.

## Relationship rules

The validator enforces these canonical relationships:

```text
Question.skillPathId
-> existing SkillPath.slug

Question.stageId
-> existing LearningStage.id

LearningStage.questionIds[]
-> existing Question.id
```

It also verifies:

- a canonical question is referenced by a stage;
- a question is not referenced by multiple canonical stages;
- the referenced stage belongs to the referenced skill path;
- question subject, course-area, spec-area, skill-path and stage labels agree with the referenced hierarchy;
- stage question counts agree with `questionIds.length`;
- stage question lists do not contain duplicates;
- sibling course/spec-area/skill-path slugs do not collide.

The hierarchy is nested rather than graph-linked, so circular parent relationships cannot currently be represented by the typed model. If content is later normalised into independent database records, cycle detection must be added to the import/database validator.

## Question validation rules

### Build-blocking errors

Validation fails when a canonical question has:

- missing or invalid ID;
- empty question text;
- empty correct answer;
- empty source metadata;
- invalid marks;
- invalid display order;
- invalid or missing accepted-answer array;
- no accepted answers for an automatically marked question;
- empty/non-string accepted-answer values;
- missing or invalid stage/path references;
- no stage membership;
- hierarchy metadata that disagrees with its references;
- multiple-choice type without options;
- multiple-choice options with no accepted value.

### Warnings

Warnings do not fail validation. They currently cover:

- empty hints;
- empty worked solutions;
- empty final answers;
- duplicate accepted-answer strings;
- `correctAnswer` not appearing verbatim in `acceptedAnswers`;
- empty resource bodies/answers;
- empty practice sets;
- the retained legacy Physics question system.

Warnings should be reviewed before publishing or importing content. They are deliberately non-blocking where the existing app can still render safely.

## Accepted-answer validation

For `numerical`, `algebraic` and `multiple_choice` questions:

- `acceptedAnswers` must be an array;
- the array must not be empty;
- each value must be a non-empty string;
- exact duplicate values are reported;
- the canonical answer should appear verbatim in the array.

The validator checks record quality only. It does not:

- parse algebra;
- compare mathematical equivalence;
- apply numeric tolerance;
- change normalisation;
- add symbolic marking;
- change current correct/incorrect results.

## Resource validation

Every resource requires a stable ID and a usable title/front. Type-specific suspicious empty content is reported:

- notes: body;
- formula cards: formula;
- worked examples: final answer;
- flashcards: back/answer;
- practice sets: positive question count.

Resource routes, publication workflows and content versioning are future work.

## Validation commands

Run validation manually:

```bash
pnpm run validate-content
```

Run focused content tests:

```bash
pnpm run test:content
```

Run the repository test command:

```bash
pnpm test
```

Production builds run validation first:

```bash
pnpm build
```

Any validation error gives the command a non-zero exit code and blocks the production build. Warnings are printed but do not fail the command.

Future content import commands must call the same `validateContent` function before writing or publishing imported records.

## Validation report

The report includes:

- subject count;
- course count;
- spec-area count;
- skill-path count;
- declared stage count;
- canonical question count;
- legacy question count;
- resource count;
- detailed errors and source/logical locations;
- detailed warnings;
- final totals.

Current validated summary:

```text
Subjects: 2
Courses: 4
Spec areas: 20
Skill paths: 8
Stages: 9
Canonical questions: 8
Legacy questions: 15
Resources: 11
Errors: 0
Warnings: 1
```

The warning records that 15 Higher Physics questions still use compatibility validation rather than the canonical `Question` model.

## Initial integrity tests

`tests/content-validation.test.ts` proves that:

1. current Higher Maths content has no validation errors;
2. duplicate question IDs are rejected;
3. missing stage-to-question references are rejected;
4. empty accepted answers on automatically marked questions are rejected;
5. invalid question-to-stage references are rejected.

The tests use cloned synthetic records and do not alter production content.

## Higher Maths and legacy Higher Physics

### Canonical Higher Maths system

- Uses `Question` from `data/types.ts`.
- Stores Markdown/LaTeX question and solution strings.
- Uses `skillPathId`, `stageId` and accepted-answer aliases.
- Renders through `QuestionWorkspace`.
- Participates in canonical relationship validation.

### Legacy Higher Physics system

- Uses `StemForgeQuestion` from `data/questions.ts`.
- Stores `question`, `answer`, `answerUnit`, difficulty and structured solution steps.
- Does not have canonical `skillPathId`, `stageId`, accepted-answer arrays, hint, source or publication status.
- Renders through the legacy `QuestionPage`.
- Receives compatibility checks for IDs, required question/answer text, marks and solution presence.

The systems were intentionally not merged. Consolidation would change types, routes and question rendering and requires a dedicated migration sprint with regression tests.

Shared future concepts include stable question identity, subject/course/topic metadata, stage, marks, prompt, expected answer, solution and common mistake.

## Scaling considerations

Before hundreds or thousands of questions are added:

1. Keep validation mandatory for every import and production build.
2. Add an explicit content schema version.
3. Define question-version behaviour for stored progress.
4. Decide whether question order is derived from stage IDs or `displayOrder`; currently both exist.
5. Separate large resource/question datasets from subject navigation metadata without changing their canonical IDs.
6. Produce deterministic import reports before committing generated content.
7. Add publication states and draft filtering.
8. Add route validation or generate canonical routes from content identity.
9. Keep answer validation separate from mathematical marking.
10. Migrate legacy Physics through an explicit adapter/migration, not an implicit union.

## Sprint 7 content-version foundation

Canonical questions, stages, paths, resources, and hierarchy records now carry explicit version/revision or lifecycle metadata as appropriate. Learner-facing reads pass through central active-only selectors; archived historical question lookup is explicit. Validation now reports active/archive counts and rejects invalid lifecycle structures. The full design, identity mapping, migration boundary, and archive workflow are documented in `STEM_FORGE_CONTENT_VERSION_ARCHITECTURE.md`.

This does not version existing progress attempts. Their historical content version remains unknown, and no progress, mastery, answer, or completion behaviour changed.

## Remaining decisions

- Exact ID abbreviation policy for future subjects and generated content.
- Whether IDs are human-authored or generated by import tooling.
- Whether `answerType` should remain the import field or accept an external `type` alias.
- Whether `correctAnswer` must always be one of `acceptedAnswers` or be inserted automatically during import.
- How content versions affect existing local and future account progress.
- Whether stages remain embedded or become independent records in a database.
- Whether resources receive independent publication/version metadata.
- When and how the legacy Physics system is migrated.

These decisions are not required for the current eight-question beta but should be settled before database and admin-tool design.

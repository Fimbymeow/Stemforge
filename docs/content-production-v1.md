# Higher Maths content production v1

## Purpose and source of truth

This is the repository workflow for taking one canonical Higher Maths skill from specification mapping to truthful publication. It coordinates existing systems; it does not replace them.

The runtime remains the canonical TypeScript content graph exposed by `contentResolver`. Notes remain native `LessonDocument` modules. Question-bank Markdown remains authoring/import input. The existing import compiler, marking engine, approval receipts and import receipts remain authoritative for their own boundaries.

The generated production tracker is the operational view. Do not maintain a second hand-written spreadsheet.

## Required production sequence

1. **Official mapping** — map the skill to one or more of the 58 official Higher Maths requirements.
2. **Skill contract** — define assessed scope, exclusions and hard prerequisites. Add question-level `curriculum.requiredSkillIds` only where a particular question genuinely needs extra knowledge.
3. **Historical-paper pattern audit** — record that assessment patterns were abstracted for calibration without copying source questions.
4. **Notes** — author and validate the native `LessonDocument`.
5. **Foundations** — produce the introductory question stage.
6. **Applications** — produce standard application questions.
7. **Past Paper-style Questions** — produce original exam-style questions.
8. **Marking readiness** — every accepted answer must be supported by the existing marker; unsupported shapes block publication.
9. **Content QA** — complete mathematical, curriculum, originality and marking QA.
10. **Content approval** — record explicit content-owner approval separately from automated checks.
11. **Integration and publication** — use the existing preview/approval/apply workflow where import is required, validate the final graph, and verify the live skill.

Every stage must use real evidence. Missing evidence stays incomplete; filenames, hashes and manifests are references, not proof of human review.

## Publication gate

A standard live skill must have:

- canonical registration and official mapping;
- a matching skill contract;
- completed historical-pattern audit;
- validated Notes and non-empty Foundations, Applications and Past Paper-style stages;
- supported marking for every question and accepted answer;
- completed mathematical, curriculum, originality and marking QA;
- explicit content approval;
- no blocking known issue;
- valid import configuration where a Markdown import is required.

`pnpm run validate-content` enforces the machine-checkable gate. Publication readiness is stricter than schema validity.

Basic Differentiation is the only explicit `grandfathered_live_baseline`. It remains live, but the tracker truthfully reports its missing historical approval evidence and the two questions whose future ownership belongs under Stationary Points. This exception permits existing runtime content; it does not make that content production-ready and must not be copied to another skill.

## Commands

Show all 49 skills and the deterministic recommendation:

```text
pnpm run content:status
```

Inspect one skill:

```text
pnpm run content:skill -- chain-rule
pnpm run content:skill -- tangents-and-normals
```

Machine-readable output is available by adding `--json`. These commands are read-only.

Validate the canonical graph and production gate:

```text
pnpm run validate-content
```

For Markdown-bank preview, approval and apply commands, use `docs/content-import-foundation.md`. Never bypass preview or manufacture an approval/import receipt.

## Manifest discipline

Register a thin `SkillPackageManifest` only when production work has actually started. It should point to authoritative mappings, contracts, prerequisites, sources, QA evidence, approval evidence and known issues. It must not duplicate curriculum prose or become a narrative dossier.

Package schema v2 adds explicit production evidence, known issues, publication policy and optional import ownership. Older schema-v1 manifests must be migrated rather than silently treated as approved.

Canonical-runtime sources use `evidenceMode: "canonical_runtime"`; authoring Markdown uses the default authoring-source evidence. `publicationPolicy` is normally `standard`. A new grandfathered policy requires an explicit product decision and is not routine content work.

The production registry intentionally covers all 49 skills even though only started skills have manifests. Unstarted skills remain visible with their next missing stage.

## Objective validation

Main validation checks include:

- path, stage and aggregate question-count consistency;
- positive whole stage duration when learner content exists;
- no empty stage on a live skill;
- required live question fields and bounded metadata enums;
- question-level curriculum-reference integrity;
- exact normalized duplicate-prompt warnings;
- graph viewport, expression and derivative-link structure;
- package identity, source freshness, stage counts, marking capability and QA evidence;
- standard live-skill publication readiness.

Automated validation does not prove pedagogy, originality, mathematical quality or content approval. Those remain explicit human gates.

## Current representative baseline

- **Chain Rule:** standard, published and production-ready; 10 Foundations, 9 Applications and 15 Past Paper-style questions. Its apply receipt is present; later version-controlled rebrand/LaTeX edits mean the original receipt output hash is historical rather than the current file hash.
- **Basic Differentiation:** live grandfathered baseline; 3/3/2 canonical questions; not production-ready until its recorded issues and missing approvals are resolved.
- **Tangents:** unpublished package in progress; 0/1/4 authored questions, no Notes, known marking blockers, and historical-pattern audit is the next stage.

The tracker selects Tangents as the current global recommendation because it is the earliest canonical unpublished skill with an existing in-progress package. This is a deterministic coordination recommendation, not an automatic publication instruction.

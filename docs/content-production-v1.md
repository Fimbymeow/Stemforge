# Higher Maths content production v1

**v2.0 update:** new Higher Maths production uses one ordered Practice bank. Legacy three-stage banks remain readable during migration, but are no longer the authoring requirement.

**v1.2 update:** formalised question ownership and cross-topic integration. Ownership follows the primary assessed objective; conditional prior knowledge remains attached to the owning question through the existing curriculum metadata and must be honoured by eligibility.

**v1.1 update:** added an explicit, coverage-based worked-example requirement to step 4 (Notes) and the publication gate. See that step and the gate list below; the rule is deliberately not a numeric quota. This update strengthens the standard going forward — it does not retroactively require re-authoring already-published Notes such as Chain Rule's.

## Purpose and source of truth

This is the repository workflow for taking one canonical Higher Maths skill from specification mapping to truthful publication. It coordinates existing systems; it does not replace them.

The runtime remains the canonical TypeScript content graph exposed by `contentResolver`. Notes remain native `LessonDocument` modules. Question-bank Markdown remains authoring/import input. The existing import compiler, marking engine, approval receipts and import receipts remain authoritative for their own boundaries.

The generated production tracker is the operational view. Do not maintain a second hand-written spreadsheet.

## Required production sequence

1. **Resolve canonical skill** — confirm the exact skill path and official mapping.
2. **Freeze contract** — define assessed scope, exclusions and hard prerequisites.
3. **Specification audit** — reconcile the contract with the official Higher Maths requirements.
4. **Historical assessment audit** — abstract real assessment patterns without copying source material.
5. **Identify prerequisites and natural integrations** — distinguish universal prerequisites from question-level requirements.
6. **Coverage blueprint** — plan required methods, representations, archetypes and progression without stage quotas.
7. **Notes** — author and validate the native `LessonDocument`, including a complete worked example for every distinct method or case.
8. **Ordered Practice bank** — author one Q-numbered Practice list. Set each question's `curriculum.primarySkillId` from its primary assessed objective and add `curriculum.requiredSkillIds` only where that question genuinely needs extra knowledge.
9. **Practice Skim List** — produce one prompt-only list containing every Practice question, with no answers, hints, or solutions.
10. **QA** — complete mathematical, curriculum, originality and marking QA. Review the Skim List for coverage, repetition, coefficient repetition, unnatural combinations, missing historical archetypes and difficulty progression.
11. **Preview** — use the deterministic importer preview and inspect Practice order, ownership, dependencies, marking readiness, collisions and version decisions.
12. **Approval** — record explicit content-owner approval separately from automated checks.
13. **Import** — apply only an approval-fresh, atomically valid import.
14. **Production validation** — validate the final canonical graph and verify the live skill.

Every stage must use real evidence. Missing evidence stays incomplete; filenames, hashes and manifests are references, not proof of human review.

### Current bounded multipart marking contract

The import and learner workspace now support genuinely multipart assessed responses. New Markdown
must use fenced `answerFields` YAML and explicitly mark every field with `assessed: true` or
`assessed: false`; two or more assessed fields are submitted and marked together. Use only the
repository-supported exact numeric, bounded algebraic-expression, exact coordinate-pair,
closed-vocabulary `text_short`, and affine `x`/`y` line-equation shapes documented in
`docs/content-import-foundation.md`. Question marks are authored independently of field count.

Equivalent line equations may use slope-intercept, point-gradient or rearranged implicit form.
Nonlinear equations, inequalities, systems, arbitrary free text and other symbolic forms remain
unsupported and must block production. Hints and worked solutions remain question-level support,
not per-field evidence.

## Question ownership and cross-topic integration

Question ownership is determined by the primary assessed objective: the mathematical evidence the learner must produce for the question to have done its main job. A method, representation or context used on the way does not become the owner merely because it appears in the prompt or solution.

A Practice question may use prerequisite or naturally integrated Higher Maths knowledge provided one
canonical skill remains clearly responsible for the evidence. If several skills are equally central,
defer the question to future Mixed Practice or custom papers. Do not introduce forced isolated,
combined, or mixed quotas.

Keep ownership and requirements separate using the repository's existing fields:

- `curriculum.primarySkillId` is the canonical owner and must match the skill path that contains the question;
- `curriculum.requiredSkillIds` lists actual additional skills required by that question;
- package-schema-v2 `questionLevelRequirements` documents which conditional requirements the package permits, but does not tag questions;
- `hardPrerequisiteSkillIds` and the canonical prerequisite graph are only for knowledge required throughout the whole skill.

Every triggering question must carry its own `curriculum.requiredSkillIds`; do not infer dependencies from prompt text and do not invent a second metadata system. Conditional requirements must name known canonical skills, be permitted by the owning package, and remain question-level rather than being promoted to universal graph edges.

Learner delivery must fail closed when a declared required skill is not currently available: Practice and Question Bank eligibility exclude that question. This availability check prevents exposure before the supporting path is published; it does not claim that an individual learner has completed or mastered the required skill. Teaching sequence and curriculum QA remain responsible for the stronger "previously learned" authoring judgement.

Example: a Tangents Past Paper-style question may use circle geometry, Chain Rule or Trigonometric Differentiation while remaining owned by `tangents-and-normals` when constructing the tangent is the primary assessed objective. The question must declare each genuine conditional dependency in `curriculum.requiredSkillIds`, the Tangents package must permit it in `questionLevelRequirements`, and eligibility must exclude it while any required path is unavailable.

## Publication gate

A standard live skill must have:

- canonical registration and official mapping;
- a matching skill contract;
- completed historical-pattern audit;
- validated Notes and a non-empty explicitly ordered Practice bank;
- a worked example covering every distinct method or case in that skill's assessed scope (coverage-based, not a fixed count);
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
- conditional requirement integrity against the owning package, plus required-skill availability in learner eligibility;
- exact normalized duplicate-prompt warnings;
- graph viewport, expression and derivative-link structure;
- package identity, source freshness, stage counts, marking capability and QA evidence;
- standard live-skill publication readiness.

Automated validation does not prove pedagogy, originality, mathematical quality or content approval. Those remain explicit human gates.

## Current representative baseline

- **Chain Rule:** standard, published and production-ready; 10 Foundations, 9 Applications and 15 Past Paper-style questions. Its apply receipt is present; later version-controlled rebrand/LaTeX edits mean the original receipt output hash is historical rather than the current file hash.
- **Basic Differentiation:** live grandfathered baseline; 3/3/2 canonical questions; not production-ready until its recorded issues and missing approvals are resolved.
- **Tangents:** unpublished package in progress; 0/1/4 authored questions and no Notes. Its former
  affine-equation and multipart marking infrastructure blockers are resolved, but the skill still
  requires the normal production, QA, approval and import gates before publication.

The tracker selects Tangents as the current global recommendation because it is the earliest canonical unpublished skill with an existing in-progress package. This is a deterministic coordination recommendation, not an automatic publication instruction.

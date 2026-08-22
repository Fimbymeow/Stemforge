# Higher Maths content production v1

**v1.2 update:** formalised question ownership and stage-specific cross-topic integration. Ownership follows the primary assessed objective; conditional prior knowledge remains attached to the owning question through the existing curriculum metadata and must be honoured by eligibility.

**v1.1 update:** added an explicit, coverage-based worked-example requirement to step 4 (Notes) and the publication gate. See that step and the gate list below; the rule is deliberately not a numeric quota. This update strengthens the standard going forward — it does not retroactively require re-authoring already-published Notes such as Chain Rule's.

## Purpose and source of truth

This is the repository workflow for taking one canonical Higher Maths skill from specification mapping to truthful publication. It coordinates existing systems; it does not replace them.

The runtime remains the canonical TypeScript content graph exposed by `contentResolver`. Notes remain native `LessonDocument` modules. Question-bank Markdown remains authoring/import input. The existing import compiler, marking engine, approval receipts and import receipts remain authoritative for their own boundaries.

The generated production tracker is the operational view. Do not maintain a second hand-written spreadsheet.

## Required production sequence

1. **Official mapping** — map the skill to one or more of the 58 official Higher Maths requirements.
2. **Skill contract** — define assessed scope, exclusions and hard prerequisites. Set each question's `curriculum.primarySkillId` from its primary assessed objective, not from every topic appearing in its prompt. Add question-level `curriculum.requiredSkillIds` only where that particular question genuinely needs extra knowledge.
3. **Historical-paper pattern audit** — record that assessment patterns were abstracted for calibration without copying source questions.
4. **Notes** — author and validate the native `LessonDocument`. Notes must include a fully worked example for every distinct method or case the skill's assessed scope introduces. This is a coverage requirement, not a numeric quota: a skill covering one method needs one worked example that actually demonstrates it end to end; a skill covering three genuinely distinct methods or cases (for example, three different differentiation rules, or a split by sign/boundary case) needs a worked example for each, no more and no fewer than the scope demands. A worked example restates the full method — problem, reasoning, and answer — not just a final answer or an isolated formula.
5. **Foundations** — produce the introductory question stage.
6. **Applications** — produce standard application questions.
7. **Past Paper-style Questions** — produce original exam-style questions.
8. **Marking readiness** — every accepted answer must be supported by the existing marker; unsupported shapes block publication.
9. **Content QA** — complete mathematical, curriculum, originality and marking QA.
10. **Content approval** — record explicit content-owner approval separately from automated checks.
11. **Integration and publication** — use the existing preview/approval/apply workflow where import is required, validate the final graph, and verify the live skill.

Every stage must use real evidence. Missing evidence stays incomplete; filenames, hashes and manifests are references, not proof of human review.

## Question ownership and cross-topic integration

Question ownership is determined by the primary assessed objective: the mathematical evidence the learner must produce for the question to have done its main job. A method, representation or context used on the way does not become the owner merely because it appears in the prompt or solution.

- **Foundations** should isolate the canonical skill as far as practical. Use only the universal hard prerequisites and incidental algebra/notation needed to execute the new skill; avoid conditional cross-topic demands.
- **Applications** may combine the canonical skill with light, already-learned prerequisite or context skills, while keeping the canonical skill as the primary assessed objective.
- **Past Paper-style Questions** may use authentic cross-topic integration with previously learned skills. Do not strip realistic context merely to make the question single-topic.

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
- validated Notes and non-empty Foundations, Applications and Past Paper-style stages;
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
- **Tangents:** unpublished package in progress; 0/1/4 authored questions, no Notes, known marking blockers, and historical-pattern audit is the next stage.

The tracker selects Tangents as the current global recommendation because it is the earliest canonical unpublished skill with an existing in-progress package. This is a deterministic coordination recommendation, not an automatic publication instruction.

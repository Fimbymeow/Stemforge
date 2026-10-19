# ADR: Practice compatibility foundation

Status: accepted for Phase 1

## Decision

Orthic's target learner-facing skill model is:

> Notes → Practice → Review

Practice is one explicitly ordered bank of questions owned by one canonical skill. During the
transition, Practice is a projection over the existing stage-backed canonical questions rather
than a replacement for their persisted identity.

- `primarySkillId` remains the sole owner of learning evidence.
- `requiredSkillIds` affects eligibility only. Required does not mean assessed.
- Questions may use prerequisites or natural Higher Maths integrations when one canonical skill
  clearly owns the evidence.
- Questions with genuinely equal multi-skill ownership are deferred to future Mixed Practice or
  custom-paper work.
- Review remains a separate skill-level scheduling system, not a Practice content stage.

## Compatibility constraints

Existing Foundations, Applications and Past Paper-style stage IDs remain valid hidden provenance.
Phase 1 does not remove or rewrite them in attempts, support events, guided self-assessments,
Practice or Review session references, Study Plan state, achievement snapshots or import history.

Mastery remains stage-backed and retains the current weights:

- Foundations: 25%
- Applications: 35%
- Past Paper-style Questions: 40%

The existing PPQ-specific mastered threshold and all-stage completion rule also remain in force.
The Practice projection may expose question counts and order, but it does not redefine completion,
mastery, Review eligibility or confidence.

This grouping change does not by itself bump `pathVersion`, `questionVersion` or `contentRevision`.
Historical append-only evidence and immutable import receipts are not rewritten.

## Scope

Phase 1 adds Practice projections only to available Higher Maths skills. Higher Physics continues
to use its existing stage model unchanged. No learner-facing UI, importer grammar, content-production
workflow or public-site copy changes in this phase.

Legacy stage removal is future work and may begin only after compatibility for historical evidence,
Mistake Log identity, Review history and persisted sessions is proven by a separately approved
migration.

## Phase 2 importer seam

New Higher Maths banks author a single `Practice` section. Until learner runtime migration is
complete, their questions carry an explicitly wired hidden `practiceCompatibilityStageId` and the
canonical question stage value `Practice`. That provenance is not a `LearningStage`, is excluded
from the legacy stage-weighted mastery model, and exists only to keep stage-bearing evidence and
session contracts honest during transition.

The generated skill-owned question module also owns its ordered `practiceQuestionIds` export.
Legacy F/A/PPQ sources remain readable and retain their historical stage IDs. A placement-only move
into Practice compatibility provenance may use the explicit
`practice_regrouping_no_version_bump` decision; any accompanying assessment or marking change still
requires the established version decision.

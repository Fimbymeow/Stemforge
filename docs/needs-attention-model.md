# Needs-attention model design

Status: implemented as a pure read-side explanation model in Sprint 4D.

## Principles

- Untouched content is unknown, not weak.
- Completion is structural progress, not proof of mastery.
- `Review due` is a scheduling signal, not weakness.
- Recent evidence and historic best mastery answer different questions and remain separate.
- Every learner-facing reason must trace to inspectable evidence.
- There is no opaque aggregate AI weakness score.

## Inputs

The model uses current-version genuine graded attempts, independent correctness, support use, unresolved mistake evidence, stage completion, reassessment requirements and the existing Review due state. Legacy or unknown-version evidence remains visibly qualified. Review scheduling is displayed independently and the model does not alter the recommended action.

## Transparent derivation

The model returns ordered reason codes and factual learner copy. Display precedence is: required reassessment or updated content; unresolved current-version mistakes; incomplete current stage; Review due; otherwise healthy when meaningful evidence exists. Untouched content returns `not_started` without an attention judgement.

The window and threshold for a `Recent accuracy needs attention` rule are unresolved. They require product and learning-science calibration against real learner data and must not be invented for copy quality.

## Implemented boundary

Dashboard and skill-page copy use the highest-priority grounded reason. Review reasons reuse `ReviewDueReason`; mistake resolution reuses the shared open-mistake projection. There is no persisted attention state, calibrated recent-accuracy model, weakness score or change to next-action priority.

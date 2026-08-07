# Needs-attention model design

Status: future design. Sprint 2B exposes only explanations already supported by reliable progress evidence.

## Principles

- Untouched content is unknown, not weak.
- Completion is structural progress, not proof of mastery.
- `Review due` is a scheduling signal, not weakness.
- Recent evidence and historic best mastery answer different questions and remain separate.
- Every learner-facing reason must trace to inspectable evidence.
- There is no opaque aggregate AI weakness score.

## Candidate inputs

The future model may use current-version genuine graded attempts, independent correctness, support use, unresolved mistake evidence, stage completion, reassessment requirements and evidence recency. Legacy or unknown-version evidence must remain visibly qualified. Review scheduling is displayed independently even when it influences the recommended action.

## Transparent derivation

The model should return a state plus ordered reason codes and supporting question/event references. A proposed precedence is: required reassessment; unresolved current-version mistake evidence; an authoritative recent-performance rule; otherwise healthy when meaningful current evidence exists. No state is returned when there is no evidence.

The window and threshold for a `Recent accuracy needs attention` rule are unresolved. They require product and learning-science calibration against real learner data and must not be invented for copy quality.

## V1 boundary

The current tracker uses existing `reviewRecommended` question derivation for `Needs practice`, explains an incomplete affected stage with its real completion count where possible, and renders scheduled `Review due` separately. It does not claim a calibrated recent-accuracy model.


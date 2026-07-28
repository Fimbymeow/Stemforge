# Scheduled Review foundation

STEM Forge Review is a derived, local-first schedule over immutable learning evidence. The Alpha target is exactly one skill path (`skill` / `skill_path`) and delivery is exactly an existing Practice Session (`practice_session`). Review does not create a second question workspace.

## Durable evidence

Progress payload V6 adds an append-only `reviewEvents` stream. Each event records the source session, reviewed skill and path version, resolved outcome, scheduler version and resulting stage, bounded question IDs, and references to the immutable attempt/support evidence used for the decision. References are an audit trail: they may arrive after the Review event and are not dereferenced to recalculate historical scheduling.

The event ID is SHA-256 over the fixed source/target tuple and is encoded as `review_` plus 64 lowercase hexadecimal characters. A collision is cryptographically negligible, not impossible. The deterministic identity makes a retry for one source/target pair idempotent; it does not replace ordinary random evidence IDs.

## Scheduler and replay

Scheduler version 1 is immutable. Historical events retain their recorded scheduler version and `stageAfter`; unknown versions fail closed. A future scheduler registry can provide an explicit migration function, but no scheduler version 2 exists.

Canonical history is recomputed from the complete locally known causal DAG. Weakly connected target components are resolved recursively. An incorrect terminal event beats a concurrent successful terminal event. This does not make every historical error permanent: when an incorrect event has a genuine later successful Review descendant on the same branch, the later success is the terminal state and can become canonical. Cycles, cross-target prior links, self-links, and unknown-scheduler components are excluded from schedule resolution without deleting their evidence.

## Eligibility and recovery

The baseline completion instant is found by replaying compatible graded evidence prefixes through the same skill-progress calculation used by the product. The first scheduled Review is due exactly two days after that completion instant. A defensive extreme-history bound returns an explicit unavailable diagnostic rather than guessing eligibility.

Ordinary practice is a separate question-level recovery overlay. A latest compatible graded error opens recovery; only later independent correctness on that same question closes it. Assisted correctness cannot close it, ordinary work cannot advance the Review stage, and Review-session attempts are not counted twice. Once a canonical Review resolves, ordinary evidence at or before that Review boundary no longer keeps recovery open.

## Persistence and trust boundaries

Practice Session schema V3 adds the `review` mode, `scheduled_review` origin, and frozen local `reviewTargets`. Progress import, synchronization, provenance, browser controls, account export, and erasure all treat `review_event` as the fifth evidence kind.

The PostgreSQL `review_events` table follows the existing owner-generation, payload-hash, conflict-retention, and append-only conventions. Update, delete, and truncate are rejected. Account erasure is the only controlled hard-deletion path and reports its Review-event count.

Learners see only calm product language such as recently incorrect, due after time, hint used, solution used, or content changed. Event IDs, scheduler stages, versions, and causal-branch details remain internal.

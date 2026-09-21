# Public Preview Phase 3 — isolated interactive learning

The Phase 1 provider boundary and Phase 2 shell are unchanged. Preview routes now mount the real
shared QuestionWorkspace, QuestionAnswerInput/MathLive, normalizer, marker, feedback, hint and worked
solution components. No authored questions, marking contracts or progress calculations were changed.

QuestionWorkspace dispatches to a production wrapper (existing recommendation hook) or a demo core
with an explicit injected LearningRuntime. The core routes evidence/progress reads, subscriptions,
draft restore/save/clear, attempt writes, hint/solution events, guided self-assessment, completion
acknowledgements and previous-question navigation through that runtime. Production adapters delegate
to the existing services, including provenance/transactions. Production first-render empty evidence,
ephemeral use, session callbacks and completion panels are preserved.

Demo mode does not mount AppShell, AppTopbar, production recommendation hooks, reporting, completion
panels or the external formula sheet. Breadcrumb, Notes, next actions and return links are contained.
There are no pathname-based storage overrides. The server route retains canonical fail-closed ownership
checks before handing a question to the workspace.

## Walkthrough and exploration

The verified canonical samples are:

- Foundations: `hm-calc-diff-chain-f-003`, differentiate `(3x+2)^5`.
- Applications: `hm-calc-diff-chain-a-001`, gradient of `(2x+3)^4` at `x=1`.
- Exam practice: `hm-calc-diff-chain-ppq-003`, differentiate `(7-2x)^4`.

Native Notes continue with Try Foundations. The skill page also offers a direct short walkthrough.
Samples offer Sample Applications / Sample Exam practice / Return to Preview Dashboard after an
answer interaction or genuine existing attempt/hint. Moving between samples records no completion
event. Existing canonical derivation still requires all 10 / 9 / 15 questions for structural completion.
The pathway exposes current stage with aria-current=step, never inferred earlier-stage completion.
The one authored `written` Chain Rule question is closed-vocabulary auto-marked, not guided-pending.
The shared Workspace now keys guided self-check UI to the real marker outcome rather than the answer
type. The runtime adapter retains guided self-assessment operations for genuine guided-pending sessions;
none of the current canonical Chain Rule questions requires that path.

All 34 questions are also available in three modest stage disclosures on the skill page. Non-sample
questions advance within their own stage after interaction; at stage end they return to exploration.
Sample IDs retain the curated next-stage action, with Explore Chain Rule always available for browsing.

## Evidence, activity and reset

Attempts use canonical strings and real outcome metadata. Rich malformed/unsupported source is
rejected before marking as in production; other malformed/unmarkable marker outcomes retain their
non-correctness semantics. Internal failures are not counted as mathematical errors. Solutions preserve
the existing effort gate; support events record assistance rather than independent success.

Dashboard activity is derived only from current-version preview attempts/support events and normal
QuestionProgressState outcomes. There are no seeded metrics or fake progress. Continue points to the
first sample without evidence, or back to the skill when all samples have been encountered. Walkthrough
position is derived, not separately persisted.

Reset clears the private repository, drafts, acknowledgements and derived continuation. A reset generation
also clears the mounted Workspace's transient answer/feedback/support presentation. Refresh/new document
starts empty. No localStorage, sessionStorage, account state, auth cookies or API is changed by preview I/O.

## Deferred / limitations

Real signed-in live-provider smoke testing remains Phase 4; browser tests use simulated cookies and API
availability. Entry from production must still use document navigation. Pre-existing in-flight production
requests are not cancelled by this phase. Share/noindex metadata, deployment, sessionStorage decisions
and the final public release checklist are intentionally deferred.

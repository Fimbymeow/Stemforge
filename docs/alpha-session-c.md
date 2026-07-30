# Alpha Session C — Scheduled Review Return

Occurs at least two calendar days after the same learner completed a skill in Session A/B, using their real evidence exactly as it stands. Hypothesis definitions: `STEM_FORGE_ALPHA_READINESS.md` §4. Evidence sheet: `docs/alpha-evidence-capture.md`. Scheduling: `docs/alpha-scheduling-plan.md`.

`docs/review-foundation.md` is explicit: the first scheduled Review is due exactly two days after the skill's real completion instant. **This session cannot be compressed by editing production data or the system clock for an ordinary learner test** — doing so would test a scheduler state that never genuinely occurred.

**Separate developer verification (explicitly not learner evidence):** if the team needs to prove the scheduler mechanism itself works before committing learners to a multi-day wait, that is a synthetic, internally-authored fixture exercised by the existing automated suite (`review-core.test.ts`, `review-integration.test.ts`, `review-persistence.test.ts`, `e2e/review.spec.ts`, `e2e/review-mobile.spec.ts`) or a developer's own account with synthetic timestamps — never a real learner's session, and never labelled as Alpha findings.

## C1 — Confirm Review is due for the correct skill

- **Say:** "Come back in and pick up where you left off. Let me know if anything looks different."
- **Do not explain:** that a review is due, or the word "Review" itself, until they notice or ask.
- **Record:** whether the due-Review indicator is noticed unprompted; the exact skill it names; time to notice.
- **Done when:** Review is shown as due for the skill the learner actually completed (H9).
- **If it fails:** nothing appears due after two full days — this is a scheduling defect (Critical); verify against the raw evidence with a developer before assuming learner error.

## C2 — Launch Review

- **Say:** "Go ahead and start that."
- **Do not explain:** that it will open inside the same Practice Session experience they've already used, or any scheduler terminology (stage, scheduler version, event) — none of these should ever surface to a learner.
- **Record:** whether the learner recognises the familiar question-taking interface; any surprise at unfamiliar terminology (itself a defect finding, since none should exist).
- **Done when:** Review launches and the learner is answering a question within the same interface used before.

## C3 — Understanding of why they're reviewing

- **Say (mid-session, after the first Review question is answered):** "Why do you think this question came back to you today?"
- **Do not explain:** the actual reason (recent incorrect, time elapsed, hint used, content changed) before they answer.
- **Record:** whether their stated reason is plausible and roughly matches the calm product-language explanation the UI itself offers, if any.
- **Done when:** learner gives a sensible, non-arbitrary reason (H9).
- **If they believe it's random or punitive:** record as a Medium-or-higher comprehension finding depending on how strongly held that belief is.

## C4 — Complete a meaningful Review outcome

- **Say:** "Answer it the way you normally would."
- **Do not explain:** what outcome (independent/hint-assisted/incorrect) will do to the schedule.
- **Record:** the actual outcome reached; the learner's reaction to the completion state.
- **Done when:** the Review session reaches a real, recorded outcome.

## C5 — Verify the next schedule state, in learner language only

- **Say:** "Looking at it now, when do you think this would come back again?"
- **Do not explain:** the actual interval, stage name, or any scheduler internals — confirm the UI itself never exposes these.
- **Record:** whether the learner can form any reasonable expectation from calm product language alone, and whether the UI leaks any internal terminology.
- **Done when:** the next state is shown in plain language, with no scheduler internals visible anywhere in the UI.
- **Any leaked internal term** (event ID, "scheduler," a raw stage number) is a defect finding regardless of learner reaction.

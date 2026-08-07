# STEM Forge — Engagement Activity Model (Specification Only)

Status: **specification, not implemented.** No aggregation query, storage, or UI exists yet. This
document exists so that a future contribution heatmap, weekly consistency summary, and (if it is
ever revisited) Win the Week all draw on **one shared definition of "meaningful activity,"** rather
than each inventing its own.

Written during Sprint 1C-B (UX Cohesion & Trust Polish). Produced by auditing the existing evidence
model in `lib/progress/types.ts`, `lib/progress/calculations.ts`, `lib/review/types.ts`, and the one
day-bucketing function that already exists and ships today, `deriveWeeklyActivity()` in
`lib/dashboard-derivations.ts`.

## Purpose

Visualise meaningful learning activity over time without rewarding:

- app opens;
- tab-open duration;
- empty submissions;
- meaningless repeated clicks.

The model must stay consistent with the product's core promise — *"your progress only moves when
you actually do the work"* — so a day should only look active because a learner actually did
something evidentially real, not because the app was open.

## Candidate evidence sources

Only events that already exist, or are already planned, are used:

| Source | Field | Notes |
|---|---|---|
| Genuine question attempts | `QuestionAttempt` (`lib/progress/types.ts`), gated by `isGenuine` and `isGradedAttempt()` (`lib/progress/attempt-outcomes.ts`) | `isGenuine` alone only filters blank submissions — it is **not** an effort signal on its own (see Scoring model below for why it must be paired with outcome quality). |
| Independent correctness / mastery contribution | `MASTERY_CONTRIBUTIONS` (`lib/progress/calculations.ts`) | Already encodes exactly the effort/independence gradient this model needs — reused directly, not reinvented. |
| Stage completions | `AchievementSnapshot` with `kind: "stage_completed" \| "stage_secure" \| "stage_mastered"` (`lib/progress/types.ts`) | High-signal, low-frequency milestone events. |
| Review completions | `ReviewEvent` (`lib/review/types.ts`), specifically `outcome: "independent_success"` | A review the scheduler independently marked due, completed without help — a strong non-gameable signal. |
| Practice evidence | `PracticeSession.status === "completed"` (`lib/practice/practice-types.ts`) | Session-level completion; must be combined with attempt-level outcome data, not used alone (a session can complete with entirely support-assisted answers). |

### Does Notes viewing count?

**No — by explicit decision, not oversight.** Confirmed by code: `app/subjects/higher-maths/revision-notes/page.tsx` and the resource browser that renders Notes never call any evidence-writing function (`recordQuestionSubmission`, `recordSupportEvent`, `recordGuidedSelfAssessment`). Reading Notes leaves **zero trace** in the evidence model today.

**Recommended default: Notes viewing alone does not count**, until a trustworthy Notes-engagement event model exists (e.g. a minimum-dwell-time or scroll-completion signal — neither exists today, and inventing one is out of scope for this spec). Counting Notes views today would mean counting an event with no quality signal at all — indistinguishable from a learner who opened the page and immediately left.

## Scoring model

A **weighted daily score**, not binary and not a raw count, reusing `MASTERY_CONTRIBUTIONS` rather
than inventing arbitrary points:

- For each **distinct question** attempted on a given day, take the best outcome achieved that day (reusing the same `MASTERY_CONTRIBUTIONS` weights already used for mastery: `independently_correct_first_attempt = 1`, `independently_correct_after_error = 0.85`, `correct_with_hint = 0.7`, `completed_with_solution = 0.35`, `attempted_unresolved = 0.1`). Scoring **per distinct question**, not per raw attempt, means resubmitting the same question repeatedly does not inflate the day.
- Add a fixed bonus for any `AchievementSnapshot` (stage/path milestone) that day.
- Add a fixed bonus for any `ReviewEvent` with `outcome: "independent_success"` that day — a review outcome the scheduler independently required, not something the learner can pad by re-answering already-known material.
- **Cap each day's score** at a fixed ceiling, so continuing to answer questions past a certain point adds no further visual intensity. This is the mechanism that keeps the model from becoming a leaderboard or XP system — more work past the cap changes nothing you can see.
- Hint-viewed or solution-viewed activity **only counts when it follows a genuine attempt** (`QuestionSupportEvent.afterGenuineAttempt === true`) — a solution view with no attempt behind it is not evidence of engagement, it is evidence of disengagement from that specific question, and must not contribute to the score.

This deliberately rewards meaningful independent work more than repetition or support-assisted completion, and cannot be inflated by low-effort submissions, because the empty-answer guard (`isGenuineAnswer`) is already a precondition for `isGenuine`, and non-empty-but-trivial repeat submissions of the same question stop adding score once that question's best-outcome is already captured for the day.

## Visual levels

Approximately five states, matching a GitHub-style contribution scale:

```
no activity
light
moderate
strong
very strong
```

No final colours are chosen here. The existing design tokens (`paper`/`ink`/`muted`/`line`/`forge`/`success`/`warning`/`danger` in `tailwind.config.ts`) do not obviously map onto a 5-step sequential intensity scale — that choice should be made deliberately when the feature is actually built, not defaulted here.

## Timestamp integrity

**Not implemented in this sprint — documented as a prerequisite.** Client-supplied timestamps
(`attemptedAt`, `occurredAt`, `achievedAt`) are validated only for well-formedness today
(`isIsoTimestamp()` in `lib/remote-evidence/validation.ts`), not for plausibility against server-received
time or account-creation time. Before this activity model is used to power anything trust-sensitive
(a streak-like display, a "consistency" claim shown back to a learner), the ingestion path needs a
reasonable plausibility check — e.g. rejecting or flagging timestamps in the future, or implausibly
far in the past relative to when the record was actually received. **This guardrail is not built as
part of this specification** — only the need for it is recorded here, so it isn't discovered as a
gap after a heatmap already ships.

## Historical reconstruction

**Confirmed: yes.** Every timestamp used above (`attemptedAt`, `occurredAt`, `achievedAt`) is a
genuine per-event ISO string captured at the moment of the action (`new Date().toISOString()` in
`components/questions/question-workspace.tsx` and `lib/practice/practice-session-actions.ts`), not
synthesized after the fact. This means a heatmap built against this model would **not** start from
zero for existing learners — their full attempt/support/snapshot/review history already carries a
real day-by-day trail, including evidence migrated from earlier schema versions (`attemptedAt` has
been present since the V1 evidence shape).

## Future use

The same activity model may later power:

- a contribution heatmap;
- a weekly consistency summary (a natural successor to the `deriveWeeklyActivity()` signal surfaced in Sprint 1C-B — see `STEM_FORGE_PROGRESS_AND_MASTERY_RULES.md` / `lib/dashboard-derivations.ts`);
- potentially Win the Week, if that feature is revisited once enough live content exists (see roadmap correction below).

**These experiences must not invent independent, competing definitions of "meaningful activity."**
Any future implementation should compute its score from this one model, not redefine what counts.

---

# Roadmap corrections (Sprint 1C-B)

## Focus Sessions / Pomodoro

Sprint 1C-A's audit classified Focus Sessions / Pomodoro as **"Do not build."** That classification
is corrected here.

**Settled direction: Later — only as an evidence-connected Focus Session, not a generic timer.**

A generic Pomodoro timer has no relationship to what a learner is actually doing and doesn't know
which curriculum skill it belongs to — that was the reasoning behind the original "do not build"
call, and it still holds for a *generic* timer. But a **Focus Session** that is genuinely connected
to the rest of the product is a different feature:

```
goal
→ skill / Review / Practice session
→ optional timer
→ genuine resulting evidence
```

Potential timer modes for such a session (not decided, only noted as options for later): 25/5, 45/10,
60/10, custom. **Not built now.** This is a documentation-only roadmap correction — the distinction
that matters is *generic timer (do not build)* vs. *evidence-connected Focus Session (later, once
there is a natural point in the roadmap for it)*.

## Win the Week

**Remains deferred.** The Sprint 1C-A audit's reasoning is reaffirmed, not revisited: with only 42
questions across 2 live skills, forcing four meaningful study days every week risks incentivising
repetition rather than learning. If Win the Week is ever built, it must be scored from the activity
model defined above — not a separate, independently-invented definition of a "good day."

## Full specification tracker

Not built in Sprint 1C-B. The audit's finding that the underlying data layer (all 49 canonical
skills already exist as real registry objects, per-skill progress and Review-due state are already
derivable for the live ones) is largely ready **stands and is preserved** for a future learner-experience
sprint. Sprint 1C-B's only related change is the simple `N of 49 skills available` coverage framing,
now live on the Dashboard and the Higher Maths Hub.

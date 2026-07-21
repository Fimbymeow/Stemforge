# Product Excellence Sprint P3 - One Clear Next Action

## Previous continuation inconsistencies

Before Sprint P3, the dashboard, Higher Maths hub, path sidebar, stage cards, question workspace, completion panel, practice summary and question bank each made separate continuation decisions. A new learner could see `Start path`, `Continue`, `Start Foundations` and `Open` for the same first question. Completed and review states also diverged between surfaces, active practice sessions were ignored outside Practice, and every stage looked equally recommended despite the stated learning order.

## Shared recommendation contract

`lib/learning/next-action.ts` is the authoritative, deterministic domain contract. It accepts append-only progress evidence, canonical catalogue data and an optional pinned active practice session. It returns an explicit typed action containing:

- action kind and learner intent;
- destination, label, title and concise reason;
- canonical subject, course, path, stage, question and question-version identities where applicable;
- a practice-session identity when resuming or retrying a session.

The contract does not read browser globals, account state or remote state. A small client hook supplies already-available local evidence and validated practice-session state to UI surfaces. Guest and signed-in learners therefore receive the same core recommendation from equivalent merged evidence.

## Recommendation priority

1. Resume a valid, active, version-pinned practice session.
2. Resume the most recently evidenced current-version question that remains incomplete.
3. Continue the next incomplete question in the most recently active available path.
4. Begin the next stage after the preceding stage is complete.
5. Review a genuinely review-eligible or conservatively reassessment-eligible question.
6. Start the first question of the first available path when there is no progress.
7. Offer existing targeted practice when all available guided content is complete and no review is due.
8. Return an explicit unavailable result when no safe catalogue destination exists.

This order protects unfinished work, follows the guided sequence, avoids inferring weakness from no evidence and never recommends locked inventory. Current-version identity is required before an earlier event can be treated as resumable. Older or unknown evidence remains respected through the existing conservative reassessment rules.

## Stage-sequencing decision

Stage order remains strongly recommended but is not hard-gated. The next recommended stage receives a visible `Recommended next` marker. Its detailed stage link and the links for later stages remain available as subordinate `View`, `Explore` or `Review` actions. This supports revision, tutor-directed navigation and direct links without presenting later stages as the best next step.

## Dashboard changes

The dashboard's first card now centres on the shared action, a student-facing reason and one dominant link. The three analytical tiles that competed inside that card were removed because their progress data is already available below. A learner with no activity sees the primary action and optional quick links rather than five analytical empty states. Once learning activity exists, course, recent, weekly, support and mastery information returns below the primary action. The per-path duplicate Start/Resume button is then a subordinate `View path` link.

## Surfaces using the shared result

- Dashboard primary action.
- Subjects entry for the available Higher Maths experience.
- Higher Maths hub guided-path action.
- Basic Differentiation path recommendation and recommended-stage treatment.
- Question workspace after a question becomes navigation-eligible.
- Path completion and permanent completed-path panels.
- Practice summary, while preserving exact-session retry.
- Higher Maths question-bank selected-path action.
- Authenticated Account return-to-learning action.

Optional Question Bank, Practice, resources and stage exploration remain available but visually subordinate. Practice-session questions no longer show the separate guided-path Previous/Next row, leaving the session controls authoritative.

## Edge-case behaviour

- New guest and new signed-in learner: `Start learning` at the first valid question.
- Opened without interaction: no durable state exists, so the product does not fabricate a `Resume` claim.
- Incorrect answer or recorded hint: resume that exact current-version unfinished question.
- Worked solution: completion remains honest; unfinished guided content continues before later review.
- Completed question: continue the next incomplete question.
- Completed stage: begin the next stage.
- Completed path with review due: review the first deterministic eligible question.
- Completed path without review due: use existing Practice.
- Active exact or ordinary practice session: resume only when its pinned reference still resolves exactly.
- Older or unknown versions: use existing conservative reassessment semantics; never silently substitute an old pin.
- Merged local and remote evidence: derive from the merged local evidence already available to the learner runtime.
- Removed, locked, malformed or empty catalogue destinations: skip unsafe candidates or return `none` without throwing.

## Testing evidence

Focused unit coverage exercises new learners, incomplete questions, hint-only activity, worked-solution completion, deterministic continuation, stage advancement, review, completed-path practice, pinned-version changes, active sessions, exact-session retry and invalid catalogues. Focused browser coverage verifies equivalent CTAs across the dashboard, Subjects, hub, path and question bank; one-click question entry; stage progression; soft exploration; active-session resumption; completed paths; keyboard operation; mobile layout; completion behavior and exact-session retry.

Final verification passed with 12/12 focused recommendation tests, 5/5 dashboard derivation tests, 22/22 combined continuation/completion/practice browser tests, 6/6 dedicated cross-surface next-action tests and 9/9 focused regression tests after the hydration correction. The complete safe gate returned exit code 0: 282/282 unit and integration tests across 24 groups, 71/71 ordinary browser tests, 3/3 hardening browser projects and 1/1 auth-enabled rendering test. Typecheck, lint, content validation and the production build also passed; content validation retained its single known warning for the 15 legacy Higher Physics questions.

## Explicitly deferred Product Excellence work

Global navigation, mobile bottom navigation, broad copy cleanup, celebration redesign, new achievements, streaks, rewards, adaptive keypad work, worked-solution changes, answer diagnostics, answer-draft persistence, account/import/sync redesign, new resources or content, premium, payments, AI, analytics, notifications, beta recruitment and prefetching remain outside Sprint P3.

## Remaining product questions

Opening a question without submitting or using support creates no durable learning activity. Sprint P3 deliberately does not add route history or answer-draft storage, so that state cannot be distinguished from a new learner after leaving the page. A later draft-persistence sprint may revisit this, but the current recommendation remains conservative and truthful.

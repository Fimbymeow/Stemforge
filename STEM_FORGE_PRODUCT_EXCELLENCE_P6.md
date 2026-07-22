# STEM Forge Product Excellence — Sprint P6 (Progression and Motivational Rhythm)

Sprint P6 began from clean commit `5574c3c` (`Complete Sprint P5 student-facing clarity`). Scope: make genuine learning milestones feel acknowledged — stage completion, path completion, Secure/Mastered transitions, review reasons — without introducing gamification, and without changing any marking, progress, mastery, achievement, sync, import, or next-action semantics.

## 1. Initial emotional-rhythm audit

The underlying data model was already far more capable than the presentation layer used. Achievement snapshots (`stage_completed`/`stage_secure`/`stage_mastered`/`path_completed`/`path_secure`/`path_mastered`, each carrying mastery score and independent-performance percentage, deduplicated by `(kind, pathId, pathVersion, stageId, stageVersion)`) were already generated correctly on every genuine tier crossing. The gap was entirely presentational:

- **Stage completion had no UI moment at all.** A stage reaching 100% silently filled a progress bar. No analogue of the path-completion panel existed, despite `stage_completed`/`stage_secure`/`stage_mastered` snapshots already being recorded.
- **Path completion was silently suppressed during practice sessions.** `PathCompletionPanel` explicitly never renders when a `sessionPanel` is present — and, critically, the one-time claim (`recordPathCelebrated`) was still being made in that state, meaning a learner who completed the whole path via a practice session got *no* acknowledgement at all, ever, because the one-time claim was silently burned before anything could show it.
- **A 100%-correct practice session read identically to a 40%-correct one** — six equal-weight stat boxes regardless of outcome quality.
- **Dashboard accomplishments used generic labels** ("Stage Completed", "Path Secure" via naive title-casing of the snapshot `kind`) instead of the specific stage/path name, and there was no "first full path completed" framing despite that being directly provable from existing data (exactly one `path_completed` snapshot in evidence).
- **Review recommendations never said why**, per question. The deterministic triggers (solution use, hint-assisted correctness, a stronger historical result followed by a latest incorrect attempt, uncertain legacy completion) exist in `QuestionProgressState` (`bestOutcome`, `latestResult`, `completed`) but nothing surfaced the specific reason.
- Level 0/1 answer feedback (`lib/questions/answer-feedback.ts` plus `QuestionWorkspace`'s in-context overrides) was already well-calibrated — softened language for hint-assisted correctness, no motion, `aria-live="polite"` — and needed no changes; it served as the tone reference for everything else.
- The existing Secure/Mastered upgrade banner (`MasteryUpgradeBanner`) is visually smaller than the one-time path-completion panel. This was evaluated and kept as-is: a repeatable tier upgrade should read quieter than the singular "you finished everything" moment, not louder.

## 2. Acknowledgement hierarchy

| Level | Moment | Treatment |
|---|---|---|
| 0 | Navigating, typing, opening a question, starting a session | Nothing — unchanged |
| 1 | Correct answer, correct-with-hint, guided self-check | Existing calm inline feedback — unchanged |
| 2 | Fully-correct practice session | New: one quiet line, no modal, no new stat boxes |
| 2 | Review-recommended question | New: one grounded sentence explaining why, shown once per visit before submission |
| 3 | Stage completion | New `StageCompletionPanel` — same information shape as path completion (badge, heading, supporting sentence, two stats, one dominant action, one secondary), deliberately smaller mark (a plain check in a soft-fill circle, not the animated ring) |
| 4 | Path completion | Existing `PathCompletionPanel`, unchanged visually; fixed to also fire from practice sessions; specific "first full path" framing added to its dashboard/recent-activity representation |
| 5 | Secure/Mastered transition | Existing `MasteryUpgradeBanner`, unchanged — kept deliberately quieter than Level 4 |

## 3. Moments deliberately kept quiet

- Opening a question, typing, navigating, starting a practice session — no change, per principle 1/2/8.
- The first correct answer a learner ever gives — no special first-question treatment was added. Per the sprint's own preferred direction, stage completion (Level 3) is the first prominent milestone a new learner reaches; adding a first-question moment would be noise before real learning has accumulated.
- A stage that completes in the same submission that also completes the whole path: the stage's one-time claim is deliberately *not* made in that case (see §11) so only the stronger Level 4 acknowledgement shows — never two stacked panels for one submission.
- A stage or path completed inside a practice session's `sessionPanel` context: the transient panel never renders there (session controls stay authoritative, per P3), and — for path completion — the claim is now deferred to the practice summary (§9) rather than silently burned.

## 4. Stage-completion experience

`components/learning/stage-completion-panel.tsx` (new) — `StageCompletionPanel`, triggered from a new before/after ref (`wasStageCompleteRef`) in `QuestionWorkspace` mirroring the existing path-completion trigger exactly: captured on question mount, compared after each progress update, fires only on the exact submission where a stage crosses incomplete → complete.

Content shown (two stats, chosen per the brief's "most useful two or three," reusing exactly what the path panel already shows for consistency): `{completed} / {total} completed` and first-attempt accuracy (or "Not enough data"). Heading: `"{stage name} {complete|secure|mastered}"`, e.g. *"Foundations complete"* / *"Foundations secure"* / *"Foundations mastered"*. Supporting sentence (`getStageCompletionSupportingSentence`) mirrors the path panel's logic: review count takes priority if any exist, then secure/mastered/complete framing — *"You completed this stage and showed strong understanding"* / *"...with strong independent performance"* / *"You worked through every question in this stage."* One dominant action from the canonical P3 `nextAction` (typically "Begin {next stage}"), one secondary "View path" link. Support use is never diminished — the same calibrated language as path completion applies (hint/solution use described honestly, never framed as failure).

Visually subordinate to path completion by design: a plain check mark in a soft-fill circle (`size-9`) instead of the animated stroke-fill ring + check-pop used for path completion, and no page-level "permanent" card equivalent — stage status is instead visible ambiently via the existing per-stage progress rows.

## 5. Path-completion experience

No visual changes to `PathCompletionPanel`, `CompletedPathCard`, `MasteryUpgradeBanner`, or `mastery-badge.tsx` — Deliverable 3 was an audit-and-strengthen brief, and the existing implementation already met the bar (specific to Basic Differentiation by construction, real statistics, no invented percentage grades, no confetti, no locked-content promotion).

Two real fixes:
1. **Practice-session suppression bug.** `QuestionWorkspace`'s path-completion effect now only calls `recordPathCelebrated` when `!sessionPanel` — previously it claimed the one-time acknowledgement regardless of whether the panel could render, silently burning it whenever the completing submission happened inside a practice session. The same fix was applied to the new stage-completion effect for the same reason.
2. **"First full path completed" framing**, provable from existing data (`earliestPathCompletionSnapshotId` — the chronologically-first `path_completed` snapshot in evidence) — see §6.

## 6. Accomplishment language

`lib/dashboard-derivations.ts`'s `achievementTitle()` was rewritten from naive kind title-casing (`"Stage Completed"`, `"Path Secure"`) to specific, named language:

- `stage_completed` → `"{stage name} completed"`
- `stage_secure` → `"{stage name} is now Secure"`
- `stage_mastered` → `"{stage name} is now Mastered"`
- `path_completed` → `"Completed your first full learning path"` (only for the chronologically-earliest `path_completed` snapshot in evidence; later ones read `"{path name} completed"`)
- `path_secure` → `"{path name} is now Secure"`
- `path_mastered` → `"{path name} is now Mastered"`

The dashboard's "Secure and mastered" *current*-path items were also reworded from `"{name} secure"` to `"{name} is now Secure"` so the same status never reads two different ways depending on whether it's a live path or a historical snapshot. Stage names are resolved via a new `getStageName(pathId, stageId)` helper against the real canonical content, with a safe `"This stage"` fallback if a stage can no longer be resolved (renamed/archived content).

No badge rarity tiers, no bronze/silver/gold, no locked-achievement grids were added — this is a wording change to the existing Recent Activity feed and Secure/Mastered list, not a new system.

## 7. Independent vs. supported language

Unchanged from P4/P5 — the existing calibration (`"Correct with support"`, *"Using support is a normal part of learning — answering on your own next time is even stronger practice for the exam"*) was already correct and was reused as the tone reference for the new stage-completion supporting sentence, which uses the identical secure/mastered/completed framing as the path panel.

## 8. Secure/Mastered transition handling

No changes to `MasteryUpgradeBanner`, `isAcknowledgedStatusUpgrade`, or the upward-only acknowledgement rule. Confirmed (both by reading and by live testing) that a direct jump to Mastered in one submission still correctly records — and now correctly *names* — all three crossed tiers (Completed, Secure, Mastered) as three distinct Recent Activity entries, not one collapsed entry.

## 9. Weekly-learning and dashboard changes

No structural dashboard redesign. The "Milestones" weekly count and section ordering (Best next step → Course progress → Recent activity → Weekly activity → Needs work → Secure and mastered → Quick links) are unchanged — they already matched the required hierarchy (one next action, current progress, recent accomplishment, review, supporting history) from P3/P5. The only change in this area is that Recent Activity's achievement rows now carry specific titles (§6) instead of generic ones; no new empty-state, streak, or heatmap logic was added, per the explicit "do not add a streak counter" / "do not add calendar heatmaps" constraints.

## 10. Review-reason language

New `lib/questions/review-reason.ts` — `deriveReviewReason()` / `describeReviewReason()`, a pure function over `QuestionProgressState`'s existing `completed`/`bestOutcome`/`latestResult` fields (no new data, no inference beyond what's already recorded):

| Signal | Reason shown |
|---|---|
| Not completed | "This question has not yet been completed." |
| `bestOutcome === "completed_with_solution"` | "You used a worked solution, so another attempt would strengthen your understanding." |
| `bestOutcome === "correct_with_hint"` | "You completed this with a hint. Try it again independently when you are ready." |
| `bestOutcome` is a legacy kind | "We can't confirm how this was originally completed, so a fresh attempt would confirm your understanding." |
| `latestResult === false` (stronger historical result followed by a latest incorrect attempt) | "You answered this incorrectly most recently." |
| Otherwise | "This question is ready for another attempt to build confidence." |

Surfaced once, quietly, on the question workspace directly under the question title when `questionProgress.reviewRecommended && !submitted` — deliberately not shown after a fresh submission, where the new feedback should have full attention. Never infers ability, effort, or mental state — the unit tests explicitly assert the text never matches "weak," "falling behind," "diagnos-," or "does not understand" across every `(bestOutcome, completed, latestResult)` combination. The dashboard's existing path-level "Needs work" aggregate (count-based, e.g. *"2 questions to review"*) was left as-is — it operates at a different, appropriately coarser grain than the new per-question reason, and the two don't contradict each other.

## 11. One-time and repeat behaviour

Stage-level celebration reuses the exact path-celebration machinery rather than duplicating it: `LocalStorageCelebrationStorage` in `lib/completion-tracking.ts` was generalized to accept a `storageKey` constructor parameter (default unchanged, so all existing path-celebration behavior and tests are untouched), and a new `stemforge.stageCelebration.v1` key stores stage entries under a composite `${skillPathId}:${stageId}` id (stage ids are not globally unique across paths). New wrapper functions `getStageCelebration`/`recordStageCelebrated`/`acknowledgeStageStatus`/`clearStageCelebration` mirror the path-level ones exactly, inheriting the same versioned-payload, legacy-migration, malformed-data-repair, and unsupported-future-version handling for free.

Constraints satisfied:
- **No duplicate celebration for one event.** When a submission completes both a stage and the whole path, the stage claim is skipped entirely (not claimed, not shown) — only the path panel fires. The claim being skipped (not silently consumed) means a stage that somehow later needed re-acknowledging still could, though in practice this state can't recur once a stage's questions are all complete.
- **Import/sync cannot create a false "new" celebration.** Both the path and stage transient panels are triggered by a client-side React ref comparing before/after state across `QuestionWorkspace` mounts during a live question submission — not by the mere presence of an achievement snapshot or a `source` field. An import or sync event that instantaneously brings in already-complete progress does not go through a question submission, so it cannot trigger either transient panel. The permanent, non-celebratory surfaces (`CompletedPathCard`, dashboard Recent Activity, Secure/Mastered list) correctly reflect the resulting state regardless, with no "just happened" framing.
- **Revisiting a completed stage or path does not replay the moment.** Confirmed live and in `e2e/stage-and-accomplishment-experience.spec.ts`.
- **Reset clears stage celebrations too.** `local-skill-path-progress.tsx`'s `handleReset` now also calls `clearStageCelebration` for every stage in the path (previously only cleared the path-level celebration), so a genuine future re-completion of a reset path can be acknowledged again at both levels, consistent with the existing path-reset contract.
- **Celebration state was not uploaded anywhere.** No remote acknowledgement system was created; `stemforge.stageCelebration.v1` is browser-local exactly like `stemforge.pathCelebration.v1`.

## 12. Practice-summary changes

`components/practice/practice-session.tsx`'s `PracticeSummaryCard`:
- On first render of a completed session, checks each path referenced by the session (`summary.pathIds`) for genuine completion and attempts the one-time claim via the same `recordPathCelebrated` used elsewhere; only paths where that claim succeeds (`"recorded"`) get an acknowledgement block, so a path that was already celebrated (e.g. via a different browser tab) is never re-announced.
- When claimed, renders the same badge/heading/supporting-sentence language as `PathCompletionPanel`/`CompletedPathCard` (via the shared `getPathCompletionSupportingSentence`), reusing components rather than duplicating copy.
- A session with zero incorrect answers and no just-completed path shows one quiet line: *"Every question in this session was answered correctly."* — no letter grade, no rank, no mastery claim invented beyond what the session actually proved.
- Exact-session retry (P2) and active-session priority (P3) semantics are untouched; only the summary's presentation changed.

## 13. Historical import/sync behaviour

Not exercised live this session (no test Supabase session available in this environment, matching the same limitation noted in P5), but verified by construction: both the stage and path transient-panel triggers require a live `QuestionWorkspace` submission to fire (see §11) — an import or sync event alone cannot produce one. Achievement snapshots created by import/merge remain governed entirely by the pre-existing structural-achievement layer (`lib/progress/achievements.ts`), which this sprint did not touch.

## 14. Test evidence

New/updated unit coverage:
- `tests/completion-tracking.test.ts` — 4 new tests for the generalized `storageKey` parameter and stage-celebration wrapper functions (separate storage key, composite-id isolation across paths, upgrade/idempotency rules mirrored, safe "unavailable" behavior outside a browser). All pre-existing path-celebration tests pass unmodified.
- `tests/dashboard-derivations.test.ts` — 2 new tests: specific stage/path accomplishment titles (asserting the *absence* of the old generic `/^(Stage|Path) (Completed|Secure|Mastered)$/` pattern), and first-vs-later "full path completed" framing.
- `tests/review-reason.test.ts` (new) — 7 tests covering every `(bestOutcome, completed, latestResult)` branch, including an exhaustive sweep asserting the text never infers ability/effort/mental state.
- `e2e/stage-and-accomplishment-experience.spec.ts` (new) — 8 browser tests: stage completion without path completion (one-time, no replay on revisit), path-completion precedence when both cross in one submission, path completion acknowledged via a practice session, fully-correct practice session acknowledgement, review-reason wording live, reduced-motion/keyboard behavior on the stage panel, mobile layout with no overflow, and the dashboard's specific accomplishment language.

Commands run:
```
pnpm run typecheck        # pass
pnpm run lint              # pass
pnpm run validate-content  # pass, 0 errors, 1 expected legacy-Physics warning (unchanged baseline)
pnpm test                  # pass, 26 groups, 0 failures (was 25 in P5; added test:review-reason)
pnpm run build              # pass, 35 routes
pnpm run test:e2e:ordinary  # pass, 87/87 (was 79; added 8 new tests, 0 regressions)
git diff --check            # clean (only pre-existing LF/CRLF warnings, no real whitespace errors)
```

## 15. Desktop, mobile, keyboard, reduced-motion, accessibility validation

Live-verified via a local dev server (in addition to the automated suites above): a fresh learner completing questions 1–3 of Foundations sees quiet Level 1 feedback on the first two and the new `StageCompletionPanel` ("Foundations mastered", correct stats, "Begin Applications" / "View path") on the third; the dashboard's Recent Activity immediately shows the three specific tier-crossing lines ("Foundations is now Mastered", "Foundations completed", "Foundations is now Secure") instead of generic labels; a hint-assisted question shows the grounded review-reason line on revisit; mobile viewport (390×844) shows no horizontal overflow on the dashboard; no console or page errors were observed. Reduced-motion and keyboard-focus behavior for the new stage panel were verified in the automated e2e suite (`role="status"`, `aria-live="polite"`, focusable primary action, `prefers-reduced-motion` respected) rather than re-verified manually, since Playwright's `emulateMedia` coverage is equivalent to and more repeatable than manual inspection.

## 16. Residual limitations

- Import/sync-triggered stage or path completion was verified by construction (transient panels require a live submission to fire) but not exercised against a real authenticated sync session in this environment.
- The "first full path completed" framing only distinguishes the chronologically-earliest `path_completed` snapshot; if a learner somehow has two snapshots with an identical `achievedAt` timestamp (not possible through normal use, since each snapshot's identity is tied to a distinct submission), the tie-break falls to snapshot array order, which is stable but arbitrary.
- The dashboard's per-path "Needs work" detail remains an aggregate count (`"N questions to review"`); it does not individually enumerate each question's specific reason inline — that level of detail is reserved for the question workspace itself, reached via the existing review action.

## 17. Explicitly deferred work

Per the sprint's out-of-scope list: no streaks, XP, points, coins, levels, leaderboards, social comparison, sharing cards, certificates, badges-by-threshold, sound effects, or mascot animation were added or considered. No dashboard structural redesign, no question-workspace redesign beyond the two additive JSX blocks (review-reason line, stage-completion-panel branch), no new content, no account/import/sync logic changes, no analytics.

# STEM Forge — Scalable Question Bank and Custom Practice (Sprint C)

## Baseline

- Branch: `main`
- Baseline: `0982107` (`Complete Higher Maths course architecture sprint`)
- Sprint B taxonomy and placeholder contracts remain unchanged.

## Product and information architecture

The previous bank combined a recommendation panel, large cards and a limited stage/status filter. It was usable for eight questions but would not support deliberate selection across a large course.

The redesigned bank opens directly into:

1. a compact truthful availability header;
2. published-content filters;
3. grouped compact question rows;
4. stable pagination;
5. a persistent selection summary;
6. review selection;
7. custom practice creation.

The Dashboard and course surfaces retain recommendations. The Question Bank no longer duplicates them.

## Filters and status

Active CourseArea, SpecArea, SkillPath and Stage options are derived from canonical published questions. Placeholder and zero-question nodes cannot enter active controls. Parent changes preserve compatible children and clear invalid descendants. Search, existing question-progress status and canonical sorting compose without navigation or evidence changes.

Statuses remain the existing evidence-derived `Not attempted`, `In progress`, `Needs review` and `Completed` states. No mastery or review calculation changed.

## Results, grouping and pagination

Rows contain a meaningful selection checkbox, canonical position, marks, status, title, compact maths-safe prompt and direct deep link. Results group by SkillPath then Stage. Stage selection and filtered selection use precise language and canonical IDs.

Pagination uses 24 rows per page, preserves selection across pages and stays hidden for the current eight-question dataset. A deterministic test-only 500-question fixture proves filtering, selection and page derivation without adding production content.

## Selection and custom practice

Selections:

- use canonical question IDs;
- are deduplicated;
- remain selected when hidden by filters or pagination;
- support individual, Stage and all-filtered operations;
- can be reviewed, individually removed or cleared.

Session creation resolves IDs against current eligible published content, removes invalid or unavailable IDs, refuses an empty session and uses canonical curriculum order. Existing versioned question references, local-first storage, marking, navigation, reporting, evidence and refresh persistence are reused.

An existing active session is never overwritten silently. The learner may resume it, cancel, or explicitly replace it. Replacement marks the previous session abandoned without deleting its recorded progress.

Custom sessions provide a clear Question Bank return route during practice and from the summary. Direct question links do not create sessions.

## Accessibility and responsive behavior

- One main landmark and labelled grouped sections.
- Meaningful checkbox labels such as `Select Basic differentiation, Foundations, Question 1`.
- Keyboard filtering, checkbox selection and direct access.
- Review dialog labelling, initial close focus, Escape close and background dismissal.
- Explicit active-session confirmation dialog.
- Text status in addition to colour.
- Existing minimum touch-target sizing.
- No document overflow at 1440×900, 1024×768, 720×450 (200% zoom equivalent), 390×844, 360×800 or 320×568.
- Mobile filters collapse into the native disclosure and the sticky selection summary remains reachable without covering the final result.

## Future coverage

Planned curriculum remains a separate collapsed broad-area disclosure. The 50 placeholders cannot be filtered, selected or counted as available questions.

## Verification

- Focused Question Bank unit/integration: 13/13 passed.
- New Sprint C unit tests: 6/6 passed.
- 500-question fixture: 500 filtered and selected; first page contained 24; derivation completed well inside the 1-second guard.
- Full unit/integration gate: 335 passed.
- Focused Sprint C Chromium journeys: all 6 passed, including active-session replacement confirmation.
- Full ordinary Playwright gate: 121/121 passed after the five initial Sprint C scenarios were added; the additional active-session scenario passed focused verification.
- Auth-enabled navigation/hydration: 5/5 passed.
- P7 hardening: Firefox 1/1, Chromium 1/1 and WebKit 1/1 passed.
- TypeScript, ESLint, content validation and production build: passed.
- Content validation: zero errors and the expected retained Higher Physics legacy warning.
- Required Sprint B taxonomy suite: 14/14 passed within the full unit gate.

The local runtime is Node 24 while the repository requests Node 22.x; this remains an environment warning only.

## Files

Created:

- `lib/question-bank-selection.ts`
- `lib/practice/custom-practice.ts`
- `tests/scalable-question-bank.test.ts`
- `e2e/scalable-question-bank.spec.ts`
- this report

Modified:

- `components/higher-maths-question-bank.tsx`
- `components/practice/practice-session.tsx`
- `lib/question-bank-query.ts`
- `lib/practice/practice-types.ts`
- `package.json`
- existing Question Bank browser assertions whose prior recommendation/large-list expectations were intentionally replaced by Sprint C.

Deleted: none.

## Deferred work and residual risks

Deferred: saved named sets, public sharing, URL-encoded selection, analytics, infinite scroll, virtualisation, new content and all premium/AI/teacher features.

The existing practice store now permits up to 500 references so a filtered custom set is not silently truncated. Production UI setup defaults and existing practice modes are otherwise unchanged. Real learner evidence should determine whether a lower explicit custom-session limit is desirable later.

No commit or push has been performed. Recommended commit message:

`Complete Sprint C scalable Question Bank and custom practice`

# Workbench Core with Contextual Shortcuts (subsequent redesign)

This section documents the redesign that followed Sprint C and supersedes it wherever the two disagree. Sprint C made the Bank scalable for Higher Maths; this pass made it subject-generic, URL-shareable and added two capped contextual shortcuts, while keeping every Sprint C contract (canonical selection, custom-session creation, fail-closed eligibility, evidence-derived status) unchanged.

## Final product boundary

The Bank remains a direct question-browsing and custom-set-building workspace: open into results, optionally narrow by a Working Context scope or a review-due shortcut, search or filter, inspect compact rows, open one question or select several, review the selection, start a version-pinned custom Practice Session. It is deliberately not a goal-selection screen, a Dashboard-style recommendation surface, or a taxonomy tree, and it does not filter by difficulty or marks range.

## Subject-generic route and query scope contract

- `app/subjects/[subjectSlug]/question-bank/page.tsx` is the sole route for every subject's Question Bank; it resolves and validates `subjectSlug` via `getSubjectBySlug` and calls `notFound()` for unknown subjects, matching the convention already used by `app/subjects/[subjectSlug]/[courseAreaSlug]/page.tsx`. The former static `app/subjects/higher-maths/question-bank/page.tsx` was deleted (not redirected) so the dynamic route owns the unchanged public Higher Maths URL.
- `components/question-bank.tsx` exports `QuestionBank({ subjectSlug })`; no subject name, filter option, review count or empty-state copy is hardcoded — all of it is derived from the resolved subject.
- `lib/question-bank-query.ts`'s `AvailableQuestionBankQuery` extends `QuestionBankQuery` with a required `subjectSlug: string`. `queryAvailableQuestionBankQuestions` checks `context.subject.subjectSlug !== query.subjectSlug` before any course/spec/path/stage/status/type/calculator filtering, so subject isolation cannot be bypassed by filter combination. `deriveQuestionBankFilterOptions` needs no subject parameter of its own — it only ever sees the already subject-scoped entry list it is given.
- Cross-subject isolation is covered by a dedicated two-subject test fixture (`createTwoSubjectFixture`/`subjectTwoFixtureIds` in `tests/fixtures/multi-path-content.ts`), proving neither questions nor filter options leak between two simultaneously available subjects.

## URL-state contract

`lib/question-bank-url.ts` is the single parser/serializer for shareable browsing state. Canonical parameters: `course`, `spec`, `path`, `stage`, `status`, `type`, `calc`, `sort`, `page`. Defaults are omitted from the URL; invalid enum/page values are discarded back to their default; `QuestionBank` additionally runs `normalizeQuestionBankFilters` against the live, subject-scoped options every render and writes any corrected (cascade-invalidated or out-of-range-page) result back as the canonical URL via `router.replace`, so a stale or cross-subject `path` value is silently repaired rather than left dangling. Selected question IDs, active Practice Session state, row expansion, mobile-sheet open state and the search box's live text are never URL-encoded; search is applied to the query only after a short debounce. Material filter/sort/page changes use `router.push` (so Back/Forward walk through prior browsing states); only involuntary corrections use `router.replace`. Because two rapid filter changes could otherwise each read a stale closed-over URL snapshot and clobber one another, the component tracks the URL state it last wrote in a ref and builds every new change on top of that ref rather than on last render's props.

## Row-preview strategy

Collapsed rows never mount `MathContent`. `lib/question-bank-preview.ts` produces a deterministic, non-rendering plain-text excerpt: it strips `$...$`/`$$...$$`/`\(...\)`/`\[...\]` delimiters, converts common LaTeX (`\frac`, `\sqrt`, symbols) into readable approximations, strips Markdown decoration, collapses whitespace, truncates at a word boundary (or hard-truncates a single overlong word) with an ellipsis at ~72 characters, and falls back to the question title — or, when the question is a visual type with no usable text, to a type-aware message ("Graph question — open to preview.", "Table question — open to preview."). Expansion is a native button with `aria-expanded`/`aria-controls`; only one row expands at a time; `MathContent` and the full safe prompt render only inside the expanded panel.

## Visual-question browsing behaviour

`AnswerType` currently has no dedicated point-plotting/graph-construction/derived-graph/diagram-only variants — only `graph_structured` and `nature_table` are visual. The label map (`ANSWER_TYPE_LABELS` in `components/question-bank.tsx`) is a `Record<AnswerType, string>`, so it fails to compile the day a new type is added until that type is given a label; it does not claim types that do not exist in the runtime type system. No graph editor, plotting tool, answer input or nature-table control ever mounts in the Bank; an expanded visual-type row shows the safe prompt plus a message that the interactive response opens on the question page.

## Group-selection semantics

Selecting a group targets every question in that skill-path/stage group that matches the current filters, across every pagination page — not just the page currently on screen. Eligibility is fail-closed via the existing `checkPracticeEligibility`; the group checkbox only ever selects/deselects the eligible subset and is rendered tri-state (checked only when every eligible member is selected, indeterminate when some but not all are). Its accessible label reports the live scope and count, e.g. "Select all 3 matching Foundations questions" / "Deselect all 3 matching Foundations questions", and an honest inline note appears when some group members are currently ineligible. Selection itself stays in local component state (never URL-encoded) keyed by question ID against the full, unfiltered subject entry list, so hidden/filtered-out selections and their total marks are never lost when filters change.

## Contextual shortcut cap

At most two contextual affordances render, both in normal document flow above the result list (never replacing it): a Working Context scope chip ("Scoped to {skill path}" / "Browse all {subject}", driven by the same `path` URL parameter used for ordinary browsing — no separate `workingContextPath` parameter was introduced) and a subject-scoped review-due shortcut ("Review N questions due", using the shared `formatReviewDueLabel` and counting only eligible, subject-scoped `reviewRecommended` questions). Activating the shortcut opens a lightweight confirmation showing the exact eligible count, the affected skill paths/stages, and a truthful note if any due question is currently ineligible; "Start review practice" creates a session through the existing `createCustomPracticeSession` contract and reuses the existing `ActiveSessionConflict` dialog rather than stacking a second one.

## Fixed-UI layout contract

Four separately-scoped CSS custom properties (`--global-bottom-inset`, `--feedback-dock-height`, `--question-bank-selection-height`, `--fixed-ui-gap`; defaults in `app/globals.css`) replace the previous single reused variable and the `page-container.tsx` `max-height` media-query hack. `AppShell` measures the feedback dock's real height with a `ResizeObserver` and writes `--feedback-dock-height`; `PageContainer`'s bottom padding is always `global-bottom-inset + feedback-dock-height + gap`. The Bank's selection tray is `fixed` (not `sticky`), positioned at `bottom: global-bottom-inset + feedback-dock-height + gap`, and reports its own measured height into `--question-bank-selection-height`, which the Bank's own content area then reserves as extra bottom padding while the tray is visible. No element uses its own height as its own offset. Verified at 1366×768 via `document.elementFromPoint` on the "Start selected practice" button centre (resolves to the button itself) and on the feedback trigger centre (also resolves to itself) with a selection active.

## Deferred work

Retry weak / weak-question filtering, difficulty filtering, marks-range filtering, selected question IDs in the URL, saved/named sets, public sharing, infinite scroll, virtualisation, evidence indexing, search indexing, a content-bundle architecture redesign, Exam Mode, and diagnostics are all explicitly out of scope for this pass.

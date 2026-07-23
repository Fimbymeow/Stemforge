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

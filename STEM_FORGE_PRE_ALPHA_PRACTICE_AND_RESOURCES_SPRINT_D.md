# STEM Forge Pre-Alpha Sprint D

Practice entry points, hero layouts and resource simplification.

## Baseline and scope

- Baseline: `2ac8f53` (`Complete Sprint C scalable Question Bank and custom practice`)
- Branch: `main`, aligned with `origin/main` at the start of the sprint.
- Scope: Dashboard and Higher Maths Learn/Practice presentation, the shared Practice chooser, student-facing subject-family resource capabilities, and the official Higher Maths assessment reference inside the question workspace.
- Excluded: new curriculum content, populated placeholders, changed question selection, progress/mastery/review changes, authentication/sync changes, Internal Alpha recruitment, premium, AI, teacher, analytics and payment work.

## Dashboard

The original Dashboard rendered the large recommended Higher Maths card and a separate full-width Quick Practice card in sequence.

The final Dashboard places the learning card and the shared Practice card in a responsive `3fr / minmax(240px, 1fr)` grid with a deliberate gap. Learn remains dominant. At 900px and below the cards stack in the same semantic and visual order: Learn, then Practice. The existing recommendation, compact progress, guest protection, Needs Work and secure/mastered evidence are unchanged.

## Higher Maths hub

The original hub rendered only the full-width guided learning card under Start here, with Question Bank presented as a separate secondary link.

The final hub uses the same shared Learn/Practice hierarchy and breakpoint as the Dashboard. The guided learning card retains all recommendation, completion and progress wording. CourseArea navigation, taxonomy, placeholder honesty and all existing course routes are unchanged.

## Unified Practice entry point

`Practice` is now the student-facing entry point on both heroes. It opens the same accessible chooser in both places:

1. **Quick Practice** - starts immediately using the unchanged deterministic Quick Practice generation and storage flow.
2. **Choose Questions** - opens the existing Sprint C Question Bank.

The chooser adds no new practice modes. It uses the shared modal focus trap, opens with focus on its close control, contains two primary mode choices, closes with Escape, traps keyboard focus while open and restores focus to the exact trigger. At mobile widths it becomes a bottom-aligned sheet without changing the options.

An existing active Quick Practice session is resumed rather than overwritten. Creating a custom Question Bank session while another session is active still uses Sprint C's explicit resume-or-replace confirmation.

## Subject-family resource capabilities

The canonical capability model is:

| Subject family | Student-facing capabilities |
| --- | --- |
| Mathematics | Notes, Practice |
| Science (Physics, Chemistry, Biology) | Notes, Flashcards, Practice |

Standalone Worked Examples and standalone Formula learning resources are not capability values. The model drives shared resource navigation/cards, is checked by content validation, and is covered with isolated mathematics and science fixtures.

Higher Maths therefore exposes only Notes and Practice. Unsupported Flashcards, Worked Examples and Formula resource cards are not rendered as disabled or zero-count UI.

## Existing teaching material

No useful authored material was deleted:

- the existing power-rule Formula Card is retained as a **Method reminder** inside Notes;
- the existing worked example is retained as a **Worked example** inside Notes;
- the existing Maths flashcard records remain in canonical content storage for a later deliberate content migration, but are not exposed to students because Mathematics does not support Flashcards.

Legacy Higher Maths Formula Cards, Worked Examples and Flashcards routes redirect to Notes. A safe active-practice `returnTo` value is preserved. Existing anchors for the migrated formula and worked-example records remain present on the Notes page, so useful deep links continue to reach the content.

## Official Higher Maths formula sheet

The verified source is the supplied official `Higher-Maths-Exam-Formulae-List.pdf`, visually inspected as a single-page assessment reference before implementation.

The assessment drawer contains only the five supplied sections:

- Circle;
- Scalar Product;
- Trigonometric formulae;
- Table of standard derivatives;
- Table of standard integrals.

It deliberately excludes the power rule, worked examples, hints, methods, shortcuts and memory prompts. Those remain teaching content in Notes, hints and worked solutions.

## Question workspace interaction

One visually quiet `Formula sheet` button appears in the Question support area for Higher Maths only. The same canonical QuestionWorkspace supplies it to:

- structured learning questions;
- Quick Practice;
- custom Question Bank practice;
- review sessions using that workspace.

It does not appear in the unrelated legacy Higher Physics question workspace.

On desktop the reference opens as a fixed 340px right-side overlay, scrolls independently and does not resize the question or cover the persistent page permanently. At medium and mobile widths it becomes a near-full-width bottom sheet with a clear close action and safe-area padding. The dialog has one accessible name, one trigger hit area, labelled sections and tables, Escape closure, focus containment and trigger-focus restoration.

## Accessibility and responsive evidence

Focused coverage verifies:

- keyboard-only Practice opening and mode selection;
- exact two-option chooser structure;
- visible 44px-or-larger chooser and close controls;
- Escape and focus restoration for both chooser and formula drawer;
- one Formula sheet control in each valid workspace;
- no formula control in the unrelated Physics workspace;
- semantic dialog naming, section headings and table headings;
- Learn before Practice when stacked;
- side-by-side Learn/Practice hierarchy at wide layouts;
- no document overflow at 1440x900, 1024x768, 720x450 (200% zoom equivalent), 390x844, 360x800 and 320x568;
- unchanged P7 navigation and no hydration or console errors.

## Backward compatibility

Unchanged:

- all eight published questions, IDs, versions and content revisions;
- CourseArea, SpecArea, SpecificationStrand, SkillPath and Stage identities;
- recommendation derivations;
- Quick Practice selection priorities and canonical order;
- Sprint C filters, selection, pagination and custom-session ordering;
- progress, review, mastery, achievements and evidence formats;
- local-first persistence, account ownership, import and sync;
- question marking, reporting and workspace evidence;
- Sprint B placeholder honesty.

Resource-to-question ownership records remain intact. Student-facing question support now links to Notes rather than presenting teaching Formula Cards or Worked Examples as separate resource categories.

## Files

Created:

- `components/learning/subject-resource-links.tsx`
- `components/practice/practice-entry-card.tsx`
- `components/questions/formula-sheet-drawer.tsx`
- `data/higher-maths-formula-sheet.ts`
- `lib/resource-capabilities.ts`
- `tests/practice-resources-sprint-d.test.ts`
- `e2e/practice-resources-sprint-d.spec.ts`
- this report

Modified:

- Dashboard and Higher Maths hub presentation;
- Higher Maths resource browser and four compatibility routes;
- generic resource redirect, topic roadmap and content validation;
- canonical and legacy question workspaces;
- focused Dashboard, resource, mobile and platform-hardening browser regressions;
- test script composition.

Deleted: none.

Generated `.next`, Playwright reports/results, temporary PDF renders and TypeScript build-info are not part of the Sprint D diff.

## Verification

Final results:

- Sprint D unit/integration tests: 4/4 passed;
- complete unit/integration gate: 339/339 passed;
- Sprint B taxonomy group: 14/14 passed;
- Sprint C Question Bank group: 13/13 passed;
- ordinary Playwright: 130/130 passed, including all eight final Sprint D browser scenarios;
- auth-enabled Playwright: 5/5 passed with no hydration, page or console errors;
- P7 cross-browser hardening: Firefox 1/1, Chromium 1/1 and WebKit 1/1 passed;
- type checking and ESLint passed;
- content validation: 0 errors and the one existing Higher Physics legacy-schema warning.
- production build passed.

During focused development, two retained browser tests used a non-exact `Power rule` locator after the teaching Formula Card moved inside Notes next to the existing `The power rule` note. Each gate stopped at that precise strict-locator failure. The locators were made exact without weakening their product assertions; the final complete gate then returned a genuine clean exit with no retries, sleeps, skipped tests or increased timeouts.

## Residual risks and deferred work

- Existing Maths flashcard data is intentionally retained but hidden. A later content-governance sprint should decide whether to archive it or migrate any useful prompts into Notes; this does not block the student-facing capability contract.
- The `/practice` setup page and underlying configurable/timed engine remain intact for backward compatibility. Sprint D changes the primary hero entry decision to Quick Practice or Choose Questions and does not rewrite the stable engine.
- Additional qualifications should add their own verified official reference source only when that course becomes learner-ready; no speculative cross-qualification framework was added.
- Internal Alpha recruitment and content population remain deferred.

## Commit readiness

No commit or push is part of Sprint D. After the complete gate, generated-artifact cleanup, secret scan and final diff review, the recommended future commit message is:

`Complete Sprint D practice entry points and resource simplification`

## Student-facing summary

Learn and Practice now sit together wherever you start Higher Maths. Practice lets you begin immediately or choose your own questions, Notes contain the learning explanations and examples in one place, and the official Higher Maths formula sheet is available beside every Higher Maths question when you need it.

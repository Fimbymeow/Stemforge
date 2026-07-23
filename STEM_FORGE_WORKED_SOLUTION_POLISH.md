# STEM Forge Worked-Solution Polish

## Scope and baseline

This focused post-Sprint D change starts from `main` at `8d9555b` (`Complete pre-alpha practice and resource simplification sprint`). It changes only the standard question feedback presentation and its focused tests. Marking, progress, mastery, review, practice-session, authentication, synchronization, ownership, and evidence rules are unchanged.

## Behaviour

Previously, opening a worked solution could leave an opened hint visible beside it, and standard question workspaces rendered a separate Common mistake card after the solution. Full-format solutions could also repeat an authored final answer in an additional generated Final answer block.

The final presentation state is:

| State | Hint control | Hint content | Worked-solution control | Worked solution |
| --- | --- | --- | --- | --- |
| Before either reveal | Shown when a hint exists | Hidden | Shown after the existing attempt gate | Hidden |
| Hint revealed | Hidden | Shown | Shown | Hidden |
| Worked solution revealed | Hidden | Hidden | Hidden | Shown |

A question without a hint has no hint container or control. Once a worked solution is visible, it is the sole support disclosure and the hint cannot be reopened.

## Data, persistence, and content

- Existing `commonMistake` fields remain in the question schemas and source content for backward compatibility and possible future targeted use. They are no longer rendered as a standard question-workspace card.
- Question IDs, versions, content revisions, hints, solutions, answers, and validation rules are unchanged.
- Existing hint-viewed and worked-solution-viewed evidence is still recorded under the same eligibility rules. Hiding an opened hint is presentation-only and does not erase its evidence.
- The existing persisted worked-solution evidence continues to restore the solution after reload. The shared presentation derivation makes the restored solution suppress both hint control and hint content.
- A separate Final answer block is omitted only when normalized authored solution content already ends with the same answer. This is a presentation-level de-duplication; mathematical solution text is not rewritten.

## Accessibility and responsive behaviour

Hint and worked-solution controls retain distinct accessible names. Removed hint UI is not hidden with CSS: it is absent from the DOM and accessibility tree once the solution is shown, so it cannot remain focusable. The revealed solution has a named region and the existing disclosure focus convention is preserved. Focus remains on the activated control's replacement context without aggressive scripted movement.

Focused browser coverage exercises mouse and keyboard disclosure, a long solution at a 320 px viewport, and geometric document-overflow checks. The change removes containers rather than leaving blank cards, dividers, or headings.

## Files and tests

Implementation:

- `components/questions/question-workspace.tsx`
- `components/questions/worked-solution-content.tsx`
- `components/question-page.tsx`
- `lib/questions/question-support.ts`
- `lib/questions/worked-solution.ts`

Focused coverage:

- `tests/question-interaction.test.ts`
- `e2e/worked-solution-polish.spec.ts`
- `e2e/question-interaction-excellence.spec.ts`
- `e2e/practice-resource-coherence.spec.ts`

The focused tests cover the full support-state matrix, no-hint questions, preserved legacy data and identity metadata, conservative final-answer de-duplication, structured learning, Quick Practice, custom Question Bank practice, reload restoration, unaffected formula/report controls, keyboard access, mobile layout, and absence of console, hydration, accessibility-tree, Common mistake, and document-overflow regressions.

The complete gate also exposed a pre-existing keyboard-test race: its Finish session keypress could run before the workspace's intentional feedback-focus effect had settled. The test now waits for that accessibility contract before moving focus to Finish session. This removes timing dependence without changing product code, adding retries, or weakening the journey.

## Verification

The complete `pnpm run test:all` gate returned exit code 0:

- TypeScript type check: passed.
- ESLint: passed.
- Content validation: passed with zero errors and one pre-existing legacy Physics warning.
- Unit/integration tests: 343 passed across 27 groups.
- Production build: passed, including all 35 static pages.
- Cross-browser hardening journey: 1 Firefox, 1 Chromium, and 1 WebKit test passed.
- Ordinary Playwright: 134 passed.
- Auth-enabled rendering Playwright: 5 passed.
- Focused question-interaction unit tests: 18 passed.
- Focused Chromium question workspace and adjacent-flow suite: passed.
- `git diff --check`: passed.
- Changed-file secret scan: passed with no credential material found.

The local test runtime used Node 24 and emitted the repository's existing engine warning because production declares Node 22. The build and every test phase nevertheless passed; production remains pinned by `package.json`.

## Backward compatibility and residual risk

Automated regression coverage confirms the underlying question data and identity metadata remain intact, while adjacent question-flow browser tests continue to pass. Formula-sheet, reporting, answer submission, Quick Practice, custom sessions, review evidence, progress, persistence, mobile navigation, and account rendering also remain green. The change uses the existing attempt and evidence state rather than introducing a second persistence mechanism.

Residual risk is limited to authored solutions whose visually equivalent final expression differs enough that conservative normalization cannot prove equality. In that case the separate Final answer remains visible; no explanation or answer is removed incorrectly.

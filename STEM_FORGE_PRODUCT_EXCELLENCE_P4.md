# STEM Forge Product Excellence — Sprint P4

## 1. Initial question-loop audit

Sprint P4 began from clean commit `05f5fe3` (`Complete Sprint P3 one clear next action`). The active Higher Maths workspace used one truthful deterministic marking path, but its interaction hierarchy placed a full breadcrumb and metadata card ahead of the mathematics. At 1280×720, the question heading began at 311 px and the answer input at 448 px.

Submission left focus on the document body, as did Retry and hint reveal. Empty answers were blocked, while every other non-empty text answer was reduced to accepted-string match or generic “Not quite”. The submitted value remained in the disabled field, but it was not explicitly framed for comparison and Retry erased the visible marked state. Refresh and navigation discarded unfinished input.

The existing progress boundary was sound: only `saveQuestionAttempt` creates an attempt; hints and solutions create typed support events; all evidence is question-version aware and append-only. P4 preserves that boundary.

## 2. Before and after workspace hierarchy

Before:

1. Global shell and account/sync controls.
2. Five-part breadcrumb.
3. Large subject, stage, source, skill, marks and path-progress card.
4. Practice-session panel where applicable.
5. Question title, prompt, answer and keypad.
6. Feedback.
7. Solution, navigation, progress and hint sidebar.

After:

1. Global shell and account/sync controls remain unchanged.
2. Compact subject, path and stage breadcrumb, with deeper curriculum context progressively disclosed.
3. Practice-session panel where applicable.
4. Stage-relative position, question title, mathematics and answer interaction in one primary card.
5. Marks, source, skill, path position and academic-honesty copy in “Question details”.
6. Immediate feedback and submitted-answer comparison inside the interaction.
7. Supportive hint directly after the question, before blocked continuation.
8. Worked solution, common mistake and the canonical Sprint P3 continuation.
9. Stage progress primary and full-path progress secondary in the supporting column.

At 1280×720 after implementation, the question heading begins at 201 px, the interaction at 253 px and the answer input at 370 px. This moves the heading 110 px and the input 78 px earlier. At 390×844, browser coverage requires the answer input to begin before 700 px and verifies that support precedes blocked navigation, feedback is brought into the viewport and no horizontal overflow exists.

## 3. Answer-feedback classification

Student-facing feedback is derived from typed engine and input state rather than displayed strings:

- `empty`: no attempt or progress evidence;
- `malformed`: deterministically incomplete grouping, power/operator input, or structured-answer parse failure;
- `unsupported_format`: notation that the authored final-answer contract can safely reject, such as an unwanted equals sign or prose for a numerical answer;
- `incorrect`: a readable automatic answer that does not match an accepted result; genuine incorrect attempt;
- `correct`: an accepted deterministic result; genuine correct attempt;
- `guided`: written or multi-step self-check flow; existing null-correctness attempt semantics;
- `internal_error`: marking or persistence could not complete; never presented as learner error and no synthetic attempt.

P4 does not label reordered expressions or alternative fractions as mathematically equivalent. The existing engine cannot prove that claim. Correctness, accepted aliases and mastery outcomes remain unchanged.

Empty input remains draft-only. Every explicitly submitted non-empty answer retains the established genuine-attempt boundary, including malformed or unsupported input; P4 improves its explanation without silently rewriting historical evidence semantics.

## 4. Focus and announcement behaviour

- One feedback region uses `role="status"`, `aria-live="polite"` and `aria-atomic="true"`.
- Known input validation failure returns focus to the persistently labelled answer field and sets `aria-invalid` with `aria-describedby`.
- Keyboard submission focuses the result heading.
- Pointer submission scrolls the result into view without moving focus away from the pointer target.
- Reduced-motion preference disables smooth feedback scrolling.
- Retry keeps the latest answer available, enables editing and returns focus to the selected answer text.
- Hint reveal focuses the newly rendered hint because its trigger is removed.
- Worked-solution reveal focuses the existing solution heading.
- No focus trap is introduced.

## 5. Submitted-answer presentation

The latest successfully recorded answer is shown as “Your submitted answer” in plain escaped text. Arbitrary learner text is never passed to the Markdown/KaTeX renderer. Retry retains that comparison while placing the same text back in the editable input. A later successful submission replaces the single comparison block; P4 does not build a full attempt-history interface. The append-only evidence history is unchanged.

## 6. Progressive-solution behaviour

The solution presenter supports explicit authored `{ title, body }[]` steps. It initially reveals the first step and provides keyboard-accessible “Show next step” and “Show full solution” controls. Expanding steps creates no evidence events. The final answer appears only when all structured steps are visible.

## 7. Legacy and unstructured fallback

All eight active Basic Differentiation questions currently store `workedSolution` as one authored string. P4 does not split those strings using punctuation or inferred mathematics. They use the reliable full-solution fallback and show the final answer distinctly. The separate legacy Higher Physics demonstration has step arrays but does not use the active Maths workspace.

## 8. Hint-language decision

The former “recorded for mastery” language was removed. The workspace now says:

> Use a hint when you need one. Independent answers provide stronger readiness evidence.

After supported correctness, the feedback explains the same distinction calmly. Hint evidence and mastery contribution are unchanged.

## 9. Stage-context decision

Canonical `questionIndexInStage` and active stage membership now produce labels such as “Question 2 of 3 in Foundations”. Stage position and stage progress are primary. The full eight-question path position and progress remain available as secondary context. This does not imply or create hard locking.

## 10. Local draft contract

- Storage key: `stemforge.answerDrafts.v1`.
- Schema version: `1`.
- Identity: canonical question ID, question version and content revision.
- Entry: identity, answer text and ISO update time.
- Limits: 4,096 characters per draft and the 50 most recently updated valid entries.
- Empty answers remove their entry.
- Writes merge with other valid question drafts; the latest persisted write for the same identity wins.
- Malformed payloads are ignored safely.
- Storage reads and writes fail silently when browser storage is unavailable.

This key is separate from `stemforge.localProgress.v1`, evidence provenance, import metadata and synchronization metadata. No draft API, remote table, import path or export path exists.

## 11. Draft cleanup and versioning

Drafts restore only for an exact question ID, question version and content revision. A newer or older version cannot populate the current answer. Correct completion removes the matching draft. Incorrect and format submissions retain it so interruption does not erase work. Restoring, typing, clearing and navigating create no attempts, support events, achievements or next-action evidence.

## 12. Accessibility behaviour

The active page retains one `<main>`. The question remains the only level-one heading. The answer has a persistent visible label. Feedback is programmatically associated with the input, announced once through one live region and does not rely on colour. Hint and solution focus targets are explicit. Structured solution controls expose meaningful names and expanded state. Touch targets remain at least 40 px, keyboard completion is covered, and mobile reflow has no horizontal overflow.

## 13. Test evidence

Focused coverage includes:

- correctness-boundary regression and accepted aliases;
- empty, whitespace, malformed, unclosed bracket, unsupported notation and structured parse failure;
- incorrect values, negative values, fractions, powers and multiple accepted answers;
- repeated incorrect then correct interaction;
- internal failure wording;
- draft keying, round trip, bounds, corruption, storage unavailability, version/revision isolation, cleanup and two-tab-style writes;
- structured versus unstructured solution presentation;
- canonical stage-relative position;
- first viewport hierarchy, input association, submitted-answer retention, Retry focus, keyboard focus, hint focus and language;
- full-solution fallback, draft refresh/navigation restoration and correct cleanup;
- 390×844 keypad use, feedback visibility, support ordering and overflow;
- browser console and page-error monitoring.

The final safe gate exited cleanly: 296 unit/integration tests passed across 25 groups, 79 ordinary Playwright tests passed, authentication-enabled hydration passed 1/1, and the Firefox/Chromium/WebKit hardening matrix passed 3/3. Typecheck, lint, the 35-route production build and content validation also passed; content validation retained only the existing legacy Higher Physics warning.

## 14. Residual limitations

- The automatic algebraic engine still performs normalized accepted-string matching rather than symbolic equivalence.
- Live Basic Differentiation solutions cannot progressively reveal authored steps until content is explicitly structured in a future content sprint.
- Drafts deliberately do not move between browsers, devices or accounts.
- Concurrent tabs use last persisted write for the same question identity; P4 does not merge character-level edits.
- A browser that blocks local storage continues learning normally but cannot restore drafts.

## 15. Explicitly deferred work

AI feedback, method marking, proof marking, handwriting and photo input, new questions, rewritten solutions, hard stage locking, adaptive keypad layouts, remote drafts, analytics, rewards, dashboard redesign, account/sync redesign, content expansion, premium and payments remain out of scope.

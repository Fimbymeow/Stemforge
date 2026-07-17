# STEM Forge Answer Engine

Updated: 11 July 2026  
Scope: behaviour-preserving extraction and regression harness

## Purpose

This document records the answer behaviour that STEM Forge has today. Sprint 3 extracted the active comparison rules into pure functions and added regression tests without making marking more permissive or more restrictive.

The current engine is a safe baseline, not the ideal final mathematics engine.

## Current execution boundary

```text
student input
-> canSubmitAnswer
-> markQuestionAnswer (pure)
-> MarkingResult
-> existing feedback selection
-> existing saveQuestionAttempt
-> existing LocalStorage/progress derivation
```

Pure answer functions live in `lib/answer-engine.ts`. They do not access React, DOM APIs, navigation or LocalStorage.

## Structured result

Automatically marked and guided answers return:

```ts
type MarkingResult = {
  isCorrect: boolean | null;
  normalizedStudentAnswer: string;
  matchedAcceptedAnswer?: string;
  mode: "automatic" | "guided";
};
```

`isCorrect: null` means the answer is captured for guided self-check and is not automatically marked.

## Higher Maths marking flow

1. `QuestionWorkspace` renders the active question from `/question/[id]`.
2. The answer is held as a page-local string.
3. `canSubmitAnswer` trims only to decide whether submission is allowed.
4. Blank or whitespace-only input cannot be submitted.
5. `markQuestionAnswer` selects automatic or guided behaviour from `answerType`.
6. Automatically marked answers are normalised and compared with every `acceptedAnswers` entry in array order.
7. The first matching accepted alias is returned in `matchedAcceptedAnswer`.
8. No match returns `isCorrect: false`.
9. Written and multi-step types return `isCorrect: null` without interpreting their content.
10. `QuestionWorkspace` saves that result using the unchanged `saveQuestionAttempt` flow.
11. Existing feedback, solution, hint, retry and progression UI remains unchanged.

The `correctAnswer` field is not consulted at runtime. The accepted-answer array controls automatic marking. Sprint 2 validation warns if the canonical answer is not included in that array.

## Structured graph and nature-table answers

Sprint 19 adds automatic structured answer types:

- `graph_structured`
- `nature_table`

These still flow through `markQuestionAnswer` and return the same `MarkingResult` shape. The submitted answer string is a stable JSON representation of mathematical answer state, such as interval signs, key points, candidate choices, transformation sequences or nature-table cells. It is not a screenshot, sampled curve, drag path or raw pointer coordinate log.

Validation lives in `lib/questions/graph-answer-validation.ts`; graphable expression support lives in `lib/maths/*`. See `STEM_FORGE_INTERACTIVE_MATHS_GRAPHS_AND_NATURE_TABLES.md`.

## Legacy Higher Physics flow

Legacy Physics currently has no student answer engine.

The page:

- pre-fills the canonical answer from `StemForgeQuestion.answer`;
- makes the input read-only;
- has a submit button with no submission handler;
- always displays a correct feedback panel;
- does not record an attempt;
- uses hard-coded/demo progress presentation.

`getLegacyPhysicsDemoAnswerState` exposes this state for tests and display without pretending an answer was evaluated:

```text
isMarkable: false
isCorrect: null
displayedAnswer: canonical Physics answer
displayedUnit: canonical Physics unit
```

Therefore Physics has no accepted-answer list, formatting rules, incorrect-result path or progress side effect to consolidate with Higher Maths. An “incorrect Physics answer” remains unmarkable rather than returning false.

## Shared utilities

### `canSubmitAnswer(answer)`

Returns true when `answer.trim()` is non-empty. This preserves the old workspace submission guard.

### `normaliseAnswer(value)`

Applies the exact previous Higher Maths normalisation chain:

1. lowercases;
2. converts Unicode minus `−` to `-`;
3. converts `π` to `pi`;
4. converts superscript `²` to `^2`;
5. converts superscript `³` to `^3`;
6. converts `×` and `·` to `*`;
7. removes all whitespace;
8. removes all `*` characters;
9. removes `{` and `}`.

Order matters. The extracted function retains the original order.

### `compareAcceptedAnswers(studentAnswer, acceptedAnswers)`

Normalises both sides and checks accepted answers in array order. It returns the first matching original accepted-answer string.

### `markQuestionAnswer(question, studentAnswer)`

- `numerical`, `algebraic` and `multiple_choice`: automatic comparison.
- `written` and `multi_step`: guided/unmarked result.

## Answer-behaviour inventory

| Form | Status | Current behaviour |
|---|---|---|
| Integers | Confirmed supported | Exact normalised string, e.g. `14`. |
| Negative numbers | Confirmed supported | Exact string; Unicode minus and hyphen-minus are equivalent. |
| Decimals | Confirmed supported | Exact representation only. `14` is not `14.0`. |
| Fractions | Question-dependent | Accepted only when that exact fraction form is authored. |
| Fraction/decimal equivalence | Confirmed unsupported | `1/2` is not `0.5`. |
| Algebra | Limited support | Exact normalised authored forms only. |
| Reordered algebra | Confirmed unsupported | `5x^4` is not `x^4*5`. |
| Expanded/factorised equivalence | Confirmed unsupported | No expression parsing. |
| Leading/trailing whitespace | Confirmed supported | Removed during normalisation. |
| Internal whitespace | Confirmed supported | All whitespace is removed. |
| Capitalisation | Confirmed supported | All text is lowercased. |
| `*`, `×`, `·` multiplication | Confirmed supported | All become/remain `*`, then are removed. |
| Powers with `^` | Confirmed supported | Exact text such as `x^4`. |
| Superscript 2/3 | Confirmed supported | Converted to `^2` and `^3`. |
| Other superscripts | Confirmed unsupported | For example superscript 4 is not converted. |
| Curly braces | Confirmed ignored | `{` and `}` are removed globally. |
| Parentheses/brackets | Exact-string dependent | Retained; `()` and `[]` are not equivalent. |
| Coordinates/ordered pairs | Exact-string dependent | No structured coordinate parsing; spaces are removed. |
| Comma spacing | Confirmed supported | Spaces are removed, commas remain. |
| Units | Confirmed unsupported as metadata | Units are not stripped or separately checked. They only pass if authored inside an accepted string. |
| Multiple accepted answers | Confirmed supported | Any normalised alias can match; first match is reported. |
| Multiple answer fields | Confirmed unsupported | No active multiple-field model or UI exists. |
| Multi-step answers | Guided only | One textarea; returns `isCorrect: null`. |
| Partially complete multi-step | Guided only | Also returns `null`; no partial correctness. |
| Empty answer | UI-blocked | Cannot be submitted. The pure comparator itself performs ordinary string comparison. |
| Leading zeros | Confirmed unsupported as equivalence | `014` is not `14`. |
| Trailing decimal zeros | Confirmed unsupported as equivalence | `14.0` is not `14`. |
| Leading plus sign | Confirmed unsupported as equivalence | `+14` is not `14`. |
| Pi symbol | Confirmed supported | `π` and `pi` normalise identically. |
| Square root alternatives | Exact-string dependent | No square-root parsing; keypad inserts `sqrt(` as plain text. |

## Examples intentionally rejected

These forms may be mathematically equivalent but remain rejected unless explicitly authored in `acceptedAnswers`:

```text
Expected: 5x^4
Rejected: x^4*5
Rejected: 5x*x*x*x

Expected: 14
Rejected: 14.0
Rejected: 014
Rejected: +14

Expected: 1/2
Rejected: 0.5
Rejected: 2/4
```

Preserving these rejections is intentional in this sprint.

## Accepted-answer ordering and malformed values

- Runtime comparison checks aliases in order and stops at the first normalised match.
- Duplicate aliases do not change correctness, only which original alias is reported.
- An empty accepted array always produces false for automatic comparison.
- The pure comparator assumes string values, matching the TypeScript type.
- Sprint 2 content validation blocks empty arrays for automatic types and invalid/empty values before build.
- An empty student answer could technically equal an empty accepted string if the comparator were called directly, but the UI blocks blank submissions and validation blocks such production content.

## Multi-field behaviour

There are no current multi-field question records, input components or field-specific answer arrays.

The declared `multi_step` answer type uses one textarea. All complete, incomplete, correct-looking and incorrect-looking values return guided `isCorrect: null`. There is no field ordering, missing-field detection, extra-field detection, partial marking or all-or-nothing automatic result.

Regression tests lock this absence of automatic marking rather than inventing multi-field support.

## Progress side effects

Sprint 5 changed progress semantics without changing this answer engine:

- a correct genuine submission completes the question;
- an incorrect genuine submission records an unresolved attempt but does not complete it;
- deliberately viewing the worked solution after an attempt completes the question;
- hint and solution support are recorded outside the answer engine;
- retry history, best outcome, mastery and progression remain owned by the progress system.

Focused boundary tests prove that the unchanged marking result is translated into the V2 progress model correctly.

## Protected behaviour

Future changes must preserve, or explicitly version and migrate:

- exact normalisation order;
- all currently accepted aliases;
- all documented current rejections;
- blank-submission guard;
- guided `null` results;
- feedback branching;
- attempt recording timing;
- the answer engine remaining independent from completion/mastery policy;
- progression being based on V2 completion rather than answer submission alone;
- legacy Physics remaining a demo until deliberately migrated.

## Known risks

1. Algebraic correctness depends on authors anticipating string aliases.
2. Decimal and fraction equivalence is absent.
3. Units are not structurally represented in marking.
4. Only superscript 2 and 3 are normalised.
5. Removing all multiplication markers and braces is lexical, not mathematical.
6. The runtime uses accepted answers rather than `correctAnswer`.
7. No active multiple-choice content exercises that branch end to end.
8. No real multiple-field engine exists.
9. Physics has no real answer submission path.

## Safe future extension points

The pure functions create a controlled path for future changes:

```text
Question answer type
-> answer-type-specific marker
-> structured MarkingResult
-> unchanged feedback/progress boundary
```

A future engine can add new markers alongside the current exact comparator while keeping regression fixtures for old behaviour. New behaviour should be opt-in by answer type or schema version rather than silently replacing all questions.

## Recommended route toward mathematical equivalence

1. Agree product rules for numeric tolerance, rounding, fractions, algebra and units.
2. Add expected accepted/rejected fixtures before implementation.
3. Introduce a versioned numeric marker first; it is narrower than symbolic algebra.
4. Keep exact-string marking as a fallback and compatibility mode.
5. Add a parsed expression representation only when required by real content.
6. Add algebraic equivalence behind a new explicit marking strategy.
7. Never allow a new parser to change existing records without a migration report.
8. Add browser-level submission tests before changing feedback or persistence.

No CAS, parser, tolerance or symbolic library was added in Sprint 3.

## Testing strategy

### Pure answer tests

`tests/answer-engine.test.ts` covers:

- every extracted normalisation rule;
- every accepted alias on a real Maths question;
- formatting variants currently accepted;
- reordered algebra currently rejected;
- decimal and leading-zero distinctions;
- fraction string behaviour;
- negative/Unicode-minus behaviour;
- coordinates/brackets/units;
- blank submission boundary;
- accepted-answer ordering;
- guided written/multi-step results;
- legacy Physics demo state.

### Progress boundary tests

`tests/question-submission-boundary.test.ts` confirms correct and incorrect marking results still produce the existing completion, accuracy and next-question behaviour.

### Build decision

Production build continues to run content validation automatically. Answer tests run through the explicit test commands and the full `pnpm test` command. They are not added to every production build because content validation is the deployment gate and the project does not yet have CI; Sprint 4 should establish CI that runs the full suite before deployment.

## Commands

Run answer-engine tests:

```bash
pnpm run test:answers
```

Run content tests and answer tests:

```bash
pnpm test
```

Run the remaining checks:

```bash
pnpm run validate-content
pnpm run typecheck
pnpm run lint
pnpm build
```

## Behaviour statement

No answer acceptance or rejection behaviour changed.

## Practice-session boundary

Sprint 20 practice sessions do not add a second answer engine. Every session question renders through QuestionWorkspace, marks through markQuestionAnswer, and saves through saveQuestionAttempt. Session state stores only references, timing and navigation metadata; canonical attempts remain the source of answer evidence.

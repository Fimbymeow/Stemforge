# STEM Forge Marking Engine

Updated: 28 July 2026
Scope: Alpha marking for the active learner runtime

## Runtime boundary

Every active question declares a versioned `marking` contract. `markQuestionAnswer` is the only runtime dispatcher:

```text
authored question contract
-> one pure strategy marker
-> structured MarkingResult
-> learner-safe feedback
-> append-only attempt evidence
-> progress and Practice Session derivation
```

The marker is independent of React, browser storage, completion and mastery policy. The old
`normaliseAnswer` and `compareAcceptedAnswers` exports remain only for the bounded migration audit;
new runtime marking does not use them.

## Closed Alpha strategy set

Exactly five strategy identifiers are implemented, all at strategy version 1:

- `numeric`
- `polynomial_form`
- `multiple_choice`
- `guided_self_check`
- `structured_graph`

Content validation rejects unknown or deferred strategy identifiers, any implemented strategy version
other than 1, answer-type/strategy mismatches, active unit configuration and invalid authored targets.

## Result contract

Every marker returns:

```ts
type MarkingResult = {
  outcomeKind: "graded" | "guided_pending" | "unmarkable" | "malformed" | "internal_error";
  isCorrect: boolean | null;
  outcomeReason?:
    | "value_wrong" | "form_wrong" | "precision_wrong" | "unit_wrong"
    | "malformed_numeric" | "malformed_polynomial" | "malformed_structured"
    | "expression_not_permitted" | "unsupported_mathematical_form";
  normalizedStudentAnswer: string;
  matchedAcceptedAnswer?: string;
  strategy: MarkingStrategy;
  strategyVersion: number;
  diagnosticReason?: string;
};
```

A correct graded result has no reason. An incorrect graded result has a learner-safe reason.
Malformed and unmarkable results use their own closed reasons and `isCorrect: null`.
`internal_error` is never persisted as an attempt and its diagnostic is not shown to learners.

## Numeric strategy

The numeric parser accepts literals only:

- signed integers and decimals, including `.5`;
- signed fractions with a non-zero denominator;
- percentages;
- scientific notation;
- Unicode or ASCII minus and a leading plus.

It uses exact reduced rational values backed by `BigInt`; it does not convert learner values to
floating point. It rejects empty or malformed literals, `5.`, internal whitespace, zero denominators,
`NaN` and infinity as malformed. Arithmetic, roots, functions, brackets and other expressions are
unmarkable and are never evaluated. In particular, `1*4`, `1×4` and `1 4` cannot equal `14`.

Comparison policies are exact, inclusive absolute tolerance, inclusive relative tolerance,
decimal-place rounding and significant-figure rounding. Rounding is half away from zero.
Lexical decimal-place and significant-figure requirements are checked independently from numeric
equality. Optional presentation policies support integer, fraction, simplified fraction, decimal,
percentage, decimal places and significant figures. Scientific notation can satisfy a
significant-figure policy. Fractions never satisfy a significant-figure presentation policy because
their written numerator and denominator do not declare the precision of the represented value;
learners must use decimal or scientific notation (or an unambiguous integer) for that requirement.

Bounds:

- maximum numeric input length: 256 characters;
- maximum numeric digits: 128;
- maximum absolute exponent: 1000.

## Polynomial-form strategy

The polynomial parser supports an already-expanded polynomial in one declared variable. It accepts
integer, decimal or fractional coefficients, omitted coefficient 1, ordinary or superscript
non-negative integer powers, term reordering, like-term combination and zero-term removal.
Coefficients are exact rationals.

It deliberately does not expand brackets, multiply expressions, solve equations, compare
factorisations or identities, accept negative powers, rational expressions, scientific coefficients
or multiple variables. Unsupported mathematical forms are unmarkable; incomplete polynomial syntax
is malformed.

Bounds:

- maximum polynomial input length: 512 characters;
- maximum terms: 64;
- maximum exponent: 100;
- maximum coefficient digits: 128.

## Compatibility strategies

`multiple_choice` performs exact option-ID comparison. Its `correctOptionId` is the single runtime
authority; validation requires the legacy `correctAnswer` and `acceptedAnswers` fields to agree with
it so contradictory authored content cannot enter the runtime. `guided_self_check` preserves the
existing guided flow and returns `guided_pending`. `structured_graph` preserves structured graph
marking, but invalid JSON is now `malformed_structured` rather than an incorrect mathematical answer.

## Evidence semantics

New attempts persist `outcomeKind`, optional `outcomeReason`, `strategy` and `strategyVersion`.
The V5 payload and database schema are unchanged because these are additive JSON evidence fields.
Remote exact-key validation accepts only complete, legal metadata and still accepts historical
attempts without it.

Historical `isCorrect: false` remains graded-incorrect-compatible because its old ambiguity cannot be
reconstructed honestly. New malformed and unmarkable attempts count as interactions, but do not enter
first/latest accuracy denominators, incorrect counts, mastery penalties or review recommendations.
Practice Session status, summaries and selection use the same outcome-aware rules.

## Hint and worked-solution integrity

Hint-before-submission is derived transactionally from durable, same-question and same-version support
events. It therefore survives refresh, another tab and retries; a component-local boolean is not
trusted as evidence.

Any non-empty completed submission interaction can make the worked solution available in the current
view, including an internal marker or storage failure. That temporary availability is not durable. A
later visit makes the solution available only when a genuine attempted interaction was persisted;
solution-view evidence is recorded only after such an attempt.

Question feedback distinguishes mathematical judgement from recoverable input and system states.
Only graded-incorrect answers use the red incorrect treatment. Malformed input uses a warning
treatment, while unmarkable input and internal or persistence failures use a neutral informational
treatment. Existing focus movement, live-region announcements and retry behaviour remain intact.

## Authored fixtures and versioning

Every active numeric and polynomial contract carries correct, incorrect, malformed and unmarkable
fixtures. Content validation executes those fixtures against the live dispatcher and also proves every
legacy accepted answer remains correct.

All eight Basic Differentiation records use content revision 2. Question versions are bumped only where
the old multiplication-marker deletion could accept a concretely different mathematical expression:

- `hm-calc-diff-basic-f-002`: version 1 to 2 because inputs such as `1*2x^3-4x`,
  `1×2x^3-4x` and `1 2x^3-4x` collided with `12x^3-4x`;
- `hm-calc-diff-basic-f-003`: version 1 to 2 because `1*4`, `1×4` and `1·4` collided with `14`;
- `hm-calc-diff-basic-a-002`: version 1 to 2 because `2*9`, `2×9` and `2·9` collided with `29`.

The other five question versions remain 1. The audit is finite and deterministic, inspects every
legacy accepted alias for both numeric and polynomial contracts, and is retained in
`lib/marking/legacy-collision-audit.ts`.

## Explicitly deferred

Alpha does not implement units, unit conversion, general arithmetic evaluation, bracket expansion,
factorisation equivalence, rational expressions, negative powers, multiple variables, equation
solving, identities, domain reasoning, sampling-based equivalence, symbolic differentiation,
arbitrary-text or AI marking, generic multipart marking, per-part persisted results, layered evaluator
escalation or server-authoritative marking.

## Legacy Physics

Legacy Physics remains a read-only demo with no learner answer evaluation or attempt side effect.
`getLegacyPhysicsDemoAnswerState` continues to report that boundary honestly.

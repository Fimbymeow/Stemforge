# STEM Forge Interactive Maths Graphs and Nature Tables

Sprint 19 introduces the reusable foundation for graph-based Higher Maths work without adding arbitrary freehand sketch recognition or full computer algebra.

## Supported mathematical scope

Graphable expressions use an authored, serialisable AST in `lib/maths/expression-types.ts`.

Supported nodes:

- constants using bounded exact integer/rational values;
- the variable `x`;
- addition and subtraction through `add`;
- multiplication and constant multiples;
- integer powers;
- `sin`, `cos`, `tan`, `exp`, and `log` with domain checking.

Unsupported cases fail explicitly. There is no `eval`, `new Function`, arbitrary JavaScript execution, public expression parser, or student-authored executable expression input.

## Derivatives

`deriveExpression` in `lib/maths/expression-core.ts` supports:

- constants;
- `x`;
- sums;
- constant multiples;
- integer powers of `x`;
- chain-rule forms where the inner expression is itself supported;
- `sin`, `cos`, `exp`, and `log`.

Unsupported derivatives return `{ status: "unsupported" }`. Numerical differentiation is used only in tests as a cross-check, never as the canonical answer source.

## Graph rendering and sampling

`components/maths/math-graph.tsx` renders SVG graphs from sampled mathematical coordinates.

Sampling is implemented in `lib/maths/graph-sampling.ts` and:

- bounds sample count;
- reports domain errors;
- splits curves at discontinuities or large jumps;
- avoids connecting across asymptotes;
- keeps sampled arrays out of progress evidence.

SVG is used for accessible titles/descriptions, crisp curves, labelled functions, keyboard-focusable points and testable graph elements.

## Linked original and derivative graphs

`components/maths/linked-derivative-graphs.tsx` links `f(x)` and `f'(x)` views with one shared x-value.

It shows:

- selected x-value;
- `f(x)`;
- tangent line where derivative data is supported;
- `f'(x)`;
- stacked mobile layout.

## Transformations

`lib/maths/graph-transformations.ts` represents transformations as data:

- `translateX`
- `translateY`
- `scaleX`
- `scaleY`
- `reflectX`
- `reflectY`

Higher Maths conventions are used:

- `translateX` by `a` maps to `f(x-a)`;
- `scaleX` by factor `a` maps to `f(x/a)`;
- key points are mapped mathematically, not by pixels.

## Nature tables and function analysis

`lib/maths/function-analysis.ts` derives supported derivative signs and stationary-point classifications.

For supported polynomial-style derivative roots it can derive critical values. For unsupported solving, content must provide critical values explicitly.

`components/maths/nature-table.tsx` provides keyboard-native structured controls for:

- derivative signs;
- increasing/decreasing/stationary trends;
- maximum/minimum/stationary inflection classifications;
- exact coordinate fields where configured.

## Structured graph answers

`lib/questions/graph-answer-validation.ts` validates structured mathematical answer states:

- point placement with mathematical tolerances;
- interval signs;
- candidate graph matching;
- transformation sequences;
- nature-table cells.

The answer engine integrates `graph_structured` and `nature_table` as automatic answer types. Submissions still create ordinary question attempts through `QuestionWorkspace`; pointer movement, hover state, sampled graph data and screenshots are not stored.

## Demo route

`/graph-demo` is an internal proof route using the real question workspace with a nature-table graph question. It proves the end-to-end path without expanding the active eight-question Basic differentiation beta path.

## Stale-generation hardening

Expected account-generation and erasure sync states are represented as typed application-state responses instead of HTTP 409 browser-console failures. The sync provider still treats them as cleanup-required states.

## Verification focus

Focused tests:

- `tests/maths-expression.test.ts`
- `tests/maths-derivative.test.ts`
- `tests/graph-sampling.test.ts`
- `tests/graph-transformations.test.ts`
- `tests/function-analysis.test.ts`
- `tests/graph-answer-validation.test.ts`
- `e2e/graph-questions.spec.ts`

## Explicit exclusions

Not implemented:

- freehand graph recognition;
- arbitrary student-entered expressions;
- full CAS;
- implicit equations;
- 3D/polar/parametric graphs;
- graph image uploads;
- AI graph marking;
- broad Higher Maths content expansion;
- Sprint 20 content-authoring pipeline.

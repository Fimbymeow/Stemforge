# Area Under a Curve Graph Pilot Question Bank v1

- skillPathId: area-under-curve

## A001 — hm-calc-area-curve-a-001

Stage: Applications

Subskill: Exact area under a curve

Type: numeric

Marks: 3

Calculator/non-calculator: Non-calculator

Command word: Find

Curriculum metadata:

```yaml
curriculum:
  primarySkillId: area-under-curve
  requiredSkillIds:
    - definite-integrals
```

Question:

The diagram shows part of the curve

\[
y=x^2-2x+3.
\]

The shaded region is bounded by the curve, the \(x\)-axis and the lines

\[
x=2 \quad\text{and}\quad x=4.
\]

Find the exact area of the shaded region.

Graph configuration:

```yaml
version: 1
title: Area under a quadratic curve
description: >
  The region between y = x² − 2x + 3 and the x-axis from x = 2 to x = 4 is shaded.
viewport:
  xMin: -1
  xMax: 5
  yMin: 0
  yMax: 12
axes:
  xLabel: x
  yLabel: y
  xTicks:
    - 2
    - 4
  grid: none
functions:
  - id: f
    expression: x^2 - 2*x + 3
    label: y = x² − 2x + 3
    labelAtX: 3.5
    labelPlacement: above
    styleRole: primary
boundaries:
  - id: lower-bound
    axis: x
    value: 2
    label: x = 2
    labelPlacement: right
    style: dashed
  - id: upper-bound
    axis: x
    value: 4
    label: x = 4
    labelPlacement: left
    style: dashed
regions:
  - id: shaded-area
    type: curve-to-constant
    curveId: f
    fromX: 2
    toX: 4
    baseline: 0
    description: Shaded area under the curve from x = 2 to x = 4.
```

Correct answer: \(\frac{38}{3}\)

Accepted answers:

- 38/3

Hint:

Use a definite integral with limits 2 and 4. The curve is above the \(x\)-axis throughout this interval.

Worked solution:

\[
A=\int_2^4 (x^2-2x+3)\,dx
\]

\[
=\left[\frac{x^3}{3}-x^2+3x\right]_2^4
\]

At \(x=4\),

\[
\frac{64}{3}-16+12=\frac{52}{3}.
\]

At \(x=2\),

\[
\frac{8}{3}-4+6=\frac{14}{3}.
\]

Therefore

\[
A=\frac{52}{3}-\frac{14}{3}=\boxed{\frac{38}{3}}.
\]

Common mistake:

Subtracting the lower-limit value in the wrong order, or using the width of the interval instead of evaluating the definite integral.

QA note:

Preview-only graph import pilot. Do not approve or apply until the Area Under a Curve skill has a reviewed package and real canonical stage IDs.

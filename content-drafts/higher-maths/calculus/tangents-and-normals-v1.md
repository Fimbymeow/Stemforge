# STEM Forge — Higher Maths Tangents Question Bank v1

Status: **QA-reviewed auto-mark content-bank draft with structured answer fields**  
Do not import into the app yet. Store as a future content-bank draft.

Path: Higher Maths → Calculus → Differentiation → Tangents

Source label: Original STEM Forge QS-style content  
QS skill tested: Finding the gradient of a curve at a point and the equation of the tangent there  
Independence note: Independent original material; not affiliated with or endorsed by SQA.

Import defaults:
- skillPathId: hm-calc-tangent
- source: Original STEM Forge QS-style content
- stageId mapping:
  - Applications → applications
  - Past Paper-style Questions → past-paper-style

Final kept count:
- Applications: 1
- Past Paper-style Questions: 4
- Total: 5

No Foundations questions exist yet for this skill — none are authored in this pass.

Migration note: these five questions were migrated unchanged (mathematical wording and worked
solutions preserved) from `chain-rule-v6.md`, where they were originally filed as
`hm-calc-diff-chain-a-010`, `hm-calc-diff-chain-ppq-022`, `hm-calc-diff-chain-ppq-023`,
`hm-calc-diff-chain-ppq-024` and `hm-calc-diff-chain-ppq-025`. In every one, the assessed
deliverable is a tangent-line equation, so Tangents is the correct canonical owner; Chain Rule
remains a genuine, conditional prerequisite for differentiating the composite curve in each
question, represented at question and package level, never as a universal skill-level
prerequisite. The old Chain Rule IDs were draft-only (no import receipt, no progress evidence,
no live registry entry) and are retired, not aliased.

Storage note: this is a content-bank draft, not active app data. Import later only after
architecture, QA, and testing are ready.

---

## Applications

### A001 — hm-calc-tangent-a-001

Stage: Applications  
Subskill: Tangent setup using chain rule  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation \(y=(2x-1)^3\). Find the equation of the tangent to the curve at the point where \(x=1\).

Correct answer:  
\[
y=6x-5
\]

Accepted answers:
- y=6x-5
- y = 6x - 5
- 6x-y-5=0
- y-1=6(x-1)

Answer fields:
```yaml
answerFields:
  - id: tangent-equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=6x-5
    acceptedAnswers:
      - y=6x-5
      - y = 6x - 5
      - 6x-y-5=0
      - 6x - y - 5 = 0
      - y-1=6(x-1)
```

Hint:  
Find the gradient using \(\frac{dy}{dx}\), then find the point on the curve.

Worked solution:  
\[
y=(2x-1)^3
\]
\[
\frac{dy}{dx}=3(2x-1)^2\cdot2=6(2x-1)^2.
\]
At \(x=1\),
\[
m=6(1)^2=6.
\]
Find the point:
\[
y=(2(1)-1)^3=1.
\]
So the point is \((1,1)\).

Using \(y-b=m(x-a)\),
\[
y-1=6(x-1)
\]
\[
y=6x-5.
\]

Common mistake:  
Using the gradient correctly but forgetting to calculate the \(y\)-coordinate of the point.

---

## Past Paper-style Questions

### PPQ001 — hm-calc-tangent-ppq-001

Stage: Past Paper-style Questions  
Subskill: Equation of a tangent to a composite curve  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=(2x+1)^3.
\]
Find the equation of the tangent to the curve at \(x=1\).

Correct answer:  
\[
y=54x-27
\]

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 6(2x+1)^2
    acceptedAnswers:
      - 6(2x+1)^2
      - 6*(2x+1)^2
      - 6(2x + 1)^2
      - dy/dx=6(2x+1)^2

  - id: gradient
    label: Gradient at x = 1
    type: exact
    correctAnswer: 54
    acceptedAnswers:
      - 54
      - m=54
      - gradient=54

  - id: point
    label: Point of contact
    type: coordinate
    correctAnswer: (1,27)
    acceptedAnswers:
      - (1,27)
      - (1, 27)
      - 1,27
      - x=1,y=27
      - x = 1, y = 27

  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=54x-27
    acceptedAnswers:
      - y=54x-27
      - y = 54x - 27
      - 54x-y-27=0
      - 54x - y - 27 = 0
```

Hint:  
Find the gradient using the derivative, then use the point on the curve.

Worked solution:  
\[
y=(2x+1)^3.
\]
Differentiate:
\[
\frac{dy}{dx}=3(2x+1)^2\cdot2=6(2x+1)^2.
\]
At \(x=1\),
\[
m=6(2(1)+1)^2=6(3)^2=54.
\]
Find the \(y\)-coordinate:
\[
y=(2(1)+1)^3=3^3=27.
\]
So the tangent passes through \((1,27)\) with gradient \(54\).

Using
\[
y-b=m(x-a),
\]
\[
y-27=54(x-1).
\]
\[
y-27=54x-54
\]
\[
y=54x-27.
\]

Common mistake:  
Using the \(y\)-coordinate \(27\) as the gradient.

---

### PPQ002 — hm-calc-tangent-ppq-002

Stage: Past Paper-style Questions  
Subskill: Equation of a tangent to a composite curve with quadratic inside function  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=(x^2+3)^2.
\]
Find the equation of the tangent to the curve at \(x=2\).

Correct answer:  
\[
y=56x-63
\]

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 4x(x^2+3)
    acceptedAnswers:
      - 4x(x^2+3)
      - 4*x*(x^2+3)
      - 4x(x^2 + 3)
      - dy/dx=4x(x^2+3)

  - id: gradient
    label: Gradient at x = 2
    type: exact
    correctAnswer: 56
    acceptedAnswers:
      - 56
      - m=56
      - gradient=56

  - id: point
    label: Point of contact
    type: coordinate
    correctAnswer: (2,49)
    acceptedAnswers:
      - (2,49)
      - (2, 49)
      - 2,49
      - x=2,y=49
      - x = 2, y = 49

  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=56x-63
    acceptedAnswers:
      - y=56x-63
      - y = 56x - 63
      - 56x-y-63=0
      - 56x - y - 63 = 0
```

Hint:  
Differentiate using the Chain rule, then substitute \(x=2\) into both the derivative and the original curve.

Worked solution:  
\[
y=(x^2+3)^2.
\]
Using the Chain rule,
\[
\frac{dy}{dx}=2(x^2+3)\cdot2x.
\]
So
\[
\frac{dy}{dx}=4x(x^2+3).
\]
At \(x=2\),
\[
m=4(2)(2^2+3)=8(7)=56.
\]
Find the \(y\)-coordinate:
\[
y=(2^2+3)^2=(7)^2=49.
\]
So the tangent passes through \((2,49)\) with gradient \(56\).

\[
y-49=56(x-2)
\]
\[
y-49=56x-112
\]
\[
y=56x-63.
\]

Common mistake:  
Finding the gradient correctly but substituting into the tangent formula with the wrong point.

---

### PPQ003 — hm-calc-tangent-ppq-003

Stage: Past Paper-style Questions  
Subskill: Equation of a tangent to a square-root composite curve  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=\sqrt{4x+5}.
\]
Find the equation of the tangent to the curve at \(x=5\).

Correct answer:  
\[
y=\frac{2}{5}x+3
\]

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: (4x+5)^(1/2)
    acceptedAnswers:
      - (4x+5)^(1/2)
      - (4x + 5)^(1/2)
      - sqrt(4x+5)

  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 2(4x+5)^(-1/2)
    acceptedAnswers:
      - 2(4x+5)^(-1/2)
      - 2*(4x+5)^(-1/2)
      - 2/sqrt(4x+5)
      - 2/sqrt(4x + 5)
      - dy/dx=2(4x+5)^(-1/2)

  - id: gradient
    label: Gradient at x = 5
    type: exact
    correctAnswer: 2/5
    acceptedAnswers:
      - 2/5
      - 0.4
      - m=2/5
      - gradient=2/5

  - id: point
    label: Point of contact
    type: coordinate
    correctAnswer: (5,5)
    acceptedAnswers:
      - (5,5)
      - (5, 5)
      - 5,5
      - x=5,y=5
      - x = 5, y = 5

  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=(2/5)x+3
    acceptedAnswers:
      - y=(2/5)x+3
      - y = (2/5)x + 3
      - y=2x/5+3
      - y = 2x/5 + 3
      - 5y=2x+15
      - 5y - 2x - 15 = 0
```

Hint:  
Rewrite the square root using a power of \(\frac12\), then find the gradient and point.

Worked solution:  
\[
y=\sqrt{4x+5}=(4x+5)^{1/2}.
\]
Using the Chain rule,
\[
\frac{dy}{dx}=\frac12(4x+5)^{-1/2}\cdot4.
\]
So
\[
\frac{dy}{dx}=2(4x+5)^{-1/2}.
\]
At \(x=5\),
\[
m=2(4(5)+5)^{-1/2}=2(25)^{-1/2}.
\]
Since
\[
25^{-1/2}=\frac15,
\]
\[
m=\frac25.
\]
Find the \(y\)-coordinate:
\[
y=\sqrt{4(5)+5}=\sqrt{25}=5.
\]
So the tangent passes through \((5,5)\) with gradient \(\frac25\).

\[
y-5=\frac25(x-5)
\]
\[
y-5=\frac25x-2
\]
\[
y=\frac25x+3.
\]

Common mistake:  
Finding \(y=5\), then using \(5\) as the gradient instead of \(\frac25\).

---

### PPQ004 — hm-calc-tangent-ppq-004

Stage: Past Paper-style Questions  
Subskill: Two-part Chain rule and tangent question  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=(3x-2)^2.
\]

(a) Find \(\frac{dy}{dx}\).  
(b) Find the equation of the tangent to the curve at \(x=2\).

Correct answer:  
(a)
\[
\frac{dy}{dx}=6(3x-2)
\]

(b)
\[
y=24x-32
\]

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 6(3x-2)
    acceptedAnswers:
      - 6(3x-2)
      - 6*(3x-2)
      - 6(3x - 2)
      - dy/dx=6(3x-2)
      - dy/dx = 6(3x - 2)

  - id: gradient
    label: Gradient at x = 2
    type: exact
    correctAnswer: 24
    acceptedAnswers:
      - 24
      - m=24
      - gradient=24

  - id: point
    label: Point of contact
    type: coordinate
    correctAnswer: (2,16)
    acceptedAnswers:
      - (2,16)
      - (2, 16)
      - 2,16
      - x=2,y=16
      - x = 2, y = 16

  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=24x-32
    acceptedAnswers:
      - y=24x-32
      - y = 24x - 32
      - 24x-y-32=0
      - 24x - y - 32 = 0
```

Hint:  
Use the Chain rule first, then use the tangent formula with the gradient and point.

Worked solution:  
(a)
\[
y=(3x-2)^2.
\]
Using the Chain rule,
\[
\frac{dy}{dx}=2(3x-2)\cdot3.
\]
So
\[
\frac{dy}{dx}=6(3x-2).
\]

(b) At \(x=2\),
\[
m=6(3(2)-2)=6(4)=24.
\]
Find the \(y\)-coordinate:
\[
y=(3(2)-2)^2=4^2=16.
\]
So the tangent passes through \((2,16)\) with gradient \(24\).

\[
y-16=24(x-2)
\]
\[
y-16=24x-48
\]
\[
y=24x-32.
\]

Common mistake:  
Finding the derivative correctly, but forgetting to substitute \(x=2\) to get the tangent gradient.

---

## Past Paper-style Questions — all questions together for skim

1. A curve has equation \(y=(2x-1)^3\). Find the equation of the tangent to the curve at the point where \(x=1\).  
2. A curve has equation \(y=(2x+1)^3\). Find the equation of the tangent to the curve at \(x=1\).  
3. A curve has equation \(y=(x^2+3)^2\). Find the equation of the tangent to the curve at \(x=2\).  
4. A curve has equation \(y=\sqrt{4x+5}\). Find the equation of the tangent to the curve at \(x=5\).  
5. A curve has equation \(y=(3x-2)^2\).  
(a) Find \(\frac{dy}{dx}\).  
(b) Find the equation of the tangent to the curve at \(x=2\).

## Import readiness checklist

Before this Tangents bank is imported into the active app data, every question should have the full STEM Forge fields:

- `id`
- `skillPathId`
- `stageId`
- `type`
- `marks`
- `questionText`
- `correctAnswer`
- `acceptedAnswers`
- `hint`
- `workedSolution`
- `commonMistake`
- `source` / original QS-style label

Every Tangents question is intended to be auto-marked. For multi-step questions, use structured answer fields instead of guided/self-mark mode. Do not use guided/self-mark mode for this Tangents bank.

Existing `acceptedAnswers` can be kept in the Markdown as reference, but the structured `answerFields` are the preferred import format for multi-step questions.

Do not import this content until:

- Foundations-tier Tangents questions are authored
- all hints are added
- all worked solutions are added
- all common mistakes are added
- LaTeX/formatting glitches are fixed
- accepted answers are reviewed
- final maths QA is complete
- dynamic skill path routing is ready or a deliberate temporary static route is accepted
- equation-form / line-equation marking capability exists for the tangent-equation field
- each question's conditional Chain Rule requirement is confirmed against its final structured answer fields

Import status:

- Content-bank draft: complete enough to store (Applications and Past Paper-style Questions tiers only)
- Learning-layer fields: present in Markdown draft
- App-ready data conversion: not yet
- Marking policy: every Tangents question is intended to be auto-marked
- Recommended marking mode for PPQs: auto-mark using structured answer fields for multi-step questions
- Current project priority: architecture, QA, and testing before content import

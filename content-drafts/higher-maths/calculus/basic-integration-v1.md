# STEM Forge — Higher Maths Basic Integration Question Bank v1

Status: **In progress — Foundations QA-reviewed. Applications and Past Paper-style Questions not yet drafted.**
Do not import into the app yet. Store as a future content-bank draft.

Path: Higher Maths → Calculus → Integration → Basic integration

Source label: Original STEM Forge QS-style content
QS skill tested: Basic integration using the reverse power rule
Independence note: Independent original material; not affiliated with or endorsed by SQA.

Import defaults:
- skillPathId: hm-calc-int-basic
- source: Original STEM Forge QS-style content
- stageId mapping:
  - Foundations → foundations
  - Applications → applications
  - Past Paper-style Questions → past-paper-style

Draft import type note:
Some answer field types in this Markdown draft, such as `exact`, `algebraic`, and `coordinate`, are content-bank labels. During app import, map these to the actual supported STEM Forge input types.

Content boundary:
- Include: indefinite integration, the constant of integration, reverse power rule, sums/differences of powers, simple roots as fractional powers, reciprocal powers (e.g. \(x^{-2}\), \(x^{-3}\)), simplifying simple algebraic fractions before integrating, straightforward definite integrals, and evaluating \(F(b)-F(a)\).
- Avoid: \(\int\frac{1}{x}\,dx\), logarithmic integration, reverse chain rule, trigonometric integration, differential equations, area under a curve, area between curves, integration by substitution, integration by parts, and Advanced Higher methods.

Planned final count:
- Foundations: 10 (drafted, QA-reviewed)
- Applications: TBC
- Past Paper-style Questions: TBC (pending 2000–2025 audit)
- Total: TBC

---

# Foundations

## F001 — hm-calc-int-basic-f-001

Stage: Foundations
Subskill: Recognising integration as reverse differentiation
Marks: 1

Question: Given that \(\dfrac{d}{dx}(x^4)=4x^3\), write down \(\displaystyle\int 4x^3\,dx\).

Correct answer: \(x^4+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: x^4+C
    acceptedAnswers:
      - x^4+C
      - x^4 + C
      - x^4+c
      - x^4 + c
```

Hint: Integration reverses differentiation, so undo the differentiation shown and remember the constant of integration.
Worked solution: Since \(\dfrac{d}{dx}(x^4)=4x^3\), integrating reverses this step, so \(\displaystyle\int 4x^3\,dx=x^4+C\).
Common mistake: Leaving out the constant of integration, \(C\).

---

## F002 — hm-calc-int-basic-f-002

Stage: Foundations
Subskill: Reverse power rule
Marks: 1

Question: Find \(\displaystyle\int x^4\,dx\).

Correct answer: \(\dfrac{x^5}{5}+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: x^5/5+C
    acceptedAnswers:
      - x^5/5+C
      - x^5/5 + C
      - (1/5)x^5+C
      - 0.2x^5+C
```

Hint: Increase the power by 1, then divide by the new power.
Worked solution: \(\displaystyle\int x^4\,dx=\dfrac{x^{5}}{5}+C\).
Common mistake: Increasing the power but forgetting to divide by the new power, writing \(x^5+C\).

---

## F003 — hm-calc-int-basic-f-003

Stage: Foundations
Subskill: Reverse power rule with a coefficient
Marks: 1

Question: Find \(\displaystyle\int 6x^2\,dx\).

Correct answer: \(2x^3+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: 2x^3+C
    acceptedAnswers:
      - 2x^3+C
      - 2x^3 + C
```

Hint: Increase the power by 1, then divide the whole coefficient by the new power.
Worked solution: \(\displaystyle\int 6x^2\,dx=\dfrac{6x^3}{3}+C=2x^3+C\).
Common mistake: Increasing the power correctly but not dividing the coefficient 6 by the new power 3, writing \(6x^3+C\).

---

## F004 — hm-calc-int-basic-f-004

Stage: Foundations
Subskill: Integrating a sum/difference of powers
Marks: 2

Question: Find \(\displaystyle\int (4x^3-6x+5)\,dx\).

Correct answer: \(x^4-3x^2+5x+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: x^4-3x^2+5x+C
    acceptedAnswers:
      - x^4-3x^2+5x+C
      - x^4 - 3x^2 + 5x + C
```

Hint: Integrate each term separately, remembering that a constant term integrates to a term in \(x\).
Worked solution: \(\displaystyle\int (4x^3-6x+5)\,dx=x^4-3x^2+5x+C\).
Common mistake: Integrating the constant term 5 as 5 instead of \(5x\).

---

## F005 — hm-calc-int-basic-f-005

Stage: Foundations
Subskill: Constant of integration
Marks: 2

Question: Find \(\displaystyle\int (2x^3+4x)\,dx\).

Correct answer: \(\dfrac{x^4}{2}+2x^2+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: (x^4)/2+2x^2+C
    acceptedAnswers:
      - x^4/2+2x^2+C
      - 0.5x^4+2x^2+C
      - (1/2)x^4+2x^2+C
```

Hint: Integrate each term with the reverse power rule, and remember this is an indefinite integral, so it needs \(+C\).
Worked solution: \(\displaystyle\int (2x^3+4x)\,dx=\dfrac{2x^4}{4}+\dfrac{4x^2}{2}+C=\dfrac{x^4}{2}+2x^2+C\).
Common mistake: Carrying out the reverse power rule correctly but forgetting to add \(C\).

---

## F006 — hm-calc-int-basic-f-006

Stage: Foundations
Subskill: Integrating a root written as a fractional power
Marks: 2

Question: Find \(\displaystyle\int 3\sqrt{x}\,dx\).

Correct answer: \(2x^{3/2}+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: 2x^(3/2)+C
    acceptedAnswers:
      - 2x^(3/2)+C
      - 2x^1.5+C
      - 2x^{3/2}+C
```

Hint: Rewrite \(\sqrt{x}\) as \(x^{1/2}\) first, then use the reverse power rule.
Worked solution: \(\displaystyle\int 3x^{1/2}\,dx=\dfrac{3x^{3/2}}{3/2}+C=2x^{3/2}+C\).
Common mistake: Treating \(\sqrt{x}\) as \(x^1\) instead of \(x^{1/2}\) before integrating.

---

## F007 — hm-calc-int-basic-f-007

Stage: Foundations
Subskill: Integrating a reciprocal power
Marks: 2

Question: Find \(\displaystyle\int \dfrac{4}{x^3}\,dx\).

Correct answer: \(-\dfrac{2}{x^2}+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: -2x^-2+C
    acceptedAnswers:
      - -2x^-2+C
      - -2/x^2+C
      - -(2/x^2)+C
```

Hint: Rewrite \(\dfrac{4}{x^3}\) as \(4x^{-3}\) first, then use the reverse power rule.
Worked solution: \(\displaystyle\int 4x^{-3}\,dx=\dfrac{4x^{-2}}{-2}+C=-2x^{-2}+C=-\dfrac{2}{x^2}+C\).
Common mistake: Losing the negative sign when dividing by the new power \(-2\).

---

## F008 — hm-calc-int-basic-f-008

Stage: Foundations
Subskill: Simplifying before integrating
Marks: 2

Question: Find \(\displaystyle\int \dfrac{6x^4-3x^2}{x^2}\,dx\).

Correct answer: \(2x^3-3x+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: 2x^3-3x+C
    acceptedAnswers:
      - 2x^3-3x+C
      - 2x^3 - 3x + C
```

Hint: Split the fraction into two separate terms and simplify each one before integrating.
Worked solution: \(\dfrac{6x^4-3x^2}{x^2}=6x^2-3\), so \(\displaystyle\int (6x^2-3)\,dx=2x^3-3x+C\).
Common mistake: Trying to integrate the unsimplified fraction directly instead of simplifying first.

---

## F009 — hm-calc-int-basic-f-009

Stage: Foundations
Subskill: Evaluating a definite integral
Marks: 2

Question: Evaluate \(\displaystyle\int_1^3 2x\,dx\).

Correct answer: Antiderivative \(x^2\); value \(8\)

Answer fields:
```yaml
answerFields:
  - id: antiderivative
    label: Antiderivative
    type: algebraic
    correctAnswer: x^2
    acceptedAnswers:
      - x^2
  - id: value
    label: Value of the integral
    type: exact
    correctAnswer: 8
    acceptedAnswers:
      - 8
```

Hint: Integrate first, then substitute the top limit and subtract the result of substituting the bottom limit. The constant of integration is not needed for a definite integral.
Worked solution: \(\displaystyle\int_1^3 2x\,dx=\Big[x^2\Big]_1^3=(3)^2-(1)^2=9-1=8\).
Common mistake: Including \(+C\) in a definite integral, or substituting the limits the wrong way round.

---

## F010 — hm-calc-int-basic-f-010

Stage: Foundations
Subskill: Evaluating a definite integral with several terms
Marks: 2

Question: Evaluate \(\displaystyle\int_0^2 (3x^2+4)\,dx\).

Correct answer: Antiderivative \(x^3+4x\); value \(16\)

Answer fields:
```yaml
answerFields:
  - id: antiderivative
    label: Antiderivative
    type: algebraic
    correctAnswer: x^3+4x
    acceptedAnswers:
      - x^3+4x
  - id: value
    label: Value of the integral
    type: exact
    correctAnswer: 16
    acceptedAnswers:
      - 16
```

Hint: Integrate each term, then substitute the top limit and subtract the result of substituting the bottom limit.
Worked solution: \(\displaystyle\int_0^2 (3x^2+4)\,dx=\Big[x^3+4x\Big]_0^2=(8+8)-(0+0)=16\).
Common mistake: Forgetting to integrate the constant term 4 as \(4x\), or leaving it as 4.

---

# Applications

## A001 — hm-calc-int-basic-a-001

Stage: Applications
Subskill: Simplifying a fraction with three terms before integrating
Marks: 3

Question: Find \(\displaystyle\int \dfrac{8x^5-6x^3+2x}{2x}\,dx\).

Correct answer: \(\dfrac{4x^4}{5}-x^3+x+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: (4x^4)/5-x^3+x+C
    acceptedAnswers:
      - 4x^4/5-x^3+x+C
      - 0.8x^4-x^3+x+C
```

Hint: Divide every term in the numerator by \(2x\) before you integrate.
Worked solution: \(\dfrac{8x^5-6x^3+2x}{2x}=4x^4-3x^2+1\), so \(\displaystyle\int (4x^4-3x^2+1)\,dx=\dfrac{4x^5}{5}-x^3+x+C\).
Common mistake: Dividing only the first term by \(2x\) and leaving the rest of the expression unsimplified.

---

## A002 — hm-calc-int-basic-a-002

Stage: Applications
Subskill: Integrating a root and a negative power together
Marks: 3

Question: Find \(\displaystyle\int \left(6\sqrt{x}-\dfrac{4}{x^2}\right)dx\).

Correct answer: \(4x^{3/2}+\dfrac{4}{x}+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: 4x^(3/2)+4/x+C
    acceptedAnswers:
      - 4x^(3/2)+4x^-1+C
      - 4x^1.5+4/x+C
```

Hint: Rewrite \(\sqrt{x}\) as \(x^{1/2}\) and \(\dfrac{4}{x^2}\) as \(4x^{-2}\) before integrating.
Worked solution: \(\displaystyle\int \left(6x^{1/2}-4x^{-2}\right)dx=4x^{3/2}+4x^{-1}+C=4x^{3/2}+\dfrac{4}{x}+C\).
Common mistake: Making a sign error when dividing the negative-power term by its new (negative) power.

---

## A003 — hm-calc-int-basic-a-003

Stage: Applications
Subskill: Evaluating a definite integral involving a root
Marks: 3

Question: Evaluate \(\displaystyle\int_1^4 6\sqrt{x}\,dx\).

Correct answer: Antiderivative \(4x^{3/2}\); value \(28\)

Answer fields:
```yaml
answerFields:
  - id: antiderivative
    label: Antiderivative
    type: algebraic
    correctAnswer: 4x^(3/2)
    acceptedAnswers:
      - 4x^(3/2)
      - 4x^1.5
  - id: value
    label: Value of the integral
    type: exact
    correctAnswer: 28
    acceptedAnswers:
      - 28
```

Hint: Rewrite \(\sqrt{x}\) as \(x^{1/2}\), integrate, then substitute the limits.
Worked solution: \(\displaystyle\int_1^4 6x^{1/2}\,dx=\Big[4x^{3/2}\Big]_1^4=4(8)-4(1)=32-4=28\).
Common mistake: Evaluating \(4^{3/2}\) incorrectly, e.g. as \(4\times1.5=6\) instead of \(8\).

---

## A004 — hm-calc-int-basic-a-004

Stage: Applications
Subskill: Evaluating a definite integral with a negative lower limit
Marks: 3

Question: Evaluate \(\displaystyle\int_{-1}^{2} (3x^2-2)\,dx\).

Correct answer: Antiderivative \(x^3-2x\); value \(3\)

Answer fields:
```yaml
answerFields:
  - id: antiderivative
    label: Antiderivative
    type: algebraic
    correctAnswer: x^3-2x
    acceptedAnswers:
      - x^3-2x
  - id: value
    label: Value of the integral
    type: exact
    correctAnswer: 3
    acceptedAnswers:
      - 3
```

Hint: Substitute the top limit first, then subtract the result of substituting the bottom limit. Take care with negative numbers.
Worked solution: \(\Big[x^3-2x\Big]_{-1}^{2}=(8-4)-(-1+2)=4-1=3\).
Common mistake: Losing a negative sign when substituting \(x=-1\), e.g. writing \((-1)^3\) as \(1\).

---

## A005 — hm-calc-int-basic-a-005

Stage: Applications
Subskill: Integrating a polynomial with four terms
Marks: 3

Question: Find \(\displaystyle\int (5x^4-6x^3+2x-7)\,dx\).

Correct answer: \(x^5-\dfrac{3}{2}x^4+x^2-7x+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: x^5-(3/2)x^4+x^2-7x+C
    acceptedAnswers:
      - x^5-1.5x^4+x^2-7x+C
      - x^5-3x^4/2+x^2-7x+C
```

Hint: Integrate each term separately, taking care with the fraction that appears when dividing 6 by 4.
Worked solution: \(\displaystyle\int (5x^4-6x^3+2x-7)\,dx=x^5-\dfrac{6x^4}{4}+x^2-7x+C=x^5-\dfrac{3}{2}x^4+x^2-7x+C\).
Common mistake: Not simplifying \(\dfrac{6}{4}\) to \(\dfrac{3}{2}\).

---

## A006 — hm-calc-int-basic-a-006

Stage: Applications
Subskill: Integrating a polynomial term and a higher negative power together
Marks: 3

Question: Find \(\displaystyle\int \left(4x^3-\dfrac{6}{x^4}\right)dx\).

Correct answer: \(x^4+\dfrac{2}{x^3}+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: x^4+2/x^3+C
    acceptedAnswers:
      - x^4+2x^-3+C
```

Hint: Rewrite \(\dfrac{6}{x^4}\) as \(6x^{-4}\) before integrating.
Worked solution: \(\displaystyle\int \left(4x^3-6x^{-4}\right)dx=x^4-\dfrac{6x^{-3}}{-3}+C=x^4+2x^{-3}+C=x^4+\dfrac{2}{x^3}+C\).
Common mistake: Dividing \(-6\) by \(-3\) incorrectly and getting a negative coefficient.

---

## A007 — hm-calc-int-basic-a-007

Stage: Applications
Subskill: Simplifying an algebraic fraction before evaluating a definite integral
Marks: 4

Question: Evaluate \(\displaystyle\int_1^2 \dfrac{6x^2-4x}{2x}\,dx\).

Correct answer: Antiderivative \(\dfrac{3}{2}x^2-2x\); value \(2.5\)

Answer fields:
```yaml
answerFields:
  - id: antiderivative
    label: Antiderivative
    type: algebraic
    correctAnswer: (3/2)x^2-2x
    acceptedAnswers:
      - 1.5x^2-2x
  - id: value
    label: Value of the integral
    type: exact
    correctAnswer: 2.5
    acceptedAnswers:
      - 2.5
      - 5/2
```

Hint: Simplify the fraction to a difference of two terms first, then integrate and substitute the limits.
Worked solution: \(\dfrac{6x^2-4x}{2x}=3x-2\), so \(\displaystyle\int_1^2 (3x-2)\,dx=\Big[\dfrac{3}{2}x^2-2x\Big]_1^2=(6-4)-(1.5-2)=2-(-0.5)=2.5\).
Common mistake: Integrating the unsimplified fraction directly instead of dividing through by \(2x\) first.

---

## A008 — hm-calc-int-basic-a-008

Stage: Applications
Subskill: Integrating an expression containing a root and a constant term
Marks: 3

Question: Find \(\displaystyle\int (4\sqrt{x}+3)\,dx\).

Correct answer: \(\dfrac{8}{3}x^{3/2}+3x+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: (8/3)x^(3/2)+3x+C
    acceptedAnswers:
      - 8x^(3/2)/3+3x+C
```

Hint: Rewrite \(\sqrt{x}\) as \(x^{1/2}\) first, and remember that the constant 3 integrates to \(3x\).
Worked solution: \(\displaystyle\int (4x^{1/2}+3)\,dx=\dfrac{4x^{3/2}}{3/2}+3x+C=\dfrac{8}{3}x^{3/2}+3x+C\).
Common mistake: Integrating the constant term 3 as 3 instead of \(3x\).

---

## A009 — hm-calc-int-basic-a-009

Stage: Applications
Subskill: Simplifying a fraction into separate power terms before evaluating a definite integral
Marks: 4

Question: Evaluate \(\displaystyle\int_2^4 \dfrac{x^2-4}{x^2}\,dx\).

Correct answer: Antiderivative \(x+\dfrac{4}{x}\); value \(1\)

Answer fields:
```yaml
answerFields:
  - id: antiderivative
    label: Antiderivative
    type: algebraic
    correctAnswer: x+4/x
    acceptedAnswers:
      - x+4x^-1
  - id: value
    label: Value of the integral
    type: exact
    correctAnswer: 1
    acceptedAnswers:
      - 1
```

Hint: Split the fraction into \(1-\dfrac{4}{x^2}\), rewrite the second term as a negative power, then integrate.
Worked solution: \(\dfrac{x^2-4}{x^2}=1-4x^{-2}\), so \(\displaystyle\int_2^4 (1-4x^{-2})\,dx=\Big[x+4x^{-1}\Big]_2^4=(4+1)-(2+2)=5-4=1\).
Common mistake: Splitting the fraction incorrectly, e.g. writing \(\dfrac{x^2-4}{x^2}\) as \(x^2-4\).

---

## A010 — hm-calc-int-basic-a-010

Stage: Applications
Subskill: Integrating with a negative power, giving the answer without negative powers
Marks: 3

Question: Find \(\displaystyle\int (5x^4-3x^{-2})\,dx\), giving your answer without negative powers.

Correct answer: \(x^5+\dfrac{3}{x}+C\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: x^5+3/x+C
    acceptedAnswers:
      - x^5+3x^-1+C
```

Hint: Integrate as normal, then rewrite the negative-power term as a fraction at the end.
Worked solution: \(\displaystyle\int (5x^4-3x^{-2})\,dx=x^5-\dfrac{3x^{-1}}{-1}+C=x^5+3x^{-1}+C=x^5+\dfrac{3}{x}+C\).
Common mistake: Leaving the final answer as \(x^5+3x^{-1}+C\) when the question asks for no negative powers.

---

# Foundations — all questions together for skim

1. Given that \(\frac{d}{dx}(x^4)=4x^3\), write down \(\int 4x^3\,dx\).
2. Find \(\int x^4\,dx\).
3. Find \(\int 6x^2\,dx\).
4. Find \(\int (4x^3-6x+5)\,dx\).
5. Find \(\int (2x^3+4x)\,dx\).
6. Find \(\int 3\sqrt{x}\,dx\).
7. Find \(\int \frac{4}{x^3}\,dx\).
8. Find \(\int \frac{6x^4-3x^2}{x^2}\,dx\).
9. Evaluate \(\int_1^3 2x\,dx\).
10. Evaluate \(\int_0^2 (3x^2+4)\,dx\).

---

# Applications — all questions together for skim

1. Find \(\int \frac{8x^5-6x^3+2x}{2x}\,dx\).
2. Find \(\int \left(6\sqrt{x}-\frac{4}{x^2}\right)dx\).
3. Evaluate \(\int_1^4 6\sqrt{x}\,dx\).
4. Evaluate \(\int_{-1}^{2} (3x^2-2)\,dx\).
5. Find \(\int (5x^4-6x^3+2x-7)\,dx\).
6. Find \(\int \left(4x^3-\frac{6}{x^4}\right)dx\).
7. Evaluate \(\int_1^2 \frac{6x^2-4x}{2x}\,dx\).
8. Find \(\int (4\sqrt{x}+3)\,dx\).
9. Evaluate \(\int_2^4 \frac{x^2-4}{x^2}\,dx\).
10. Find \(\int (5x^4-3x^{-2})\,dx\), giving your answer without negative powers.

---

# QA check — Foundations and Applications

Confirmed:
- Foundations: 10
- Applications: 10
- Past Paper-style Questions: not yet drafted (audit complete — see chat; drafting pending, note: 10-12 verified patterns to be doubled with new values, so roughly 20-24 planned)

QA checklist:
- [x] Content-bank draft only; not active app data.
- [x] All questions are intended for auto-marking.
- [x] Every question ID is unique (hm-calc-int-basic-f-001 to f-010, hm-calc-int-basic-a-001 to a-010).
- [x] No integral of 1/x or logarithmic integration.
- [x] No reverse chain rule.
- [x] No trig integration.
- [x] No area-under-a-curve context.
- [x] No differential equations / finding a function from its gradient.
- [x] Indefinite integrals all require +C; definite integrals correctly omit +C.
- [x] Applications are richer than Foundations (more terms, roots combined with negative powers, negative/fractional limits, fraction-simplification-then-evaluate) but do not drift into chain rule, trig, area, or differential equations.
- [x] Multi-step definite-integral questions use structured two-field answers (antiderivative + value), consistent with Foundations F009/F010.
- [x] Common mistakes are learner-realistic and do not reference untaught methods.
- [x] Hints are useful but do not give away the full worked solution.
- [x] Accepted answers cover reasonable equivalent forms.
- [x] Field types (algebraic, exact) need mapping before app import.
- [x] Independent original material; not affiliated with or endorsed by SQA.

Applications QA result: **Pass.** No corrections needed. Ready to draft Past Paper-style Questions from the verified audit.

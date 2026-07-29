# STEM Forge — Higher Maths Basic Differentiation Question Bank v1

Status: **QA-reviewed auto-mark content-bank draft with structured answer fields**  
Do not import into the app yet. Store as a future content-bank draft.

Path: Higher Maths → Calculus → Differentiation → Basic differentiation

Source label: Original STEM Forge QS-style content  
QS skill tested: Basic differentiation using the power rule  
Independence note: Independent original material; not affiliated with or endorsed by SQA.

Import defaults:
- skillPathId: hm-calc-diff-basic
- source: Original STEM Forge QS-style content
- stageId mapping:
  - Foundations → foundations
  - Applications → applications
  - Past Paper-style Questions → past-paper-style

Draft import type note:
Some answer field types in this Markdown draft, such as `exact`, `algebraic`, and `coordinate`, are content-bank labels. During app import, map these to the actual supported STEM Forge input types.

Content boundary:
- Include: power rule, constants, sums/differences of powers, square roots as \(x^{1/2}\), simple reciprocals as \(x^{-1}\), simplifying simple algebraic expressions before differentiating, gradients at a point, tangent equations, unknown coefficient from a gradient, and tangent parallel to a line.
- Avoid: chain rule, product rule, quotient rule, second derivative method, stationary point nature, optimisation, trig differentiation, implicit differentiation, and learner-facing references to out-of-spec methods.

Final count:
- Foundations: 10
- Applications: 10
- Past Paper-style Questions: 30
- Total: 50

---

# Foundations

## F001 — hm-calc-diff-basic-f-001

Stage: Foundations  
Subskill: Differentiating \(x^n\)  
Marks: 1

Question: Differentiate \(y=x^5\) with respect to \(x\).

Correct answer: \(5x^4\)

Answer fields:
```yaml
answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: 5x^4
```

Hint: Bring the power down, then reduce the power by 1.  
Worked solution: \(\frac{d}{dx}(x^5)=5x^4\).  
Common mistake: Writing \(5x^5\). The power should reduce by 1.

---

## F002 — hm-calc-diff-basic-f-002

Stage: Foundations  
Subskill: Differentiating \(kx^n\)  
Marks: 1

Question: Differentiate \(y=4x^3\) with respect to \(x\).

Correct answer: \(12x^2\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 12x^2
```

Hint: Multiply the coefficient by the power.  
Worked solution: \(\frac{dy}{dx}=4\cdot3x^2=12x^2\).  
Common mistake: Forgetting the coefficient 4 and writing \(3x^2\).

---

## F003 — hm-calc-diff-basic-f-003

Stage: Foundations  
Subskill: Differentiating a sum of powers  
Marks: 2

Question: Differentiate \(y=3x^4-5x^2+7\) with respect to \(x\).

Correct answer: \(12x^3-10x\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 12x^3-10x
```

Hint: Differentiate each term separately.  
Worked solution: \(\frac{dy}{dx}=12x^3-10x+0=12x^3-10x\).  
Common mistake: Differentiating the constant 7 as 7 instead of 0.

---

## F004 — hm-calc-diff-basic-f-004

Stage: Foundations  
Subskill: Differentiating with a constant term  
Marks: 1

Question: Differentiate \(y=6x^2-8\) with respect to \(x\).

Correct answer: \(12x\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 12x
```

Hint: The derivative of a constant is 0.  
Worked solution: \(\frac{dy}{dx}=12x\).  
Common mistake: Keeping the \(-8\) in the derivative.

---

## F005 — hm-calc-diff-basic-f-005

Stage: Foundations  
Subskill: Differentiating a negative power  
Marks: 2

Question: Differentiate \(y=x^{-3}\) with respect to \(x\).

Correct answer: \(-3x^{-4}\), or \(-\frac{3}{x^4}\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: -3x^-4
```

Hint: Bring down the power \(-3\), then reduce the power by 1.  
Worked solution: \(\frac{dy}{dx}=-3x^{-4}=-\frac{3}{x^4}\).  
Common mistake: Changing the power from \(-3\) to \(-2\).

---

## F006 — hm-calc-diff-basic-f-006

Stage: Foundations  
Subskill: Differentiating a fractional power  
Marks: 2

Question: Differentiate \(y=x^{1/2}\) with respect to \(x\).

Correct answer: \(\frac12x^{-1/2}\), or \(\frac{1}{2\sqrt{x}}\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: (1/2)x^(-1/2)
```

Hint: Bring down the power \(\frac12\), then subtract 1 from the power.  
Worked solution: \(\frac{dy}{dx}=\frac12x^{1/2-1}=\frac12x^{-1/2}\).  
Common mistake: Writing \(\frac12x^{1/2}\). The power must reduce by 1.

---

## F007 — hm-calc-diff-basic-f-007

Stage: Foundations  
Subskill: Rewriting a square root as a power  
Marks: 1

Question: Write \(\sqrt{x}\) as a power of \(x\).

Correct answer: \(x^{1/2}\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: x^(1/2)
```

Hint: A square root is the same as a power of \(\frac12\).  
Worked solution: \(\sqrt{x}=x^{1/2}\).  
Common mistake: Writing \(x^2\).

---

## F008 — hm-calc-diff-basic-f-008

Stage: Foundations  
Subskill: Rewriting a reciprocal as a negative power  
Marks: 1

Question: Write \(\frac{1}{x^2}\) as a power of \(x\).

Correct answer: \(x^{-2}\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: x^-2
```

Hint: Moving a power from the denominator to the numerator changes the sign of the power.  
Worked solution: \(\frac{1}{x^2}=x^{-2}\).  
Common mistake: Writing \(x^2\).

---

## F009 — hm-calc-diff-basic-f-009

Stage: Foundations  
Subskill: Differentiating after rewriting a reciprocal power  
Marks: 3

Question: Differentiate \(y=\frac{4}{x^3}\) with respect to \(x\).

Correct answer: \(-12x^{-4}\), or \(-\frac{12}{x^4}\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: 4x^-3
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: -12x^-4
```

Hint: Rewrite \(\frac{4}{x^3}\) as \(4x^{-3}\).  
Worked solution: \(y=4x^{-3}\), so \(\frac{dy}{dx}=4(-3)x^{-4}=-12x^{-4}\).  
Common mistake: Writing \(4x^3\) before differentiating.

---

## F010 — hm-calc-diff-basic-f-010

Stage: Foundations  
Subskill: Differentiating roots and reciprocal powers  
Marks: 3

Question: Differentiate \(y=3\sqrt{x}-\frac{2}{x}\) with respect to \(x\).

Correct answer: \(\frac32x^{-1/2}+2x^{-2}\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: 3x^(1/2)-2x^-1
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: (3/2)x^(-1/2)+2x^-2
```

Hint: Rewrite \(\sqrt{x}\) as \(x^{1/2}\) and \(\frac{2}{x}\) as \(2x^{-1}\).  
Worked solution: \(y=3x^{1/2}-2x^{-1}\), so \(\frac{dy}{dx}=\frac32x^{-1/2}+2x^{-2}\).  
Common mistake: Differentiating \(-2x^{-1}\) as \(-2x^{-2}\).

---

# Applications

## A001 — hm-calc-diff-basic-a-001

Stage: Applications  
Subskill: Differentiating a polynomial  
Marks: 2

Question: Differentiate \(y=5x^4-3x^2+6x-1\) with respect to \(x\).

Correct answer: \(20x^3-6x+6\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 20x^3-6x+6
```

Hint: Differentiate each term separately.  
Worked solution: \(\frac{dy}{dx}=20x^3-6x+6\).  
Common mistake: Forgetting that the derivative of \(6x\) is \(6\), not \(6x\).

---

## A002 — hm-calc-diff-basic-a-002

Stage: Applications  
Subskill: Differentiating a simple reciprocal term  
Marks: 3

Question: Differentiate \(y=4x^3+\frac{6}{x}\) with respect to \(x\).

Correct answer: \(12x^2-\frac{6}{x^2}\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: 4x^3+6x^-1
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 12x^2-6/x^2
```

Hint: Rewrite \(\frac{6}{x}\) as \(6x^{-1}\).  
Worked solution: \(y=4x^3+6x^{-1}\), so \(\frac{dy}{dx}=12x^2-6x^{-2}=12x^2-\frac{6}{x^2}\).  
Common mistake: Forgetting the negative sign when differentiating \(6x^{-1}\).

---

## A003 — hm-calc-diff-basic-a-003

Stage: Applications  
Subskill: Differentiating a polynomial with a reciprocal term  
Marks: 3

Question: Differentiate \(y=7x^3-2x+\frac{5}{x}\) with respect to \(x\).

Correct answer: \(21x^2-2-\frac{5}{x^2}\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: 7x^3-2x+5x^-1
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 21x^2-2-5/x^2
```

Hint: Rewrite \(\frac{5}{x}\) as \(5x^{-1}\).  
Worked solution: \(y=7x^3-2x+5x^{-1}\), so \(\frac{dy}{dx}=21x^2-2-5x^{-2}\).  
Common mistake: Writing the derivative of \(5x^{-1}\) as positive.

---

## A004 — hm-calc-diff-basic-a-004

Stage: Applications  
Subskill: Finding a gradient at a point  
Marks: 3

Question: A curve has equation \(y=x^3-4x+2\). Find the gradient of the curve at \(x=2\).

Correct answer: \(8\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2-4
  - id: gradient
    label: Gradient at x = 2
    type: exact
    correctAnswer: 8
```

Hint: Differentiate first, then substitute \(x=2\).  
Worked solution: \(\frac{dy}{dx}=3x^2-4\), so \(m=3(2)^2-4=8\).  
Common mistake: Substituting \(x=2\) into \(y\) instead of into \(\frac{dy}{dx}\).

---

## A005 — hm-calc-diff-basic-a-005

Stage: Applications  
Subskill: Finding a gradient at a point  
Marks: 3

Question: A curve has equation \(y=2x^4-3x^2+5\). Find the gradient of the curve at \(x=1\).

Correct answer: \(2\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 8x^3-6x
  - id: gradient
    label: Gradient at x = 1
    type: exact
    correctAnswer: 2
```

Hint: Differentiate first, then substitute \(x=1\).  
Worked solution: \(\frac{dy}{dx}=8x^3-6x\), so \(m=8(1)^3-6(1)=2\).  
Common mistake: Forgetting that the constant \(5\) disappears.

---

## A006 — hm-calc-diff-basic-a-006

Stage: Applications  
Subskill: Finding a tangent equation  
Marks: 5

Question: Find the equation of the tangent to \(y=x^3+2x\) at \(x=1\).

Correct answer: \(y=5x-2\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2+2
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 5
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (1,3)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=5x-2
```

Hint: Find the gradient using \(\frac{dy}{dx}\), then find the point.  
Worked solution: \(m=3(1)^2+2=5\), point \((1,3)\), so \(y-3=5(x-1)\) and \(y=5x-2\).  
Common mistake: Using \(x=1\) as the gradient.

---

## A007 — hm-calc-diff-basic-a-007

Stage: Applications  
Subskill: Finding a tangent equation  
Marks: 5

Question: Find the equation of the tangent to \(y=x^2+3x-1\) at \(x=2\).

Correct answer: \(y=7x-5\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 2x+3
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 7
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (2,9)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=7x-5
```

Hint: Find the gradient and the point on the curve.  
Worked solution: \(m=2(2)+3=7\), point \((2,9)\), so \(y-9=7(x-2)\) and \(y=7x-5\).  
Common mistake: Finding the gradient correctly but forgetting the \(y\)-coordinate.

---

## A008 — hm-calc-diff-basic-a-008

Stage: Applications  
Subskill: Differentiating a stronger polynomial  
Marks: 3

Question: Differentiate \(y=3x^4-5x^3+2x^2-7\) with respect to \(x\).

Correct answer: \(12x^3-15x^2+4x\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 12x^3-15x^2+4x
```

Hint: Differentiate each term separately.  
Worked solution: \(\frac{dy}{dx}=12x^3-15x^2+4x\).  
Common mistake: Keeping the \(-7\) in the derivative.

---

## A009 — hm-calc-diff-basic-a-009

Stage: Applications  
Subskill: Evaluating a derivative  
Marks: 4

Question: Given \(f(x)=x^4-4x^2+3x\), find \(f'(2)\).

Correct answer: \(19\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 4x^3-8x+3
  - id: derivative_value
    label: f'(2)
    type: exact
    correctAnswer: 19
```

Hint: Differentiate first, then substitute \(x=2\).  
Worked solution: \(f'(x)=4x^3-8x+3\), so \(f'(2)=32-16+3=19\).  
Common mistake: Substituting into \(f(x)\) instead of \(f'(x)\).

---

## A010 — hm-calc-diff-basic-a-010

Stage: Applications  
Subskill: Simplifying before differentiating  
Marks: 3

Question: Differentiate \(y=\frac{x^3+4x}{x}\) with respect to \(x\).

Correct answer: \(2x\)

Answer fields:
```yaml
answerFields:
  - id: simplified_form
    label: Simplified form
    type: algebraic
    correctAnswer: x^2+4
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 2x
```

Hint: Divide each term in the numerator by \(x\).  
Worked solution: \(y=x^2+4\), so \(\frac{dy}{dx}=2x\).  
Common mistake: Not dividing both terms in the numerator by \(x\).

---

# Past Paper-style Questions

## PPQ001 — hm-calc-diff-basic-ppq-001

Stage: Past Paper-style Questions  
Subskill: Direct polynomial differentiation  
Marks: 3

Question: Differentiate \(y=4x^5-3x^3+7x-2\) with respect to \(x\).

Correct answer: \(20x^4-9x^2+7\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 20x^4-9x^2+7
```

Hint: Differentiate each term separately.  
Worked solution: \(\frac{dy}{dx}=20x^4-9x^2+7\).  
Common mistake: Keeping the \(-2\) in the derivative.

---

## PPQ002 — hm-calc-diff-basic-ppq-002

Stage: Past Paper-style Questions  
Subskill: Simplifying before differentiating  
Marks: 4

Question: Differentiate \(y=\frac{3x^4-5x^2+2x}{x}\) with respect to \(x\).

Correct answer: \(9x^2-5\)

Answer fields:
```yaml
answerFields:
  - id: simplified_form
    label: Simplified form
    type: algebraic
    correctAnswer: 3x^3-5x+2
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 9x^2-5
```

Hint: Divide every term in the numerator by \(x\).  
Worked solution: \(y=3x^3-5x+2\), so \(\frac{dy}{dx}=9x^2-5\).  
Common mistake: Only dividing the first term by \(x\).

---

## PPQ003 — hm-calc-diff-basic-ppq-003

Stage: Past Paper-style Questions  
Subskill: Tangent equation to a cubic  
Marks: 5

Question: A curve has equation \(y=2x^3-5x+4\). Find the equation of the tangent at \(x=2\).

Correct answer: \(y=19x-28\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 6x^2-5
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 19
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (2,10)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=19x-28
```

Hint: Find the gradient from the derivative, then find the point.  
Worked solution: \(m=6(2)^2-5=19\), point \((2,10)\), so \(y-10=19(x-2)\) and \(y=19x-28\).  
Common mistake: Using the \(y\)-coordinate as the gradient.

---

## PPQ004 — hm-calc-diff-basic-ppq-004

Stage: Past Paper-style Questions  
Subskill: Finding \(f'(a)\) with a reciprocal term  
Marks: 5

Question: Given \(f(x)=3x^3-\frac{4}{x}+2\), find \(f'(2)\).

Correct answer: \(37\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: 3x^3-4x^-1+2
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 9x^2+4/x^2
  - id: derivative_value
    label: f'(2)
    type: exact
    correctAnswer: 37
```

Hint: Rewrite \(\frac{4}{x}\) as \(4x^{-1}\).  
Worked solution: \(f'(x)=9x^2+4x^{-2}=9x^2+\frac{4}{x^2}\), so \(f'(2)=36+1=37\).  
Common mistake: Differentiating \(-4x^{-1}\) as a negative term.

---

## PPQ005 — hm-calc-diff-basic-ppq-005

Stage: Past Paper-style Questions  
Subskill: Differentiating a square root term and finding a gradient  
Marks: 5

Question: A curve has equation \(y=3x^4-4\sqrt{x}+6\). Find the gradient at \(x=4\).

Correct answer: \(767\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: 3x^4-4x^(1/2)+6
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 12x^3-2/sqrt(x)
  - id: gradient
    label: Gradient at x = 4
    type: exact
    correctAnswer: 767
```

Hint: Rewrite \(\sqrt{x}\) as \(x^{1/2}\).  
Worked solution: \(\frac{dy}{dx}=12x^3-\frac{2}{\sqrt{x}}\), so at \(x=4\), \(m=12(64)-1=767\).  
Common mistake: Forgetting to multiply the coefficient by \(\frac12\).

---

## PPQ006 — hm-calc-diff-basic-ppq-006

Stage: Past Paper-style Questions  
Subskill: Unknown coefficient from a given gradient  
Marks: 5

Question: The curve \(y=3x^3+kx^2-4x\) has gradient \(8\) when \(x=1\). Find \(k\).

Correct answer: \(k=\frac32\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 9x^2+2kx-4
  - id: substituted_equation
    label: Equation using gradient
    type: algebraic
    correctAnswer: 9+2k-4=8
  - id: coefficient
    label: Value of k
    type: exact
    correctAnswer: 3/2
```

Hint: Differentiate, substitute \(x=1\), then set the derivative equal to 8.  
Worked solution: \(\frac{dy}{dx}=9x^2+2kx-4\). Then \(9+2k-4=8\), so \(k=\frac32\).  
Common mistake: Substituting into \(y\) instead of into \(\frac{dy}{dx}\).

---

## PPQ007 — hm-calc-diff-basic-ppq-007

Stage: Past Paper-style Questions  
Subskill: Tangent equation at a given point  
Marks: 5

Question: A curve has equation \(y=x^3-4x+1\). Find the tangent at \((2,1)\).

Correct answer: \(y=8x-15\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2-4
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 8
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=8x-15
```

Hint: The point is already given.  
Worked solution: \(m=3(2)^2-4=8\), so \(y-1=8(x-2)\) and \(y=8x-15\).  
Common mistake: Trying to find the \(y\)-coordinate again and making an arithmetic error.

---

## PPQ008 — hm-calc-diff-basic-ppq-008

Stage: Past Paper-style Questions  
Subskill: Mixed differentiation with roots and reciprocals  
Marks: 5

Question: Differentiate \(y=4x^5-3x^3+2\sqrt{x}-\frac{6}{x}\) with respect to \(x\).

Correct answer: \(20x^4-9x^2+\frac{1}{\sqrt{x}}+\frac{6}{x^2}\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: 4x^5-3x^3+2x^(1/2)-6x^-1
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 20x^4-9x^2+1/sqrt(x)+6/x^2
```

Hint: Rewrite \(\sqrt{x}\) as \(x^{1/2}\) and \(\frac{6}{x}\) as \(6x^{-1}\).  
Worked solution: Differentiate term by term to get \(20x^4-9x^2+x^{-1/2}+6x^{-2}\), then rewrite.  
Common mistake: Forgetting that differentiating \(-6x^{-1}\) gives a positive term.

---

## PPQ009 — hm-calc-diff-basic-ppq-009

Stage: Past Paper-style Questions  
Subskill: Unknown coefficient from a given gradient  
Marks: 5

Question: The curve \(y=x^3+kx^2-5x\) has gradient \(7\) when \(x=2\). Find \(k\).

Correct answer: \(k=0\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2+2kx-5
  - id: substituted_equation
    label: Equation using gradient
    type: algebraic
    correctAnswer: 12+4k-5=7
  - id: coefficient
    label: Value of k
    type: exact
    correctAnswer: 0
```

Hint: Differentiate, substitute \(x=2\), and set the derivative equal to 7.  
Worked solution: \(\frac{dy}{dx}=3x^2+2kx-5\). Then \(12+4k-5=7\), so \(k=0\).  
Common mistake: Using the point on the curve instead of the gradient condition.

---

## PPQ010 — hm-calc-diff-basic-ppq-010

Stage: Past Paper-style Questions  
Subskill: Unknown coefficient from a parallel tangent  
Marks: 5

Question: The curve \(y=x^3+kx+4\) has a tangent at \(x=2\) which is parallel to \(y=15x-3\). Find \(k\).

Correct answer: \(k=3\)

Answer fields:
```yaml
answerFields:
  - id: line_gradient
    label: Gradient of given line
    type: exact
    correctAnswer: 15
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2+k
  - id: substituted_equation
    label: Equation using parallel gradient
    type: algebraic
    correctAnswer: 12+k=15
  - id: coefficient
    label: Value of k
    type: exact
    correctAnswer: 3
```

Hint: Parallel lines have the same gradient.  
Worked solution: The line has gradient 15. \(\frac{dy}{dx}=3x^2+k\), so \(12+k=15\) and \(k=3\).  
Common mistake: Using \(-3\) from the line equation as the gradient.

---

## PPQ011 — hm-calc-diff-basic-ppq-011

Stage: Past Paper-style Questions  
Subskill: Simplifying before differentiating  
Marks: 4

Question: Differentiate \(y=\frac{4x^4-x^2+6x}{2x}\) with respect to \(x\).

Correct answer: \(6x^2-\frac12\)

Answer fields:
```yaml
answerFields:
  - id: simplified_form
    label: Simplified form
    type: algebraic
    correctAnswer: 2x^3-x/2+3
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 6x^2-1/2
```

Hint: Divide every term in the numerator by \(2x\).  
Worked solution: \(y=2x^3-\frac{x}{2}+3\), so \(\frac{dy}{dx}=6x^2-\frac12\).  
Common mistake: Dividing only the first term by \(2x\).

---

## PPQ012 — hm-calc-diff-basic-ppq-012

Stage: Past Paper-style Questions  
Subskill: Finding \(f'(a)\) for a polynomial  
Marks: 4

Question: Given \(f(x)=x^4-3x^2+5x\), find \(f'(2)\).

Correct answer: \(25\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 4x^3-6x+5
  - id: derivative_value
    label: f'(2)
    type: exact
    correctAnswer: 25
```

Hint: Differentiate first, then substitute \(x=2\).  
Worked solution: \(f'(x)=4x^3-6x+5\), so \(f'(2)=32-12+5=25\).  
Common mistake: Substituting into \(f(x)\) instead of \(f'(x)\).

---

## PPQ013 — hm-calc-diff-basic-ppq-013

Stage: Past Paper-style Questions  
Subskill: Tangent equation with a quartic  
Marks: 6

Question: A curve has equation \(y=x^4+2x^2-3x+1\). Find the tangent at \(x=1\).

Correct answer: \(y=5x-4\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 4x^3+4x-3
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 5
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (1,1)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=5x-4
```

Hint: Find the gradient using the derivative, then find the point.  
Worked solution: \(m=4+4-3=5\), point \((1,1)\), so \(y-1=5(x-1)\) and \(y=5x-4\).  
Common mistake: Using \(x=1\) as the gradient.

---

## PPQ014 — hm-calc-diff-basic-ppq-014

Stage: Past Paper-style Questions  
Subskill: Tangent equation at a negative \(x\)-value  
Marks: 6

Question: A curve has equation \(y=x^3+3x^2-2x+5\). Find the tangent at \(x=-1\).

Correct answer: \(y=-5x+4\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2+6x-2
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: -5
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (-1,9)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=-5x+4
```

Hint: Be careful when substituting \(x=-1\).  
Worked solution: \(m=3(-1)^2+6(-1)-2=-5\), point \((-1,9)\), so \(y-9=-5(x+1)\) and \(y=-5x+4\).  
Common mistake: Losing the negative sign when substituting \(x=-1\).

---

## PPQ015 — hm-calc-diff-basic-ppq-015

Stage: Past Paper-style Questions  
Subskill: Simplifying before finding a tangent  
Marks: 6

Question: A curve has equation \(y=\frac{2x^3+3x^2-4x}{x}\). Find the tangent at \(x=1\).

Correct answer: \(y=7x-6\)

Answer fields:
```yaml
answerFields:
  - id: simplified_form
    label: Simplified form
    type: algebraic
    correctAnswer: 2x^2+3x-4
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 4x+3
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 7
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (1,1)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=7x-6
```

Hint: Simplify the curve equation first, then differentiate.  
Worked solution: \(y=2x^2+3x-4\), so \(m=7\), point \((1,1)\), and \(y=7x-6\).  
Common mistake: Forgetting to simplify the expression before differentiating.

---

## PPQ016 — hm-calc-diff-basic-ppq-016

Stage: Past Paper-style Questions  
Subskill: Horizontal tangent equation  
Marks: 5

Question: A curve has equation \(y=x^3-3x+5\). Find the tangent at \(x=1\).

Correct answer: \(y=3\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2-3
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 0
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (1,3)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=3
```

Hint: A gradient of 0 means the tangent is horizontal.  
Worked solution: \(m=3(1)^2-3=0\), point \((1,3)\), so the tangent is \(y=3\).  
Common mistake: Thinking a gradient of 0 means there is no tangent.

---

## PPQ017 — hm-calc-diff-basic-ppq-017

Stage: Past Paper-style Questions  
Subskill: Tangent equation with negative gradient  
Marks: 6

Question: A curve has equation \(y=-x^3+2x^2+4\). Find the tangent at \(x=2\).

Correct answer: \(y=-4x+12\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: -3x^2+4x
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: -4
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (2,4)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=-4x+12
```

Hint: The gradient may be negative.  
Worked solution: \(m=-3(2)^2+4(2)=-4\), point \((2,4)\), so \(y-4=-4(x-2)\) and \(y=-4x+12\).  
Common mistake: Dropping the negative sign in the derivative of \(-x^3\).

---

## PPQ018 — hm-calc-diff-basic-ppq-018

Stage: Past Paper-style Questions  
Subskill: Tangent equation with answer in linear form  
Marks: 6

Question: A curve has equation \(y=3x^3-2x^2+x-4\). Find the tangent at \(x=1\).

Correct answer: \(y=6x-8\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 9x^2-4x+1
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 6
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (1,-2)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=6x-8
```

Hint: Find both the gradient and the point on the curve.  
Worked solution: \(m=6\), point \((1,-2)\), so \(y+2=6(x-1)\) and \(y=6x-8\).  
Common mistake: Forgetting that \(y+2\) is used because the point has \(y=-2\).

---

## PPQ019 — hm-calc-diff-basic-ppq-019

Stage: Past Paper-style Questions  
Subskill: Unknown coefficient from tangent parallel to a line  
Marks: 5

Question: The curve \(y=x^3+kx^2+2\) has a tangent at \(x=1\) parallel to \(4x-y+3=0\). Find \(k\).

Correct answer: \(k=\frac12\)

Answer fields:
```yaml
answerFields:
  - id: line_gradient
    label: Gradient of given line
    type: exact
    correctAnswer: 4
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2+2kx
  - id: substituted_equation
    label: Equation using parallel gradient
    type: algebraic
    correctAnswer: 3+2k=4
  - id: coefficient
    label: Value of k
    type: exact
    correctAnswer: 1/2
```

Hint: First rearrange the line to find its gradient.  
Worked solution: \(4x-y+3=0\Rightarrow y=4x+3\). Also \(\frac{dy}{dx}=3x^2+2kx\), so \(3+2k=4\) and \(k=\frac12\).  
Common mistake: Using the constant 3 from the line as the gradient.

---

## PPQ020 — hm-calc-diff-basic-ppq-020

Stage: Past Paper-style Questions  
Subskill: Direct differentiation with final form  
Marks: 4

Question: Differentiate \(y=7x^4-5x^2+\frac{3}{x}\), giving your answer without negative powers.

Correct answer: \(28x^3-10x-\frac{3}{x^2}\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: 7x^4-5x^2+3x^-1
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 28x^3-10x-3/x^2
```

Hint: Rewrite \(\frac{3}{x}\) as \(3x^{-1}\).  
Worked solution: \(y=7x^4-5x^2+3x^{-1}\), so \(\frac{dy}{dx}=28x^3-10x-3x^{-2}=28x^3-10x-\frac{3}{x^2}\).  
Common mistake: Forgetting to change \(x^{-2}\) back into \(\frac{1}{x^2}\).

---

## PPQ021 — hm-calc-diff-basic-ppq-021

Stage: Past Paper-style Questions  
Subskill: Simplifying before finding a gradient  
Marks: 5

Question: A curve has equation \(y=\frac{6x^4-4x^3+8x}{2x}\). Find the gradient at \(x=2\).

Correct answer: \(28\)

Answer fields:
```yaml
answerFields:
  - id: simplified_form
    label: Simplified form
    type: algebraic
    correctAnswer: 3x^3-2x^2+4
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 9x^2-4x
  - id: gradient
    label: Gradient at x = 2
    type: exact
    correctAnswer: 28
```

Hint: Simplify first by dividing each term in the numerator by \(2x\).  
Worked solution: \(y=3x^3-2x^2+4\), so \(\frac{dy}{dx}=9x^2-4x\) and \(m=36-8=28\).  
Common mistake: Substituting into \(y\) instead of into \(\frac{dy}{dx}\).

---

## PPQ022 — hm-calc-diff-basic-ppq-022

Stage: Past Paper-style Questions  
Subskill: Tangent equation at a given point  
Marks: 5

Question: A curve has equation \(y=x^3-6x+3\). Find the tangent at \((2,-1)\).

Correct answer: \(y=6x-13\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2-6
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 6
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=6x-13
```

Hint: The point is already given, so you only need to find the gradient.  
Worked solution: \(m=3(2)^2-6=6\), so \(y+1=6(x-2)\) and \(y=6x-13\).  
Common mistake: Forgetting that \(y+1\) is used because the point has \(y=-1\).

---

## PPQ023 — hm-calc-diff-basic-ppq-023

Stage: Past Paper-style Questions  
Subskill: Unknown coefficient from a given gradient  
Marks: 5

Question: The curve \(y=2x^3+kx^2+3x\) has gradient \(19\) when \(x=2\). Find \(k\).

Correct answer: \(k=-2\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 6x^2+2kx+3
  - id: substituted_equation
    label: Equation using gradient
    type: algebraic
    correctAnswer: 24+4k+3=19
  - id: coefficient
    label: Value of k
    type: exact
    correctAnswer: -2
```

Hint: Differentiate, substitute \(x=2\), then set the derivative equal to 19.  
Worked solution: \(\frac{dy}{dx}=6x^2+2kx+3\). Then \(24+4k+3=19\), so \(k=-2\).  
Common mistake: Using \(y=19\) instead of using the derivative.

---

## PPQ024 — hm-calc-diff-basic-ppq-024

Stage: Past Paper-style Questions  
Subskill: Unknown coefficient from a parallel tangent  
Marks: 6

Question: The curve \(y=x^3+kx^2-4x+1\) has a tangent at \(x=1\) parallel to \(2y-10x+3=0\). Find \(k\).

Correct answer: \(k=3\)

Answer fields:
```yaml
answerFields:
  - id: line_gradient
    label: Gradient of given line
    type: exact
    correctAnswer: 5
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2+2kx-4
  - id: substituted_equation
    label: Equation using parallel gradient
    type: algebraic
    correctAnswer: 3+2k-4=5
  - id: coefficient
    label: Value of k
    type: exact
    correctAnswer: 3
```

Hint: First rearrange the line to find its gradient.  
Worked solution: \(2y-10x+3=0\Rightarrow y=5x-\frac32\). Also \(\frac{dy}{dx}=3x^2+2kx-4\), so \(3+2k-4=5\) and \(k=3\).  
Common mistake: Using \(-10\) or 3 as the gradient.

---

## PPQ025 — hm-calc-diff-basic-ppq-025

Stage: Past Paper-style Questions  
Subskill: Direct differentiation with root and reciprocal terms  
Marks: 5

Question: Differentiate \(y=2x^4-6\sqrt{x}+\frac{5}{x}\), giving your answer without negative powers.

Correct answer: \(8x^3-\frac{3}{\sqrt{x}}-\frac{5}{x^2}\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: 2x^4-6x^(1/2)+5x^-1
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 8x^3-3/sqrt(x)-5/x^2
```

Hint: Rewrite \(\sqrt{x}\) as \(x^{1/2}\) and \(\frac{5}{x}\) as \(5x^{-1}\).  
Worked solution: \(\frac{dy}{dx}=8x^3-3x^{-1/2}-5x^{-2}=8x^3-\frac{3}{\sqrt{x}}-\frac{5}{x^2}\).  
Common mistake: Forgetting that the derivative of \(5x^{-1}\) is negative.

---

## PPQ026 — hm-calc-diff-basic-ppq-026

Stage: Past Paper-style Questions  
Subskill: Tangent equation with a reciprocal term  
Marks: 6

Question: A curve has equation \(y=2x^3+\frac{6}{x}\). Find the tangent at \(x=1\).

Correct answer: \(y=8\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: 2x^3+6x^-1
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 6x^2-6/x^2
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 0
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (1,8)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=8
```

Hint: At \(x=1\), the reciprocal powers are easy to evaluate.  
Worked solution: \(\frac{dy}{dx}=6x^2-\frac{6}{x^2}\), so \(m=0\). The point is \((1,8)\), so the tangent is \(y=8\).  
Common mistake: Thinking a gradient of 0 means there is no tangent.

---

## PPQ027 — hm-calc-diff-basic-ppq-027

Stage: Past Paper-style Questions  
Subskill: Finding a gradient with a square root term  
Marks: 5

Question: A curve has equation \(y=x^3+12\sqrt{x}-5\). Find the gradient at \(x=9\).

Correct answer: \(245\)

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: x^3+12x^(1/2)-5
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2+6/sqrt(x)
  - id: gradient
    label: Gradient at x = 9
    type: exact
    correctAnswer: 245
```

Hint: Rewrite the square root term, differentiate, then use \(\sqrt{9}=3\).  
Worked solution: \(\frac{dy}{dx}=3x^2+\frac{6}{\sqrt{x}}\), so \(m=3(81)+2=245\).  
Common mistake: Using \(9^{1/2}=9\). Since \(\sqrt{9}=3\).

---

## PPQ028 — hm-calc-diff-basic-ppq-028

Stage: Past Paper-style Questions  
Subskill: Evaluating a derivative at a negative value  
Marks: 4

Question: Given \(f(x)=x^4-4x^2+x+2\), find \(f'(-1)\).

Correct answer: \(5\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 4x^3-8x+1
  - id: derivative_value
    label: f'(-1)
    type: exact
    correctAnswer: 5
```

Hint: Differentiate first, then substitute \(x=-1\).  
Worked solution: \(f'(x)=4x^3-8x+1\), so \(f'(-1)=-4+8+1=5\).  
Common mistake: Forgetting that \((-1)^3=-1\).

---

## PPQ029 — hm-calc-diff-basic-ppq-029

Stage: Past Paper-style Questions  
Subskill: Simplifying before evaluating a derivative  
Marks: 5

Question: Given \(f(x)=\frac{x^4+4x^2+3}{x}\), find \(f'(1)\).

Correct answer: \(4\)

Answer fields:
```yaml
answerFields:
  - id: simplified_form
    label: Simplified form
    type: algebraic
    correctAnswer: x^3+4x+3/x
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2+4-3/x^2
  - id: derivative_value
    label: f'(1)
    type: exact
    correctAnswer: 4
```

Hint: Divide each term by \(x\), then differentiate.  
Worked solution: \(f(x)=x^3+4x+\frac{3}{x}\), so \(f'(x)=3x^2+4-\frac{3}{x^2}\), and \(f'(1)=4\).  
Common mistake: Not dividing the constant 3 by \(x\).

---

## PPQ030 — hm-calc-diff-basic-ppq-030

Stage: Past Paper-style Questions  
Subskill: Tangent equation to a cubic  
Marks: 6

Question: A curve has equation \(y=x^3-3x^2+5x+1\). Find the tangent at \(x=1\).

Correct answer: \(y=2x+2\)

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3x^2-6x+5
  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 2
  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (1,4)
  - id: tangent_equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=2x+2
```

Hint: Find the gradient and the point on the curve before writing the tangent equation.  
Worked solution: \(m=3-6+5=2\), point \((1,4)\), so \(y-4=2(x-1)\) and \(y=2x+2\).  
Common mistake: Finding the gradient correctly but forgetting to find the point on the curve.

---

# Foundations — all questions together for skim

1. Differentiate \(y=x^5\).
2. Differentiate \(y=4x^3\).
3. Differentiate \(y=3x^4-5x^2+7\).
4. Differentiate \(y=6x^2-8\).
5. Differentiate \(y=x^{-3}\).
6. Differentiate \(y=x^{1/2}\).
7. Write \(\sqrt{x}\) as a power of \(x\).
8. Write \(\frac{1}{x^2}\) as a power of \(x\).
9. Differentiate \(y=\frac{4}{x^3}\).
10. Differentiate \(y=3\sqrt{x}-\frac{2}{x}\).

---

# Applications — all questions together for skim

1. Differentiate \(y=5x^4-3x^2+6x-1\).
2. Differentiate \(y=4x^3+\frac{6}{x}\).
3. Differentiate \(y=7x^3-2x+\frac{5}{x}\).
4. Find the gradient of \(y=x^3-4x+2\) at \(x=2\).
5. Find the gradient of \(y=2x^4-3x^2+5\) at \(x=1\).
6. Find the tangent to \(y=x^3+2x\) at \(x=1\).
7. Find the tangent to \(y=x^2+3x-1\) at \(x=2\).
8. Differentiate \(y=3x^4-5x^3+2x^2-7\).
9. Given \(f(x)=x^4-4x^2+3x\), find \(f'(2)\).
10. Differentiate \(y=\frac{x^3+4x}{x}\).

---

# Past Paper-style Questions — all questions together for skim

1. Differentiate \(y=4x^5-3x^3+7x-2\).
2. Differentiate \(y=\frac{3x^4-5x^2+2x}{x}\).
3. Find the tangent to \(y=2x^3-5x+4\) at \(x=2\).
4. Given \(f(x)=3x^3-\frac{4}{x}+2\), find \(f'(2)\).
5. For \(y=3x^4-4\sqrt{x}+6\), find the gradient at \(x=4\).
6. The curve \(y=3x^3+kx^2-4x\) has gradient 8 when \(x=1\). Find \(k\).
7. Find the tangent to \(y=x^3-4x+1\) at \((2,1)\).
8. Differentiate \(y=4x^5-3x^3+2\sqrt{x}-\frac{6}{x}\).
9. The curve \(y=x^3+kx^2-5x\) has gradient 7 when \(x=2\). Find \(k\).
10. The curve \(y=x^3+kx+4\) has tangent at \(x=2\) parallel to \(y=15x-3\). Find \(k\).
11. Differentiate \(y=\frac{4x^4-x^2+6x}{2x}\).
12. Given \(f(x)=x^4-3x^2+5x\), find \(f'(2)\).
13. Find the tangent to \(y=x^4+2x^2-3x+1\) at \(x=1\).
14. Find the tangent to \(y=x^3+3x^2-2x+5\) at \(x=-1\).
15. Find the tangent to \(y=\frac{2x^3+3x^2-4x}{x}\) at \(x=1\).
16. Find the tangent to \(y=x^3-3x+5\) at \(x=1\).
17. Find the tangent to \(y=-x^3+2x^2+4\) at \(x=2\).
18. Find the tangent to \(y=3x^3-2x^2+x-4\) at \(x=1\).
19. The curve \(y=x^3+kx^2+2\) has tangent at \(x=1\) parallel to \(4x-y+3=0\). Find \(k\).
20. Differentiate \(y=7x^4-5x^2+\frac{3}{x}\), giving the answer without negative powers.
21. Find the gradient of \(y=\frac{6x^4-4x^3+8x}{2x}\) at \(x=2\).
22. Find the tangent to \(y=x^3-6x+3\) at \((2,-1)\).
23. The curve \(y=2x^3+kx^2+3x\) has gradient 19 when \(x=2\). Find \(k\).
24. The curve \(y=x^3+kx^2-4x+1\) has tangent at \(x=1\) parallel to \(2y-10x+3=0\). Find \(k\).
25. Differentiate \(y=2x^4-6\sqrt{x}+\frac{5}{x}\), giving the answer without negative powers.
26. Find the tangent to \(y=2x^3+\frac{6}{x}\) at \(x=1\).
27. For \(y=x^3+12\sqrt{x}-5\), find the gradient at \(x=9\).
28. Given \(f(x)=x^4-4x^2+x+2\), find \(f'(-1)\).
29. Given \(f(x)=\frac{x^4+4x^2+3}{x}\), find \(f'(1)\).
30. Find the tangent to \(y=x^3-3x^2+5x+1\) at \(x=1\).

---

# QA check

Arithmetic corrections already applied:
- PPQ014 final tangent is \(y=-5x+4\).
- PPQ017 final tangent is \(y=-4x+12\).
- Earlier draft issues in Applications involving harder negative-power substitution have been removed/replaced.

Confirmed:
- Foundations: 10
- Applications: 10
- Past Paper-style Questions: 30
- Total: 50

QA checklist:
- [x] Content-bank draft only; not active app data.
- [x] All questions are intended for auto-marking.
- [x] Structured multi-field UI needed for rewritten forms, derivatives, gradients, points, tangent equations, coefficient equations, and final coefficient values.
- [x] No second derivative method.
- [x] No chain rule.
- [x] No product rule.
- [x] No quotient rule.
- [x] No learner-facing common mistake references methods outside the skill boundary.
- [x] No stationary point nature classification.
- [x] No optimisation.
- [x] No trig differentiation.
- [x] Roots and reciprocals appear in controlled ways.
- [x] Where negative powers appear before substitution, worked solutions rewrite them positively before substituting.
- [x] PPQs are weighted toward recurring Higher/QS-style patterns: direct differentiation, simplify-first, gradients, tangents, unknown coefficients, and parallel tangents.
- [x] Accepted answers reviewed for obvious variants.
- [x] Field types need mapping before app import.
- [x] Independent original material; not affiliated with or endorsed by SQA.

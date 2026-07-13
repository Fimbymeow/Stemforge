# STEM Forge — Higher Maths Trig Differentiation Question Bank v2

Status: **approved lean auto-mark content-bank draft with structured answer fields**  
Do not import into the app yet. Store as a future content-bank draft.

Path: Higher Maths → Calculus → Differentiation → Trig differentiation

Source label: Original STEM Forge QS-style content  
QS skill tested: Differentiating trigonometric functions, including simple Chain rule use  
Independence note: Independent original material; not affiliated with or endorsed by SQA.

Import defaults:
- skillPathId: hm-calc-diff-trig
- source: Original STEM Forge QS-style content
- stageId mapping:
  - Foundations → foundations
  - Applications → applications
  - Past Paper-style Questions → not used for this skill path in v2

Final kept count:
- Foundations: 5
- Applications: 10
- Past Paper-style Questions: 0
- Total: 15

Past Paper-style status:
- No separate PPQ section is included in this v2 content-bank draft.
- Reason: trig differentiation is mainly a supporting calculus skill. In exam-style material it usually appears as short focused tasks, such as differentiating a trig function, evaluating a derivative, or using the derivative to find a gradient/tangent.
- Heavier questions involving stationary points, optimisation, identities, reverse differentiation, or extended trig equation solving should live in later skill paths.

Content boundary:
- Include: \(k\sin x\), \(k\cos x\), simple \(\sin(ax+b)\), simple \(\cos(ax+b)\), exact-value gradient evaluation, and a small number of tangent equations.
- Avoid in this skill path: normal lines, full stationary point classification, optimisation, hard trig-equation intervals, reverse differentiation/integration, and identity-then-differentiate questions.

Angle/marking note:
- Use radians in the question text.
- Accept degree equivalents only for angle-only answers. This v2 bank does not include angle-solution questions, so tangent equations and coordinates should remain in radians.

Draft import type note:
Some answer field types in this Markdown draft, such as `exact`, `coordinate`, and similar types, are content-bank labels. During app import, map these to the actual supported STEM Forge input types.

Storage note: this is a content-bank draft, not active app data. Import later only after architecture, QA, and testing are ready.

---

## Foundations

### F001 — hm-calc-diff-trig-f-001

Stage: Foundations  
Subskill: Recognising the derivative of \(k\sin x\)  
Type: multiple_choice  
Marks: 1  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
\[
y=5\sin x
\]
with respect to \(x\).

Which answer is correct?

A. \(5\cos x\)  
B. \(-5\cos x\)  
C. \(5\sin x\)  
D. \(-5\sin x\)

Correct answer:  
A. \(5\cos x\)

Accepted answers:
- A
- 5cosx
- 5cos x
- 5cos(x)
- 5*cos(x)
- 5\cos x

Hint:  
The derivative of \(\sin x\) is \(\cos x\). The 5 stays at the front.

Worked solution:  
\[
y=5\sin x
\]
Since
\[
\frac{d}{dx}(\sin x)=\cos x,
\]
we get
\[
\frac{dy}{dx}=5\cos x.
\]

Common mistake:  
Changing \(\sin x\) to \(-\cos x\). The negative sign appears when differentiating \(\cos x\), not \(\sin x\).

---

### F002 — hm-calc-diff-trig-f-002

Stage: Foundations  
Subskill: Recognising the derivative of \(k\cos x\)  
Type: multiple_choice  
Marks: 1  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
\[
y=4\cos x
\]
with respect to \(x\).

Which answer is correct?

A. \(4\sin x\)  
B. \(-4\sin x\)  
C. \(4\cos x\)  
D. \(-4\cos x\)

Correct answer:  
B. \(-4\sin x\)

Accepted answers:
- B
- -4sinx
- -4sin x
- -4sin(x)
- -4*sin(x)
- -4\sin x

Hint:  
The derivative of \(\cos x\) is \(-\sin x\).

Worked solution:  
\[
y=4\cos x
\]
Since
\[
\frac{d}{dx}(\cos x)=-\sin x,
\]
we get
\[
\frac{dy}{dx}=-4\sin x.
\]

Common mistake:  
Forgetting the negative sign and writing \(4\sin x\).

---

### F003 — hm-calc-diff-trig-f-003

Stage: Foundations  
Subskill: Direct differentiation of \(k\sin x\)  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
\[
y=7\sin x
\]
with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=7\cos x
\]

Accepted answers:
- 7cosx
- 7cos x
- 7cos(x)
- 7*cos(x)
- 7\cos x
- dy/dx=7cosx
- dy/dx=7cos(x)
- dy/dx = 7cos x

Hint:  
Differentiate \(\sin x\), then keep the coefficient 7.

Worked solution:  
\[
y=7\sin x
\]
\[
\frac{dy}{dx}=7\cos x.
\]

Common mistake:  
Dropping the coefficient and writing only \(\cos x\).

---

### F004 — hm-calc-diff-trig-f-004

Stage: Foundations  
Subskill: Direct differentiation of \(k\cos x\)  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
\[
y=6\cos x
\]
with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=-6\sin x
\]

Accepted answers:
- -6sinx
- -6sin x
- -6sin(x)
- -6*sin(x)
- -6\sin x
- dy/dx=-6sinx
- dy/dx=-6sin(x)
- dy/dx = -6sin x

Hint:  
The derivative of \(\cos x\) is negative.

Worked solution:  
\[
y=6\cos x
\]
\[
\frac{dy}{dx}=-6\sin x.
\]

Common mistake:  
Writing \(6\sin x\) instead of \(-6\sin x\).

---

### F005 — hm-calc-diff-trig-f-005

Stage: Foundations  
Subskill: Differentiating a simple mixed sine and cosine expression  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
\[
y=3\sin x-2\cos x
\]
with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=3\cos x+2\sin x
\]

Accepted answers:
- 3cosx+2sinx
- 3cos x+2sin x
- 3cos(x)+2sin(x)
- 3*cos(x)+2*sin(x)
- 3\cos x+2\sin x
- 2sinx+3cosx
- 2sin x+3cos x
- 2sin(x)+3cos(x)
- 2*sin(x)+3*cos(x)
- dy/dx=3cosx+2sinx
- dy/dx = 3cos x + 2sin x

Hint:  
Differentiate each term separately. Be careful with the sign when differentiating \(-2\cos x\).

Worked solution:  
\[
y=3\sin x-2\cos x
\]
Differentiate each term:
\[
\frac{d}{dx}(3\sin x)=3\cos x
\]
and
\[
\frac{d}{dx}(-2\cos x)=2\sin x.
\]
So
\[
\frac{dy}{dx}=3\cos x+2\sin x.
\]

Common mistake:  
Differentiating \(-2\cos x\) as \(-2\sin x\). Since \(\frac{d}{dx}(\cos x)=-\sin x\), the two negatives make a positive.

---

## Applications

### A001 — hm-calc-diff-trig-a-001

Stage: Applications  
Subskill: Gradient of \(k\sin x\)  
Type: multi_step  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=4\sin x.
\]
Find the gradient of the curve at
\[
x=\frac{\pi}{3}.
\]

Correct answer:  
\[
2
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 4cosx
    acceptedAnswers:
      - 4cosx
      - 4cos x
      - 4cos(x)
      - 4*cos(x)
      - 4\cos x

  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: 2
    acceptedAnswers:
      - 2
      - gradient=2
      - m=2
      - dy/dx=2
```

Hint:  
Differentiate first, then substitute \(x=\frac{\pi}{3}\).

Worked solution:  
\[
\frac{dy}{dx}=4\cos x
\]
At \(x=\frac{\pi}{3}\),
\[
4\cos\left(\frac{\pi}{3}\right)=4\cdot\frac12=2.
\]

Common mistake:  
Substituting into \(y\) instead of into \(\frac{dy}{dx}\).

---

### A002 — hm-calc-diff-trig-a-002

Stage: Applications  
Subskill: Gradient of \(k\cos x\)  
Type: multi_step  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=6\cos x.
\]
Find the gradient of the curve at
\[
x=\frac{\pi}{6}.
\]

Correct answer:  
\[
-3
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: -6sinx
    acceptedAnswers:
      - -6sinx
      - -6sin x
      - -6sin(x)
      - -6*sin(x)
      - -6\sin x

  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: -3
    acceptedAnswers:
      - -3
      - gradient=-3
      - m=-3
      - dy/dx=-3
```

Hint:  
Remember that differentiating \(\cos x\) gives \(-\sin x\).

Worked solution:  
\[
\frac{dy}{dx}=-6\sin x
\]
At \(x=\frac{\pi}{6}\),
\[
-6\sin\left(\frac{\pi}{6}\right)=-6\cdot\frac12=-3.
\]

Common mistake:  
Forgetting the negative sign when differentiating \(\cos x\).

---

### A003 — hm-calc-diff-trig-a-003

Stage: Applications  
Subskill: Chain rule with sine  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
\[
y=2\sin(3x)
\]
with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=6\cos(3x)
\]

Accepted answers:
- 6cos(3x)
- 6cos 3x
- 6cos3x
- 6*cos(3x)
- 6\cos(3x)
- dy/dx=6cos(3x)
- dy/dx = 6cos(3x)

Hint:  
Differentiate the outside trig function, then multiply by the derivative of \(3x\).

Worked solution:  
\[
y=2\sin(3x)
\]
\[
\frac{dy}{dx}=2\cdot3\cos(3x)
\]
\[
\frac{dy}{dx}=6\cos(3x).
\]

Common mistake:  
Forgetting to multiply by the derivative of \(3x\).

---

### A004 — hm-calc-diff-trig-a-004

Stage: Applications  
Subskill: Chain rule with cosine  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
\[
y=5\cos(2x)
\]
with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=-10\sin(2x)
\]

Accepted answers:
- -10sin(2x)
- -10sin 2x
- -10sin2x
- -10*sin(2x)
- -10\sin(2x)
- dy/dx=-10sin(2x)
- dy/dx = -10sin(2x)

Hint:  
There are two checks: \(\cos\) differentiates to \(-\sin\), and \(2x\) differentiates to 2.

Worked solution:  
\[
y=5\cos(2x)
\]
\[
\frac{dy}{dx}=5(-2\sin(2x))
\]
\[
\frac{dy}{dx}=-10\sin(2x).
\]

Common mistake:  
Forgetting either the negative sign or the Chain rule multiplier.

---

### A005 — hm-calc-diff-trig-a-005

Stage: Applications  
Subskill: Tangent equation using sine  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=2\sin x.
\]
Find the equation of the tangent to the curve at
\[
x=\frac{\pi}{6}.
\]

Correct answer:  
\[
y-1=\sqrt3\left(x-\frac{\pi}{6}\right)
\]
or
\[
y=\sqrt3x+1-\frac{\sqrt3\pi}{6}.
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 2cosx
    acceptedAnswers:
      - 2cosx
      - 2cos x
      - 2cos(x)
      - 2*cos(x)
      - 2\cos x

  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: sqrt3
    acceptedAnswers:
      - sqrt3
      - sqrt(3)
      - √3
      - m=sqrt3
      - gradient=sqrt3

  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (pi/6,1)
    acceptedAnswers:
      - (pi/6,1)
      - (π/6,1)
      - (pi/6, 1)
      - (π/6, 1)

  - id: tangent-equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y-1=sqrt3(x-pi/6)
    acceptedAnswers:
      - y-1=sqrt3(x-pi/6)
      - y - 1 = sqrt3(x - pi/6)
      - y-1=√3(x-π/6)
      - y=sqrt3x+1-(sqrt3*pi)/6
      - y = sqrt3x + 1 - (sqrt3*pi)/6
      - y=√3x+1-(√3π)/6
```

Hint:  
Find the gradient from \(\frac{dy}{dx}\), then find the point on the curve.

Worked solution:  
\[
\frac{dy}{dx}=2\cos x
\]
At \(x=\frac{\pi}{6}\),
\[
m=2\cos\left(\frac{\pi}{6}\right)=2\cdot\frac{\sqrt3}{2}=\sqrt3.
\]
Also,
\[
y=2\sin\left(\frac{\pi}{6}\right)=1.
\]
So the tangent is
\[
y-1=\sqrt3\left(x-\frac{\pi}{6}\right).
\]

Common mistake:  
Using \(x=30\) inside the tangent equation. The tangent equation should use radians.

---

### A006 — hm-calc-diff-trig-a-006

Stage: Applications  
Subskill: Chain rule evaluation in exam-style form  
Type: multi_step  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Evaluate

Question:  
The function \(f\) is defined by
\[
f(x)=5\sin\left(2x+\frac{\pi}{6}\right).
\]
Evaluate
\[
f'\left(\frac{\pi}{6}\right).
\]

Correct answer:  
\[
0
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 10cos(2x+pi/6)
    acceptedAnswers:
      - 10cos(2x+pi/6)
      - 10cos(2x + pi/6)
      - 10cos(2x+π/6)
      - 10*cos(2x+pi/6)
      - 10\cos(2x+\pi/6)

  - id: value
    label: Value of f'(pi/6)
    type: exact
    correctAnswer: 0
    acceptedAnswers:
      - 0
      - f'(pi/6)=0
      - f'(π/6)=0
```

Hint:  
Differentiate \(f(x)\) first, then substitute \(x=\frac{\pi}{6}\).

Worked solution:  
\[
f'(x)=10\cos\left(2x+\frac{\pi}{6}\right)
\]
At \(x=\frac{\pi}{6}\),
\[
2x+\frac{\pi}{6}=\frac{\pi}{3}+\frac{\pi}{6}=\frac{\pi}{2}.
\]
Therefore,
\[
f'\left(\frac{\pi}{6}\right)=10\cos\left(\frac{\pi}{2}\right)=0.
\]

Common mistake:  
Substituting into \(f(x)\) instead of into \(f'(x)\).

---

### A007 — hm-calc-diff-trig-a-007

Stage: Applications  
Subskill: Mixed trig and Chain rule gradient  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=4\sin(2x)-\cos x.
\]
Find the gradient of the curve at
\[
x=\frac{\pi}{3}.
\]

Correct answer:  
\[
\frac{\sqrt3-8}{2}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 8cos(2x)+sinx
    acceptedAnswers:
      - 8cos(2x)+sinx
      - 8cos(2x)+sin x
      - 8cos(2x)+sin(x)
      - 8*cos(2x)+sin(x)
      - 8\cos(2x)+\sin x

  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: (sqrt3-8)/2
    acceptedAnswers:
      - (sqrt3-8)/2
      - (sqrt(3)-8)/2
      - (√3-8)/2
      - sqrt3/2-4
      - sqrt(3)/2-4
      - √3/2-4
      - -4+sqrt3/2
      - -4+sqrt(3)/2
      - -4+√3/2
```

Hint:  
Differentiate both terms first. The derivative of \(\sin(2x)\) needs the Chain rule.

Worked solution:  
\[
\frac{dy}{dx}=8\cos(2x)+\sin x
\]
At \(x=\frac{\pi}{3}\),
\[
8\cos\left(\frac{2\pi}{3}\right)+\sin\left(\frac{\pi}{3}\right)
=8\left(-\frac12\right)+\frac{\sqrt3}{2}.
\]
So
\[
\frac{dy}{dx}=-4+\frac{\sqrt3}{2}=\frac{\sqrt3-8}{2}.
\]

Common mistake:  
Forgetting the Chain rule on \(\sin(2x)\).

QA note:  
This is the hardest gradient-only Application in the bank. Keep as a stretch Application, not as PPQ.

---

### A008 — hm-calc-diff-trig-a-008

Stage: Applications  
Subskill: Chain rule evaluation in exam-style form  
Type: multi_step  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Evaluate

Question:  
The function \(f\) is defined by
\[
f(x)=3\cos\left(2x-\frac{\pi}{3}\right).
\]
Evaluate
\[
f'\left(\frac{\pi}{3}\right).
\]

Correct answer:  
\[
-3\sqrt3
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: -6sin(2x-pi/3)
    acceptedAnswers:
      - -6sin(2x-pi/3)
      - -6sin(2x - pi/3)
      - -6sin(2x-π/3)
      - -6*sin(2x-pi/3)
      - -6\sin(2x-\pi/3)

  - id: value
    label: Value of f'(pi/3)
    type: exact
    correctAnswer: -3sqrt3
    acceptedAnswers:
      - -3sqrt3
      - -3sqrt(3)
      - -3√3
      - f'(pi/3)=-3sqrt3
      - f'(π/3)=-3√3
```

Hint:  
Differentiate first. Be careful with the negative sign from \(\cos\).

Worked solution:  
\[
f'(x)=-6\sin\left(2x-\frac{\pi}{3}\right)
\]
At \(x=\frac{\pi}{3}\),
\[
2x-\frac{\pi}{3}=\frac{2\pi}{3}-\frac{\pi}{3}=\frac{\pi}{3}.
\]
Therefore,
\[
f'\left(\frac{\pi}{3}\right)=-6\sin\left(\frac{\pi}{3}\right)=-6\cdot\frac{\sqrt3}{2}=-3\sqrt3.
\]

Common mistake:  
Dropping the negative sign when differentiating cosine.

---

### A009 — hm-calc-diff-trig-a-009

Stage: Applications  
Subskill: Tangent equation using cosine  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=2\cos x.
\]
Find the equation of the tangent to the curve at
\[
x=\frac{\pi}{3}.
\]

Correct answer:  
\[
y-1=-\sqrt3\left(x-\frac{\pi}{3}\right)
\]
or
\[
y=-\sqrt3x+1+\frac{\sqrt3\pi}{3}.
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: -2sinx
    acceptedAnswers:
      - -2sinx
      - -2sin x
      - -2sin(x)
      - -2*sin(x)
      - -2\sin x

  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: -sqrt3
    acceptedAnswers:
      - -sqrt3
      - -sqrt(3)
      - -√3

  - id: point
    label: Point on curve
    type: coordinate
    correctAnswer: (pi/3,1)
    acceptedAnswers:
      - (pi/3,1)
      - (π/3,1)
      - (pi/3, 1)
      - (π/3, 1)

  - id: tangent-equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y-1=-sqrt3(x-pi/3)
    acceptedAnswers:
      - y-1=-sqrt3(x-pi/3)
      - y - 1 = -sqrt3(x - pi/3)
      - y-1=-√3(x-π/3)
      - y=-sqrt3x+1+(sqrt3*pi)/3
      - y = -sqrt3x + 1 + (sqrt3*pi)/3
```

Hint:  
The tangent gradient comes from \(\frac{dy}{dx}\), not from the original function.

Worked solution:  
\[
\frac{dy}{dx}=-2\sin x
\]
At \(x=\frac{\pi}{3}\),
\[
m=-2\sin\left(\frac{\pi}{3}\right)=-2\cdot\frac{\sqrt3}{2}=-\sqrt3.
\]
Also,
\[
y=2\cos\left(\frac{\pi}{3}\right)=1.
\]
So the tangent is
\[
y-1=-\sqrt3\left(x-\frac{\pi}{3}\right).
\]

Common mistake:  
Using the \(y\)-value as the gradient.

---

### A010 — hm-calc-diff-trig-a-010

Stage: Applications  
Subskill: Mixed sine and cosine gradient  
Type: multi_step  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=2\sin x+3\cos x.
\]
Find the gradient of the curve at
\[
x=\frac{\pi}{2}.
\]

Correct answer:  
\[
-3
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 2cosx-3sinx
    acceptedAnswers:
      - 2cosx-3sinx
      - 2cos x-3sin x
      - 2cos(x)-3sin(x)
      - 2*cos(x)-3*sin(x)
      - 2\cos x-3\sin x

  - id: gradient
    label: Gradient
    type: exact
    correctAnswer: -3
    acceptedAnswers:
      - -3
      - gradient=-3
      - m=-3
      - dy/dx=-3
```

Hint:  
Differentiate each term separately, then substitute \(x=\frac{\pi}{2}\).

Worked solution:  
\[
\frac{dy}{dx}=2\cos x-3\sin x
\]
At \(x=\frac{\pi}{2}\),
\[
2\cos\left(\frac{\pi}{2}\right)-3\sin\left(\frac{\pi}{2}\right)=2(0)-3(1)=-3.
\]

Common mistake:  
Forgetting that differentiating \(3\cos x\) gives \(-3\sin x\).

---

## Removed / not included in v2

The following question styles were deliberately not included in this Trig differentiation v2 bank:

- Full Past Paper-style Questions section
- Normal equations
- Stationary point and nature questions
- Optimisation questions
- Hard trig-equation interval solving
- Identity-then-differentiate questions
- Reverse differentiation / integration questions
- Parameter questions

Reason: these are better placed in later skill paths such as Stationary Points, Optimisation, Mixed Differentiation, Trig Identities, Tangents and Normals, or Integration.

---

## Import readiness checklist

- [x] Original STEM Forge content only
- [x] Uses QS-style / Past Paper-style wording only where appropriate
- [x] Includes independence note
- [x] No official SQA wording, numbers, scenarios, or diagrams copied
- [x] Foundations included
- [x] Applications included
- [x] PPQ section intentionally omitted
- [x] Structured answer fields used for multi-step items
- [x] All questions intended for auto-marking
- [x] No guided/self-mark questions
- [x] Tangent equations kept in radians
- [x] No Stationary Points creep
- [x] No Optimisation creep
- [x] No reverse differentiation/integration creep
- [x] Content-bank draft only; not active app data


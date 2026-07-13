# STEM Forge — Higher Maths Chain Rule Question Bank v5

Status: **approved auto-mark content-bank draft with structured answer fields**  
Do not import into the app yet. Store as a future content-bank draft.

Path: Higher Maths → Calculus → Differentiation → Chain rule

Source label: Original STEM Forge QS-style content  
QS skill tested: Differentiating composite functions using the chain rule  
Independence note: Independent original material; not affiliated with or endorsed by SQA.

Import defaults:
- skillPathId: hm-calc-diff-chain
- source: Original STEM Forge QS-style content
- stageId mapping:
  - Foundations → foundations
  - Applications → applications
  - Past Paper-style Questions → past-paper-style

Final kept count:
- Foundations: 10
- Applications: 10
- Past Paper-style Questions: 7
- Total: 27

Moved out and not counted:
- hm-calc-diff-chain-ppq-004 → Stationary Points
- hm-calc-diff-chain-ppq-006 → Stationary Points / Greatest and least values
- hm-calc-diff-chain-ppq-010 → Optimisation

Storage note: this is a content-bank draft, not active app data. Import later only after architecture, QA, and testing are ready.

---

## Foundations

### F001 — hm-calc-diff-chain-f-001

Stage: Foundations  
Subskill: Identifying the inside function  
Type: multiple_choice  
Marks: 1  
Calculator/non-calculator: Non-calculator  
Command word: Identify

Question:  
For the function \(y=(4x+3)^6\), which expression is the inside function?

A. \(4x+3\)  
B. \(x^6\)  
C. \(4x\)  
D. \((4x+3)^6\)

Correct answer:  
A. \(4x+3\)

Accepted answers:
- A
- 4x+3
- 4x + 3

Hint:  
Look at the expression inside the brackets.

Worked solution:  
The function is
\[
y=(4x+3)^6.
\]
The outside operation is raising to the power 6. The expression inside the brackets is
\[
4x+3.
\]
So the inside function is \(4x+3\).

Common mistake:  
Choosing the whole expression \((4x+3)^6\) instead of just the expression inside the brackets.

QA note: Scaffolded intro question.

---

### F002 — hm-calc-diff-chain-f-002

Stage: Foundations  
Subskill: Identifying the inside function in a quadratic composite  
Type: multiple_choice  
Marks: 1  
Calculator/non-calculator: Non-calculator  
Command word: Identify

Question:  
For the function \(y=(2x^2-5)^4\), which expression should be treated as the inside function when using the chain rule?

A. \(2x^2\)  
B. \(2x^2-5\)  
C. \(x^4\)  
D. \(4(2x^2-5)^3\)

Correct answer:  
B. \(2x^2-5\)

Accepted answers:
- B
- 2x^2-5
- 2x^2 - 5

Hint:  
The inside function is the full expression being raised to the power 4.

Worked solution:  
The function is
\[
y=(2x^2-5)^4.
\]
The expression inside the brackets is
\[
2x^2-5.
\]
So the inside function is \(2x^2-5\).

Common mistake:  
Choosing only \(2x^2\) and leaving out the \(-5\).

---

### F003 — hm-calc-diff-chain-f-003

Stage: Foundations  
Subskill: Basic chain rule with \((ax+b)^n\)  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=(3x+2)^5\) with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=15(3x+2)^4
\]

Accepted answers:
- 15(3x+2)^4
- 15*(3x+2)^4
- 15(3x + 2)^4
- dy/dx=15(3x+2)^4

Hint:  
Bring down the outside power, then multiply by the derivative of \(3x+2\).

Worked solution:  
\[
y=(3x+2)^5
\]
Differentiate the outside power:
\[
5(3x+2)^4.
\]
Then multiply by the derivative of the bracket:
\[
\frac{d}{dx}(3x+2)=3.
\]
So
\[
\frac{dy}{dx}=5(3x+2)^4\cdot3
\]
\[
\frac{dy}{dx}=15(3x+2)^4.
\]

Common mistake:  
Writing \(5(3x+2)^4\) and forgetting to multiply by 3.

---

### F004 — hm-calc-diff-chain-f-004

Stage: Foundations  
Subskill: Basic chain rule with \((ax-b)^n\)  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=(5x-4)^3\) with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=15(5x-4)^2
\]

Accepted answers:
- 15(5x-4)^2
- 15*(5x-4)^2
- 15(5x - 4)^2
- dy/dx=15(5x-4)^2

Hint:  
After applying the power rule to the bracket, multiply by the derivative of \(5x-4\).

Worked solution:  
\[
y=(5x-4)^3
\]
Using the chain rule,
\[
\frac{dy}{dx}=3(5x-4)^2\cdot5.
\]
Therefore,
\[
\frac{dy}{dx}=15(5x-4)^2.
\]

Common mistake:  
Forgetting that \(\frac{d}{dx}(5x-4)=5\).

---

### F005 — hm-calc-diff-chain-f-005

Stage: Foundations  
Subskill: Chain rule with a constant multiplier  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=2(4x+1)^6\) with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=48(4x+1)^5
\]

Accepted answers:
- 48(4x+1)^5
- 48*(4x+1)^5
- 48(4x + 1)^5
- dy/dx=48(4x+1)^5

Hint:  
Keep the 2 at the front, then apply the chain rule to \((4x+1)^6\).

Worked solution:  
\[
y=2(4x+1)^6
\]
Using the chain rule,
\[
\frac{dy}{dx}=2\cdot6(4x+1)^5\cdot4.
\]
Multiply the constants:
\[
2\cdot6\cdot4=48.
\]
So
\[
\frac{dy}{dx}=48(4x+1)^5.
\]

Common mistake:  
Forgetting either the coefficient 2 or the derivative of \(4x+1\).

---

### F006 — hm-calc-diff-chain-f-006

Stage: Foundations  
Subskill: Chain rule with quadratic inside functions  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=(x^2+4)^5\) with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=10x(x^2+4)^4
\]

Accepted answers:
- 10x(x^2+4)^4
- 10*x*(x^2+4)^4
- 10x(x^2 + 4)^4
- dy/dx=10x(x^2+4)^4

Hint:  
The derivative of the bracket \(x^2+4\) is \(2x\).

Worked solution:  
\[
y=(x^2+4)^5
\]
Using the chain rule,
\[
\frac{dy}{dx}=5(x^2+4)^4\cdot2x.
\]
So
\[
\frac{dy}{dx}=10x(x^2+4)^4.
\]

Common mistake:  
Treating \(x^2+4\) like its derivative is 1.

---

### F007 — hm-calc-diff-chain-f-007

Stage: Foundations  
Subskill: Chain rule with quadratic inside functions  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=(3x^2-2)^4\) with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=24x(3x^2-2)^3
\]

Accepted answers:
- 24x(3x^2-2)^3
- 24*x*(3x^2-2)^3
- 24x(3x^2 - 2)^3
- dy/dx=24x(3x^2-2)^3

Hint:  
Differentiate the bracket \(3x^2-2\) after applying the outside power.

Worked solution:  
\[
y=(3x^2-2)^4
\]
Using the chain rule,
\[
\frac{dy}{dx}=4(3x^2-2)^3\cdot6x.
\]
Therefore,
\[
\frac{dy}{dx}=24x(3x^2-2)^3.
\]

Common mistake:  
Differentiating \(3x^2\) as \(3x\) instead of \(6x\).

---

### F008 — hm-calc-diff-chain-f-008

Stage: Foundations  
Subskill: Chain rule with fractional powers  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=(2x+7)^{1/2}\) with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=(2x+7)^{-1/2}
\]
or
\[
\frac{dy}{dx}=\frac{1}{\sqrt{2x+7}}
\]

Accepted answers:
- (2x+7)^(-1/2)
- (2x + 7)^(-1/2)
- 1/sqrt(2x+7)
- 1/sqrt(2x + 7)
- dy/dx=(2x+7)^(-1/2)

Hint:  
Use the power \(\frac{1}{2}\), then multiply by the derivative of \(2x+7\).

Worked solution:  
\[
y=(2x+7)^{1/2}
\]
Using the chain rule,
\[
\frac{dy}{dx}=\frac{1}{2}(2x+7)^{-1/2}\cdot2.
\]
Since \(\frac{1}{2}\cdot2=1\),
\[
\frac{dy}{dx}=(2x+7)^{-1/2}.
\]
This can also be written as
\[
\frac{dy}{dx}=\frac{1}{\sqrt{2x+7}}.
\]

Common mistake:  
Forgetting to multiply by 2, or not reducing the power from \(\frac{1}{2}\) to \(-\frac{1}{2}\).

---

### F009 — hm-calc-diff-chain-f-009

Stage: Foundations  
Subskill: Chain rule with negative powers  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=(x^2+1)^{-3}\) with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=-6x(x^2+1)^{-4}
\]
or
\[
\frac{dy}{dx}=-\frac{6x}{(x^2+1)^4}
\]

Accepted answers:
- -6x(x^2+1)^(-4)
- -6*x*(x^2+1)^(-4)
- -6x(x^2 + 1)^(-4)
- -6x/(x^2+1)^4
- -6*x/(x^2+1)^4
- dy/dx=-6x(x^2+1)^(-4)

Hint:  
Bring down the power \(-3\), reduce the power by 1, then multiply by \(2x\).

Worked solution:  
\[
y=(x^2+1)^{-3}
\]
Using the chain rule,
\[
\frac{dy}{dx}=-3(x^2+1)^{-4}\cdot2x.
\]
So
\[
\frac{dy}{dx}=-6x(x^2+1)^{-4}.
\]
Equivalently,
\[
\frac{dy}{dx}=-\frac{6x}{(x^2+1)^4}.
\]

Common mistake:  
Changing the power from \(-3\) to \(-2\). Differentiating reduces the power by 1, so it becomes \(-4\).

---

### F010 — hm-calc-diff-chain-f-010

Stage: Foundations  
Subskill: Recognising when the chain rule is useful  
Type: multiple_choice  
Marks: 1  
Calculator/non-calculator: Non-calculator  
Command word: Select

Question:  
Which of the following functions are most naturally differentiated using the chain rule?

I. \(y=(3x-1)^5\)  
II. \(y=4x^5-2x\)  
III. \(y=(x^2+6)^3\)  
IV. \(y=7x^3+1\)

A. I and II only  
B. I and III only  
C. II and IV only  
D. I, II and III only

Correct answer:  
B. I and III only

Accepted answers:
- B
- I and III
- 1 and 3
- I, III

Hint:  
Look for a function inside another function, usually brackets raised to a power.

Worked solution:  
I has \((3x-1)\) inside a power, so the chain rule is natural.  
II is a polynomial and can be differentiated term by term.  
III has \((x^2+6)\) inside a power, so the chain rule is natural.  
IV is a polynomial and can be differentiated term by term.

So the correct choice is I and III only.

Common mistake:  
Thinking every power of \(x\), such as \(x^5\), needs the chain rule.

QA note: Mark reduced to 1 and wording changed from “require” to “most naturally differentiated using” to avoid expansion arguments.

---

## Applications

### A001 — hm-calc-diff-chain-a-001

Stage: Applications  
Subskill: Gradient at a point using chain rule  
Type: numerical  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Calculate

Question:  
For \(y=(2x+3)^4\), calculate the gradient of the curve at the point where \(x=1\).

Correct answer:  
1000

Accepted answers:
- 1000
- gradient = 1000
- m=1000

Hint:  
Differentiate first, then substitute \(x=1\) into \(\frac{dy}{dx}\).

Worked solution:  
\[
y=(2x+3)^4
\]
\[
\frac{dy}{dx}=4(2x+3)^3\cdot2
\]
\[
\frac{dy}{dx}=8(2x+3)^3.
\]
At \(x=1\),
\[
\frac{dy}{dx}=8(2(1)+3)^3=8(5)^3=1000.
\]
So the gradient is 1000.

Common mistake:  
Substituting \(x=1\) into the original function instead of into the derivative.

---

### A002 — hm-calc-diff-chain-a-002

Stage: Applications  
Subskill: Chain rule with a two-term inside derivative  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=(x^2+4x)^5\) with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=5(2x+4)(x^2+4x)^4
\]
or
\[
\frac{dy}{dx}=10(x+2)(x^2+4x)^4
\]

Accepted answers:
- 5(2x+4)(x^2+4x)^4
- 5*(2x+4)*(x^2+4x)^4
- 10(x+2)(x^2+4x)^4
- 10*(x+2)*(x^2+4x)^4
- dy/dx=5(2x+4)(x^2+4x)^4
- dy/dx=10(x+2)(x^2+4x)^4

Hint:  
The derivative of the bracket is \(2x+4\), not just \(2x\).

Worked solution:  
\[
y=(x^2+4x)^5
\]
Using the chain rule,
\[
\frac{dy}{dx}=5(x^2+4x)^4(2x+4).
\]
So
\[
\frac{dy}{dx}=5(2x+4)(x^2+4x)^4.
\]
This can also be written as
\[
\frac{dy}{dx}=10(x+2)(x^2+4x)^4.
\]

Common mistake:  
Forgetting to differentiate the \(4x\) term inside the bracket.

---

### A003 — hm-calc-diff-chain-a-003

Stage: Applications  
Subskill: Gradient at a point with a constant multiplier  
Type: numerical  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Calculate

Question:  
For \(y=3(2x^2-1)^3\), calculate the value of \(\frac{dy}{dx}\) when \(x=2\).

Correct answer:  
3528

Accepted answers:
- 3528
- dy/dx=3528
- gradient = 3528
- m=3528

Hint:  
Keep the coefficient 3 at the front, then differentiate the bracket using the chain rule.

Worked solution:  
\[
y=3(2x^2-1)^3
\]
\[
\frac{dy}{dx}=3\cdot3(2x^2-1)^2\cdot4x
\]
\[
\frac{dy}{dx}=36x(2x^2-1)^2.
\]
At \(x=2\),
\[
\frac{dy}{dx}=36(2)(2(2)^2-1)^2
\]
\[
=72(7)^2=3528.
\]

Common mistake:  
Forgetting the outside coefficient 3, or forgetting that \(\frac{d}{dx}(2x^2-1)=4x\).

---

### A004 — hm-calc-diff-chain-a-004

Stage: Applications  
Subskill: Chain rule with negative powers and positive-power final form  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=(3x-2)^{-4}\) with respect to \(x\), giving your answer with positive powers.

Correct answer:  
\[
\frac{dy}{dx}=-\frac{12}{(3x-2)^5}
\]

Accepted answers:
- -12/(3x-2)^5
- -12/(3x - 2)^5
- dy/dx=-12/(3x-2)^5

Hint:  
Differentiate first using the negative power, then rewrite the answer as a fraction.

Worked solution:  
\[
y=(3x-2)^{-4}
\]
Using the chain rule,
\[
\frac{dy}{dx}=-4(3x-2)^{-5}\cdot3
\]
\[
\frac{dy}{dx}=-12(3x-2)^{-5}.
\]
With positive powers,
\[
\frac{dy}{dx}=-\frac{12}{(3x-2)^5}.
\]

Common mistake:  
Leaving the answer as \(-12(3x-2)^{-5}\), even though the question asks for positive powers.

QA note: Negative-power accepted answers removed to match the instruction.

---

### A005 — hm-calc-diff-chain-a-005

Stage: Applications  
Subskill: Gradient at a point with square-root chain rule  
Type: numerical  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Calculate

Question:  
For \(y=\sqrt{5x+4}\), calculate \(\frac{dy}{dx}\) when \(x=1\).

Correct answer:  
\[
\frac{5}{6}
\]

Accepted answers:
- 5/6
- dy/dx=5/6
- gradient = 5/6
- m=5/6

Hint:  
Rewrite the square root as \((5x+4)^{1/2}\).

Worked solution:  
\[
y=\sqrt{5x+4}=(5x+4)^{1/2}
\]
\[
\frac{dy}{dx}=\frac{1}{2}(5x+4)^{-1/2}\cdot5
\]
\[
\frac{dy}{dx}=\frac{5}{2\sqrt{5x+4}}.
\]
At \(x=1\),
\[
\frac{dy}{dx}=\frac{5}{2\sqrt{9}}=\frac{5}{6}.
\]

Common mistake:  
Forgetting to multiply by the derivative of \(5x+4\), which is 5.

---

### A006 — hm-calc-diff-chain-a-006

Stage: Applications  
Subskill: Rewrite square root then apply chain rule  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=\sqrt{7x-3}\) with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=\frac{7}{2\sqrt{7x-3}}
\]

Accepted answers:
- 7/(2sqrt(7x-3))
- 7/(2*sqrt(7x-3))
- (7/2)(7x-3)^(-1/2)
- 7/2*(7x-3)^(-1/2)
- dy/dx=7/(2sqrt(7x-3))

Hint:  
Use \(\sqrt{7x-3}=(7x-3)^{1/2}\).

Worked solution:  
\[
y=\sqrt{7x-3}=(7x-3)^{1/2}
\]
\[
\frac{dy}{dx}=\frac{1}{2}(7x-3)^{-1/2}\cdot7
\]
\[
\frac{dy}{dx}=\frac{7}{2}(7x-3)^{-1/2}
\]
\[
\frac{dy}{dx}=\frac{7}{2\sqrt{7x-3}}.
\]

Common mistake:  
Writing \(\frac{1}{2\sqrt{7x-3}}\) and forgetting the factor of 7.

QA note: Ambiguous `7/2(7x-3)^(-1/2)` removed.

---

### A007 — hm-calc-diff-chain-a-007

Stage: Applications  
Subskill: Rewrite reciprocal then apply chain rule  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate \(y=\frac{1}{(4x+5)^3}\) with respect to \(x\).

Correct answer:  
\[
\frac{dy}{dx}=-\frac{12}{(4x+5)^4}
\]

Accepted answers:
- -12/(4x+5)^4
- -12/(4x + 5)^4
- -12(4x+5)^(-4)
- -12*(4x+5)^(-4)
- dy/dx=-12/(4x+5)^4

Hint:  
Rewrite the function as \((4x+5)^{-3}\).

Worked solution:  
\[
y=\frac{1}{(4x+5)^3}=(4x+5)^{-3}
\]
Using the chain rule,
\[
\frac{dy}{dx}=-3(4x+5)^{-4}\cdot4
\]
\[
\frac{dy}{dx}=-12(4x+5)^{-4}.
\]
Equivalently,
\[
\frac{dy}{dx}=-\frac{12}{(4x+5)^4}.
\]

Common mistake:  
Differentiating the denominator as if it were a separate fraction rule, instead of first rewriting with a negative power.

---

### A008 — hm-calc-diff-chain-a-008

Stage: Applications  
Subskill: Gradient at a point using a quadratic inside function  
Type: numerical  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Calculate

Question:  
For \(y=(x^2-2x+6)^3\), calculate the gradient of the curve at the point where \(x=2\).

Correct answer:  
216

Accepted answers:
- 216
- gradient = 216
- m=216
- dy/dx=216

Hint:  
Differentiate the bracket \(x^2-2x+6\), then substitute \(x=2\).

Worked solution:  
\[
y=(x^2-2x+6)^3
\]
\[
\frac{dy}{dx}=3(x^2-2x+6)^2(2x-2).
\]
At \(x=2\),
\[
\frac{dy}{dx}=3(2^2-2(2)+6)^2(2(2)-2)
\]
\[
=3(6)^2(2)=216.
\]

Common mistake:  
Calculating the \(y\)-value at \(x=2\) instead of the gradient.

---

### A009 — hm-calc-diff-chain-a-009

Stage: Applications  
Subskill: Solving from a gradient condition  
Type: numerical  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Determine

Question:  
For \(y=(2x+1)^3\), determine the positive value of \(x\) for which the gradient of the curve is 54.

Correct answer:  
\[
x=1
\]

Accepted answers:
- 1
- x=1
- x = 1

Hint:  
Find \(\frac{dy}{dx}\), set it equal to 54, then solve for \(x\).

Worked solution:  
\[
y=(2x+1)^3
\]
\[
\frac{dy}{dx}=3(2x+1)^2\cdot2
\]
\[
\frac{dy}{dx}=6(2x+1)^2.
\]
The gradient is 54, so
\[
6(2x+1)^2=54.
\]
\[
(2x+1)^2=9
\]
\[
2x+1=\pm3.
\]
So
\[
x=1 \quad \text{or} \quad x=-2.
\]
The positive value is
\[
x=1.
\]

Common mistake:  
Stopping at \(2x+1=3\) without noticing that a square equation also gives \(2x+1=-3\). The question asks for the positive value.

QA note: Rewritten to avoid the artificial condition \(\frac{dy}{dx}=24x\). This is still a final Application / bridge-to-PPQ question.

---

### A010 — hm-calc-diff-chain-a-010

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

Answer fields for import:
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

### PPQ001 — hm-calc-diff-chain-ppq-001

Stage: Past Paper-style Questions  
Subskill: Tangent equation using a quadratic inside function  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation \(y=(x^2+3)^2\).  
Find the equation of the tangent to the curve at the point where \(x=1\).

Correct answer:  
\[
y=16x
\]

Accepted answers:
- y=16x
- y = 16x
- 16x-y=0
- y-16=16(x-1)

Answer fields for import:
```yaml
answerFields:
  - id: tangent-equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=16x
    acceptedAnswers:
      - y=16x
      - y = 16x
      - 16x-y=0
      - 16x - y = 0
      - y-16=16(x-1)
```

Hint:  
Find \(\frac{dy}{dx}\) first, then use the point-gradient form of a straight line.

Worked solution:  
\[
y=(x^2+3)^2
\]
\[
\frac{dy}{dx}=2(x^2+3)(2x)=4x(x^2+3).
\]
At \(x=1\),
\[
m=4(1)(1^2+3)=16.
\]
Find the point:
\[
y=(1^2+3)^2=16.
\]
So the point is \((1,16)\).

Using \(y-b=m(x-a)\),
\[
y-16=16(x-1)
\]
\[
y=16x.
\]

Common mistake:  
Finding the derivative but not using it to form the tangent equation.

---

### PPQ002 — hm-calc-diff-chain-ppq-002

Stage: Past Paper-style Questions  
Subskill: Normal equation using chain rule  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation \(y=(3x-2)^4\).  
Find the equation of the normal to the curve at the point where \(x=1\).

Correct answer:  
\[
x+12y-13=0
\]
or
\[
y-1=-\frac{1}{12}(x-1)
\]

Accepted answers:
- x+12y-13=0
- x + 12y - 13 = 0
- y-1=-1/12(x-1)
- y - 1 = -1/12(x - 1)
- y=(-1/12)x+13/12

Answer fields for import:
```yaml
answerFields:
  - id: normal-equation
    label: Normal equation
    type: algebraic
    correctAnswer: x+12y-13=0
    acceptedAnswers:
      - x+12y-13=0
      - x + 12y - 13 = 0
      - y-1=-1/12(x-1)
      - y - 1 = -1/12(x - 1)
      - y=(-1/12)x+13/12
      - y = (-1/12)x + 13/12
```

Hint:  
The normal gradient is the negative reciprocal of the tangent gradient.

Worked solution:  
\[
y=(3x-2)^4
\]
\[
\frac{dy}{dx}=4(3x-2)^3\cdot3=12(3x-2)^3.
\]
At \(x=1\),
\[
m_{\text{tangent}}=12(1)^3=12.
\]
So the normal gradient is
\[
m_{\text{normal}}=-\frac{1}{12}.
\]
Find the point:
\[
y=(3(1)-2)^4=1.
\]
So the point is \((1,1)\).

\[
y-1=-\frac{1}{12}(x-1).
\]
Multiplying by 12,
\[
12y-12=-x+1
\]
\[
x+12y-13=0.
\]

Common mistake:  
Using the tangent gradient \(12\) instead of the normal gradient \(-\frac{1}{12}\).

---

### PPQ003 — hm-calc-diff-chain-ppq-003

Stage: Past Paper-style Questions  
Subskill: Parameter gradient condition  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Determine

Question:  
The function \(f\) is defined by \(f(x)=(ax+2)^2\), where \(a\) is a positive constant.  
Given that \(f'(1)=30\), determine the value of \(a\).

Correct answer:  
\[
a=3
\]

Accepted answers:
- 3
- a=3
- a = 3

Answer fields for import:
```yaml
answerFields:
  - id: parameter-a
    label: Value of a
    type: numerical
    correctAnswer: 3
    acceptedAnswers:
      - 3
      - a=3
      - a = 3
```

Hint:  
Differentiate in terms of \(a\), then substitute \(x=1\).

Worked solution:  
\[
f(x)=(ax+2)^2
\]
\[
f'(x)=2(ax+2)\cdot a
\]
\[
f'(x)=2a(ax+2).
\]
Given \(f'(1)=30\),
\[
2a(a+2)=30.
\]
\[
a(a+2)=15
\]
\[
a^2+2a-15=0
\]
\[
(a+5)(a-3)=0.
\]
So
\[
a=-5 \quad \text{or} \quad a=3.
\]
Since \(a\) is positive,
\[
a=3.
\]

Common mistake:  
Solving the quadratic and giving both values, even though the question says \(a\) is positive.

---

### PPQ005 — hm-calc-diff-chain-ppq-005

Stage: Past Paper-style Questions  
Subskill: Tangent equation and intercept  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation \(y=(x-2)^4\).  
The tangent to the curve is drawn at the point where \(x=3\).

Find the equation of this tangent, and hence state where it crosses the \(y\)-axis.

Correct answer:  
\[
y=4x-11
\]
Crosses the \(y\)-axis at \((0,-11)\).

Accepted answers for full-answer reference:
- y=4x-11, (0,-11)
- y = 4x - 11, (0, -11)
- tangent y=4x-11 and y-intercept -11
- y-1=4(x-3), (0,-11)
- 4x-y-11=0, (0,-11)

Answer fields for import:
```yaml
answerFields:
  - id: tangent-equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=4x-11
    acceptedAnswers:
      - y=4x-11
      - y = 4x - 11
      - y-1=4(x-3)
      - 4x-y-11=0
      - 4x - y - 11 = 0
  - id: y-axis-crossing
    label: y-axis crossing
    type: coordinate_or_numeric
    correctAnswer: (0,-11)
    acceptedAnswers:
      - (0,-11)
      - (0, -11)
      - -11
      - y=-11
      - y = -11
```

Hint:  
Find the tangent equation first, then set \(x=0\) to find the \(y\)-intercept.

Worked solution:  
\[
y=(x-2)^4
\]
\[
\frac{dy}{dx}=4(x-2)^3.
\]
At \(x=3\),
\[
m=4(1)^3=4.
\]
Find the point:
\[
y=(3-2)^4=1.
\]
So the point is \((3,1)\).

\[
y-1=4(x-3)
\]
\[
y=4x-11.
\]
At the \(y\)-axis, \(x=0\), so
\[
y=-11.
\]
Therefore, the tangent crosses the \(y\)-axis at \((0,-11)\).

Common mistake:  
Stopping after finding the tangent equation and missing the “hence” part.

QA note: Function and point changed to reduce repeated \(x=1\). Later import should ideally use two answer fields: tangent equation and intercept.

---

### PPQ007 — hm-calc-diff-chain-ppq-007

Stage: Past Paper-style Questions  
Subskill: Tangent to a square-root composite function  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation \(y=\sqrt{4x+5}\).  
Find the equation of the tangent to the curve at the point where \(x=5\).

Correct answer:  
\[
5y=2x+15
\]
or
\[
y-5=\frac{2}{5}(x-5)
\]

Accepted answers:
- 5y=2x+15
- 5y = 2x + 15
- y-5=2/5(x-5)
- y = (2/5)x + 3
- 5y-2x-15=0

Answer fields for import:
```yaml
answerFields:
  - id: tangent-equation
    label: Tangent equation
    type: algebraic
    correctAnswer: 5y=2x+15
    acceptedAnswers:
      - 5y=2x+15
      - 5y = 2x + 15
      - 5y-2x-15=0
      - 5y - 2x - 15 = 0
      - y-5=2/5(x-5)
      - y = (2/5)x + 3
```

Hint:  
Rewrite the square root using a power of \(\frac{1}{2}\), then find the tangent.

Worked solution:  
\[
y=\sqrt{4x+5}=(4x+5)^{1/2}
\]
\[
\frac{dy}{dx}=\frac{1}{2}(4x+5)^{-1/2}\cdot4
\]
\[
\frac{dy}{dx}=\frac{2}{\sqrt{4x+5}}.
\]
At \(x=5\),
\[
m=\frac{2}{\sqrt{25}}=\frac{2}{5}.
\]
Find the point:
\[
y=\sqrt{4(5)+5}=\sqrt{25}=5.
\]
So the point is \((5,5)\).

\[
y-5=\frac{2}{5}(x-5).
\]
Multiplying by 5,
\[
5y-25=2x-10
\]
\[
5y=2x+15.
\]

Common mistake:  
Forgetting the derivative of \(4x+5\), which changes the gradient by a factor of 4.

QA note: Point changed from \(x=1\) to \(x=5\). Extra equivalent line form added.

---

### PPQ008 — hm-calc-diff-chain-ppq-008

Stage: Past Paper-style Questions  
Subskill: Chain rule with tangent coefficient  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation

\[
y=(3x+2)^2.
\]

(a) Find \(\frac{dy}{dx}\).  
(b) Find the equation of the tangent to the curve at the point where \(x=2\).

Correct answer:
(a) \(\frac{dy}{dx}=6(3x+2)\)  
(b) \(y=48x-32\)

Accepted answers for full-answer reference:
- dy/dx=6(3x+2), y=48x-32
- 6(3x+2), y=48x-32
- derivative 6(3x+2), tangent y=48x-32
- y-64=48(x-2)

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative dy/dx
    type: algebraic
    correctAnswer: 6(3x+2)
    acceptedAnswers:
      - 6(3x+2)
      - 6(3x + 2)
      - dy/dx=6(3x+2)
      - dy/dx = 6(3x + 2)
  - id: tangent-equation
    label: Tangent equation at x=2
    type: algebraic
    correctAnswer: y=48x-32
    acceptedAnswers:
      - y=48x-32
      - y = 48x - 32
      - y-64=48(x-2)
      - y - 64 = 48(x - 2)
      - 48x-y-32=0
      - 48x - y - 32 = 0
```

Hint:  
First differentiate, then find both the gradient and the point on the curve when \(x=2\).

Worked solution:  
(a)
\[
y=(3x+2)^2
\]
\[
\frac{dy}{dx}=2(3x+2)\cdot3
\]
\[
\frac{dy}{dx}=6(3x+2).
\]

(b) At \(x=2\),
\[
m=6(3(2)+2)=6(8)=48.
\]

Find the point on the curve:
\[
y=(3(2)+2)^2=8^2=64.
\]

So the tangent passes through \((2,64)\) with gradient \(48\).

\[
y-64=48(x-2)
\]
\[
y-64=48x-96
\]
\[
y=48x-32.
\]

Common mistake:  
Finding the derivative correctly but using \(x=2\) only to find the gradient, not the point on the curve.

QA note: Replaced the previous model-interpretation question. This version is fully auto-markable using structured derivative and tangent-equation fields.

---

### PPQ009 — hm-calc-diff-chain-ppq-009

Stage: Past Paper-style Questions  
Subskill: Comparing gradients  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Determine

Question:  
Two curves have equations

\[
y=(x^2+2)^2
\]

and

\[
y=6x^2+3.
\]

At \(x=2\), determine which curve has the greater gradient. You must show both gradients.

Correct answer:  
The curve \(y=(x^2+2)^2\) has the greater gradient, since its gradient is \(48\), while the gradient of \(y=6x^2+3\) is \(24\).

Accepted answers for full-answer reference:
- first curve, 48 > 24
- gradient 48 greater than 24
- y=(x^2+2)^2, since 48>24
- first curve, gradients 48 and 24
- y=(x^2+2)^2 has greater gradient because 48>24

Answer fields for import:
```yaml
answerFields:
  - id: first-gradient
    label: Gradient of y=(x^2+2)^2 at x=2
    type: numerical
    correctAnswer: 48
    acceptedAnswers:
      - 48
      - m1=48
      - first gradient = 48
  - id: second-gradient
    label: Gradient of y=6x^2+3 at x=2
    type: numerical
    correctAnswer: 24
    acceptedAnswers:
      - 24
      - m2=24
      - second gradient = 24
  - id: greater-gradient
    label: Curve with greater gradient
    type: multiple_choice_or_text
    correctAnswer: y=(x^2+2)^2
    acceptedAnswers:
      - y=(x^2+2)^2
      - first curve
      - curve 1
      - first
```

Hint:  
Find both derivatives, then substitute \(x=2\) into each.

Worked solution:  
For the first curve,
\[
y=(x^2+2)^2
\]
\[
\frac{dy}{dx}=2(x^2+2)(2x)=4x(x^2+2).
\]
At \(x=2\),
\[
m_1=4(2)(2^2+2)=8(6)=48.
\]

For the second curve,
\[
y=6x^2+3
\]
\[
\frac{dy}{dx}=12x.
\]
At \(x=2\),
\[
m_2=24.
\]
Since \(48>24\), the curve \(y=(x^2+2)^2\) has the greater gradient.

Common mistake:  
Comparing the \(y\)-values of the curves instead of comparing the gradients.

QA note: Function changed to avoid duplicate with PPQ001. Accepted answers strengthened so “first” alone is no longer enough.

---

## Moved out — do not count in Chain rule

### Moved 1
Old ID: hm-calc-diff-chain-ppq-004  
Move to: Stationary Points  

Question:  
A curve has equation \(y=(x^2-6x+10)^3\).  
Determine the coordinates of the stationary point and state its nature.

Reason:  
Main skill is stationary point and nature, not Chain rule.

---

### Moved 2
Old ID: hm-calc-diff-chain-ppq-006  
Move to: Stationary Points / Greatest and least values  

Question:  
The function \(f\) is defined on the interval \(0\leq x\leq4\) by

\[
f(x)=(x^2-4x+5)^2.
\]

Determine the greatest and least values of \(f\) on this interval.

Reason:  
Main skill is stationary/endpoints, not Chain rule.

---

### Moved 3
Old ID: hm-calc-diff-chain-ppq-010  
Move to: Optimisation  

Question:  
A designer models the cost, \(C\) pounds, of producing a small frame by

\[
C(x)=4x+\frac{100}{x+1},
\]

where \(x>0\).

Find the value of \(x\) which gives the minimum cost, and calculate this minimum cost.

Reason:  
Main skill is optimisation in context, not Chain rule.

---

## Final storage status

Store this as:

**approved auto-mark content-bank draft with structured answer fields**

Suggested file path:

```txt
content-bank/higher-maths/calculus/differentiation/chain-rule-v5.md
```

Do not import into the active app data yet.

---

## Import readiness checklist

Before this Chain rule bank is imported into the active app data, every question should have the full STEM Forge fields:

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

Every Chain rule question is intended to be auto-marked. For multi-step questions, use structured answer fields instead of guided/self-mark mode. Do not use guided/self-mark mode for this Chain rule bank.

For `multi_step` questions, use structured answer fields instead of one fragile full-answer string. Each multi-step import item should include `answerFields`, with each field containing:

- `id`
- `label`
- `type`
- `correctAnswer`
- `acceptedAnswers`

Example structure:

```yaml
answerFields:
  - id: tangent-equation
    label: Tangent equation
    type: algebraic
    correctAnswer: y=4x-11
    acceptedAnswers:
      - y=4x-11
      - y = 4x - 11
      - y-1=4(x-3)
  - id: y-axis-crossing
    label: y-axis crossing
    type: coordinate_or_numeric
    correctAnswer: (0,-11)
    acceptedAnswers:
      - (0,-11)
      - (0, -11)
      - -11
      - y=-11
```

Existing `acceptedAnswers` can be kept in the Markdown as reference, but the structured `answerFields` are the preferred import format for multi-step questions.

Do not import this content until:

- all hints are added
- all worked solutions are added
- all common mistakes are added
- LaTeX/formatting glitches are fixed
- accepted answers are reviewed
- final maths QA is complete
- dynamic skill path routing is ready or a deliberate temporary static route is accepted

Import status:

- Content-bank draft: complete enough to store
- Learning-layer fields: present in Markdown draft
- App-ready data conversion: not yet
- Marking policy: every Chain rule question is intended to be auto-marked
- Recommended marking mode for PPQs: auto-mark using structured answer fields for multi-step questions
- Current project priority: architecture, QA, and testing before content import


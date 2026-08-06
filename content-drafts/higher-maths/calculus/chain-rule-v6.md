# STEM Forge — Higher Maths Chain Rule Question Bank v6

Status: **QA-reviewed auto-mark content-bank draft with structured answer fields**  
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
- Applications: 9
- Past Paper-style Questions: 15
- Total: 34

Repartition note (v6 → this revision):
- Five tangent-equation questions (formerly a-010, ppq-022, ppq-023, ppq-024, ppq-025) were migrated unchanged to the new Tangents draft (`tangents-and-normals-v1.md`), since their assessed deliverable is a tangent-line equation, not a Chain Rule differentiation result. Applications: 10 → 9; PPQ: 25 → 21.
- Six further PPQs (formerly ppq-001, ppq-002, ppq-005, ppq-006, ppq-009, ppq-013) were removed: ppq-001 duplicated Foundations f-003 verbatim; the other five duplicated an existing Foundations shape closely enough (same inner-function type, same reasoning steps, same misconception target) that relocating them would have added no distinct coverage. PPQ: 21 → 15. One future replacement slot is reserved for the removed literal duplicate; no replacement is authored in this pass.
- ppq-010 is retained for now — a multiplier-plus-quadratic-inner combination not identical to any single existing question.

Past Paper-style v6 calibration note:
- PPQs are built from recurring Higher Maths Chain rule patterns: direct composite differentiation, quadratic inside functions, fractional/negative powers, gradient evaluation, and rate/gradient-condition questions.
- Later-topic patterns are deliberately excluded from this Chain Rule bank: trig Chain rule, stationary points, closed intervals, optimisation, integration, and normal lines. These should live in later skill paths or Mixed Differentiation. Tangent-equation questions now live in the Tangents bank, not here.
- Questions are original STEM Forge QS-style content. They are calibrated from past-paper patterns but do not copy official wording, numbers, scenarios, diagrams, or marking instructions.

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
For the function $y=(4x+3)^6$, which expression is the inside function?

A. $4x+3$  
B. $x^6$  
C. $4x$  
D. $(4x+3)^6$

Correct answer:  
A. $4x+3$

Accepted answers:
- A
- 4x+3
- 4x + 3

Hint:  
Look at the expression inside the brackets.

Worked solution:  
The function is
$$
y=(4x+3)^6.
$$
The outside operation is raising to the power 6. The expression inside the brackets is
$$
4x+3.
$$
So the inside function is $4x+3$.

Common mistake:  
Choosing the whole expression $(4x+3)^6$ instead of just the expression inside the brackets.

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
For the function $y=(2x^2-5)^4$, which expression should be treated as the inside function when using the chain rule?

A. $2x^2$  
B. $2x^2-5$  
C. $x^4$  
D. $4(2x^2-5)^3$

Correct answer:  
B. $2x^2-5$

Accepted answers:
- B
- 2x^2-5
- 2x^2 - 5

Hint:  
The inside function is the full expression being raised to the power 4.

Worked solution:  
The function is
$$
y=(2x^2-5)^4.
$$
The expression inside the brackets is
$$
2x^2-5.
$$
So the inside function is $2x^2-5$.

Common mistake:  
Choosing only $2x^2$ and leaving out the $-5$.

---

### F003 — hm-calc-diff-chain-f-003

Stage: Foundations  
Subskill: Basic chain rule with $(ax+b)^n$  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate $y=(3x+2)^5$ with respect to $x$.

Correct answer:  
15(3x+2)^4

Accepted answers:
- 15(3x+2)^4
- 15*(3x+2)^4
- 15(3x + 2)^4

Hint:  
Bring down the outside power, then multiply by the derivative of $3x+2$.

Worked solution:  
$$
y=(3x+2)^5
$$
Differentiate the outside power:
$$
5(3x+2)^4.
$$
Then multiply by the derivative of the bracket:
$$
\frac{d}{dx}(3x+2)=3.
$$
So
$$
\frac{dy}{dx}=5(3x+2)^4\cdot3
$$
$$
\frac{dy}{dx}=15(3x+2)^4.
$$

Common mistake:  
Writing $5(3x+2)^4$ and forgetting to multiply by 3.

---

### F004 — hm-calc-diff-chain-f-004

Stage: Foundations  
Subskill: Basic chain rule with $(ax-b)^n$  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate $y=(5x-4)^3$ with respect to $x$.

Correct answer:  
15(5x-4)^2

Accepted answers:
- 15(5x-4)^2
- 15*(5x-4)^2
- 15(5x - 4)^2

Hint:  
After applying the power rule to the bracket, multiply by the derivative of $5x-4$.

Worked solution:  
$$
y=(5x-4)^3
$$
Using the chain rule,
$$
\frac{dy}{dx}=3(5x-4)^2\cdot5.
$$
Therefore,
$$
\frac{dy}{dx}=15(5x-4)^2.
$$

Common mistake:  
Forgetting that $\frac{d}{dx}(5x-4)=5$.

---

### F005 — hm-calc-diff-chain-f-005

Stage: Foundations  
Subskill: Chain rule with a constant multiplier  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate $y=2(4x+1)^6$ with respect to $x$.

Correct answer:  
48(4x+1)^5

Accepted answers:
- 48(4x+1)^5
- 48*(4x+1)^5
- 48(4x + 1)^5

Hint:  
Keep the 2 at the front, then apply the chain rule to $(4x+1)^6$.

Worked solution:  
$$
y=2(4x+1)^6
$$
Using the chain rule,
$$
\frac{dy}{dx}=2\cdot6(4x+1)^5\cdot4.
$$
Multiply the constants:
$$
2\cdot6\cdot4=48.
$$
So
$$
\frac{dy}{dx}=48(4x+1)^5.
$$

Common mistake:  
Forgetting either the coefficient 2 or the derivative of $4x+1$.

---

### F006 — hm-calc-diff-chain-f-006

Stage: Foundations  
Subskill: Chain rule with quadratic inside functions  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate $y=(x^2+4)^5$ with respect to $x$.

Correct answer:  
10x(x^2+4)^4

Accepted answers:
- 10x(x^2+4)^4
- 10*x*(x^2+4)^4
- 10x(x^2 + 4)^4

Hint:  
The derivative of the bracket $x^2+4$ is $2x$.

Worked solution:  
$$
y=(x^2+4)^5
$$
Using the chain rule,
$$
\frac{dy}{dx}=5(x^2+4)^4\cdot2x.
$$
So
$$
\frac{dy}{dx}=10x(x^2+4)^4.
$$

Common mistake:  
Treating $x^2+4$ like its derivative is 1.

---

### F007 — hm-calc-diff-chain-f-007

Stage: Foundations  
Subskill: Chain rule with quadratic inside functions  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate $y=(3x^2-2)^4$ with respect to $x$.

Correct answer:  
24x(3x^2-2)^3

Accepted answers:
- 24x(3x^2-2)^3
- 24*x*(3x^2-2)^3
- 24x(3x^2 - 2)^3

Hint:  
Differentiate the bracket $3x^2-2$ after applying the outside power.

Worked solution:  
$$
y=(3x^2-2)^4
$$
Using the chain rule,
$$
\frac{dy}{dx}=4(3x^2-2)^3\cdot6x.
$$
Therefore,
$$
\frac{dy}{dx}=24x(3x^2-2)^3.
$$

Common mistake:  
Differentiating $3x^2$ as $3x$ instead of $6x$.

---

### F008 — hm-calc-diff-chain-f-008

Stage: Foundations  
Subskill: Chain rule with fractional powers  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate $y=(2x+7)^{1/2}$ with respect to $x$.

Correct answer:  
(2x+7)^(-1/2)

Accepted answers:
- (2x+7)^(-1/2)
- (2x + 7)^(-1/2)
- 1/sqrt(2x+7)
- 1/sqrt(2x + 7)

Hint:  
Use the power $\frac{1}{2}$, then multiply by the derivative of $2x+7$.

Worked solution:  
$$
y=(2x+7)^{1/2}
$$
Using the chain rule,
$$
\frac{dy}{dx}=\frac{1}{2}(2x+7)^{-1/2}\cdot2.
$$
Since $\frac{1}{2}\cdot2=1$,
$$
\frac{dy}{dx}=(2x+7)^{-1/2}.
$$
This can also be written as
$$
\frac{dy}{dx}=\frac{1}{\sqrt{2x+7}}.
$$

Common mistake:  
Forgetting to multiply by 2, or not reducing the power from $\frac{1}{2}$ to $-\frac{1}{2}$.

---

### F009 — hm-calc-diff-chain-f-009

Stage: Foundations  
Subskill: Chain rule with negative powers  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate $y=(x^2+1)^{-3}$ with respect to $x$.

Correct answer:  
-6x(x^2+1)^(-4)

Accepted answers:
- -6x(x^2+1)^(-4)
- -6*x*(x^2+1)^(-4)
- -6x(x^2 + 1)^(-4)
- -6x/(x^2+1)^4
- -6*x/(x^2+1)^4

Hint:  
Bring down the power $-3$, reduce the power by 1, then multiply by $2x$.

Worked solution:  
$$
y=(x^2+1)^{-3}
$$
Using the chain rule,
$$
\frac{dy}{dx}=-3(x^2+1)^{-4}\cdot2x.
$$
So
$$
\frac{dy}{dx}=-6x(x^2+1)^{-4}.
$$
Equivalently,
$$
\frac{dy}{dx}=-\frac{6x}{(x^2+1)^4}.
$$

Common mistake:  
Changing the power from $-3$ to $-2$. Differentiating reduces the power by 1, so it becomes $-4$.

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

I. $y=(3x-1)^5$  
II. $y=4x^5-2x$  
III. $y=(x^2+6)^3$  
IV. $y=7x^3+1$

A. I and II only  
B. I and III only  
C. II and IV only  
D. I, II and III only

Correct answer:  
B. I and III only

Accepted answers:
- B

Hint:  
Look for a function inside another function, usually brackets raised to a power.

Worked solution:  
I has $(3x-1)$ inside a power, so the chain rule is natural.  
II is a polynomial and can be differentiated term by term.  
III has $(x^2+6)$ inside a power, so the chain rule is natural.  
IV is a polynomial and can be differentiated term by term.

So the correct choice is I and III only.

Common mistake:  
Thinking every power of $x$, such as $x^5$, needs the chain rule.

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
For $y=(2x+3)^4$, calculate the gradient of the curve at the point where $x=1$.

Correct answer:  
1000

Accepted answers:
- 1000

Hint:  
Differentiate first, then substitute $x=1$ into $\frac{dy}{dx}$.

Worked solution:  
$$
y=(2x+3)^4
$$
$$
\frac{dy}{dx}=4(2x+3)^3\cdot2
$$
$$
\frac{dy}{dx}=8(2x+3)^3.
$$
At $x=1$,
$$
\frac{dy}{dx}=8(2(1)+3)^3=8(5)^3=1000.
$$
So the gradient is 1000.

Common mistake:  
Substituting $x=1$ into the original function instead of into the derivative.

---

### A002 — hm-calc-diff-chain-a-002

Stage: Applications  
Subskill: Chain rule with a two-term inside derivative  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate $y=(x^2+4x)^5$ with respect to $x$.

Correct answer:  
5(2x+4)(x^2+4x)^4

Accepted answers:
- 5(2x+4)(x^2+4x)^4
- 5*(2x+4)*(x^2+4x)^4
- 10(x+2)(x^2+4x)^4
- 10*(x+2)*(x^2+4x)^4

Hint:  
The derivative of the bracket is $2x+4$, not just $2x$.

Worked solution:  
$$
y=(x^2+4x)^5
$$
Using the chain rule,
$$
\frac{dy}{dx}=5(x^2+4x)^4(2x+4).
$$
So
$$
\frac{dy}{dx}=5(2x+4)(x^2+4x)^4.
$$
This can also be written as
$$
\frac{dy}{dx}=10(x+2)(x^2+4x)^4.
$$

Common mistake:  
Forgetting to differentiate the $4x$ term inside the bracket.

---

### A003 — hm-calc-diff-chain-a-003

Stage: Applications  
Subskill: Gradient at a point with a constant multiplier  
Type: numerical  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Calculate

Question:  
For $y=3(2x^2-1)^3$, calculate the value of $\frac{dy}{dx}$ when $x=2$.

Correct answer:  
3528

Accepted answers:
- 3528

Hint:  
Keep the coefficient 3 at the front, then differentiate the bracket using the chain rule.

Worked solution:  
$$
y=3(2x^2-1)^3
$$
$$
\frac{dy}{dx}=3\cdot3(2x^2-1)^2\cdot4x
$$
$$
\frac{dy}{dx}=36x(2x^2-1)^2.
$$
At $x=2$,
$$
\frac{dy}{dx}=36(2)(2(2)^2-1)^2
$$
$$
=72(7)^2=3528.
$$

Common mistake:  
Forgetting the outside coefficient 3, or forgetting that $\frac{d}{dx}(2x^2-1)=4x$.

---

### A004 — hm-calc-diff-chain-a-004

Stage: Applications  
Subskill: Chain rule with negative powers and positive-power final form  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate $y=(3x-2)^{-4}$ with respect to $x$, giving your answer with positive powers.

Correct answer:  
-12/(3x-2)^5

Accepted answers:
- -12/(3x-2)^5
- -12/(3x - 2)^5

Hint:  
Differentiate first using the negative power, then rewrite the answer as a fraction.

Worked solution:  
$$
y=(3x-2)^{-4}
$$
Using the chain rule,
$$
\frac{dy}{dx}=-4(3x-2)^{-5}\cdot3
$$
$$
\frac{dy}{dx}=-12(3x-2)^{-5}.
$$
With positive powers,
$$
\frac{dy}{dx}=-\frac{12}{(3x-2)^5}.
$$

Common mistake:  
Leaving the answer as $-12(3x-2)^{-5}$, even though the question asks for positive powers.

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
For $y=\sqrt{5x+4}$, calculate $\frac{dy}{dx}$ when $x=1$.

Correct answer:  
5/6

Accepted answers:
- 5/6

Hint:  
Rewrite the square root as $(5x+4)^{1/2}$.

Worked solution:  
$$
y=\sqrt{5x+4}=(5x+4)^{1/2}
$$
$$
\frac{dy}{dx}=\frac{1}{2}(5x+4)^{-1/2}\cdot5
$$
$$
\frac{dy}{dx}=\frac{5}{2\sqrt{5x+4}}.
$$
At $x=1$,
$$
\frac{dy}{dx}=\frac{5}{2\sqrt{9}}=\frac{5}{6}.
$$

Common mistake:  
Forgetting to multiply by the derivative of $5x+4$, which is 5.

---

### A006 — hm-calc-diff-chain-a-006

Stage: Applications  
Subskill: Rewrite square root then apply chain rule  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate $y=\sqrt{7x-3}$ with respect to $x$.

Correct answer:  
7/(2sqrt(7x-3))

Accepted answers:
- 7/(2sqrt(7x-3))
- 7/(2*sqrt(7x-3))
- (7/2)(7x-3)^(-1/2)
- 7/2*(7x-3)^(-1/2)

Hint:  
Use $\sqrt{7x-3}=(7x-3)^{1/2}$.

Worked solution:  
$$
y=\sqrt{7x-3}=(7x-3)^{1/2}
$$
$$
\frac{dy}{dx}=\frac{1}{2}(7x-3)^{-1/2}\cdot7
$$
$$
\frac{dy}{dx}=\frac{7}{2}(7x-3)^{-1/2}
$$
$$
\frac{dy}{dx}=\frac{7}{2\sqrt{7x-3}}.
$$

Common mistake:  
Writing $\frac{1}{2\sqrt{7x-3}}$ and forgetting the factor of 7.

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
Differentiate $y=\frac{1}{(4x+5)^3}$ with respect to $x$.

Correct answer:  
-12/(4x+5)^4

Accepted answers:
- -12/(4x+5)^4
- -12/(4x + 5)^4
- -12(4x+5)^(-4)
- -12*(4x+5)^(-4)

Hint:  
Rewrite the function as $(4x+5)^{-3}$.

Worked solution:  
$$
y=\frac{1}{(4x+5)^3}=(4x+5)^{-3}
$$
Using the chain rule,
$$
\frac{dy}{dx}=-3(4x+5)^{-4}\cdot4
$$
$$
\frac{dy}{dx}=-12(4x+5)^{-4}.
$$
Equivalently,
$$
\frac{dy}{dx}=-\frac{12}{(4x+5)^4}.
$$

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
For $y=(x^2-2x+6)^3$, calculate the gradient of the curve at the point where $x=2$.

Correct answer:  
216

Accepted answers:
- 216

Hint:  
Differentiate the bracket $x^2-2x+6$, then substitute $x=2$.

Worked solution:  
$$
y=(x^2-2x+6)^3
$$
$$
\frac{dy}{dx}=3(x^2-2x+6)^2(2x-2).
$$
At $x=2$,
$$
\frac{dy}{dx}=3(2^2-2(2)+6)^2(2(2)-2)
$$
$$
=3(6)^2(2)=216.
$$

Common mistake:  
Calculating the $y$-value at $x=2$ instead of the gradient.

---

### A009 — hm-calc-diff-chain-a-009

Stage: Applications  
Subskill: Solving from a gradient condition  
Type: numerical  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Determine

Question:  
For $y=(2x+1)^3$, determine the positive value of $x$ for which the gradient of the curve is 54.

Correct answer:  
1

Accepted answers:
- 1

Hint:  
Find $\frac{dy}{dx}$, set it equal to 54, then solve for $x$.

Worked solution:  
$$
y=(2x+1)^3
$$
$$
\frac{dy}{dx}=3(2x+1)^2\cdot2
$$
$$
\frac{dy}{dx}=6(2x+1)^2.
$$
The gradient is 54, so
$$
6(2x+1)^2=54.
$$
$$
(2x+1)^2=9
$$
$$
2x+1=\pm3.
$$
So
$$
x=1 \quad \text{or} \quad x=-2.
$$
The positive value is
$$
x=1.
$$

Common mistake:  
Stopping at $2x+1=3$ without noticing that a square equation also gives $2x+1=-3$. The question asks for the positive value.

QA note: Rewritten to avoid the artificial condition $\frac{dy}{dx}=24x$. This is still a final Application / bridge-to-PPQ question.

---

## Past Paper-style Questions

### PPQ003 — hm-calc-diff-chain-ppq-003

Stage: Past Paper-style Questions  
Subskill: Chain rule with a negative bracket derivative  
Type: algebraic  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
$$
y=(7-2x)^4
$$
with respect to $x$.

Correct answer:  
$$
\frac{dy}{dx}=-8(7-2x)^3
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: -8(7-2x)^3
    acceptedAnswers:
      - -8(7-2x)^3
      - -8*(7-2x)^3
      - -8(7 - 2x)^3
```

Hint:  
After bringing down the power, multiply by the derivative of $7-2x$.

Worked solution:  
$$
y=(7-2x)^4
$$
Using the Chain rule,
$$
\frac{dy}{dx}=4(7-2x)^3\cdot(-2).
$$
Therefore,
$$
\frac{dy}{dx}=-8(7-2x)^3.
$$

Common mistake:  
Dropping the negative sign from the derivative of $7-2x$.

---

### PPQ004 — hm-calc-diff-chain-ppq-004

Stage: Past Paper-style Questions  
Subskill: Chain rule with a negative linear bracket  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
$$
y=(5-3x)^5
$$
with respect to $x$.

Correct answer:  
$$
\frac{dy}{dx}=-15(5-3x)^4
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: -15(5-3x)^4
    acceptedAnswers:
      - -15(5-3x)^4
      - -15*(5-3x)^4
      - -15(5 - 3x)^4
```

Hint:  
The derivative of $5-3x$ is $-3$.

Worked solution:  
$$
y=(5-3x)^5
$$
Using the Chain rule,
$$
\frac{dy}{dx}=5(5-3x)^4\cdot(-3).
$$
So
$$
\frac{dy}{dx}=-15(5-3x)^4.
$$

Common mistake:  
Writing $15(5-3x)^4$ instead of $-15(5-3x)^4$.

---

### PPQ007 — hm-calc-diff-chain-ppq-007

Stage: Past Paper-style Questions  
Subskill: Chain rule with a quadratic expression inside the bracket  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
$$
y=(x^2+3x+1)^4
$$
with respect to $x$.

Correct answer:  
$$
\frac{dy}{dx}=4(2x+3)(x^2+3x+1)^3
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 4(2x+3)(x^2+3x+1)^3
    acceptedAnswers:
      - 4(2x+3)(x^2+3x+1)^3
      - 4*(2x+3)*(x^2+3x+1)^3
      - 4(2x + 3)(x^2 + 3x + 1)^3
      - (8x+12)(x^2+3x+1)^3
```

Hint:  
The derivative of the inside function $x^2+3x+1$ is $2x+3$.

Worked solution:  
$$
y=(x^2+3x+1)^4
$$
Using the Chain rule,
$$
\frac{dy}{dx}=4(x^2+3x+1)^3(2x+3).
$$
Therefore,
$$
\frac{dy}{dx}=4(2x+3)(x^2+3x+1)^3.
$$

Common mistake:  
Only differentiating the outside power and forgetting the derivative of the full inside expression.

---

### PPQ008 — hm-calc-diff-chain-ppq-008

Stage: Past Paper-style Questions  
Subskill: Chain rule with a negative quadratic inside function  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
$$
y=(6-x^2)^5
$$
with respect to $x$.

Correct answer:  
$$
\frac{dy}{dx}=-10x(6-x^2)^4
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: -10x(6-x^2)^4
    acceptedAnswers:
      - -10x(6-x^2)^4
      - -10*x*(6-x^2)^4
      - -10x(6 - x^2)^4
```

Hint:  
Be careful: the derivative of $6-x^2$ is $-2x$.

Worked solution:  
$$
y=(6-x^2)^5
$$
Using the Chain rule,
$$
\frac{dy}{dx}=5(6-x^2)^4\cdot(-2x).
$$
Therefore,
$$
\frac{dy}{dx}=-10x(6-x^2)^4.
$$

Common mistake:  
Writing $10x(6-x^2)^4$ and losing the negative sign.

---

### PPQ010 — hm-calc-diff-chain-ppq-010

Stage: Past Paper-style Questions  
Subskill: Chain rule with a constant multiplier and quadratic inside function  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
$$
y=2(x^2-1)^5
$$
with respect to $x$.

Correct answer:  
$$
\frac{dy}{dx}=20x(x^2-1)^4
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 20x(x^2-1)^4
    acceptedAnswers:
      - 20x(x^2-1)^4
      - 20*x*(x^2-1)^4
      - 20x(x^2 - 1)^4
```

Hint:  
Keep the multiplier $2$, then multiply by the derivative of $x^2-1$.

Worked solution:  
$$
y=2(x^2-1)^5
$$
Using the Chain rule,
$$
\frac{dy}{dx}=2\cdot 5(x^2-1)^4\cdot 2x.
$$
Therefore,
$$
\frac{dy}{dx}=20x(x^2-1)^4.
$$

Common mistake:  
Using the outside power correctly but forgetting to multiply by $2x$.

---

### PPQ011 — hm-calc-diff-chain-ppq-011

Stage: Past Paper-style Questions  
Subskill: Chain rule with an added basic differentiation term  
Type: algebraic  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
$$
y=(3x+1)^4+5x^2
$$
with respect to $x$.

Correct answer:  
$$
\frac{dy}{dx}=12(3x+1)^3+10x
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 12(3x+1)^3+10x
    acceptedAnswers:
      - 12(3x+1)^3+10x
      - 12*(3x+1)^3+10x
      - 12(3x + 1)^3 + 10x
      - 10x+12(3x+1)^3
```

Hint:  
Use the Chain rule on $(3x+1)^4$, then differentiate $5x^2$ normally.

Worked solution:  
$$
y=(3x+1)^4+5x^2
$$
Using the Chain rule,
$$
\frac{d}{dx}\left((3x+1)^4\right)=4(3x+1)^3\cdot3=12(3x+1)^3.
$$
Also,
$$
\frac{d}{dx}(5x^2)=10x.
$$
Therefore,
$$
\frac{dy}{dx}=12(3x+1)^3+10x.
$$

Common mistake:  
Only differentiating the bracketed term and forgetting the $5x^2$ term.

---

### PPQ012 — hm-calc-diff-chain-ppq-012

Stage: Past Paper-style Questions  
Subskill: Chain rule with a square-root composite  
Type: multi_step  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
$$
y=\sqrt{5x+4}
$$
with respect to $x$.

Correct answer:  
$$
\frac{dy}{dx}=\frac{5}{2}(5x+4)^{-1/2}
$$
or
$$
\frac{dy}{dx}=\frac{5}{2\sqrt{5x+4}}.
$$

Answer fields:
```yaml
answerFields:
  - id: rewritten_form
    label: Rewritten form
    type: algebraic
    correctAnswer: (5x+4)^(1/2)
    acceptedAnswers:
      - (5x+4)^(1/2)
      - (5x + 4)^(1/2)
      - (5x+4)^0.5
      - sqrt(5x+4)
    assessed: false

  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: (5/2)(5x+4)^(-1/2)
    acceptedAnswers:
      - (5/2)(5x+4)^(-1/2)
      - 5/2(5x+4)^(-1/2)
      - 5/(2sqrt(5x+4))
      - 5/(2sqrt(5x + 4))
      - 5/(2*sqrt(5x+4))
    assessed: true
```

Hint:  
Rewrite the square root as a power of $\frac12$.

Worked solution:  
$$
y=\sqrt{5x+4}=(5x+4)^{1/2}.
$$
Using the Chain rule,
$$
\frac{dy}{dx}=\frac12(5x+4)^{-1/2}\cdot5.
$$
So
$$
\frac{dy}{dx}=\frac52(5x+4)^{-1/2}.
$$
This can also be written as
$$
\frac{dy}{dx}=\frac{5}{2\sqrt{5x+4}}.
$$

Common mistake:  
Writing $\frac12(5x+4)^{-1/2}$ and forgetting to multiply by 5.

---

### PPQ014 — hm-calc-diff-chain-ppq-014

Stage: Past Paper-style Questions  
Subskill: Chain rule with a negative power  
Type: algebraic  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Differentiate

Question:  
Differentiate
$$
y=(x+3)^{-2}
$$
with respect to $x$.

Correct answer:  
$$
\frac{dy}{dx}=-2(x+3)^{-3}
$$
or
$$
\frac{dy}{dx}=-\frac{2}{(x+3)^3}.
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: -2(x+3)^(-3)
    acceptedAnswers:
      - -2(x+3)^(-3)
      - -2*(x+3)^(-3)
      - -2(x + 3)^(-3)
      - -2/(x+3)^3
      - -2/((x+3)^3)
```

Hint:  
Bring down the power $-2$, then reduce the power by 1.

Worked solution:  
$$
y=(x+3)^{-2}
$$
Using the Chain rule,
$$
\frac{dy}{dx}=-2(x+3)^{-3}\cdot1.
$$
Therefore,
$$
\frac{dy}{dx}=-2(x+3)^{-3}.
$$

Common mistake:  
Changing the power from $-2$ to $-1$ instead of reducing it to $-3$.

---

### PPQ015 — hm-calc-diff-chain-ppq-015

Stage: Past Paper-style Questions  
Subskill: Finding a gradient using the Chain rule  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
$$
y=(2x+1)^5.
$$
Find the gradient of the curve at $x=1$.

Correct answer:  
$$
810
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 10(2x+1)^4
    acceptedAnswers:
      - 10(2x+1)^4
      - 10*(2x+1)^4
      - 10(2x + 1)^4
      - dy/dx=10(2x+1)^4
    assessed: false

  - id: gradient
    label: Gradient at x = 1
    type: exact
    correctAnswer: 810
    acceptedAnswers:
      - 810
    assessed: true
```

Hint:  
Differentiate first, then substitute $x=1$ into the derivative.

Worked solution:  
$$
y=(2x+1)^5
$$
Using the Chain rule,
$$
\frac{dy}{dx}=5(2x+1)^4\cdot2=10(2x+1)^4.
$$
At $x=1$,
$$
\frac{dy}{dx}=10(2(1)+1)^4=10(3)^4.
$$
$$
10(3)^4=10\cdot81=810.
$$
So the gradient is
$$
810.
$$

Common mistake:  
Substituting $x=1$ into $y$ instead of into $\frac{dy}{dx}$.

---

### PPQ016 — hm-calc-diff-chain-ppq-016

Stage: Past Paper-style Questions  
Subskill: Finding a gradient with a quadratic inside function  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
$$
y=(x^2+2)^3.
$$
Find the gradient of the curve at $x=2$.

Correct answer:  
$$
432
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 6x(x^2+2)^2
    acceptedAnswers:
      - 6x(x^2+2)^2
      - 6*x*(x^2+2)^2
      - 6x(x^2 + 2)^2
      - dy/dx=6x(x^2+2)^2
    assessed: false

  - id: gradient
    label: Gradient at x = 2
    type: exact
    correctAnswer: 432
    acceptedAnswers:
      - 432
    assessed: true
```

Hint:  
Differentiate using the Chain rule, then substitute $x=2$.

Worked solution:  
$$
y=(x^2+2)^3
$$
Using the Chain rule,
$$
\frac{dy}{dx}=3(x^2+2)^2\cdot2x.
$$
So
$$
\frac{dy}{dx}=6x(x^2+2)^2.
$$
At $x=2$,
$$
\frac{dy}{dx}=6(2)(2^2+2)^2.
$$
$$
=12(6)^2=12\cdot36=432.
$$
So the gradient is
$$
432.
$$

Common mistake:  
Forgetting the $2x$ from differentiating $x^2+2$.

---

### PPQ017 — hm-calc-diff-chain-ppq-017

Stage: Past Paper-style Questions  
Subskill: Comparing gradients after differentiating  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Compare

Question:  
Curve $C_1$ has equation
$$
y=(x+2)^4.
$$
Curve $C_2$ has equation
$$
y=6x^2+1.
$$
Compare the gradients of the two curves at $x=1$.

Correct answer:  
Gradient of $C_1$: $108$  
Gradient of $C_2$: $12$  
$C_1$ has the greater gradient at $x=1$.

Answer fields:
```yaml
answerFields:
  - id: c1_derivative
    label: Derivative of C1
    type: algebraic
    correctAnswer: 4(x+2)^3
    acceptedAnswers:
      - 4(x+2)^3
      - 4*(x+2)^3
      - 4(x + 2)^3
    assessed: false

  - id: c1_gradient
    label: Gradient of C1 at x = 1
    type: exact
    correctAnswer: 108
    acceptedAnswers:
      - 108
    assessed: false

  - id: c2_derivative
    label: Derivative of C2
    type: algebraic
    correctAnswer: 12x
    acceptedAnswers:
      - 12x
      - dy/dx=12x
    assessed: false

  - id: c2_gradient
    label: Gradient of C2 at x = 1
    type: exact
    correctAnswer: 12
    acceptedAnswers:
      - 12
    assessed: false

  - id: greater_gradient
    label: Curve with greater gradient
    type: text_short
    correctAnswer: C1
    acceptedAnswers:
      - C1
      - curve C1
      - first curve
      - y=(x+2)^4
    assessed: true
```

Hint:  
Find each derivative, then substitute $x=1$ into both derivatives.

Worked solution:  
For $C_1$,
$$
y=(x+2)^4.
$$
Using the Chain rule,
$$
\frac{dy}{dx}=4(x+2)^3.
$$
At $x=1$,
$$
4(1+2)^3=4(3)^3=108.
$$

For $C_2$,
$$
y=6x^2+1.
$$
$$
\frac{dy}{dx}=12x.
$$
At $x=1$,
$$
12(1)=12.
$$

Since
$$
108>12,
$$
curve $C_1$ has the greater gradient at $x=1$.

Common mistake:  
Comparing the $y$-values of the curves instead of comparing the gradients.

---

### PPQ018 — hm-calc-diff-chain-ppq-018

Stage: Past Paper-style Questions  
Subskill: Evaluating $f'(a)$ after using the Chain rule  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
Given
$$
f(x)=(x^2+5)^2,
$$
find
$$
f'(3).
$$

Correct answer:  
$$
168
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: f'(x)
    type: algebraic
    correctAnswer: 4x(x^2+5)
    acceptedAnswers:
      - 4x(x^2+5)
      - 4*x*(x^2+5)
      - 4x(x^2 + 5)
      - f'(x)=4x(x^2+5)
    assessed: false

  - id: f_prime_3
    label: f'(3)
    type: exact
    correctAnswer: 168
    acceptedAnswers:
      - 168
    assessed: true
```

Hint:  
Find $f'(x)$, then substitute $x=3$.

Worked solution:  
$$
f(x)=(x^2+5)^2.
$$
Using the Chain rule,
$$
f'(x)=2(x^2+5)\cdot2x.
$$
So
$$
f'(x)=4x(x^2+5).
$$
Now substitute $x=3$:
$$
f'(3)=4(3)(3^2+5).
$$
$$
=12(14)=168.
$$

Common mistake:  
Substituting $x=3$ into $f(x)$ instead of into $f'(x)$.

---

### PPQ019 — hm-calc-diff-chain-ppq-019

Stage: Past Paper-style Questions  
Subskill: Solving a gradient condition after using the Chain rule  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
For
$$
f(x)=(2x+3)^4,
$$
find the value of $x$ for which
$$
f'(x)=8.
$$

Correct answer:  
$$
x=-1
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: f'(x)
    type: algebraic
    correctAnswer: 8(2x+3)^3
    acceptedAnswers:
      - 8(2x+3)^3
      - 8*(2x+3)^3
      - 8(2x + 3)^3
      - f'(x)=8(2x+3)^3
    assessed: false

  - id: gradient_equation
    label: Gradient equation
    type: algebraic
    correctAnswer: 8(2x+3)^3=8
    acceptedAnswers:
      - 8(2x+3)^3=8
      - 8*(2x+3)^3=8
      - (2x+3)^3=1
      - 2x+3=1
    assessed: false

  - id: x_value
    label: x-value
    type: exact
    correctAnswer: -1
    acceptedAnswers:
      - -1
    assessed: true
```

Hint:  
Differentiate first, then set the derivative equal to 8.

Worked solution:  
$$
f(x)=(2x+3)^4
$$
Using the Chain rule,
$$
f'(x)=4(2x+3)^3\cdot2.
$$
So
$$
f'(x)=8(2x+3)^3.
$$
Set this equal to 8:
$$
8(2x+3)^3=8.
$$
$$
(2x+3)^3=1.
$$
$$
2x+3=1.
$$
$$
2x=-2.
$$
$$
x=-1.
$$

Common mistake:  
Setting $f(x)=8$ instead of setting $f'(x)=8$.

---

### PPQ020 — hm-calc-diff-chain-ppq-020

Stage: Past Paper-style Questions  
Subskill: Solving a positive gradient condition with a quadratic inside function  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
For
$$
f(x)=(x^2+1)^3,
$$
find the positive value of $x$ for which
$$
f'(x)=300.
$$

Correct answer:  
$$
x=2
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: f'(x)
    type: algebraic
    correctAnswer: 6x(x^2+1)^2
    acceptedAnswers:
      - 6x(x^2+1)^2
      - 6*x*(x^2+1)^2
      - 6x(x^2 + 1)^2
      - f'(x)=6x(x^2+1)^2
    assessed: false

  - id: substituted_equation
    label: Substituted equation
    type: algebraic
    correctAnswer: 6x(x^2+1)^2=300
    acceptedAnswers:
      - 6x(x^2+1)^2=300
      - 6*x*(x^2+1)^2=300
      - x(x^2+1)^2=50
    assessed: false

  - id: x_value
    label: Positive x-value
    type: exact
    correctAnswer: 2
    acceptedAnswers:
      - 2
    assessed: true
```

Hint:  
Differentiate first, then check the positive value that makes the derivative equal to 300.

Worked solution:  
$$
f(x)=(x^2+1)^3.
$$
Using the Chain rule,
$$
f'(x)=3(x^2+1)^2\cdot2x.
$$
So
$$
f'(x)=6x(x^2+1)^2.
$$
Set this equal to 300:
$$
6x(x^2+1)^2=300.
$$
Check $x=2$:
$$
6(2)(2^2+1)^2=12(5)^2=12\cdot25=300.
$$
Therefore, the positive value is
$$
x=2.
$$

Common mistake:  
Trying to solve the full equation by expanding everything. Since the question asks for the positive value, substitution/checking is a clean method here.

---

### PPQ021 — hm-calc-diff-chain-ppq-021

Stage: Past Paper-style Questions  
Subskill: Finding an unknown coefficient from a gradient condition  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
$$
y=(kx+1)^3,
$$
where $k$ is a positive constant.

The gradient of the curve at $x=1$ is $54$.

Find the value of $k$.

Correct answer:  
$$
k=2
$$

Answer fields:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 3k(kx+1)^2
    acceptedAnswers:
      - 3k(kx+1)^2
      - 3*k*(kx+1)^2
      - 3k(kx + 1)^2
      - dy/dx=3k(kx+1)^2
      - dy/dx = 3k(kx + 1)^2
    assessed: false

  - id: gradient_equation
    label: Gradient equation at x = 1
    type: algebraic
    correctAnswer: 3k(k+1)^2=54
    acceptedAnswers:
      - 3k(k+1)^2=54
      - 3*k*(k+1)^2=54
      - 3k(k + 1)^2 = 54
    assessed: false

  - id: coefficient
    label: Value of k
    type: exact
    correctAnswer: 2
    acceptedAnswers:
      - 2
    assessed: true
```

Hint:  
Differentiate using the Chain rule, then substitute $x=1$ and use the given gradient.

Worked solution:  
$$
y=(kx+1)^3
$$
Using the Chain rule,
$$
\frac{dy}{dx}=3(kx+1)^2\cdot k.
$$
So
$$
\frac{dy}{dx}=3k(kx+1)^2.
$$

At $x=1$,
$$
\frac{dy}{dx}=3k(k+1)^2.
$$

The gradient is $54$, so
$$
3k(k+1)^2=54.
$$

Since $k$ is positive, check $k=2$:
$$
3(2)(2+1)^2=6(9)=54.
$$
Therefore,
$$
k=2.
$$

Common mistake:  
Differentiating $kx+1$ as $x+1$, instead of recognising that its derivative is $k$.

---

## Past Paper-style Questions — all questions together for skim

1. Differentiate $y=(7-2x)^4$ with respect to $x$.  
2. Differentiate $y=(5-3x)^5$ with respect to $x$.  
3. Differentiate $y=(x^2+3x+1)^4$ with respect to $x$.  
4. Differentiate $y=(6-x^2)^5$ with respect to $x$.  
5. Differentiate $y=2(x^2-1)^5$ with respect to $x$.  
6. Differentiate $y=(3x+1)^4+5x^2$ with respect to $x$.  
7. Differentiate $y=\sqrt{5x+4}$ with respect to $x$.  
8. Differentiate $y=(x+3)^{-2}$ with respect to $x$.  
9. A curve has equation $y=(2x+1)^5$. Find the gradient of the curve at $x=1$.  
10. A curve has equation $y=(x^2+2)^3$. Find the gradient of the curve at $x=2$.  
11. Curve $C_1$ has equation $y=(x+2)^4$. Curve $C_2$ has equation $y=6x^2+1$. Compare the gradients of the two curves at $x=1$.  
12. Given $f(x)=(x^2+5)^2$, find $f'(3)$.  
13. For $f(x)=(2x+3)^4$, find the value of $x$ for which $f'(x)=8$.  
14. For $f(x)=(x^2+1)^3$, find the positive value of $x$ for which $f'(x)=300$.  
15. A curve has equation $y=(kx+1)^3$, where $k$ is a positive constant. The gradient of the curve at $x=1$ is $54$. Find the value of $k$.

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


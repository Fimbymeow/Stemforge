# Orthic — Higher Maths Tangents Question Bank v1

- skillPathId: tangents-and-normals-v1

Status: publication-ready Practice V2 candidate awaiting human approval. Do not import or publish without an approval receipt.

Canonical owner: `tangents-and-normals` (Tangents). Universal hard prerequisite: `basic-differentiation` only. `chain-rule` is declared only on questions that use it. Scope excludes normals, stationary points, implicit differentiation and circle geometry.

## Practice

### Q001 — hm-calc-tangent-q-001
Subskill: Direct polynomial tangent
Type: algebraic
Marks: 3
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Find the equation of the tangent to $y=3x^2-2x+1$ at $x=-1$.
Correct answer: $y=-8x-2$
Accepted answers:
- y=-8x-2
- y-6=-8(x+1)
- 8x+y+2=0
Hint: Evaluate the derivative and the curve separately at $x=-1$.
Worked solution: $\frac{dy}{dx}=6x-2$, so $m=-8$ and the point is $(-1,6)$. Hence $y-6=-8(x+1)$, giving $y=-8x-2$.
Common mistake: Substituting $x=-1$ into the curve but not into the derivative.

### Q002 — hm-calc-tangent-q-002
Subskill: Direct polynomial tangent
Type: algebraic
Marks: 3
Calculator/non-calculator: Non-calculator
Command word: Determine
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Determine the tangent to $y=2x^3-x+5$ where $x=0$.
Correct answer: $y=-x+5$
Accepted answers:
- y=-x+5
- x+y-5=0
Hint: Keep the constant term in the curve, but not in its derivative.
Worked solution: $\frac{dy}{dx}=6x^2-1$, so $m=-1$ and the point is $(0,5)$. Thus $y=-x+5$.
Common mistake: Dropping the negative sign in the gradient.

### Q003 — hm-calc-tangent-q-003
Subskill: Direct polynomial tangent
Type: algebraic
Marks: 3
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Find the tangent to $y=x^4+x^2-3x+2$ at $x=1$.
Correct answer: $y=3x-2$
Accepted answers:
- y=3x-2
- y-1=3(x-1)
Hint: Differentiate every non-constant term before evaluating at $x=1$.
Worked solution: $\frac{dy}{dx}=4x^3+2x-3$, so $m=3$ and the point is $(1,1)$. Therefore $y-1=3(x-1)$, giving $y=3x-2$.
Common mistake: Setting the derivative equal to zero as if finding a stationary point.

### Q004 — hm-calc-tangent-q-004
Subskill: Negative leading coefficient
Type: algebraic
Marks: 3
Calculator/non-calculator: Non-calculator
Command word: Obtain
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Obtain the tangent to $y=-x^3+3x^2+2$ at $x=1$.
Correct answer: $y=3x+1$
Accepted answers:
- y=3x+1
- y-4=3(x-1)
Hint: Retain the negative sign when differentiating the cubic term.
Worked solution: $\frac{dy}{dx}=-3x^2+6x$, so $m=3$ and the point is $(1,4)$. Hence $y-4=3(x-1)$.
Common mistake: Differentiating $-x^3$ as $3x^2$.

### Q005 — hm-calc-tangent-q-005
Subskill: Fractional intercept
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Find the tangent to $y=\frac12x^4-3x$ at $x=-1$.
Correct answer: $y=-5x-3/2$
Accepted answers:
- y=-5x-3/2
- 2y=-10x-3
Hint: The contact point is $(-1,\frac72)$.
Worked solution: $\frac{dy}{dx}=2x^3-3$, so $m=-5$. Using $(-1,\frac72)$ gives $y-\frac72=-5(x+1)$, hence $y=-5x-\frac32$.
Common mistake: Making a sign error when expanding $-5(x+1)$.

### Q006 — hm-calc-tangent-q-006
Subskill: Supplied contact point
Type: algebraic
Marks: 3
Calculator/non-calculator: Non-calculator
Command word: Determine
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: The point $(2,18)$ lies on $y=2x^3+x^2-3x+4$. Determine the tangent there.
Correct answer: $y=25x-32$
Accepted answers:
- y=25x-32
- y-18=25(x-2)
Hint: The point is already supplied; calculate only the gradient.
Worked solution: $\frac{dy}{dx}=6x^2+2x-3$, so $m=25$. Then $y-18=25(x-2)$ and $y=25x-32$.
Common mistake: Recalculating the supplied point incorrectly.

### Q007 — hm-calc-tangent-q-007
Subskill: Negative contact value
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Find the tangent to $y=x^4-4x^2+1$ at $x=-1$.
Correct answer: $y=4x+2$
Accepted answers:
- y=4x+2
- y+2=4(x+1)
Hint: Substitute $-1$ carefully into both expressions.
Worked solution: $\frac{dy}{dx}=4x^3-8x$, so $m=4$ and the point is $(-1,-2)$. Thus $y+2=4(x+1)$.
Common mistake: Treating $(-1)^3$ as positive.

### Q008 — hm-calc-tangent-q-008
Subskill: Descending quadratic
Type: algebraic
Marks: 3
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Find the tangent to $y=4-2x-x^2$ where $x=-2$.
Correct answer: $y=2x+8$
Accepted answers:
- y=2x+8
- y-4=2(x+2)
Hint: Keep both negative signs in the derivative.
Worked solution: $\frac{dy}{dx}=-2-2x$, so $m=2$ and the point is $(-2,4)$. Hence $y-4=2(x+2)$.
Common mistake: Using the contact value $-2$ as the gradient.

### Q009 — hm-calc-tangent-q-009
Subskill: Zero curve value
Type: algebraic
Marks: 3
Calculator/non-calculator: Non-calculator
Command word: Determine
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Determine the tangent to $y=3x^3+2x^2-5$ at $x=1$.
Correct answer: $y=13x-13$
Accepted answers:
- y=13x-13
- y=13(x-1)
Hint: The contact point lies on the $x$-axis.
Worked solution: $\frac{dy}{dx}=9x^2+4x$, so $m=13$ and the point is $(1,0)$. Therefore $y=13(x-1)$.
Common mistake: Writing $y=13x$ and ignoring the contact point.

### Q010 — hm-calc-tangent-q-010
Subskill: Quartic with negative gradient
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Find the tangent to $y=-2x^4+x^2+6$ at $x=1$.
Correct answer: $y=-6x+11$
Accepted answers:
- y=-6x+11
- y-5=-6(x-1)
Hint: Find the gradient and contact value independently.
Worked solution: $\frac{dy}{dx}=-8x^3+2x$, so $m=-6$ and the point is $(1,5)$. Thus $y-5=-6(x-1)$.
Common mistake: Losing the negative sign while rearranging.

### Q011 — hm-calc-tangent-q-011
Subskill: Negative contact value
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Obtain
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Obtain the tangent to $y=x^3+6x^2+3$ where $x=-2$.
Correct answer: $y=-12x-5$
Accepted answers:
- y=-12x-5
- y-19=-12(x+2)
Hint: In point-gradient form, $x-(-2)=x+2$.
Worked solution: $\frac{dy}{dx}=3x^2+12x$, so $m=-12$ and the point is $(-2,19)$. Hence $y-19=-12(x+2)$.
Common mistake: Writing $x-2$ instead of $x+2$.

### Q012 — hm-calc-tangent-q-012
Subskill: Multi-term quartic
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Find the tangent to $y=2x^4-5x^2+x$ at $x=-1$.
Correct answer: $y=3x-1$
Accepted answers:
- y=3x-1
- y+4=3(x+1)
Hint: Differentiate every term before substituting.
Worked solution: $\frac{dy}{dx}=8x^3-10x+1$, so $m=3$ and the point is $(-1,-4)$. Therefore $y+4=3(x+1)$.
Common mistake: Omitting the derivative of the linear term.

### Q013 — hm-calc-tangent-q-013
Subskill: Simplify before differentiating
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: For $x\ne0$, find the tangent to $y=\frac{x^3+2x^2-3x}{x}$ at $x=2$.
Correct answer: $y=6x-7$
Accepted answers:
- y=6x-7
- y-5=6(x-2)
Hint: Simplify the curve before differentiating.
Worked solution: $y=x^2+2x-3$, so $\frac{dy}{dx}=2x+2$. At $x=2$, $m=6$ and the point is $(2,5)$, giving $y=6x-7$.
Common mistake: Applying the power rule to the unsimplified quotient term by term.

### Q014 — hm-calc-tangent-q-014
Subskill: Fractional contact coordinate
Type: algebraic
Marks: 5
Calculator/non-calculator: Non-calculator
Command word: Determine
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Determine the tangent to $y=2x^3-x^2+1$ at $x=\frac12$.
Correct answer: $4y=2x+3$
Accepted answers:
- 4y=2x+3
- y=x/2+3/4
- y-1=1/2(x-1/2)
Hint: Keep the contact coordinate and gradient as exact fractions.
Worked solution: $\frac{dy}{dx}=6x^2-2x$. At $x=\frac12$, the gradient is $m=\frac12$ and the curve value is $1$. Hence $y-1=\frac12(x-\frac12)$, or $4y=2x+3$.
Common mistake: Treating $\left(\frac12\right)^2$ as $\frac12$ when evaluating the derivative.

### Q015 — hm-calc-tangent-q-015
Subskill: Direct polynomial with negative gradient
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Find the tangent to $y=3x^4-2x^3+x-5$ at $x=-1$.
Correct answer: $y=-17x-18$
Accepted answers:
- y=-17x-18
- y+1=-17(x+1)
- 17x+y+18=0
Hint: Substitute $x=-1$ separately into the curve and its derivative.
Worked solution: $\frac{dy}{dx}=12x^3-6x^2+1$. At $x=-1$, $m=-17$ and the point is $(-1,-1)$. Thus $y+1=-17(x+1)$, giving $y=-17x-18$.
Common mistake: Treating the even power $(-1)^2$ as negative in the derivative.

### Q016 — hm-calc-tangent-q-016
Subskill: Fractional coefficient and intercept
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Find the tangent to $y=\frac13x^3-2x^2+5x-1$ at $x=2$.
Correct answer: $3y=3x+5$
Accepted answers:
- 3y=3x+5
- y=x+5/3
- y-11/3=x-2
Hint: Keep the curve value exact before forming the line equation.
Worked solution: $\frac{dy}{dx}=x^2-4x+5$, so $m=1$ at $x=2$. The curve value is $\frac{11}{3}$, hence $y-\frac{11}{3}=x-2$, or $3y=3x+5$.
Common mistake: Differentiating $\frac13x^3$ as $\frac13x^2$.

### Q017 — hm-calc-tangent-q-017
Subskill: Fractional gradient
Type: algebraic
Marks: 5
Calculator/non-calculator: Non-calculator
Command word: Obtain
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Obtain the tangent to $y=\frac16x^3+x^2-2x$ at $x=-1$.
Correct answer: $21x+6y+4=0$
Accepted answers:
- 21x+6y+4=0
- y=-7x/2-2/3
- y-17/6=-7/2(x+1)
Hint: Keep both the gradient and contact value as exact fractions.
Worked solution: $\frac{dy}{dx}=\frac12x^2+2x-2$. At $x=-1$, $m=-\frac72$ and the curve value is $\frac{17}{6}$. Thus $y-\frac{17}{6}=-\frac72(x+1)$, which rearranges to $21x+6y+4=0$.
Common mistake: Using the negative reciprocal of $-\frac72$ instead of the tangent gradient itself.

### Q018 — hm-calc-tangent-q-018
Subskill: Multi-term odd-power polynomial
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Determine
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Determine the tangent to $y=5-3x+2x^3-x^5$ at $x=-1$.
Correct answer: $y=-2x+5$
Accepted answers:
- y=-2x+5
- y-7=-2(x+1)
- 2x+y-5=0
Hint: Evaluate each odd power carefully at $x=-1$.
Worked solution: $\frac{dy}{dx}=-3+6x^2-5x^4$, so $m=-2$ at $x=-1$. The point is $(-1,7)$, giving $y-7=-2(x+1)$ and $y=-2x+5$.
Common mistake: Assigning a negative value to the even powers in the derivative.

### Q019 — hm-calc-tangent-q-019
Subskill: Linear-inside composite
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
    - chain-rule
```
Question: Find the tangent to $y=(x-2)^3+1$ at $x=3$.
Correct answer: $y=3x-7$
Accepted answers:
- y=3x-7
- y-2=3(x-3)
Hint: Use the original curve to find the point.
Worked solution: $\frac{dy}{dx}=3(x-2)^2$, so $m=3$ and the point is $(3,2)$. Hence $y=3x-7$.
Common mistake: Forgetting the final $+1$ in the curve value.

### Q020 — hm-calc-tangent-q-020
Subskill: Scaled linear-inside composite
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
    - chain-rule
```
Question: Find the tangent to $y=(3x+2)^2-5x$ at $x=0$.
Correct answer: $y=7x+4$
Accepted answers:
- y=7x+4
- y-4=7x
- 7x-y+4=0
Hint: Differentiate both the composite term and the separate linear term.
Worked solution: $\frac{dy}{dx}=6(3x+2)-5$. At $x=0$, $m=7$ and the point is $(0,4)$. Thus $y-4=7x$, giving $y=7x+4$.
Common mistake: Differentiating the bracket correctly but omitting the derivative of $-5x$.

### Q021 — hm-calc-tangent-q-021
Subskill: Decreasing composite
Type: algebraic
Marks: 4
Calculator/non-calculator: Non-calculator
Command word: Determine
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
    - chain-rule
```
Question: Determine the tangent to $y=(3-x)^4$ at $x=2$.
Correct answer: $y=-4x+9$
Accepted answers:
- y=-4x+9
- y-1=-4(x-2)
Hint: The derivative of $3-x$ is $-1$.
Worked solution: $\frac{dy}{dx}=-4(3-x)^3$, so $m=-4$ and the point is $(2,1)$. Hence $y=-4x+9$.
Common mistake: Missing the negative inside derivative.

### Q022 — hm-calc-tangent-q-022
Subskill: High-degree direct polynomial
Type: algebraic
Marks: 5
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Find the tangent to $y=2x^5-5x^3+4x^2-7$ at $x=-1$.
Correct answer: $y=-13x-13$
Accepted answers:
- y=-13x-13
- y=-13(x+1)
- 13x+y+13=0
Hint: Evaluate the curve and its derivative independently at the negative coordinate.
Worked solution: $\frac{dy}{dx}=10x^4-15x^2+8x$. At $x=-1$, $m=-13$ and the curve value is $0$. Therefore $y=-13(x+1)$, or $y=-13x-13$.
Common mistake: Making the odd-power terms positive when substituting $x=-1$ into the curve.

### Q023 — hm-calc-tangent-q-023
Subskill: Cubic composite
Type: algebraic
Marks: 5
Calculator/non-calculator: Non-calculator
Command word: Obtain
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
    - chain-rule
```
Question: Obtain the tangent to $y=(2x^2-x)^3$ at $x=1$.
Correct answer: $y=9x-8$
Accepted answers:
- y=9x-8
- y-1=9(x-1)
Hint: The inside derivative is $4x-1$.
Worked solution: $\frac{dy}{dx}=3(2x^2-x)^2(4x-1)$, so $m=9$ and the point is $(1,1)$. Thus $y=9x-8$.
Common mistake: Using the inside value $1$ as the gradient.

### Q024 — hm-calc-tangent-q-024
Subskill: Quadratic-inside composite
Type: algebraic
Marks: 5
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
    - chain-rule
```
Question: Find the tangent to $y=(x^2-3x+4)^2$ at $x=1$.
Correct answer: $y=-4x+8$
Accepted answers:
- y=-4x+8
- y-4=-4(x-1)
Hint: Evaluate both factors of the derivative.
Worked solution: $\frac{dy}{dx}=2(x^2-3x+4)(2x-3)$, so $m=-4$ and the point is $(1,4)$. Hence $y=-4x+8$.
Common mistake: Substituting into only one factor of the derivative.

### Q025 — hm-calc-tangent-q-025
Subskill: Supplied point with fractional gradient
Type: algebraic
Marks: 5
Calculator/non-calculator: Non-calculator
Command word: Determine
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: The point $\left(3,\frac{23}{2}\right)$ lies on $y=\frac12x^3-2x+4$. Determine the tangent there.
Correct answer: $2y=23x-46$
Accepted answers:
- 2y=23x-46
- y=23x/2-23
- y-23/2=23/2(x-3)
Hint: The contact point is supplied, so only the gradient needs to be calculated from the curve.
Worked solution: $\frac{dy}{dx}=\frac32x^2-2$, so at $x=3$ the gradient is $\frac{23}{2}$. Using the supplied point gives $y-\frac{23}{2}=\frac{23}{2}(x-3)$, or $2y=23x-46$.
Common mistake: Using the supplied $y$-coordinate as the gradient because both values happen to be $\frac{23}{2}$.

### Q026 — hm-calc-tangent-q-026
Subskill: Negative-power composite
Type: algebraic
Marks: 5
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
    - chain-rule
```
Question: Find the tangent to $y=(x+1)^{-2}$ at $x=1$.
Correct answer: $x+4y=2$
Accepted answers:
- x+4y=2
- y=-x/4+1/2
Hint: Keep the gradient and point values exact.
Worked solution: $\frac{dy}{dx}=-2(x+1)^{-3}$, so $m=-\frac14$ and the point is $(1,\frac14)$. Hence $x+4y=2$.
Common mistake: Reducing the power incorrectly.

### Q027 — hm-calc-tangent-q-027
Subskill: Reciprocal quadratic composite
Type: algebraic
Marks: 5
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
    - chain-rule
```
Question: Find the tangent to $y=(x^2+2x+2)^{-1}$ at $x=0$.
Correct answer: $x+2y=1$
Accepted answers:
- x+2y=1
- y=-x/2+1/2
Hint: Differentiate the reciprocal form with the chain rule.
Worked solution: $\frac{dy}{dx}=-(2x+2)(x^2+2x+2)^{-2}$, so $m=-\frac12$ and the point is $(0,\frac12)$. Thus $x+2y=1$.
Common mistake: Forgetting the squared denominator after differentiating.

### Q028 — hm-calc-tangent-q-028
Subskill: Calculator polynomial tangent
Type: algebraic
Marks: 5
Calculator/non-calculator: Calculator
Command word: Determine
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
```
Question: Determine the tangent to $y=1.6x^3-2.4x^2+0.7x+1.2$ at $x=1.5$.
Correct answer: $y=4.3x-4.2$
Accepted answers:
- y=4.3x-4.2
- y-2.25=4.3(x-1.5)
- 10y=43x-42
Hint: Use the calculator to evaluate the curve and derivative values accurately before forming the line.
Worked solution: $\frac{dy}{dx}=4.8x^2-4.8x+0.7$. At $x=1.5$, the gradient is $4.3$ and the curve value is $2.25$. Hence $y-2.25=4.3(x-1.5)$, so $y=4.3x-4.2$.
Common mistake: Rounding the contact value or gradient before completing the line equation.

### Q029 — hm-calc-tangent-q-029
Subskill: Composite at a negative x-value
Type: algebraic
Marks: 5
Calculator/non-calculator: Non-calculator
Command word: Obtain
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
    - chain-rule
```
Question: Obtain the tangent to $y=(x^2+2)^3$ at $x=-1$.
Correct answer: $y=-54x-27$
Accepted answers:
- y=-54x-27
- y-27=-54(x+1)
Hint: Take care with the factor $2x$ at $x=-1$.
Worked solution: $\frac{dy}{dx}=6x(x^2+2)^2$, so $m=-54$ and the point is $(-1,27)$. Hence $y=-54x-27$.
Common mistake: Losing the negative sign from $2x$.

### Q030 — hm-calc-tangent-q-030
Subskill: Negative inside value
Type: algebraic
Marks: 5
Calculator/non-calculator: Non-calculator
Command word: Find
Curriculum metadata:
```yaml
curriculum:
  primarySkillId: tangents-and-normals
  requiredSkillIds:
    - chain-rule
```
Question: Find the tangent to $y=(1-2x^2)^4$ at $x=1$.
Correct answer: $y=16x-15$
Accepted answers:
- y=16x-15
- y-1=16(x-1)
Hint: Preserve the sign of the cubed inside value.
Worked solution: $\frac{dy}{dx}=-16x(1-2x^2)^3$, so $m=16$ and the point is $(1,1)$. Thus $y=16x-15$.
Common mistake: Assuming the gradient is negative from the derivative's first factor alone.

## Practice Skim List

1. $3x^2-2x+1$ at $x=-1$; 2. $2x^3-x+5$ at $x=0$; 3. $x^4+x^2-3x+2$ at $x=1$; 4. $-x^3+3x^2+2$ at $x=1$; 5. $\frac12x^4-3x$ at $x=-1$.
6. $2x^3+x^2-3x+4$ at supplied point $(2,18)$; 7. $x^4-4x^2+1$ at $x=-1$; 8. $4-2x-x^2$ at $x=-2$; 9. $3x^3+2x^2-5$ at $x=1$; 10. $-2x^4+x^2+6$ at $x=1$.
11. $x^3+6x^2+3$ at $x=-2$; 12. $2x^4-5x^2+x$ at $x=-1$; 13. $(x^3+2x^2-3x)/x$ at $x=2$; 14. $2x^3-x^2+1$ at $x=\frac12$; 15. $3x^4-2x^3+x-5$ at $x=-1$.
16. $\frac13x^3-2x^2+5x-1$ at $x=2$; 17. $\frac16x^3+x^2-2x$ at $x=-1$; 18. $5-3x+2x^3-x^5$ at $x=-1$; 19. $(x-2)^3+1$ at $x=3$; 20. $(3x+2)^2-5x$ at $x=0$.
21. $(3-x)^4$ at $x=2$; 22. $2x^5-5x^3+4x^2-7$ at $x=-1$; 23. $(2x^2-x)^3$ at $x=1$; 24. $(x^2-3x+4)^2$ at $x=1$; 25. $\frac12x^3-2x+4$ at supplied point $\left(3,\frac{23}{2}\right)$.
26. $(x+1)^{-2}$ at $x=1$; 27. $(x^2+2x+2)^{-1}$ at $x=0$; 28. $1.6x^3-2.4x^2+0.7x+1.2$ at $x=1.5$ (calculator); 29. $(x^2+2)^3$ at $x=-1$; 30. $(1-2x^2)^4$ at $x=1$.

## Historical draft disposition

- `hm-calc-tangent-a-001`: REVISE — retain the tangent-owned composite family, with a fresh prompt and neutral ID.
- `hm-calc-tangent-ppq-001`: REPLACE — retire the near-duplicate linear-inside cubic.
- `hm-calc-tangent-ppq-002`: REVISE — retain the nonlinear-inside family through new original variants.
- `hm-calc-tangent-ppq-003`: REVISE — retain the square-root family with new coefficients and contact values.
- `hm-calc-tangent-ppq-004`: REPLACE — remove the staged derivative subpart; Practice V2 assesses the tangent equation directly.

All five old IDs were draft-only and remain retired. No alias or learner-evidence migration is required.

## Historical pattern calibration

Official Higher Mathematics papers and marking instructions were re-audited before authoring. Relevant derivative-tangent items typically award about four or five marks across finding or using the contact point, differentiating, evaluating the gradient and stating an equivalent affine line equation. Both non-calculator and calculator contexts occur, and equivalent rearranged line forms are accepted. Negative- and fractional-power curve patterns were observed historically but are deferred from this bank because the current canonical taxonomy has no honest available prerequisite for their differentiation; they must not be disguised as Chain Rule. Circle-tangency questions were excluded because they belong to circle geometry. These broad patterns informed coverage only; no official expression, data, wording sequence or marking-instruction phrasing was copied.

# STEM Forge — Higher Maths Stationary Points Question Bank v1

Status: **approved auto-mark content-bank draft with structured answer fields**  
Do not import into the app yet. Store as a future content-bank draft.

Path: Higher Maths → Calculus → Differentiation → Stationary Points

Source label: Original STEM Forge QS-style content  
QS skill tested: Finding stationary points, determining their nature using gradient/sign tables, and applying stationary points to increasing/decreasing and closed interval questions  
Independence note: Independent original material; not affiliated with or endorsed by SQA.

Import defaults:
- skillPathId: hm-calc-diff-stationary
- source: Original STEM Forge QS-style content
- stageId mapping:
  - Foundations → foundations
  - Applications → applications
  - Past Paper-style Questions → past-paper-style

Draft import type note:
Some answer field types in this Markdown draft, such as `exact`, `coordinate`, `interval`, `exact_list`, and `text_short`, are content-bank labels. During app import, map these to the actual supported STEM Forge input types.

Final draft count:
- Foundations: 8
- Applications: 10
- Past Paper-style Questions: 13
- Total: 31

Content boundary:
- Include: finding stationary points, solving \(f'(x)=0\), finding coordinates, determining nature using a gradient table/sign of \(f'(x)\), horizontal points of inflexion, increasing/decreasing intervals, and a small number of closed interval greatest/least value questions.
- Avoid: second derivative method, full optimisation contexts, normal lines, vague written interpretation, integration/reverse differentiation, hard modelling, and questions that require manual sketch marking.

Stationary point method note:
At stationary points, \(f'(x)=0\). Nature should be determined using a gradient table or the sign of \(f'(x)\), not using the second derivative.

Stationary Points import/UI note:
This bank will require structured multi-field auto-mark UI. In particular, the app should support separate answer fields for coordinates, stationary x-values, natures of points, intervals, endpoint values, greatest/least values, and derivative expressions. Do not build graph sketching or second-derivative workflows for this skill path.

Storage note:
This is a content-bank draft, not active app data. Import later only after architecture, QA, and testing are ready.

---

## Foundations

### F001 — hm-calc-diff-stationary-f-001

Stage: Foundations  
Subskill: Recognising the condition for a stationary point  
Type: multiple_choice  
Marks: 1  
Calculator/non-calculator: Non-calculator  
Command word: Identify

Question:  
At a stationary point on a curve \(y=f(x)\), which statement is true?

A. \(f(x)=0\)  
B. \(f'(x)=0\)  
C. \(f''(x)=0\)  
D. \(x=0\)

Correct answer:  
B. \(f'(x)=0\)

Accepted answers:
- B
- f'(x)=0
- derivative=0
- derivative = 0
- dy/dx=0
- gradient=0
- gradient = 0

Hint:  
A stationary point occurs where the gradient of the curve is zero.

Worked solution:  
At a stationary point, the tangent to the curve is horizontal.  
A horizontal tangent has gradient 0.  
Since \(f'(x)\) represents the gradient of the curve,
\[
f'(x)=0.
\]

Common mistake:  
Using \(f(x)=0\). This finds where the curve crosses the \(x\)-axis, not where it is stationary.

---
### F002 — hm-calc-diff-stationary-f-002

Stage: Foundations  
Subskill: Finding the stationary \(x\)-coordinate  
Type: multi_step  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^2-6x+8.
\]
Find the \(x\)-coordinate of its stationary point.

Correct answer:  
\[
x=3
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 2x-6
    acceptedAnswers:
      - 2x-6
      - 2x - 6
      - dy/dx=2x-6
      - dy/dx = 2x - 6

  - id: stationary_x_coordinate
    label: Stationary x-coordinate
    type: exact
    correctAnswer: 3
    acceptedAnswers:
      - 3
      - x=3
      - x = 3
```

Hint:  
Differentiate, then set \(\frac{dy}{dx}=0\).

Worked solution:  
\[
y=x^2-6x+8
\]
Differentiate:
\[
\frac{dy}{dx}=2x-6.
\]
At stationary points,
\[
\frac{dy}{dx}=0.
\]
So
\[
2x-6=0
\]
\[
x=3.
\]

Common mistake:  
Substituting \(x=0\) into the curve instead of setting the derivative equal to zero.

---
### F003 — hm-calc-diff-stationary-f-003

Stage: Foundations  
Subskill: Finding the full stationary point  
Type: multi_step  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^2-4x+1.
\]
Find the coordinates of its stationary point.

Correct answer:  
\[
(2,-3)
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 2x-4
    acceptedAnswers:
      - 2x-4
      - 2x - 4
      - dy/dx=2x-4
      - dy/dx = 2x - 4

  - id: stationary_x_coordinate
    label: Stationary x-coordinate
    type: exact
    correctAnswer: 2
    acceptedAnswers:
      - 2
      - x=2
      - x = 2

  - id: stationary_point
    label: Stationary point
    type: coordinate
    correctAnswer: (2,-3)
    acceptedAnswers:
      - (2,-3)
      - (2, -3)
      - 2,-3
      - x=2,y=-3
      - x = 2, y = -3
```

Hint:  
Find \(x\) using \(\frac{dy}{dx}=0\), then substitute into the original equation to find \(y\).

Worked solution:  
\[
y=x^2-4x+1
\]
\[
\frac{dy}{dx}=2x-4.
\]
At stationary points,
\[
2x-4=0
\]
\[
x=2.
\]
Substitute \(x=2\) into the original equation:
\[
y=2^2-4(2)+1=4-8+1=-3.
\]
So the stationary point is
\[
(2,-3).
\]

Common mistake:  
Finding \(x=2\) but forgetting to substitute into the original equation to find \(y\).

---
### F004 — hm-calc-diff-stationary-f-004

Stage: Foundations  
Subskill: Identifying a minimum from a gradient table  
Type: multi_step  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
A curve has equation
\[
y=x^2-8x+5.
\]
The stationary point occurs at \(x=4\). The sign of \(\frac{dy}{dx}\) around this point is shown in the table.

\[
\begin{array}{c|ccc}
x & x<4 & 4 & x>4 \\
\hline
\frac{dy}{dx} & - & 0 & + \\
\text{slope} & \backslash & - & /
\end{array}
\]

State the nature of the stationary point.

Correct answer:  
Minimum

Answer fields for import:
```yaml
answerFields:
  - id: nature
    label: Nature of point
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
      - turning point is a minimum
```

Hint:  
A change from negative gradient to positive gradient gives a minimum.

Worked solution:  
Before \(x=4\), \(\frac{dy}{dx}<0\), so the curve is decreasing.  
After \(x=4\), \(\frac{dy}{dx}>0\), so the curve is increasing.  
The curve changes from decreasing to increasing, so the stationary point is a minimum.

Common mistake:  
Thinking that any stationary point on a quadratic is automatically a maximum. The sign change decides the nature.

---
### F005 — hm-calc-diff-stationary-f-005

Stage: Foundations  
Subskill: Identifying a maximum from a gradient table  
Type: multi_step  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
A curve has equation
\[
y=-x^2+6x+2.
\]
The stationary point occurs at \(x=3\). The sign of \(\frac{dy}{dx}\) around this point is shown in the table.

\[
\begin{array}{c|ccc}
x & x<3 & 3 & x>3 \\
\hline
\frac{dy}{dx} & + & 0 & - \\
\text{slope} & / & - & \backslash
\end{array}
\]

State the nature of the stationary point.

Correct answer:  
Maximum

Answer fields for import:
```yaml
answerFields:
  - id: nature
    label: Nature of point
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum
      - turning point is a maximum
```

Hint:  
A change from positive gradient to negative gradient gives a maximum.

Worked solution:  
Before \(x=3\), \(\frac{dy}{dx}>0\), so the curve is increasing.  
After \(x=3\), \(\frac{dy}{dx}<0\), so the curve is decreasing.  
The curve changes from increasing to decreasing, so the stationary point is a maximum.

Common mistake:  
Only looking at \(\frac{dy}{dx}=0\). The nature depends on the sign of the derivative on both sides.

---
### F006 — hm-calc-diff-stationary-f-006

Stage: Foundations  
Subskill: Determining nature from a derivative sign table  
Type: multiple_choice  
Marks: 1  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
A stationary point occurs at \(x=2\). The sign of \(f'(x)\) around this point is shown below.

\[
\begin{array}{c|ccc}
x & x<2 & 2 & x>2 \\
\hline
f'(x) & + & 0 & - \\
\text{slope} & / & - & \backslash
\end{array}
\]

What is the nature of the stationary point?

A. Maximum  
B. Minimum  
C. Horizontal point of inflexion  
D. Not enough information

Correct answer:  
A. Maximum

Accepted answers:
- A
- maximum
- max
- local maximum

Hint:  
A change from positive gradient to negative gradient gives a maximum.

Worked solution:  
Before \(x=2\), the derivative is positive, so the curve is increasing.  
After \(x=2\), the derivative is negative, so the curve is decreasing.  
The curve changes from increasing to decreasing, so the stationary point is a maximum.

Common mistake:  
Thinking that \(f'(x)=0\) alone tells you the nature. You need the sign of \(f'(x)\) on both sides.

---
### F007 — hm-calc-diff-stationary-f-007

Stage: Foundations  
Subskill: Recognising a horizontal point of inflexion  
Type: multiple_choice  
Marks: 1  
Calculator/non-calculator: Non-calculator  
Command word: Identify

Question:  
A stationary point occurs at \(x=0\). The sign of \(f'(x)\) around this point is shown below.

\[
\begin{array}{c|ccc}
x & x<0 & 0 & x>0 \\
\hline
f'(x) & + & 0 & + \\
\text{slope} & / & - & /
\end{array}
\]

Which description is correct?

A. Maximum  
B. Minimum  
C. Horizontal point of inflexion  
D. \(x\)-intercept

Correct answer:  
C. Horizontal point of inflexion

Accepted answers:
- C
- horizontal point of inflexion
- point of inflexion
- stationary point of inflexion
- stationary inflexion

Hint:  
The derivative is zero at the point, but the sign of the derivative does not change.

Worked solution:  
The derivative is positive before \(x=0\), zero at \(x=0\), and positive after \(x=0\).  
So the curve is increasing on both sides of the stationary point.  
The gradient becomes zero but the curve does not change from increasing to decreasing or decreasing to increasing. Therefore, the point is a horizontal point of inflexion.

Common mistake:  
Calling every stationary point either a maximum or a minimum.

---
### F008 — hm-calc-diff-stationary-f-008

Stage: Foundations  
Subskill: Identifying increasing and decreasing intervals from the derivative  
Type: multi_step  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
For a function \(f(x)\),
\[
f'(x)=(x-1)(x-5).
\]
State the intervals where \(f(x)\) is increasing and decreasing.

Correct answer:  
Increasing for \(x<1\) and \(x>5\).  
Decreasing for \(1<x<5\).

Answer fields for import:
```yaml
answerFields:
  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: 1,5
    acceptedAnswers:
      - 1,5
      - 1 and 5
      - x=1 and x=5
      - x = 1, x = 5

  - id: increasing_intervals
    label: Increasing intervals
    type: interval
    correctAnswer: x<1 and x>5
    acceptedAnswers:
      - x<1 and x>5
      - x < 1 and x > 5
      - (-infinity,1) and (5,infinity)
      - (-∞,1) and (5,∞)

  - id: decreasing_interval
    label: Decreasing interval
    type: interval
    correctAnswer: 1<x<5
    acceptedAnswers:
      - 1<x<5
      - 1 < x < 5
      - (1,5)
```

Hint:  
Use test values in each interval: \(x<1\), \(1<x<5\), and \(x>5\).

Worked solution:  
At stationary points,
\[
f'(x)=0.
\]
So
\[
(x-1)(x-5)=0.
\]
Therefore,
\[
x=1 \quad \text{or} \quad x=5.
\]
For \(x<1\), try \(x=0\):
\[
f'(0)=(-1)(-5)>0.
\]
So \(f(x)\) is increasing.

For \(1<x<5\), try \(x=2\):
\[
f'(2)=(1)(-3)<0.
\]
So \(f(x)\) is decreasing.

For \(x>5\), try \(x=6\):
\[
f'(6)=(5)(1)>0.
\]
So \(f(x)\) is increasing.

Common mistake:  
Only finding \(x=1\) and \(x=5\), without using the sign of the derivative to decide where the function is increasing or decreasing.

---

## Applications

### A001 — hm-calc-diff-stationary-a-001

Stage: Applications  
Subskill: Finding and classifying two stationary points of a cubic  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^3-6x^2+9x+2.
\]
Find the coordinates of the stationary points and determine their nature using a gradient table.

Correct answer:  
\[
(1,6)\text{ maximum}, \quad (3,2)\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2-12x+9
    acceptedAnswers:
      - 3x^2-12x+9
      - 3x^2 - 12x + 9
      - 3(x-1)(x-3)
      - 3*(x-1)*(x-3)

  - id: stationary_point_at_x_1
    label: Stationary point at x=1
    type: coordinate
    correctAnswer: (1,6)
    acceptedAnswers:
      - (1,6)
      - (1, 6)
      - 1,6

  - id: nature_at_x_1
    label: Nature at x=1
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_point_at_x_3
    label: Stationary point at x=3
    type: coordinate
    correctAnswer: (3,2)
    acceptedAnswers:
      - (3,2)
      - (3, 2)
      - 3,2

  - id: nature_at_x_3
    label: Nature at x=3
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum

  - id: full_answer_reference
    label: Full answer reference
    type: text_short
    correctAnswer: (1,6) maximum and (3,2) minimum
    acceptedAnswers:
      - (1,6) maximum and (3,2) minimum
      - maximum at (1,6), minimum at (3,2)
```

Hint:  
Differentiate, set \(\frac{dy}{dx}=0\), then use the sign of \(\frac{dy}{dx}\) around each stationary point.

Worked solution:  
\[
y=x^3-6x^2+9x+2
\]
\[
\frac{dy}{dx}=3x^2-12x+9=3(x-1)(x-3).
\]
At stationary points,
\[
\frac{dy}{dx}=0.
\]
So
\[
3(x-1)(x-3)=0.
\]
Therefore,
\[
x=1 \quad \text{or} \quad x=3.
\]
For \(x=1\):
\[
y=1-6+9+2=6.
\]
For \(x=3\):
\[
y=27-54+27+2=2.
\]
So the stationary points are \((1,6)\) and \((3,2)\).

The derivative \(3(x-1)(x-3)\) is positive for \(x<1\), negative for \(1<x<3\), and positive for \(x>3\).  
So \((1,6)\) is a maximum and \((3,2)\) is a minimum.

Common mistake:  
Finding the stationary \(x\)-values but not substituting them into the original equation to find the full coordinates.

---
### A002 — hm-calc-diff-stationary-a-002

Stage: Applications  
Subskill: Finding stationary points and nature using sign of derivative  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=2x^3-9x^2+12x+1.
\]
Find the coordinates and nature of the stationary points using the sign of \(f'(x)\).

Correct answer:  
\[
(1,6)\text{ maximum}, \quad (2,5)\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 6x^2-18x+12
    acceptedAnswers:
      - 6x^2-18x+12
      - 6x^2 - 18x + 12
      - 6(x-1)(x-2)
      - 6*(x-1)*(x-2)

  - id: stationary_point_at_x_1
    label: Stationary point at x=1
    type: coordinate
    correctAnswer: (1,6)
    acceptedAnswers:
      - (1,6)
      - (1, 6)
      - 1,6

  - id: nature_at_x_1
    label: Nature at x=1
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_point_at_x_2
    label: Stationary point at x=2
    type: coordinate
    correctAnswer: (2,5)
    acceptedAnswers:
      - (2,5)
      - (2, 5)
      - 2,5

  - id: nature_at_x_2
    label: Nature at x=2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Factorise the derivative, then check the sign of \(f'(x)\) in each interval.

Worked solution:  
\[
\frac{dy}{dx}=6x^2-18x+12=6(x-1)(x-2).
\]
At stationary points,
\[
6(x-1)(x-2)=0.
\]
So
\[
x=1 \quad \text{or} \quad x=2.
\]
For \(x=1\):
\[
y=2-9+12+1=6.
\]
For \(x=2\):
\[
y=16-36+24+1=5.
\]
The derivative is positive for \(x<1\), negative for \(1<x<2\), and positive for \(x>2\).  
So \((1,6)\) is a maximum and \((2,5)\) is a minimum.

Common mistake:  
Using only \(f'(x)=0\) and not checking the sign of the derivative to determine nature.

---
### A003 — hm-calc-diff-stationary-a-003

Stage: Applications  
Subskill: Determining nature from a derivative sign table  
Type: multi_step  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
A function \(f\) has stationary points at \(x=-2\) and \(x=4\). The sign of \(f'(x)\) is shown in the table.

\[
\begin{array}{c|ccccc}
x & x<-2 & -2 & -2<x<4 & 4 & x>4 \\
\hline
f'(x) & + & 0 & - & 0 & + \\
\text{slope} & / & - & \backslash & - & /
\end{array}
\]

State the nature of each stationary point.

Correct answer:  
\[
x=-2\text{ is a maximum}, \quad x=4\text{ is a minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: nature_at_minus_2
    label: Nature at x=-2
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: nature_at_4
    label: Nature at x=4
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
A change from positive to negative gradient gives a maximum. A change from negative to positive gradient gives a minimum.

Worked solution:  
At \(x=-2\), \(f'(x)\) changes from positive to negative, so the curve changes from increasing to decreasing. This is a maximum.  
At \(x=4\), \(f'(x)\) changes from negative to positive, so the curve changes from decreasing to increasing. This is a minimum.

Common mistake:  
Looking only at the zeros of \(f'(x)\), rather than checking the sign change around them.

---
### A004 — hm-calc-diff-stationary-a-004

Stage: Applications  
Subskill: Finding stationary points of a cubic with no quadratic term  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^3-12x+5.
\]
Find the coordinates of the stationary points and determine their nature using a gradient table.

Correct answer:  
\[
(-2,21)\text{ maximum}, \quad (2,-11)\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2-12
    acceptedAnswers:
      - 3x^2-12
      - 3x^2 - 12
      - 3(x-2)(x+2)
      - 3*(x-2)*(x+2)

  - id: stationary_point_at_x_minus_2
    label: Stationary point at x=-2
    type: coordinate
    correctAnswer: (-2,21)
    acceptedAnswers:
      - (-2,21)
      - (-2, 21)
      - -2,21

  - id: nature_at_x_minus_2
    label: Nature at x=-2
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_point_at_x_2
    label: Stationary point at x=2
    type: coordinate
    correctAnswer: (2,-11)
    acceptedAnswers:
      - (2,-11)
      - (2, -11)
      - 2,-11

  - id: nature_at_x_2
    label: Nature at x=2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
When solving \(3x^2-12=0\), remember there are two possible values of \(x\).

Worked solution:  
\[
\frac{dy}{dx}=3x^2-12=3(x-2)(x+2).
\]
At stationary points,
\[
3(x-2)(x+2)=0.
\]
So
\[
x=-2 \quad \text{or} \quad x=2.
\]
For \(x=-2\):
\[
y=(-2)^3-12(-2)+5=21.
\]
For \(x=2\):
\[
y=2^3-12(2)+5=-11.
\]
The derivative is positive for \(x<-2\), negative for \(-2<x<2\), and positive for \(x>2\).  
So \((-2,21)\) is a maximum and \((2,-11)\) is a minimum.

Common mistake:  
Only giving \(x=2\) and forgetting \(x=-2\).

---
### A005 — hm-calc-diff-stationary-a-005

Stage: Applications  
Subskill: Identifying a horizontal point of inflexion  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^3-3x^2+3x+2.
\]
Find the stationary point of the curve and state its nature.

Correct answer:  
\[
(1,3)\text{ horizontal point of inflexion}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2-6x+3
    acceptedAnswers:
      - 3x^2-6x+3
      - 3x^2 - 6x + 3
      - 3(x-1)^2
      - 3*(x-1)^2

  - id: stationary_point
    label: Stationary point
    type: coordinate
    correctAnswer: (1,3)
    acceptedAnswers:
      - (1,3)
      - (1, 3)
      - 1,3

  - id: nature
    label: Nature of point
    type: text_short
    correctAnswer: horizontal point of inflexion
    acceptedAnswers:
      - horizontal point of inflexion
      - point of inflexion
      - stationary point of inflexion
      - stationary inflexion
```

Hint:  
If \(f'(x)=0\) but the sign of \(f'(x)\) does not change, the point is a horizontal point of inflexion.

Worked solution:  
\[
\frac{dy}{dx}=3x^2-6x+3=3(x-1)^2.
\]
At stationary points,
\[
3(x-1)^2=0.
\]
So
\[
x=1.
\]
Substitute into the original equation:
\[
y=1^3-3(1)^2+3(1)+2=3.
\]
The derivative \(3(x-1)^2\) is positive on both sides of \(x=1\), but equals zero at \(x=1\).  
So \((1,3)\) is a horizontal point of inflexion.

Common mistake:  
Calling the point a minimum because the derivative is squared. Here the derivative is positive on both sides, so the curve keeps increasing.

---
### A006 — hm-calc-diff-stationary-a-006

Stage: Applications  
Subskill: Finding intervals of increasing and decreasing  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
For a function \(f\),
\[
f'(x)=3(x+1)(x-3).
\]
State the intervals where \(f(x)\) is increasing and decreasing.

Correct answer:  
Increasing for \(x<-1\) and \(x>3\).  
Decreasing for \(-1<x<3\).

Answer fields for import:
```yaml
answerFields:
  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: -1,3
    acceptedAnswers:
      - -1,3
      - -1 and 3
      - x=-1 and x=3
      - x = -1, x = 3

  - id: increasing_intervals
    label: Increasing intervals
    type: interval
    correctAnswer: x<-1 and x>3
    acceptedAnswers:
      - x<-1 and x>3
      - x < -1 and x > 3
      - (-infinity,-1) and (3,infinity)
      - (-∞,-1) and (3,∞)

  - id: decreasing_interval
    label: Decreasing interval
    type: interval
    correctAnswer: -1<x<3
    acceptedAnswers:
      - -1<x<3
      - -1 < x < 3
      - (-1,3)
```

Hint:  
Find where \(f'(x)=0\), then test the sign of \(f'(x)\) in each interval.

Worked solution:  
At stationary points,
\[
f'(x)=0.
\]
So
\[
3(x+1)(x-3)=0.
\]
Therefore,
\[
x=-1 \quad \text{or} \quad x=3.
\]
For \(x<-1\), try \(x=-2\):
\[
f'(-2)=3(-1)(-5)>0.
\]
For \(-1<x<3\), try \(x=0\):
\[
f'(0)=3(1)(-3)<0.
\]
For \(x>3\), try \(x=4\):
\[
f'(4)=3(5)(1)>0.
\]
So \(f(x)\) is increasing for \(x<-1\) and \(x>3\), and decreasing for \(-1<x<3\).

Common mistake:  
Assuming the function is increasing between the two stationary points without checking the sign of \(f'(x)\).

---
### A007 — hm-calc-diff-stationary-a-007

Stage: Applications  
Subskill: Stationary point of a composite function  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=(x^2-4x+5)^2.
\]
Find the coordinates of its stationary point and determine its nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\[
(2,1)\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 4(x-2)(x^2-4x+5)
    acceptedAnswers:
      - 4(x-2)(x^2-4x+5)
      - 4*(x-2)*(x^2-4x+5)
      - 2(x^2-4x+5)(2x-4)
      - 2*(x^2-4x+5)*(2x-4)

  - id: stationary_point
    label: Stationary point
    type: coordinate
    correctAnswer: (2,1)
    acceptedAnswers:
      - (2,1)
      - (2, 1)
      - 2,1

  - id: nature
    label: Nature of point
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Use the chain rule first. Then note that \(x^2-4x+5=(x-2)^2+1\), so it is always positive.

Worked solution:  
\[
y=(x^2-4x+5)^2
\]
Using the chain rule:
\[
\frac{dy}{dx}=2(x^2-4x+5)(2x-4).
\]
This can be written as
\[
\frac{dy}{dx}=4(x-2)(x^2-4x+5).
\]
Since
\[
x^2-4x+5=(x-2)^2+1,
\]
this bracket is always positive.  
So the stationary point occurs when
\[
x-2=0,
\]
so
\[
x=2.
\]
Then
\[
y=(2^2-4(2)+5)^2=1.
\]
For \(x<2\), \(\frac{dy}{dx}<0\). For \(x>2\), \(\frac{dy}{dx}>0\).  
So \((2,1)\) is a minimum.

Common mistake:  
Trying to solve \(x^2-4x+5=0\), even though it has no real roots.

---
### A008 — hm-calc-diff-stationary-a-008

Stage: Applications  
Subskill: Stationary points of a quartic using a gradient table  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^4-8x^2+3.
\]
Find the \(x\)-coordinates of the stationary points and determine their nature using a gradient table.

Correct answer:  
\[
x=-2\text{ minimum}, \quad x=0\text{ maximum}, \quad x=2\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 4x(x-2)(x+2)
    acceptedAnswers:
      - 4x(x-2)(x+2)
      - 4*x*(x-2)*(x+2)
      - 4x^3-16x
      - 4x^3 - 16x

  - id: stationary_x_minus_2
    label: Stationary x-value -2
    type: exact
    correctAnswer: -2
    acceptedAnswers:
      - -2
      - x=-2
      - x = -2

  - id: nature_at_x_minus_2
    label: Nature at x=-2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum

  - id: stationary_x_0
    label: Stationary x-value 0
    type: exact
    correctAnswer: 0
    acceptedAnswers:
      - 0
      - x=0
      - x = 0

  - id: nature_at_x_0
    label: Nature at x=0
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_x_2
    label: Stationary x-value 2
    type: exact
    correctAnswer: 2
    acceptedAnswers:
      - 2
      - x=2
      - x = 2

  - id: nature_at_x_2
    label: Nature at x=2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Factorise \(\frac{dy}{dx}\), then test the sign in each interval.

Worked solution:  
\[
\frac{dy}{dx}=4x^3-16x=4x(x^2-4)=4x(x-2)(x+2).
\]
At stationary points,
\[
4x(x-2)(x+2)=0.
\]
So
\[
x=-2,\quad x=0,\quad x=2.
\]
Testing the sign of \(4x(x-2)(x+2)\):
- for \(x<-2\), \(\frac{dy}{dx}<0\)
- for \(-2<x<0\), \(\frac{dy}{dx}>0\)
- for \(0<x<2\), \(\frac{dy}{dx}<0\)
- for \(x>2\), \(\frac{dy}{dx}>0\)

So \(x=-2\) is a minimum, \(x=0\) is a maximum, and \(x=2\) is a minimum.

Common mistake:  
Only solving \(x^2-4=0\) and forgetting the factor \(x\).
---

### A009 — hm-calc-diff-stationary-a-009

Stage: Applications  
Subskill: Nature from a given derivative  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find / Determine

Question:  
For a function \(f\),
\[
f'(x)=2(x+1)(x-5).
\]

(a) Find the stationary \(x\)-values.  
(b) Use the sign of \(f'(x)\) to determine the nature of each stationary point.

Correct answer:  
\[
x=-1\text{ maximum}, \quad x=5\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: stationary_x_minus_1
    label: Stationary x-value -1
    type: exact
    correctAnswer: -1
    acceptedAnswers:
      - -1
      - x=-1
      - x = -1

  - id: nature_at_x_minus_1
    label: Nature at x=-1
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_x_5
    label: Stationary x-value 5
    type: exact
    correctAnswer: 5
    acceptedAnswers:
      - 5
      - x=5
      - x = 5

  - id: nature_at_x_5
    label: Nature at x=5
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Set \(f'(x)=0\), then check the sign of \(f'(x)\) in the intervals.

Worked solution:  
At stationary points,
\[
f'(x)=0.
\]
So
\[
2(x+1)(x-5)=0.
\]
Therefore,
\[
x=-1 \quad \text{or} \quad x=5.
\]
The derivative is positive for \(x<-1\), negative for \(-1<x<5\), and positive for \(x>5\).  
So \(x=-1\) gives a maximum and \(x=5\) gives a minimum.

Common mistake:  
Treating the coefficient 2 as if it changes the stationary \(x\)-values.

---
### A010 — hm-calc-diff-stationary-a-010

Stage: Applications  
Subskill: Multiple stationary values from a given derivative  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find / Determine

Question:  
For a function \(f\),
\[
f'(x)=(x+2)^2(x-3).
\]

(a) Find the stationary \(x\)-values.  
(b) Use the sign of \(f'(x)\) to determine the nature at each stationary value.

Correct answer:  
\[
x=-2\text{ horizontal point of inflexion}, \quad x=3\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: stationary_x_minus_2
    label: Stationary x-value -2
    type: exact
    correctAnswer: -2
    acceptedAnswers:
      - -2
      - x=-2
      - x = -2

  - id: nature_at_x_minus_2
    label: Nature at x=-2
    type: text_short
    correctAnswer: horizontal point of inflexion
    acceptedAnswers:
      - horizontal point of inflexion
      - point of inflexion
      - stationary point of inflexion
      - stationary inflexion

  - id: stationary_x_3
    label: Stationary x-value 3
    type: exact
    correctAnswer: 3
    acceptedAnswers:
      - 3
      - x=3
      - x = 3

  - id: nature_at_x_3
    label: Nature at x=3
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Remember that \((x+2)^2\) does not change sign when passing through \(x=-2\).

Worked solution:  
At stationary points,
\[
f'(x)=0.
\]
So
\[
(x+2)^2(x-3)=0.
\]
Therefore,
\[
x=-2 \quad \text{or} \quad x=3.
\]
The factor \((x+2)^2\) is always positive except when \(x=-2\), where it is zero.  
The sign of \(f'(x)\) is negative on both sides of \(x=-2\), so \(x=-2\) gives a horizontal point of inflexion.  
At \(x=3\), the derivative changes from negative to positive, so \(x=3\) gives a minimum.

Common mistake:  
Assuming every repeated factor gives a minimum. Here the sign of \(f'(x)\) does not change at \(x=-2\).

---
## Past Paper-style Questions

### PPQ001 — hm-calc-diff-stationary-ppq-001

Stage: Past Paper-style Questions  
Subskill: Cubic stationary points and nature  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find / Determine

Question:  
A curve has equation
\[
y=x^3-3x^2-9x+5.
\]

(a) Find the coordinates of the stationary points.  
(b) Determine their nature using a gradient table.

Correct answer:  
\[
(-1,10)\text{ maximum}, \quad (3,-22)\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2-6x-9
    acceptedAnswers:
      - 3x^2-6x-9
      - 3x^2 - 6x - 9
      - 3(x+1)(x-3)
      - 3*(x+1)*(x-3)

  - id: stationary_point_at_x_minus_1
    label: Stationary point at x=-1
    type: coordinate
    correctAnswer: (-1,10)
    acceptedAnswers:
      - (-1,10)
      - (-1, 10)
      - -1,10

  - id: nature_at_x_minus_1
    label: Nature at x=-1
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_point_at_x_3
    label: Stationary point at x=3
    type: coordinate
    correctAnswer: (3,-22)
    acceptedAnswers:
      - (3,-22)
      - (3, -22)
      - 3,-22

  - id: nature_at_x_3
    label: Nature at x=3
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Find \(\frac{dy}{dx}\), solve \(\frac{dy}{dx}=0\), then test the sign of the derivative around the stationary values.

Worked solution:  
\[
\frac{dy}{dx}=3x^2-6x-9=3(x+1)(x-3).
\]
At stationary points,
\[
3(x+1)(x-3)=0.
\]
So
\[
x=-1 \quad \text{or} \quad x=3.
\]
For \(x=-1\):
\[
y=(-1)^3-3(-1)^2-9(-1)+5=10.
\]
For \(x=3\):
\[
y=27-27-27+5=-22.
\]
The derivative is positive for \(x<-1\), negative for \(-1<x<3\), and positive for \(x>3\).  
So \((-1,10)\) is a maximum and \((3,-22)\) is a minimum.

Common mistake:  
Giving only the stationary \(x\)-values and not the full coordinates.

---
### PPQ002 — hm-calc-diff-stationary-ppq-002

Stage: Past Paper-style Questions  
Subskill: Stationary points and decreasing interval  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find / State

Question:  
A curve has equation
\[
y=2x^3-15x^2+36x-4.
\]

(a) Find \(\frac{dy}{dx}\).  
(b) Find the coordinates of the stationary points.  
(c) State the interval on which the curve is decreasing.

Correct answer:  
\[
\frac{dy}{dx}=6(x-2)(x-3), \quad (2,24), \quad (3,23), \quad 2<x<3
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 6x^2-30x+36
    acceptedAnswers:
      - 6x^2-30x+36
      - 6x^2 - 30x + 36
      - 6(x-2)(x-3)
      - 6*(x-2)*(x-3)

  - id: stationary_point_at_x_2
    label: Stationary point at x=2
    type: coordinate
    correctAnswer: (2,24)
    acceptedAnswers:
      - (2,24)
      - (2, 24)
      - 2,24

  - id: stationary_point_at_x_3
    label: Stationary point at x=3
    type: coordinate
    correctAnswer: (3,23)
    acceptedAnswers:
      - (3,23)
      - (3, 23)
      - 3,23

  - id: decreasing_interval
    label: Decreasing interval
    type: interval
    correctAnswer: 2<x<3
    acceptedAnswers:
      - 2<x<3
      - 2 < x < 3
      - (2,3)
```

Hint:  
The curve is decreasing where \(\frac{dy}{dx}<0\).

Worked solution:  
\[
\frac{dy}{dx}=6x^2-30x+36=6(x-2)(x-3).
\]
At stationary points,
\[
6(x-2)(x-3)=0,
\]
so
\[
x=2 \quad \text{or} \quad x=3.
\]
For \(x=2\):
\[
y=2(8)-15(4)+36(2)-4=24.
\]
For \(x=3\):
\[
y=2(27)-15(9)+36(3)-4=23.
\]
The derivative \(6(x-2)(x-3)\) is negative between 2 and 3, so the curve is decreasing for
\[
2<x<3.
\]

Common mistake:  
Stating the curve is decreasing outside the stationary values instead of between them.

---
### PPQ003 — hm-calc-diff-stationary-ppq-003

Stage: Past Paper-style Questions  
Subskill: Showing a function is strictly increasing  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find / Explain

Question:  
Given that
\[
f(x)=x^3+12x^2+50x-11,
\]

(a) find \(f'(x)\).  
(b) Hence, explain why the curve with equation \(y=f(x)\) is strictly increasing for all values of \(x\).

Correct answer:  
\[
f'(x)=3x^2+24x+50
\]
and \(f'(x)>0\) for all real \(x\), so the curve is strictly increasing.

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2+24x+50
    acceptedAnswers:
      - 3x^2+24x+50
      - 3x^2 + 24x + 50
      - f'(x)=3x^2+24x+50
      - f'(x) = 3x^2 + 24x + 50

  - id: reason
    label: Reason
    type: text_short
    correctAnswer: f'(x)>0 for all x
    acceptedAnswers:
      - f'(x)>0 for all x
      - f'(x) > 0 for all x
      - derivative is positive for all x
      - positive for all x
      - always positive
      - no real roots and positive coefficient
```

Hint:  
Check whether \(3x^2+24x+50\) can ever be zero or negative.

Worked solution:  
\[
f'(x)=3x^2+24x+50.
\]
For the quadratic \(3x^2+24x+50\), the discriminant is
\[
24^2-4(3)(50)=576-600=-24.
\]
Since the discriminant is negative, the quadratic has no real roots. Since the coefficient of \(x^2\) is positive, \(f'(x)>0\) for all real \(x\).  
Therefore, the curve is strictly increasing for all values of \(x\).

Common mistake:  
Only saying “there are no stationary points”. That is not enough by itself; you must know the derivative is positive.

---
### PPQ004 — hm-calc-diff-stationary-ppq-004

Stage: Past Paper-style Questions  
Subskill: Closed interval greatest and least values  
Type: multi_step  
Marks: 7  
Calculator/non-calculator: Calculator  
Command word: Find / Determine

Question:  
A curve has equation
\[
y=9x-2x^{\frac32}.
\]

(a) Find the \(x\)-coordinate of the stationary point.  
(b) Hence determine the greatest and least values of \(y\) in the interval
\[
1\le x\le 16.
\]

Correct answer:  
Stationary point at \(x=9\).  
Greatest value: \(27\).  
Least value: \(7\).

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 9-3sqrtx
    acceptedAnswers:
      - 9-3sqrtx
      - 9 - 3sqrtx
      - 9-3sqrt(x)
      - 9 - 3sqrt(x)
      - 9-3x^(1/2)
      - 9 - 3x^(1/2)

  - id: stationary_x_coordinate
    label: Stationary x-coordinate
    type: exact
    correctAnswer: 9
    acceptedAnswers:
      - 9
      - x=9
      - x = 9

  - id: endpoint_values
    label: Endpoint values
    type: exact_list
    correctAnswer: 7,16
    acceptedAnswers:
      - 7,16
      - 7 and 16
      - y(1)=7 and y(16)=16
      - y at 1 is 7 and y at 16 is 16

  - id: stationary_value
    label: Stationary value
    type: exact
    correctAnswer: 27
    acceptedAnswers:
      - 27
      - y=27
      - y = 27

  - id: greatest_value
    label: Greatest value
    type: exact
    correctAnswer: 27
    acceptedAnswers:
      - 27
      - greatest=27
      - greatest value is 27

  - id: least_value
    label: Least value
    type: exact
    correctAnswer: 7
    acceptedAnswers:
      - 7
      - least=7
      - least value is 7
```

Hint:  
For a closed interval, check the value of \(y\) at the stationary point and at both endpoints.

Worked solution:  
\[
y=9x-2x^{\frac32}
\]
\[
\frac{dy}{dx}=9-2\cdot\frac32x^{\frac12}=9-3\sqrt{x}.
\]
At stationary points,
\[
9-3\sqrt{x}=0.
\]
So
\[
3\sqrt{x}=9
\]
\[
\sqrt{x}=3
\]
\[
x=9.
\]
Now evaluate \(y\) at \(x=1\), \(x=9\), and \(x=16\):
\[
y(1)=9-2=7,
\]
\[
y(9)=81-2(27)=27,
\]
\[
y(16)=144-2(64)=16.
\]
So the greatest value is \(27\), and the least value is \(7\).

Common mistake:  
Only checking the stationary point and forgetting to check the endpoints.

---
### PPQ005 — hm-calc-diff-stationary-ppq-005

Stage: Past Paper-style Questions  
Subskill: Quartic stationary points and nature  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find / Determine

Question:  
A curve has equation
\[
y=x^4-18x^2+5.
\]

(a) Find the \(x\)-coordinates of the stationary points.  
(b) Determine the nature of each stationary point using a gradient table.

Correct answer:  
\[
x=-3\text{ minimum}, \quad x=0\text{ maximum}, \quad x=3\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 4x(x-3)(x+3)
    acceptedAnswers:
      - 4x(x-3)(x+3)
      - 4*x*(x-3)*(x+3)
      - 4x^3-36x
      - 4x^3 - 36x

  - id: stationary_x_minus_3
    label: Stationary x-value -3
    type: exact
    correctAnswer: -3
    acceptedAnswers:
      - -3
      - x=-3
      - x = -3

  - id: nature_at_x_minus_3
    label: Nature at x=-3
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum

  - id: stationary_x_0
    label: Stationary x-value 0
    type: exact
    correctAnswer: 0
    acceptedAnswers:
      - 0
      - x=0
      - x = 0

  - id: nature_at_x_0
    label: Nature at x=0
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_x_3
    label: Stationary x-value 3
    type: exact
    correctAnswer: 3
    acceptedAnswers:
      - 3
      - x=3
      - x = 3

  - id: nature_at_x_3
    label: Nature at x=3
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Factorise the derivative fully before making the gradient table.

Worked solution:  
\[
\frac{dy}{dx}=4x^3-36x=4x(x^2-9)=4x(x-3)(x+3).
\]
At stationary points,
\[
4x(x-3)(x+3)=0.
\]
So
\[
x=-3,\quad x=0,\quad x=3.
\]
The sign of \(4x(x-3)(x+3)\) is negative, positive, negative, positive across the intervals.  
Therefore, \(x=-3\) is a minimum, \(x=0\) is a maximum, and \(x=3\) is a minimum.

Common mistake:  
Missing the stationary value \(x=0\) after factorising.

---
### PPQ006 — hm-calc-diff-stationary-ppq-006

Stage: Past Paper-style Questions  
Subskill: Horizontal point of inflexion  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find / State

Question:  
A curve has equation
\[
y=x^3-6x^2+12x+1.
\]

(a) Find the stationary point.  
(b) State its nature.

Correct answer:  
\[
(2,9)\text{ horizontal point of inflexion}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2-12x+12
    acceptedAnswers:
      - 3x^2-12x+12
      - 3x^2 - 12x + 12
      - 3(x-2)^2
      - 3*(x-2)^2

  - id: stationary_point
    label: Stationary point
    type: coordinate
    correctAnswer: (2,9)
    acceptedAnswers:
      - (2,9)
      - (2, 9)
      - 2,9

  - id: nature
    label: Nature of point
    type: text_short
    correctAnswer: horizontal point of inflexion
    acceptedAnswers:
      - horizontal point of inflexion
      - point of inflexion
      - stationary point of inflexion
      - stationary inflexion
```

Hint:  
Check whether the derivative changes sign at the stationary point.

Worked solution:  
\[
\frac{dy}{dx}=3x^2-12x+12=3(x-2)^2.
\]
At stationary points,
\[
3(x-2)^2=0,
\]
so
\[
x=2.
\]
Then
\[
y=2^3-6(2)^2+12(2)+1=9.
\]
The derivative \(3(x-2)^2\) is positive on both sides of \(x=2\), so the point is a horizontal point of inflexion.

Common mistake:  
Calling the point a minimum because the derivative is squared.

---
### PPQ007 — hm-calc-diff-stationary-ppq-007

Stage: Past Paper-style Questions  
Subskill: Closed interval greatest and least values with chain rule  
Type: multi_step  
Marks: 7  
Calculator/non-calculator: Non-calculator  
Command word: Find / Determine

Question:  
A function is defined by
\[
f(x)=(x^2-4x+5)^2,\qquad 0\le x\le 4.
\]

(a) Find the stationary point of \(f\).  
(b) Determine the greatest and least values of \(f(x)\) on the interval.

Correct answer:  
Stationary point \((2,1)\).  
Greatest value: \(25\).  
Least value: \(1\).

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 4(x-2)(x^2-4x+5)
    acceptedAnswers:
      - 4(x-2)(x^2-4x+5)
      - 4*(x-2)*(x^2-4x+5)
      - 2(x^2-4x+5)(2x-4)
      - 2*(x^2-4x+5)*(2x-4)

  - id: stationary_point
    label: Stationary point
    type: coordinate
    correctAnswer: (2,1)
    acceptedAnswers:
      - (2,1)
      - (2, 1)
      - 2,1

  - id: endpoint_values
    label: Endpoint values
    type: exact_list
    correctAnswer: 25,25
    acceptedAnswers:
      - 25,25
      - 25 and 25
      - f(0)=25 and f(4)=25
      - y(0)=25 and y(4)=25

  - id: greatest_value
    label: Greatest value
    type: exact
    correctAnswer: 25
    acceptedAnswers:
      - 25
      - greatest=25
      - greatest value is 25

  - id: least_value
    label: Least value
    type: exact
    correctAnswer: 1
    acceptedAnswers:
      - 1
      - least=1
      - least value is 1
```

Hint:  
For a closed interval, compare the value at the stationary point with the values at the endpoints.

Worked solution:  
\[
f'(x)=2(x^2-4x+5)(2x-4)=4(x-2)(x^2-4x+5).
\]
Since \(x^2-4x+5=(x-2)^2+1\), the bracket is always positive.  
So the stationary point occurs at
\[
x=2.
\]
Then
\[
f(2)=(4-8+5)^2=1.
\]
At the endpoints:
\[
f(0)=5^2=25,
\]
\[
f(4)=5^2=25.
\]
So the greatest value is \(25\), and the least value is \(1\).

Common mistake:  
Finding the stationary point but not checking both endpoints.

---
### PPQ008 — hm-calc-diff-stationary-ppq-008

Stage: Past Paper-style Questions  
Subskill: Stationary points and intercept feature  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find / State

Question:  
A curve has equation
\[
y=x^3-6x^2+8.
\]

(a) Find the coordinates and nature of the stationary points.  
(b) State the \(y\)-intercept of the curve.

Correct answer:  
\[
(0,8)\text{ maximum}, \quad (4,-24)\text{ minimum}
\]
\(y\)-intercept: \((0,8)\).

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x(x-4)
    acceptedAnswers:
      - 3x(x-4)
      - 3*x*(x-4)
      - 3x^2-12x
      - 3x^2 - 12x

  - id: stationary_point_at_x_0
    label: Stationary point at x=0
    type: coordinate
    correctAnswer: (0,8)
    acceptedAnswers:
      - (0,8)
      - (0, 8)
      - 0,8

  - id: nature_at_x_0
    label: Nature at x=0
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_point_at_x_4
    label: Stationary point at x=4
    type: coordinate
    correctAnswer: (4,-24)
    acceptedAnswers:
      - (4,-24)
      - (4, -24)
      - 4,-24

  - id: nature_at_x_4
    label: Nature at x=4
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum

  - id: y_intercept
    label: y-intercept
    type: coordinate
    correctAnswer: (0,8)
    acceptedAnswers:
      - (0,8)
      - (0, 8)
      - y-intercept is (0,8)
      - 8
```

Hint:  
The \(y\)-intercept occurs when \(x=0\).

Worked solution:  
\[
\frac{dy}{dx}=3x^2-12x=3x(x-4).
\]
At stationary points,
\[
3x(x-4)=0.
\]
So
\[
x=0 \quad \text{or} \quad x=4.
\]
\[
y(0)=8,
\]
\[
y(4)=64-96+8=-24.
\]
The derivative is positive for \(x<0\), negative for \(0<x<4\), and positive for \(x>4\).  
So \((0,8)\) is a maximum and \((4,-24)\) is a minimum.  
The \(y\)-intercept is found by setting \(x=0\), so it is \((0,8)\).

Common mistake:  
Treating the \(y\)-intercept as a separate calculation and missing that it is also a stationary point here.

---
### PPQ009 — hm-calc-diff-stationary-ppq-009

Stage: Past Paper-style Questions  
Subskill: Stationary points and strictly increasing intervals  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find / State

Question:  
A curve has equation
\[
y=x^3-9x^2+24x-3.
\]

(a) Find the coordinates of the stationary points.  
(b) State where the curve is strictly increasing.

Correct answer:  
\[
(2,17), \quad (4,13)
\]
Strictly increasing for \(x<2\) and \(x>4\).

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2-18x+24
    acceptedAnswers:
      - 3x^2-18x+24
      - 3x^2 - 18x + 24
      - 3(x-2)(x-4)
      - 3*(x-2)*(x-4)

  - id: stationary_point_at_x_2
    label: Stationary point at x=2
    type: coordinate
    correctAnswer: (2,17)
    acceptedAnswers:
      - (2,17)
      - (2, 17)
      - 2,17

  - id: stationary_point_at_x_4
    label: Stationary point at x=4
    type: coordinate
    correctAnswer: (4,13)
    acceptedAnswers:
      - (4,13)
      - (4, 13)
      - 4,13

  - id: increasing_interval_1
    label: First increasing interval
    type: interval
    correctAnswer: x<2
    acceptedAnswers:
      - x<2
      - x < 2
      - (-infinity,2)
      - (-∞,2)

  - id: increasing_interval_2
    label: Second increasing interval
    type: interval
    correctAnswer: x>4
    acceptedAnswers:
      - x>4
      - x > 4
      - (4,infinity)
      - (4,∞)
```

Hint:  
The curve is strictly increasing where \(\frac{dy}{dx}>0\).

Worked solution:  
\[
\frac{dy}{dx}=3x^2-18x+24=3(x-2)(x-4).
\]
At stationary points,
\[
3(x-2)(x-4)=0.
\]
So
\[
x=2 \quad \text{or} \quad x=4.
\]
\[
y(2)=8-36+48-3=17,
\]
\[
y(4)=64-144+96-3=13.
\]
The derivative is positive for \(x<2\), negative for \(2<x<4\), and positive for \(x>4\).  
So the curve is strictly increasing for \(x<2\) and \(x>4\).

Common mistake:  
Saying the curve is increasing between the stationary points without checking the derivative sign.

---
### PPQ010 — hm-calc-diff-stationary-ppq-010

Stage: Past Paper-style Questions  
Subskill: Closed interval greatest and least values with cubic  
Type: multi_step  
Marks: 7  
Calculator/non-calculator: Non-calculator  
Command word: Find / Determine

Question:  
A curve has equation
\[
y=x^3-12x+4.
\]

(a) Find the coordinates of the stationary points.  
(b) Hence determine the greatest and least values of \(y\) in the interval
\[
-3\le x\le 3.
\]

Correct answer:  
Stationary points: \((-2,20)\) and \((2,-12)\).  
Greatest value: \(20\).  
Least value: \(-12\).

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2-12
    acceptedAnswers:
      - 3x^2-12
      - 3x^2 - 12
      - 3(x-2)(x+2)
      - 3*(x-2)*(x+2)

  - id: stationary_point_at_x_minus_2
    label: Stationary point at x=-2
    type: coordinate
    correctAnswer: (-2,20)
    acceptedAnswers:
      - (-2,20)
      - (-2, 20)
      - -2,20

  - id: stationary_point_at_x_2
    label: Stationary point at x=2
    type: coordinate
    correctAnswer: (2,-12)
    acceptedAnswers:
      - (2,-12)
      - (2, -12)
      - 2,-12

  - id: endpoint_value_at_x_minus_3
    label: Endpoint value at x=-3
    type: exact
    correctAnswer: 13
    acceptedAnswers:
      - 13
      - y(-3)=13
      - y at -3 is 13

  - id: endpoint_value_at_x_3
    label: Endpoint value at x=3
    type: exact
    correctAnswer: -5
    acceptedAnswers:
      - -5
      - y(3)=-5
      - y at 3 is -5

  - id: greatest_value
    label: Greatest value
    type: exact
    correctAnswer: 20
    acceptedAnswers:
      - 20
      - greatest=20
      - greatest value is 20

  - id: least_value
    label: Least value
    type: exact
    correctAnswer: -12
    acceptedAnswers:
      - -12
      - least=-12
      - least value is -12
```

Hint:  
Find the stationary values, then compare them with the endpoint values.

Worked solution:  
\[
\frac{dy}{dx}=3x^2-12=3(x-2)(x+2).
\]
At stationary points,
\[
3(x-2)(x+2)=0.
\]
So
\[
x=-2 \quad \text{or} \quad x=2.
\]
\[
y(-2)=-8+24+4=20,
\]
\[
y(2)=8-24+4=-12.
\]
Now check the endpoints:
\[
y(-3)=-27+36+4=13,
\]
\[
y(3)=27-36+4=-5.
\]
Comparing \(20\), \(-12\), \(13\), and \(-5\), the greatest value is \(20\), and the least value is \(-12\).

Common mistake:  
Assuming the maximum and minimum on a closed interval must occur at the stationary points without checking endpoints.

---
### PPQ011 — hm-calc-diff-stationary-ppq-011

Stage: Past Paper-style Questions  
Subskill: Explaining no stationary points  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find / Explain

Question:  
Given that
\[
f(x)=2x^3+6x^2+9x-4,
\]

(a) find \(f'(x)\).  
(b) Explain why the curve \(y=f(x)\) has no stationary points.

Correct answer:  
\[
f'(x)=6x^2+12x+9
\]
and \(f'(x)\) has no real roots, so it is never zero.

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 6x^2+12x+9
    acceptedAnswers:
      - 6x^2+12x+9
      - 6x^2 + 12x + 9
      - f'(x)=6x^2+12x+9
      - f'(x) = 6x^2 + 12x + 9

  - id: reason
    label: Reason
    type: text_short
    correctAnswer: f'(x) has no real roots
    acceptedAnswers:
      - f'(x) has no real roots
      - derivative has no real roots
      - f'(x) is never zero
      - derivative is never zero
      - no values make f'(x)=0
      - discriminant is negative
```

Hint:  
Stationary points occur where \(f'(x)=0\). Check whether this derivative can equal zero.

Worked solution:  
\[
f'(x)=6x^2+12x+9.
\]
For \(6x^2+12x+9\), the discriminant is
\[
12^2-4(6)(9)=144-216=-72.
\]
Since the discriminant is negative, \(f'(x)=0\) has no real solutions.  
Therefore, there are no stationary points.

Common mistake:  
Trying to factorise the derivative when it does not factorise over the real numbers.

---
### PPQ012 — hm-calc-diff-stationary-ppq-012

Stage: Past Paper-style Questions  
Subskill: Composite function stationary point and nature  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find / Determine

Question:  
A curve has equation
\[
y=(x^2-6x+10)^3.
\]

(a) Find the stationary point of the curve.  
(b) Determine its nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\[
(3,1)\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 6(x-3)(x^2-6x+10)^2
    acceptedAnswers:
      - 6(x-3)(x^2-6x+10)^2
      - 6*(x-3)*(x^2-6x+10)^2
      - 3(x^2-6x+10)^2(2x-6)
      - 3*(x^2-6x+10)^2*(2x-6)

  - id: stationary_point
    label: Stationary point
    type: coordinate
    correctAnswer: (3,1)
    acceptedAnswers:
      - (3,1)
      - (3, 1)
      - 3,1

  - id: nature
    label: Nature of point
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Use the chain rule. Then note that \((x^2-6x+10)^2\) is always positive.

Worked solution:  
\[
\frac{dy}{dx}=3(x^2-6x+10)^2(2x-6).
\]
This can be written as
\[
\frac{dy}{dx}=6(x-3)(x^2-6x+10)^2.
\]
Since
\[
x^2-6x+10=(x-3)^2+1,
\]
the squared bracket is always positive.  
So the stationary point occurs when
\[
x-3=0,
\]
so
\[
x=3.
\]
Then
\[
y=(9-18+10)^3=1.
\]
For \(x<3\), \(\frac{dy}{dx}<0\). For \(x>3\), \(\frac{dy}{dx}>0\).  
So \((3,1)\) is a minimum.

Common mistake:  
Trying to solve \(x^2-6x+10=0\), even though it has no real roots.

---
### PPQ013 — hm-calc-diff-stationary-ppq-013

Stage: Past Paper-style Questions  
Subskill: Cubic stationary points and nature with negative leading coefficient  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find / Determine

Question:  
A curve has equation
\[
y=-2x^3+15x^2-36x+4.
\]

(a) Find the coordinates of the stationary points.  
(b) Determine their nature using a gradient table.

Correct answer:  
\[
(2,-24)\text{ minimum}, \quad (3,-23)\text{ maximum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: -6(x-2)(x-3)
    acceptedAnswers:
      - -6(x-2)(x-3)
      - -6*(x-2)*(x-3)
      - -6x^2+30x-36
      - -6x^2 + 30x - 36

  - id: stationary_point_at_x_2
    label: Stationary point at x=2
    type: coordinate
    correctAnswer: (2,-24)
    acceptedAnswers:
      - (2,-24)
      - (2, -24)
      - 2,-24

  - id: nature_at_x_2
    label: Nature at x=2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum

  - id: stationary_point_at_x_3
    label: Stationary point at x=3
    type: coordinate
    correctAnswer: (3,-23)
    acceptedAnswers:
      - (3,-23)
      - (3, -23)
      - 3,-23

  - id: nature_at_x_3
    label: Nature at x=3
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum
```

Hint:  
Be careful with the negative leading coefficient when checking the sign of the derivative.

Worked solution:  
\[
\frac{dy}{dx}=-6x^2+30x-36=-6(x^2-5x+6)=-6(x-2)(x-3).
\]
At stationary points,
\[
-6(x-2)(x-3)=0.
\]
So
\[
x=2 \quad \text{or} \quad x=3.
\]
For \(x=2\):
\[
y=-2(8)+15(4)-36(2)+4=-24.
\]
For \(x=3\):
\[
y=-2(27)+15(9)-36(3)+4=-23.
\]
The derivative is negative for \(x<2\), positive for \(2<x<3\), and negative for \(x>3\).  
So \((2,-24)\) is a minimum and \((3,-23)\) is a maximum.

Common mistake:  
Ignoring the negative factor \(-6\) when making the gradient table.

---

## Foundations — all questions together for skim

**F001**  
At a stationary point on a curve \(y=f(x)\), which statement is true?

A. \(f(x)=0\)  
B. \(f'(x)=0\)  
C. \(f''(x)=0\)  
D. \(x=0\)

**F002**  
A curve has equation \(y=x^2-6x+8\). Find the \(x\)-coordinate of its stationary point.

**F003**  
A curve has equation \(y=x^2-4x+1\). Find the coordinates of its stationary point.

**F004**  
A curve has equation \(y=x^2-8x+5\). The stationary point occurs at \(x=4\). Use the derivative sign table to state its nature.

**F005**  
A curve has equation \(y=-x^2+6x+2\). The stationary point occurs at \(x=3\). Use the derivative sign table to state its nature.

**F006**  
A stationary point occurs at \(x=2\). A sign table shows \(f'(x): +,0,-\). State the nature of the stationary point.

**F007**  
A stationary point occurs at \(x=0\). A sign table shows \(f'(x): +,0,+\). State the nature of the stationary point.

**F008**  
For \(f'(x)=(x-1)(x-5)\), state the intervals where \(f(x)\) is increasing and decreasing.

---

## Applications — all questions together for skim

**A001**  
A curve has equation \(y=x^3-6x^2+9x+2\). Find the coordinates of the stationary points and determine their nature using a gradient table.

**A002**  
A curve has equation \(y=2x^3-9x^2+12x+1\). Find the coordinates and nature of the stationary points using the sign of \(f'(x)\).

**A003**  
A function \(f\) has stationary points at \(x=-2\) and \(x=4\). A sign table is given. State the nature of each stationary point.

**A004**  
A curve has equation \(y=x^3-12x+5\). Find the coordinates of the stationary points and determine their nature using a gradient table.

**A005**  
A curve has equation \(y=x^3-3x^2+3x+2\). Find the stationary point of the curve and state its nature.

**A006**  
For \(f'(x)=3(x+1)(x-3)\), state the intervals where \(f(x)\) is increasing and decreasing.

**A007**  
A curve has equation \(y=(x^2-4x+5)^2\). Find the coordinates of its stationary point and determine its nature using the sign of \(\frac{dy}{dx}\).

**A008**  
A curve has equation \(y=x^4-8x^2+3\). Find the \(x\)-coordinates of the stationary points and determine their nature using a gradient table.

**A009**  
For a function \(f\), \(f'(x)=2(x+1)(x-5)\).  
(a) Find the stationary \(x\)-values.  
(b) Use the sign of \(f'(x)\) to determine the nature of each stationary point.

**A010**  
For a function \(f\), \(f'(x)=(x+2)^2(x-3)\).  
(a) Find the stationary \(x\)-values.  
(b) Use the sign of \(f'(x)\) to determine the nature at each stationary value.

---

## Past Paper-style Questions — all questions together for skim

**PPQ001**  
A curve has equation \(y=x^3-3x^2-9x+5\).  
(a) Find the coordinates of the stationary points.  
(b) Determine their nature using a gradient table.

**PPQ002**  
A curve has equation \(y=2x^3-15x^2+36x-4\).  
(a) Find \(\frac{dy}{dx}\).  
(b) Find the coordinates of the stationary points.  
(c) State the interval on which the curve is decreasing.

**PPQ003**  
Given that \(f(x)=x^3+12x^2+50x-11\),  
(a) find \(f'(x)\).  
(b) Hence, explain why the curve with equation \(y=f(x)\) is strictly increasing for all values of \(x\).

**PPQ004**  
A curve has equation \(y=9x-2x^{\frac32}\).  
(a) Find the \(x\)-coordinate of the stationary point.  
(b) Hence determine the greatest and least values of \(y\) in the interval \(1\le x\le 16\).

**PPQ005**  
A curve has equation \(y=x^4-18x^2+5\).  
(a) Find the \(x\)-coordinates of the stationary points.  
(b) Determine the nature of each stationary point using a gradient table.

**PPQ006**  
A curve has equation \(y=x^3-6x^2+12x+1\).  
(a) Find the stationary point.  
(b) State its nature.

**PPQ007**  
A function is defined by \(f(x)=(x^2-4x+5)^2,\ 0\le x\le 4\).  
(a) Find the stationary point of \(f\).  
(b) Determine the greatest and least values of \(f(x)\) on the interval.

**PPQ008**  
A curve has equation \(y=x^3-6x^2+8\).  
(a) Find the coordinates and nature of the stationary points.  
(b) State the \(y\)-intercept of the curve.

**PPQ009**  
A curve has equation \(y=x^3-9x^2+24x-3\).  
(a) Find the coordinates of the stationary points.  
(b) State where the curve is strictly increasing.

**PPQ010**  
A curve has equation \(y=x^3-12x+4\).  
(a) Find the coordinates of the stationary points.  
(b) Hence determine the greatest and least values of \(y\) in the interval \(-3\le x\le 3\).

**PPQ011**  
Given that \(f(x)=2x^3+6x^2+9x-4\),  
(a) find \(f'(x)\).  
(b) Explain why the curve \(y=f(x)\) has no stationary points.

**PPQ012**  
A curve has equation \(y=(x^2-6x+10)^3\).  
(a) Find the stationary point of the curve.  
(b) Determine its nature using the sign of \(\frac{dy}{dx}\).

**PPQ013**  
A curve has equation \(y=-2x^3+15x^2-36x+4\).  
(a) Find the coordinates of the stationary points.  
(b) Determine their nature using a gradient table.

---

## Import readiness checklist

- [x] Structured multi-field UI needed for coordinates, stationary x-values, natures, intervals, endpoint values, greatest/least values, and derivative expressions.
- [x] No second derivative method used.
- [x] All nature questions use gradient/sign-table logic.
- [x] All questions are original STEM Forge QS-style content.
- [x] No official wording, numbers, diagrams, scenarios, or marking instructions copied.
- [x] Closed interval questions limited to 3 PPQs.
- [x] All multi-step questions include structured `answerFields`.
- [x] Accepted answers reviewed for safe variants.
- [x] Arithmetic and stationary values independently checked.
- [ ] Field types need mapping before app import.
- [ ] Content-bank draft only; not active app data.

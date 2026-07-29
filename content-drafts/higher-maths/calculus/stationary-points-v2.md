# STEM Forge — Higher Maths Stationary Points Question Bank v2

Status: **QA-reviewed auto-mark content-bank draft with structured answer fields**  
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
- Past Paper-style Questions: 25
- Total: 43

Content boundary:
- Include: finding stationary points, solving \(f'(x)=0\), finding coordinates, determining nature using a gradient table/sign of \(f'(x)\), horizontal points of inflexion, increasing/decreasing intervals, and exactly three closed interval greatest/least value questions.
- Avoid: second derivative method, completing the square, derived graphs, graph sketching, full optimisation contexts, normal lines, vague written interpretation, integration/reverse differentiation, hard modelling, trig stationary-point solving, and questions that require manual sketch marking.

Stationary point method note:
At stationary points, \(f'(x)=0\). Nature should be determined using a gradient table or the sign of \(f'(x)\), not using the second derivative.

Stationary Points import/UI note:
This bank will require structured multi-field auto-mark UI. In particular, the app should support separate answer fields for coordinates, stationary x-values, natures of points, intervals, endpoint values, greatest/least values, and derivative expressions. Do not build graph sketching, derived-graph, completing-the-square, or second-derivative workflows for this skill path.

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
Subskill: Finding and classifying stationary points of a cubic  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^3-6x^2+9x+2.
\]

Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\((1,6)\) maximum, \((3,2)\) minimum

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
      - dy/dx=3x^2-12x+9

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: 1, 3
    acceptedAnswers:
      - 1, 3
      - 1 and 3
      - x=1, x=3

  - id: stationary_point_1
    label: Stationary point 1
    type: coordinate
    correctAnswer: (1,6)
    acceptedAnswers:
      - (1,6)
      - (1, 6)
      - 1,6

  - id: nature_1
    label: Nature of stationary point 1
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_point_2
    label: Stationary point 2
    type: coordinate
    correctAnswer: (3,2)
    acceptedAnswers:
      - (3,2)
      - (3, 2)
      - 3,2

  - id: nature_2
    label: Nature of stationary point 2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Differentiate, set \(\frac{dy}{dx}=0\), then use the sign of the derivative on either side of each stationary value.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=3x^2-12x+9.
\]

Factorise:
\[
\frac{dy}{dx}=3(x-1)(x-3).
\]

Set \(\frac{dy}{dx}=0\), giving
\[
x=1,\quad x= 3.
\]

Substitute these values into the original equation to get the stationary points:
\[
(1,6),\quad (3,2).
\]

Using the sign of \(\frac{dy}{dx}\) around the stationary values gives:
\[
(1,6) maximum, (3,2) minimum.
\]

Common mistake:  
Finding the stationary \(x\)-values but forgetting to find the coordinates and state the nature.

---

### PPQ002 — hm-calc-diff-stationary-ppq-002

Stage: Past Paper-style Questions  
Subskill: Finding and classifying stationary points of a cubic  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=-x^3+3x^2+9x-4.
\]

Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\((-1,-9)\) minimum, \((3,23)\) maximum

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: -3x^2+6x+9
    acceptedAnswers:
      - -3x^2+6x+9
      -  - 3x^2 + 6x + 9
      - -3(x-3)(x+1)
      - dy/dx=-3x^2+6x+9

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: -1, 3
    acceptedAnswers:
      - -1, 3
      - -1 and 3
      - x=-1, x=3

  - id: stationary_point_1
    label: Stationary point 1
    type: coordinate
    correctAnswer: (-1,-9)
    acceptedAnswers:
      - (-1,-9)
      - (-1, -9)
      - -1,-9

  - id: nature_1
    label: Nature of stationary point 1
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum

  - id: stationary_point_2
    label: Stationary point 2
    type: coordinate
    correctAnswer: (3,23)
    acceptedAnswers:
      - (3,23)
      - (3, 23)
      - 3,23

  - id: nature_2
    label: Nature of stationary point 2
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum
```

Hint:  
Differentiate, set \(\frac{dy}{dx}=0\), then use the sign of the derivative on either side of each stationary value.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=-3x^2+6x+9.
\]

Factorise:
\[
\frac{dy}{dx}=-3(x-3)(x+1).
\]

Set \(\frac{dy}{dx}=0\), giving
\[
x=-1,\quad x= 3.
\]

Substitute these values into the original equation to get the stationary points:
\[
(-1,-9),\quad (3,23).
\]

Using the sign of \(\frac{dy}{dx}\) around the stationary values gives:
\[
(-1,-9) minimum, (3,23) maximum.
\]

Common mistake:  
Finding the stationary \(x\)-values but forgetting to find the coordinates and state the nature.

---

### PPQ003 — hm-calc-diff-stationary-ppq-003

Stage: Past Paper-style Questions  
Subskill: Finding and classifying stationary points of a cubic  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=2x^3-15x^2+36x-5.
\]

Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\((2,23)\) maximum, \((3,22)\) minimum

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
      - dy/dx=6x^2-30x+36

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: 2, 3
    acceptedAnswers:
      - 2, 3
      - 2 and 3
      - x=2, x=3

  - id: stationary_point_1
    label: Stationary point 1
    type: coordinate
    correctAnswer: (2,23)
    acceptedAnswers:
      - (2,23)
      - (2, 23)
      - 2,23

  - id: nature_1
    label: Nature of stationary point 1
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_point_2
    label: Stationary point 2
    type: coordinate
    correctAnswer: (3,22)
    acceptedAnswers:
      - (3,22)
      - (3, 22)
      - 3,22

  - id: nature_2
    label: Nature of stationary point 2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Differentiate, set \(\frac{dy}{dx}=0\), then use the sign of the derivative on either side of each stationary value.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=6x^2-30x+36.
\]

Factorise:
\[
\frac{dy}{dx}=6(x-2)(x-3).
\]

Set \(\frac{dy}{dx}=0\), giving
\[
x=2,\quad x= 3.
\]

Substitute these values into the original equation to get the stationary points:
\[
(2,23),\quad (3,22).
\]

Using the sign of \(\frac{dy}{dx}\) around the stationary values gives:
\[
(2,23) maximum, (3,22) minimum.
\]

Common mistake:  
Finding the stationary \(x\)-values but forgetting to find the coordinates and state the nature.

---

### PPQ004 — hm-calc-diff-stationary-ppq-004

Stage: Past Paper-style Questions  
Subskill: Finding and classifying stationary points of a cubic  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^3-3x^2-9x+5.
\]

Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\((-1,10)\) maximum, \((3,-22)\) minimum

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
      - 3(x-3)(x+1)
      - dy/dx=3x^2-6x-9

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: -1, 3
    acceptedAnswers:
      - -1, 3
      - -1 and 3
      - x=-1, x=3

  - id: stationary_point_1
    label: Stationary point 1
    type: coordinate
    correctAnswer: (-1,10)
    acceptedAnswers:
      - (-1,10)
      - (-1, 10)
      - -1,10

  - id: nature_1
    label: Nature of stationary point 1
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_point_2
    label: Stationary point 2
    type: coordinate
    correctAnswer: (3,-22)
    acceptedAnswers:
      - (3,-22)
      - (3, -22)
      - 3,-22

  - id: nature_2
    label: Nature of stationary point 2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Differentiate, set \(\frac{dy}{dx}=0\), then use the sign of the derivative on either side of each stationary value.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=3x^2-6x-9.
\]

Factorise:
\[
\frac{dy}{dx}=3(x-3)(x+1).
\]

Set \(\frac{dy}{dx}=0\), giving
\[
x=-1,\quad x= 3.
\]

Substitute these values into the original equation to get the stationary points:
\[
(-1,10),\quad (3,-22).
\]

Using the sign of \(\frac{dy}{dx}\) around the stationary values gives:
\[
(-1,10) maximum, (3,-22) minimum.
\]

Common mistake:  
Finding the stationary \(x\)-values but forgetting to find the coordinates and state the nature.

---

### PPQ005 — hm-calc-diff-stationary-ppq-005

Stage: Past Paper-style Questions  
Subskill: Finding and classifying stationary points of a cubic  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=-2x^3+3x^2+12x+1.
\]

Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\((-1,-6)\) minimum, \((2,21)\) maximum

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: -6x^2+6x+12
    acceptedAnswers:
      - -6x^2+6x+12
      -  - 6x^2 + 6x + 12
      - -6(x-2)(x+1)
      - dy/dx=-6x^2+6x+12

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: -1, 2
    acceptedAnswers:
      - -1, 2
      - -1 and 2
      - x=-1, x=2

  - id: stationary_point_1
    label: Stationary point 1
    type: coordinate
    correctAnswer: (-1,-6)
    acceptedAnswers:
      - (-1,-6)
      - (-1, -6)
      - -1,-6

  - id: nature_1
    label: Nature of stationary point 1
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum

  - id: stationary_point_2
    label: Stationary point 2
    type: coordinate
    correctAnswer: (2,21)
    acceptedAnswers:
      - (2,21)
      - (2, 21)
      - 2,21

  - id: nature_2
    label: Nature of stationary point 2
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum
```

Hint:  
Differentiate, set \(\frac{dy}{dx}=0\), then use the sign of the derivative on either side of each stationary value.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=-6x^2+6x+12.
\]

Factorise:
\[
\frac{dy}{dx}=-6(x-2)(x+1).
\]

Set \(\frac{dy}{dx}=0\), giving
\[
x=-1,\quad x= 2.
\]

Substitute these values into the original equation to get the stationary points:
\[
(-1,-6),\quad (2,21).
\]

Using the sign of \(\frac{dy}{dx}\) around the stationary values gives:
\[
(-1,-6) minimum, (2,21) maximum.
\]

Common mistake:  
Finding the stationary \(x\)-values but forgetting to find the coordinates and state the nature.

---

### PPQ006 — hm-calc-diff-stationary-ppq-006

Stage: Past Paper-style Questions  
Subskill: Finding and classifying stationary points of a cubic  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^3-12x+7.
\]

Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\((-2,23)\) maximum, \((2,-9)\) minimum

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
      - dy/dx=3x^2-12

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: -2, 2
    acceptedAnswers:
      - -2, 2
      - -2 and 2
      - x=-2, x=2

  - id: stationary_point_1
    label: Stationary point 1
    type: coordinate
    correctAnswer: (-2,23)
    acceptedAnswers:
      - (-2,23)
      - (-2, 23)
      - -2,23

  - id: nature_1
    label: Nature of stationary point 1
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_point_2
    label: Stationary point 2
    type: coordinate
    correctAnswer: (2,-9)
    acceptedAnswers:
      - (2,-9)
      - (2, -9)
      - 2,-9

  - id: nature_2
    label: Nature of stationary point 2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Differentiate, set \(\frac{dy}{dx}=0\), then use the sign of the derivative on either side of each stationary value.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=3x^2-12.
\]

Factorise:
\[
\frac{dy}{dx}=3(x-2)(x+2).
\]

Set \(\frac{dy}{dx}=0\), giving
\[
x=-2,\quad x= 2.
\]

Substitute these values into the original equation to get the stationary points:
\[
(-2,23),\quad (2,-9).
\]

Using the sign of \(\frac{dy}{dx}\) around the stationary values gives:
\[
(-2,23) maximum, (2,-9) minimum.
\]

Common mistake:  
Finding the stationary \(x\)-values but forgetting to find the coordinates and state the nature.

---

### PPQ007 — hm-calc-diff-stationary-ppq-007

Stage: Past Paper-style Questions  
Subskill: Finding and classifying stationary points of a cubic  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=4x^3-12x^2-36x+6.
\]

Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\((-1,26)\) maximum, \((3,-102)\) minimum

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 12x^2-24x-36
    acceptedAnswers:
      - 12x^2-24x-36
      - 12x^2 - 24x - 36
      - 12(x-3)(x+1)
      - dy/dx=12x^2-24x-36

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: -1, 3
    acceptedAnswers:
      - -1, 3
      - -1 and 3
      - x=-1, x=3

  - id: stationary_point_1
    label: Stationary point 1
    type: coordinate
    correctAnswer: (-1,26)
    acceptedAnswers:
      - (-1,26)
      - (-1, 26)
      - -1,26

  - id: nature_1
    label: Nature of stationary point 1
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum

  - id: stationary_point_2
    label: Stationary point 2
    type: coordinate
    correctAnswer: (3,-102)
    acceptedAnswers:
      - (3,-102)
      - (3, -102)
      - 3,-102

  - id: nature_2
    label: Nature of stationary point 2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Differentiate, set \(\frac{dy}{dx}=0\), then use the sign of the derivative on either side of each stationary value.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=12x^2-24x-36.
\]

Factorise:
\[
\frac{dy}{dx}=12(x-3)(x+1).
\]

Set \(\frac{dy}{dx}=0\), giving
\[
x=-1,\quad x= 3.
\]

Substitute these values into the original equation to get the stationary points:
\[
(-1,26),\quad (3,-102).
\]

Using the sign of \(\frac{dy}{dx}\) around the stationary values gives:
\[
(-1,26) maximum, (3,-102) minimum.
\]

Common mistake:  
Finding the stationary \(x\)-values but forgetting to find the coordinates and state the nature.

---

### PPQ008 — hm-calc-diff-stationary-ppq-008

Stage: Past Paper-style Questions  
Subskill: Finding and classifying stationary points of a cubic  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=-x^3+6x^2-9x+4.
\]

Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\((1,0)\) minimum, \((3,4)\) maximum

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: -3x^2+12x-9
    acceptedAnswers:
      - -3x^2+12x-9
      -  - 3x^2 + 12x - 9
      - -3(x-1)(x-3)
      - dy/dx=-3x^2+12x-9

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: 1, 3
    acceptedAnswers:
      - 1, 3
      - 1 and 3
      - x=1, x=3

  - id: stationary_point_1
    label: Stationary point 1
    type: coordinate
    correctAnswer: (1,0)
    acceptedAnswers:
      - (1,0)
      - (1, 0)
      - 1,0

  - id: nature_1
    label: Nature of stationary point 1
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum

  - id: stationary_point_2
    label: Stationary point 2
    type: coordinate
    correctAnswer: (3,4)
    acceptedAnswers:
      - (3,4)
      - (3, 4)
      - 3,4

  - id: nature_2
    label: Nature of stationary point 2
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum
```

Hint:  
Differentiate, set \(\frac{dy}{dx}=0\), then use the sign of the derivative on either side of each stationary value.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=-3x^2+12x-9.
\]

Factorise:
\[
\frac{dy}{dx}=-3(x-1)(x-3).
\]

Set \(\frac{dy}{dx}=0\), giving
\[
x=1,\quad x= 3.
\]

Substitute these values into the original equation to get the stationary points:
\[
(1,0),\quad (3,4).
\]

Using the sign of \(\frac{dy}{dx}\) around the stationary values gives:
\[
(1,0) minimum, (3,4) maximum.
\]

Common mistake:  
Finding the stationary \(x\)-values but forgetting to find the coordinates and state the nature.

---

### PPQ009 — hm-calc-diff-stationary-ppq-009

Stage: Past Paper-style Questions  
Subskill: Finding increasing and decreasing intervals  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
A curve has equation
\[
y=x^3-3x^2-24x+1.
\]

State the intervals where the curve is increasing and decreasing.

Correct answer:  
Increasing for \(x<-2 and x>4\).  
Decreasing for \(-2<x<4\).

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2-6x-24
    acceptedAnswers:
      - 3x^2-6x-24
      - 3(x-4)(x+2)
      - dy/dx=3x^2-6x-24

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: -2,4
    acceptedAnswers:
      - -2,4
      - -2 and 4

  - id: increasing_intervals
    label: Increasing interval(s)
    type: interval
    correctAnswer: x<-2 and x>4
    acceptedAnswers:
      - x<-2 and x>4
      - x < -2 and x > 4

  - id: decreasing_interval
    label: Decreasing interval(s)
    type: interval
    correctAnswer: -2<x<4
    acceptedAnswers:
      - -2<x<4
      - -2 < x < 4
```

Hint:  
The curve is increasing where \(\frac{dy}{dx}>0\) and decreasing where \(\frac{dy}{dx}<0\).

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=3x^2-6x-24.
\]

Factorise:
\[
\frac{dy}{dx}=3(x-4)(x+2).
\]

The boundary values come from \(\frac{dy}{dx}=0\), so
\[
x=-2,\quad x=4.
\]

Testing the sign of the derivative in each interval gives:
\[
\text{increasing for } x<-2 and x>4,
\]
\[
\text{decreasing for } -2<x<4.
\]

Common mistake:  
Giving only the stationary values instead of the intervals where the derivative is positive or negative.

---

### PPQ010 — hm-calc-diff-stationary-ppq-010

Stage: Past Paper-style Questions  
Subskill: Finding increasing and decreasing intervals  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
A curve has equation
\[
y=-x^3+6x^2+15x-2.
\]

State the intervals where the curve is increasing and decreasing.

Correct answer:  
Increasing for \(-1<x<5\).  
Decreasing for \(x<-1 and x>5\).

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: -3x^2+12x+15
    acceptedAnswers:
      - -3x^2+12x+15
      - -3(x-5)(x+1)
      - dy/dx=-3x^2+12x+15

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: -1,5
    acceptedAnswers:
      - -1,5
      - -1 and 5

  - id: increasing_interval
    label: Increasing interval(s)
    type: interval
    correctAnswer: -1<x<5
    acceptedAnswers:
      - -1<x<5
      - -1 < x < 5

  - id: decreasing_intervals
    label: Decreasing interval(s)
    type: interval
    correctAnswer: x<-1 and x>5
    acceptedAnswers:
      - x<-1 and x>5
      - x < -1 and x > 5
```

Hint:  
The curve is increasing where \(\frac{dy}{dx}>0\) and decreasing where \(\frac{dy}{dx}<0\).

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=-3x^2+12x+15.
\]

Factorise:
\[
\frac{dy}{dx}=-3(x-5)(x+1).
\]

The boundary values come from \(\frac{dy}{dx}=0\), so
\[
x=-1,\quad x=5.
\]

Testing the sign of the derivative in each interval gives:
\[
\text{increasing for } -1<x<5,
\]
\[
\text{decreasing for } x<-1 and x>5.
\]

Common mistake:  
Giving only the stationary values instead of the intervals where the derivative is positive or negative.

---

### PPQ011 — hm-calc-diff-stationary-ppq-011

Stage: Past Paper-style Questions  
Subskill: Finding increasing and decreasing intervals from a given derivative  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
For a function \(f\),
\[
f'(x)=3(x-1)(x-5).
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

  - id: increasing_intervals
    label: Increasing intervals
    type: interval
    correctAnswer: x<1 and x>5
    acceptedAnswers:
      - x<1 and x>5
      - x < 1 and x > 5

  - id: decreasing_interval
    label: Decreasing interval
    type: interval
    correctAnswer: 1<x<5
    acceptedAnswers:
      - 1<x<5
      - 1 < x < 5
```

Hint:  
Use the sign of \(f'(x)\) in each interval.

Worked solution:  
The derivative is zero when
\[
3(x-1)(x-5)=0.
\]
So
\[
x=1 \quad \text{or} \quad x=5.
\]
Testing intervals gives \(f'(x)>0\) for \(x<1\) and \(x>5\), and \(f'(x)<0\) for \(1<x<5\).  
Therefore \(f\) is increasing for \(x<1\) and \(x>5\), and decreasing for \(1<x<5\).

Common mistake:  
Thinking that \(f'(x)=0\) alone gives the intervals.

---

### PPQ012 — hm-calc-diff-stationary-ppq-012

Stage: Past Paper-style Questions  
Subskill: Finding increasing and decreasing intervals  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
A curve has equation
\[
y=2x^3-9x^2+12x+4.
\]

State the intervals where the curve is increasing and decreasing.

Correct answer:  
Increasing for \(x<1 and x>2\).  
Decreasing for \(1<x<2\).

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 6x^2-18x+12
    acceptedAnswers:
      - 6x^2-18x+12
      - 6(x-1)(x-2)
      - dy/dx=6x^2-18x+12

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: 1,2
    acceptedAnswers:
      - 1,2
      - 1 and 2

  - id: increasing_intervals
    label: Increasing interval(s)
    type: interval
    correctAnswer: x<1 and x>2
    acceptedAnswers:
      - x<1 and x>2
      - x < 1 and x > 2

  - id: decreasing_interval
    label: Decreasing interval(s)
    type: interval
    correctAnswer: 1<x<2
    acceptedAnswers:
      - 1<x<2
      - 1 < x < 2
```

Hint:  
The curve is increasing where \(\frac{dy}{dx}>0\) and decreasing where \(\frac{dy}{dx}<0\).

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=6x^2-18x+12.
\]

Factorise:
\[
\frac{dy}{dx}=6(x-1)(x-2).
\]

The boundary values come from \(\frac{dy}{dx}=0\), so
\[
x=1,\quad x=2.
\]

Testing the sign of the derivative in each interval gives:
\[
\text{increasing for } x<1 and x>2,
\]
\[
\text{decreasing for } 1<x<2.
\]

Common mistake:  
Giving only the stationary values instead of the intervals where the derivative is positive or negative.

---

### PPQ013 — hm-calc-diff-stationary-ppq-013

Stage: Past Paper-style Questions  
Subskill: Finding where a curve is strictly decreasing  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^3+3x^2-9x+8.
\]

Find the interval where the curve is strictly decreasing.

Correct answer:  
\[
-3<x<1
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2+6x-9
    acceptedAnswers:
      - 3x^2+6x-9
      - 3(x+3)(x-1)
      - dy/dx=3x^2+6x-9

  - id: boundary_values
    label: Boundary x-values
    type: exact_list
    correctAnswer: -3,1
    acceptedAnswers:
      - -3,1
      - -3 and 1

  - id: decreasing_interval
    label: Decreasing interval
    type: interval
    correctAnswer: -3<x<1
    acceptedAnswers:
      - -3<x<1
      - -3 < x < 1
```

Hint:  
The curve is strictly decreasing where \(\frac{dy}{dx}<0\).

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=3x^2+6x-9=3(x+3)(x-1).
\]

The derivative is zero when \(x=-3\) or \(x=1\).  
Testing the sign of \(\frac{dy}{dx}\) shows that it is negative for
\[
-3<x<1.
\]
Therefore the curve is strictly decreasing for
\[
-3<x<1.
\]

Common mistake:  
Giving the boundary values instead of the interval between them.

---

### PPQ014 — hm-calc-diff-stationary-ppq-014

Stage: Past Paper-style Questions  
Subskill: Finding where a curve is strictly decreasing  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^3-12x^2+45x+2.
\]

Find the interval where the curve is strictly decreasing.

Correct answer:  
\[
3<x<5
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2-24x+45
    acceptedAnswers:
      - 3x^2-24x+45
      - 3(x-3)(x-5)
      - dy/dx=3x^2-24x+45

  - id: boundary_values
    label: Boundary x-values
    type: exact_list
    correctAnswer: 3,5
    acceptedAnswers:
      - 3,5
      - 3 and 5

  - id: decreasing_interval
    label: Decreasing interval
    type: interval
    correctAnswer: 3<x<5
    acceptedAnswers:
      - 3<x<5
      - 3 < x < 5
```

Hint:  
The curve is strictly decreasing where \(\frac{dy}{dx}<0\).

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=3x^2-24x+45=3(x-3)(x-5).
\]

The derivative is zero when \(x=3\) or \(x=5\).  
Testing the sign of \(\frac{dy}{dx}\) shows that it is negative for
\[
3<x<5.
\]
Therefore the curve is strictly decreasing for
\[
3<x<5.
\]

Common mistake:  
Giving the boundary values instead of the interval between them.

---

### PPQ015 — hm-calc-diff-stationary-ppq-015

Stage: Past Paper-style Questions  
Subskill: Finding increasing and decreasing intervals from a negative factorised derivative  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
For a function \(f\),
\[
f'(x)=-2(x+4)(x-1).
\]

State the intervals where \(f(x)\) is increasing and decreasing.

Correct answer:  
Increasing for \(-4<x<1\).  
Decreasing for \(x<-4\) and \(x>1\).

Answer fields for import:
```yaml
answerFields:
  - id: boundary_values
    label: Boundary x-values
    type: exact_list
    correctAnswer: -4,1
    acceptedAnswers:
      - -4,1
      - -4 and 1

  - id: increasing_interval
    label: Increasing interval
    type: interval
    correctAnswer: -4<x<1
    acceptedAnswers:
      - -4<x<1
      - -4 < x < 1

  - id: decreasing_intervals
    label: Decreasing intervals
    type: interval
    correctAnswer: x<-4 and x>1
    acceptedAnswers:
      - x<-4 and x>1
      - x < -4 and x > 1
```

Hint:  
Remember that the negative factor changes the sign pattern.

Worked solution:  
The derivative is zero when
\[
-2(x+4)(x-1)=0,
\]
so
\[
x=-4 \quad \text{or} \quad x=1.
\]
Testing signs gives \(f'(x)>0\) for \(-4<x<1\), and \(f'(x)<0\) for \(x<-4\) and \(x>1\).  
Therefore \(f\) is increasing for \(-4<x<1\) and decreasing for \(x<-4\) and \(x>1\).

Common mistake:  
Ignoring the negative factor at the front of the derivative.

---

### PPQ016 — hm-calc-diff-stationary-ppq-016

Stage: Past Paper-style Questions  
Subskill: Finding increasing and decreasing intervals  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
A curve has equation
\[
y=-x^3-3x^2+24x-1.
\]

State the intervals where the curve is increasing and decreasing.

Correct answer:  
Increasing for \(-4<x<2\).  
Decreasing for \(x<-4 and x>2\).

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: -3x^2-6x+24
    acceptedAnswers:
      - -3x^2-6x+24
      - -3(x+4)(x-2)
      - dy/dx=-3x^2-6x+24

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: -4,2
    acceptedAnswers:
      - -4,2
      - -4 and 2

  - id: increasing_interval
    label: Increasing interval(s)
    type: interval
    correctAnswer: -4<x<2
    acceptedAnswers:
      - -4<x<2
      - -4 < x < 2

  - id: decreasing_intervals
    label: Decreasing interval(s)
    type: interval
    correctAnswer: x<-4 and x>2
    acceptedAnswers:
      - x<-4 and x>2
      - x < -4 and x > 2
```

Hint:  
The curve is increasing where \(\frac{dy}{dx}>0\) and decreasing where \(\frac{dy}{dx}<0\).

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=-3x^2-6x+24.
\]

Factorise:
\[
\frac{dy}{dx}=-3(x+4)(x-2).
\]

The boundary values come from \(\frac{dy}{dx}=0\), so
\[
x=-4,\quad x=2.
\]

Testing the sign of the derivative in each interval gives:
\[
\text{increasing for } -4<x<2,
\]
\[
\text{decreasing for } x<-4 and x>2.
\]

Common mistake:  
Giving only the stationary values instead of the intervals where the derivative is positive or negative.

---

### PPQ017 — hm-calc-diff-stationary-ppq-017

Stage: Past Paper-style Questions  
Subskill: Recognising a horizontal point of inflexion from derivative sign  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^3-3x^2+3x+5.
\]

Find the stationary point and determine its nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\[
(1,6)\text{ horizontal point of inflexion}
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
      - 3(x-1)^2
      - dy/dx=3x^2-6x+3

  - id: stationary_x_value
    label: Stationary x-value
    type: exact
    correctAnswer: 1
    acceptedAnswers:
      - 1
      - x=1

  - id: stationary_point
    label: Stationary point
    type: coordinate
    correctAnswer: (1,6)
    acceptedAnswers:
      - (1,6)
      - (1, 6)
      - 1,6

  - id: nature
    label: Nature of stationary point
    type: text_short
    correctAnswer: horizontal point of inflexion
    acceptedAnswers:
      - horizontal point of inflexion
      - point of inflexion
      - stationary point of inflexion
      - stationary inflexion
```

Hint:  
Check whether the sign of the derivative changes at the stationary point.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=3x^2-6x+3=3(x-1)^2.
\]
Set \(\frac{dy}{dx}=0\), giving \(x=1\).  
Substituting into the original equation gives the stationary point \((1,6)\).  
The derivative is positive on both sides of \(x=1\), so the curve keeps moving in the same direction.  
Therefore \((1,6)\) is a horizontal point of inflexion.

Common mistake:  
Calling every stationary point a maximum or minimum.

---

### PPQ018 — hm-calc-diff-stationary-ppq-018

Stage: Past Paper-style Questions  
Subskill: Recognising a horizontal point of inflexion from derivative sign  
Type: multi_step  
Marks: 4  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=-x^3-6x^2-12x+1.
\]

Find the stationary point and determine its nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\[
(-2,9)\text{ horizontal point of inflexion}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: -3x^2-12x-12
    acceptedAnswers:
      - -3x^2-12x-12
      - -3(x+2)^2
      - dy/dx=-3x^2-12x-12

  - id: stationary_x_value
    label: Stationary x-value
    type: exact
    correctAnswer: -2
    acceptedAnswers:
      - -2
      - x=-2

  - id: stationary_point
    label: Stationary point
    type: coordinate
    correctAnswer: (-2,9)
    acceptedAnswers:
      - (-2,9)
      - (-2, 9)
      - -2,9

  - id: nature
    label: Nature of stationary point
    type: text_short
    correctAnswer: horizontal point of inflexion
    acceptedAnswers:
      - horizontal point of inflexion
      - point of inflexion
      - stationary point of inflexion
      - stationary inflexion
```

Hint:  
Check whether the sign of the derivative changes at the stationary point.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=-3x^2-12x-12=-3(x+2)^2.
\]
Set \(\frac{dy}{dx}=0\), giving \(x=-2\).  
Substituting into the original equation gives the stationary point \((-2,9)\).  
The derivative is negative on both sides of \(x=-2\), so the curve keeps moving in the same direction.  
Therefore \((-2,9)\) is a horizontal point of inflexion.

Common mistake:  
Calling every stationary point a maximum or minimum.

---

### PPQ019 — hm-calc-diff-stationary-ppq-019

Stage: Past Paper-style Questions  
Subskill: Finding and classifying three stationary points of a quartic  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^4-8x^2+3.
\]

Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\[
(-2,-13)\text{ minimum},\quad (0,3)\text{ maximum},\quad (2,-13)\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 4x^3-16x
    acceptedAnswers:
      - 4x^3-16x
      - 4x(x-2)(x+2)
      - dy/dx=4x^3-16x

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: -2,0,2
    acceptedAnswers:
      - -2,0,2
      - -2, 0, 2

  - id: stationary_point_1
    label: Stationary point at x = -2
    type: coordinate
    correctAnswer: (-2,-13)
    acceptedAnswers:
      - (-2,-13)
      - (-2, -13)
      - -2,-13

  - id: nature_1
    label: Nature at x = -2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min

  - id: stationary_point_2
    label: Stationary point at x = 0
    type: coordinate
    correctAnswer: (0,3)
    acceptedAnswers:
      - (0,3)
      - (0, 3)
      - 0,3

  - id: nature_2
    label: Nature at x = 0
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max

  - id: stationary_point_3
    label: Stationary point at x = 2
    type: coordinate
    correctAnswer: (2,-13)
    acceptedAnswers:
      - (2,-13)
      - (2, -13)
      - 2,-13

  - id: nature_3
    label: Nature at x = 2
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
```

Hint:  
Take out a common factor from the derivative before solving \(\frac{dy}{dx}=0\).

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=4x^3-16x=4x(x-2)(x+2).
\]
So the stationary values are
\[
x=-2,\quad x=0,\quad x=2.
\]
Substitution into the original equation gives
\[
(-2,-13),\quad (0,3),\quad (2,-13).
\]
Testing the sign of \(4x(x-2)(x+2)\) across the intervals gives minimum, maximum, minimum respectively.

Common mistake:  
Forgetting the stationary value \(x=0\) after taking out the common factor.

---

### PPQ020 — hm-calc-diff-stationary-ppq-020

Stage: Past Paper-style Questions  
Subskill: Greatest and least values on a closed interval  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Determine

Question:  
For
\[
f(x)=x^3-3x^2+2,
\]
determine the greatest and least values of \(f(x)\) on the interval
\[
-1\le x\le 4.
\]

Correct answer:  
Greatest value: \(18\)  
Least value: \(-2\)

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: f'(x)
    type: algebraic
    correctAnswer: 3x^2-6x
    acceptedAnswers:
      - 3x^2-6x
      - 3x(x-2)
      - f'(x)=3x^2-6x

  - id: stationary_x_values_in_interval
    label: Stationary x-values in interval
    type: exact_list
    correctAnswer: 0,2
    acceptedAnswers:
      - 0,2
      - 0 and 2

  - id: endpoint_and_stationary_values
    label: Values checked
    type: exact_list
    correctAnswer: -2,2,-2,18
    acceptedAnswers:
      - -2,2,-2,18
      - -2, 2, -2, 18

  - id: greatest_value
    label: Greatest value
    type: exact
    correctAnswer: 18
    acceptedAnswers:
      - 18
      - greatest=18

  - id: least_value
    label: Least value
    type: exact
    correctAnswer: -2
    acceptedAnswers:
      - -2
      - least=-2
```

Hint:  
Check the endpoint values and the stationary values inside the interval.

Worked solution:  
Differentiate:
\[
f'(x)=3x^2-6x=3x(x-2).
\]
The stationary values inside the interval are
\[
x=0,\quad x=2.
\]
Now evaluate \(f(x)\) at the endpoints and these stationary values. The values obtained are
\[
-2,\quad 2,\quad -2,\quad 18.
\]
Therefore, the greatest value is \(18\) and the least value is \(-2\).

Common mistake:  
Only checking stationary values and forgetting the endpoints of the closed interval.

---

### PPQ021 — hm-calc-diff-stationary-ppq-021

Stage: Past Paper-style Questions  
Subskill: Greatest and least values on a closed interval  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Determine

Question:  
For
\[
f(x)=-x^3+3x^2+9x-5,
\]
determine the greatest and least values of \(f(x)\) on the interval
\[
-2\le x\le 4.
\]

Correct answer:  
Greatest value: \(22\)  
Least value: \(-10\)

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: f'(x)
    type: algebraic
    correctAnswer: -3x^2+6x+9
    acceptedAnswers:
      - -3x^2+6x+9
      - -3(x-3)(x+1)
      - f'(x)=-3x^2+6x+9

  - id: stationary_x_values_in_interval
    label: Stationary x-values in interval
    type: exact_list
    correctAnswer: -1,3
    acceptedAnswers:
      - -1,3
      - -1 and 3

  - id: endpoint_and_stationary_values
    label: Values checked
    type: exact_list
    correctAnswer: -3,-10,22,15
    acceptedAnswers:
      - -3,-10,22,15
      - -3, -10, 22, 15

  - id: greatest_value
    label: Greatest value
    type: exact
    correctAnswer: 22
    acceptedAnswers:
      - 22
      - greatest=22

  - id: least_value
    label: Least value
    type: exact
    correctAnswer: -10
    acceptedAnswers:
      - -10
      - least=-10
```

Hint:  
Check the endpoint values and the stationary values inside the interval.

Worked solution:  
Differentiate:
\[
f'(x)=-3x^2+6x+9=-3(x-3)(x+1).
\]
The stationary values inside the interval are
\[
x=-1,\quad x=3.
\]
Now evaluate \(f(x)\) at the endpoints and these stationary values. The values obtained are
\[
-3,\quad -10,\quad 22,\quad 15.
\]
Therefore, the greatest value is \(22\) and the least value is \(-10\).

Common mistake:  
Only checking stationary values and forgetting the endpoints of the closed interval.

---

### PPQ022 — hm-calc-diff-stationary-ppq-022

Stage: Past Paper-style Questions  
Subskill: Greatest and least values on a closed interval  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Determine

Question:  
For
\[
f(x)=2x^3-9x^2+12x+1,
\]
determine the greatest and least values of \(f(x)\) on the interval
\[
0\le x\le 3.
\]

Correct answer:  
Greatest value: \(10\)  
Least value: \(1\)

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: f'(x)
    type: algebraic
    correctAnswer: 6x^2-18x+12
    acceptedAnswers:
      - 6x^2-18x+12
      - 6(x-1)(x-2)
      - f'(x)=6x^2-18x+12

  - id: stationary_x_values_in_interval
    label: Stationary x-values in interval
    type: exact_list
    correctAnswer: 1,2
    acceptedAnswers:
      - 1,2
      - 1 and 2

  - id: endpoint_and_stationary_values
    label: Values checked
    type: exact_list
    correctAnswer: 1,6,5,10
    acceptedAnswers:
      - 1,6,5,10
      - 1, 6, 5, 10

  - id: greatest_value
    label: Greatest value
    type: exact
    correctAnswer: 10
    acceptedAnswers:
      - 10
      - greatest=10

  - id: least_value
    label: Least value
    type: exact
    correctAnswer: 1
    acceptedAnswers:
      - 1
      - least=1
```

Hint:  
Check the endpoint values and the stationary values inside the interval.

Worked solution:  
Differentiate:
\[
f'(x)=6x^2-18x+12=6(x-1)(x-2).
\]
The stationary values inside the interval are
\[
x=1,\quad x=2.
\]
Now evaluate \(f(x)\) at the endpoints and these stationary values. The values obtained are
\[
1,\quad 6,\quad 5,\quad 10.
\]
Therefore, the greatest value is \(10\) and the least value is \(1\).

Common mistake:  
Only checking stationary values and forgetting the endpoints of the closed interval.

---

### PPQ023 — hm-calc-diff-stationary-ppq-023

Stage: Past Paper-style Questions  
Subskill: Stationary point using Chain rule  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=(x-2)^4+1.
\]

Find the stationary point and determine its nature using the sign of \(\frac{dy}{dx}\).

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
    correctAnswer: 4(x-2)^3
    acceptedAnswers:
      - 4(x-2)^3
      - 4*(x-2)^3
      - dy/dx=4(x-2)^3

  - id: stationary_x_value
    label: Stationary x-value
    type: exact
    correctAnswer: 2
    acceptedAnswers:
      - 2
      - x=2

  - id: stationary_point
    label: Stationary point
    type: coordinate
    correctAnswer: (2,1)
    acceptedAnswers:
      - (2,1)
      - (2, 1)
      - 2,1

  - id: nature
    label: Nature of stationary point
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Differentiate using the Chain rule, then check the sign of the derivative on either side of \(x=2\).

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=4(x-2)^3.
\]
Set \(\frac{dy}{dx}=0\):
\[
4(x-2)^3=0,
\]
so \(x=2\).  
Substitute into the original equation:
\[
y=(2-2)^4+1=1.
\]
So the stationary point is \((2,1)\).  
For \(x<2\), \(4(x-2)^3<0\). For \(x>2\), \(4(x-2)^3>0\).  
The derivative changes from negative to positive, so \((2,1)\) is a minimum.

Common mistake:  
Solving \((x-2)^4=0\) instead of using the derivative.

---

### PPQ024 — hm-calc-diff-stationary-ppq-024

Stage: Past Paper-style Questions  
Subskill: Stationary point using Chain rule with a linear bracket  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=(x+1)^4-4x.
\]

Find the stationary point and determine its nature using the sign of \(\frac{dy}{dx}\).

Correct answer:  
\[
(0,1)\text{ minimum}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 4(x+1)^3-4
    acceptedAnswers:
      - 4(x+1)^3-4
      - 4*(x+1)^3-4
      - dy/dx=4(x+1)^3-4

  - id: stationary_x_value
    label: Stationary x-value
    type: exact
    correctAnswer: 0
    acceptedAnswers:
      - 0
      - x=0

  - id: stationary_point
    label: Stationary point
    type: coordinate
    correctAnswer: (0,1)
    acceptedAnswers:
      - (0,1)
      - (0, 1)
      - 0,1

  - id: nature
    label: Nature of stationary point
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min
      - local minimum
```

Hint:  
Set the derivative equal to zero and solve the simple cubic equation.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=4(x+1)^3-4.
\]
Set \(\frac{dy}{dx}=0\):
\[
4(x+1)^3-4=0.
\]
So
\[
(x+1)^3=1,
\]
which gives \(x=0\).  
Substitute into the original equation:
\[
y=(0+1)^4-4(0)=1.
\]
So the stationary point is \((0,1)\).  
Testing either side of \(x=0\) shows the derivative changes from negative to positive, so \((0,1)\) is a minimum.

Common mistake:  
Solving \((x+1)^3=1\) as \(x=1\) instead of \(x=0\).

---

### PPQ025 — hm-calc-diff-stationary-ppq-025

Stage: Past Paper-style Questions  
Subskill: Stationary points, nature, and decreasing interval  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A curve has equation
\[
y=x^3-6x^2+9x+4.
\]

(a) Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).  
(b) State the interval where the curve is decreasing.

Correct answer:  
(a) \((1,8)\) maximum, \((3,4)\) minimum  
(b) \(1<x<3\)

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: First derivative
    type: algebraic
    correctAnswer: 3x^2-12x+9
    acceptedAnswers:
      - 3x^2-12x+9
      - 3(x-1)(x-3)
      - dy/dx=3x^2-12x+9

  - id: stationary_x_values
    label: Stationary x-values
    type: exact_list
    correctAnswer: 1,3
    acceptedAnswers:
      - 1,3
      - 1 and 3

  - id: stationary_point_1
    label: Stationary point at x = 1
    type: coordinate
    correctAnswer: (1,8)
    acceptedAnswers:
      - (1,8)
      - (1, 8)
      - 1,8

  - id: nature_1
    label: Nature at x = 1
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max

  - id: stationary_point_2
    label: Stationary point at x = 3
    type: coordinate
    correctAnswer: (3,4)
    acceptedAnswers:
      - (3,4)
      - (3, 4)
      - 3,4

  - id: nature_2
    label: Nature at x = 3
    type: text_short
    correctAnswer: minimum
    acceptedAnswers:
      - minimum
      - min

  - id: decreasing_interval
    label: Decreasing interval
    type: interval
    correctAnswer: 1<x<3
    acceptedAnswers:
      - 1<x<3
      - 1 < x < 3
```

Hint:  
The sign of the derivative answers both the nature and decreasing interval parts.

Worked solution:  
Differentiate:
\[
\frac{dy}{dx}=3x^2-12x+9=3(x-1)(x-3).
\]
Set the derivative equal to zero:
\[
x=1 \quad \text{or} \quad x=3.
\]
Substitute into the original equation:
\[
y(1)=8,\quad y(3)=4.
\]
So the stationary points are \((1,8)\) and \((3,4)\).  
The derivative changes from positive to negative at \(x=1\), so \((1,8)\) is a maximum.  
The derivative changes from negative to positive at \(x=3\), so \((3,4)\) is a minimum.  
The derivative is negative between these values, so the curve is decreasing for
\[
1<x<3.
\]

Common mistake:  
Giving \(x=1\) and \(x=3\) for part (b), rather than the interval between them.

---
## Past Paper-style Questions — all questions together for skim

1. A curve has equation \(y=x^3-6x^2+9x+2\). Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).
2. A curve has equation \(y=-x^3+3x^2+9x-4\). Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).
3. A curve has equation \(y=2x^3-15x^2+36x-5\). Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).
4. A curve has equation \(y=x^3-3x^2-9x+5\). Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).
5. A curve has equation \(y=-2x^3+3x^2+12x+1\). Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).
6. A curve has equation \(y=x^3-12x+7\). Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).
7. A curve has equation \(y=4x^3-12x^2-36x+6\). Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).
8. A curve has equation \(y=-x^3+6x^2-9x+4\). Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).
9. A curve has equation \(y=x^3-3x^2-24x+1\). State the intervals where the curve is increasing and decreasing.
10. A curve has equation \(y=-x^3+6x^2+15x-2\). State the intervals where the curve is increasing and decreasing.
11. For a function \(f\), \(f'(x)=3(x-1)(x-5)\). State the intervals where \(f(x)\) is increasing and decreasing.
12. A curve has equation \(y=2x^3-9x^2+12x+4\). State the intervals where the curve is increasing and decreasing.
13. A curve has equation \(y=x^3+3x^2-9x+8\). Find the interval where the curve is strictly decreasing.
14. A curve has equation \(y=x^3-12x^2+45x+2\). Find the interval where the curve is strictly decreasing.
15. For a function \(f\), \(f'(x)=-2(x+4)(x-1)\). State the intervals where \(f(x)\) is increasing and decreasing.
16. A curve has equation \(y=-x^3-3x^2+24x-1\). State the intervals where the curve is increasing and decreasing.
17. A curve has equation \(y=x^3-3x^2+3x+5\). Find the stationary point and determine its nature using the sign of \(\frac{dy}{dx}\).
18. A curve has equation \(y=-x^3-6x^2-12x+1\). Find the stationary point and determine its nature using the sign of \(\frac{dy}{dx}\).
19. A curve has equation \(y=x^4-8x^2+3\). Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\).
20. For \(f(x)=x^3-3x^2+2\), determine the greatest and least values of \(f(x)\) on the interval \(-1\le x\le 4\).
21. For \(f(x)=-x^3+3x^2+9x-5\), determine the greatest and least values of \(f(x)\) on the interval \(-2\le x\le 4\).
22. For \(f(x)=2x^3-9x^2+12x+1\), determine the greatest and least values of \(f(x)\) on the interval \(0\le x\le 3\).
23. A curve has equation \(y=(x-2)^4+1\). Find the stationary point and determine its nature using the sign of \(\frac{dy}{dx}\).
24. A curve has equation \(y=(x+1)^4-4x\). Find the stationary point and determine its nature using the sign of \(\frac{dy}{dx}\).
25. A curve has equation \(y=x^3-6x^2+9x+4\). (a) Find the coordinates of the stationary points and determine their nature using the sign of \(\frac{dy}{dx}\). (b) State the interval where the curve is decreasing.

---

## Import readiness checklist / QA checklist

- [x] Correct file structure retained from Stationary Points v1.
- [x] Stage mapping retained: Foundations, Applications, Past Paper-style Questions.
- [x] Final count checked: Foundations 8, Applications 10, Past Paper-style Questions 25, Total 43.
- [x] All PPQs are original STEM Forge QS-style content.
- [x] No official SQA wording, values, diagrams, scenarios, or marking instructions copied.
- [x] No second derivative method used.
- [x] No completing the square used.
- [x] No derived graphs or graph sketching used.
- [x] No optimisation contexts used.
- [x] No tangent or normal equations used.
- [x] No trig stationary-point solving used.
- [x] Closed interval greatest/least value questions limited to exactly 3.
- [x] Nature determined using derivative sign / increasing-decreasing behaviour.
- [x] Multi-step questions use structured answer fields for import.
- [x] Skim list included with all 25 PPQs.

Storage note: this is a content-bank draft, not active app data. Import later only after architecture, QA, and testing are ready.

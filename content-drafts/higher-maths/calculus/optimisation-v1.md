# STEM Forge — Higher Maths Optimisation Question Bank v1

Status: **QA-reviewed lean auto-mark content-bank draft with structured answer fields**  
Do not import into the app yet. Store as a future content-bank draft.

Path: Higher Maths → Calculus → Differentiation → Optimisation

Source label: Original STEM Forge QS-style content  
QS skill tested: Optimisation using differentiation  
Independence note: Independent original material; not affiliated with or endorsed by SQA.

Import defaults:
- skillPathId: hm-calc-diff-optimisation
- source: Original STEM Forge QS-style content
- stageId mapping:
  - Foundations → foundations
  - Applications → applications
  - Past Paper-style Questions → not used for this v1 skill path

Draft import type note:
Some answer field types in this Markdown draft, such as `exact`, `algebraic`, `text_short`, and similar types, are content-bank labels. During app import, map these to the actual supported STEM Forge input types.

Optimisation import/UI note:
This bank will require structured multi-field auto-mark UI. In particular, the app should support separate answer fields for rearranged constraint expressions, objective functions in one variable, derivatives, optimal values, maximum/minimum values, and contextual final answers. Worked solutions include nature tables/sign checks, but students should not need to type full gradient tables. Do not build graph sketching, diagram-marking, or second-derivative workflows for this skill path.

Final kept count:
- Foundations: 6
- Applications: 8
- Past Paper-style Questions: 0
- Total: 14

Past Paper-style status:
- No separate PPQ section is included in this v1 content-bank draft.
- Reason: Higher Maths optimisation PPQs often rely on diagrams or visually described contexts. Without diagram support, forcing a PPQ section would make the bank too text-heavy, artificial, or hard to auto-mark fairly.
- The Applications section covers the key optimisation method in an auto-markable format.
- Future PPQs should be added only after STEM Forge supports simple diagrams or visual prompt cards.

Content boundary:
- Include: fixed perimeter and area constraints, fixed volume and surface area constraints, rectangular fencing/enclosure contexts, open-top and closed box contexts, rewriting formulae into one variable, differentiating objective functions, using sign/gradient tables to confirm maximum or minimum, and giving final values in context.
- Avoid: second derivative method, full diagram-heavy PPQs, normal lines, vague written interpretation, integration/reverse differentiation, hard modelling, trigonometric optimisation, graph sketching/manual marking, and copying official past-paper wording/diagrams/scenarios.

Important method rule:
- Do not use the second derivative method in this bank.
- Nature must be determined using a gradient table, sign of the derivative, or increasing/decreasing behaviour.

Storage note:
This is a content-bank draft, not active app data. Import later only after architecture, QA, and testing are ready.

---

## Foundations

### F001 — hm-calc-diff-optimisation-f-001

Stage: Foundations  
Subskill: Rearranging a perimeter constraint  
Type: algebraic  
Marks: 1  
Calculator/non-calculator: Non-calculator  
Command word: Express

Question:  
A rectangle has width \(x\) metres and length \(y\) metres.

Three sides of the rectangle have total length \(30\) metres, so
\[
2x+y=30.
\]

Express \(y\) in terms of \(x\).

Correct answer:  
\[
y=30-2x
\]

Accepted answers:
- 30-2x
- 30 - 2x
- y=30-2x
- y = 30 - 2x

Hint:  
Rearrange the equation to make \(y\) the subject.

Worked solution:  
\[
2x+y=30
\]

Subtract \(2x\) from both sides:
\[
y=30-2x.
\]

Common mistake:  
Writing \(y=30+2x\). Since \(2x\) is being moved to the other side, it becomes negative.

---

### F002 — hm-calc-diff-optimisation-f-002

Stage: Foundations  
Subskill: Substituting a constraint into an area formula  
Type: multi_step  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Write

Question:  
A rectangle has width \(x\) metres and length \(y\) metres.

Its area is
\[
A=xy.
\]

Given that
\[
y=30-2x,
\]
write \(A\) in terms of \(x\).

Correct answer:  
\[
A=x(30-2x)
\]
or
\[
A=30x-2x^2
\]

Answer fields for import:
```yaml
answerFields:
  - id: substituted_area_expression
    label: Area expression
    type: algebraic
    correctAnswer: x(30-2x)
    acceptedAnswers:
      - x(30-2x)
      - x(30 - 2x)
      - x*(30-2x)
      - A=x(30-2x)
      - A = x(30 - 2x)
      - 30x-2x^2
      - 30x - 2x^2
      - A=30x-2x^2
      - A = 30x - 2x^2
```

Hint:  
Replace \(y\) in \(A=xy\) with \(30-2x\).

Worked solution:  
\[
A=xy
\]

Since
\[
y=30-2x,
\]
we substitute this into the area formula:
\[
A=x(30-2x).
\]

Expanding:
\[
A=30x-2x^2.
\]

Common mistake:  
Substituting into the wrong place and writing \(A=x+30-2x\). Area uses multiplication, so \(A=x(30-2x)\).

---

### F003 — hm-calc-diff-optimisation-f-003

Stage: Foundations  
Subskill: Rearranging a volume constraint  
Type: algebraic  
Marks: 1  
Calculator/non-calculator: Non-calculator  
Command word: Express

Question:  
A box has a square base of side \(x\) cm and height \(h\) cm.

Its volume is
\[
V=x^2h.
\]

Given that the volume is \(500\text{ cm}^3\), express \(h\) in terms of \(x\).

Correct answer:  
\[
h=\frac{500}{x^2}
\]

Accepted answers:
- 500/x^2
- 500/(x^2)
- h=500/x^2
- h = 500/x^2
- h=\frac{500}{x^2}
- 500x^-2

Hint:  
Use \(x^2h=500\), then divide by \(x^2\).

Worked solution:  
\[
x^2h=500
\]

Divide both sides by \(x^2\):
\[
h=\frac{500}{x^2}.
\]

Common mistake:  
Writing \(h=500x^2\). Since \(x^2h=500\), you must divide by \(x^2\), not multiply.

---

### F004 — hm-calc-diff-optimisation-f-004

Stage: Foundations  
Subskill: Substituting a volume constraint into a surface area formula  
Type: multi_step  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: Write

Question:  
A closed box has a square base of side \(x\) cm and height \(h\) cm.

Its surface area is
\[
S=2x^2+4xh.
\]

Given that
\[
h=\frac{500}{x^2},
\]
write \(S\) in terms of \(x\).

Correct answer:  
\[
S=2x^2+\frac{2000}{x}
\]

Answer fields for import:
```yaml
answerFields:
  - id: substituted_surface_area_expression
    label: Surface area expression
    type: algebraic
    correctAnswer: 2x^2+2000/x
    acceptedAnswers:
      - 2x^2+2000/x
      - 2x^2 + 2000/x
      - 2x^2+2000/(x)
      - 2x^2 + 2000/(x)
      - 2x^2+2000x^-1
      - 2x^2 + 2000x^-1
      - S=2x^2+2000/x
      - S = 2x^2 + 2000/x
      - 2x^2+\frac{2000}{x}
```

Hint:  
Replace \(h\) in \(S=2x^2+4xh\) with \(\frac{500}{x^2}\), then simplify.

Worked solution:  
\[
S=2x^2+4xh
\]

Substitute
\[
h=\frac{500}{x^2}.
\]

\[
S=2x^2+4x\left(\frac{500}{x^2}\right)
\]

\[
S=2x^2+\frac{2000x}{x^2}
\]

\[
S=2x^2+\frac{2000}{x}.
\]

Common mistake:  
Leaving the answer as \(2x^2+\frac{2000x}{x^2}\) without simplifying to \(\frac{2000}{x}\).

---

### F005 — hm-calc-diff-optimisation-f-005

Stage: Foundations  
Subskill: Finding the stationary value of an objective function  
Type: multi_step  
Marks: 3  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
The area \(A\) of a rectangle is given by
\[
A=30x-2x^2.
\]

Find the value of \(x\) which gives the stationary value of \(A\).

Correct answer:  
\[
x=\frac{15}{2}
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 30-4x
    acceptedAnswers:
      - 30-4x
      - 30 - 4x
      - -4x+30
      - -4x + 30
      - dA/dx=30-4x
      - dA/dx = 30 - 4x

  - id: stationary_x_value
    label: Stationary x-value
    type: exact
    correctAnswer: 15/2
    acceptedAnswers:
      - 15/2
      - 7.5
      - x=15/2
      - x = 15/2
      - x=7.5
      - x = 7.5
```

Hint:  
At a stationary value, the derivative is equal to zero.

Worked solution:  
\[
A=30x-2x^2
\]

Differentiate:
\[
\frac{dA}{dx}=30-4x.
\]

At a stationary value,
\[
\frac{dA}{dx}=0.
\]

So
\[
30-4x=0
\]

\[
4x=30
\]

\[
x=\frac{30}{4}=\frac{15}{2}.
\]

Common mistake:  
Substituting into \(A\) before finding the value of \(x\). Optimisation needs the derivative first.

---

### F006 — hm-calc-diff-optimisation-f-006

Stage: Foundations  
Subskill: Confirming maximum or minimum using derivative sign  
Type: multi_step  
Marks: 2  
Calculator/non-calculator: Non-calculator  
Command word: State

Question:  
For a function \(A(x)\), the derivative changes sign as shown.

\[
\begin{array}{c|ccc}
x & x<5 & 5 & x>5 \\
\hline
A'(x) & + & 0 & - \\
\text{slope} & / & - & \backslash
\end{array}
\]

State whether the stationary value at \(x=5\) is a maximum or a minimum.

Correct answer:  
Maximum

Answer fields for import:
```yaml
answerFields:
  - id: nature
    label: Nature of stationary value
    type: text_short
    correctAnswer: maximum
    acceptedAnswers:
      - maximum
      - max
      - local maximum
      - maximum value
```

Hint:  
A change from positive gradient to negative gradient means the function changes from increasing to decreasing.

Worked solution:  
For \(x<5\), \(A'(x)>0\), so \(A(x)\) is increasing.

For \(x>5\), \(A'(x)<0\), so \(A(x)\) is decreasing.

The function increases up to \(x=5\), then decreases after \(x=5\).

So the stationary value at \(x=5\) is a maximum.

Common mistake:  
Thinking \(A'(x)=0\) alone tells you whether it is a maximum or minimum. You need to check the sign of the derivative on each side.

---

## Applications

### A001 — hm-calc-diff-optimisation-a-001

Stage: Applications  
Subskill: Maximising area with a fixed fencing constraint  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A rectangular pen is built against a wall.

The pen has width \(x\) metres and length \(y\) metres. Only three sides need fencing, and the total length of fencing is \(36\) metres.

\[
2x+y=36
\]

The area of the pen is \(A\text{ m}^2\).

Find the maximum possible area of the pen.

Correct answer:  
\[
162\text{ m}^2
\]

Answer fields for import:
```yaml
answerFields:
  - id: length_expression
    label: Length in terms of x
    type: algebraic
    correctAnswer: 36-2x
    acceptedAnswers:
      - 36-2x
      - 36 - 2x
      - y=36-2x
      - y = 36 - 2x

  - id: area_expression
    label: Area expression
    type: algebraic
    correctAnswer: 36x-2x^2
    acceptedAnswers:
      - x(36-2x)
      - x(36 - 2x)
      - x*(36-2x)
      - 36x-2x^2
      - 36x - 2x^2
      - A=36x-2x^2
      - A = 36x - 2x^2

  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 36-4x
    acceptedAnswers:
      - 36-4x
      - 36 - 4x
      - -4x+36
      - -4x + 36
      - dA/dx=36-4x
      - dA/dx = 36 - 4x

  - id: optimal_x
    label: Optimal width
    type: exact
    correctAnswer: 9
    acceptedAnswers:
      - 9
      - x=9
      - x = 9
      - 9m
      - 9 m

  - id: maximum_area
    label: Maximum area
    type: exact
    correctAnswer: 162
    acceptedAnswers:
      - 162
      - 162m^2
      - 162 m^2
```

Hint:  
Use \(2x+y=36\) to write \(y\) in terms of \(x\), then substitute into \(A=xy\).

Worked solution:  
\[
2x+y=36
\]

So
\[
y=36-2x.
\]

The area is
\[
A=xy.
\]

Substitute \(y=36-2x\):
\[
A=x(36-2x)
\]

\[
A=36x-2x^2.
\]

Differentiate:
\[
\frac{dA}{dx}=36-4x.
\]

At a stationary value:
\[
36-4x=0
\]

\[
x=9.
\]

Now check the nature using the sign of \(\frac{dA}{dx}\):

\[
\begin{array}{c|ccc}
x & x<9 & 9 & x>9 \\
\hline
A'(x) & + & 0 & - \\
\text{slope} & / & - & \backslash
\end{array}
\]

Since \(A'(x)\) changes from positive to negative, this gives a maximum.

Now find the maximum area:
\[
A=36(9)-2(9)^2
\]

\[
A=324-162=162.
\]

The maximum possible area is
\[
162\text{ m}^2.
\]

Common mistake:  
Using \(2x+2y=36\). Since the pen is against a wall, only three sides need fencing.

---

### A002 — hm-calc-diff-optimisation-a-002

Stage: Applications  
Subskill: Minimising surface area with fixed volume  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A closed box has a square base of side \(x\) cm and height \(h\) cm.

The volume is fixed at \(512\text{ cm}^3\), so
\[
x^2h=512.
\]

The surface area is
\[
S=2x^2+4xh.
\]

Find the value of \(x\) which gives the minimum surface area, and find this minimum surface area.

Correct answer:  
\[
x=8,\qquad S=384\text{ cm}^2
\]

Answer fields for import:
```yaml
answerFields:
  - id: height_expression
    label: Height in terms of x
    type: algebraic
    correctAnswer: 512/x^2
    acceptedAnswers:
      - 512/x^2
      - 512/(x^2)
      - 512x^-2
      - h=512/x^2
      - h = 512/x^2

  - id: surface_area_expression
    label: Surface area in terms of x
    type: algebraic
    correctAnswer: 2x^2+2048/x
    acceptedAnswers:
      - 2x^2+2048/x
      - 2x^2 + 2048/x
      - 2x^2+2048x^-1
      - 2x^2 + 2048x^-1
      - S=2x^2+2048/x
      - S = 2x^2 + 2048/x

  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 4x-2048/x^2
    acceptedAnswers:
      - 4x-2048/x^2
      - 4x - 2048/x^2
      - 4x-2048x^-2
      - 4x - 2048x^-2
      - dS/dx=4x-2048/x^2
      - dS/dx = 4x - 2048/x^2

  - id: optimal_x
    label: Value of x
    type: exact
    correctAnswer: 8
    acceptedAnswers:
      - 8
      - x=8
      - x = 8
      - 8cm
      - 8 cm

  - id: minimum_surface_area
    label: Minimum surface area
    type: exact
    correctAnswer: 384
    acceptedAnswers:
      - 384
      - 384cm^2
      - 384 cm^2
```

Hint:  
Use the volume equation to write \(h\) in terms of \(x\), then substitute into the surface area formula.

Worked solution:  
\[
x^2h=512
\]

So
\[
h=\frac{512}{x^2}.
\]

The surface area is
\[
S=2x^2+4xh.
\]

Substitute \(h=\frac{512}{x^2}\):
\[
S=2x^2+4x\left(\frac{512}{x^2}\right)
\]

\[
S=2x^2+\frac{2048}{x}.
\]

Differentiate:
\[
\frac{dS}{dx}=4x-\frac{2048}{x^2}.
\]

At a stationary value:
\[
4x-\frac{2048}{x^2}=0.
\]

\[
4x=\frac{2048}{x^2}
\]

\[
4x^3=2048
\]

\[
x^3=512
\]

\[
x=8.
\]

Now check the nature using the sign of \(\frac{dS}{dx}\):

\[
\begin{array}{c|ccc}
x & x<8 & 8 & x>8 \\
\hline
S'(x) & - & 0 & + \\
\text{slope} & \backslash & - & /
\end{array}
\]

Since \(S'(x)\) changes from negative to positive, this gives a minimum.

Now find the minimum surface area:
\[
S=2(8)^2+\frac{2048}{8}
\]

\[
S=128+256=384.
\]

The minimum surface area is
\[
384\text{ cm}^2.
\]

Common mistake:  
Using \(x^2+4xh\) instead of \(2x^2+4xh\). A closed box has both a top and a base.

---

### A003 — hm-calc-diff-optimisation-a-003

Stage: Applications  
Subskill: Maximising volume of an open box using a provided expression  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
The volume \(V\text{ cm}^3\) of an open box is given by
\[
V=4x^3-36x^2+96x,
\]
where \(x\) is the size of the square cut from each corner of a rectangular sheet of card.

For this context,
\[
0<x<4.
\]

Find the value of \(x\) which gives the maximum volume, and find this maximum volume.

Correct answer:  
\[
x=2,\qquad V=80\text{ cm}^3
\]

Answer fields for import:
```yaml
answerFields:
  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 12x^2-72x+96
    acceptedAnswers:
      - 12x^2-72x+96
      - 12x^2 - 72x + 96
      - 12(x-2)(x-4)
      - 12*(x-2)*(x-4)
      - dV/dx=12x^2-72x+96
      - dV/dx = 12x^2 - 72x + 96

  - id: stationary_x_value
    label: Stationary x-value in interval
    type: exact
    correctAnswer: 2
    acceptedAnswers:
      - 2
      - x=2
      - x = 2
      - 2cm
      - 2 cm

  - id: maximum_volume
    label: Maximum volume
    type: exact
    correctAnswer: 80
    acceptedAnswers:
      - 80
      - 80cm^3
      - 80 cm^3
```

Hint:  
Differentiate \(V\), solve \(V'(x)=0\), and only keep values in \(0<x<4\).

Worked solution:  
\[
V=4x^3-36x^2+96x.
\]

Differentiate:
\[
\frac{dV}{dx}=12x^2-72x+96.
\]

Factorise:
\[
\frac{dV}{dx}=12(x^2-6x+8)
\]

\[
\frac{dV}{dx}=12(x-2)(x-4).
\]

At a stationary value:
\[
12(x-2)(x-4)=0.
\]

So
\[
x=2 \quad \text{or} \quad x=4.
\]

But the context says
\[
0<x<4,
\]
so
\[
x=2.
\]

Now check the nature using the sign of \(\frac{dV}{dx}\):

\[
\begin{array}{c|ccc}
x & x<2 & 2 & 2<x<4 \\
\hline
V'(x) & + & 0 & - \\
\text{slope} & / & - & \backslash
\end{array}
\]

Since \(V'(x)\) changes from positive to negative, this gives a maximum.

Now find the maximum volume:
\[
V=4(2)^3-36(2)^2+96(2)
\]

\[
V=32-144+192=80.
\]

The maximum volume is
\[
80\text{ cm}^3.
\]

Common mistake:  
Including \(x=4\), even though \(x=4\) is outside the allowed interval \(0<x<4\).

---

### A004 — hm-calc-diff-optimisation-a-004

Stage: Applications  
Subskill: Minimising perimeter with fixed area  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A rectangle has width \(x\) metres and length \(y\) metres.

Its area is fixed at \(100\text{ m}^2\), so
\[
xy=100.
\]

The perimeter is
\[
P=2x+2y.
\]

Find the value of \(x\) which gives the minimum perimeter, and find this minimum perimeter.

Correct answer:  
\[
x=10,\qquad P=40\text{ m}
\]

Answer fields for import:
```yaml
answerFields:
  - id: length_expression
    label: Length in terms of x
    type: algebraic
    correctAnswer: 100/x
    acceptedAnswers:
      - 100/x
      - 100/(x)
      - 100x^-1
      - y=100/x
      - y = 100/x

  - id: perimeter_expression
    label: Perimeter in terms of x
    type: algebraic
    correctAnswer: 2x+200/x
    acceptedAnswers:
      - 2x+200/x
      - 2x + 200/x
      - 2x+200x^-1
      - 2x + 200x^-1
      - P=2x+200/x
      - P = 2x + 200/x

  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 2-200/x^2
    acceptedAnswers:
      - 2-200/x^2
      - 2 - 200/x^2
      - 2-200x^-2
      - 2 - 200x^-2
      - dP/dx=2-200/x^2
      - dP/dx = 2 - 200/x^2

  - id: optimal_x
    label: Value of x
    type: exact
    correctAnswer: 10
    acceptedAnswers:
      - 10
      - x=10
      - x = 10
      - 10m
      - 10 m

  - id: minimum_perimeter
    label: Minimum perimeter
    type: exact
    correctAnswer: 40
    acceptedAnswers:
      - 40
      - 40m
      - 40 m
```

Hint:  
Use \(xy=100\) to write \(y\) in terms of \(x\), then substitute into the perimeter formula.

Worked solution:  
\[
xy=100
\]

So
\[
y=\frac{100}{x}.
\]

The perimeter is
\[
P=2x+2y.
\]

Substitute \(y=\frac{100}{x}\):
\[
P=2x+2\left(\frac{100}{x}\right)
\]

\[
P=2x+\frac{200}{x}.
\]

Differentiate:
\[
\frac{dP}{dx}=2-\frac{200}{x^2}.
\]

At a stationary value:
\[
2-\frac{200}{x^2}=0.
\]

\[
2=\frac{200}{x^2}
\]

\[
2x^2=200
\]

\[
x^2=100
\]

\[
x=10
\]

since \(x>0\).

Now check the nature using the sign of \(\frac{dP}{dx}\):

\[
\begin{array}{c|ccc}
x & x<10 & 10 & x>10 \\
\hline
P'(x) & - & 0 & + \\
\text{slope} & \backslash & - & /
\end{array}
\]

Since \(P'(x)\) changes from negative to positive, this gives a minimum.

Now find the minimum perimeter:
\[
P=2(10)+\frac{200}{10}
\]

\[
P=20+20=40.
\]

The minimum perimeter is
\[
40\text{ m}.
\]

Common mistake:  
Keeping both \(x=10\) and \(x=-10\). A length cannot be negative, so only \(x=10\) is valid.

---

### A005 — hm-calc-diff-optimisation-a-005

Stage: Applications  
Subskill: Maximising volume with fixed surface area  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A closed box has a square base of side \(x\) cm and height \(h\) cm.

The surface area is fixed at \(600\text{ cm}^2\), so
\[
2x^2+4xh=600.
\]

The volume is
\[
V=x^2h.
\]

Find the value of \(x\) which gives the maximum volume, and find this maximum volume.

Correct answer:  
\[
x=10,\qquad V=1000\text{ cm}^3
\]

Answer fields for import:
```yaml
answerFields:
  - id: height_expression
    label: Height in terms of x
    type: algebraic
    correctAnswer: 150/x-x/2
    acceptedAnswers:
      - 150/x-x/2
      - 150/x - x/2
      - 150x^-1-x/2
      - 150x^-1 - x/2
      - h=150/x-x/2
      - h = 150/x - x/2
      - (600-2x^2)/(4x)

  - id: volume_expression
    label: Volume in terms of x
    type: algebraic
    correctAnswer: 150x-x^3/2
    acceptedAnswers:
      - 150x-x^3/2
      - 150x - x^3/2
      - 150x-0.5x^3
      - 150x - 0.5x^3
      - V=150x-x^3/2
      - V = 150x - x^3/2

  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 150-3x^2/2
    acceptedAnswers:
      - 150-3x^2/2
      - 150 - 3x^2/2
      - 150-1.5x^2
      - 150 - 1.5x^2
      - dV/dx=150-3x^2/2
      - dV/dx = 150 - 3x^2/2

  - id: optimal_x
    label: Value of x
    type: exact
    correctAnswer: 10
    acceptedAnswers:
      - 10
      - x=10
      - x = 10
      - 10cm
      - 10 cm

  - id: maximum_volume
    label: Maximum volume
    type: exact
    correctAnswer: 1000
    acceptedAnswers:
      - 1000
      - 1000cm^3
      - 1000 cm^3
```

Hint:  
Use the surface area equation to write \(h\) in terms of \(x\), then substitute into the volume formula.

Worked solution:  
\[
2x^2+4xh=600
\]

\[
4xh=600-2x^2
\]

\[
h=\frac{600-2x^2}{4x}.
\]

Simplify:
\[
h=\frac{150}{x}-\frac{x}{2}.
\]

The volume is
\[
V=x^2h.
\]

Substitute:
\[
V=x^2\left(\frac{150}{x}-\frac{x}{2}\right)
\]

\[
V=150x-\frac{x^3}{2}.
\]

Differentiate:
\[
\frac{dV}{dx}=150-\frac{3x^2}{2}.
\]

At a stationary value:
\[
150-\frac{3x^2}{2}=0.
\]

\[
150=\frac{3x^2}{2}
\]

\[
300=3x^2
\]

\[
x^2=100
\]

\[
x=10
\]

since \(x>0\).

Now check the nature using the sign of \(\frac{dV}{dx}\):

\[
\begin{array}{c|ccc}
x & x<10 & 10 & x>10 \\
\hline
V'(x) & + & 0 & - \\
\text{slope} & / & - & \backslash
\end{array}
\]

Since \(V'(x)\) changes from positive to negative, this gives a maximum.

Now find the maximum volume:
\[
V=150(10)-\frac{10^3}{2}
\]

\[
V=1500-500=1000.
\]

The maximum volume is
\[
1000\text{ cm}^3.
\]

Common mistake:  
Trying to optimise the surface area even though the question asks for maximum volume.

---

### A006 — hm-calc-diff-optimisation-a-006

Stage: Applications  
Subskill: Maximising area with a full perimeter constraint  
Type: multi_step  
Marks: 5  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A rectangle has width \(x\) metres and length \(y\) metres.

The perimeter is fixed at \(60\) metres, so
\[
2x+2y=60.
\]

The area is
\[
A=xy.
\]

Find the value of \(x\) which gives the maximum area, and find this maximum area.

Correct answer:  
\[
x=15,\qquad A=225\text{ m}^2
\]

Answer fields for import:
```yaml
answerFields:
  - id: length_expression
    label: Length in terms of x
    type: algebraic
    correctAnswer: 30-x
    acceptedAnswers:
      - 30-x
      - 30 - x
      - y=30-x
      - y = 30 - x

  - id: area_expression
    label: Area in terms of x
    type: algebraic
    correctAnswer: 30x-x^2
    acceptedAnswers:
      - x(30-x)
      - x(30 - x)
      - x*(30-x)
      - 30x-x^2
      - 30x - x^2
      - A=30x-x^2
      - A = 30x - x^2

  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 30-2x
    acceptedAnswers:
      - 30-2x
      - 30 - 2x
      - -2x+30
      - -2x + 30
      - dA/dx=30-2x
      - dA/dx = 30 - 2x

  - id: optimal_x
    label: Value of x
    type: exact
    correctAnswer: 15
    acceptedAnswers:
      - 15
      - x=15
      - x = 15
      - 15m
      - 15 m

  - id: maximum_area
    label: Maximum area
    type: exact
    correctAnswer: 225
    acceptedAnswers:
      - 225
      - 225m^2
      - 225 m^2
```

Hint:  
Rearrange \(2x+2y=60\) to write \(y\) in terms of \(x\).

Worked solution:  
\[
2x+2y=60
\]

Divide by 2:
\[
x+y=30.
\]

So
\[
y=30-x.
\]

The area is
\[
A=xy.
\]

Substitute:
\[
A=x(30-x)
\]

\[
A=30x-x^2.
\]

Differentiate:
\[
\frac{dA}{dx}=30-2x.
\]

At a stationary value:
\[
30-2x=0
\]

\[
x=15.
\]

Now check the nature using the sign of \(\frac{dA}{dx}\):

\[
\begin{array}{c|ccc}
x & x<15 & 15 & x>15 \\
\hline
A'(x) & + & 0 & - \\
\text{slope} & / & - & \backslash
\end{array}
\]

Since \(A'(x)\) changes from positive to negative, this gives a maximum.

Now find the maximum area:
\[
A=30(15)-15^2
\]

\[
A=450-225=225.
\]

The maximum area is
\[
225\text{ m}^2.
\]

Common mistake:  
Using \(y=60-2x\) instead of first dividing the perimeter equation by 2.

---

### A007 — hm-calc-diff-optimisation-a-007

Stage: Applications  
Subskill: Minimising material for an open-top box with fixed volume  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
An open-top box has a square base of side \(x\) cm and height \(h\) cm.

The volume is fixed at \(256\text{ cm}^3\), so
\[
x^2h=256.
\]

The surface area is
\[
S=x^2+4xh.
\]

Find the value of \(x\) which gives the minimum surface area, and find this minimum surface area.

Correct answer:  
\[
x=8,\qquad S=192\text{ cm}^2
\]

Answer fields for import:
```yaml
answerFields:
  - id: height_expression
    label: Height in terms of x
    type: algebraic
    correctAnswer: 256/x^2
    acceptedAnswers:
      - 256/x^2
      - 256/(x^2)
      - 256x^-2
      - h=256/x^2
      - h = 256/x^2

  - id: surface_area_expression
    label: Surface area in terms of x
    type: algebraic
    correctAnswer: x^2+1024/x
    acceptedAnswers:
      - x^2+1024/x
      - x^2 + 1024/x
      - x^2+1024x^-1
      - x^2 + 1024x^-1
      - S=x^2+1024/x
      - S = x^2 + 1024/x

  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 2x-1024/x^2
    acceptedAnswers:
      - 2x-1024/x^2
      - 2x - 1024/x^2
      - 2x-1024x^-2
      - 2x - 1024x^-2
      - dS/dx=2x-1024/x^2
      - dS/dx = 2x - 1024/x^2

  - id: optimal_x
    label: Value of x
    type: exact
    correctAnswer: 8
    acceptedAnswers:
      - 8
      - x=8
      - x = 8
      - 8cm
      - 8 cm

  - id: minimum_surface_area
    label: Minimum surface area
    type: exact
    correctAnswer: 192
    acceptedAnswers:
      - 192
      - 192cm^2
      - 192 cm^2
```

Hint:  
For an open-top box, the surface area includes the base and four side faces, but no top.

Worked solution:  
\[
x^2h=256
\]

So
\[
h=\frac{256}{x^2}.
\]

The surface area is
\[
S=x^2+4xh.
\]

Substitute:
\[
S=x^2+4x\left(\frac{256}{x^2}\right)
\]

\[
S=x^2+\frac{1024}{x}.
\]

Differentiate:
\[
\frac{dS}{dx}=2x-\frac{1024}{x^2}.
\]

At a stationary value:
\[
2x-\frac{1024}{x^2}=0.
\]

\[
2x=\frac{1024}{x^2}
\]

\[
2x^3=1024
\]

\[
x^3=512
\]

\[
x=8.
\]

Now check the nature using the sign of \(\frac{dS}{dx}\):

\[
\begin{array}{c|ccc}
x & x<8 & 8 & x>8 \\
\hline
S'(x) & - & 0 & + \\
\text{slope} & \backslash & - & /
\end{array}
\]

Since \(S'(x)\) changes from negative to positive, this gives a minimum.

Now find the minimum surface area:
\[
S=8^2+\frac{1024}{8}
\]

\[
S=64+128=192.
\]

The minimum surface area is
\[
192\text{ cm}^2.
\]

Common mistake:  
Using the closed box formula \(2x^2+4xh\). This box has no top, so the surface area is \(x^2+4xh\).

---

### A008 — hm-calc-diff-optimisation-a-008

Stage: Applications  
Subskill: Maximising area with an internal fence constraint  
Type: multi_step  
Marks: 6  
Calculator/non-calculator: Non-calculator  
Command word: Find

Question:  
A rectangular enclosure is divided into two equal pens by a fence parallel to the width.

The total width is \(x\) metres and the total length is \(y\) metres.

The total amount of fencing is \(48\) metres, so
\[
3x+2y=48.
\]

The total area is
\[
A=xy.
\]

Find the value of \(x\) which gives the maximum total area, and find this maximum area.

Correct answer:  
\[
x=8,\qquad A=96\text{ m}^2
\]

Answer fields for import:
```yaml
answerFields:
  - id: length_expression
    label: Length in terms of x
    type: algebraic
    correctAnswer: 24-3x/2
    acceptedAnswers:
      - 24-3x/2
      - 24 - 3x/2
      - (48-3x)/2
      - y=24-3x/2
      - y = 24 - 3x/2

  - id: area_expression
    label: Area in terms of x
    type: algebraic
    correctAnswer: 24x-3x^2/2
    acceptedAnswers:
      - x(24-3x/2)
      - x(24 - 3x/2)
      - 24x-3x^2/2
      - 24x - 3x^2/2
      - 24x-1.5x^2
      - 24x - 1.5x^2
      - A=24x-3x^2/2
      - A = 24x - 3x^2/2

  - id: derivative
    label: Derivative
    type: algebraic
    correctAnswer: 24-3x
    acceptedAnswers:
      - 24-3x
      - 24 - 3x
      - -3x+24
      - -3x + 24
      - dA/dx=24-3x
      - dA/dx = 24 - 3x

  - id: optimal_x
    label: Value of x
    type: exact
    correctAnswer: 8
    acceptedAnswers:
      - 8
      - x=8
      - x = 8
      - 8m
      - 8 m

  - id: maximum_area
    label: Maximum area
    type: exact
    correctAnswer: 96
    acceptedAnswers:
      - 96
      - 96m^2
      - 96 m^2
```

Hint:  
The internal fence means there are three widths and two lengths in the total fencing.

Worked solution:  
\[
3x+2y=48
\]

So
\[
2y=48-3x
\]

\[
y=24-\frac{3x}{2}.
\]

The area is
\[
A=xy.
\]

Substitute:
\[
A=x\left(24-\frac{3x}{2}\right)
\]

\[
A=24x-\frac{3x^2}{2}.
\]

Differentiate:
\[
\frac{dA}{dx}=24-3x.
\]

At a stationary value:
\[
24-3x=0
\]

\[
x=8.
\]

Now check the nature using the sign of \(\frac{dA}{dx}\):

\[
\begin{array}{c|ccc}
x & x<8 & 8 & x>8 \\
\hline
A'(x) & + & 0 & - \\
\text{slope} & / & - & \backslash
\end{array}
\]

Since \(A'(x)\) changes from positive to negative, this gives a maximum.

Now find the maximum area:
\[
A=24(8)-\frac{3(8)^2}{2}
\]

\[
A=192-96=96.
\]

The maximum area is
\[
96\text{ m}^2.
\]

Common mistake:  
Forgetting the internal fence and using \(2x+2y=48\).

---

## Past Paper-style Questions

Past Paper-style Questions: 0

PPQ section intentionally omitted in this v1 content-bank draft.

Reason:
Higher Maths optimisation PPQs often rely on diagrams or visually described contexts. Without diagram support, forcing a PPQ section would make the bank too text-heavy, artificial, or hard to auto-mark fairly.

The Applications section already covers the key optimisation method in an auto-markable format.

Future PPQs should be added only after STEM Forge supports simple diagrams or visual prompt cards.

---

## Foundations — all questions together for skim

**F001**  
A rectangle has width \(x\) metres and length \(y\) metres.

Three sides of the rectangle have total length \(30\) metres, so
\[
2x+y=30.
\]

Express \(y\) in terms of \(x\).

---

**F002**  
A rectangle has width \(x\) metres and length \(y\) metres.

Its area is
\[
A=xy.
\]

Given that
\[
y=30-2x,
\]

write \(A\) in terms of \(x\).

---

**F003**  
A box has a square base of side \(x\) cm and height \(h\) cm.

Its volume is
\[
V=x^2h.
\]

Given that the volume is \(500\text{ cm}^3\), express \(h\) in terms of \(x\).

---

**F004**  
A closed box has a square base of side \(x\) cm and height \(h\) cm.

Its surface area is
\[
S=2x^2+4xh.
\]

Given that
\[
h=\frac{500}{x^2},
\]

write \(S\) in terms of \(x\).

---

**F005**  
The area \(A\) of a rectangle is given by
\[
A=30x-2x^2.
\]

Find the value of \(x\) which gives the stationary value of \(A\).

---

**F006**  
For a function \(A(x)\), the derivative changes sign as shown.

\[
\begin{array}{c|ccc}
x & x<5 & 5 & x>5 \\
\hline
A'(x) & + & 0 & - \\
\text{slope} & / & - & \backslash
\end{array}
\]

State whether the stationary value at \(x=5\) is a maximum or a minimum.

---

## Applications — all questions together for skim

**A001**  
A rectangular pen is built against a wall.

The pen has width \(x\) metres and length \(y\) metres. Only three sides need fencing, and the total length of fencing is \(36\) metres.

\[
2x+y=36
\]

The area of the pen is \(A\text{ m}^2\).

Find the maximum possible area of the pen.

---

**A002**  
A closed box has a square base of side \(x\) cm and height \(h\) cm.

The volume is fixed at \(512\text{ cm}^3\), so
\[
x^2h=512.
\]

The surface area is
\[
S=2x^2+4xh.
\]

Find the value of \(x\) which gives the minimum surface area, and find this minimum surface area.

---

**A003**  
The volume \(V\text{ cm}^3\) of an open box is given by
\[
V=4x^3-36x^2+96x,
\]
where \(x\) is the size of the square cut from each corner of a rectangular sheet of card.

For this context,
\[
0<x<4.
\]

Find the value of \(x\) which gives the maximum volume, and find this maximum volume.

---

**A004**  
A rectangle has width \(x\) metres and length \(y\) metres.

Its area is fixed at \(100\text{ m}^2\), so
\[
xy=100.
\]

The perimeter is
\[
P=2x+2y.
\]

Find the value of \(x\) which gives the minimum perimeter, and find this minimum perimeter.

---

**A005**  
A closed box has a square base of side \(x\) cm and height \(h\) cm.

The surface area is fixed at \(600\text{ cm}^2\), so
\[
2x^2+4xh=600.
\]

The volume is
\[
V=x^2h.
\]

Find the value of \(x\) which gives the maximum volume, and find this maximum volume.

---

**A006**  
A rectangle has width \(x\) metres and length \(y\) metres.

The perimeter is fixed at \(60\) metres, so
\[
2x+2y=60.
\]

The area is
\[
A=xy.
\]

Find the value of \(x\) which gives the maximum area, and find this maximum area.

---

**A007**  
An open-top box has a square base of side \(x\) cm and height \(h\) cm.

The volume is fixed at \(256\text{ cm}^3\), so
\[
x^2h=256.
\]

The surface area is
\[
S=x^2+4xh.
\]

Find the value of \(x\) which gives the minimum surface area, and find this minimum surface area.

---

**A008**  
A rectangular enclosure is divided into two equal pens by a fence parallel to the width.

The total width is \(x\) metres and the total length is \(y\) metres.

The total amount of fencing is \(48\) metres, so
\[
3x+2y=48.
\]

The total area is
\[
A=xy.
\]

Find the value of \(x\) which gives the maximum total area, and find this maximum area.

---

## Import readiness checklist

- [x] Content-bank draft only; not active app data.
- [x] No Past Paper-style Questions included in v1.
- [x] PPQ omission is intentional and explained.
- [x] All questions are intended for auto-marking.
- [x] Structured multi-field UI needed for constraint expressions, objective functions, derivatives, optimal values, and final contextual values.
- [x] Worked solutions include sign/gradient-table checks for maximum/minimum.
- [x] Students do not need to type full nature tables.
- [x] No second derivative method used.
- [x] No graph sketching required.
- [x] No diagram marking required.
- [x] All arithmetic independently checked.
- [x] Accepted answers reviewed for obvious variants.
- [x] Field types need mapping before app import.
- [x] Independent original material; not affiliated with or endorsed by SQA.

import type { Question } from "@/data/types";

export const tangentsAndNormalsStageQuestionIds = {
  "foundations": [],
  "applications": [],
  "pastPaperStyle": []
} as const;

export const tangentsAndNormalsPracticeQuestionIds = [
  "hm-calc-tangent-q-001",
  "hm-calc-tangent-q-002",
  "hm-calc-tangent-q-003",
  "hm-calc-tangent-q-004",
  "hm-calc-tangent-q-005",
  "hm-calc-tangent-q-006",
  "hm-calc-tangent-q-007",
  "hm-calc-tangent-q-008",
  "hm-calc-tangent-q-009",
  "hm-calc-tangent-q-010",
  "hm-calc-tangent-q-011",
  "hm-calc-tangent-q-012",
  "hm-calc-tangent-q-013",
  "hm-calc-tangent-q-014",
  "hm-calc-tangent-q-015",
  "hm-calc-tangent-q-016",
  "hm-calc-tangent-q-017",
  "hm-calc-tangent-q-018",
  "hm-calc-tangent-q-019",
  "hm-calc-tangent-q-020",
  "hm-calc-tangent-q-021",
  "hm-calc-tangent-q-022",
  "hm-calc-tangent-q-023",
  "hm-calc-tangent-q-024",
  "hm-calc-tangent-q-025",
  "hm-calc-tangent-q-026",
  "hm-calc-tangent-q-027",
  "hm-calc-tangent-q-028",
  "hm-calc-tangent-q-029",
  "hm-calc-tangent-q-030"
] as const;

export const higherMathsTangentsAndNormalsQuestions: Question[] = [
  {
    "id": "hm-calc-tangent-q-001",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Direct polynomial tangent",
    "title": "Direct polynomial tangent",
    "questionText": "Find the equation of the tangent to $y=3x^2-2x+1$ at $x=-1$.",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-8x-2",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-8x-2"
          },
          {
            "input": "y-6=-8(x+1)"
          },
          {
            "input": "8x+y+2=0"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=-8x-2",
    "acceptedAnswers": [
      "y=-8x-2",
      "y-6=-8(x+1)",
      "8x+y+2=0"
    ],
    "workedSolution": "$\\frac{dy}{dx}=6x-2$, so $m=-8$ and the point is $(-1,6)$. Hence $y-6=-8(x+1)$, giving $y=-8x-2$.",
    "finalAnswer": "y=-8x-2",
    "hint": "Evaluate the derivative and the curve separately at $x=-1$.",
    "commonMistake": "Substituting $x=-1$ into the curve but not into the derivative.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 1
  },
  {
    "id": "hm-calc-tangent-q-002",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Direct polynomial tangent",
    "title": "Direct polynomial tangent",
    "questionText": "Determine the tangent to $y=2x^3-x+5$ where $x=0$.",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-x+5",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-x+5"
          },
          {
            "input": "x+y-5=0"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=-x+5",
    "acceptedAnswers": [
      "y=-x+5",
      "x+y-5=0"
    ],
    "workedSolution": "$\\frac{dy}{dx}=6x^2-1$, so $m=-1$ and the point is $(0,5)$. Thus $y=-x+5$.",
    "finalAnswer": "y=-x+5",
    "hint": "Keep the constant term in the curve, but not in its derivative.",
    "commonMistake": "Dropping the negative sign in the gradient.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 2
  },
  {
    "id": "hm-calc-tangent-q-003",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Direct polynomial tangent",
    "title": "Direct polynomial tangent",
    "questionText": "Find the tangent to $y=x^4+x^2-3x+2$ at $x=1$.",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=3x-2",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=3x-2"
          },
          {
            "input": "y-1=3(x-1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=3x-2",
    "acceptedAnswers": [
      "y=3x-2",
      "y-1=3(x-1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=4x^3+2x-3$, so $m=3$ and the point is $(1,1)$. Therefore $y-1=3(x-1)$, giving $y=3x-2$.",
    "finalAnswer": "y=3x-2",
    "hint": "Differentiate every non-constant term before evaluating at $x=1$.",
    "commonMistake": "Setting the derivative equal to zero as if finding a stationary point.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 3
  },
  {
    "id": "hm-calc-tangent-q-004",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Negative leading coefficient",
    "title": "Negative leading coefficient",
    "questionText": "Obtain the tangent to $y=-x^3+3x^2+2$ at $x=1$.",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=3x+1",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=3x+1"
          },
          {
            "input": "y-4=3(x-1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=3x+1",
    "acceptedAnswers": [
      "y=3x+1",
      "y-4=3(x-1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=-3x^2+6x$, so $m=3$ and the point is $(1,4)$. Hence $y-4=3(x-1)$.",
    "finalAnswer": "y=3x+1",
    "hint": "Retain the negative sign when differentiating the cubic term.",
    "commonMistake": "Differentiating $-x^3$ as $3x^2$.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 4
  },
  {
    "id": "hm-calc-tangent-q-005",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Fractional intercept",
    "title": "Fractional intercept",
    "questionText": "Find the tangent to $y=\\frac12x^4-3x$ at $x=-1$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-5x-3/2",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-5x-3/2"
          },
          {
            "input": "2y=-10x-3"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=-5x-3/2",
    "acceptedAnswers": [
      "y=-5x-3/2",
      "2y=-10x-3"
    ],
    "workedSolution": "$\\frac{dy}{dx}=2x^3-3$, so $m=-5$. Using $(-1,\\frac72)$ gives $y-\\frac72=-5(x+1)$, hence $y=-5x-\\frac32$.",
    "finalAnswer": "y=-5x-3/2",
    "hint": "The contact point is $(-1,\\frac72)$.",
    "commonMistake": "Making a sign error when expanding $-5(x+1)$.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 5
  },
  {
    "id": "hm-calc-tangent-q-006",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Supplied contact point",
    "title": "Supplied contact point",
    "questionText": "The point $(2,18)$ lies on $y=2x^3+x^2-3x+4$. Determine the tangent there.",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=25x-32",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=25x-32"
          },
          {
            "input": "y-18=25(x-2)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=25x-32",
    "acceptedAnswers": [
      "y=25x-32",
      "y-18=25(x-2)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=6x^2+2x-3$, so $m=25$. Then $y-18=25(x-2)$ and $y=25x-32$.",
    "finalAnswer": "y=25x-32",
    "hint": "The point is already supplied; calculate only the gradient.",
    "commonMistake": "Recalculating the supplied point incorrectly.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 6
  },
  {
    "id": "hm-calc-tangent-q-007",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Negative contact value",
    "title": "Negative contact value",
    "questionText": "Find the tangent to $y=x^4-4x^2+1$ at $x=-1$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=4x+2",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=4x+2"
          },
          {
            "input": "y+2=4(x+1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=4x+2",
    "acceptedAnswers": [
      "y=4x+2",
      "y+2=4(x+1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=4x^3-8x$, so $m=4$ and the point is $(-1,-2)$. Thus $y+2=4(x+1)$.",
    "finalAnswer": "y=4x+2",
    "hint": "Substitute $-1$ carefully into both expressions.",
    "commonMistake": "Treating $(-1)^3$ as positive.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 7
  },
  {
    "id": "hm-calc-tangent-q-008",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Descending quadratic",
    "title": "Descending quadratic",
    "questionText": "Find the tangent to $y=4-2x-x^2$ where $x=-2$.",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=2x+8",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=2x+8"
          },
          {
            "input": "y-4=2(x+2)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=2x+8",
    "acceptedAnswers": [
      "y=2x+8",
      "y-4=2(x+2)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=-2-2x$, so $m=2$ and the point is $(-2,4)$. Hence $y-4=2(x+2)$.",
    "finalAnswer": "y=2x+8",
    "hint": "Keep both negative signs in the derivative.",
    "commonMistake": "Using the contact value $-2$ as the gradient.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 8
  },
  {
    "id": "hm-calc-tangent-q-009",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Zero curve value",
    "title": "Zero curve value",
    "questionText": "Determine the tangent to $y=3x^3+2x^2-5$ at $x=1$.",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=13x-13",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=13x-13"
          },
          {
            "input": "y=13(x-1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=13x-13",
    "acceptedAnswers": [
      "y=13x-13",
      "y=13(x-1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=9x^2+4x$, so $m=13$ and the point is $(1,0)$. Therefore $y=13(x-1)$.",
    "finalAnswer": "y=13x-13",
    "hint": "The contact point lies on the $x$-axis.",
    "commonMistake": "Writing $y=13x$ and ignoring the contact point.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 9
  },
  {
    "id": "hm-calc-tangent-q-010",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Quartic with negative gradient",
    "title": "Quartic with negative gradient",
    "questionText": "Find the tangent to $y=-2x^4+x^2+6$ at $x=1$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-6x+11",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-6x+11"
          },
          {
            "input": "y-5=-6(x-1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=-6x+11",
    "acceptedAnswers": [
      "y=-6x+11",
      "y-5=-6(x-1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=-8x^3+2x$, so $m=-6$ and the point is $(1,5)$. Thus $y-5=-6(x-1)$.",
    "finalAnswer": "y=-6x+11",
    "hint": "Find the gradient and contact value independently.",
    "commonMistake": "Losing the negative sign while rearranging.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 10
  },
  {
    "id": "hm-calc-tangent-q-011",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Negative contact value",
    "title": "Negative contact value",
    "questionText": "Obtain the tangent to $y=x^3+6x^2+3$ where $x=-2$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-12x-5",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-12x-5"
          },
          {
            "input": "y-19=-12(x+2)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=-12x-5",
    "acceptedAnswers": [
      "y=-12x-5",
      "y-19=-12(x+2)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=3x^2+12x$, so $m=-12$ and the point is $(-2,19)$. Hence $y-19=-12(x+2)$.",
    "finalAnswer": "y=-12x-5",
    "hint": "In point-gradient form, $x-(-2)=x+2$.",
    "commonMistake": "Writing $x-2$ instead of $x+2$.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 11
  },
  {
    "id": "hm-calc-tangent-q-012",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Multi-term quartic",
    "title": "Multi-term quartic",
    "questionText": "Find the tangent to $y=2x^4-5x^2+x$ at $x=-1$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=3x-1",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=3x-1"
          },
          {
            "input": "y+4=3(x+1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=3x-1",
    "acceptedAnswers": [
      "y=3x-1",
      "y+4=3(x+1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=8x^3-10x+1$, so $m=3$ and the point is $(-1,-4)$. Therefore $y+4=3(x+1)$.",
    "finalAnswer": "y=3x-1",
    "hint": "Differentiate every term before substituting.",
    "commonMistake": "Omitting the derivative of the linear term.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 12
  },
  {
    "id": "hm-calc-tangent-q-013",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Simplify before differentiating",
    "title": "Simplify before differentiating",
    "questionText": "For $x\\ne0$, find the tangent to $y=\\frac{x^3+2x^2-3x}{x}$ at $x=2$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=6x-7",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=6x-7"
          },
          {
            "input": "y-5=6(x-2)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=6x-7",
    "acceptedAnswers": [
      "y=6x-7",
      "y-5=6(x-2)"
    ],
    "workedSolution": "$y=x^2+2x-3$, so $\\frac{dy}{dx}=2x+2$. At $x=2$, $m=6$ and the point is $(2,5)$, giving $y=6x-7$.",
    "finalAnswer": "y=6x-7",
    "hint": "Simplify the curve before differentiating.",
    "commonMistake": "Applying the power rule to the unsimplified quotient term by term.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 13
  },
  {
    "id": "hm-calc-tangent-q-014",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Fractional contact coordinate",
    "title": "Fractional contact coordinate",
    "questionText": "Determine the tangent to $y=2x^3-x^2+1$ at $x=\\frac12$.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "4y=2x+3",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "4y=2x+3"
          },
          {
            "input": "y=x/2+3/4"
          },
          {
            "input": "y-1=1/2(x-1/2)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "4y=2x+3",
    "acceptedAnswers": [
      "4y=2x+3",
      "y=x/2+3/4",
      "y-1=1/2(x-1/2)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=6x^2-2x$. At $x=\\frac12$, the gradient is $m=\\frac12$ and the curve value is $1$. Hence $y-1=\\frac12(x-\\frac12)$, or $4y=2x+3$.",
    "finalAnswer": "4y=2x+3",
    "hint": "Keep the contact coordinate and gradient as exact fractions.",
    "commonMistake": "Treating $\\left(\\frac12\\right)^2$ as $\\frac12$ when evaluating the derivative.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 14
  },
  {
    "id": "hm-calc-tangent-q-015",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Direct polynomial with negative gradient",
    "title": "Direct polynomial with negative gradient",
    "questionText": "Find the tangent to $y=3x^4-2x^3+x-5$ at $x=-1$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-17x-18",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-17x-18"
          },
          {
            "input": "y+1=-17(x+1)"
          },
          {
            "input": "17x+y+18=0"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=-17x-18",
    "acceptedAnswers": [
      "y=-17x-18",
      "y+1=-17(x+1)",
      "17x+y+18=0"
    ],
    "workedSolution": "$\\frac{dy}{dx}=12x^3-6x^2+1$. At $x=-1$, $m=-17$ and the point is $(-1,-1)$. Thus $y+1=-17(x+1)$, giving $y=-17x-18$.",
    "finalAnswer": "y=-17x-18",
    "hint": "Substitute $x=-1$ separately into the curve and its derivative.",
    "commonMistake": "Treating the even power $(-1)^2$ as negative in the derivative.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 15
  },
  {
    "id": "hm-calc-tangent-q-016",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Fractional coefficient and intercept",
    "title": "Fractional coefficient and intercept",
    "questionText": "Find the tangent to $y=\\frac13x^3-2x^2+5x-1$ at $x=2$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "3y=3x+5",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "3y=3x+5"
          },
          {
            "input": "y=x+5/3"
          },
          {
            "input": "y-11/3=x-2"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "3y=3x+5",
    "acceptedAnswers": [
      "3y=3x+5",
      "y=x+5/3",
      "y-11/3=x-2"
    ],
    "workedSolution": "$\\frac{dy}{dx}=x^2-4x+5$, so $m=1$ at $x=2$. The curve value is $\\frac{11}{3}$, hence $y-\\frac{11}{3}=x-2$, or $3y=3x+5$.",
    "finalAnswer": "3y=3x+5",
    "hint": "Keep the curve value exact before forming the line equation.",
    "commonMistake": "Differentiating $\\frac13x^3$ as $\\frac13x^2$.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 16
  },
  {
    "id": "hm-calc-tangent-q-017",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Fractional gradient",
    "title": "Fractional gradient",
    "questionText": "Obtain the tangent to $y=\\frac16x^3+x^2-2x$ at $x=-1$.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "21x+6y+4=0",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "21x+6y+4=0"
          },
          {
            "input": "y=-7x/2-2/3"
          },
          {
            "input": "y-17/6=-7/2(x+1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "21x+6y+4=0",
    "acceptedAnswers": [
      "21x+6y+4=0",
      "y=-7x/2-2/3",
      "y-17/6=-7/2(x+1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=\\frac12x^2+2x-2$. At $x=-1$, $m=-\\frac72$ and the curve value is $\\frac{17}{6}$. Thus $y-\\frac{17}{6}=-\\frac72(x+1)$, which rearranges to $21x+6y+4=0$.",
    "finalAnswer": "21x+6y+4=0",
    "hint": "Keep both the gradient and contact value as exact fractions.",
    "commonMistake": "Using the negative reciprocal of $-\\frac72$ instead of the tangent gradient itself.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 17
  },
  {
    "id": "hm-calc-tangent-q-018",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Multi-term odd-power polynomial",
    "title": "Multi-term odd-power polynomial",
    "questionText": "Determine the tangent to $y=5-3x+2x^3-x^5$ at $x=-1$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-2x+5",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-2x+5"
          },
          {
            "input": "y-7=-2(x+1)"
          },
          {
            "input": "2x+y-5=0"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=-2x+5",
    "acceptedAnswers": [
      "y=-2x+5",
      "y-7=-2(x+1)",
      "2x+y-5=0"
    ],
    "workedSolution": "$\\frac{dy}{dx}=-3+6x^2-5x^4$, so $m=-2$ at $x=-1$. The point is $(-1,7)$, giving $y-7=-2(x+1)$ and $y=-2x+5$.",
    "finalAnswer": "y=-2x+5",
    "hint": "Evaluate each odd power carefully at $x=-1$.",
    "commonMistake": "Assigning a negative value to the even powers in the derivative.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 18
  },
  {
    "id": "hm-calc-tangent-q-019",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Linear-inside composite",
    "title": "Linear-inside composite",
    "questionText": "Find the tangent to $y=(x-2)^3+1$ at $x=3$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=3x-7",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=3x-7"
          },
          {
            "input": "y-2=3(x-3)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": [
        "chain-rule"
      ]
    },
    "correctAnswer": "y=3x-7",
    "acceptedAnswers": [
      "y=3x-7",
      "y-2=3(x-3)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=3(x-2)^2$, so $m=3$ and the point is $(3,2)$. Hence $y=3x-7$.",
    "finalAnswer": "y=3x-7",
    "hint": "Use the original curve to find the point.",
    "commonMistake": "Forgetting the final $+1$ in the curve value.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 19
  },
  {
    "id": "hm-calc-tangent-q-020",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Scaled linear-inside composite",
    "title": "Scaled linear-inside composite",
    "questionText": "Find the tangent to $y=(3x+2)^2-5x$ at $x=0$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=7x+4",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=7x+4"
          },
          {
            "input": "y-4=7x"
          },
          {
            "input": "7x-y+4=0"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": [
        "chain-rule"
      ]
    },
    "correctAnswer": "y=7x+4",
    "acceptedAnswers": [
      "y=7x+4",
      "y-4=7x",
      "7x-y+4=0"
    ],
    "workedSolution": "$\\frac{dy}{dx}=6(3x+2)-5$. At $x=0$, $m=7$ and the point is $(0,4)$. Thus $y-4=7x$, giving $y=7x+4$.",
    "finalAnswer": "y=7x+4",
    "hint": "Differentiate both the composite term and the separate linear term.",
    "commonMistake": "Differentiating the bracket correctly but omitting the derivative of $-5x$.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 20
  },
  {
    "id": "hm-calc-tangent-q-021",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Decreasing composite",
    "title": "Decreasing composite",
    "questionText": "Determine the tangent to $y=(3-x)^4$ at $x=2$.",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-4x+9",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-4x+9"
          },
          {
            "input": "y-1=-4(x-2)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": [
        "chain-rule"
      ]
    },
    "correctAnswer": "y=-4x+9",
    "acceptedAnswers": [
      "y=-4x+9",
      "y-1=-4(x-2)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=-4(3-x)^3$, so $m=-4$ and the point is $(2,1)$. Hence $y=-4x+9$.",
    "finalAnswer": "y=-4x+9",
    "hint": "The derivative of $3-x$ is $-1$.",
    "commonMistake": "Missing the negative inside derivative.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 21
  },
  {
    "id": "hm-calc-tangent-q-022",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "High-degree direct polynomial",
    "title": "High-degree direct polynomial",
    "questionText": "Find the tangent to $y=2x^5-5x^3+4x^2-7$ at $x=-1$.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-13x-13",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-13x-13"
          },
          {
            "input": "y=-13(x+1)"
          },
          {
            "input": "13x+y+13=0"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=-13x-13",
    "acceptedAnswers": [
      "y=-13x-13",
      "y=-13(x+1)",
      "13x+y+13=0"
    ],
    "workedSolution": "$\\frac{dy}{dx}=10x^4-15x^2+8x$. At $x=-1$, $m=-13$ and the curve value is $0$. Therefore $y=-13(x+1)$, or $y=-13x-13$.",
    "finalAnswer": "y=-13x-13",
    "hint": "Evaluate the curve and its derivative independently at the negative coordinate.",
    "commonMistake": "Making the odd-power terms positive when substituting $x=-1$ into the curve.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 22
  },
  {
    "id": "hm-calc-tangent-q-023",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Cubic composite",
    "title": "Cubic composite",
    "questionText": "Obtain the tangent to $y=(2x^2-x)^3$ at $x=1$.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=9x-8",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=9x-8"
          },
          {
            "input": "y-1=9(x-1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": [
        "chain-rule"
      ]
    },
    "correctAnswer": "y=9x-8",
    "acceptedAnswers": [
      "y=9x-8",
      "y-1=9(x-1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=3(2x^2-x)^2(4x-1)$, so $m=9$ and the point is $(1,1)$. Thus $y=9x-8$.",
    "finalAnswer": "y=9x-8",
    "hint": "The inside derivative is $4x-1$.",
    "commonMistake": "Using the inside value $1$ as the gradient.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 23
  },
  {
    "id": "hm-calc-tangent-q-024",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Quadratic-inside composite",
    "title": "Quadratic-inside composite",
    "questionText": "Find the tangent to $y=(x^2-3x+4)^2$ at $x=1$.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-4x+8",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-4x+8"
          },
          {
            "input": "y-4=-4(x-1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": [
        "chain-rule"
      ]
    },
    "correctAnswer": "y=-4x+8",
    "acceptedAnswers": [
      "y=-4x+8",
      "y-4=-4(x-1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=2(x^2-3x+4)(2x-3)$, so $m=-4$ and the point is $(1,4)$. Hence $y=-4x+8$.",
    "finalAnswer": "y=-4x+8",
    "hint": "Evaluate both factors of the derivative.",
    "commonMistake": "Substituting into only one factor of the derivative.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 24
  },
  {
    "id": "hm-calc-tangent-q-025",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Supplied point with fractional gradient",
    "title": "Supplied point with fractional gradient",
    "questionText": "The point $\\left(3,\\frac{23}{2}\\right)$ lies on $y=\\frac12x^3-2x+4$. Determine the tangent there.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "2y=23x-46",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "2y=23x-46"
          },
          {
            "input": "y=23x/2-23"
          },
          {
            "input": "y-23/2=23/2(x-3)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "2y=23x-46",
    "acceptedAnswers": [
      "2y=23x-46",
      "y=23x/2-23",
      "y-23/2=23/2(x-3)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=\\frac32x^2-2$, so at $x=3$ the gradient is $\\frac{23}{2}$. Using the supplied point gives $y-\\frac{23}{2}=\\frac{23}{2}(x-3)$, or $2y=23x-46$.",
    "finalAnswer": "2y=23x-46",
    "hint": "The contact point is supplied, so only the gradient needs to be calculated from the curve.",
    "commonMistake": "Using the supplied $y$-coordinate as the gradient because both values happen to be $\\frac{23}{2}$.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 25
  },
  {
    "id": "hm-calc-tangent-q-026",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Negative-power composite",
    "title": "Negative-power composite",
    "questionText": "Find the tangent to $y=(x+1)^{-2}$ at $x=1$.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "x+4y=2",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "x+4y=2"
          },
          {
            "input": "y=-x/4+1/2"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": [
        "chain-rule"
      ]
    },
    "correctAnswer": "x+4y=2",
    "acceptedAnswers": [
      "x+4y=2",
      "y=-x/4+1/2"
    ],
    "workedSolution": "$\\frac{dy}{dx}=-2(x+1)^{-3}$, so $m=-\\frac14$ and the point is $(1,\\frac14)$. Hence $x+4y=2$.",
    "finalAnswer": "x+4y=2",
    "hint": "Keep the gradient and point values exact.",
    "commonMistake": "Reducing the power incorrectly.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 26
  },
  {
    "id": "hm-calc-tangent-q-027",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Reciprocal quadratic composite",
    "title": "Reciprocal quadratic composite",
    "questionText": "Find the tangent to $y=(x^2+2x+2)^{-1}$ at $x=0$.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "x+2y=1",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "x+2y=1"
          },
          {
            "input": "y=-x/2+1/2"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": [
        "chain-rule"
      ]
    },
    "correctAnswer": "x+2y=1",
    "acceptedAnswers": [
      "x+2y=1",
      "y=-x/2+1/2"
    ],
    "workedSolution": "$\\frac{dy}{dx}=-(2x+2)(x^2+2x+2)^{-2}$, so $m=-\\frac12$ and the point is $(0,\\frac12)$. Thus $x+2y=1$.",
    "finalAnswer": "x+2y=1",
    "hint": "Differentiate the reciprocal form with the chain rule.",
    "commonMistake": "Forgetting the squared denominator after differentiating.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 27
  },
  {
    "id": "hm-calc-tangent-q-028",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Calculator polynomial tangent",
    "title": "Calculator polynomial tangent",
    "questionText": "Determine the tangent to $y=1.6x^3-2.4x^2+0.7x+1.2$ at $x=1.5$.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=4.3x-4.2",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=4.3x-4.2"
          },
          {
            "input": "y-2.25=4.3(x-1.5)"
          },
          {
            "input": "10y=43x-42"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": []
    },
    "correctAnswer": "y=4.3x-4.2",
    "acceptedAnswers": [
      "y=4.3x-4.2",
      "y-2.25=4.3(x-1.5)",
      "10y=43x-42"
    ],
    "workedSolution": "$\\frac{dy}{dx}=4.8x^2-4.8x+0.7$. At $x=1.5$, the gradient is $4.3$ and the curve value is $2.25$. Hence $y-2.25=4.3(x-1.5)$, so $y=4.3x-4.2$.",
    "finalAnswer": "y=4.3x-4.2",
    "hint": "Use the calculator to evaluate the curve and derivative values accurately before forming the line.",
    "commonMistake": "Rounding the contact value or gradient before completing the line equation.",
    "calculatorAllowed": true,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 28
  },
  {
    "id": "hm-calc-tangent-q-029",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Composite at a negative x-value",
    "title": "Composite at a negative x-value",
    "questionText": "Obtain the tangent to $y=(x^2+2)^3$ at $x=-1$.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=-54x-27",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=-54x-27"
          },
          {
            "input": "y-27=-54(x+1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": [
        "chain-rule"
      ]
    },
    "correctAnswer": "y=-54x-27",
    "acceptedAnswers": [
      "y=-54x-27",
      "y-27=-54(x+1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=6x(x^2+2)^2$, so $m=-54$ and the point is $(-1,27)$. Hence $y=-54x-27$.",
    "finalAnswer": "y=-54x-27",
    "hint": "Take care with the factor $2x$ at $x=-1$.",
    "commonMistake": "Losing the negative sign from $2x$.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 29
  },
  {
    "id": "hm-calc-tangent-q-030",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Tangents",
    "skillPathId": "tangents-and-normals",
    "stageId": "tangents-and-normals-practice-compatibility",
    "stage": "Practice",
    "skill": "Negative inside value",
    "title": "Negative inside value",
    "questionText": "Find the tangent to $y=(1-2x^2)^4$ at $x=1$.",
    "marks": 5,
    "answerType": "algebraic",
    "marking": {
      "strategy": "linear_equation_equivalence",
      "strategyVersion": 1,
      "target": "y=16x-15",
      "variables": [
        "x",
        "y"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "y=16x-15"
          },
          {
            "input": "y-1=16(x-1)"
          }
        ],
        "incorrect": [
          {
            "input": "y=0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "not-an-equation",
            "reason": "malformed_linear_equation"
          }
        ],
        "unmarkable": [
          {
            "input": "y=x^2",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "curriculum": {
      "primarySkillId": "tangents-and-normals",
      "requiredSkillIds": [
        "chain-rule"
      ]
    },
    "correctAnswer": "y=16x-15",
    "acceptedAnswers": [
      "y=16x-15",
      "y-1=16(x-1)"
    ],
    "workedSolution": "$\\frac{dy}{dx}=-16x(1-2x^2)^3$, so $m=16$ and the point is $(1,1)$. Thus $y=16x-15$.",
    "finalAnswer": "y=16x-15",
    "hint": "Preserve the sign of the cubed inside value.",
    "commonMistake": "Assuming the gradient is negative from the derivative's first factor alone.",
    "calculatorAllowed": false,
    "source": "Original Orthic QS-style content",
    "status": "ready",
    "displayOrder": 30
  }
];

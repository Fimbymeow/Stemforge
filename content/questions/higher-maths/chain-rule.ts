import type { Question } from "@/data/types";

export const chainRuleStageQuestionIds = {
  "foundations": [
    "hm-calc-diff-chain-f-001",
    "hm-calc-diff-chain-f-002",
    "hm-calc-diff-chain-f-003",
    "hm-calc-diff-chain-f-004",
    "hm-calc-diff-chain-f-005",
    "hm-calc-diff-chain-f-006",
    "hm-calc-diff-chain-f-007",
    "hm-calc-diff-chain-f-008",
    "hm-calc-diff-chain-f-009",
    "hm-calc-diff-chain-f-010"
  ],
  "applications": [
    "hm-calc-diff-chain-a-001",
    "hm-calc-diff-chain-a-002",
    "hm-calc-diff-chain-a-003",
    "hm-calc-diff-chain-a-004",
    "hm-calc-diff-chain-a-005",
    "hm-calc-diff-chain-a-006",
    "hm-calc-diff-chain-a-007",
    "hm-calc-diff-chain-a-008",
    "hm-calc-diff-chain-a-009"
  ],
  "pastPaperStyle": [
    "hm-calc-diff-chain-ppq-003",
    "hm-calc-diff-chain-ppq-004",
    "hm-calc-diff-chain-ppq-007",
    "hm-calc-diff-chain-ppq-008",
    "hm-calc-diff-chain-ppq-010",
    "hm-calc-diff-chain-ppq-011",
    "hm-calc-diff-chain-ppq-012",
    "hm-calc-diff-chain-ppq-014",
    "hm-calc-diff-chain-ppq-015",
    "hm-calc-diff-chain-ppq-016",
    "hm-calc-diff-chain-ppq-017",
    "hm-calc-diff-chain-ppq-018",
    "hm-calc-diff-chain-ppq-019",
    "hm-calc-diff-chain-ppq-020",
    "hm-calc-diff-chain-ppq-021"
  ]
} as const;

export const higherMathsChainRuleQuestions: Question[] = [
  {
    "id": "hm-calc-diff-chain-f-001",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-foundations",
    "stage": "Foundations",
    "skill": "Identifying the inside function",
    "title": "Identifying the inside function",
    "questionText": "For the function \\(y=(4x+3)^6\\), which expression is the inside function?\n\nA. \\(4x+3\\)  \nB. \\(x^6\\)  \nC. \\(4x\\)  \nD. \\((4x+3)^6\\)",
    "marks": 1,
    "answerType": "multiple_choice",
    "marking": {
      "strategy": "multiple_choice",
      "strategyVersion": 1,
      "correctOptionId": "A",
      "fixtures": {
        "correct": [
          {
            "input": "A"
          }
        ],
        "incorrect": [
          {
            "input": "0"
          }
        ],
        "malformed": [
          {
            "input": "++"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)"
          }
        ]
      }
    },
    "correctAnswer": "A",
    "acceptedAnswers": [
      "A"
    ],
    "options": [
      {
        "label": "\\(4x+3\\)",
        "value": "A"
      },
      {
        "label": "\\(x^6\\)",
        "value": "B"
      },
      {
        "label": "\\(4x\\)",
        "value": "C"
      },
      {
        "label": "\\((4x+3)^6\\)",
        "value": "D"
      }
    ],
    "workedSolution": "The function is\n\\[\ny=(4x+3)^6.\n\\]\nThe outside operation is raising to the power 6. The expression inside the brackets is\n\\[\n4x+3.\n\\]\nSo the inside function is \\(4x+3\\).",
    "finalAnswer": "A",
    "hint": "Look at the expression inside the brackets.",
    "commonMistake": "Choosing the whole expression \\((4x+3)^6\\) instead of just the expression inside the brackets.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 1
  },
  {
    "id": "hm-calc-diff-chain-f-002",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-foundations",
    "stage": "Foundations",
    "skill": "Identifying the inside function in a quadratic composite",
    "title": "Identifying the inside function in a quadratic composite",
    "questionText": "For the function \\(y=(2x^2-5)^4\\), which expression should be treated as the inside function when using the chain rule?\n\nA. \\(2x^2\\)  \nB. \\(2x^2-5\\)  \nC. \\(x^4\\)  \nD. \\(4(2x^2-5)^3\\)",
    "marks": 1,
    "answerType": "multiple_choice",
    "marking": {
      "strategy": "multiple_choice",
      "strategyVersion": 1,
      "correctOptionId": "B",
      "fixtures": {
        "correct": [
          {
            "input": "B"
          }
        ],
        "incorrect": [
          {
            "input": "0"
          }
        ],
        "malformed": [
          {
            "input": "++"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)"
          }
        ]
      }
    },
    "correctAnswer": "B",
    "acceptedAnswers": [
      "B"
    ],
    "options": [
      {
        "label": "\\(2x^2\\)",
        "value": "A"
      },
      {
        "label": "\\(2x^2-5\\)",
        "value": "B"
      },
      {
        "label": "\\(x^4\\)",
        "value": "C"
      },
      {
        "label": "\\(4(2x^2-5)^3\\)",
        "value": "D"
      }
    ],
    "workedSolution": "The function is\n\\[\ny=(2x^2-5)^4.\n\\]\nThe expression inside the brackets is\n\\[\n2x^2-5.\n\\]\nSo the inside function is \\(2x^2-5\\).",
    "finalAnswer": "B",
    "hint": "The inside function is the full expression being raised to the power 4.",
    "commonMistake": "Choosing only \\(2x^2\\) and leaving out the \\(-5\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2
  },
  {
    "id": "hm-calc-diff-chain-f-003",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-foundations",
    "stage": "Foundations",
    "skill": "Basic chain rule with \\((ax+b)^n\\)",
    "title": "Basic chain rule with \\((ax+b)^n\\)",
    "questionText": "Differentiate \\(y=(3x+2)^5\\) with respect to \\(x\\).",
    "marks": 2,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "15(3x+2)^4",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "15(3x+2)^4"
          },
          {
            "input": "15*(3x+2)^4"
          },
          {
            "input": "15(3x + 2)^4"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "15(3x+2)^4",
    "acceptedAnswers": [
      "15(3x+2)^4",
      "15*(3x+2)^4",
      "15(3x + 2)^4"
    ],
    "workedSolution": "\\[\ny=(3x+2)^5\n\\]\nDifferentiate the outside power:\n\\[\n5(3x+2)^4.\n\\]\nThen multiply by the derivative of the bracket:\n\\[\n\\frac{d}{dx}(3x+2)=3.\n\\]\nSo\n\\[\n\\frac{dy}{dx}=5(3x+2)^4\\cdot3\n\\]\n\\[\n\\frac{dy}{dx}=15(3x+2)^4.\n\\]",
    "finalAnswer": "15(3x+2)^4",
    "hint": "Bring down the outside power, then multiply by the derivative of \\(3x+2\\).",
    "commonMistake": "Writing \\(5(3x+2)^4\\) and forgetting to multiply by 3.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 3
  },
  {
    "id": "hm-calc-diff-chain-f-004",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-foundations",
    "stage": "Foundations",
    "skill": "Basic chain rule with \\((ax-b)^n\\)",
    "title": "Basic chain rule with \\((ax-b)^n\\)",
    "questionText": "Differentiate \\(y=(5x-4)^3\\) with respect to \\(x\\).",
    "marks": 2,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "15(5x-4)^2",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "15(5x-4)^2"
          },
          {
            "input": "15*(5x-4)^2"
          },
          {
            "input": "15(5x - 4)^2"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "15(5x-4)^2",
    "acceptedAnswers": [
      "15(5x-4)^2",
      "15*(5x-4)^2",
      "15(5x - 4)^2"
    ],
    "workedSolution": "\\[\ny=(5x-4)^3\n\\]\nUsing the chain rule,\n\\[\n\\frac{dy}{dx}=3(5x-4)^2\\cdot5.\n\\]\nTherefore,\n\\[\n\\frac{dy}{dx}=15(5x-4)^2.\n\\]",
    "finalAnswer": "15(5x-4)^2",
    "hint": "After applying the power rule to the bracket, multiply by the derivative of \\(5x-4\\).",
    "commonMistake": "Forgetting that \\(\\frac{d}{dx}(5x-4)=5\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 4
  },
  {
    "id": "hm-calc-diff-chain-f-005",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-foundations",
    "stage": "Foundations",
    "skill": "Chain rule with a constant multiplier",
    "title": "Chain rule with a constant multiplier",
    "questionText": "Differentiate \\(y=2(4x+1)^6\\) with respect to \\(x\\).",
    "marks": 2,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "48(4x+1)^5",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "48(4x+1)^5"
          },
          {
            "input": "48*(4x+1)^5"
          },
          {
            "input": "48(4x + 1)^5"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "48(4x+1)^5",
    "acceptedAnswers": [
      "48(4x+1)^5",
      "48*(4x+1)^5",
      "48(4x + 1)^5"
    ],
    "workedSolution": "\\[\ny=2(4x+1)^6\n\\]\nUsing the chain rule,\n\\[\n\\frac{dy}{dx}=2\\cdot6(4x+1)^5\\cdot4.\n\\]\nMultiply the constants:\n\\[\n2\\cdot6\\cdot4=48.\n\\]\nSo\n\\[\n\\frac{dy}{dx}=48(4x+1)^5.\n\\]",
    "finalAnswer": "48(4x+1)^5",
    "hint": "Keep the 2 at the front, then apply the chain rule to \\((4x+1)^6\\).",
    "commonMistake": "Forgetting either the coefficient 2 or the derivative of \\(4x+1\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 5
  },
  {
    "id": "hm-calc-diff-chain-f-006",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-foundations",
    "stage": "Foundations",
    "skill": "Chain rule with quadratic inside functions",
    "title": "Chain rule with quadratic inside functions",
    "questionText": "Differentiate \\(y=(x^2+4)^5\\) with respect to \\(x\\).",
    "marks": 2,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "10x(x^2+4)^4",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "10x(x^2+4)^4"
          },
          {
            "input": "10*x*(x^2+4)^4"
          },
          {
            "input": "10x(x^2 + 4)^4"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "10x(x^2+4)^4",
    "acceptedAnswers": [
      "10x(x^2+4)^4",
      "10*x*(x^2+4)^4",
      "10x(x^2 + 4)^4"
    ],
    "workedSolution": "\\[\ny=(x^2+4)^5\n\\]\nUsing the chain rule,\n\\[\n\\frac{dy}{dx}=5(x^2+4)^4\\cdot2x.\n\\]\nSo\n\\[\n\\frac{dy}{dx}=10x(x^2+4)^4.\n\\]",
    "finalAnswer": "10x(x^2+4)^4",
    "hint": "The derivative of the bracket \\(x^2+4\\) is \\(2x\\).",
    "commonMistake": "Treating \\(x^2+4\\) like its derivative is 1.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 6
  },
  {
    "id": "hm-calc-diff-chain-f-007",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-foundations",
    "stage": "Foundations",
    "skill": "Chain rule with quadratic inside functions",
    "title": "Chain rule with quadratic inside functions",
    "questionText": "Differentiate \\(y=(3x^2-2)^4\\) with respect to \\(x\\).",
    "marks": 2,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "24x(3x^2-2)^3",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "24x(3x^2-2)^3"
          },
          {
            "input": "24*x*(3x^2-2)^3"
          },
          {
            "input": "24x(3x^2 - 2)^3"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "24x(3x^2-2)^3",
    "acceptedAnswers": [
      "24x(3x^2-2)^3",
      "24*x*(3x^2-2)^3",
      "24x(3x^2 - 2)^3"
    ],
    "workedSolution": "\\[\ny=(3x^2-2)^4\n\\]\nUsing the chain rule,\n\\[\n\\frac{dy}{dx}=4(3x^2-2)^3\\cdot6x.\n\\]\nTherefore,\n\\[\n\\frac{dy}{dx}=24x(3x^2-2)^3.\n\\]",
    "finalAnswer": "24x(3x^2-2)^3",
    "hint": "Differentiate the bracket \\(3x^2-2\\) after applying the outside power.",
    "commonMistake": "Differentiating \\(3x^2\\) as \\(3x\\) instead of \\(6x\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 7
  },
  {
    "id": "hm-calc-diff-chain-f-008",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-foundations",
    "stage": "Foundations",
    "skill": "Chain rule with fractional powers",
    "title": "Chain rule with fractional powers",
    "questionText": "Differentiate \\(y=(2x+7)^{1/2}\\) with respect to \\(x\\).",
    "marks": 2,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 2,
      "target": "(2x+7)^(-1/2)",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "(2x+7)^(-1/2)"
          },
          {
            "input": "(2x + 7)^(-1/2)"
          },
          {
            "input": "1/sqrt(2x+7)"
          },
          {
            "input": "1/sqrt(2x + 7)"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "(2x+7)^(-1/2)",
    "acceptedAnswers": [
      "(2x+7)^(-1/2)",
      "(2x + 7)^(-1/2)",
      "1/sqrt(2x+7)",
      "1/sqrt(2x + 7)"
    ],
    "workedSolution": "\\[\ny=(2x+7)^{1/2}\n\\]\nUsing the chain rule,\n\\[\n\\frac{dy}{dx}=\\frac{1}{2}(2x+7)^{-1/2}\\cdot2.\n\\]\nSince \\(\\frac{1}{2}\\cdot2=1\\),\n\\[\n\\frac{dy}{dx}=(2x+7)^{-1/2}.\n\\]\nThis can also be written as\n\\[\n\\frac{dy}{dx}=\\frac{1}{\\sqrt{2x+7}}.\n\\]",
    "finalAnswer": "(2x+7)^(-1/2)",
    "hint": "Use the power \\(\\frac{1}{2}\\), then multiply by the derivative of \\(2x+7\\).",
    "commonMistake": "Forgetting to multiply by 2, or not reducing the power from \\(\\frac{1}{2}\\) to \\(-\\frac{1}{2}\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 8
  },
  {
    "id": "hm-calc-diff-chain-f-009",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-foundations",
    "stage": "Foundations",
    "skill": "Chain rule with negative powers",
    "title": "Chain rule with negative powers",
    "questionText": "Differentiate \\(y=(x^2+1)^{-3}\\) with respect to \\(x\\).",
    "marks": 2,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 2,
      "target": "-6x(x^2+1)^(-4)",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "-6x(x^2+1)^(-4)"
          },
          {
            "input": "-6*x*(x^2+1)^(-4)"
          },
          {
            "input": "-6x(x^2 + 1)^(-4)"
          },
          {
            "input": "-6x/(x^2+1)^4"
          },
          {
            "input": "-6*x/(x^2+1)^4"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "-6x(x^2+1)^(-4)",
    "acceptedAnswers": [
      "-6x(x^2+1)^(-4)",
      "-6*x*(x^2+1)^(-4)",
      "-6x(x^2 + 1)^(-4)",
      "-6x/(x^2+1)^4",
      "-6*x/(x^2+1)^4"
    ],
    "workedSolution": "\\[\ny=(x^2+1)^{-3}\n\\]\nUsing the chain rule,\n\\[\n\\frac{dy}{dx}=-3(x^2+1)^{-4}\\cdot2x.\n\\]\nSo\n\\[\n\\frac{dy}{dx}=-6x(x^2+1)^{-4}.\n\\]\nEquivalently,\n\\[\n\\frac{dy}{dx}=-\\frac{6x}{(x^2+1)^4}.\n\\]",
    "finalAnswer": "-6x(x^2+1)^(-4)",
    "hint": "Bring down the power \\(-3\\), reduce the power by 1, then multiply by \\(2x\\).",
    "commonMistake": "Changing the power from \\(-3\\) to \\(-2\\). Differentiating reduces the power by 1, so it becomes \\(-4\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 9
  },
  {
    "id": "hm-calc-diff-chain-f-010",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-foundations",
    "stage": "Foundations",
    "skill": "Recognising when the chain rule is useful",
    "title": "Recognising when the chain rule is useful",
    "questionText": "Which of the following functions are most naturally differentiated using the chain rule?\n\nI. \\(y=(3x-1)^5\\)  \nII. \\(y=4x^5-2x\\)  \nIII. \\(y=(x^2+6)^3\\)  \nIV. \\(y=7x^3+1\\)\n\nA. I and II only  \nB. I and III only  \nC. II and IV only  \nD. I, II and III only",
    "marks": 1,
    "answerType": "multiple_choice",
    "marking": {
      "strategy": "multiple_choice",
      "strategyVersion": 1,
      "correctOptionId": "B",
      "fixtures": {
        "correct": [
          {
            "input": "B"
          }
        ],
        "incorrect": [
          {
            "input": "0"
          }
        ],
        "malformed": [
          {
            "input": "++"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)"
          }
        ]
      }
    },
    "correctAnswer": "B",
    "acceptedAnswers": [
      "B"
    ],
    "options": [
      {
        "label": "\\(y=(3x-1)^5\\)",
        "value": "I"
      },
      {
        "label": "I and II only",
        "value": "A"
      },
      {
        "label": "I and III only",
        "value": "B"
      },
      {
        "label": "II and IV only",
        "value": "C"
      },
      {
        "label": "I, II and III only",
        "value": "D"
      }
    ],
    "workedSolution": "I has \\((3x-1)\\) inside a power, so the chain rule is natural.  \nII is a polynomial and can be differentiated term by term.  \nIII has \\((x^2+6)\\) inside a power, so the chain rule is natural.  \nIV is a polynomial and can be differentiated term by term.\n\nSo the correct choice is I and III only.",
    "finalAnswer": "B",
    "hint": "Look for a function inside another function, usually brackets raised to a power.",
    "commonMistake": "Thinking every power of \\(x\\), such as \\(x^5\\), needs the chain rule.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 10
  },
  {
    "id": "hm-calc-diff-chain-a-001",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-applications",
    "stage": "Applications",
    "skill": "Gradient at a point using chain rule",
    "title": "Gradient at a point using chain rule",
    "questionText": "For \\(y=(2x+3)^4\\), calculate the gradient of the curve at the point where \\(x=1\\).",
    "marks": 3,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "1000",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "1000"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "1000",
    "acceptedAnswers": [
      "1000"
    ],
    "workedSolution": "\\[\ny=(2x+3)^4\n\\]\n\\[\n\\frac{dy}{dx}=4(2x+3)^3\\cdot2\n\\]\n\\[\n\\frac{dy}{dx}=8(2x+3)^3.\n\\]\nAt \\(x=1\\),\n\\[\n\\frac{dy}{dx}=8(2(1)+3)^3=8(5)^3=1000.\n\\]\nSo the gradient is 1000.",
    "finalAnswer": "1000",
    "hint": "Differentiate first, then substitute \\(x=1\\) into \\(\\frac{dy}{dx}\\).",
    "commonMistake": "Substituting \\(x=1\\) into the original function instead of into the derivative.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 1001
  },
  {
    "id": "hm-calc-diff-chain-a-002",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-applications",
    "stage": "Applications",
    "skill": "Chain rule with a two-term inside derivative",
    "title": "Chain rule with a two-term inside derivative",
    "questionText": "Differentiate \\(y=(x^2+4x)^5\\) with respect to \\(x\\).",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "5(2x+4)(x^2+4x)^4",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "5(2x+4)(x^2+4x)^4"
          },
          {
            "input": "5*(2x+4)*(x^2+4x)^4"
          },
          {
            "input": "10(x+2)(x^2+4x)^4"
          },
          {
            "input": "10*(x+2)*(x^2+4x)^4"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "5(2x+4)(x^2+4x)^4",
    "acceptedAnswers": [
      "5(2x+4)(x^2+4x)^4",
      "5*(2x+4)*(x^2+4x)^4",
      "10(x+2)(x^2+4x)^4",
      "10*(x+2)*(x^2+4x)^4"
    ],
    "workedSolution": "\\[\ny=(x^2+4x)^5\n\\]\nUsing the chain rule,\n\\[\n\\frac{dy}{dx}=5(x^2+4x)^4(2x+4).\n\\]\nSo\n\\[\n\\frac{dy}{dx}=5(2x+4)(x^2+4x)^4.\n\\]\nThis can also be written as\n\\[\n\\frac{dy}{dx}=10(x+2)(x^2+4x)^4.\n\\]",
    "finalAnswer": "5(2x+4)(x^2+4x)^4",
    "hint": "The derivative of the bracket is \\(2x+4\\), not just \\(2x\\).",
    "commonMistake": "Forgetting to differentiate the \\(4x\\) term inside the bracket.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 1002
  },
  {
    "id": "hm-calc-diff-chain-a-003",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-applications",
    "stage": "Applications",
    "skill": "Gradient at a point with a constant multiplier",
    "title": "Gradient at a point with a constant multiplier",
    "questionText": "For \\(y=3(2x^2-1)^3\\), calculate the value of \\(\\frac{dy}{dx}\\) when \\(x=2\\).",
    "marks": 3,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "3528",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "3528"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "3528",
    "acceptedAnswers": [
      "3528"
    ],
    "workedSolution": "\\[\ny=3(2x^2-1)^3\n\\]\n\\[\n\\frac{dy}{dx}=3\\cdot3(2x^2-1)^2\\cdot4x\n\\]\n\\[\n\\frac{dy}{dx}=36x(2x^2-1)^2.\n\\]\nAt \\(x=2\\),\n\\[\n\\frac{dy}{dx}=36(2)(2(2)^2-1)^2\n\\]\n\\[\n=72(7)^2=3528.\n\\]",
    "finalAnswer": "3528",
    "hint": "Keep the coefficient 3 at the front, then differentiate the bracket using the chain rule.",
    "commonMistake": "Forgetting the outside coefficient 3, or forgetting that \\(\\frac{d}{dx}(2x^2-1)=4x\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 1003
  },
  {
    "id": "hm-calc-diff-chain-a-004",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-applications",
    "stage": "Applications",
    "skill": "Chain rule with negative powers and positive-power final form",
    "title": "Chain rule with negative powers and positive-power final form",
    "questionText": "Differentiate \\(y=(3x-2)^{-4}\\) with respect to \\(x\\), giving your answer with positive powers.",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 2,
      "target": "-12/(3x-2)^5",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "-12/(3x-2)^5"
          },
          {
            "input": "-12/(3x - 2)^5"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "-12/(3x-2)^5",
    "acceptedAnswers": [
      "-12/(3x-2)^5",
      "-12/(3x - 2)^5"
    ],
    "workedSolution": "\\[\ny=(3x-2)^{-4}\n\\]\nUsing the chain rule,\n\\[\n\\frac{dy}{dx}=-4(3x-2)^{-5}\\cdot3\n\\]\n\\[\n\\frac{dy}{dx}=-12(3x-2)^{-5}.\n\\]\nWith positive powers,\n\\[\n\\frac{dy}{dx}=-\\frac{12}{(3x-2)^5}.\n\\]",
    "finalAnswer": "-12/(3x-2)^5",
    "hint": "Differentiate first using the negative power, then rewrite the answer as a fraction.",
    "commonMistake": "Leaving the answer as \\(-12(3x-2)^{-5}\\), even though the question asks for positive powers.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 1004
  },
  {
    "id": "hm-calc-diff-chain-a-005",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-applications",
    "stage": "Applications",
    "skill": "Gradient at a point with square-root chain rule",
    "title": "Gradient at a point with square-root chain rule",
    "questionText": "For \\(y=\\sqrt{5x+4}\\), calculate \\(\\frac{dy}{dx}\\) when \\(x=1\\).",
    "marks": 3,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "5/6",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "5/6"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "5/6",
    "acceptedAnswers": [
      "5/6"
    ],
    "workedSolution": "\\[\ny=\\sqrt{5x+4}=(5x+4)^{1/2}\n\\]\n\\[\n\\frac{dy}{dx}=\\frac{1}{2}(5x+4)^{-1/2}\\cdot5\n\\]\n\\[\n\\frac{dy}{dx}=\\frac{5}{2\\sqrt{5x+4}}.\n\\]\nAt \\(x=1\\),\n\\[\n\\frac{dy}{dx}=\\frac{5}{2\\sqrt{9}}=\\frac{5}{6}.\n\\]",
    "finalAnswer": "5/6",
    "hint": "Rewrite the square root as \\((5x+4)^{1/2}\\).",
    "commonMistake": "Forgetting to multiply by the derivative of \\(5x+4\\), which is 5.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 1005
  },
  {
    "id": "hm-calc-diff-chain-a-006",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-applications",
    "stage": "Applications",
    "skill": "Rewrite square root then apply chain rule",
    "title": "Rewrite square root then apply chain rule",
    "questionText": "Differentiate \\(y=\\sqrt{7x-3}\\) with respect to \\(x\\).",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 2,
      "target": "7/(2sqrt(7x-3))",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "7/(2sqrt(7x-3))"
          },
          {
            "input": "7/(2*sqrt(7x-3))"
          },
          {
            "input": "(7/2)(7x-3)^(-1/2)"
          },
          {
            "input": "7/2*(7x-3)^(-1/2)"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "7/(2sqrt(7x-3))",
    "acceptedAnswers": [
      "7/(2sqrt(7x-3))",
      "7/(2*sqrt(7x-3))",
      "(7/2)(7x-3)^(-1/2)",
      "7/2*(7x-3)^(-1/2)"
    ],
    "workedSolution": "\\[\ny=\\sqrt{7x-3}=(7x-3)^{1/2}\n\\]\n\\[\n\\frac{dy}{dx}=\\frac{1}{2}(7x-3)^{-1/2}\\cdot7\n\\]\n\\[\n\\frac{dy}{dx}=\\frac{7}{2}(7x-3)^{-1/2}\n\\]\n\\[\n\\frac{dy}{dx}=\\frac{7}{2\\sqrt{7x-3}}.\n\\]",
    "finalAnswer": "7/(2sqrt(7x-3))",
    "hint": "Use \\(\\sqrt{7x-3}=(7x-3)^{1/2}\\).",
    "commonMistake": "Writing \\(\\frac{1}{2\\sqrt{7x-3}}\\) and forgetting the factor of 7.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 1006
  },
  {
    "id": "hm-calc-diff-chain-a-007",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-applications",
    "stage": "Applications",
    "skill": "Rewrite reciprocal then apply chain rule",
    "title": "Rewrite reciprocal then apply chain rule",
    "questionText": "Differentiate \\(y=\\frac{1}{(4x+5)^3}\\) with respect to \\(x\\).",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 2,
      "target": "-12/(4x+5)^4",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "-12/(4x+5)^4"
          },
          {
            "input": "-12/(4x + 5)^4"
          },
          {
            "input": "-12(4x+5)^(-4)"
          },
          {
            "input": "-12*(4x+5)^(-4)"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "-12/(4x+5)^4",
    "acceptedAnswers": [
      "-12/(4x+5)^4",
      "-12/(4x + 5)^4",
      "-12(4x+5)^(-4)",
      "-12*(4x+5)^(-4)"
    ],
    "workedSolution": "\\[\ny=\\frac{1}{(4x+5)^3}=(4x+5)^{-3}\n\\]\nUsing the chain rule,\n\\[\n\\frac{dy}{dx}=-3(4x+5)^{-4}\\cdot4\n\\]\n\\[\n\\frac{dy}{dx}=-12(4x+5)^{-4}.\n\\]\nEquivalently,\n\\[\n\\frac{dy}{dx}=-\\frac{12}{(4x+5)^4}.\n\\]",
    "finalAnswer": "-12/(4x+5)^4",
    "hint": "Rewrite the function as \\((4x+5)^{-3}\\).",
    "commonMistake": "Differentiating the denominator as if it were a separate fraction rule, instead of first rewriting with a negative power.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 1007
  },
  {
    "id": "hm-calc-diff-chain-a-008",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-applications",
    "stage": "Applications",
    "skill": "Gradient at a point using a quadratic inside function",
    "title": "Gradient at a point using a quadratic inside function",
    "questionText": "For \\(y=(x^2-2x+6)^3\\), calculate the gradient of the curve at the point where \\(x=2\\).",
    "marks": 3,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "216",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "216"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "216",
    "acceptedAnswers": [
      "216"
    ],
    "workedSolution": "\\[\ny=(x^2-2x+6)^3\n\\]\n\\[\n\\frac{dy}{dx}=3(x^2-2x+6)^2(2x-2).\n\\]\nAt \\(x=2\\),\n\\[\n\\frac{dy}{dx}=3(2^2-2(2)+6)^2(2(2)-2)\n\\]\n\\[\n=3(6)^2(2)=216.\n\\]",
    "finalAnswer": "216",
    "hint": "Differentiate the bracket \\(x^2-2x+6\\), then substitute \\(x=2\\).",
    "commonMistake": "Calculating the \\(y\\)-value at \\(x=2\\) instead of the gradient.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 1008
  },
  {
    "id": "hm-calc-diff-chain-a-009",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-applications",
    "stage": "Applications",
    "skill": "Solving from a gradient condition",
    "title": "Solving from a gradient condition",
    "questionText": "For \\(y=(2x+1)^3\\), determine the positive value of \\(x\\) for which the gradient of the curve is 54.",
    "marks": 4,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "1",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "1"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "1",
    "acceptedAnswers": [
      "1"
    ],
    "workedSolution": "\\[\ny=(2x+1)^3\n\\]\n\\[\n\\frac{dy}{dx}=3(2x+1)^2\\cdot2\n\\]\n\\[\n\\frac{dy}{dx}=6(2x+1)^2.\n\\]\nThe gradient is 54, so\n\\[\n6(2x+1)^2=54.\n\\]\n\\[\n(2x+1)^2=9\n\\]\n\\[\n2x+1=\\pm3.\n\\]\nSo\n\\[\nx=1 \\quad \\text{or} \\quad x=-2.\n\\]\nThe positive value is\n\\[\nx=1.\n\\]",
    "finalAnswer": "1",
    "hint": "Find \\(\\frac{dy}{dx}\\), set it equal to 54, then solve for \\(x\\).",
    "commonMistake": "Stopping at \\(2x+1=3\\) without noticing that a square equation also gives \\(2x+1=-3\\). The question asks for the positive value.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 1009
  },
  {
    "id": "hm-calc-diff-chain-ppq-003",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Chain rule with a negative bracket derivative",
    "title": "Chain rule with a negative bracket derivative",
    "questionText": "Differentiate\n\\[\ny=(7-2x)^4\n\\]\nwith respect to \\(x\\).",
    "marks": 2,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "-8(7-2x)^3",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "-8(7-2x)^3"
          },
          {
            "input": "-8*(7-2x)^3"
          },
          {
            "input": "-8(7 - 2x)^3"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "-8(7-2x)^3",
    "acceptedAnswers": [
      "-8(7-2x)^3",
      "-8*(7-2x)^3",
      "-8(7 - 2x)^3"
    ],
    "workedSolution": "\\[\ny=(7-2x)^4\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=4(7-2x)^3\\cdot(-2).\n\\]\nTherefore,\n\\[\n\\frac{dy}{dx}=-8(7-2x)^3.\n\\]",
    "finalAnswer": "-8(7-2x)^3",
    "hint": "After bringing down the power, multiply by the derivative of \\(7-2x\\).",
    "commonMistake": "Dropping the negative sign from the derivative of \\(7-2x\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2003
  },
  {
    "id": "hm-calc-diff-chain-ppq-004",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Chain rule with a negative linear bracket",
    "title": "Chain rule with a negative linear bracket",
    "questionText": "Differentiate\n\\[\ny=(5-3x)^5\n\\]\nwith respect to \\(x\\).",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "-15(5-3x)^4",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "-15(5-3x)^4"
          },
          {
            "input": "-15*(5-3x)^4"
          },
          {
            "input": "-15(5 - 3x)^4"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "-15(5-3x)^4",
    "acceptedAnswers": [
      "-15(5-3x)^4",
      "-15*(5-3x)^4",
      "-15(5 - 3x)^4"
    ],
    "workedSolution": "\\[\ny=(5-3x)^5\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=5(5-3x)^4\\cdot(-3).\n\\]\nSo\n\\[\n\\frac{dy}{dx}=-15(5-3x)^4.\n\\]",
    "finalAnswer": "-15(5-3x)^4",
    "hint": "The derivative of \\(5-3x\\) is \\(-3\\).",
    "commonMistake": "Writing \\(15(5-3x)^4\\) instead of \\(-15(5-3x)^4\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2004
  },
  {
    "id": "hm-calc-diff-chain-ppq-007",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Chain rule with a quadratic expression inside the bracket",
    "title": "Chain rule with a quadratic expression inside the bracket",
    "questionText": "Differentiate\n\\[\ny=(x^2+3x+1)^4\n\\]\nwith respect to \\(x\\).",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "4(2x+3)(x^2+3x+1)^3",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "4(2x+3)(x^2+3x+1)^3"
          },
          {
            "input": "4*(2x+3)*(x^2+3x+1)^3"
          },
          {
            "input": "4(2x + 3)(x^2 + 3x + 1)^3"
          },
          {
            "input": "(8x+12)(x^2+3x+1)^3"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "4(2x+3)(x^2+3x+1)^3",
    "acceptedAnswers": [
      "4(2x+3)(x^2+3x+1)^3",
      "4*(2x+3)*(x^2+3x+1)^3",
      "4(2x + 3)(x^2 + 3x + 1)^3",
      "(8x+12)(x^2+3x+1)^3"
    ],
    "workedSolution": "\\[\ny=(x^2+3x+1)^4\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=4(x^2+3x+1)^3(2x+3).\n\\]\nTherefore,\n\\[\n\\frac{dy}{dx}=4(2x+3)(x^2+3x+1)^3.\n\\]",
    "finalAnswer": "4(2x+3)(x^2+3x+1)^3",
    "hint": "The derivative of the inside function \\(x^2+3x+1\\) is \\(2x+3\\).",
    "commonMistake": "Only differentiating the outside power and forgetting the derivative of the full inside expression.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2007
  },
  {
    "id": "hm-calc-diff-chain-ppq-008",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Chain rule with a negative quadratic inside function",
    "title": "Chain rule with a negative quadratic inside function",
    "questionText": "Differentiate\n\\[\ny=(6-x^2)^5\n\\]\nwith respect to \\(x\\).",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "-10x(6-x^2)^4",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "-10x(6-x^2)^4"
          },
          {
            "input": "-10*x*(6-x^2)^4"
          },
          {
            "input": "-10x(6 - x^2)^4"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "-10x(6-x^2)^4",
    "acceptedAnswers": [
      "-10x(6-x^2)^4",
      "-10*x*(6-x^2)^4",
      "-10x(6 - x^2)^4"
    ],
    "workedSolution": "\\[\ny=(6-x^2)^5\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=5(6-x^2)^4\\cdot(-2x).\n\\]\nTherefore,\n\\[\n\\frac{dy}{dx}=-10x(6-x^2)^4.\n\\]",
    "finalAnswer": "-10x(6-x^2)^4",
    "hint": "Be careful: the derivative of \\(6-x^2\\) is \\(-2x\\).",
    "commonMistake": "Writing \\(10x(6-x^2)^4\\) and losing the negative sign.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2008
  },
  {
    "id": "hm-calc-diff-chain-ppq-010",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Chain rule with a constant multiplier and quadratic inside function",
    "title": "Chain rule with a constant multiplier and quadratic inside function",
    "questionText": "Differentiate\n\\[\ny=2(x^2-1)^5\n\\]\nwith respect to \\(x\\).",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "20x(x^2-1)^4",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "20x(x^2-1)^4"
          },
          {
            "input": "20*x*(x^2-1)^4"
          },
          {
            "input": "20x(x^2 - 1)^4"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "20x(x^2-1)^4",
    "acceptedAnswers": [
      "20x(x^2-1)^4",
      "20*x*(x^2-1)^4",
      "20x(x^2 - 1)^4"
    ],
    "workedSolution": "\\[\ny=2(x^2-1)^5\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=2\\cdot 5(x^2-1)^4\\cdot 2x.\n\\]\nTherefore,\n\\[\n\\frac{dy}{dx}=20x(x^2-1)^4.\n\\]",
    "finalAnswer": "20x(x^2-1)^4",
    "hint": "Keep the multiplier \\(2\\), then multiply by the derivative of \\(x^2-1\\).",
    "commonMistake": "Using the outside power correctly but forgetting to multiply by \\(2x\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2010
  },
  {
    "id": "hm-calc-diff-chain-ppq-011",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Chain rule with an added basic differentiation term",
    "title": "Chain rule with an added basic differentiation term",
    "questionText": "Differentiate\n\\[\ny=(3x+1)^4+5x^2\n\\]\nwith respect to \\(x\\).",
    "marks": 4,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 1,
      "target": "12(3x+1)^3+10x",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "12(3x+1)^3+10x"
          },
          {
            "input": "12*(3x+1)^3+10x"
          },
          {
            "input": "12(3x + 1)^3 + 10x"
          },
          {
            "input": "10x+12(3x+1)^3"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "12(3x+1)^3+10x",
    "acceptedAnswers": [
      "12(3x+1)^3+10x",
      "12*(3x+1)^3+10x",
      "12(3x + 1)^3 + 10x",
      "10x+12(3x+1)^3"
    ],
    "workedSolution": "\\[\ny=(3x+1)^4+5x^2\n\\]\nUsing the Chain rule,\n\\[\n\\frac{d}{dx}\\left((3x+1)^4\\right)=4(3x+1)^3\\cdot3=12(3x+1)^3.\n\\]\nAlso,\n\\[\n\\frac{d}{dx}(5x^2)=10x.\n\\]\nTherefore,\n\\[\n\\frac{dy}{dx}=12(3x+1)^3+10x.\n\\]",
    "finalAnswer": "12(3x+1)^3+10x",
    "hint": "Use the Chain rule on \\((3x+1)^4\\), then differentiate \\(5x^2\\) normally.",
    "commonMistake": "Only differentiating the bracketed term and forgetting the \\(5x^2\\) term.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2011
  },
  {
    "id": "hm-calc-diff-chain-ppq-012",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Chain rule with a square-root composite",
    "title": "Chain rule with a square-root composite",
    "questionText": "Differentiate\n\\[\ny=\\sqrt{5x+4}\n\\]\nwith respect to \\(x\\).",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 2,
      "target": "(5/2)(5x+4)^(-1/2)",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "(5/2)(5x+4)^(-1/2)"
          },
          {
            "input": "5/2(5x+4)^(-1/2)"
          },
          {
            "input": "5/(2sqrt(5x+4))"
          },
          {
            "input": "5/(2sqrt(5x + 4))"
          },
          {
            "input": "5/(2*sqrt(5x+4))"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "(5/2)(5x+4)^(-1/2)",
    "acceptedAnswers": [
      "(5/2)(5x+4)^(-1/2)",
      "5/2(5x+4)^(-1/2)",
      "5/(2sqrt(5x+4))",
      "5/(2sqrt(5x + 4))",
      "5/(2*sqrt(5x+4))"
    ],
    "workedSolution": "\\[\ny=\\sqrt{5x+4}=(5x+4)^{1/2}.\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=\\frac12(5x+4)^{-1/2}\\cdot5.\n\\]\nSo\n\\[\n\\frac{dy}{dx}=\\frac52(5x+4)^{-1/2}.\n\\]\nThis can also be written as\n\\[\n\\frac{dy}{dx}=\\frac{5}{2\\sqrt{5x+4}}.\n\\]",
    "finalAnswer": "(5/2)(5x+4)^(-1/2)",
    "hint": "Rewrite the square root as a power of \\(\\frac12\\).",
    "commonMistake": "Writing \\(\\frac12(5x+4)^{-1/2}\\) and forgetting to multiply by 5.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2012
  },
  {
    "id": "hm-calc-diff-chain-ppq-014",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Chain rule with a negative power",
    "title": "Chain rule with a negative power",
    "questionText": "Differentiate\n\\[\ny=(x+3)^{-2}\n\\]\nwith respect to \\(x\\).",
    "marks": 3,
    "answerType": "algebraic",
    "marking": {
      "strategy": "composite_algebraic_equivalence",
      "strategyVersion": 2,
      "target": "-2(x+3)^(-3)",
      "variable": "x",
      "fixtures": {
        "correct": [
          {
            "input": "-2(x+3)^(-3)"
          },
          {
            "input": "-2*(x+3)^(-3)"
          },
          {
            "input": "-2(x + 3)^(-3)"
          },
          {
            "input": "-2/(x+3)^3"
          },
          {
            "input": "-2/((x+3)^3)"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_composite_expression"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "unsupported_mathematical_form"
          }
        ]
      }
    },
    "correctAnswer": "-2(x+3)^(-3)",
    "acceptedAnswers": [
      "-2(x+3)^(-3)",
      "-2*(x+3)^(-3)",
      "-2(x + 3)^(-3)",
      "-2/(x+3)^3",
      "-2/((x+3)^3)"
    ],
    "workedSolution": "\\[\ny=(x+3)^{-2}\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=-2(x+3)^{-3}\\cdot1.\n\\]\nTherefore,\n\\[\n\\frac{dy}{dx}=-2(x+3)^{-3}.\n\\]",
    "finalAnswer": "-2(x+3)^(-3)",
    "hint": "Bring down the power \\(-2\\), then reduce the power by 1.",
    "commonMistake": "Changing the power from \\(-2\\) to \\(-1\\) instead of reducing it to \\(-3\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2014
  },
  {
    "id": "hm-calc-diff-chain-ppq-015",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Finding a gradient using the Chain rule",
    "title": "Finding a gradient using the Chain rule",
    "questionText": "A curve has equation\n\\[\ny=(2x+1)^5.\n\\]\nFind the gradient of the curve at \\(x=1\\).",
    "marks": 4,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "810",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "810"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "810",
    "acceptedAnswers": [
      "810"
    ],
    "workedSolution": "\\[\ny=(2x+1)^5\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=5(2x+1)^4\\cdot2=10(2x+1)^4.\n\\]\nAt \\(x=1\\),\n\\[\n\\frac{dy}{dx}=10(2(1)+1)^4=10(3)^4.\n\\]\n\\[\n10(3)^4=10\\cdot81=810.\n\\]\nSo the gradient is\n\\[\n810.\n\\]",
    "finalAnswer": "810",
    "hint": "Differentiate first, then substitute \\(x=1\\) into the derivative.",
    "commonMistake": "Substituting \\(x=1\\) into \\(y\\) instead of into \\(\\frac{dy}{dx}\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2015
  },
  {
    "id": "hm-calc-diff-chain-ppq-016",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Finding a gradient with a quadratic inside function",
    "title": "Finding a gradient with a quadratic inside function",
    "questionText": "A curve has equation\n\\[\ny=(x^2+2)^3.\n\\]\nFind the gradient of the curve at \\(x=2\\).",
    "marks": 4,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "432",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "432"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "432",
    "acceptedAnswers": [
      "432"
    ],
    "workedSolution": "\\[\ny=(x^2+2)^3\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=3(x^2+2)^2\\cdot2x.\n\\]\nSo\n\\[\n\\frac{dy}{dx}=6x(x^2+2)^2.\n\\]\nAt \\(x=2\\),\n\\[\n\\frac{dy}{dx}=6(2)(2^2+2)^2.\n\\]\n\\[\n=12(6)^2=12\\cdot36=432.\n\\]\nSo the gradient is\n\\[\n432.\n\\]",
    "finalAnswer": "432",
    "hint": "Differentiate using the Chain rule, then substitute \\(x=2\\).",
    "commonMistake": "Forgetting the \\(2x\\) from differentiating \\(x^2+2\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2016
  },
  {
    "id": "hm-calc-diff-chain-ppq-017",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Comparing gradients after differentiating",
    "title": "Comparing gradients after differentiating",
    "questionText": "Curve \\(C_1\\) has equation\n\\[\ny=(x+2)^4.\n\\]\nCurve \\(C_2\\) has equation\n\\[\ny=6x^2+1.\n\\]\nCompare the gradients of the two curves at \\(x=1\\).",
    "marks": 5,
    "answerType": "written",
    "marking": {
      "strategy": "closed_vocabulary_text_answer",
      "strategyVersion": 1,
      "target": "C1",
      "acceptedAnswers": [
        "C1",
        "curve C1",
        "first curve",
        "y=(x+2)^4"
      ],
      "fixtures": {
        "correct": [
          {
            "input": "C1"
          },
          {
            "input": "curve C1"
          },
          {
            "input": "first curve"
          },
          {
            "input": "y=(x+2)^4"
          }
        ],
        "incorrect": [
          {
            "input": "definitely not in the declared vocabulary",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "",
            "reason": "malformed_closed_vocabulary_text"
          }
        ],
        "unmarkable": [
          {
            "input": "\u0007",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "C1",
    "acceptedAnswers": [
      "C1",
      "curve C1",
      "first curve",
      "y=(x+2)^4"
    ],
    "workedSolution": "For \\(C_1\\),\n\\[\ny=(x+2)^4.\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=4(x+2)^3.\n\\]\nAt \\(x=1\\),\n\\[\n4(1+2)^3=4(3)^3=108.\n\\]\n\nFor \\(C_2\\),\n\\[\ny=6x^2+1.\n\\]\n\\[\n\\frac{dy}{dx}=12x.\n\\]\nAt \\(x=1\\),\n\\[\n12(1)=12.\n\\]\n\nSince\n\\[\n108>12,\n\\]\ncurve \\(C_1\\) has the greater gradient at \\(x=1\\).",
    "finalAnswer": "C1",
    "hint": "Find each derivative, then substitute \\(x=1\\) into both derivatives.",
    "commonMistake": "Comparing the \\(y\\)-values of the curves instead of comparing the gradients.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2017
  },
  {
    "id": "hm-calc-diff-chain-ppq-018",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Evaluating \\(f'(a)\\) after using the Chain rule",
    "title": "Evaluating \\(f'(a)\\) after using the Chain rule",
    "questionText": "Given\n\\[\nf(x)=(x^2+5)^2,\n\\]\nfind\n\\[\nf'(3).\n\\]",
    "marks": 4,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "168",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "168"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "168",
    "acceptedAnswers": [
      "168"
    ],
    "workedSolution": "\\[\nf(x)=(x^2+5)^2.\n\\]\nUsing the Chain rule,\n\\[\nf'(x)=2(x^2+5)\\cdot2x.\n\\]\nSo\n\\[\nf'(x)=4x(x^2+5).\n\\]\nNow substitute \\(x=3\\):\n\\[\nf'(3)=4(3)(3^2+5).\n\\]\n\\[\n=12(14)=168.\n\\]",
    "finalAnswer": "168",
    "hint": "Find \\(f'(x)\\), then substitute \\(x=3\\).",
    "commonMistake": "Substituting \\(x=3\\) into \\(f(x)\\) instead of into \\(f'(x)\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2018
  },
  {
    "id": "hm-calc-diff-chain-ppq-019",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Solving a gradient condition after using the Chain rule",
    "title": "Solving a gradient condition after using the Chain rule",
    "questionText": "For\n\\[\nf(x)=(2x+3)^4,\n\\]\nfind the value of \\(x\\) for which\n\\[\nf'(x)=8.\n\\]",
    "marks": 4,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "-1",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "-1"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "-1",
    "acceptedAnswers": [
      "-1"
    ],
    "workedSolution": "\\[\nf(x)=(2x+3)^4\n\\]\nUsing the Chain rule,\n\\[\nf'(x)=4(2x+3)^3\\cdot2.\n\\]\nSo\n\\[\nf'(x)=8(2x+3)^3.\n\\]\nSet this equal to 8:\n\\[\n8(2x+3)^3=8.\n\\]\n\\[\n(2x+3)^3=1.\n\\]\n\\[\n2x+3=1.\n\\]\n\\[\n2x=-2.\n\\]\n\\[\nx=-1.\n\\]",
    "finalAnswer": "-1",
    "hint": "Differentiate first, then set the derivative equal to 8.",
    "commonMistake": "Setting \\(f(x)=8\\) instead of setting \\(f'(x)=8\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2019
  },
  {
    "id": "hm-calc-diff-chain-ppq-020",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Solving a positive gradient condition with a quadratic inside function",
    "title": "Solving a positive gradient condition with a quadratic inside function",
    "questionText": "For\n\\[\nf(x)=(x^2+1)^3,\n\\]\nfind the positive value of \\(x\\) for which\n\\[\nf'(x)=300.\n\\]",
    "marks": 5,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "2",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "2"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "2",
    "acceptedAnswers": [
      "2"
    ],
    "workedSolution": "\\[\nf(x)=(x^2+1)^3.\n\\]\nUsing the Chain rule,\n\\[\nf'(x)=3(x^2+1)^2\\cdot2x.\n\\]\nSo\n\\[\nf'(x)=6x(x^2+1)^2.\n\\]\nSet this equal to 300:\n\\[\n6x(x^2+1)^2=300.\n\\]\nCheck \\(x=2\\):\n\\[\n6(2)(2^2+1)^2=12(5)^2=12\\cdot25=300.\n\\]\nTherefore, the positive value is\n\\[\nx=2.\n\\]",
    "finalAnswer": "2",
    "hint": "Differentiate first, then check the positive value that makes the derivative equal to 300.",
    "commonMistake": "Trying to solve the full equation by expanding everything. Since the question asks for the positive value, substitution/checking is a clean method here.",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2020
  },
  {
    "id": "hm-calc-diff-chain-ppq-021",
    "questionVersion": 1,
    "contentRevision": 1,
    "contentStatus": "active",
    "subject": "Higher Maths",
    "courseArea": "Calculus",
    "specArea": "Differentiation",
    "skillPath": "Chain rule",
    "skillPathId": "chain-rule",
    "stageId": "chain-rule-stage-past-paper-style",
    "stage": "Past Paper-style Questions",
    "skill": "Finding an unknown coefficient from a gradient condition",
    "title": "Finding an unknown coefficient from a gradient condition",
    "questionText": "A curve has equation\n\\[\ny=(kx+1)^3,\n\\]\nwhere \\(k\\) is a positive constant.\n\nThe gradient of the curve at \\(x=1\\) is \\(54\\).\n\nFind the value of \\(k\\).",
    "marks": 5,
    "answerType": "numerical",
    "marking": {
      "strategy": "numeric",
      "strategyVersion": 1,
      "target": "2",
      "comparison": {
        "type": "exact"
      },
      "fixtures": {
        "correct": [
          {
            "input": "2"
          }
        ],
        "incorrect": [
          {
            "input": "0",
            "reason": "value_wrong"
          }
        ],
        "malformed": [
          {
            "input": "++",
            "reason": "malformed_numeric"
          }
        ],
        "unmarkable": [
          {
            "input": "sin(x)",
            "reason": "expression_not_permitted"
          }
        ]
      }
    },
    "correctAnswer": "2",
    "acceptedAnswers": [
      "2"
    ],
    "workedSolution": "\\[\ny=(kx+1)^3\n\\]\nUsing the Chain rule,\n\\[\n\\frac{dy}{dx}=3(kx+1)^2\\cdot k.\n\\]\nSo\n\\[\n\\frac{dy}{dx}=3k(kx+1)^2.\n\\]\n\nAt \\(x=1\\),\n\\[\n\\frac{dy}{dx}=3k(k+1)^2.\n\\]\n\nThe gradient is \\(54\\), so\n\\[\n3k(k+1)^2=54.\n\\]\n\nSince \\(k\\) is positive, check \\(k=2\\):\n\\[\n3(2)(2+1)^2=6(9)=54.\n\\]\nTherefore,\n\\[\nk=2.\n\\]",
    "finalAnswer": "2",
    "hint": "Differentiate using the Chain rule, then substitute \\(x=1\\) and use the given gradient.",
    "commonMistake": "Differentiating \\(kx+1\\) as \\(x+1\\), instead of recognising that its derivative is \\(k\\).",
    "calculatorAllowed": false,
    "source": "Original STEM Forge QS-style content",
    "status": "ready",
    "displayOrder": 2021
  }
];

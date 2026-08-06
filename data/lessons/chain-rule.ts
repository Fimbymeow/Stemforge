import { INITIAL_CONTENT_REVISION } from "@/data/content-metadata";
import type { LessonBlock, LessonDocument } from "@/lib/lessons/types";
import { LESSON_SCHEMA_VERSION } from "@/lib/lessons/types";
import { estimateLessonReadingMinutes } from "@/lib/lessons/lesson-document";

const blocks: LessonBlock[] = [
  {
    blockId: "chain-rule-note-composite-functions",
    type: "heading",
    level: 2,
    text: "Composite functions",
  },
  {
    blockId: "chain-rule-composite-prose",
    type: "prose",
    content:
      "Some functions are built from one function applied to the output of another. In $y=(2x+5)^4$, the expression $2x+5$ is worked out first, and the result is then raised to the power 4. A function built this way — a function of a function — is a **composite function**.",
  },
  {
    blockId: "chain-rule-definition-composite",
    type: "callout",
    semantic: "definition",
    title: "Inside and outside functions",
    content:
      "The **inside function** is the expression inside the brackets (here, $2x+5$). The **outside function** is the operation applied to it (here, raising to the power 4). The chain rule differentiates composite functions by working with both parts.",
  },
  {
    blockId: "chain-rule-note-recognition",
    type: "callout",
    semantic: "warning",
    title: "A composite function is not a simple power",
    content:
      "$y=(2x+5)^4$ is not the same shape as $y=x^4$. Treating it as a simple power — differentiating only the outside and ignoring that $2x+5$ is its own expression — gives the wrong answer. Whenever there is a function inside another function, the chain rule is needed, not the plain power rule on its own.",
  },
  {
    blockId: "chain-rule-note-the-rule",
    type: "heading",
    level: 2,
    text: "The chain rule",
  },
  {
    blockId: "chain-rule-formula",
    type: "callout",
    semantic: "formula",
    title: "Chain rule",
    content: "Differentiate the outside function, keeping the inside unchanged, then multiply by the derivative of the inside function.",
    formula: "$$\\frac{d}{dx}\\big[(f(x))^n\\big]=n(f(x))^{n-1}\\cdot f'(x)$$",
  },
  {
    blockId: "chain-rule-basic-example",
    type: "worked_example",
    title: "Differentiate a bracket raised to a power",
    prompt: "Differentiate $y=(2x+5)^4$ with respect to $x$.",
    steps: [
      { title: "Differentiate the outside function", body: "Bring down the power and reduce it by 1, keeping the bracket unchanged: $4(2x+5)^3$." },
      { title: "Multiply by the derivative of the inside function", body: "The derivative of $2x+5$ is $2$, so multiply: $4(2x+5)^3\\times2$." },
    ],
    finalAnswer: "$$\\frac{dy}{dx}=8(2x+5)^3$$",
    explanation: "The outside power is differentiated first, and the constant factor 2 comes from differentiating the inside function $2x+5$.",
  },
  {
    blockId: "chain-rule-common-mistakes-inner-derivative",
    type: "callout",
    semantic: "common_mistake",
    title: "Two mistakes with the inner factor",
    content:
      "Forgetting to multiply by the derivative of the inside function at all — leaving the answer as $4(2x+5)^3$ — is one common slip. A second, different mistake is multiplying by the inside function itself rather than its derivative, writing $4(2x+5)^3\\times(2x+5)$ instead of $4(2x+5)^3\\times2$. Only the **derivative** of the inside function belongs in that final factor.",
  },
  {
    blockId: "chain-rule-note-coefficients-nonlinear",
    type: "heading",
    level: 2,
    text: "Coefficients and nonlinear inside functions",
  },
  {
    blockId: "chain-rule-coefficients-prose",
    type: "prose",
    content:
      "An outer constant coefficient stays in place and is multiplied in at the end. The inside function does not have to be linear — it can be a quadratic or another expression in $x$, and its own derivative is found in the usual way before multiplying.",
  },
  {
    blockId: "chain-rule-coefficient-example",
    type: "worked_example",
    title: "Coefficient with a nonlinear inside function",
    prompt: "Differentiate $y=3(x^2+2)^4$ with respect to $x$.",
    steps: [
      { title: "Differentiate the outside function", body: "Keep the coefficient 3, bring down the power 4 and reduce it by 1: $3\\times4(x^2+2)^3$." },
      { title: "Multiply by the derivative of the inside function", body: "The derivative of $x^2+2$ is $2x$, so multiply: $12(x^2+2)^3\\times2x$." },
      { title: "Combine the constants", body: "$12\\times2=24$, giving $24x(x^2+2)^3$." },
    ],
    finalAnswer: "$$\\frac{dy}{dx}=24x(x^2+2)^3$$",
    explanation: "The coefficient 3 is carried through the whole calculation, and the inside function's own derivative ($2x$) is what gets multiplied in — not just $x$.",
    commonMistake: "Dropping the outer coefficient 3, or multiplying by $x$ instead of the correct derivative $2x$.",
  },
  {
    blockId: "chain-rule-note-negative-fractional",
    type: "heading",
    level: 2,
    text: "Negative and fractional powers",
  },
  {
    blockId: "chain-rule-negative-fractional-prose",
    type: "prose",
    content:
      "The chain rule works the same way for negative and fractional outside powers. A square root can be rewritten as a power of $\\frac12$ before differentiating, and a reciprocal can be rewritten as a negative power — after that, the same two steps apply: differentiate the outside power, then multiply by the derivative of the inside function.",
  },
  {
    blockId: "chain-rule-negative-power-example",
    type: "worked_example",
    title: "Differentiate a negative power",
    prompt: "Differentiate $y=(3x-1)^{-2}$ with respect to $x$.",
    steps: [
      { title: "Differentiate the outside function", body: "Bring down the power $-2$ and reduce it by 1, to $-3$: $-2(3x-1)^{-3}$." },
      { title: "Multiply by the derivative of the inside function", body: "The derivative of $3x-1$ is $3$, so multiply: $-2(3x-1)^{-3}\\times3$." },
    ],
    finalAnswer: "$$\\frac{dy}{dx}=-6(3x-1)^{-3}=-\\frac{6}{(3x-1)^3}$$",
    explanation: "Reducing $-2$ by 1 gives $-3$, not $-1$ — the power always reduces by exactly 1, whatever sign it starts with.",
    commonMistake: "Reducing the power to $-1$ instead of $-3$.",
  },
  {
    blockId: "chain-rule-fractional-power-example",
    type: "worked_example",
    title: "Differentiate a square root",
    prompt: "Differentiate $y=\\sqrt{4x+1}$ with respect to $x$.",
    steps: [
      { title: "Rewrite as a fractional power", body: "$y=(4x+1)^{1/2}$." },
      { title: "Differentiate the outside function", body: "Bring down the power $\\frac12$ and reduce it by 1, to $-\\frac12$: $\\frac12(4x+1)^{-1/2}$." },
      { title: "Multiply by the derivative of the inside function", body: "The derivative of $4x+1$ is $4$, so multiply: $\\frac12(4x+1)^{-1/2}\\times4$." },
    ],
    finalAnswer: "$$\\frac{dy}{dx}=2(4x+1)^{-1/2}=\\frac{2}{\\sqrt{4x+1}}$$",
    explanation: "Rewriting the square root as a power of $\\frac12$ first turns this into an ordinary chain rule question.",
  },
  {
    blockId: "chain-rule-common-mistakes-power-reduction",
    type: "callout",
    semantic: "common_mistake",
    title: "Reducing the power incorrectly",
    content:
      "When the outside power is negative or fractional, it is easy to reduce it incorrectly — for example, treating $-2$ as if it became $-1$, or $\\frac12$ as if it became $\\frac12-\\frac12$ instead of $-\\frac12$. The power always reduces by exactly 1, kept as a fraction or negative number as needed.",
  },
  {
    blockId: "chain-rule-self-check",
    type: "self_check",
    title: "Quick self-check",
    prompt: "Differentiate $y=2(3x^2+1)^3$ with respect to $x$.",
    answer: "$$\\frac{dy}{dx}=36x(3x^2+1)^2$$",
    explanation: "Keep the coefficient 2, bring down the power 3 and reduce it to 2, then multiply by the derivative of $3x^2+1$, which is $6x$: $2\\times3\\times6=36$.",
  },
];

export const chainRuleLesson: LessonDocument = {
  lessonId: "chain-rule-lesson",
  skillPathId: "chain-rule",
  schemaVersion: LESSON_SCHEMA_VERSION,
  contentRevision: INITIAL_CONTENT_REVISION,
  contentStatus: "active",
  title: "Chain rule",
  objective: "Recognise composite functions and differentiate them using the chain rule, including coefficients, nonlinear inside functions, and negative or fractional powers.",
  qualification: {
    subject: "Higher Maths",
    level: "Higher",
    label: "Scottish Higher Maths",
  },
  estimatedReadingMinutes: estimateLessonReadingMinutes(blocks),
  sections: [
    { sectionId: "composite-functions", title: "Composite functions", anchorBlockId: "chain-rule-note-composite-functions" },
    { sectionId: "the-rule", title: "The chain rule", anchorBlockId: "chain-rule-note-the-rule" },
    { sectionId: "coefficients-nonlinear", title: "Coefficients and nonlinear inside functions", anchorBlockId: "chain-rule-note-coefficients-nonlinear" },
    { sectionId: "negative-fractional", title: "Negative and fractional powers", anchorBlockId: "chain-rule-note-negative-fractional" },
    { sectionId: "check", title: "Self-check", anchorBlockId: "chain-rule-self-check" },
  ],
  blocks,
  closure: {
    recap:
      "A composite function has an inside function and an outside function. To differentiate it, differentiate the outside function while keeping the inside unchanged, then multiply by the derivative of the inside function — the same two steps whether the outside power is a positive integer, negative, or fractional.",
    foundationsHref: "/question/hm-calc-diff-chain-f-001",
  },
};

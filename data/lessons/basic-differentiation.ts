import { INITIAL_CONTENT_REVISION } from "@/data/content-metadata";
import type { LessonBlock, LessonDocument } from "@/lib/lessons/types";
import { LESSON_SCHEMA_VERSION } from "@/lib/lessons/types";
import { estimateLessonReadingMinutes } from "@/lib/lessons/lesson-document";

const blocks: LessonBlock[] = [
  {
    blockId: "basic-diff-note-what-differentiation-does",
    type: "heading",
    level: 2,
    text: "What differentiation does",
  },
  {
    blockId: "basic-diff-gradient-function",
    type: "prose",
    content: "A curve can have a different gradient at every point. Differentiation turns the original function into a **gradient function**: a rule that gives the gradient for any chosen value of $x$.",
  },
  {
    blockId: "basic-diff-definition-derivative",
    type: "callout",
    semantic: "definition",
    title: "Derivative",
    content: "The derivative of a function is its gradient function. It describes how quickly the original function is changing.",
  },
  {
    blockId: "basic-diff-notation",
    type: "prose",
    content: "If $y=f(x)$, the derivative may be written as $f'(x)$ or $\\frac{dy}{dx}$. These notations both refer to the gradient function. A value such as $f'(2)$ means the gradient when $x=2$.",
  },
  {
    blockId: "basic-diff-note-power-rule",
    type: "heading",
    level: 2,
    text: "The power rule",
  },
  {
    blockId: "basic-diff-formula-power-rule",
    type: "callout",
    semantic: "formula",
    title: "Power rule",
    content: "Bring the power down as a coefficient, then reduce the power by 1.",
    formula: "$$\\frac{d}{dx}(x^n)=nx^{n-1}$$",
  },
  {
    blockId: "basic-diff-power-example",
    type: "worked_example",
    title: "Differentiate a single power",
    prompt: "Differentiate $f(x)=6x^4$.",
    steps: [
      { title: "Bring down the power", body: "Multiply the coefficient by the power: $6\\times4=24$." },
      { title: "Reduce the power", body: "Reduce the power from 4 to 3, giving $f'(x)=24x^3$." },
    ],
    finalAnswer: "$$f'(x)=24x^3$$",
    explanation: "The coefficient and power are multiplied before the power is reduced by 1.",
  },
  {
    blockId: "basic-diff-note-constants-sums",
    type: "callout",
    semantic: "key_idea",
    title: "Constants, sums and differences",
    content: "A constant differentiates to 0. For a sum or difference, differentiate each term separately and keep its sign.",
  },
  {
    blockId: "basic-diff-example-polynomial",
    type: "worked_example",
    title: "Differentiate a polynomial",
    prompt: "Differentiate $$y=4x^3-5x^2+7$$",
    steps: [
      { title: "Differentiate the first term", body: "$4x^3$ becomes $12x^2$." },
      { title: "Differentiate the second term", body: "$-5x^2$ becomes $-10x$." },
      { title: "Remove the constant", body: "The derivative of 7 is 0." },
    ],
    finalAnswer: "$$\\frac{dy}{dx}=12x^2-10x$$",
    explanation: "Each term is differentiated independently, and the subtraction sign is retained.",
    commonMistake: "Do not leave the constant 7 in the derivative.",
  },
  {
    blockId: "basic-diff-common-mistakes",
    type: "callout",
    semantic: "common_mistake",
    title: "Common mistakes",
    content: "Remember both parts of the power rule: multiply by the original power and then reduce that power by 1. Keep negative signs, and remove constant terms.",
  },
  {
    blockId: "basic-diff-note-evaluating-derivative",
    type: "heading",
    level: 2,
    text: "Gradient at a point",
  },
  {
    blockId: "basic-diff-evaluate-prose",
    type: "prose",
    content: "To find the gradient at a point, differentiate first and then substitute the given $x$-value into the derivative. Substituting into the original function finds a coordinate, not a gradient.",
  },
  {
    blockId: "basic-diff-gradient-example",
    type: "worked_example",
    title: "Find a gradient at a point",
    prompt: "For $f(x)=x^3+2x$, find $f'(2)$.",
    steps: [
      { title: "Find the gradient function", body: "Differentiate term by term: $f'(x)=3x^2+2$." },
      { title: "Evaluate at the point", body: "Substitute $x=2$: $f'(2)=3(2)^2+2=14$." },
    ],
    finalAnswer: "$$f'(2)=14$$",
    explanation: "The value 14 is the gradient of the curve when $x=2$.",
  },
  {
    blockId: "basic-diff-self-check",
    type: "self_check",
    title: "Quick self-check",
    prompt: "Differentiate $g(x)=5x^3-4x+9$, then find $g'(2)$.",
    answer: "$$g'(x)=15x^2-4,\\qquad g'(2)=56$$",
    explanation: "Differentiate each term, remove the constant, and only then substitute $x=2$.",
  },
];

export const basicDifferentiationLesson: LessonDocument = {
  lessonId: "basic-differentiation-lesson",
  skillPathId: "basic-differentiation",
  schemaVersion: LESSON_SCHEMA_VERSION,
  contentRevision: INITIAL_CONTENT_REVISION + 1,
  contentStatus: "active",
  title: "Basic differentiation",
  objective: "Understand the derivative as a gradient function, apply the power rule to polynomials, and evaluate a derivative at a point.",
  qualification: {
    subject: "Higher Maths",
    level: "Higher",
    label: "Scottish Higher Maths",
  },
  estimatedReadingMinutes: estimateLessonReadingMinutes(blocks),
  sections: [
    { sectionId: "meaning", title: "What differentiation does", anchorBlockId: "basic-diff-note-what-differentiation-does" },
    { sectionId: "method", title: "The power rule", anchorBlockId: "basic-diff-note-power-rule" },
    { sectionId: "gradients", title: "Gradient at a point", anchorBlockId: "basic-diff-note-evaluating-derivative" },
    { sectionId: "check", title: "Self-check", anchorBlockId: "basic-diff-self-check" },
  ],
  blocks,
  closure: {
    recap: "Differentiation produces a gradient function. Apply the power rule term by term, remove constants, and substitute into the derivative when a gradient at a point is required.",
    foundationsHref: "/question/hm-calc-diff-basic-f-001",
  },
};

import { INITIAL_CONTENT_REVISION } from "@/data/content-metadata";
import type { LessonBlock, LessonDocument } from "@/lib/lessons/types";
import { LESSON_SCHEMA_VERSION } from "@/lib/lessons/types";
import { estimateLessonReadingMinutes } from "@/lib/lessons/lesson-document";

const blocks: LessonBlock[] = [
  {
    blockId: "tangents-meaning",
    type: "heading",
    level: 2,
    text: "What a tangent tells you",
  },
  {
    blockId: "tangents-meaning-prose",
    type: "prose",
    content: "A tangent is a straight line that has the same gradient as a curve at one chosen point. The derivative supplies that gradient; the original curve supplies the point the line must pass through.",
  },
  {
    blockId: "tangents-core-idea",
    type: "callout",
    semantic: "key_idea",
    title: "Two substitutions, two different jobs",
    content: "Substitute the contact value into $\frac{dy}{dx}$ to find the tangent gradient. Substitute it into the original equation to find the contact point's $y$-coordinate.",
  },
  {
    blockId: "tangents-method",
    type: "heading",
    level: 2,
    text: "The tangent method",
  },
  {
    blockId: "tangents-point-gradient",
    type: "callout",
    semantic: "formula",
    title: "Point-gradient form",
    content: "For a line of gradient $m$ through $(a,b)$, use",
    formula: "$$y-b=m(x-a).$$",
  },
  {
    blockId: "tangents-four-steps",
    type: "prose",
    content: "Use the same four steps each time: differentiate the curve; evaluate the derivative at the stated $x$-value; find the matching $y$-coordinate from the curve; then substitute the gradient and point into point-gradient form and simplify if requested.",
  },
  {
    blockId: "tangents-direct-example",
    type: "worked_example",
    title: "A polynomial curve",
    prompt: "Find the equation of the tangent to $y=x^2+3x-4$ where $x=1$.",
    steps: [
      { title: "Differentiate", body: "$\frac{dy}{dx}=2x+3$." },
      { title: "Find the gradient", body: "At $x=1$, $m=2(1)+3=5$." },
      { title: "Find the point", body: "At $x=1$, $y=1+3-4=0$, so the point is $(1,0)$." },
      { title: "Form the line", body: "$y-0=5(x-1)$, so $y=5x-5$." },
    ],
    finalAnswer: "$$y=5x-5$$",
    explanation: "The derivative value is the gradient, while the original function value locates the point.",
    commonMistake: "Do not use the curve's $y$-coordinate as the gradient.",
  },
  {
    blockId: "tangents-equivalent-forms",
    type: "heading",
    level: 2,
    text: "Equivalent line equations",
  },
  {
    blockId: "tangents-equivalent-forms-prose",
    type: "prose",
    content: "The same tangent can be written in point-gradient, slope-intercept or general form. For example, $y-2=3(x-1)$, $y=3x-1$ and $3x-y-1=0$ all describe the same line. Rearrangement must preserve every sign and constant.",
  },
  {
    blockId: "tangents-given-point-example",
    type: "worked_example",
    title: "When the point is already given",
    prompt: "The point $(2,11)$ lies on $y=3x^2-4x+7$. Find the tangent there.",
    steps: [
      { title: "Differentiate", body: "$\frac{dy}{dx}=6x-4$." },
      { title: "Evaluate", body: "At $x=2$, $m=8$." },
      { title: "Use the given point", body: "$y-11=8(x-2)$." },
    ],
    finalAnswer: "$$y=8x-5$$",
    explanation: "There is no need to recalculate the $y$-coordinate when the contact point is supplied.",
  },
  {
    blockId: "tangents-known-methods",
    type: "heading",
    level: 2,
    text: "Curves using an earlier differentiation method",
  },
  {
    blockId: "tangents-known-methods-prose",
    type: "prose",
    content: "Some Tangents questions use a curve whose derivative needs an already-learned method such as the chain rule. That method changes how you obtain $\frac{dy}{dx}$, but the tangent construction remains the same.",
  },
  {
    blockId: "tangents-chain-example",
    type: "worked_example",
    title: "A composite curve",
    prompt: "Find the tangent to $y=(2x+1)^2$ where $x=1$.",
    steps: [
      { title: "Differentiate", body: "By the chain rule, $\frac{dy}{dx}=4(2x+1)$." },
      { title: "Find the gradient and point", body: "At $x=1$, $m=12$ and $y=9$, so the point is $(1,9)$." },
      { title: "Form the tangent", body: "$y-9=12(x-1)$." },
    ],
    finalAnswer: "$$y=12x-3$$",
    explanation: "The chain rule is used only to obtain the gradient function; the assessed Tangents method follows afterwards.",
  },
  {
    blockId: "tangents-errors",
    type: "callout",
    semantic: "common_mistake",
    title: "Errors to check before finishing",
    content: "Do not set the derivative equal to zero unless a stationary point is asked for. Do not take a negative reciprocal: that would produce a normal gradient, not the tangent gradient. Check that your final line passes through the contact point and has the derivative's value as its gradient.",
  },
  {
    blockId: "tangents-self-check",
    type: "self_check",
    title: "Quick self-check",
    prompt: "Find the equation of the tangent to $y=x^3-2x^2+4$ at $x=2$.",
    answer: "$$\frac{dy}{dx}=3x^2-4x,\quad m=4,\quad (2,4),\quad y=4x-4$$",
    explanation: "Evaluate both the derivative and the original curve at $x=2$, then use point-gradient form.",
  },
];

export const tangentsLesson: LessonDocument = {
  lessonId: "tangents-lesson",
  skillPathId: "tangents-and-normals",
  schemaVersion: LESSON_SCHEMA_VERSION,
  contentRevision: INITIAL_CONTENT_REVISION,
  contentStatus: "active",
  title: "Tangents",
  objective: "Use a derivative and a point on a curve to determine the equation of its tangent.",
  qualification: {
    subject: "Higher Maths",
    level: "Higher",
    label: "Scottish Higher Maths",
  },
  estimatedReadingMinutes: estimateLessonReadingMinutes(blocks),
  sections: [
    { sectionId: "meaning", title: "What a tangent tells you", anchorBlockId: "tangents-meaning" },
    { sectionId: "method", title: "The tangent method", anchorBlockId: "tangents-method" },
    { sectionId: "forms", title: "Equivalent line equations", anchorBlockId: "tangents-equivalent-forms" },
    { sectionId: "known-methods", title: "Earlier differentiation methods", anchorBlockId: "tangents-known-methods" },
    { sectionId: "check", title: "Self-check", anchorBlockId: "tangents-self-check" },
  ],
  blocks,
  closure: {
    recap: "Differentiate, evaluate the derivative for the gradient, evaluate the curve for the contact point, and use point-gradient form. Equivalent affine forms describe the same tangent.",
    foundationsHref: "/subjects/higher-maths/calculus/differentiation/tangents-and-normals",
  },
};

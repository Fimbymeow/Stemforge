import { QuestionWorkspace } from "@/components/questions/question-workspace";
import type { Question } from "@/data/types";
import { ACTIVE_CONTENT_STATUS, INITIAL_CONTENT_REVISION, INITIAL_QUESTION_VERSION } from "@/data/content-metadata";
import { add, constant, exact, multiply, power, xExpression } from "@/lib/maths/expression-core";
import { createNatureTableExpectedAnswers, analyseFunctionNature } from "@/lib/maths/function-analysis";

const expression = add(power(xExpression, 3), multiply(constant(-3), xExpression));
const derivative = add(multiply(constant(3), power(xExpression, 2)), constant(-3));
const analysis = analyseFunctionNature(expression, [exact(-1), exact(1)]);
if (analysis.status !== "supported") throw new Error("Internal graph demo nature-table analysis must stay supported.");
const fullExpectedAnswers = createNatureTableExpectedAnswers(analysis);
const expectedAnswers = {
  "sign:interval-0": fullExpectedAnswers["sign:interval-0"],
  "sign:interval-1": fullExpectedAnswers["sign:interval-1"],
  "sign:interval-2": fullExpectedAnswers["sign:interval-2"],
  "nature:critical-0": fullExpectedAnswers["nature:critical-0"],
  "nature:critical-1": fullExpectedAnswers["nature:critical-1"],
};

export const graphDemoQuestion: Question = {
  id: "internal-graph-demo-nature-table",
  questionVersion: INITIAL_QUESTION_VERSION,
  contentRevision: INITIAL_CONTENT_REVISION,
  contentStatus: ACTIVE_CONTENT_STATUS,
  subject: "Higher Maths",
  courseArea: "Calculus",
  specArea: "Differentiation",
  skillPath: "Interactive graph demo",
  skillPathId: "internal-graph-demo",
  stageId: "internal-graph-demo-stage",
  stage: "Applications",
  skill: "Nature table",
  title: "Complete a nature table from linked graphs",
  questionText: "For $f(x)=x^3-3x$, complete the nature table using the graph of $f(x)$ and $f'(x)$.",
  marks: 4,
  answerType: "nature_table",
  correctAnswer: "structured nature table",
  acceptedAnswers: ["structured-answer"],
  graphConfig: {
    version: 1,
    title: "Linked graph demo",
    description: "Explore f(x)=x^3-3x and its derivative f'(x)=3x^2-3.",
    viewport: { xMin: -3, xMax: 3, yMin: -6, yMax: 6, xStep: 1, yStep: 2 },
    functions: [
      { id: "f", expression, label: "f(x)", styleRole: "primary" },
      { id: "f-prime", expression: derivative, label: "f'(x)", styleRole: "derivative" },
    ],
    linkedDerivative: { originalFunctionId: "f", derivativeFunctionId: "f-prime", initialX: 0, showTangent: true },
    keyPoints: [
      { x: exact(-1), y: exact(2), label: "max" },
      { x: exact(1), y: exact(-2), label: "min" },
    ],
  },
  natureTableConfig: {
    id: "demo-nature-table",
    criticalValues: [exact(-1), exact(1)],
    rows: [
      { id: "sign", label: "Sign of f'(x)", kind: "sign" },
      { id: "trend", label: "Behaviour of f(x)", kind: "trend" },
      { id: "nature", label: "Nature", kind: "nature" },
    ],
    expectedAnswers,
  },
  structuredAnswer: { type: "nature-table", tableId: "demo-nature-table" },
  workedSolution: "Since $f'(x)=3x^2-3$, the derivative is positive on $(-\\infty,-1)$, negative on $(-1,1)$ and positive on $(1,\\infty)$. So $x=-1$ is a maximum and $x=1$ is a minimum.",
  finalAnswer: "$(-1,2)$ is a maximum and $(1,-2)$ is a minimum.",
  hint: "Look at the sign of $f'(x)$ on each interval. Positive means increasing; negative means decreasing.",
  commonMistake: "A common mistake is to classify the stationary point using the value of $f(x)$ instead of the sign change in $f'(x)$.",
  calculatorAllowed: false,
  source: "Internal STEM Forge graph interaction demo",
  status: "ready",
  displayOrder: 1,
};

export function GraphDemoPage() {
  return <QuestionWorkspace question={graphDemoQuestion} />;
}

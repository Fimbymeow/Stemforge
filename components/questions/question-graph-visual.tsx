import { LinkedDerivativeGraphs } from "@/components/maths/linked-derivative-graphs";
import { MathGraph } from "@/components/maths/math-graph";
import type { Question } from "@/data/types";

export function QuestionGraphVisual({ question }: { question: Question }) {
  const graph = question.graphConfig;
  if (!graph) return null;
  if (graph.linkedDerivative) return <div className="mt-5"><LinkedDerivativeGraphs expression={graph.functions[0].expression} viewport={graph.viewport} initialX={graph.linkedDerivative.initialX} /></div>;
  return <div className="mt-5"><MathGraph title={graph.title} description={graph.description} viewport={graph.viewport} functions={graph.functions} axes={graph.axes} boundaries={graph.boundaries} regions={graph.regions} points={graph.keyPoints} /></div>;
}

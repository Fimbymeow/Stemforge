import { MathGraph } from "@/components/maths/math-graph";
import { graphVisualFixtures } from "@/lib/maths/graph-fixtures";

export function GraphVisualFixturesPage() {
  return <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8"><div><h1 className="text-3xl font-extrabold">Mathematical graph fixtures</h1><p className="mt-2 text-muted">Internal visual verification for deterministic prompt and reference graphs.</p></div>{graphVisualFixtures.map((graph) => <MathGraph key={graph.title} title={graph.title} description={graph.description} viewport={graph.viewport} functions={graph.functions} axes={graph.axes} boundaries={graph.boundaries} regions={graph.regions} points={graph.keyPoints} />)}</main>;
}

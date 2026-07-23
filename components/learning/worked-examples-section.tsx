import { Layers3 } from "lucide-react";
import { Card } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import type { WorkedExample } from "@/data/types";

export function WorkedExamplesSection({ examples }: { examples?: WorkedExample[] }) {
  if (!examples?.length) return null;

  return (
    <section>
      <h2 className="m-0 text-3xl font-extrabold">Worked Examples</h2>
      <p className="mt-2 text-muted">See the method before moving into questions.</p>
      <div className="mt-6 grid gap-5">
        {examples.map((example) => (
          <WorkedExampleCard key={example.id} example={example} />
        ))}
      </div>
    </section>
  );
}

export function WorkedExampleCard({ example }: { example: WorkedExample }) {
  return (
    <Card className="p-7">
      <span className="mb-5 grid size-12 place-items-center rounded-xl bg-forge-soft text-forge">
        <Layers3 className="size-6" />
      </span>
      <h3 className="m-0 text-2xl font-extrabold">{example.title}</h3>
      <div className="mt-4 rounded-xl border border-line bg-paper p-4">
        <MathContent>{example.prompt}</MathContent>
      </div>
      <div className="mt-5 grid gap-3">
        {example.steps.map((step, index) => (
          <div key={`${example.id}-step-${index}`} className="grid grid-cols-[32px_1fr] gap-3 rounded-xl border border-line bg-paper p-4">
            <span className="grid size-8 place-items-center rounded-full bg-forge-soft text-sm font-extrabold text-forge">
              {index + 1}
            </span>
            <MathContent>{step}</MathContent>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-line bg-white p-4">
        <p className="mb-2 text-sm font-bold uppercase text-muted">Final answer</p>
        <MathContent>{example.finalAnswer}</MathContent>
      </div>
      <div className="mt-4 text-muted">
        <MathContent>{example.explanation}</MathContent>
      </div>
      {example.commonMistake ? (
        <div className="mt-4 rounded-xl border border-forge-soft bg-forge-soft p-4 text-ink">
          <p className="mb-2 font-extrabold text-ink">Common mistake</p>
          <MathContent>{example.commonMistake}</MathContent>
        </div>
      ) : null}
    </Card>
  );
}

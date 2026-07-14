import { Card } from "@/components/ui";
import { SectionShell } from "./section-shell";

const steps = [
  ["Learn", "Build understanding through focused topic practice."],
  ["Practise", "Build fluency with guided questions and useful support."],
  ["Exam Questions", "Apply your knowledge to original SQA-style practice."],
  ["Master", "Track progress, learn from mistakes and reach mastery."],
] as const;

export function HowItWorks() {
  return (
    <SectionShell kicker="How STEM Forge works" title="Learn. Practise. Exam Questions. Master.">
      <div className="grid grid-cols-4 gap-6 max-lg:grid-cols-1">
        {steps.map(([step, copy], index) => (
          <Card key={step} className="p-8 text-center">
            <span className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-forge font-extrabold text-white">
              {index + 1}
            </span>
            <h3 className="m-0 text-2xl font-extrabold">{step}</h3>
            <p className="mt-3 text-muted">{copy}</p>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}


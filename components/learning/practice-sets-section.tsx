import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import type { PracticeSet } from "@/data/types";

export function PracticeSetsSection({ practiceSets }: { practiceSets?: PracticeSet[] }) {
  if (!practiceSets?.length) return null;

  return (
    <section>
      <h2 className="m-0 text-3xl font-extrabold">Practice Sets</h2>
      <p className="mt-2 text-muted">Focused sets that connect the notes to the question workspace.</p>
      <div className="mt-6 grid gap-5">
        {practiceSets.map((practiceSet) => (
          <PracticeSetCard key={practiceSet.id} practiceSet={practiceSet} />
        ))}
      </div>
    </section>
  );
}

export function PracticeSetCard({ practiceSet }: { practiceSet: PracticeSet }) {
  return (
    <Card className="p-6">
      <div className="grid grid-cols-[1fr_auto] items-center gap-5 max-md:grid-cols-1">
        <div>
          <h3 className="m-0 text-xl font-extrabold">{practiceSet.title}</h3>
          <div className="mt-3 text-muted">
            <MathContent>{practiceSet.description}</MathContent>
          </div>
          <p className="mt-4 text-sm font-bold text-muted">
            {practiceSet.questionCount} questions - {practiceSet.estimatedMinutes} min - {practiceSet.stage}
          </p>
        </div>
        <Link href={practiceSet.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 font-extrabold text-white">
          Start set
          <ArrowRight className="size-5" />
        </Link>
      </div>
    </Card>
  );
}

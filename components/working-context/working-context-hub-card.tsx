"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";
import { MasteryMark } from "@/components/learning/mastery-badge";

export function WorkingContextHubCard({ pathId }: { pathId: string | null }) {
  const model = useWorkingContextModel(pathId);
  if (!model) return null;
  const activeStage = model.stages.find((stage) => stage.name === model.stageName);

  return (
    <Card aria-label="Learn" className="border-forge/30 p-4" data-testid="working-context-hub">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 max-md:grid-cols-1">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Continue learning</p>
          <h3 className="mt-1 text-xl font-extrabold">
            <Link href={model.overviewHref} className="rounded-sm underline decoration-line decoration-[1.5px] underline-offset-[3px] hover:text-forge hover:decoration-forge">{model.skillName}</Link>
          </h3>
          <p className="mt-1 text-sm font-bold text-muted">{model.stageName} · {activeStage?.completed ?? 0}/{activeStage?.total ?? 0} complete</p>
          <div className="mt-2 grid max-w-2xl gap-2">
            <ProgressBar value={model.completionPercentage} />
            <MasteryMark status={model.status} density="labelled" />
          </div>
        </div>
        <div className="flex min-w-[210px] flex-col justify-center gap-1 max-md:min-w-0">
          <Link href={model.primaryHref} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-forge px-5 text-sm font-extrabold text-white">
            {model.primaryLabel}<ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link href={model.overviewHref} className="inline-flex min-h-10 items-center justify-center text-sm font-bold text-forge">View skill overview</Link>
        </div>
      </div>
    </Card>
  );
}

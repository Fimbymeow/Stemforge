"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, LayoutList, Target } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";
import { formatProgressStatusLabel } from "@/components/learning/mastery-badge";

export function WorkingContextHubCard({ pathId }: { pathId: string | null }) {
  const model = useWorkingContextModel(pathId);
  if (!model) return null;

  return (
    <Card aria-label="Learn" className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-5 md:p-6" data-testid="working-context-hub">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(230px,auto)] items-stretch gap-6 max-md:grid-cols-1">
        <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-4 max-sm:grid-cols-1">
          <span className="grid size-16 place-items-center rounded-xl bg-forge-soft text-forge max-sm:h-14 max-sm:w-full">
            <Target aria-hidden="true" className="size-7" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Learn · Higher Maths</p>
            <h3 className="mt-1 text-2xl font-extrabold">
              <Link href={model.overviewHref} className="rounded-sm underline decoration-line decoration-[1.5px] underline-offset-[3px] hover:text-forge hover:decoration-forge">{model.skillName}</Link>
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{model.nextActionReason}</p>
            <div className="mt-4 grid max-w-2xl gap-2">
              <div className="flex flex-wrap justify-between gap-2 text-sm font-bold text-muted">
                <span>{model.completed} / {model.total} completed</span>
                <span>{model.completionPercentage}% complete</span>
              </div>
              <ProgressBar value={model.total ? (model.completed / model.total) * 100 : 0} />
              {model.isComplete ? (
                <p className="text-sm font-bold text-muted">Path complete. <span className="text-forge">{formatProgressStatusLabel(model.status)}</span></p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-[230px] flex-col justify-center gap-2 border-l border-forge/20 pl-6 max-md:min-w-0 max-md:border-l-0 max-md:border-t max-md:pt-4 max-md:pl-0">
          <Link href={model.primaryHref} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-forge px-5 text-sm font-extrabold text-white">
            {model.primaryLabel}<ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <div className="grid grid-cols-2 gap-2">
            {model.notesHref ? <Link href={model.notesHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-extrabold text-ink">
              <BookOpen aria-hidden="true" className="size-4" /> Notes
            </Link> : null}
            <Link href={model.overviewHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-extrabold text-ink">
              <LayoutList aria-hidden="true" className="size-4" /> Overview
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

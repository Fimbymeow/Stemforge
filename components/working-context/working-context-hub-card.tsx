"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Target } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";
import { formatProgressStatusLabel } from "@/components/learning/mastery-badge";

export function WorkingContextHubCard({ pathId }: { pathId: string }) {
  const model = useWorkingContextModel(pathId);
  if (!model) return null;

  return (
    <Card aria-label="Learn" className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-5" data-testid="working-context-hub">
      <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 max-md:grid-cols-1">
        <span className="grid size-16 place-items-center rounded-xl bg-forge-soft text-forge max-md:h-14 max-md:w-full">
          <Target aria-hidden="true" className="size-7" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Learn · Recommended</p>
          <h3 className="mt-1 text-2xl font-extrabold">
            <Link href={model.overviewHref} className="rounded-sm hover:text-forge">{model.skillName}</Link>
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{model.nextActionReason}</p>
          <div className="mt-4 grid max-w-lg gap-2">
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
      <div className="mt-5 flex flex-wrap gap-2 border-t border-forge/20 pt-4">
        <Link href={model.primaryHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 text-sm font-extrabold text-white max-md:w-full">
          {model.primaryLabel}<ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        {model.notesHref ? <Link href={model.notesHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-extrabold text-ink max-md:flex-1">
          <BookOpen aria-hidden="true" className="size-4" /> Notes
        </Link> : null}
        <Link href={model.practiceHref} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-extrabold text-ink max-md:flex-1">Practice</Link>
        {model.reviewHref ? <Link href={model.reviewHref} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-extrabold text-forge max-md:flex-1">Review {model.reviewCount} question due</Link> : null}
        <Link href={model.overviewHref} className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-bold text-muted max-md:w-full">View full overview</Link>
      </div>
    </Card>
  );
}

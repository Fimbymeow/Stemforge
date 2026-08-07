"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { LocalProgressControls, LocalRecommendedNextAction } from "@/components/learning/local-skill-path-progress";
import { formatProgressStatusLabel } from "@/components/learning/mastery-badge";
import { Card, ProgressBar } from "@/components/ui";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";
import { contentResolver } from "@/lib/content-resolver";
import { formatReviewDueLabel } from "@/lib/working-context";

export function WorkingContextOverview({ pathId }: { pathId: string }) {
  const model = useWorkingContextModel(pathId);
  if (!model) return null;
  const skillPath = contentResolver.getPathContext(pathId)?.skillPath;

  return (
    <AppShell demo active="Current Path" workingContextPathId={pathId}>
      <div className="mx-auto grid max-w-[1040px] gap-5">
        <header data-testid="skill-path-compact-header">
          <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-muted">
            <Link href={model.higherMathsHref}>Higher Maths</Link><span aria-hidden="true">/</span>
            <span>Calculus</span><span aria-hidden="true">/</span><span>Differentiating functions</span>
          </nav>
          <h1 className="mt-3 text-[32px] font-extrabold leading-none">{model.skillName}</h1>
          <div className="mt-4 grid gap-2" data-testid="skill-path-hero-progress">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-muted">
              <span>{model.completed} of {model.total} questions complete</span>
              <span data-testid="path-mastery-status">{formatProgressStatusLabel(model.status)} · {model.progressSummary}</span>
            </div>
            <ProgressBar value={model.completionPercentage} />
          </div>
        </header>

        <section aria-labelledby="stages" className="grid gap-3">
          <div>
            <h2 id="stages" tabIndex={-1} className="text-xl font-extrabold">Learning stages</h2>
            <p className="mt-1 text-sm text-muted">Learn it in Notes, build confidence in Foundations, apply it in harder questions, then practise exam-style questions — Review keeps it fresh afterwards.</p>
          </div>
          <div className="grid auto-rows-fr grid-cols-3 items-stretch gap-3 max-md:grid-cols-1">
            {model.stages.map((stage) => {
              const isCurrent = stage.name === model.stageName;
              const isStageComplete = stage.total > 0 && stage.completed >= stage.total;
              const displayName = stage.name === "Past Paper-style Questions" ? "Exam practice (PPQ)" : stage.name;
              const statusLabel = isCurrent
                ? "Current stage"
                : isStageComplete
                  ? "Complete"
                  : stage.completed > 0
                    ? "In progress"
                    : "Available";
              const actionLabel = stage.total === 0
                ? null
                : isCurrent
                  ? model.primaryLabel
                  : isStageComplete
                    ? (stage.reviewDue ? "Review now" : "Revisit")
                    : "Start";
              return (
                <Card key={stage.id} className={`flex h-full flex-col p-4 shadow-none ${isCurrent ? "border-forge/40 bg-forge-soft" : ""}`} data-recommended={isCurrent ? "true" : undefined}>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-muted">{statusLabel}</p>
                  <h3 className="mt-1 font-extrabold">{displayName}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{stage.description}</p>
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-bold text-muted">{stage.completed} / {stage.total} complete</p>
                    <ProgressBar value={stage.total ? (stage.completed / stage.total) * 100 : 0} />
                  </div>
                  {actionLabel ? (
                    <Link href={isCurrent && model.primaryHref !== model.notesHref ? model.primaryHref : stage.href} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-extrabold text-ink">
                      {actionLabel}
                    </Link>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>

        {model.isComplete && skillPath ? <LocalRecommendedNextAction skillPath={skillPath} hidePrimaryAction={Boolean(model.reviewHref)} secondaryStagesHref="#stages" /> : null}

        <nav aria-label="Skill resources" className="flex flex-wrap gap-1 border-y border-line py-2">
          {model.notesHref ? <Link href={model.notesHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Notes</Link> : null}
          <Link href={model.practiceHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Practice</Link>
          <Link href={model.questionBankHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Browse Questions</Link>
          {model.reviewHref ? <Link href={model.reviewHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold text-forge hover:bg-forge-soft">{formatReviewDueLabel(model.reviewCount)}</Link> : null}
        </nav>
        {skillPath ? <LocalProgressControls skillPath={skillPath} /> : null}
        <Link href={model.higherMathsHref} className="inline-flex min-h-10 items-center px-3 text-sm font-bold text-forge">Back to Higher Maths</Link>
      </div>
    </AppShell>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
      <div className="mx-auto grid max-w-[880px] gap-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-muted">
          <Link href={model.higherMathsHref}>Higher Maths</Link><span aria-hidden="true">/</span>
          <span>Calculus</span><span aria-hidden="true">/</span><span>Differentiating functions</span>
        </nav>
        <header className="rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Skill overview</p>
          <h1 className="mt-2 text-[32px] font-extrabold leading-none">{model.skillName}</h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">Work through Foundations, Applications, then exam practice. Your next useful step stays at the top.</p>
          <div className="mt-5 grid max-w-xl gap-2" data-testid="skill-path-hero-progress">
            <div className="flex flex-wrap justify-between gap-2 text-sm font-bold text-muted">
              <span>{model.completed} of {model.total} questions complete</span><span>{model.progressSummary}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2" data-testid="path-mastery-status">
              <strong>{formatProgressStatusLabel(model.status)}</strong><span className="text-sm font-bold text-muted">{model.total} Questions</span>
            </div>
            <ProgressBar value={model.completionPercentage} />
          </div>
          <Link href={model.primaryHref} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 font-extrabold text-white max-sm:w-full">
            {model.primaryLabel}<ArrowRight aria-hidden="true" className="size-5" />
          </Link>
        </header>

        {model.isComplete && skillPath ? <LocalRecommendedNextAction skillPath={skillPath} hidePrimaryAction secondaryStagesHref="#stages" /> : null}

        <section aria-labelledby="stages" className="grid gap-3">
          <div>
            <h2 id="stages" tabIndex={-1} className="text-xl font-extrabold">Learning stages</h2>
            <p className="mt-1 text-sm text-muted">A compact route from core ideas to exam-style questions.</p>
          </div>
          <div className="grid grid-cols-3 items-start gap-3 max-md:grid-cols-1">
          {model.stages.map((stage) => {
            const isCurrent = stage.name === model.stageName;
            const isStageComplete = stage.total > 0 && stage.completed >= stage.total;
            const displayName = stage.name === "Past Paper-style Questions" ? "Exam practice (PPQ)" : stage.name;
            const actionLabel = stage.total === 0
              ? null
              : isStageComplete
                ? (stage.reviewDue ? "Review now" : "Revisit")
                : isCurrent
                  ? model.primaryLabel
                  : "Start";
            return (
              <Card key={stage.id} className={`self-start p-4 shadow-none ${isCurrent ? "border-forge/40 bg-forge-soft" : ""}`} data-recommended={isCurrent ? "true" : undefined}>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-muted">{isCurrent ? "Current stage" : isStageComplete ? "Complete" : "Next stage"}</p>
                  <h3 className="mt-1 font-extrabold">{displayName}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-muted max-md:min-h-0">{stage.description}</p>
                  <p className="mt-3 text-sm font-bold text-muted">{stage.completed} / {stage.total} complete</p>
                  <ProgressBar value={stage.total ? (stage.completed / stage.total) * 100 : 0} />
                  {actionLabel ? (
                    <Link href={stage.href} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-extrabold text-ink">
                      {actionLabel}
                    </Link>
                  ) : null}
              </Card>
            );
          })}
          </div>
        </section>
        <nav aria-label="Skill resources" className="flex flex-wrap gap-2 rounded-xl border border-line bg-white p-3">
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

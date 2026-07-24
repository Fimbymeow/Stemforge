"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LocalProgressControls, LocalRecommendedNextAction } from "@/components/learning/local-skill-path-progress";
import { formatProgressStatusLabel } from "@/components/learning/mastery-badge";
import { Card, ProgressBar } from "@/components/ui";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";
import { contentResolver } from "@/lib/content-resolver";

export function WorkingContextOverview({ pathId }: { pathId: string }) {
  const model = useWorkingContextModel(pathId);
  if (!model) return null;
  const skillPath = contentResolver.getPathContext(pathId)?.skillPath;

  return (
    <AppShell demo active="Current Path" workingContextPathId={pathId}>
      <div className="mx-auto grid max-w-[920px] gap-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-muted">
          <Link href={model.higherMathsHref}>Higher Maths</Link><span aria-hidden="true">/</span>
          <span>Calculus</span><span aria-hidden="true">/</span><span>Differentiating functions</span>
        </nav>
        <header className="rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
          <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Skill overview</p>
          <h1 className="mt-2 text-[32px] font-extrabold leading-none">{model.skillName}</h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">Start with the power rule, constants, sums of powers, and simple derivative evaluation.</p>
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

        {model.isComplete && skillPath ? <LocalRecommendedNextAction skillPath={skillPath} /> : null}

        <section aria-labelledby="working-context-stages" className="grid gap-2">
          <h2 id="working-context-stages" className="text-xl font-extrabold">Stages</h2>
          {model.stages.map((stage) => (
            <Card key={stage.id} className="p-4 shadow-none" data-recommended={stage.name === model.stageName ? "true" : undefined}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 max-sm:grid-cols-1">
                <div>
                  <h3 className="font-extrabold">{stage.name}</h3>
                  <p className="mt-1 text-sm text-muted">{stage.description}</p>
                  <p className="mt-2 text-sm font-bold text-muted">{stage.completed} / {stage.total} complete</p>
                </div>
                <Link href={stage.href} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-extrabold text-ink">
                  {stage.completed >= stage.total ? `Review ${stage.name}` : stage.name === model.stageName ? model.primaryLabel : `Explore ${stage.name}`}
                </Link>
              </div>
            </Card>
          ))}
        </section>
        <nav aria-label="Skill resources" className="flex flex-wrap gap-2 rounded-xl border border-line bg-white p-3">
          {model.notesHref ? <Link href={model.notesHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Notes</Link> : null}
          <Link href={model.practiceHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Practice</Link>
          <Link href={model.questionBankHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Browse Questions</Link>
          {model.reviewHref ? <Link href={model.reviewHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold text-forge hover:bg-forge-soft">Review {model.reviewCount} question due</Link> : null}
        </nav>
        {skillPath ? <LocalProgressControls skillPath={skillPath} /> : null}
        <Link href={model.higherMathsHref} className="inline-flex min-h-10 items-center px-3 text-sm font-bold text-forge">Back to Higher Maths</Link>
      </div>
    </AppShell>
  );
}

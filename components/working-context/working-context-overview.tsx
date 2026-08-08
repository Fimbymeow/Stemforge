"use client";

import Link from "next/link";
import { BookOpen, Check, Circle, Clock3 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LocalProgressControls, LocalRecommendedNextAction } from "@/components/learning/local-skill-path-progress";
import { formatProgressStatusLabel } from "@/components/learning/mastery-badge";
import { ProgressBar } from "@/components/ui";
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
          {skillPath?.description ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{skillPath.description}</p> : null}
          <div className="mt-4 grid gap-2" data-testid="skill-path-hero-progress">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-muted">
              <span>{model.completed} of {model.total} questions complete</span>
              <span data-testid="path-mastery-status">{formatProgressStatusLabel(model.status)}</span>
            </div>
            <ProgressBar value={model.completionPercentage} />
          </div>
        </header>

        <SkillLearningJourney model={model} />

        {model.isComplete && skillPath ? <LocalRecommendedNextAction skillPath={skillPath} hidePrimaryAction={Boolean(model.reviewHref)} secondaryStagesHref="#stages" /> : null}

        <nav aria-label="Skill resources" className="flex flex-wrap gap-1 border-y border-line py-2">
          {model.notesHref ? <Link href={model.notesHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Notes</Link> : null}
          <Link href={model.practiceHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Practice</Link>
          <Link href={model.questionBankHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Browse Questions</Link>
          {model.mistakesHref ? <Link href={model.mistakesHref} data-testid="skill-mistakes-link" className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold text-forge hover:bg-forge-soft">{model.openMistakeCount} unresolved mistake{model.openMistakeCount === 1 ? "" : "s"}</Link> : null}
          {model.reviewHref ? <Link href={model.reviewHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold text-forge hover:bg-forge-soft">{formatReviewDueLabel(model.reviewCount)}</Link> : null}
        </nav>
        {skillPath ? <LocalProgressControls skillPath={skillPath} compact /> : null}
        <Link href={model.higherMathsHref} className="inline-flex min-h-10 items-center px-3 text-sm font-bold text-forge">Back to Higher Maths</Link>
      </div>
    </AppShell>
  );
}

function SkillLearningJourney({ model }: { model: NonNullable<ReturnType<typeof useWorkingContextModel>> }) {
  const reviewIsCurrent = model.isComplete && Boolean(model.reviewHref);

  return (
    <section aria-labelledby="stages" className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="stages" tabIndex={-1} className="text-xl font-extrabold">Your learning journey</h2>
          <p className="mt-1 text-sm text-muted">Move through the lesson and three practice stages. Review keeps the skill fresh afterwards.</p>
        </div>
        {!model.isComplete ? <p className="text-sm font-bold text-forge">Next: {displayStageName(model.stageName)}</p> : null}
      </div>

      <ol data-testid="skill-learning-journey" className="grid overflow-hidden rounded-xl border border-line bg-white md:grid-cols-5">
        <JourneyStep
          kind="notes"
          title="Notes"
          status="available"
          statusLabel="Available anytime"
          href={model.notesHref}
          actionLabel="Open Notes"
          icon={BookOpen}
        />
        {model.stages.map((stage) => {
          const complete = stage.total > 0 && stage.completed >= stage.total;
          const current = !model.isComplete && stage.name === model.stageName;
          const state = complete ? "complete" : current ? "current" : stage.completed > 0 ? "current" : "future";
          const statusLabel = complete
            ? "Complete"
            : current
              ? `${stage.completed} of ${stage.total} complete`
              : stage.completed > 0
                ? `${stage.completed} of ${stage.total} complete`
                : "Not started";
          return (
            <JourneyStep
              key={stage.id}
              kind="stage"
              title={displayStageName(stage.name)}
              status={state}
              statusLabel={statusLabel}
              href={current && model.primaryHref !== model.notesHref ? model.primaryHref : stage.href}
              actionLabel={current ? model.primaryLabel : complete ? "Revisit" : "Start"}
              icon={complete ? Check : Circle}
            />
          );
        })}
        <JourneyStep
          kind="review"
          title="Review"
          status={reviewIsCurrent ? "due" : model.isComplete ? "available" : "future"}
          statusLabel={reviewIsCurrent ? formatReviewDueLabel(model.reviewCount) : model.isComplete ? "Not due" : "After learning"}
          href={model.reviewHref}
          actionLabel={reviewIsCurrent ? "Start Review" : null}
          icon={Clock3}
          note="Keeps learning fresh"
        />
      </ol>
    </section>
  );
}

type JourneyState = "available" | "complete" | "current" | "due" | "future";

function JourneyStep({
  kind,
  title,
  status,
  statusLabel,
  href,
  actionLabel,
  icon: Icon,
  note,
}: {
  kind: "notes" | "stage" | "review";
  title: string;
  status: JourneyState;
  statusLabel: string;
  href: string | null;
  actionLabel: string | null;
  icon: typeof Circle;
  note?: string;
}) {
  const isCurrent = status === "current" || status === "due";
  const iconClass = status === "complete"
    ? "border-success bg-success text-white"
    : isCurrent
      ? "border-forge bg-forge text-white"
      : "border-line bg-paper text-muted";

  return (
    <li
      data-journey-kind={kind}
      data-journey-state={status}
      data-recommended={isCurrent ? "true" : undefined}
      aria-current={isCurrent ? "step" : undefined}
      className={`relative flex min-w-0 flex-col border-line p-4 max-md:grid max-md:grid-cols-[2rem_minmax(0,1fr)_auto] max-md:items-center max-md:gap-x-3 max-md:border-b max-md:py-3 max-md:last:border-b-0 md:border-r md:last:border-r-0 ${isCurrent ? "bg-forge-soft" : ""} ${kind === "review" ? "md:border-l md:border-l-dashed" : ""}`}
    >
      <span aria-hidden="true" className={`grid size-8 place-items-center rounded-full border ${iconClass}`}>
        <Icon className="size-4" strokeWidth={2.5} />
      </span>
      <h3 className="mt-3 font-extrabold leading-tight max-md:mt-0">{title}</h3>
      <p className={`mt-1 text-xs font-bold max-md:col-start-2 max-md:mt-0 ${isCurrent ? "text-forge" : "text-muted"}`}>{statusLabel}</p>
      {note ? <p className="mt-1 text-xs leading-relaxed text-muted max-md:col-start-2">{note}</p> : null}
      {href && actionLabel ? (
        <Link
          href={href}
          className={`mt-3 inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-extrabold max-md:col-start-3 max-md:row-span-2 max-md:row-start-1 max-md:mt-0 max-md:min-w-20 ${isCurrent ? "bg-forge text-white" : "border border-line bg-white text-ink hover:border-forge hover:text-forge"}`}
        >
          {actionLabel}
        </Link>
      ) : null}
    </li>
  );
}

function displayStageName(name: string) {
  return name === "Past Paper-style Questions" ? "Exam practice" : name;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, ChevronDown, Circle, Clock3 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ConfidenceControl } from "@/components/confidence/confidence-control";
import { useLearnerConfidence } from "@/components/confidence/use-learner-confidence";
import { LocalProgressControls, LocalRecommendedNextAction } from "@/components/learning/local-skill-path-progress";
import { MasteryMark } from "@/components/learning/mastery-badge";
import { getReviewPresentationState } from "@/components/learning/review-status";
import { ProgressBar } from "@/components/ui";
import { useWorkingContextModel } from "@/components/working-context/use-working-context-model";
import { contentResolver } from "@/lib/content-resolver";
import { deriveSkillConfidenceSuggestion, getHigherMathsSkillOfficialPoints } from "@/lib/course-tracker";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import type { ProgressEvidence } from "@/lib/progress/types";

export function WorkingContextOverview({ pathId }: { pathId: string }) {
  const model = useWorkingContextModel(pathId);
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  useEffect(() => {
    const update = () => setEvidence(getProgressEvidence());
    update();
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("stemforge:progress-sync-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("stemforge:progress-sync-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const confidence = useLearnerConfidence();
  const context = contentResolver.getPathContext(pathId);
  const skillPath = context?.skillPath;
  const subjectSlug = context?.subject.subjectSlug;
  const confidenceEvidence = useMemo(
    () => subjectSlug ? deriveSkillConfidenceSuggestion(pathId, subjectSlug, evidence) : null,
    [pathId, subjectSlug, evidence],
  );
  const officialPoints = useMemo(() => getHigherMathsSkillOfficialPoints(pathId), [pathId]);
  if (!model) return null;

  return (
    <AppShell demo active="Current Path" workingContextPathId={pathId}>
      <div className="mx-auto grid max-w-[1040px] gap-5">
        <header data-testid="skill-path-compact-header">
          <Link href={model.higherMathsHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forge"><ArrowLeft aria-hidden="true" className="size-4" />Higher Maths</Link>
          {context ? (
            <nav aria-label="Breadcrumb" className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
              <span>{context.courseArea.name}</span><span aria-hidden="true">/</span><span>{context.specificationStrand.name}</span>
            </nav>
          ) : null}
          <h1 className="mt-2 text-[28px] font-extrabold leading-tight">{model.skillName}</h1>
          {skillPath?.description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{skillPath.description}</p> : null}
          <div className="mt-3 grid gap-2" data-testid="skill-path-hero-progress">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-muted">
              <span>{model.completed} of {model.total} questions complete</span>
              <MasteryMark status={model.status} density="labelled" className="text-ink" />
            </div>
            <ProgressBar value={model.completionPercentage} />
          </div>
          {model.needsAttention ? (
            <p className="mt-3 text-sm font-semibold text-muted" data-testid="skill-attention-reason">{model.attentionDetail}</p>
          ) : null}
          {confidenceEvidence ? (
            <ConfidenceControl
              skillPathId={pathId}
              skillName={model.skillName}
              confidence={confidence}
              suggestion={confidenceEvidence.suggestion}
              evidenceFingerprint={confidenceEvidence.evidenceFingerprint}
              variant="detailed"
              className="mt-4"
            />
          ) : null}
        </header>

        <SkillLearningJourney model={model} />

        {officialPoints.length > 0 ? (
          <details className="group/requirements disclosure-motion border-t border-line text-sm text-muted" data-testid="skill-official-requirements">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2 font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge">
              <span>Official requirements ({officialPoints.length})</span>
              <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open/requirements:rotate-180" />
            </summary>
            <ul className="grid gap-2 border-l-2 border-line pb-3 pl-3 leading-relaxed">
              {officialPoints.map((point) => (
                <li key={point.id} data-testid="skill-official-requirement" data-official-point-id={point.id}>
                  <span className="font-bold text-ink">{point.reference}:</span> {point.text}
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {model.isComplete && skillPath ? <LocalRecommendedNextAction skillPath={skillPath} hidePrimaryAction={Boolean(model.reviewHref)} secondaryStagesHref="#stages" /> : null}

        <nav aria-label="Skill resources" className="flex flex-wrap gap-1 border-y border-line py-2">
          <Link href={model.practiceHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Practice</Link>
          <Link href={model.questionBankHref} className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold hover:bg-forge-soft">Browse Questions</Link>
          {model.mistakesHref ? <Link href={model.mistakesHref} data-testid="skill-mistakes-link" className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold text-forge hover:bg-forge-soft">Open Mistake Log</Link> : null}
        </nav>
        {skillPath ? <LocalProgressControls skillPath={skillPath} compact /> : null}
      </div>
    </AppShell>
  );
}

function SkillLearningJourney({ model }: { model: NonNullable<ReturnType<typeof useWorkingContextModel>> }) {
  const reviewIsCurrent = model.isComplete && Boolean(model.reviewHref);
  const reviewState = getReviewPresentationState({ eligible: model.reviewEligible, due: Boolean(model.reviewHref), dueSoon: model.reviewDueSoon });

  return (
    <section aria-labelledby="stages" className="grid gap-3">
      <div>
        <div>
          <h2 id="stages" tabIndex={-1} className="text-xl font-extrabold">Your learning journey</h2>
          <p className="mt-1 text-sm text-muted">Move through the lesson and three practice stages. Review keeps the skill fresh afterwards.</p>
        </div>
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
          status={reviewIsCurrent ? "due" : "review"}
          statusLabel={reviewIsCurrent ? "Due now" : reviewState === "recommended" ? "Recommended" : reviewState === "available" ? "Available" : "Available anytime"}
          href={model.reviewActionHref}
          actionLabel={reviewIsCurrent ? "Start Review" : "Review"}
          icon={Clock3}
        />
      </ol>
    </section>
  );
}

type JourneyState = "available" | "complete" | "current" | "due" | "review" | "future";

function JourneyStep({
  kind,
  title,
  status,
  statusLabel,
  href,
  actionLabel,
  icon: Icon,
}: {
  kind: "notes" | "stage" | "review";
  title: string;
  status: JourneyState;
  statusLabel: string;
  href: string | null;
  actionLabel: string | null;
  icon: typeof Circle;
}) {
  const isCurrent = status === "current" || status === "due";
  const iconClass = status === "complete"
    ? "border-success bg-success text-white"
    : isCurrent
      ? "border-forge bg-white text-forge"
      : "border-line bg-paper text-muted";

  return (
    <li
      data-journey-kind={kind}
      data-journey-state={status}
      data-recommended={isCurrent ? "true" : undefined}
      aria-current={isCurrent ? "step" : undefined}
      className={`relative flex min-w-0 flex-col border-line p-4 max-md:grid max-md:grid-cols-[2rem_minmax(0,1fr)_auto] max-md:items-center max-md:gap-x-3 max-md:border-b max-md:py-3 max-md:last:border-b-0 md:border-r md:last:border-r-0 ${isCurrent ? "after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-forge" : ""} ${kind === "review" ? "md:border-l md:border-l-dashed" : ""}`}
    >
      <span aria-hidden="true" className={`grid size-8 place-items-center rounded-full border ${iconClass}`}>
        <Icon className="size-4" strokeWidth={2.5} />
      </span>
      <h3 className="mt-3 font-extrabold leading-tight max-md:mt-0">{title}</h3>
      <p className={`mt-1 text-xs font-bold max-md:col-start-2 max-md:mt-0 ${isCurrent ? "text-forge" : "text-muted"}`}>{statusLabel}</p>
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

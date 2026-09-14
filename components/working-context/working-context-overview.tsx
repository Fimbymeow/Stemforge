"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock3 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ConfidenceControl } from "@/components/confidence/confidence-control";
import { useLearnerConfidence } from "@/components/confidence/use-learner-confidence";
import { LocalProgressControls, LocalRecommendedNextAction } from "@/components/learning/local-skill-path-progress";
import { MasteryMark } from "@/components/learning/mastery-badge";
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
    <AppShell demo active="Current Path" workingContextPathId={pathId} feedbackPlacement="inline-mobile" className="!px-10 py-8 max-md:!px-4 max-lg:pt-5">
      <div className="mx-auto grid min-w-0 max-w-[1120px] gap-8 pb-8" data-testid="skill-page-design-v2">
        <div className="border-b border-rule pb-3">
          <Link href={model.higherMathsHref} className="orthic-secondary-link inline-flex min-h-11 items-center gap-2 text-sm text-secondary"><ArrowLeft aria-hidden="true" className="size-4" />Higher Maths</Link>
          {context ? (
            <nav aria-label="Breadcrumb" className="mt-1 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-secondary">
              <span>{context.courseArea.name}</span><span aria-hidden="true">/</span><span>{context.specificationStrand.name}</span>
            </nav>
          ) : null}
        </div>
        <header data-testid="skill-path-compact-header" className="grid min-w-0 grid-cols-[minmax(0,1fr)_320px] items-start gap-8 rounded-sm border border-rule bg-white p-7 max-lg:grid-cols-[minmax(0,1fr)_280px] max-md:grid-cols-1 max-sm:gap-6 max-sm:p-5">
          <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-secondary">Skill</p>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight text-navy max-sm:text-[28px]">{model.skillName}</h1>
          {skillPath?.description ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-secondary">{skillPath.description}</p> : null}
          <div className="mt-6 grid gap-3" data-testid="skill-path-hero-progress">
            <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
              <span>{model.completed} of {model.total} questions complete</span>
              <MasteryMark status={model.status} density="labelled" className="text-ink" />
            </div>
            <div role="progressbar" aria-label="Skill learning progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={model.completionPercentage} className="h-1.5 max-w-lg overflow-hidden rounded-sm bg-rule"><span className="block h-full bg-navy" style={{ width: `${model.completionPercentage}%` }} /></div>
          </div>
          {model.needsAttention ? (
            <p className="mt-3 text-sm font-semibold text-muted" data-testid="skill-attention-reason">{model.attentionDetail}</p>
          ) : null}
          <p className="mt-3 text-sm text-secondary">{model.isComplete ? "All learning stages complete" : `Current stage: ${displayStageName(model.stageName)}`}</p>
          </div>
          <div className="min-w-0 rounded-sm border border-rule bg-paper p-4">
          {confidenceEvidence ? (
            <ConfidenceControl
              skillPathId={pathId}
              skillName={model.skillName}
              confidence={confidence}
              suggestion={confidenceEvidence.suggestion}
              evidenceFingerprint={confidenceEvidence.evidenceFingerprint}
              variant="detailed"
            />
          ) : null}
          <Link href={model.primaryHref} data-testid="skill-primary-action" className="orthic-primary-action mt-4 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-sm bg-navy px-4 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy">{model.primaryLabel}<ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
          </div>
        </header>

        <SkillLearningJourney model={model} />

        {officialPoints.length > 0 ? (
          <details className="group/requirements disclosure-motion text-sm text-secondary motion-reduce:[&::details-content]:!transition-none motion-reduce:[&::details-content]:!duration-0" data-testid="skill-official-requirements">
            <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center justify-between gap-3 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
              <h2 className="text-lg font-semibold text-navy">Qualifications Scotland specification</h2><span className="ml-auto text-xs">{officialPoints.length} mapped outcome{officialPoints.length === 1 ? "" : "s"}</span>
              <ChevronDown aria-hidden="true" className="size-4 group-open/requirements:rotate-180" />
            </summary>
            <ul className="divide-y divide-rule pb-3 leading-relaxed">
              {officialPoints.map((point) => (
                <li key={point.id} data-testid="skill-official-requirement" data-official-point-id={point.id} className="py-3">
                  <span className="mb-1 block text-xs text-secondary">{point.reference}</span><span className="text-navy">{point.text}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {model.isComplete && skillPath ? <LocalRecommendedNextAction skillPath={skillPath} hidePrimaryAction={Boolean(model.reviewHref)} secondaryStagesHref="#stages" editorial /> : null}

        <nav aria-label="Skill resources" className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-secondary">
          <Link href={model.practiceHref} className="orthic-secondary-link inline-flex min-h-11 items-center">Practice</Link>
          <Link href={model.questionBankHref} className="orthic-secondary-link inline-flex min-h-11 items-center">Browse Questions</Link>
          {model.mistakesHref ? <Link href={model.mistakesHref} data-testid="skill-mistakes-link" className="orthic-secondary-link inline-flex min-h-11 items-center">Open Mistake Log</Link> : null}
        </nav>
        {skillPath ? <LocalProgressControls skillPath={skillPath} compact /> : null}
      </div>
    </AppShell>
  );
}

function SkillLearningJourney({ model }: { model: NonNullable<ReturnType<typeof useWorkingContextModel>> }) {
  const reviewDue = model.reviewEligible && Boolean(model.reviewHref);

  return (
    <section aria-labelledby="stages" className="grid gap-3">
      <div>
        <div>
          <h2 id="stages" tabIndex={-1} className="border-b border-rule pb-3 text-2xl font-semibold tracking-tight text-navy">Curriculum pathway</h2>
        </div>
      </div>

      <ol aria-label="Curriculum pathway" data-testid="skill-learning-journey" className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-4">
        <JourneyStep
          kind="notes"
          title="Notes"
          status="available"
          statusLabel="Available anytime"
          href={model.notesHref}
          actionLabel="Open Notes"
        />
        {model.stages.map((stage) => {
          const complete = stage.total > 0 && stage.completed >= stage.total;
          const current = stage.total > 0 && !model.isComplete && stage.name === model.stageName;
          const state = complete ? "complete" : current ? "current" : stage.total === 0 ? "unavailable" : "future";
          const statusLabel = complete
            ? `${stage.completed} of ${stage.total} complete · Complete`
            : current
              ? `${stage.completed} of ${stage.total} complete · Current`
              : stage.completed > 0
                ? `${stage.completed} of ${stage.total} complete`
                : stage.total === 0 ? "Unavailable" : "Available · Not started";
          return (
            <JourneyStep
              key={stage.id}
              kind="stage"
              title={displayStageName(stage.name)}
              status={state}
              statusLabel={statusLabel}
              href={stage.total === 0 ? null : current && model.primaryHref !== model.notesHref ? model.primaryHref : stage.href}
              actionLabel={current ? model.primaryLabel : complete ? "Revisit" : "Start"}
            />
          );
        })}
      </ol>
      {model.reviewEligible ? <aside aria-label="Review" data-testid="skill-review" data-journey-kind="review" data-journey-state={reviewDue ? "due" : "review"} className={`mt-2 flex min-w-0 flex-wrap items-center justify-between gap-4 border-y py-4 ${reviewDue ? "border-amber-200 text-amber-800" : "border-rule text-secondary"}`}>
        <div><h3 className="flex items-center gap-2 text-base font-semibold"><Clock3 aria-hidden="true" className="size-4" />Review</h3><p className="mt-1 text-sm">{reviewDue ? "Due now" : "No review due"}</p></div>
        <Link href={model.reviewActionHref} className="orthic-secondary-link inline-flex min-h-11 items-center gap-2 text-sm">{reviewDue ? "Review this skill" : "Review"}<ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
      </aside> : null}
    </section>
  );
}

type JourneyState = "available" | "complete" | "current" | "unavailable" | "future";

function JourneyStep({
  kind,
  title,
  status,
  statusLabel,
  href,
  actionLabel,
}: {
  kind: "notes" | "stage";
  title: string;
  status: JourneyState;
  statusLabel: string;
  href: string | null;
  actionLabel: string | null;
}) {
  const isCurrent = status === "current";

  return (
    <li
      data-journey-kind={kind}
      data-journey-state={status}
      data-recommended={isCurrent ? "true" : undefined}
      aria-current={isCurrent ? "step" : undefined}
      className={`orthic-stage flex min-w-0 flex-col rounded-sm border p-4 ${isCurrent ? "border-navy bg-academic-blue text-navy" : "border-rule bg-white text-secondary"}`}
    >
      <h3 className="flex items-center justify-between gap-2 text-base font-semibold text-navy">{title}{status === "complete" ? <Check aria-hidden="true" className="size-4" /> : null}</h3>
      <p className="mt-2 mb-4 text-xs leading-relaxed">{statusLabel}</p>
      {href && actionLabel ? (
        <Link
          href={href}
          className="orthic-secondary-link mt-auto inline-flex min-h-11 items-center justify-between gap-3 border-t border-rule pt-2 text-sm font-medium text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          {actionLabel}<ArrowRight aria-hidden="true" className="orthic-arrow size-4" />
        </Link>
      ) : null}
    </li>
  );
}

function displayStageName(name: string) {
  return name === "Past Paper-style Questions" ? "Exam practice" : name;
}

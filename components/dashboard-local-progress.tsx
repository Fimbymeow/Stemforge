"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardActivitySummary } from "@/components/activity/dashboard-activity-summary";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { useProgressSync } from "@/components/progress-sync-provider";
import { deriveLearnerDashboardModel, type DashboardPathSummary } from "@/lib/dashboard-derivations";
import { contentResolver } from "@/lib/content-resolver";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { isPracticeCompatibleSkill } from "@/lib/practice-model";
import type { ProgressEvidence } from "@/lib/progress/types";
import { deriveSubjectReviewSummary } from "@/lib/review/derivation";
import { estimateReviewMinutes } from "@/lib/study-plan/duration";

export function DashboardLocalProgressSection() {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  const sync = useProgressSync();
  const recommendation = useLearnerNextAction();

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

  const model = useMemo(() => deriveLearnerDashboardModel({ evidence, sync: {
    status: sync.status,
    pendingCount: sync.pendingCount,
    lastSuccessfulSyncAt: sync.lastSuccessfulSyncAt,
    differentAccount: sync.differentAccount,
    accountFingerprint: sync.accountFingerprint,
  } }), [evidence, sync.status, sync.pendingCount, sync.lastSuccessfulSyncAt, sync.differentAccount, sync.accountFingerprint]);
  const review = useMemo(() => deriveSubjectReviewSummary("higher-maths", evidence), [evidence]);
  const heroPath = model.paths.find((path) => path.skillPathId === recommendation.pathId) ?? null;
  const heroStageId = recommendation.stageId;
  const heroStage = heroStageId ? heroPath?.stageSummaries.find((stage) => stage.stageId === heroStageId) ?? null : null;
  const heroTitle = heroPath?.name ?? recommendation.title ?? "Higher Maths";
  const heroSkillPath = heroPath ? contentResolver.getPathContext(heroPath.skillPathId)?.skillPath : null;
  const heroUsesPractice = isPracticeCompatibleSkill(heroSkillPath);
  const heroPracticePosition = recommendation.questionId
    ? contentResolver.getPracticeQuestionPosition(recommendation.questionId)
    : undefined;
  const reviewSkillName = review.dueSkillNames[0] ?? null;

  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-0 text-navy" aria-label="Your learning dashboard">
      <section data-testid="dashboard-progress-summary" aria-label="Continue learning" className="rounded border border-rule bg-surface px-6 py-6 max-sm:px-5 max-sm:py-5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-secondary">Continue learning <span aria-hidden="true" className="mx-2 text-rule">·</span> Higher Maths</p>
        <h2 className="mt-3 text-[22px] font-semibold leading-tight tracking-tight max-sm:text-xl">{heroTitle}</h2>
        <DashboardJourney path={heroPath} currentStageId={heroStageId} practiceCompatible={heroUsesPractice} />
        {heroUsesPractice ? (
          <p className="mt-3 text-xs text-secondary" data-testid="dashboard-current-stage">
            {`Practice · ${heroPracticePosition ? `Question ${heroPracticePosition.position} of ${heroPracticePosition.total}` : `${heroPath?.completedQuestions ?? 0} of ${heroPath?.totalQuestions ?? 0} complete`}`}
          </p>
        ) : heroStage ? (
          <p className="sr-only" data-testid="dashboard-current-stage">{heroStage.name} · {heroStage.completedQuestions}/{heroStage.totalQuestions} complete</p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 max-sm:grid">
          {recommendation.href ? (
            <Link href={recommendation.href} className="orthic-primary-action inline-flex min-h-11 items-center justify-center gap-3 rounded-sm bg-navy px-4 text-sm font-medium text-white max-sm:w-full">
              Continue {heroTitle}<ArrowRight aria-hidden="true" className="orthic-arrow size-4" />
            </Link>
          ) : null}
          <Link href="/subjects/higher-maths" className="orthic-secondary-link inline-flex min-h-11 items-center gap-2 text-sm font-medium text-navy">
            View Higher Maths <span aria-hidden="true" className="orthic-arrow">→</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="dashboard-review-title" data-testid="dashboard-review-summary" className="border-b border-rule py-7 max-sm:py-6">
        <h2 id="dashboard-review-title" className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">Review</h2>
        <div className="mt-1 flex min-w-0 items-center justify-between gap-5 border-t border-rule pt-4 max-sm:items-start">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${reviewSkillName ? "bg-amber-600" : "bg-rule-strong"}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{reviewSkillName ?? "No skills due"}</p>
              <p className="mt-1 text-xs text-secondary">{reviewSkillName ? `Due for review · ${estimateReviewMinutes()} min` : "Your review schedule is up to date"}</p>
            </div>
          </div>
          {review.href ? (
            <Link href={review.href} className="orthic-course-action inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm border border-rule-strong bg-surface px-4 text-sm font-medium text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
              Start Review <span aria-hidden="true" className="orthic-arrow">→</span>
            </Link>
          ) : null}
        </div>
      </section>

      <DashboardActivitySummary evidence={evidence} />
    </section>
  );
}

/** Curriculum context only: Notes has no completion evidence and Review is not a stage. */
function DashboardJourney({ path, currentStageId, practiceCompatible = false }: { path: DashboardPathSummary | null; currentStageId?: string | null; practiceCompatible?: boolean }) {
  if (!path) return null;
  if (practiceCompatible) return (
    <ol aria-label="Learning pathway" data-testid="dashboard-learning-pathway" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-secondary">
      <li>Notes</li><li aria-hidden="true" className="text-rule">→</li>
      <li aria-current="step" className="border-b border-navy pb-0.5 font-semibold text-navy">Practice</li>
      <li aria-hidden="true" className="text-rule">→</li><li>Review</li>
    </ol>
  );
  return <ol aria-label="Learning pathway" data-testid="dashboard-learning-pathway" className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-secondary">
    <li className="inline-flex min-h-8 items-center">Notes</li>
    {path.stageSummaries.map((stage) => {
      const complete = stage.totalQuestions > 0 && stage.completedQuestions === stage.totalQuestions;
      const current = stage.stageId === currentStageId;
      const label = stage.name === "Past Paper-style Questions" ? "Exam practice" : stage.name;
      return <li key={stage.stageId} aria-current={current ? "step" : undefined} aria-label={`${label}: ${complete ? "complete" : current ? "current" : stage.totalQuestions === 0 ? "unavailable" : "not complete"}`} className="inline-flex items-center gap-3">
        <span aria-hidden="true" className="text-rule">→</span>
        <span className={`orthic-stage inline-flex min-h-8 items-center gap-2 border-b pb-0.5 ${current ? "border-navy font-semibold text-navy" : "border-transparent"}`}>{complete ? <span aria-hidden="true">✓</span> : null}{label}</span>
      </li>;
    })}
  </ol>;
}

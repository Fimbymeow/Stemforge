"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useProgressSync } from "@/components/progress-sync-provider";
import { deriveLearnerDashboardModel, type DashboardPathSummary } from "@/lib/dashboard-derivations";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import type { ProgressEvidence } from "@/lib/progress/types";
import { GuestProgressProtection } from "@/components/account/guest-progress-protection";
import { deriveSubjectReviewSummary } from "@/lib/review/derivation";
import { resolveEffectiveCourses } from "@/lib/learner-preferences";
import { useLearnerPreferences } from "@/components/learner-preferences/use-learner-preferences";
import { StudyPlanToday } from "@/components/study-plan/study-plan-today";
import { DashboardActivitySummary } from "@/components/activity/dashboard-activity-summary";
import { DashboardCourses } from "@/components/dashboard-courses";
import type { StudyPlanDashboardState } from "@/lib/study-plan/dashboard-dedup";

export function DashboardLocalProgressSection({ studyPlanEnabled = false }: { studyPlanEnabled?: boolean }) {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  const sync = useProgressSync();
  const recommendation = useLearnerNextAction();
  const learnerPreferences = useLearnerPreferences();
  const [studyPlanState, setStudyPlanState] = useState<StudyPlanDashboardState>({ status: "loading", caughtUp: false, todayItems: [], planItems: [] });
  const updateStudyPlanState = useCallback((state: StudyPlanDashboardState) => setStudyPlanState(state), []);

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
  const meaningfulEvidenceCount = evidence.attempts.length + evidence.achievementSnapshots.length;
  const recommendedPath = model.paths.find((path) => path.skillPathId === recommendation.pathId) ?? null;
  const reviewSummary = review.dueSkillCount
    ? `${review.dueSkillCount} review${review.dueSkillCount === 1 ? "" : "s"} due`
    : "Up to date";
  const effectiveCourses = useMemo(() => resolveEffectiveCourses({ preferences: learnerPreferences.preferences, evidence }), [evidence, learnerPreferences.preferences]);
  const attentionCourseSlugs = useMemo(() => effectiveCourses.filter((course) => deriveSubjectReviewSummary(course.slug, evidence).dueSkillCount > 0).map((course) => course.slug), [effectiveCourses, evidence]);
  const heroOwnsResume = recommendation.intent === "resuming" && recommendation.href !== null;
  const planFocus = studyPlanState.todayItems[0];
  const planFocusPath = planFocus ? model.paths.find((path) => path.skillPathId === planFocus.skillPathId) : null;
  const heroPath = heroOwnsResume ? recommendedPath : planFocusPath ?? recommendedPath;
  const heroStageId = heroOwnsResume ? recommendation.stageId : planFocus?.stageId ?? recommendation.stageId;
  const heroStage = heroStageId ? heroPath?.stageSummaries.find((stage) => stage.stageId === heroStageId) ?? null : null;
  const heroHref = heroOwnsResume ? recommendation.href : planFocus?.href ?? recommendation.href;
  const heroTitle = heroPath?.name ?? (heroOwnsResume ? recommendation.title : planFocus?.skillName ?? recommendation.title) ?? effectiveCourses[0]?.name ?? "Higher Maths";

  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 text-navy max-sm:gap-7" aria-label="Your learning dashboard">
      <div data-testid="dashboard-learning-region">
      <section data-testid="dashboard-progress-summary" aria-label="Continue learning" className="rounded border border-rule bg-surface px-6 py-5 md:px-6">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-secondary">Continue learning <span aria-hidden="true" className="mx-2 text-rule">·</span> Higher Maths</p>
            <h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight max-sm:text-xl">{heroTitle}</h2>
          </div>
          {!heroOwnsResume && planFocus?.actionType === "review" ? <p className="rounded-sm bg-amber-50 px-3 py-1 font-mono text-[11px] text-amber-800"><span aria-hidden="true">● </span>Due for review · {planFocus.suggestedMinutes} min</p> : null}
        </div>
        <DashboardJourney path={heroPath} currentStageId={heroStageId} />
        {heroStage ? <p className="sr-only" data-testid="dashboard-current-stage">{heroStage.name} · {heroStage.completedQuestions}/{heroStage.totalQuestions} complete</p> : null}
        {heroHref ? <Link href={heroHref} className="orthic-primary-action mt-4 inline-flex min-h-11 items-center justify-center gap-3 rounded-sm bg-navy px-4 text-sm font-medium text-white max-sm:w-full">Continue {heroTitle}<ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link> : null}
      </section>
      </div>
      <div data-testid="dashboard-document-sections" className={`grid min-w-0 gap-8 ${studyPlanEnabled ? "xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-10" : ""}`}>
      {studyPlanEnabled ? <div className="grid min-w-0 content-start gap-10"><StudyPlanToday presentation="dashboard" evidence={evidence} courseSlug={effectiveCourses[0]?.slug ?? model.course.subjectSlug} courseName={effectiveCourses[0]?.name ?? "Higher Maths"} onDashboardStateChange={updateStudyPlanState} /></div> : null}
      <aside aria-label="Courses, learning history and account context" className="grid min-w-0 content-start gap-7">
      <DashboardCourses courses={effectiveCourses} focusCourseSlug={recommendation.subjectId ?? model.course.subjectSlug} attentionCourseSlugs={attentionCourseSlugs} progressCourseSlug={model.course.subjectSlug} completedPathCount={model.course.completedPathCount} availablePathCount={model.course.availablePathCount} reviewSummary={reviewSummary} reviewDue={review.dueSkillCount > 0} />
      <DashboardActivitySummary evidence={evidence} />
      <GuestProgressProtection presentation="dashboard" meaningfulEvidenceCount={meaningfulEvidenceCount} signedIn={sync.accountFingerprint !== null} authStateReady={sync.status === "authentication_required"} />
      </aside>
      </div>
    </section>
  );
}

/** Curriculum context only: Notes has no completion evidence and Review is not a stage. */
function DashboardJourney({ path, currentStageId }: { path: DashboardPathSummary | null; currentStageId?: string | null }) {
  if (!path) return null;
  return <ol aria-label="Learning pathway" data-testid="dashboard-learning-pathway" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] text-secondary">
    <li className="inline-flex min-h-8 items-center">Notes</li>
    {path.stageSummaries.map((stage) => {
      const complete = stage.totalQuestions > 0 && stage.completedQuestions === stage.totalQuestions;
      const current = stage.stageId === currentStageId;
      const label = stage.name === "Past Paper-style Questions" ? "Exam practice" : stage.name;
      return <li key={stage.stageId} aria-current={current ? "step" : undefined} aria-label={`${label}: ${complete ? "complete" : current ? "current" : stage.totalQuestions === 0 ? "unavailable" : "not complete"}`} className="inline-flex items-center gap-3">
        <span aria-hidden="true" className="text-rule">→</span>
        <span className={`orthic-stage inline-flex min-h-8 items-center gap-2 rounded-sm border px-2 py-1 ${current ? "border-rule bg-academic-blue text-navy" : complete ? "border-transparent text-secondary" : "border-transparent"}`}>{complete ? <span aria-hidden="true">✓</span> : null}{label}</span>
      </li>;
    })}
  </ol>;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useProgressSync } from "@/components/progress-sync-provider";
import { deriveLearnerDashboardModel, type DashboardPathSummary } from "@/lib/dashboard-derivations";
import { getResourceHref } from "@/lib/learning-paths";
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
import { resolveDashboardContinueMode, type StudyPlanDashboardState } from "@/lib/study-plan/dashboard-dedup";

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
  const recommendedStage = recommendation.stageId ? recommendedPath?.stageSummaries.find((stage) => stage.stageId === recommendation.stageId) ?? null : null;
  const reviewSummary = review.dueSkillCount
    ? `${review.dueSkillCount} review${review.dueSkillCount === 1 ? "" : "s"} due`
    : "Up to date";
  const effectiveCourses = useMemo(() => resolveEffectiveCourses({ preferences: learnerPreferences.preferences, evidence }), [evidence, learnerPreferences.preferences]);
  const attentionCourseSlugs = useMemo(() => effectiveCourses.filter((course) => deriveSubjectReviewSummary(course.slug, evidence).dueSkillCount > 0).map((course) => course.slug), [effectiveCourses, evidence]);
  // A real resumable action owns the hero; plan generation and recommendations remain unchanged.
  const heroOwnsResume = recommendation.intent === "resuming" && recommendation.href !== null;
  const continueMode = heroOwnsResume ? "full" : resolveDashboardContinueMode({ studyPlanEnabled, plan: studyPlanState, recommendation });
  const planFocus = studyPlanState.todayItems[0];
  const planFocusPath = planFocus ? model.paths.find((path) => path.skillPathId === planFocus.skillPathId) : null;
  const planFocusStage = planFocus?.stageId ? planFocusPath?.stageSummaries.find((stage) => stage.stageId === planFocus.stageId) : null;
  const focusStage = planFocus ? planFocusStage : recommendedStage;
  const focusPath = planFocus ? planFocusPath : recommendedPath;

  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 text-navy max-sm:gap-7" aria-label="Your learning dashboard">
      <div data-testid="dashboard-learning-region">
      {continueMode === "full" ? <section data-testid="dashboard-progress-summary" aria-label="Continue learning" className="rounded border border-rule bg-white p-6 md:px-8 md:py-6">
        <div className="grid gap-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy"><span aria-hidden="true" className="size-2 rounded-full bg-navy" />Continue learning · Higher Maths</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight max-sm:text-2xl">{recommendedPath?.name ?? "Higher Maths"}</h2>
            <DashboardJourney path={recommendedPath} currentStageId={recommendation.stageId} />
            {recommendedStage ? <p className="mt-3 text-xs text-secondary" data-testid="dashboard-current-stage">{recommendedStage.name} · {recommendedStage.completedQuestions}/{recommendedStage.totalQuestions} complete</p> : null}
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-secondary">{recommendation.reason}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {recommendation.href ? <Link href={recommendation.href} className="orthic-primary-action inline-flex min-h-12 items-center justify-center gap-3 rounded bg-navy px-6 text-base font-medium text-white max-sm:w-full">{recommendation.label}<ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link> : null}
            <Link href="/practice" className="orthic-secondary-link inline-flex min-h-11 items-center justify-center text-sm text-secondary">Practise your way</Link>
          </div>
        </div>
      </section> : continueMode === "compact" && recommendation.href ? (
        <section aria-labelledby="dashboard-resume-course-title" data-testid="dashboard-resume-course" className="rounded border border-rule bg-white p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 max-sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted">Continue learning</p>
              <h2 id="dashboard-resume-course-title" className="mt-4 text-2xl font-semibold">{recommendedPath?.name ?? recommendation.title}</h2>
              <DashboardJourney path={recommendedPath} currentStageId={recommendation.stageId} />
              {recommendedStage ? <p className="mt-0.5 text-xs font-semibold text-muted">{recommendedStage.name} · {recommendedStage.completedQuestions}/{recommendedStage.totalQuestions} complete</p> : null}
            </div>
            <Link href={recommendation.href} aria-label={`${recommendation.label}: ${recommendedPath?.name ?? recommendation.title}`} className="orthic-secondary-link inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-secondary">Open <ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
          </div>
        </section>
      ) : (
        <section data-testid="dashboard-plan-focus" aria-labelledby="dashboard-plan-focus-title" className="rounded border border-rule bg-white p-6 md:px-8 md:py-6">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em]">Your learning · {effectiveCourses[0]?.name ?? "Higher Maths"}</p>
          <h2 id="dashboard-plan-focus-title" className="mt-3 text-[30px] font-semibold leading-tight tracking-tight max-sm:text-2xl">{planFocus?.skillName ?? recommendedPath?.name ?? effectiveCourses[0]?.name ?? "Your study plan"}</h2>
          <DashboardJourney path={focusPath ?? null} currentStageId={planFocus ? planFocus.stageId : recommendation.stageId} />
          {focusStage ? <p className="mt-4 text-xs text-secondary">{focusStage.name} · {focusStage.completedQuestions}/{focusStage.totalQuestions} complete</p> : null}
          {planFocus?.actionType === "review" ? <p className="mt-4 inline-block rounded-sm border border-amber-200 bg-amber-50 px-3 py-1 font-mono text-xs text-amber-800">Due for review · {planFocus.suggestedMinutes} min</p> : null}
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-secondary">{studyPlanState.todayItems.length ? "Your next learning action is in today’s Study Plan." : "See your study week, or open your course to choose what to work on."}</p>
          <Link href={studyPlanState.todayItems.length ? "#study-plan-today-title" : "/study-plan"} className="orthic-primary-action mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded bg-navy px-6 text-base font-medium text-white max-sm:w-full">{studyPlanState.todayItems.length ? "Open today’s plan" : "View this week"}<ArrowRight aria-hidden="true" className="orthic-arrow size-4" /></Link>
          {focusPath ? <Link href={getResourceHref("revision-notes", model.course.subjectSlug, focusPath.skillPathId)} className="orthic-secondary-link ml-5 inline-flex min-h-11 items-center text-sm text-secondary max-sm:ml-0 max-sm:mt-2 max-sm:w-full">Overview skill notes</Link> : null}
        </section>
      )}
      </div>
      <div data-testid="dashboard-document-sections" className={`grid min-w-0 gap-8 ${studyPlanEnabled ? "xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-10" : ""}`}>
      {studyPlanEnabled ? <div className="grid min-w-0 content-start gap-10"><StudyPlanToday presentation="dashboard" heroOwnsResume={heroOwnsResume} evidence={evidence} courseSlug={effectiveCourses[0]?.slug ?? model.course.subjectSlug} courseName={effectiveCourses[0]?.name ?? "Higher Maths"} onDashboardStateChange={updateStudyPlanState} /></div> : null}
      <aside aria-label="Courses, learning history and account context" className="grid min-w-0 content-start gap-7">
      <DashboardCourses courses={effectiveCourses} focusCourseSlug={continueMode === "hidden" ? effectiveCourses[0]?.slug ?? recommendation.subjectId ?? model.course.subjectSlug : recommendation.subjectId ?? model.course.subjectSlug} attentionCourseSlugs={attentionCourseSlugs} selectedCourseSlugs={learnerPreferences.preferences.selectedCourseSlugs} progressCourseSlug={model.course.subjectSlug} completedPathCount={model.course.completedPathCount} availablePathCount={model.course.availablePathCount} reviewSummary={reviewSummary} reviewDue={review.dueSkillCount > 0} />
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

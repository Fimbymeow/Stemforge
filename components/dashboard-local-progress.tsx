"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useProgressSync } from "@/components/progress-sync-provider";
import { deriveLearnerDashboardModel } from "@/lib/dashboard-derivations";
import { getEmptyProgressEvidence, getProgressEvidence } from "@/lib/local-progress";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import type { ProgressEvidence } from "@/lib/progress/types";
import { GuestProgressProtection } from "@/components/account/guest-progress-protection";
import { deriveSubjectReviewSummary } from "@/lib/review/derivation";
import { resolveEffectiveCourses } from "@/lib/learner-preferences";
import { useLearnerPreferences } from "@/components/learner-preferences/use-learner-preferences";
import { StudyPlanToday } from "@/components/study-plan/study-plan-today";
import { DashboardActivitySummary } from "@/components/activity/dashboard-activity-summary";
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
  const continueMode = resolveDashboardContinueMode({ studyPlanEnabled, plan: studyPlanState, recommendation });
  const planFocus = studyPlanState.todayItems[0];
  const planFocusPath = planFocus ? model.paths.find((path) => path.skillPathId === planFocus.skillPathId) : null;
  const planFocusStage = planFocus?.stageId ? planFocusPath?.stageSummaries.find((stage) => stage.stageId === planFocus.stageId) : null;
  const focusStage = planFocus ? planFocusStage : recommendedStage;

  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-10 text-navy max-sm:gap-7" aria-label="Your learning dashboard">
      <div data-testid="dashboard-learning-region">
      {continueMode === "full" ? <section data-testid="dashboard-progress-summary" aria-label="Continue learning" className="rounded-lg border border-rule bg-white p-6 md:p-10">
        <div className="grid min-h-[240px] content-center gap-6 max-sm:min-h-0">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-navy">Continue learning · Higher Maths</p>
            <h2 className="mt-5 text-[30px] font-semibold leading-tight tracking-tight max-sm:text-2xl">{recommendedPath?.name ?? "Higher Maths"}</h2>
            {recommendedStage ? <p className="mt-5 inline-block rounded border border-rule bg-academic-blue px-3 py-2 text-sm text-navy" data-testid="dashboard-current-stage">{recommendedStage.name} · {recommendedStage.completedQuestions}/{recommendedStage.totalQuestions} complete</p> : null}
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-secondary">{recommendation.reason}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {recommendation.href ? <Link href={recommendation.href} className="inline-flex min-h-12 items-center justify-center gap-3 rounded bg-navy px-6 text-base font-medium text-white max-sm:w-full">{recommendation.label}<ArrowRight aria-hidden="true" className="size-4" /></Link> : null}
            <Link href="/practice" className="inline-flex min-h-11 items-center justify-center text-sm text-secondary">Practise your way</Link>
          </div>
        </div>
      </section> : continueMode === "compact" && recommendation.href ? (
        <section aria-labelledby="dashboard-resume-course-title" data-testid="dashboard-resume-course" className="rounded-lg border border-rule bg-white p-6 md:p-10">
          <div className="flex items-center justify-between gap-4 max-sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted">Continue learning</p>
              <h2 id="dashboard-resume-course-title" className="mt-4 text-2xl font-semibold">{recommendedPath?.name ?? recommendation.title}</h2>
              {recommendedStage ? <p className="mt-0.5 text-xs font-semibold text-muted">{recommendedStage.name} · {recommendedStage.completedQuestions}/{recommendedStage.totalQuestions} complete</p> : null}
            </div>
            <Link href={recommendation.href} aria-label={`${recommendation.label}: ${recommendedPath?.name ?? recommendation.title}`} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-sm font-extrabold text-forge">Open <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </div>
        </section>
      ) : (
        <section data-testid="dashboard-plan-focus" aria-labelledby="dashboard-plan-focus-title" className="rounded-lg border border-rule bg-white p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest">Your learning · {effectiveCourses[0]?.name ?? "Higher Maths"}</p>
          <h2 id="dashboard-plan-focus-title" className="mt-5 text-[30px] font-semibold leading-tight tracking-tight max-sm:text-2xl">{planFocus?.skillName ?? recommendedPath?.name ?? effectiveCourses[0]?.name ?? "Your study plan"}</h2>
          {focusStage ? <p className="mt-5 inline-block rounded border border-rule bg-academic-blue px-3 py-2 text-sm">{focusStage.name} · {focusStage.completedQuestions}/{focusStage.totalQuestions} complete</p> : null}
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-secondary">{studyPlanState.todayItems.length ? "Your next learning action is in today’s Study Plan." : "See your study week, or open your course to choose what to work on."}</p>
          <Link href={studyPlanState.todayItems.length ? "#study-plan-today-title" : "/study-plan"} className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded bg-navy px-6 text-base font-medium text-white max-sm:w-full">{studyPlanState.todayItems.length ? "Open today’s plan" : "View this week"}<ArrowRight aria-hidden="true" className="size-4" /></Link>
        </section>
      )}
      </div>
      <div data-testid="dashboard-document-sections" className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,2.1fr)_minmax(260px,1fr)] xl:gap-10">
      <div className="grid min-w-0 content-start gap-10">
      {studyPlanEnabled ? <StudyPlanToday presentation="dashboard" evidence={evidence} courseSlug={effectiveCourses[0]?.slug ?? model.course.subjectSlug} courseName={effectiveCourses[0]?.name ?? "Higher Maths"} onDashboardStateChange={updateStudyPlanState} /> : null}

      <section aria-labelledby="your-courses-title" data-testid="dashboard-courses-section" className="pt-1">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="your-courses-title" className="text-lg font-semibold uppercase tracking-wide">Your courses</h2>
          </div>
          <span className="text-xs font-bold text-muted">{model.sync.label}</span>
        </div>
        <div className="divide-y divide-rule border-y border-rule bg-white" data-testid="dashboard-courses">
          {effectiveCourses.map((course) => (
            <Link key={course.slug} href={course.href} aria-label={`Open ${course.name}`} className="flex min-h-24 flex-wrap items-center gap-4 px-5 py-5 transition-colors hover:bg-academic-blue focus-visible:bg-academic-blue">
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-medium">{course.name}</span>
                {course.slug === model.course.subjectSlug ? (
                  <span className="mt-1 block text-sm text-secondary">{model.course.completedPathCount} of {model.course.availablePathCount} skills learned · <span className={review.dueSkillCount ? "text-amber-800" : undefined}>{reviewSummary}</span></span>
                ) : null}
              </span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      </section>
      </div>
      <aside aria-label="Learning history and account context" className="grid min-w-0 content-start gap-7">
      <DashboardActivitySummary evidence={evidence} />
      <GuestProgressProtection meaningfulEvidenceCount={meaningfulEvidenceCount} signedIn={sync.accountFingerprint !== null} authStateReady={sync.status === "authentication_required"} />
      </aside>
      </div>
    </section>
  );
}

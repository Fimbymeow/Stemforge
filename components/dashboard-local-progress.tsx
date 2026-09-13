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

  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7 text-navy" aria-label="Your learning dashboard">
      {continueMode === "full" ? <section data-testid="dashboard-progress-summary" aria-label="Continue learning" className="rounded-lg border border-rule bg-white p-5 md:p-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 max-md:grid-cols-1">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-secondary">Continue learning · Higher Maths</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">{recommendedPath?.name ?? "Higher Maths"}</h2>
            {recommendedStage ? <p className="mt-1 text-sm font-bold text-muted" data-testid="dashboard-current-stage">{recommendedStage.name} · {recommendedStage.completedQuestions}/{recommendedStage.totalQuestions} complete</p> : null}
            <p className="mt-1 max-w-2xl text-sm text-muted">{recommendation.reason}</p>
          </div>
          <div className="flex min-w-[190px] flex-col gap-0.5 max-md:min-w-0">
            {recommendation.href ? <Link href={recommendation.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-navy px-5 text-sm font-semibold text-white">{recommendation.label}<ArrowRight aria-hidden="true" className="size-4" /></Link> : null}
            <Link href="/practice" className="inline-flex min-h-10 items-center justify-center text-sm font-bold text-forge">Practise your way</Link>
          </div>
        </div>
      </section> : continueMode === "compact" && recommendation.href ? (
        <section aria-labelledby="dashboard-resume-course-title" data-testid="dashboard-resume-course" className="rounded-lg border border-rule bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-4 max-sm:items-start">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted">Continue learning</p>
              <h2 id="dashboard-resume-course-title" className="mt-0.5 text-base font-extrabold">{recommendedPath?.name ?? recommendation.title}</h2>
              {recommendedStage ? <p className="mt-0.5 text-xs font-semibold text-muted">{recommendedStage.name} · {recommendedStage.completedQuestions}/{recommendedStage.totalQuestions} complete</p> : null}
            </div>
            <Link href={recommendation.href} aria-label={`${recommendation.label}: ${recommendedPath?.name ?? recommendation.title}`} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-sm font-extrabold text-forge">Open <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </div>
        </section>
      ) : null}
      {studyPlanEnabled ? <StudyPlanToday presentation="dashboard" evidence={evidence} courseSlug={effectiveCourses[0]?.slug ?? model.course.subjectSlug} courseName={effectiveCourses[0]?.name ?? "Higher Maths"} onDashboardStateChange={updateStudyPlanState} /> : null}

      <section aria-labelledby="your-courses-title" data-testid="dashboard-courses-section" className="pt-1">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="your-courses-title" className="text-lg font-semibold">Your courses</h2>
          </div>
          <span className="text-xs font-bold text-muted">{model.sync.label}</span>
        </div>
        <div className="divide-y divide-rule border-y border-rule" data-testid="dashboard-courses">
          {effectiveCourses.map((course) => (
            <Link key={course.slug} href={course.href} aria-label={`Open ${course.name}`} className="flex min-h-16 items-center gap-3 py-4 transition-colors hover:bg-white focus-visible:bg-white">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{course.name}</span>
                {course.slug === model.course.subjectSlug ? (
                  <span className="mt-1 block text-sm text-secondary">{model.course.completedPathCount} of {model.course.availablePathCount} skills learned · {reviewSummary}</span>
                ) : null}
              </span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      </section>

      <GuestProgressProtection meaningfulEvidenceCount={meaningfulEvidenceCount} signedIn={sync.accountFingerprint !== null} authStateReady={sync.status === "authentication_required"} />

      <DashboardActivitySummary evidence={evidence} />
    </section>
  );
}

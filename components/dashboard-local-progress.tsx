"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
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

export function DashboardLocalProgressSection({ studyPlanEnabled = false }: { studyPlanEnabled?: boolean }) {
  const [evidence, setEvidence] = useState<ProgressEvidence>(() => getEmptyProgressEvidence());
  const sync = useProgressSync();
  const recommendation = useLearnerNextAction();
  const learnerPreferences = useLearnerPreferences();

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
  const learnedSkillPercentage = model.course.availablePathCount > 0
    ? Math.round((model.course.completedPathCount / model.course.availablePathCount) * 100)
    : 0;
  const reviewSummary = review.dueSkillCount
    ? `${review.dueSkillCount} review${review.dueSkillCount === 1 ? "" : "s"} due`
    : "Up to date";
  const effectiveCourses = useMemo(() => resolveEffectiveCourses({ preferences: learnerPreferences.preferences, evidence }), [evidence, learnerPreferences.preferences]);

  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5" aria-label="Your learning dashboard">
      {studyPlanEnabled ? <StudyPlanToday evidence={evidence} courseSlug={effectiveCourses[0]?.slug ?? model.course.subjectSlug} courseName={effectiveCourses[0]?.name ?? "Higher Maths"} /> : null}
      <Card data-testid="dashboard-progress-summary" aria-label="Continue learning" className="border-forge/30 p-4 md:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 max-md:grid-cols-1">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-forge">Continue learning · Higher Maths</p>
            <h2 className="mt-1 text-xl font-extrabold">{recommendedPath?.name ?? "Higher Maths"}</h2>
            {recommendedStage ? <p className="mt-1 text-sm font-bold text-muted" data-testid="dashboard-current-stage">{recommendedStage.name} · {recommendedStage.completedQuestions}/{recommendedStage.totalQuestions} complete</p> : null}
            <p className="mt-1 max-w-2xl text-sm text-muted">{recommendation.reason}</p>
          </div>
          <div className="flex min-w-[210px] flex-col gap-1 max-md:min-w-0">
            {recommendation.href ? <Link href={recommendation.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forge px-5 text-sm font-extrabold text-white">{recommendation.label}<ArrowRight aria-hidden="true" className="size-4" /></Link> : null}
            <Link href="/practice" className="inline-flex min-h-10 items-center justify-center text-sm font-bold text-forge">Practise your way</Link>
          </div>
        </div>
      </Card>

      <GuestProgressProtection meaningfulEvidenceCount={meaningfulEvidenceCount} signedIn={sync.accountFingerprint !== null} authStateReady={sync.status === "authentication_required"} />

      <section aria-labelledby="your-courses-title">
        <div className="mb-2 flex items-end justify-between gap-3"><h2 id="your-courses-title" className="text-lg font-extrabold">Your courses</h2><span className="text-xs font-bold text-muted">{model.sync.label}</span></div>
        <div className="divide-y divide-line border-y border-line" data-testid="dashboard-courses">
          {effectiveCourses.map((course) => (
            <Link key={course.slug} href={course.href} aria-label={`Open ${course.name}`} className="flex min-h-16 items-center gap-4 py-2 hover:bg-forge-soft">
              <BookOpen aria-hidden="true" className="size-5 shrink-0 text-forge" />
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold">{course.name}</span>
                {course.slug === model.course.subjectSlug ? (
                  <><span className="block text-xs text-muted">{model.course.completedPathCount} of {model.course.availablePathCount} skills learned · {reviewSummary}</span><ProgressBar value={learnedSkillPercentage} className="mt-2 max-w-sm" /></>
                ) : null}
              </span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-forge" />
            </Link>
          ))}
        </div>
      </section>

      <DashboardActivitySummary evidence={evidence} />
    </section>
  );
}

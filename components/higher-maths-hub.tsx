"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, ClipboardList, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card, ProgressBar } from "@/components/ui";
import { SubjectRoadmapNavigator } from "@/components/learning/subject-roadmap-navigator";
import { isCompletedTierStatus, MasteryBadge, ReviewBadge, type CompletedTierStatus } from "@/components/learning/mastery-badge";
import { getPathCompletionSupportingSentence } from "@/components/learning/path-completion-panel";
import { getActiveSkillPath, getActiveSubject, getQuestionBankHref } from "@/lib/learning-paths";
import { getEmptyProgressEvidence, getSkillPathProgress } from "@/lib/local-progress";
import { useHasMounted } from "@/lib/use-mounted";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { QuickPracticeAction } from "@/components/practice/quick-practice-action";
import type { LearnerNextAction } from "@/lib/learning/next-action";

export function HigherMathsHub() {
  const subject = getActiveSubject();
  const skillPath = getActiveSkillPath();
  const [version, setVersion] = useState(0);
  const hasMounted = useHasMounted();
  const nextAction = useLearnerNextAction();

  useEffect(() => {
    const update = () => setVersion((current) => current + 1);
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  void version;
  const evidenceOverride = hasMounted ? undefined : getEmptyProgressEvidence();
  const progress = getSkillPathProgress(skillPath, evidenceOverride);

  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end">
        <AppTopbar demo />
      </div>
      <div className="mx-auto grid max-w-[1120px] gap-5">
        <header>
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects">Subjects</Link>
            <ArrowRight className="size-4" />
            <span className="font-bold text-forge">Higher Maths</span>
          </nav>
          <div className="grid grid-cols-[48px_1fr] items-center gap-3 max-md:grid-cols-1">
            <span className="grid size-12 place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge">
              <Calculator className="size-6" />
            </span>
            <div>
              <h1 className="m-0 text-[32px] font-extrabold leading-none">Higher Maths</h1>
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">Structured Qualifications Scotland learning for Scottish students.</p>
              <p className="mt-2 text-sm font-bold text-muted">Calculus is partially available now. More Higher Maths areas are being added.</p>
            </div>
          </div>
        </header>

        <section>
          <h2 className="mb-2 text-lg font-extrabold">Start here</h2>
          <GuidedPathCard progress={progress} nextAction={nextAction} skillPathName={skillPath.name} />
        </section>

        <section aria-labelledby="course-coverage-title" className="min-w-0 max-w-full">
          <h2 id="course-coverage-title" className="mb-2 text-lg font-extrabold">Full course coverage</h2>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted">
            Browse all four course areas. Progress is measured only across published questions in available content.
          </p>
          <SubjectRoadmapNavigator subject={subject} />
        </section>
      </div>
    </AppShell>
  );
}

function GuidedPathCard({
  progress,
  nextAction,
  skillPathName,
}: {
  progress: ReturnType<typeof getSkillPathProgress>;
  nextAction: LearnerNextAction;
  skillPathName: string;
}) {
  const isComplete = progress.totalQuestions > 0 && progress.completedQuestionIds.length >= progress.totalQuestions;
  if (isComplete && isCompletedTierStatus(progress.status)) {
    return <CompletedGuidedPathCard progress={progress} status={progress.status} skillPathName={skillPathName} nextAction={nextAction} />;
  }

  return (
    <Card className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-4">
      <div className="grid grid-cols-[76px_1fr] items-center gap-4 max-lg:grid-cols-[64px_1fr] max-md:grid-cols-1">
        <div className="grid size-[76px] place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge max-md:h-20 max-md:w-full">
          <Target className="size-8" />
        </div>
        <div>
          <p className="mb-1 text-xs font-extrabold uppercase text-forge">Recommended</p>
          <h3 className="m-0 text-xl font-extrabold">Guided Learning Path</h3>
          <p id="hub-next-action-reason" className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{nextAction.reason}</p>
          <div className="mt-3 grid max-w-lg gap-2">
            <div className="flex flex-wrap justify-between gap-2 text-xs font-bold text-muted">
              <span>{progress.completedQuestionIds.length} / {progress.totalQuestions} completed</span>
              <span>{progress.completionPercentage}% complete</span>
            </div>
            <ProgressBar value={progress.completionPercentage} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-forge/20 pt-4">
        {nextAction.kind === "practice_again" ? (
          <QuickPracticeAction preferredPathId={nextAction.pathId} label={nextAction.label} className="max-md:w-full" />
        ) : nextAction.href ? <Link href={nextAction.href} aria-describedby="hub-next-action-reason" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white max-md:w-full">
          {nextAction.label}
        </Link> : null}
        <Link href={getQuestionBankHref()} className="inline-flex min-h-10 items-center justify-center gap-2 px-2 text-sm font-extrabold text-muted transition hover:text-forge max-md:w-full">
          <ClipboardList className="size-4" />
          Question bank
        </Link>
      </div>
    </Card>
  );
}

function CompletedGuidedPathCard({
  progress,
  status,
  skillPathName,
  nextAction,
}: {
  progress: ReturnType<typeof getSkillPathProgress>;
  status: CompletedTierStatus;
  skillPathName: string;
  nextAction: LearnerNextAction;
}) {
  const reviewCount = progress.reviewQuestionIds.length;
  const supporting = getPathCompletionSupportingSentence(status, reviewCount);

  return (
    <Card className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-4">
      <div className="grid grid-cols-[76px_1fr] items-center gap-4 max-lg:grid-cols-[64px_1fr] max-md:grid-cols-1">
        <div className="grid size-[76px] place-items-center rounded-xl border border-forge-soft bg-forge-soft text-forge max-md:h-20 max-md:w-full">
          <Target className="size-8" />
        </div>
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <MasteryBadge status={status} />
            <ReviewBadge count={reviewCount} />
          </div>
          <h3 className="m-0 text-xl font-extrabold">{skillPathName}</h3>
          <p id="hub-next-action-reason" className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Path complete. {supporting} {nextAction.reason}</p>
          <div className="mt-3 grid max-w-lg gap-2">
            <div className="flex flex-wrap justify-between gap-2 text-xs font-bold text-muted">
              <span>{progress.completedQuestionIds.length} / {progress.totalQuestions} completed</span>
              {progress.firstAttemptAccuracyPercentage !== null ? <span>{progress.firstAttemptAccuracyPercentage}% first-attempt accuracy</span> : null}
            </div>
            <ProgressBar value={progress.completionPercentage} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-forge/20 pt-4">
        {nextAction.kind === "practice_again" ? (
          <QuickPracticeAction preferredPathId={nextAction.pathId} label={nextAction.label} className="max-md:w-full" />
        ) : nextAction.href ? <Link href={nextAction.href} aria-describedby="hub-next-action-reason" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white max-md:w-full">
          {nextAction.label}
        </Link> : null}
        <Link href={getQuestionBankHref()} className="inline-flex min-h-10 items-center justify-center gap-2 px-2 text-sm font-extrabold text-muted transition hover:text-forge max-md:w-full">
          <ClipboardList className="size-4" />
          Question bank
        </Link>
      </div>
    </Card>
  );
}

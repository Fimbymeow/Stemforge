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
import { getActiveSkillPath, getActiveSubject, getQuestionBankHref, getQuestionHref, getSkillPathHref } from "@/lib/learning-paths";
import { getEmptyProgressEvidence, getNextQuestionId, getSkillPathProgress } from "@/lib/local-progress";
import { useHasMounted } from "@/lib/use-mounted";

export function HigherMathsHub() {
  const subject = getActiveSubject();
  const skillPath = getActiveSkillPath();
  const [version, setVersion] = useState(0);
  const hasMounted = useHasMounted();

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
  const nextQuestionId = getNextQuestionId(skillPath, evidenceOverride);
  const continueHref = nextQuestionId ? getQuestionHref(nextQuestionId) : getSkillPathHref(skillPath);

  return (
    <AppShell demo active="Subjects">
      <div className="mx-auto mb-3 flex max-w-[1120px] justify-end">
        <AppTopbar demo />
      </div>
      <main className="mx-auto grid max-w-[1120px] gap-5">
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
              <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted">Structured SQA learning for Scottish students.</p>
              <p className="mt-2 text-sm font-bold text-muted">{skillPath.name} is available now. More Higher Maths paths are coming soon.</p>
            </div>
          </div>
        </header>

        <section>
          <h2 className="mb-2 text-lg font-extrabold">Start here</h2>
          <GuidedPathCard progress={progress} continueHref={continueHref} skillPathName={skillPath.name} />
        </section>

        <SubjectRoadmapNavigator subject={subject} />
      </main>
    </AppShell>
  );
}

function GuidedPathCard({
  progress,
  continueHref,
  skillPathName,
}: {
  progress: ReturnType<typeof getSkillPathProgress>;
  continueHref: string;
  skillPathName: string;
}) {
  const isComplete = progress.totalQuestions > 0 && progress.completedQuestionIds.length >= progress.totalQuestions;
  if (isComplete && isCompletedTierStatus(progress.status)) {
    return <CompletedGuidedPathCard progress={progress} status={progress.status} skillPathName={skillPathName} />;
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
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Follow a structured route through Higher Maths skills, starting with {skillPathName}.</p>
          <div className="mt-3 grid max-w-lg gap-2">
            <div className="flex flex-wrap justify-between gap-2 text-xs font-bold text-muted">
              <span>{progress.completedQuestionIds.length} / {progress.totalQuestions} completed</span>
              <span>{progress.completionPercentage}% complete</span>
            </div>
            <ProgressBar value={progress.completionPercentage} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 border-t border-forge/20 pt-4">
        <Link href={continueHref} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white max-md:w-full">
          Continue
        </Link>
        <Link href={getQuestionBankHref()} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white px-5 text-sm font-extrabold transition hover:border-forge hover:text-forge max-md:w-full">
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
}: {
  progress: ReturnType<typeof getSkillPathProgress>;
  status: CompletedTierStatus;
  skillPathName: string;
}) {
  const reviewCount = progress.reviewQuestionIds.length;
  const supporting = getPathCompletionSupportingSentence(status, reviewCount);
  const primary = reviewCount > 0
    ? { href: getQuestionHref(progress.reviewQuestionIds[0]), label: "Review recommended questions" }
    : { href: getSkillPathHref(getActiveSkillPath()), label: "Review a stage" };

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
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Path complete. {supporting}</p>
          <div className="mt-3 grid max-w-lg gap-2">
            <div className="flex flex-wrap justify-between gap-2 text-xs font-bold text-muted">
              <span>{progress.completedQuestionIds.length} / {progress.totalQuestions} completed</span>
              {progress.firstAttemptAccuracyPercentage !== null ? <span>{progress.firstAttemptAccuracyPercentage}% first-attempt accuracy</span> : null}
            </div>
            <ProgressBar value={progress.completionPercentage} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 border-t border-forge/20 pt-4">
        <Link href={primary.href} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white max-md:w-full">
          {primary.label}
        </Link>
        <Link href={getQuestionBankHref()} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white px-5 text-sm font-extrabold transition hover:border-forge hover:text-forge max-md:w-full">
          <ClipboardList className="size-4" />
          Question bank
        </Link>
      </div>
    </Card>
  );
}

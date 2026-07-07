"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Gauge, Target } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { LockedCard } from "@/components/locked-card";
import { getBasicDifferentiationSkillPath } from "@/data/active-path";
import { getNextQuestionId, getSkillPathProgress } from "@/lib/local-progress";

export function DashboardLocalProgressSection() {
  const skillPath = getBasicDifferentiationSkillPath();
  const [version, setVersion] = useState(0);

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
  const progress = getSkillPathProgress(skillPath);
  const nextQuestionId = getNextQuestionId(skillPath);

  const nextHref = nextQuestionId ? `/question/${nextQuestionId}` : skillPath.href;
  const isComplete = progress.totalQuestions > 0 && progress.completedQuestionIds.length >= progress.totalQuestions;

  return (
    <section className="grid grid-cols-[minmax(0,1.1fr)_minmax(320px,1fr)] gap-6 max-xl:grid-cols-1 max-md:gap-4">
      <Card className="min-h-[300px] p-8 max-md:p-5">
        <div className="mb-6 flex items-center justify-between gap-5 max-sm:grid">
          <h2 className="m-0 text-2xl font-extrabold">Today&apos;s Session</h2>
          <span className="rounded-[10px] border border-line bg-[#fff4ec] px-4 py-2 font-bold text-forge">Higher Maths</span>
        </div>
        <div className="grid grid-cols-[128px_minmax(0,1fr)] items-center gap-7 max-md:grid-cols-1">
          <div className="grid size-32 place-items-center rounded-xl border border-[#f3d8c5] bg-gradient-to-br from-[#fff0e4] to-white max-md:h-40 max-md:w-full">
            <Target className="size-16 text-forge" />
          </div>
          <div>
            <h3 className="m-0 text-[28px] font-extrabold">Basic differentiation</h3>
            <p className="mb-5 mt-2 text-lg text-muted">Higher Maths / Calculus / Differentiation</p>
            <div className="mb-6 flex items-center gap-3 font-semibold">
              <Target className="size-5 text-forge" />
              <span>{isComplete ? "Review your completed local practice." : "Continue your next unanswered question."}</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 max-sm:grid-cols-1 max-sm:gap-3">
              <ProgressBar value={progress.completionPercentage} />
              <strong>{progress.completedQuestionIds.length} / {progress.totalQuestions}</strong>
            </div>
          </div>
        </div>
        <DashboardAction href={nextHref}>{isComplete ? "Review Basic differentiation" : "Continue Basic differentiation"}</DashboardAction>
      </Card>

      <Card className="min-h-[300px] p-8 max-md:p-5">
        <div className="mb-6 flex items-center justify-between gap-5 max-sm:grid">
          <h2 className="m-0 text-2xl font-extrabold">Path Progress</h2>
          <span className="rounded-[10px] border border-line bg-white px-4 py-2 font-semibold text-muted">{progress.completedQuestionIds.length} / {progress.totalQuestions}</span>
        </div>
        <div className="grid content-center gap-6">
          <p className="text-lg leading-relaxed text-muted">Local progress only. Saved on this browser, with no account needed.</p>
          <ProgressBar value={progress.completionPercentage} />
          <div className="grid gap-4">
            {skillPath.learningStages?.map((stage) => {
              const stageProgress = progress.stageProgress[stage.id];
              return <StatRow key={stage.id} label={stage.name} value={`${stageProgress?.completedQuestionIds.length ?? 0} / ${stage.questionIds.length}`} />;
            })}
          </div>
        </div>
        <Link href={skillPath.href} className="mt-6 flex min-h-14 w-full items-center justify-center rounded-lg border border-line font-extrabold">
          View Path
        </Link>
      </Card>

      <Card className="p-7 max-md:p-5">
        <h2 className="mb-6 text-2xl font-extrabold">Continue Learning</h2>
        <h3 className="text-[28px] font-extrabold">Basic differentiation</h3>
        <p className="mb-7 mt-2 text-lg leading-relaxed text-muted">Current path: Calculus / Differentiation / Basic differentiation.</p>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 max-sm:grid-cols-1 max-sm:gap-3">
          <ProgressBar value={progress.completionPercentage} />
          <strong>{progress.completionPercentage}%</strong>
        </div>
        <DashboardAction href={skillPath.href} small>Open Path</DashboardAction>
      </Card>

      <Card className="p-7 max-md:p-5">
        <div className="mb-6 flex items-center justify-between gap-4 max-sm:grid">
          <h2 className="text-2xl font-extrabold">Learning Stages</h2>
          <Link href={skillPath.href} className="font-bold text-forge">Open path</Link>
        </div>
        <div className="grid gap-6">
          {skillPath.learningStages?.map((stage) => {
            const stageProgress = progress.stageProgress[stage.id];
            return (
              <div key={stage.id} className="grid grid-cols-[minmax(150px,1fr)_minmax(120px,1fr)_60px] items-center gap-5 max-md:grid-cols-[1fr_auto] max-sm:gap-3">
                <span className="font-bold">{stage.name}</span>
                <ProgressBar value={stageProgress?.completionPercentage ?? 0} className="max-md:col-span-2" />
                <strong>{stageProgress?.completedQuestionIds.length ?? 0} / {stage.questionIds.length}</strong>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="relative grid justify-items-center bg-gradient-to-br from-[#fff7f0] to-white p-7 text-center">
        <span className="absolute right-7 top-7 size-3 rotate-45 bg-forge" />
        <h2 className="text-2xl font-extrabold">Recommended Next</h2>
        <div className="my-5 grid size-24 place-items-center rounded-full border border-[#f3d8c5] bg-gradient-to-br from-[#fff0e4] to-white">
          <Gauge className="size-12 text-forge" />
        </div>
        <h3 className="text-[28px] font-extrabold">{isComplete ? "Review Path" : "Continue Practice"}</h3>
        <p className="max-w-[300px] text-lg leading-relaxed text-muted">
          {isComplete ? "All Basic differentiation questions have been attempted locally." : "STEM Forge will send you to the next unanswered question."}
        </p>
        <DashboardAction href={nextHref}>{isComplete ? "Review" : "Continue"}</DashboardAction>
      </Card>

      <LockedCard
        title="Higher Physics"
        description="Structured SQA Higher Physics learning paths are being prepared. Higher Maths is the active proof-of-concept for now."
        badge="Coming Soon"
      />
    </section>
  );
}

function DashboardAction({ children, href, small }: { children: ReactNode; href: string; small?: boolean }) {
  return (
    <Link
      href={href}
      className={`mt-7 inline-flex items-center justify-center rounded-lg bg-forge px-7 font-extrabold text-white max-sm:w-full ${
        small ? "min-h-11 min-w-[138px] text-sm" : "min-h-14 min-w-[220px] text-lg"
      }`}
    >
      {children}
    </Link>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
      <span className="size-3.5 rounded-full bg-forge" />
      <p className="m-0 text-lg">{label}</p>
      <strong>{value}</strong>
    </div>
  );
}





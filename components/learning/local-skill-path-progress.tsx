"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { getNextQuestionId, getSkillPathProgress, resetSkillPathProgress, type SkillPathProgress } from "@/lib/local-progress";
import type { SkillPath } from "@/data/types";

function useLocalSkillPathProgress(skillPath: SkillPath) {
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
  return {
    progress: getSkillPathProgress(skillPath),
    nextQuestionId: getNextQuestionId(skillPath),
  };
}

export function LocalRecommendedNextAction({ skillPath }: { skillPath: SkillPath }) {
  const { progress, nextQuestionId } = useLocalSkillPathProgress(skillPath);
  const nextStage = skillPath.learningStages?.find((stage) => stage.questionIds.some((questionId) => questionId === nextQuestionId));
  const href = nextQuestionId ? `/question/${nextQuestionId}` : skillPath.href;
  const isComplete = progress.totalQuestions > 0 && progress.completedQuestionIds.length >= progress.totalQuestions;
  const isStarted = progress.attemptedCount > 0;

  return (
    <Card className="border-forge/25 bg-gradient-to-br from-forge/10 to-white p-6 max-md:p-4">
      <div className="grid grid-cols-[1fr_auto] items-center gap-5 max-md:grid-cols-1">
        <div>
          <p className="mb-2 text-sm font-extrabold uppercase text-forge">Recommended next</p>
          <h2 className="m-0 text-3xl font-extrabold max-md:text-2xl">
            {isComplete ? "Review Basic differentiation" : nextStage?.name ?? "Foundations"}
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            {isComplete
              ? "All questions in this path have been attempted on this browser. Review the path or reset local progress to practise again."
              : progress.attemptedCount === 0
                ? "Start with the first Foundations question. Progress is saved on this browser."
                : "Continue with the next unanswered question. No account needed."}
          </p>
        </div>
        <Link href={href} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-forge px-6 font-extrabold text-white max-md:w-full">
          {isComplete ? "Review Path" : nextStage ? `${isStarted ? "Continue" : "Start"} ${nextStage.name}` : "Start Foundations"}
        </Link>
      </div>
    </Card>
  );
}

export function LocalSkillPathProgressOverview({ skillPath }: { skillPath: SkillPath }) {
  const { progress } = useLocalSkillPathProgress(skillPath);

  return (
    <Card className="p-6 max-md:p-4">
      <div className="grid grid-cols-[260px_1fr] gap-7 max-lg:grid-cols-1">
        <div>
          <p className="mb-2 text-sm font-bold uppercase text-muted">Overall progress</p>
          <div className="flex items-center gap-5">
            <div className="grid size-24 place-items-center rounded-full border-[10px] border-[#eeeae3] bg-white text-center">
              <strong className="text-2xl">{progress.completionPercentage}%</strong>
            </div>
            <div>
              <p className="m-0 font-bold">{progress.completedQuestionIds.length} / {progress.totalQuestions} attempted</p>
              <p className="mt-2 text-sm text-muted">{progress.completionPercentage}% complete</p>
              <p className="mt-1 text-sm font-bold text-[#188246]">
                Accuracy: {progress.accuracyPercentage === null ? "Not enough data" : `${progress.accuracyPercentage}%`}
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="mb-4 text-sm font-bold uppercase text-muted">Stage progress</p>
          <div className="grid gap-4">
            {skillPath.learningStages?.map((stage) => {
              const stageProgress = progress.stageProgress[stage.id];
              return (
                <div key={stage.id} className="grid grid-cols-[170px_1fr_auto] items-center gap-4 max-md:grid-cols-1 max-md:gap-2">
                  <span className="font-bold">{stage.name}</span>
                  <ProgressBar value={stageProgress?.completionPercentage ?? 0} />
                  <span className="text-sm font-bold text-muted">
                    {stageProgress?.completedQuestionIds.length ?? 0} / {stage.questionIds.length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function LocalProgressControls({ skillPath }: { skillPath: SkillPath }) {
  function handleReset() {
    const confirmed = window.confirm("This clears progress for Basic differentiation on this browser only.");
    if (!confirmed) return;
    resetSkillPathProgress(skillPath.slug);
  }

  return (
    <Card className="bg-[#fffaf5] p-5 max-md:p-4">
      <div className="flex items-center justify-between gap-4 max-md:grid">
        <p className="m-0 text-sm leading-relaxed text-muted">
          Progress is saved locally on this browser. No account is needed for the beta.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-bold text-muted transition hover:border-forge hover:text-forge max-md:w-full"
        >
          <RotateCcw className="size-4" />
          Reset local progress
        </button>
      </div>
    </Card>
  );
}

export function LocalSkillPathProgressSummary({ skillPath }: { skillPath: SkillPath }) {
  return (
    <div className="grid gap-5">
      <LocalSkillPathProgressOverview skillPath={skillPath} />
      <LocalProgressControls skillPath={skillPath} />
    </div>
  );
}

export function getProgressCopy(progress: SkillPathProgress) {
  return `${progress.completedQuestionIds.length} / ${progress.totalQuestions}`;
}
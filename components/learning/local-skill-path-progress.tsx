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

  return (
    <Card className="p-6 max-md:p-4">
      <h2 className="mb-5 text-xl font-extrabold">Recommended Next</h2>
      <p className="mb-2 text-sm font-bold uppercase text-muted">Local progress only</p>
      <h3 className="text-3xl font-extrabold text-[#188246] max-md:text-2xl">{isComplete ? "Review Basic differentiation" : nextStage?.name ?? "Foundations"}</h3>
      <p className="mt-3 leading-relaxed text-muted">
        {isComplete
          ? "All questions in this path have been attempted on this browser. Review the path or reset local progress to practise again."
          : progress.attemptedCount === 0
            ? "Start with the first Foundations question. Progress is saved on this browser."
            : "Continue with the next unanswered question. No account needed."}
      </p>
      <Link href={href} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-forge px-5 font-extrabold text-white max-md:w-full">
        {isComplete ? "Review Path" : nextStage ? `Continue ${nextStage.name}` : "Start Foundations"}
      </Link>
    </Card>
  );
}

export function LocalSkillPathProgressSummary({ skillPath }: { skillPath: SkillPath }) {
  const { progress } = useLocalSkillPathProgress(skillPath);

  function handleReset() {
    const confirmed = window.confirm("This clears progress for Basic differentiation on this browser only.");
    if (!confirmed) return;
    resetSkillPathProgress(skillPath.slug);
  }

  return (
    <Card className="p-6 max-md:p-4">
      <div className="mb-5 flex items-start justify-between gap-4 max-md:grid">
        <div>
          <h2 className="m-0 text-xl font-extrabold">Mastery / Progress</h2>
          <p className="mt-2 text-sm text-muted">Progress is saved on this browser. No account needed.</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-bold text-muted transition hover:border-forge hover:text-forge max-md:w-full"
        >
          <RotateCcw className="size-4" />
          Reset local progress
        </button>
      </div>
      <div className="grid gap-4">
        <SummaryRow label="Completed" value={`${progress.completedQuestionIds.length} / ${progress.totalQuestions}`} />
        <SummaryRow label="Correct" value={`${progress.correctCount} / ${progress.totalQuestions}`} />
        <SummaryRow label="Accuracy" value={progress.accuracyPercentage === null ? "Not enough data" : `${progress.accuracyPercentage}%`} />
        <div className="rounded-xl border border-line bg-[#fffdf9] p-4">
          <div className="mb-3 flex justify-between font-bold">
            <span>Completion</span>
            <span>{progress.completionPercentage}%</span>
          </div>
          <ProgressBar value={progress.completionPercentage} />
        </div>
        <div className="grid gap-3">
          {skillPath.learningStages?.map((stage) => {
            const stageProgress = progress.stageProgress[stage.id];
            return (
              <div key={stage.id} className="rounded-xl border border-line bg-white p-4">
                <div className="mb-3 flex justify-between gap-4 font-bold">
                  <span>{stage.name}</span>
                  <span>{stageProgress?.completedQuestionIds.length ?? 0} / {stage.questionIds.length}</span>
                </div>
                <ProgressBar value={stageProgress?.completionPercentage ?? 0} />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export function getProgressCopy(progress: SkillPathProgress) {
  return `${progress.completedQuestionIds.length} / ${progress.totalQuestions}`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-[#fffdf9] p-4 max-sm:grid">
      <span className="text-muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}




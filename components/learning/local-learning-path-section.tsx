"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, PenLine } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { getEmptyProgressEvidence, getStageProgress } from "@/lib/local-progress";
import { useHasMounted } from "@/lib/use-mounted";
import type { LearningStage, LearningStageName, SkillPath } from "@/data/types";

const stageIcons = {
  Foundations: BookOpen,
  Applications: PenLine,
  "Past Paper-style Questions": ClipboardList,
} as const;

const statusClasses = {
  complete: { text: "text-success", soft: "bg-success-soft" },
  "in-progress": { text: "text-forge", soft: "bg-forge-soft" },
  "not-started": { text: "text-muted", soft: "bg-[#f4f1eb]" },
};

export function LocalLearningPathSection({ skillPath }: { skillPath: SkillPath }) {
  const [version, setVersion] = useState(0);
  const stages = skillPath.learningStages ?? [];

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

  if (!stages.length) return null;

  return (
    <section>
      <div className="mb-3">
        <h2 className="m-0 text-xl font-extrabold">Your learning path</h2>
        <p className="mt-1 text-sm text-muted">Follow the stages in order for the clearest route through Basic differentiation.</p>
      </div>
      <div className="grid gap-4">
        {stages.map((stage, index) => (
          <LocalLearningStageCard key={stage.id} skillPath={skillPath} stage={stage} index={index} />
        ))}
      </div>
    </section>
  );
}

function LocalLearningStageCard({ skillPath, stage, index }: { skillPath: SkillPath; stage: LearningStage; index: number }) {
  const Icon = stageIcons[stage.name as LearningStageName] ?? BookOpen;
  const hasMounted = useHasMounted();
  const progress = getStageProgress(skillPath, stage, hasMounted ? undefined : getEmptyProgressEvidence());
  const firstQuestionId = stage.questionIds[0];
  const firstUnansweredQuestionId = stage.questionIds.find((questionId) => !progress.completedQuestionIds.includes(questionId));
  const targetQuestionId = firstUnansweredQuestionId ?? firstQuestionId;
  const href = targetQuestionId ? `/question/${targetQuestionId}` : skillPath.href;
  const isComplete = progress.completedQuestionIds.length >= stage.questionIds.length && stage.questionIds.length > 0;
  const isStarted = progress.attemptedCount > 0;
  const buttonLabel = isComplete ? "Review stage" : isStarted ? `Continue ${stage.name}` : stage.button;
  const status = isComplete ? "complete" : isStarted ? "in-progress" : "not-started";
  const statusLabel = formatStatus(progress.status);
  const accent = statusClasses[status];

  return (
    <div className="grid grid-cols-[48px_1fr] gap-4 max-md:grid-cols-1">
      <div className="relative flex justify-center max-md:hidden">
        {index < (skillPath.learningStages?.length ?? 0) - 1 ? <span className="absolute top-10 h-[calc(100%+16px)] w-px bg-line" /> : null}
        <span className="z-10 grid size-9 place-items-center rounded-full border-2 border-line bg-paper font-extrabold text-ink">
          {index + 1}
        </span>
      </div>
      <Card className="p-4 transition">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 max-md:grid-cols-1">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-forge-soft text-forge">
            <Icon className="size-6" />
          </span>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h3 className="m-0 text-xl font-extrabold">{stage.name}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${accent.soft} ${accent.text}`}>{statusLabel}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{stage.description}</p>
            <div className="mt-3 grid gap-2">
              <div className="flex flex-wrap justify-between gap-3 text-sm font-bold text-muted">
                <span>{stage.questions} questions</span>
                <span>{stage.estimatedMinutes} min</span>
                <span>{progress.completedQuestionIds.length} / {stage.questions} complete</span>
              </div>
              <ProgressBar value={progress.completionPercentage} />
            </div>
          </div>
          <Link href={href} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-forge px-4 text-sm font-extrabold text-white max-md:w-full">
            {buttonLabel}
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </Card>
    </div>
  );
}

function formatStatus(status: string) {
  return status.split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, PenLine } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { getStageProgress } from "@/lib/local-progress";
import type { LearningStage, LearningStageName, SkillPath } from "@/data/types";

const stageIcons = {
  Foundations: BookOpen,
  Applications: PenLine,
  "Past Paper-style Questions": ClipboardList,
} as const;

const accentClasses = {
  green: {
    border: "border-[#229954]/45",
    bg: "bg-[#f1fbf4]",
    text: "text-[#188246]",
    button: "bg-[#188246] text-white",
    soft: "bg-[#f1fbf4]",
  },
  blue: {
    border: "border-[#2563eb]/40",
    bg: "bg-[#eef5ff]",
    text: "text-[#1d5fd8]",
    button: "bg-[#1d5fd8] text-white",
    soft: "bg-[#eef5ff]",
  },
  orange: {
    border: "border-forge/45",
    bg: "bg-[#fff4ec]",
    text: "text-forge",
    button: "bg-forge text-white",
    soft: "bg-[#fff4ec]",
  },
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
      <div className="mb-5">
        <h2 className="m-0 text-3xl font-extrabold">Your learning path</h2>
        <p className="mt-2 text-muted">Follow the stages in order for the clearest route through Basic differentiation.</p>
      </div>
      <div className="grid gap-5">
        {stages.map((stage, index) => (
          <LocalLearningStageCard key={stage.id} skillPath={skillPath} stage={stage} index={index} />
        ))}
      </div>
    </section>
  );
}

function LocalLearningStageCard({ skillPath, stage, index }: { skillPath: SkillPath; stage: LearningStage; index: number }) {
  const Icon = stageIcons[stage.name as LearningStageName] ?? BookOpen;
  const accent = accentClasses[stage.accent];
  const progress = getStageProgress(skillPath, stage);
  const firstQuestionId = stage.questionIds[0];
  const firstUnansweredQuestionId = stage.questionIds.find((questionId) => !progress.completedQuestionIds.includes(questionId));
  const targetQuestionId = firstUnansweredQuestionId ?? firstQuestionId;
  const href = targetQuestionId ? `/question/${targetQuestionId}` : skillPath.href;
  const isComplete = progress.completedQuestionIds.length >= stage.questionIds.length && stage.questionIds.length > 0;
  const isStarted = progress.completedQuestionIds.length > 0;
  const buttonLabel = isComplete ? "Review stage" : isStarted ? `Continue ${stage.name}` : stage.button;
  const statusLabel = isComplete ? "Complete" : isStarted ? "In progress" : "Not started";

  return (
    <div className="grid grid-cols-[56px_1fr] gap-5 max-md:grid-cols-1">
      <div className="relative flex justify-center max-md:hidden">
        {index < (skillPath.learningStages?.length ?? 0) - 1 ? <span className="absolute top-12 h-[calc(100%+20px)] w-px bg-line" /> : null}
        <span className={`z-10 grid size-11 place-items-center rounded-full border-2 bg-paper font-extrabold ${accent.border} ${accent.text}`}>
          {index + 1}
        </span>
      </div>
      <Card className={`p-6 transition ${accent.border}`}>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 max-md:grid-cols-1">
          <span className={`grid size-16 shrink-0 place-items-center rounded-2xl ${accent.bg} ${accent.text}`}>
            <Icon className="size-8" />
          </span>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h3 className="m-0 text-2xl font-extrabold">{stage.name}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${accent.soft} ${accent.text}`}>{statusLabel}</span>
            </div>
            <p className="mt-2 text-muted">{stage.description}</p>
            <div className="mt-5 grid gap-3">
              <div className="flex flex-wrap justify-between gap-3 text-sm font-bold text-muted">
                <span>{stage.questions} questions</span>
                <span>{stage.estimatedMinutes} min</span>
                <span>{progress.completedQuestionIds.length} / {stage.questions} complete</span>
              </div>
              <ProgressBar value={progress.completionPercentage} />
            </div>
          </div>
          <Link href={href} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 font-extrabold ${accent.button} max-md:w-full`}>
            {buttonLabel}
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
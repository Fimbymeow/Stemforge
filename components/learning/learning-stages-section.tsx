import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, PenLine } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import type { LearningStage, LearningStageName } from "@/data/types";

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
  },
  blue: {
    border: "border-[#2563eb]/40",
    bg: "bg-[#eef5ff]",
    text: "text-[#1d5fd8]",
    button: "bg-[#1d5fd8] text-white",
  },
  orange: {
    border: "border-forge/45",
    bg: "bg-forge-soft",
    text: "text-forge",
    button: "bg-forge text-white",
  },
};

export function LearningStagesSection({
  stages,
  getStageHref,
}: {
  stages?: LearningStage[];
  getStageHref?: (stage: LearningStage) => string;
}) {
  if (!stages?.length) return null;

  return (
    <section>
      <h2 className="m-0 text-3xl font-extrabold">Practice Path</h2>
      <p className="mt-2 text-muted">Work from Foundations into Applications, then Past Paper-style Questions.</p>
      <div className="mt-7 grid gap-5">
        {stages.map((stage, index) => (
          <LearningStageCard key={stage.id} stage={stage} index={index} href={getStageHref?.(stage) ?? stage.href ?? "/question"} />
        ))}
      </div>
    </section>
  );
}

export function LearningStageCard({ stage, index, href }: { stage: LearningStage; index: number; href: string }) {
  const Icon = stageIcons[stage.name as LearningStageName] ?? BookOpen;
  const accent = accentClasses[stage.accent];
  const progress = stage.questions ? Math.round((stage.completed / stage.questions) * 100) : 0;
  const isLocked = stage.status !== "available";

  return (
    <Card className={`relative overflow-hidden p-6 ${accent.border} ${isLocked ? "opacity-70" : ""}`}>
      <div className="grid grid-cols-[56px_1fr_auto] items-center gap-5 max-md:grid-cols-1">
        <span className={`grid size-14 place-items-center rounded-2xl ${accent.bg} ${accent.text}`}>
          <Icon className="size-7" />
        </span>
        <div>
          <p className={`mb-2 text-sm font-extrabold uppercase ${accent.text}`}>Stage {index + 1}</p>
          <h3 className="m-0 text-2xl font-extrabold">{stage.name}</h3>
          <p className="mt-2 text-muted">{stage.description}</p>
          <div className="mb-3 mt-5 flex flex-wrap justify-between gap-3 text-sm font-bold">
            <span>{stage.questions} Questions</span>
            <span>{stage.estimatedMinutes} min</span>
            <span>
              {stage.completed} / {stage.questions} Complete
            </span>
          </div>
          <ProgressBar value={progress} />
        </div>
        {isLocked ? (
          <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-[#f4f1eb] px-5 font-extrabold text-muted">
            Coming soon
          </span>
        ) : (
          <Link href={href} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 font-extrabold ${accent.button}`}>
            {stage.button}
            <ArrowRight className="size-5" />
          </Link>
        )}
      </div>
    </Card>
  );
}


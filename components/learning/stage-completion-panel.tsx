import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui";
import { getSkillPathHref } from "@/lib/learning-paths";
import { MasteryBadge, ReviewBadge, type CompletedTierStatus } from "@/components/learning/mastery-badge";
import type { LearningStage, SkillPath } from "@/data/types";
import type { StageProgress } from "@/lib/progress/types";
import type { LearnerNextAction } from "@/lib/learning/next-action";

export function getStageCompletionSupportingSentence(status: CompletedTierStatus, reviewCount: number) {
  if (reviewCount > 0) {
    return `${reviewCount} supported question${reviewCount === 1 ? "" : "s"} ${reviewCount === 1 ? "is" : "are"} ready for review.`;
  }
  if (status === "secure") return "You completed this stage and showed strong understanding.";
  if (status === "mastered") return "You completed this stage with strong independent performance.";
  return "You worked through every question in this stage.";
}

/**
 * The one-time stage-completion moment. Renders in place of the Previous/Next row in
 * QuestionWorkspace, only on the submission where a stage crosses incomplete -> complete,
 * and only when that same submission does not also complete the whole path (the path
 * moment is the stronger, dominant acknowledgement and takes precedence — see
 * question-workspace.tsx). Deliberately smaller than PathCompletionPanel: no full-size
 * completion ring, single secondary action.
 */
export function StageCompletionPanel({
  skillPath,
  stage,
  progress,
  nextAction,
}: {
  skillPath: SkillPath;
  stage: LearningStage;
  progress: StageProgress;
  nextAction: LearnerNextAction;
}) {
  const status = progress.status as CompletedTierStatus;
  const reviewCount = progress.reviewQuestionIds.length;
  const heading = `${stage.name} ${status === "completed" ? "complete" : status}`;
  const supporting = getStageCompletionSupportingSentence(status, reviewCount);

  return (
    <Card role="status" aria-live="polite" data-testid="stage-completion-panel" className="animate-fade-rise p-4">
      <div className="flex items-start gap-3 max-md:grid">
        <StageCompletionMark />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <MasteryBadge status={status} />
            <ReviewBadge count={reviewCount} />
          </div>
          <h2 className="m-0 text-base font-extrabold">{heading}</h2>
          <p id="stage-completion-next-action-reason" className="mt-2 text-ink">{supporting} {nextAction.reason}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold text-muted">
            <span>{progress.completedQuestionIds.length} / {progress.totalQuestions} completed</span>
            <span>
              {progress.firstAttemptAccuracyPercentage === null
                ? "Not enough data"
                : `${progress.firstAttemptAccuracyPercentage}% first-attempt accuracy`}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {nextAction.href ? <Link
              href={nextAction.href}
              data-testid="stage-completion-primary-action"
              aria-describedby="stage-completion-next-action-reason"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white max-md:w-full"
            >
              {nextAction.label}
            </Link> : null}
            <Link
              href={getSkillPathHref(skillPath)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-extrabold max-md:w-full"
            >
              View path
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function StageCompletionMark() {
  return (
    <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-forge-soft" aria-hidden="true">
      <Check className="size-4 text-forge animate-check-pop" />
    </span>
  );
}

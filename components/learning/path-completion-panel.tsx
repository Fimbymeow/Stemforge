import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui";
import { getSkillPathHref, getSubjectForSkillPath } from "@/lib/learning-paths";
import { MasteryBadge, ReviewBadge, type CompletedTierStatus } from "@/components/learning/mastery-badge";
import { QuickPracticeAction } from "@/components/practice/quick-practice-action";
import type { SkillPath } from "@/data/types";
import type { SkillPathProgress } from "@/lib/local-progress";
import type { LearnerNextAction } from "@/lib/learning/next-action";

export function getPathCompletionSupportingSentence(status: CompletedTierStatus, reviewCount: number) {
  if (reviewCount > 0) {
    return `${reviewCount} supported question${reviewCount === 1 ? "" : "s"} ${reviewCount === 1 ? "is" : "are"} ready for review.`;
  }
  if (status === "secure") return "You completed the path and showed strong understanding.";
  if (status === "mastered") return "You completed the path with strong independent performance.";
  return "You worked through every question in this path.";
}

/**
 * The one-time completion moment. Renders in place of the Previous/Next row in
 * QuestionWorkspace, only on the submission where the path crosses incomplete -> complete.
 */
export function PathCompletionPanel({ skillPath, progress, nextAction }: { skillPath: SkillPath; progress: SkillPathProgress; nextAction: LearnerNextAction }) {
  const status = progress.status as CompletedTierStatus;
  const reviewCount = progress.reviewQuestionIds.length;
  const heading = `${skillPath.name} ${status === "completed" ? "complete" : status}`;
  const supporting = getPathCompletionSupportingSentence(status, reviewCount);
  const subject = getSubjectForSkillPath(skillPath);
  const subjectAction = { href: subject?.href ?? "/subjects", label: `Return to ${subject?.subjectName ?? "subject"}` };

  const secondary = nextAction.kind === "review_question"
    ? subjectAction
    : { href: getSkillPathHref(skillPath), label: "Review a stage" };

  return (
    <Card role="status" aria-live="polite" data-testid="path-completion-panel" className="animate-fade-rise p-4">
      <div className="flex items-start gap-4 max-md:grid">
        <CompletionRing />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <MasteryBadge status={status} />
            <ReviewBadge count={reviewCount} />
          </div>
          <h2 className="m-0 text-lg font-extrabold">{heading}</h2>
          <p id="completion-next-action-reason" className="mt-2 text-ink">{supporting} {nextAction.reason}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold text-muted">
            <span>{progress.completedQuestionIds.length} / {progress.totalQuestions} completed</span>
            <span>
              {progress.firstAttemptAccuracyPercentage === null
                ? "Not enough data"
                : `${progress.firstAttemptAccuracyPercentage}% first-attempt accuracy`}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {nextAction.kind === "practice_again" ? (
              <QuickPracticeAction
                preferredPathId={skillPath.slug}
                label={nextAction.label}
                testId="path-completion-primary-action"
                describedBy="completion-next-action-reason"
                className="max-md:w-full"
              />
            ) : nextAction.href ? <Link
              href={nextAction.href}
              data-testid="path-completion-primary-action"
              aria-describedby="completion-next-action-reason"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white max-md:w-full"
            >
              {nextAction.label}
            </Link> : null}
            <Link
              href={secondary.href}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-extrabold max-md:w-full"
            >
              {secondary.label}
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CompletionRing() {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center" aria-hidden="true">
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-11 -rotate-90">
        <circle cx="20" cy="20" r="16" fill="none" strokeWidth="4" className="stroke-line" />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          strokeWidth="4"
          strokeDasharray="101"
          strokeLinecap="round"
          className="stroke-forge animate-ring-fill"
        />
      </svg>
      <Check className="relative size-5 text-forge animate-check-pop" />
    </span>
  );
}

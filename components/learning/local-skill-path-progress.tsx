"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw, Target, TrendingUp } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { isCompletedTierStatus, MasteryBadge, ReviewBadge, type CompletedTierStatus } from "@/components/learning/mastery-badge";
import { getPathCompletionSupportingSentence } from "@/components/learning/path-completion-panel";
import { acknowledgeStatus, clearPathCelebration, getPathCelebration, isAcknowledgedStatusUpgrade } from "@/lib/completion-tracking";
import { getQuestionHref, getSkillPathHref } from "@/lib/learning-paths";
import { getEmptyProgressEvidence, getNextQuestionId, getSkillPathProgress, resetSkillPathProgress, type SkillPathProgress } from "@/lib/local-progress";
import { useHasMounted } from "@/lib/use-mounted";
import type { SkillPath } from "@/data/types";

const HIGHER_MATHS_HUB_HREF = "/subjects/higher-maths";

function useLocalSkillPathProgress(skillPath: SkillPath) {
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
  return {
    progress: getSkillPathProgress(skillPath, evidenceOverride),
    nextQuestionId: getNextQuestionId(skillPath, evidenceOverride),
  };
}

export function LocalRecommendedNextAction({ skillPath }: { skillPath: SkillPath }) {
  const { progress, nextQuestionId } = useLocalSkillPathProgress(skillPath);
  const nextStage = skillPath.learningStages?.find((stage) => stage.questionIds.some((questionId) => questionId === nextQuestionId));
  const href = nextQuestionId ? `/question/${nextQuestionId}` : skillPath.href;
  const isComplete = progress.totalQuestions > 0 && progress.completedQuestionIds.length >= progress.totalQuestions;
  const isStarted = progress.attemptedCount > 0;

  if (isComplete && isCompletedTierStatus(progress.status)) {
    return (
      <div className="grid gap-3">
        <MasteryUpgradeBanner skillPathId={skillPath.slug} status={progress.status} />
        <CompletedPathCard skillPath={skillPath} progress={progress} status={progress.status} />
      </div>
    );
  }

  return (
    <Card className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-4">
      <p className="mb-1 text-xs font-extrabold uppercase text-forge">Recommended next</p>
      <h2 className="m-0 text-xl font-extrabold">{nextStage?.name ?? "Foundations"}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {progress.attemptedCount === 0
          ? "Start with the first Foundations question. Progress is saved on this browser."
          : "Continue with the next unanswered question. No account needed."}
      </p>
      <Link href={href} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white">
        {nextStage ? `${isStarted ? "Continue" : "Start"} ${nextStage.name}` : "Start Foundations"}
      </Link>
    </Card>
  );
}

/**
 * One-time, dismissible acknowledgement for a mastery-tier upgrade on revisit (Completed -> Secure,
 * Secure -> Mastered). Distinct from the full completion moment in path-completion-panel.tsx, which
 * is reserved for the single "finished the whole path" instant. Never auto-dismisses.
 */
function MasteryUpgradeBanner({ skillPathId, status }: { skillPathId: string; status: CompletedTierStatus }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const previous = getPathCelebration(skillPathId)?.lastAcknowledgedStatus;
    if (previous && isAcknowledgedStatusUpgrade(previous, status)) setVisible(true);
    acknowledgeStatus(skillPathId, status);
  }, [skillPathId, status]);

  if (!visible) return null;

  return (
    <div
      role="status"
      data-testid="mastery-upgrade-banner"
      className="animate-fade-rise flex items-center justify-between gap-3 rounded-lg border border-forge/25 bg-forge-soft px-4 py-2.5 text-sm font-bold text-forge"
    >
      <span>This path is now {formatStatus(status)}.</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setVisible(false)}
        className="min-h-8 min-w-8 shrink-0 rounded-md text-lg leading-none text-forge transition hover:bg-forge/10"
      >
        ×
      </button>
    </div>
  );
}

/** Permanent state for a completed/secure/mastered path. Not a relabelled "Continue" button. */
function CompletedPathCard({ skillPath, progress, status }: { skillPath: SkillPath; progress: SkillPathProgress; status: CompletedTierStatus }) {
  const reviewCount = progress.reviewQuestionIds.length;
  const heading = `${skillPath.name} ${status === "completed" ? "complete" : status}`;
  const supporting = getPathCompletionSupportingSentence(status, reviewCount);
  const reviewHref = reviewCount > 0 ? getQuestionHref(progress.reviewQuestionIds[0]) : undefined;
  const primary = reviewHref
    ? { href: reviewHref, label: "Review recommended questions" }
    : { href: HIGHER_MATHS_HUB_HREF, label: "Return to Higher Maths" };
  const secondary = reviewHref
    ? { href: HIGHER_MATHS_HUB_HREF, label: "Return to Higher Maths" }
    : { href: getSkillPathHref(skillPath), label: "Review a stage" };

  return (
    <Card data-testid="completed-path-card" className="border-forge/30 bg-gradient-to-br from-forge/10 to-white p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <MasteryBadge status={status} />
        <ReviewBadge count={reviewCount} />
      </div>
      <h2 className="m-0 text-xl font-extrabold">{heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{supporting}</p>
      <p className="mt-3 text-sm font-bold text-muted">
        {progress.completedQuestionIds.length} / {progress.totalQuestions} questions
        {progress.firstAttemptAccuracyPercentage !== null ? ` · ${progress.firstAttemptAccuracyPercentage}% first-attempt accuracy` : ""}
      </p>
      <VersionProgressNotice progress={progress} />
      <div className="mt-4 grid gap-2">
        <Link href={primary.href} className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white">
          {primary.label}
        </Link>
        <Link href={secondary.href} className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-extrabold text-ink">
          {secondary.label}
        </Link>
      </div>
    </Card>
  );
}

export function LocalSkillPathProgressOverview({ skillPath }: { skillPath: SkillPath }) {
  const { progress } = useLocalSkillPathProgress(skillPath);

  return (
    <Card data-testid="path-progress-summary" className="p-4">
      <VersionProgressNotice progress={progress} />
      <div className="grid grid-cols-[220px_1fr] gap-5 max-lg:grid-cols-1">
        <div>
          <p className="mb-2 text-sm font-bold uppercase text-muted">Overall progress</p>
          <div className="flex items-center gap-5">
            <div className="grid size-20 place-items-center rounded-full border-[8px] border-line bg-white text-center">
              <strong className="text-xl">{progress.completionPercentage}%</strong>
            </div>
            <div>
              <p className="m-0 font-bold">{progress.completedQuestionIds.length} / {progress.totalQuestions} completed</p>
              <p className="mt-2 text-sm text-muted">{progress.completionPercentage}% complete</p>
              <p className="mt-1 text-sm font-bold text-[#188246]">
                First-attempt accuracy: {progress.firstAttemptAccuracyPercentage === null ? "Not enough data" : `${progress.firstAttemptAccuracyPercentage}%`}
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold uppercase text-muted">
            Stage progress
            {isCompletedTierStatus(progress.status) ? (
              <>
                <MasteryBadge status={progress.status} className="normal-case" />
                <ReviewBadge count={progress.reviewQuestionIds.length} className="normal-case" />
              </>
            ) : (
              <span>· {formatStatus(progress.status)}</span>
            )}
          </p>
          <div className="grid gap-4">
            {skillPath.learningStages?.map((stage) => {
              const stageProgress = progress.stageProgress[stage.id];
              return (
                <div key={stage.id} className="grid grid-cols-[150px_1fr_auto] items-center gap-3 max-md:grid-cols-1 max-md:gap-2">
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

function VersionProgressNotice({ progress }: { progress: SkillPathProgress }) {
  if (progress.reassessmentRequiredQuestionIds.length > 0) {
    return (
      <p data-testid="version-progress-notice" className="mb-4 rounded-lg border border-forge/20 bg-forge-soft px-3 py-2 text-sm font-bold text-forge">
        Updated practice is available. Previous achievement is retained; reassessment is required for current readiness.
      </p>
    );
  }
  if (progress.reassessmentRecommendedQuestionIds.length > 0) {
    return (
      <p data-testid="version-progress-notice" className="mb-4 rounded-lg border border-line bg-paper px-3 py-2 text-sm font-bold text-muted">
        Previous completion is retained. A short reassessment is recommended because the original question version is unknown.
      </p>
    );
  }
  if (progress.newPracticeAvailable) {
    return <p data-testid="version-progress-notice" className="mb-4 text-sm font-bold text-forge">New practice available.</p>;
  }
  return null;
}

function formatStatus(status: string) {
  return status.split("_").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

export function LocalProgressControls({ skillPath }: { skillPath: SkillPath }) {
  function handleReset() {
    const confirmed = window.confirm(`This clears progress for ${skillPath.name} on this browser only.`);
    if (!confirmed) return;
    resetSkillPathProgress(skillPath.slug);
    clearPathCelebration(skillPath.slug);
  }

  return (
    <Card className="bg-paper p-4">
      <div className="flex items-center justify-between gap-4 max-md:grid">
        <p className="m-0 text-sm leading-relaxed text-muted">
          Progress is saved locally on this browser. No account is needed for the beta.
        </p>
        <button
          type="button"
          data-testid="reset-progress"
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

export function LocalSkillPathHeroProgress({ skillPath }: { skillPath: SkillPath }) {
  const { progress } = useLocalSkillPathProgress(skillPath);
  return (
    <div data-testid="skill-path-hero-progress">
      <div className="mt-5 grid max-w-lg grid-cols-2 gap-3 max-md:grid-cols-1">
        <div className="rounded-xl border border-line bg-white p-4">
          <Target className="mb-3 size-5 text-forge" />
          <strong className="block text-xl">{progress.totalQuestions}</strong>
          <span className="mt-1 block text-sm text-muted">Questions</span>
        </div>
        <div className="rounded-xl border border-line bg-white p-4" data-testid="path-mastery-status">
          <TrendingUp className="mb-3 size-5 text-forge" />
          {isCompletedTierStatus(progress.status) ? (
            <MasteryBadge status={progress.status} className="text-sm" />
          ) : (
            <strong className="block text-xl">{formatStatus(progress.status)}</strong>
          )}
          <span className="mt-1 block text-sm text-muted">Mastery</span>
        </div>
      </div>
      <ProgressBar value={progress.completionPercentage} className="mt-5 h-3" />
    </div>
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

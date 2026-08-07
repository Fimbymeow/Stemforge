"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  List,
  SkipForward,
  Timer,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { getPathCompletionSupportingSentence } from "@/components/learning/path-completion-panel";
import { isCompletedTierStatus, MasteryBadge, ReviewBadge, type CompletedTierStatus } from "@/components/learning/mastery-badge";
import { QuickPracticeAction } from "@/components/practice/quick-practice-action";
import { usePracticeActivation } from "@/components/practice/use-practice-activation";
import { QuestionWorkspace } from "@/components/questions/question-workspace";
import { Card } from "@/components/ui";
import { recordPathCelebrated } from "@/lib/completion-tracking";
import { contentResolver } from "@/lib/content-resolver";
import { derivePracticeSummaryNextAction } from "@/lib/learning/next-action";
import { getEmptyProgressEvidence, getProgressEvidence, getSkillPathProgress } from "@/lib/local-progress";
import { practiceOriginLabel, practiceReturnDestination, practiceSubjectDestination } from "@/lib/practice/practice-destinations";
import { resolvePracticeReference } from "@/lib/practice/practice-eligibility";
import { derivePracticeQuestionStatuses, practiceStatusLabel, type PracticeQuestionStatus } from "@/lib/practice/practice-question-status";
import {
  completePracticeSession,
  setPracticeQuestionIndex,
  setPracticeQuestionSkipped,
} from "@/lib/practice/practice-session-actions";
import { createCompletedSessionRetry, createCompletedSkippedRetry } from "@/lib/practice/practice-selection";
import { getPracticeSession } from "@/lib/practice/practice-storage";
import { derivePracticeSessionSummary } from "@/lib/practice/practice-summary";
import type { PracticeSession as PracticeSessionModel } from "@/lib/practice/practice-types";
import type { ProgressEvidence } from "@/lib/progress/types";
import { recordResolvedReviewTargets } from "@/lib/review/emission";

export function PracticeSession({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<PracticeSessionModel | null>(null);
  const [evidence, setEvidence] = useState<ProgressEvidence>(getEmptyProgressEvidence());
  const [showQuestions, setShowQuestions] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [reviewSaveError, setReviewSaveError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSession(getPracticeSession(sessionId));
    setEvidence(getProgressEvidence() ?? getEmptyProgressEvidence());
  }, [sessionId]);

  useEffect(refresh, [refresh]);
  useEffect(() => {
    window.addEventListener("stemforge:practice-session-updated", refresh);
    window.addEventListener("stemforge:local-progress-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("stemforge:practice-session-updated", refresh);
      window.removeEventListener("stemforge:local-progress-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!session || session.mode !== "review") return;
    let cancelled = false;
    void recordResolvedReviewTargets(session).then((result) => {
      if (cancelled) return;
      setReviewSaveError(result.status === "write_failed"
        ? "Your Review result could not be recorded yet. Keep this session and try again."
        : null);
    });
    return () => { cancelled = true; };
  }, [session, evidence]);

  if (!session) {
    return (
      <AppShell demo={false} active="Practice">
        <Card className="mx-auto mt-8 max-w-2xl p-6">
          <h1 className="text-xl font-extrabold">Session not found</h1>
          <p className="mt-2 text-muted">Start a new practice session from the practice page.</p>
          <Link href="/practice" className="mt-4 inline-flex font-bold text-forge">Open practice setup</Link>
        </Card>
      </AppShell>
    );
  }

  const statuses = derivePracticeQuestionStatuses(session, evidence);
  const summary = derivePracticeSessionSummary(session, evidence);
  if (session.status === "completed") return <PracticeSummaryCard session={session} summary={summary} />;

  const currentReference = session.questionReferences[session.currentQuestionIndex];
  const currentStatus = statuses[session.currentQuestionIndex];
  const resolved = currentReference ? resolvePracticeReference(currentReference) : { status: "unresolvable" as const };

  async function moveTo(index: number) {
    const result = await setPracticeQuestionIndex(session!.sessionId, index);
    handleActionResult(result);
    if (result.status === "updated") {
      setAnnouncement(`Question ${result.session.currentQuestionIndex + 1} of ${result.session.questionReferences.length}`);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.getElementById("question-heading")?.focus()));
    }
  }

  async function toggleSkipped() {
    if (!currentStatus || currentStatus.unavailable) return;
    const nextSkipped = !currentStatus.skipped;
    const result = await setPracticeQuestionSkipped(session!.sessionId, currentReference.questionId, nextSkipped);
    handleActionResult(result);
    if (result.status === "updated") setAnnouncement(nextSkipped ? `Question ${session!.currentQuestionIndex + 1} skipped` : `Skip removed from question ${session!.currentQuestionIndex + 1}`);
    if (nextSkipped && result.status === "updated" && session!.currentQuestionIndex < session!.questionReferences.length - 1) {
      handleActionResult(await setPracticeQuestionIndex(session!.sessionId, session!.currentQuestionIndex + 1));
    }
  }

  async function clearCurrentSkip() {
    if (!currentReference) return;
    handleActionResult(await setPracticeQuestionSkipped(session!.sessionId, currentReference.questionId, false));
  }

  async function handleEvidenceRecorded() {
    await clearCurrentSkip();
    if (session!.mode !== "review") return;
    const result = await recordResolvedReviewTargets(session!);
    setReviewSaveError(result.status === "write_failed"
      ? "Your answer is saved, but your Review result still needs to be recorded. Try again."
      : null);
  }

  async function finish(elapsed: number | null = elapsedSeconds(session!)) {
    const result = await completePracticeSession(session!.sessionId, elapsed);
    setShowFinish(false);
    handleActionResult(result);
  }

  function handleActionResult(result: Awaited<ReturnType<typeof setPracticeQuestionIndex>>) {
    if (result.status === "updated" || result.status === "already_completed") {
      setSession(result.session);
      setActionError(null);
    } else {
      setActionError(result.status === "coordination_unavailable"
        ? "This browser cannot safely coordinate this session across tabs."
        : "That session change could not be saved. Please try again.");
    }
  }

  const panel = (
    <SessionToolbar
      session={session}
      statuses={statuses}
      currentStatus={currentStatus}
      actionError={actionError}
      reviewSaveError={reviewSaveError}
      showQuestions={showQuestions}
      onToggleQuestions={() => setShowQuestions((value) => !value)}
      onCloseQuestions={() => setShowQuestions(false)}
      onMove={(index) => void moveTo(index)}
      onSkip={() => void toggleSkipped()}
      onFinish={() => {
        const needsConfirmation = statuses.some((item) =>
          item.primary === "unanswered" || item.skipped || item.unavailable || item.awaitingSelfCheck);
        if (needsConfirmation) setShowFinish(true);
        else void finish();
      }}
      onExpire={() => void finish(session.timing.type === "timed" ? session.timing.timeLimitSeconds : null)}
      announcement={announcement}
    />
  );

  const finishDialog = showFinish ? (
    <FinishSessionDialog
      statuses={statuses}
      busy={false}
      onCancel={() => setShowFinish(false)}
      onConfirm={() => void finish()}
      onReview={() => {
        const unresolved = statuses.findIndex((item) =>
          item.primary === "unanswered" || item.skipped || item.unavailable || item.awaitingSelfCheck);
        setShowFinish(false);
        setShowQuestions(true);
        if (unresolved >= 0 && !statuses[unresolved].unavailable) void moveTo(unresolved);
      }}
    />
  ) : null;

  if (resolved.status !== "resolved") {
    return (
      <AppShell demo={false} active="Practice" workingContextPathId={currentReference?.pathId ?? null}>
        <div className="mx-auto grid max-w-[1080px] gap-3">
          {panel}
          <Card className="p-6" data-testid="practice-question-unavailable">
            <h1 id="question-heading" tabIndex={-1} className="text-xl font-extrabold outline-none">Question unavailable</h1>
            <p className="mt-2 text-muted">This saved question no longer matches the active content version. It has not been counted as answered or skipped.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void moveTo(session.currentQuestionIndex - 1)} disabled={session.currentQuestionIndex === 0} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 font-bold disabled:opacity-40"><ArrowLeft className="size-4" />Previous</button>
              <button type="button" onClick={() => void moveTo(session.currentQuestionIndex + 1)} disabled={session.currentQuestionIndex === session.questionReferences.length - 1} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-forge px-4 font-bold text-white disabled:opacity-40">Next<ArrowRight className="size-4" /></button>
            </div>
          </Card>
        </div>
        {finishDialog}
      </AppShell>
    );
  }

  return (
    <>
      <QuestionWorkspace
        question={resolved.question}
        session={{
          practiceSessionId: session.sessionId,
          panel,
          answerLocked: false,
          returnHref: `/practice/session/${session.sessionId}`,
          currentSelfAssessment: currentStatus.selfAssessment,
          onEvidenceRecorded: handleEvidenceRecorded,
        }}
      />
      {finishDialog}
    </>
  );
}

function SessionToolbar({
  session,
  statuses,
  currentStatus,
  actionError,
  reviewSaveError,
  showQuestions,
  onToggleQuestions,
  onCloseQuestions,
  onMove,
  onSkip,
  onFinish,
  onExpire,
  announcement,
}: {
  session: PracticeSessionModel;
  statuses: PracticeQuestionStatus[];
  currentStatus: PracticeQuestionStatus;
  actionError: string | null;
  reviewSaveError: string | null;
  showQuestions: boolean;
  onToggleQuestions: () => void;
  onCloseQuestions: () => void;
  onMove: (index: number) => void;
  onSkip: () => void;
  onFinish: () => void;
  onExpire: () => void;
  announcement: string;
}) {
  const returnDestination = practiceReturnDestination(session);
  const currentReference = session.questionReferences[session.currentQuestionIndex];
  const currentSkillName = currentReference
    ? contentResolver.getPathContext(currentReference.pathId)?.skillPath.name
    : null;
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <Card className="relative border-forge/20 bg-forge-soft p-3 max-sm:p-2" data-testid="practice-session-panel">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto min-w-0">
          <p className="truncate font-mono text-[11px] font-extrabold uppercase text-forge">{practiceOriginLabel(session.origin)}</p>
          {session.origin === "scheduled_review" && currentSkillName ? (
            <p data-testid="review-current-skill" aria-label={`Current Review skill: ${currentSkillName}`} className="mt-1 text-xs font-extrabold text-muted">{currentSkillName}</p>
          ) : null}
          <button ref={triggerRef} type="button" onClick={onToggleQuestions} aria-expanded={showQuestions} aria-haspopup="dialog" className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-lg font-extrabold text-ink">
            <List className="size-4" />Question {session.currentQuestionIndex + 1} of {session.questionReferences.length}
          </button>
        </div>
        {session.timing.type === "timed" ? <PracticeTimer session={session} onExpire={onExpire} /> : null}
        <button type="button" aria-label="Previous question" onClick={() => onMove(session.currentQuestionIndex - 1)} disabled={session.currentQuestionIndex === 0} className="grid size-10 place-items-center rounded-lg border border-line bg-white disabled:opacity-40"><ArrowLeft className="size-4" /></button>
        <button type="button" onClick={onSkip} disabled={currentStatus.unavailable || currentStatus.primary === "complete"} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-3 font-bold disabled:opacity-40"><SkipForward className="size-4" />{currentStatus.skipped ? "Undo Skip" : "Skip"}</button>
        <button type="button" aria-label="Next question" onClick={() => onMove(session.currentQuestionIndex + 1)} disabled={session.currentQuestionIndex === session.questionReferences.length - 1} className="grid size-10 place-items-center rounded-lg border border-line bg-white disabled:opacity-40"><ArrowRight className="size-4" /></button>
        <button type="button" onClick={onFinish} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-forge px-3 font-bold text-white"><CheckCircle2 className="size-4" />Finish session</button>
        <Link href={returnDestination.href} className="inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-bold text-forge">{returnDestination.label}</Link>
      </div>
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
      {actionError ? <p role="alert" className="mt-2 text-sm font-bold text-danger">{actionError}</p> : null}
      {reviewSaveError ? <p role="alert" className="mt-2 text-sm font-bold text-danger">{reviewSaveError}</p> : null}
      {showQuestions ? (
        <QuestionListDialog
          session={session}
          statuses={statuses}
          returnFocusRef={triggerRef}
          onClose={onCloseQuestions}
          onMove={onMove}
        />
      ) : null}
    </Card>
  );
}

function QuestionListDialog({
  session,
  statuses,
  returnFocusRef,
  onClose,
  onMove,
}: {
  session: PracticeSessionModel;
  statuses: PracticeQuestionStatus[];
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onMove: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        returnFocusRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [onClose, returnFocusRef]);
  function close() {
    onClose();
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }
  return (
    <div className="fixed inset-0 z-[65] grid place-items-center bg-ink/35 p-3 max-sm:items-end max-sm:p-0" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="practice-question-list-title" className="w-full max-w-xl rounded-xl bg-white p-3 shadow-card max-sm:max-h-[80dvh] max-sm:rounded-b-none max-sm:pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="practice-question-list-title" className="text-lg font-extrabold">Session questions</h2>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close question list" className="grid size-11 place-items-center rounded-lg"><X className="size-4" /></button>
        </div>
        <ol className="grid max-h-[min(60dvh,420px)] gap-1 overflow-y-auto overscroll-contain">
          {statuses.map((status, index) => (
            <li key={status.questionId}>
              <button
                type="button"
                disabled={status.unavailable}
                onClick={() => { onMove(index); onClose(); }}
                aria-current={index === session.currentQuestionIndex ? "step" : undefined}
                aria-label={`Question ${index + 1}: ${practiceStatusLabel(status)}${index === session.currentQuestionIndex ? ", current question" : ""}`}
                className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${index === session.currentQuestionIndex ? "bg-forge-soft" : "hover:bg-paper"}`}
              >
                <StatusIcon status={status} />
                <span className="min-w-0 flex-1"><strong>Question {index + 1}</strong><span className="ml-2 text-sm text-muted">{practiceStatusLabel(status)}</span></span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: PracticeQuestionStatus }) {
  if (status.primary === "complete") return <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-success" />;
  if (status.unavailable) return <X aria-hidden="true" className="size-5 shrink-0 text-muted" />;
  if (status.skipped) return <SkipForward aria-hidden="true" className="size-5 shrink-0 text-warning" />;
  if (status.primary === "attempted") return <Clock3 aria-hidden="true" className="size-5 shrink-0 text-forge" />;
  return <Circle aria-hidden="true" className="size-5 shrink-0 text-muted" />;
}

function FinishSessionDialog({
  statuses,
  busy,
  onCancel,
  onConfirm,
  onReview,
}: {
  statuses: PracticeQuestionStatus[];
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onReview: () => void;
}) {
  const unanswered = statuses.filter((item) => item.primary === "unanswered" && !item.unavailable && !item.skipped).length;
  const skipped = statuses.filter((item) => item.skipped).length;
  const unavailable = statuses.filter((item) => item.unavailable).length;
  const awaitingSelfCheck = statuses.filter((item) => item.awaitingSelfCheck).length;
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    onCancel();
    window.requestAnimationFrame(() => {
      const finish = [...document.querySelectorAll<HTMLButtonElement>('[data-testid="practice-session-panel"] button')]
        .find((button) => button.textContent?.includes("Finish session"));
      finish?.focus();
    });
  }, [onCancel]);
  useEffect(() => {
    cancelRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [close]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <Card role="dialog" aria-modal="true" aria-labelledby="finish-session-title" className="w-full max-w-lg p-6">
        <div ref={dialogRef}>
        <h2 id="finish-session-title" className="text-2xl font-extrabold">Finish this session?</h2>
        <p className="mt-2 text-muted">Your recorded answers and self-checks will remain in your learning progress.</p>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {unanswered ? <FinishCount label="Unanswered" value={unanswered} /> : null}
          {skipped ? <FinishCount label="Skipped" value={skipped} /> : null}
          {unavailable ? <FinishCount label="Unavailable" value={unavailable} /> : null}
          {awaitingSelfCheck ? <FinishCount label="Awaiting self-check" value={awaitingSelfCheck} /> : null}
        </dl>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={close} disabled={busy} className="min-h-11 rounded-lg border border-line bg-white px-4 font-bold">Return to practice</button>
          <button type="button" onClick={onReview} disabled={busy} className="min-h-11 rounded-lg border border-forge bg-white px-4 font-bold text-forge">Review unresolved</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="min-h-11 rounded-lg bg-forge px-4 font-extrabold text-white">Finish session</button>
        </div>
        </div>
      </Card>
    </div>
  );
}

function FinishCount({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-paper px-3 py-2"><dt className="text-muted">{label}</dt><dd className="text-xl font-extrabold">{value}</dd></div>;
}

function PracticeTimer({ session, onExpire }: { session: PracticeSessionModel; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, session.timing.type === "timed" ? session.timing.timeLimitSeconds - elapsedSeconds(session) : 0));
  const expiredRef = useRef(false);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, session.timing.type === "timed" ? session.timing.timeLimitSeconds - elapsedSeconds(session) : 0));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [session]);
  useEffect(() => {
    if (remaining === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
  }, [remaining, onExpire]);
  return <span role="timer" aria-label="Practice timer" aria-live="off" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 font-bold"><Timer className="size-4" />{formatTime(remaining)}</span>;
}

type JustCompletedPath = {
  pathId: string;
  name: string;
  status: CompletedTierStatus;
  completed: number;
  total: number;
  accuracy: number | null;
  reviewCount: number;
};

function claimPathsCompletedBySession(pathIds: readonly string[]): JustCompletedPath[] {
  const claimed: JustCompletedPath[] = [];
  for (const pathId of pathIds) {
    const skillPath = contentResolver.getPathContext(pathId)?.skillPath;
    if (!skillPath) continue;
    const progress = getSkillPathProgress(skillPath);
    if (progress.totalQuestions === 0 || progress.completedQuestionIds.length < progress.totalQuestions) continue;
    if (!isCompletedTierStatus(progress.status)) continue;
    if (recordPathCelebrated(skillPath.slug, progress.status) !== "recorded") continue;
    claimed.push({
      pathId: skillPath.slug,
      name: skillPath.name,
      status: progress.status,
      completed: progress.completedQuestionIds.length,
      total: progress.totalQuestions,
      accuracy: progress.firstAttemptAccuracyPercentage,
      reviewCount: progress.reviewQuestionIds.length,
    });
  }
  return claimed;
}

function PracticeSummaryCard({ session, summary }: { session: PracticeSessionModel; summary: ReturnType<typeof derivePracticeSessionSummary> }) {
  const activation = usePracticeActivation();
  const [justCompletedPaths, setJustCompletedPaths] = useState<JustCompletedPath[]>([]);
  const claimedRef = useRef(false);
  const nextAction = derivePracticeSummaryNextAction({
    evidence: getProgressEvidence(),
    completedSession: session,
    incorrectQuestionIds: summary.incorrectQuestionIds,
  });
  const questionStatuses = derivePracticeQuestionStatuses(session, getProgressEvidence() ?? getEmptyProgressEvidence());
  const returnDestination = practiceReturnDestination(session);
  useEffect(() => {
    if (claimedRef.current) return;
    claimedRef.current = true;
    setJustCompletedPaths(claimPathsCompletedBySession(summary.pathIds));
  }, [summary.pathIds]);

  function retryIncorrect() {
    const retry = createCompletedSessionRetry(session, summary.incorrectQuestionIds);
    if (retry) void activation.begin(retry);
  }
  function retrySkipped() {
    const retry = createCompletedSkippedRetry(session);
    if (retry) void activation.begin(retry);
  }

  return (
    <AppShell demo={false} active="Practice" workingContextPathId={session.selectedPathIds.length === 1 ? session.selectedPathIds[0] : null}>
      <div className="mx-auto grid max-w-[780px] gap-4">
        <Card className="animate-fade-rise p-6" role="status" aria-live="polite">
          <p className="font-mono text-xs font-extrabold uppercase text-forge">{practiceOriginLabel(session.origin)} complete</p>
          <h1 className="mt-2 text-3xl font-extrabold">Practice summary</h1>
          <p className="mt-2 font-bold text-ink">{summaryHeadline(summary)}</p>
          {justCompletedPaths.map((path) => (
            <div key={path.pathId} data-testid="practice-summary-path-completion" className="animate-fade-rise mt-4 rounded-xl border border-forge/20 bg-forge-soft/40 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2"><MasteryBadge status={path.status} /><ReviewBadge count={path.reviewCount} /></div>
              <h2 className="m-0 text-lg font-extrabold">{path.name} {path.status === "completed" ? "complete" : path.status}</h2>
              <p className="mt-2 text-sm text-ink">{getPathCompletionSupportingSentence(path.status, path.reviewCount)}</p>
              <p className="mt-2 text-sm font-bold text-muted">{path.completed} / {path.total} completed{path.accuracy !== null ? ` · ${path.accuracy}% first-attempt accuracy` : ""}</p>
            </div>
          ))}
          <div className="mt-5 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <SummaryStat label="Questions" value={summary.questionCount} />
            <SummaryStat label="Auto-marked correct" value={summary.correctCount} />
            <SummaryStat label="Auto-marked incorrect" value={summary.incorrectCount} />
            <SummaryStat label="Guided · Confident" value={summary.confidentCount} />
            <SummaryStat label="Guided · Unsure" value={summary.unsureCount} />
            <SummaryStat label="Guided · Needs review" value={summary.needsReviewCount} />
            <SummaryStat label="Worth revisiting" value={summary.revisitQuestionIds.length} />
            <SummaryStat label="Unanswered" value={summary.unansweredCount} />
            <SummaryStat label="Skipped" value={summary.skippedCount} />
            <SummaryStat label="Unavailable" value={summary.unavailableCount} />
            <SummaryStat label="Support used" value={summary.supportUsedCount} />
          </div>
          <details className="mt-4 rounded-xl border border-line bg-white p-3">
            <summary className="min-h-10 cursor-pointer font-extrabold">Question-by-question</summary>
            <ol className="mt-2 grid gap-2">
              {questionStatuses.map((status, index) => (
                <li key={status.questionId} className="rounded-lg bg-paper p-3 text-sm">
                  <div className="flex items-center gap-2"><StatusIcon status={status} /><strong>Question {index + 1}</strong><span className="text-muted">{practiceStatusLabel(status)}</span></div>
                  <p className="mt-1 text-muted">{status.attemptCount} attempt{status.attemptCount === 1 ? "" : "s"} · {status.supportUsed ? "support used" : "no support used"}{status.selfAssessment ? ` · ${status.selfAssessment.replace("_", " ")}` : ""}</p>
                </li>
              ))}
            </ol>
          </details>
          {session.timing.type === "timed" ? <p className="mt-2 text-sm text-muted">Elapsed time: {formatTime(session.timing.elapsedSeconds)}. Blank answers were never submitted automatically.</p> : null}
          {activation.error ? <p role="alert" className="mt-3 text-sm font-bold text-danger">{activation.error}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            {summary.incorrectQuestionIds.length ? <button type="button" onClick={retryIncorrect} disabled={activation.busy} aria-label="Retry incorrect questions from this session" className="inline-flex min-h-11 items-center rounded-lg bg-forge px-4 font-extrabold text-white transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:duration-100 disabled:hover:translate-y-0">Retry incorrect</button> : null}
            {summary.skippedCount ? <button type="button" onClick={retrySkipped} disabled={activation.busy} className="inline-flex min-h-11 items-center rounded-lg border border-forge bg-white px-4 font-extrabold text-forge transition hover:bg-forge-soft">Retry skipped questions</button> : null}
            {!summary.incorrectQuestionIds.length && !summary.skippedCount && nextAction.kind === "practice_again" ? <QuickPracticeAction preferredPathId={nextAction.pathId} label={nextAction.label} /> : null}
            <Link href={returnDestination.href} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-4 font-extrabold transition hover:border-forge">{returnDestination.label}</Link>
            <Link href={practiceSubjectDestination(session.subjectId)} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-4 font-extrabold transition hover:border-forge">Subject</Link>
            <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-4 font-extrabold transition hover:border-forge">Dashboard</Link>
          </div>
        </Card>
      </div>
      {activation.activationUi}
    </AppShell>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-line bg-paper p-4"><span className="block text-sm text-muted">{label}</span><strong className="text-2xl">{value}</strong></div>;
}

function summaryHeadline(summary: ReturnType<typeof derivePracticeSessionSummary>) {
  const parts = [
    summary.unansweredCount ? `${summary.unansweredCount} unanswered` : null,
    summary.skippedCount ? `${summary.skippedCount} skipped` : null,
    summary.unavailableCount ? `${summary.unavailableCount} unavailable` : null,
  ].filter(Boolean);
  return parts.length ? `Finished with ${parts.join(" · ")}.` : "All questions were resolved.";
}

function elapsedSeconds(session: PracticeSessionModel) {
  if (session.timing.type !== "timed") return 0;
  return Math.min(session.timing.timeLimitSeconds, Math.max(session.timing.elapsedSeconds,
    Math.floor((Date.now() - Date.parse(session.updatedAt)) / 1000) + session.timing.elapsedSeconds));
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Timer } from "lucide-react";
import { Card } from "@/components/ui";
import { QuestionWorkspace } from "@/components/questions/question-workspace";
import { getPathCompletionSupportingSentence } from "@/components/learning/path-completion-panel";
import { isCompletedTierStatus, MasteryBadge, ReviewBadge, type CompletedTierStatus } from "@/components/learning/mastery-badge";
import { contentResolver } from "@/lib/content-resolver";
import { recordPathCelebrated } from "@/lib/completion-tracking";
import { getEmptyProgressEvidence, getProgressEvidence, getSkillPathProgress } from "@/lib/local-progress";
import { resolvePracticeReference } from "@/lib/practice/practice-eligibility";
import { derivePracticeSessionSummary } from "@/lib/practice/practice-summary";
import { createCompletedSessionRetry } from "@/lib/practice/practice-selection";
import { getPracticeSession, updatePracticeSession, upsertPracticeSession } from "@/lib/practice/practice-storage";
import type { PracticeSession as PracticeSessionModel } from "@/lib/practice/practice-types";
import { derivePracticeSummaryNextAction } from "@/lib/learning/next-action";

export function PracticeSession({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<PracticeSessionModel | null>(null);
  const [evidenceVersion, setEvidenceVersion] = useState(0);

  useEffect(() => {
    setSession(getPracticeSession(sessionId));
  }, [sessionId]);

  useEffect(() => {
    const update = () => {
      setSession(getPracticeSession(sessionId));
      setEvidenceVersion((value) => value + 1);
    };
    window.addEventListener("stemforge:practice-session-updated", update);
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:practice-session-updated", update);
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("storage", update);
    };
  }, [sessionId]);

  void evidenceVersion;
  if (!session) {
    return <Card className="mx-auto mt-8 max-w-2xl p-6"><h1 className="text-xl font-extrabold">Session not found</h1><p className="mt-2 text-muted">Start a new practice session from the practice page.</p><Link href="/practice" className="mt-4 inline-flex font-bold text-forge">Open practice setup</Link></Card>;
  }

  const currentReference = session.questionReferences[session.currentQuestionIndex];
  const resolved = currentReference ? resolvePracticeReference(currentReference) : { status: "unresolvable" as const };
  const evidence = getProgressEvidence() ?? getEmptyProgressEvidence();
  const summary = derivePracticeSessionSummary(session, evidence);
  const expired = session.status !== "active";

  function updateIndex(index: number) {
    const bounded = Math.max(0, Math.min(session!.questionReferences.length - 1, index));
    const updated = updatePracticeSession(session!.sessionId, (current) => ({ ...current, currentQuestionIndex: bounded, updatedAt: new Date().toISOString() }));
    if (updated) setSession(updated);
  }

  function finish() {
    const updated = updatePracticeSession(session!.sessionId, (current) => ({
      ...current,
      status: "completed",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timing: current.timing.type === "timed" ? { ...current.timing, elapsedSeconds: elapsedSeconds(current) } : current.timing,
    }));
    if (updated) setSession(updated);
  }

  function expire() {
    const updated = updatePracticeSession(session!.sessionId, (current) => ({
      ...current,
      status: "completed",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timing: current.timing.type === "timed" ? { ...current.timing, elapsedSeconds: current.timing.timeLimitSeconds } : current.timing,
    }));
    if (updated) setSession(updated);
  }

  if (session.status === "completed") {
    return <PracticeSummaryCard session={session} summary={summary} />;
  }

  if (resolved.status !== "resolved") {
    return <Card className="mx-auto mt-8 max-w-2xl p-6"><h1 className="text-xl font-extrabold">Question unavailable</h1><p className="mt-2 text-muted">This session references content that is no longer available in the expected version.</p><Link href="/practice" className="mt-4 inline-flex font-bold text-forge">Start another session</Link></Card>;
  }

  return (
    <QuestionWorkspace
      question={resolved.question}
      answerLocked={expired}
      sessionPanel={(
        <Card className="border-forge/20 bg-forge-soft p-4" data-testid="practice-session-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-extrabold uppercase text-forge">{session.mode.replace("_", " ")} practice</p>
              <h2 className="m-0 mt-1 text-xl font-extrabold">Question {session.currentQuestionIndex + 1} of {session.questionReferences.length}</h2>
              <p className="mt-1 text-sm text-muted">{session.selectionMetadata.shortageReason ?? "Using available questions."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.timing.type === "timed" ? <PracticeTimer session={session} onExpire={expire} /> : null}
              <button type="button" onClick={() => updateIndex(session.currentQuestionIndex - 1)} disabled={session.currentQuestionIndex === 0} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 font-bold disabled:opacity-40"><ArrowLeft className="size-4" />Previous</button>
              <button type="button" onClick={() => updateIndex(session.currentQuestionIndex + 1)} disabled={session.currentQuestionIndex >= session.questionReferences.length - 1} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 font-bold disabled:opacity-40">Next<ArrowRight className="size-4" /></button>
              <button type="button" onClick={finish} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-forge px-3 font-bold text-white"><CheckCircle2 className="size-4" />Finish session</button>
            </div>
          </div>
        </Card>
      )}
    />
  );
}

function PracticeTimer({ session, onExpire }: { session: PracticeSessionModel; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, session.timing.type === "timed" ? session.timing.timeLimitSeconds - elapsedSeconds(session) : 0));
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, session.timing.type === "timed" ? session.timing.timeLimitSeconds - elapsedSeconds(session) : 0));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [session]);
  useEffect(() => { if (remaining === 0) onExpire(); }, [remaining, onExpire]);
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

/** Claims, at most once, any path this session's completion also completed. */
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
  const router = useRouter();
  const [justCompletedPaths, setJustCompletedPaths] = useState<JustCompletedPath[]>([]);
  const claimedRef = useRef(false);
  const nextAction = derivePracticeSummaryNextAction({
    evidence: getProgressEvidence(),
    completedSession: session,
    incorrectQuestionIds: summary.incorrectQuestionIds,
  });
  const fullyCorrect = summary.questionCount > 0 && summary.attemptedCount === summary.questionCount && summary.incorrectCount === 0;

  useEffect(() => {
    if (claimedRef.current) return;
    claimedRef.current = true;
    const claimed = claimPathsCompletedBySession(summary.pathIds);
    if (claimed.length) setJustCompletedPaths(claimed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retryIncorrect() {
    const retrySession = createCompletedSessionRetry(session, summary.incorrectQuestionIds);
    if (!retrySession) return;
    upsertPracticeSession(retrySession);
    router.push(`/practice/session/${retrySession.sessionId}`);
  }

  return (
    <main className="mx-auto grid max-w-[780px] gap-4 p-5">
      <Card className="p-6" role="status" aria-live="polite">
        <p className="font-mono text-xs font-extrabold uppercase text-forge">Session complete</p>
        <h1 className="mt-2 text-3xl font-extrabold">Practice summary</h1>
        {justCompletedPaths.map((path) => (
          <div key={path.pathId} data-testid="practice-summary-path-completion" className="animate-fade-rise mt-4 rounded-xl border border-forge/20 bg-forge-soft/40 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <MasteryBadge status={path.status} />
              <ReviewBadge count={path.reviewCount} />
            </div>
            <h2 className="m-0 text-lg font-extrabold">{path.name} {path.status === "completed" ? "complete" : path.status}</h2>
            <p className="mt-2 text-sm text-ink">{getPathCompletionSupportingSentence(path.status, path.reviewCount)}</p>
            <p className="mt-2 text-sm font-bold text-muted">
              {path.completed} / {path.total} completed
              {path.accuracy !== null ? ` · ${path.accuracy}% first-attempt accuracy` : ""}
            </p>
          </div>
        ))}
        {!justCompletedPaths.length && fullyCorrect ? (
          <p data-testid="practice-summary-fully-correct" className="mt-4 text-sm font-bold text-forge">Every question in this session was answered correctly.</p>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <SummaryStat label="Questions" value={summary.questionCount} />
          <SummaryStat label="Attempted" value={summary.attemptedCount} />
          <SummaryStat label="Correct" value={summary.correctCount} />
          <SummaryStat label="Incorrect" value={summary.incorrectCount} />
          <SummaryStat label="Unanswered" value={summary.unansweredCount} />
          <SummaryStat label="Support used" value={summary.supportUsedCount} />
        </div>
        <p id="practice-summary-next-reason" className="mt-4 text-sm text-muted">{nextAction.reason}</p>
        {session.timing.type === "timed" ? <p className="mt-4 text-sm text-muted">Elapsed time: {formatTime(session.timing.elapsedSeconds)}. No blank answers were submitted automatically.</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          {nextAction.kind === "retry_session" ? (
            <button type="button" onClick={retryIncorrect} aria-describedby="practice-summary-next-reason" className="inline-flex min-h-11 items-center rounded-lg bg-forge px-4 font-extrabold text-white">{nextAction.label}</button>
          ) : nextAction.href ? (
            <Link href={nextAction.href} aria-describedby="practice-summary-next-reason" className="inline-flex min-h-11 items-center rounded-lg bg-forge px-4 font-extrabold text-white">{nextAction.label}</Link>
          ) : null}
          <Link href="/dashboard" className="inline-flex min-h-10 items-center rounded-lg border border-line bg-white px-4 font-extrabold">Dashboard</Link>
        </div>
      </Card>
    </main>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-line bg-paper p-4"><span className="block text-sm text-muted">{label}</span><strong className="text-2xl">{value}</strong></div>;
}

function elapsedSeconds(session: PracticeSessionModel) {
  if (session.timing.type !== "timed") return 0;
  return Math.min(session.timing.timeLimitSeconds, Math.max(session.timing.elapsedSeconds, Math.floor((Date.now() - Date.parse(session.updatedAt)) / 1000) + session.timing.elapsedSeconds));
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

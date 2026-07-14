"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Eye, Lightbulb, MessageSquare, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card, ProgressBar } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import { QuestionAnswerInput } from "@/components/questions/answer-inputs";
import { PathCompletionPanel } from "@/components/learning/path-completion-panel";
import { canSubmitAnswer, markQuestionAnswer } from "@/lib/answer-engine";
import { recordPathCelebrated } from "@/lib/completion-tracking";
import { getQuestionContext, getQuestionHref } from "@/lib/learning-paths";
import {
  getEmptyProgressEvidence,
  getNextQuestionId,
  getQuestionProgress,
  getSkillPathProgress,
  recordHintViewed,
  recordWorkedSolutionViewed,
  saveQuestionAttempt,
} from "@/lib/local-progress";
import { useHasMounted } from "@/lib/use-mounted";
import type { Question } from "@/data/types";

export function QuestionWorkspace({ question }: { question: Question }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hintViewed, setHintViewed] = useState(false);
  const [progressVersion, setProgressVersion] = useState(0);
  const [showCompletionPanel, setShowCompletionPanel] = useState(false);
  const wasPathCompleteRef = useRef<boolean | null>(null);
  const hasMounted = useHasMounted();
  const context = useMemo(() => getQuestionContext(question.id), [question.id]);
  const skillPath = context?.skillPath;
  const skillPathQuestions = context?.pathQuestions ?? [question];
  const position = {
    index: context?.questionIndexInPath ?? -1,
    current: context ? context.questionIndexInPath + 1 : 0,
    total: context?.pathQuestions.length ?? 0,
    previous: context?.previousQuestion,
    next: context?.nextQuestion,
  };
  const hasPosition = position.index >= 0 && position.total > 0;
  const currentQuestion = hasPosition ? position.current : 1;
  const totalQuestions = hasPosition ? position.total : 1;
  const usesGuidedMarking = question.answerType === "written" || question.answerType === "multi_step";
  const markingResult = submitted ? markQuestionAnswer(question, answer) : null;
  const isCorrect = markingResult?.isCorrect === true;
  const questionPositionProgress = hasPosition ? Math.round((position.current / position.total) * 100) : 0;
  const fallbackPathHref = skillPath?.href ?? "/subjects";
  const stage = context?.stage;
  const evidenceOverride = hasMounted ? undefined : getEmptyProgressEvidence();
  void progressVersion;
  const localProgress = skillPath ? getSkillPathProgress(skillPath, evidenceOverride) : undefined;
  const stageLocalProgress = stage ? localProgress?.stageProgress[stage.id] : undefined;
  const questionProgress = getQuestionProgress(question.id, evidenceOverride);
  const solutionViewed = questionProgress.solutionViewed;
  const isPositiveFeedback = isCorrect || solutionViewed;
  const nextQuestionId = questionProgress.navigationEligible && skillPath ? getNextQuestionId(skillPath) : null;
  const nextQuestion = nextQuestionId ? skillPathQuestions.find((item) => item.id === nextQuestionId) : undefined;
  const nextActionHref = nextQuestionId ? getQuestionHref(nextQuestionId) : fallbackPathHref;
  const nextActionLabel = nextQuestion ? (nextQuestion.stage === question.stage ? `Continue ${nextQuestion.stage}` : `Move to ${nextQuestion.stage}`) : `Review ${skillPath?.name ?? "path"}`;

  useEffect(() => {
    setAnswer("");
    setSubmitted(false);
    setHintViewed(false);
    setShowCompletionPanel(false);
  }, [question.id]);

  useEffect(() => {
    const update = () => setProgressVersion((current) => current + 1);
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const pathCompletedQuestionCount = localProgress?.completedQuestionIds.length ?? 0;
  const pathTotalQuestionCount = localProgress?.totalQuestions ?? 0;
  const pathStatus = localProgress?.status;

  // Snapshot "was the path already complete" once real (post-hydration) evidence is available,
  // and re-snapshot on every question change. Runs before the transition-detection effect below
  // on the same commit, so a hydration flip from empty-evidence to real evidence never reads as
  // a false "just completed" crossing.
  useEffect(() => {
    if (!hasMounted) return;
    wasPathCompleteRef.current = pathTotalQuestionCount > 0 && pathCompletedQuestionCount >= pathTotalQuestionCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, hasMounted]);

  useEffect(() => {
    if (!hasMounted || !skillPath || !pathStatus || pathTotalQuestionCount === 0) return;
    const isPathCompleteNow = pathCompletedQuestionCount >= pathTotalQuestionCount;
    if (isPathCompleteNow && wasPathCompleteRef.current === false) {
      wasPathCompleteRef.current = true;
      const acknowledgement = recordPathCelebrated(skillPath.slug, pathStatus);
      // Unsupported future acknowledgement data may already describe this moment,
      // so preserve it and avoid a possible replay. If storage is merely unavailable,
      // the genuine completion moment can still be shown for this page lifetime.
      setShowCompletionPanel(
        acknowledgement === "recorded" ||
        acknowledgement === "unavailable" ||
        acknowledgement === "write-failed",
      );
    }
  }, [hasMounted, skillPath, pathStatus, pathCompletedQuestionCount, pathTotalQuestionCount]);

  function handleSubmit() {
    if (!canSubmitAnswer(answer) || submitted) return;
    const markedCorrect = markQuestionAnswer(question, answer).isCorrect;
    saveQuestionAttempt({
      questionId: question.id,
      skillPathId: question.skillPathId ?? skillPath?.slug ?? "unknown",
      stageId: question.stageId ?? stage?.id ?? question.stage,
      isCorrect: markedCorrect,
      answer,
      attemptedAt: new Date().toISOString(),
      hintViewedBeforeSubmission: hintViewed,
    });
    setSubmitted(true);
  }

  function supportEventInput() {
    return {
      questionId: question.id,
      skillPathId: question.skillPathId ?? skillPath?.slug ?? "unknown",
      stageId: question.stageId ?? stage?.id ?? question.stage,
      attemptedAt: new Date().toISOString(),
    };
  }

  function handleHintViewed() {
    if (!hintViewed) recordHintViewed(supportEventInput());
    setHintViewed(true);
  }

  function handleSolutionViewed() {
    recordWorkedSolutionViewed(supportEventInput());
  }

  function handleRetry() {
    setAnswer("");
    setSubmitted(false);
  }

  return (
    <AppShell demo active="Current Path">
      <div className="mx-auto mb-3 flex max-w-[1080px] justify-end">
        <AppTopbar demo />
      </div>
      <div className="mx-auto grid max-w-[1080px] grid-cols-[minmax(0,1fr)_280px] gap-4 max-lg:grid-cols-1">
        <section className="grid gap-4">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects">Subjects</Link>
            <span>/</span>
            <Link href={context?.subject.href ?? "/subjects"}>{context?.subject.subjectName ?? question.subject}</Link>
            <span>/</span>
            <Link href={context?.courseArea.href ?? "/subjects"}>{context?.courseArea.name ?? question.courseArea}</Link>
            <span>/</span>
            <Link href={context?.specificationStrand.href ?? fallbackPathHref}>{context?.specificationStrand.name ?? question.specArea}</Link>
            <span>/</span>
            <span className="font-bold text-forge">{skillPath?.name ?? question.skillPath ?? "Question"}</span>
          </nav>

          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
              <Badge>{context?.subject.subjectName ?? question.subject}</Badge>
              <HeaderMeta label="Stage" value={question.stage} />
              <HeaderMeta label="Source" value={question.source} />
              <HeaderMeta label="Skill" value={question.skill} />
              <HeaderMeta label="Marks" value={String(question.marks)} />
              <HeaderMeta label="Progress" value={hasPosition ? `Question ${currentQuestion} of ${totalQuestions}` : "Question"} />
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              STEM Forge questions are original SQA-style practice and are not copied from SQA materials.
            </p>
          </Card>

          <Card className="p-4">
            <p className="mb-2 font-mono text-[11px] font-extrabold uppercase text-forge">
              {question.stage} / Question {currentQuestion}
            </p>
            <h1 className="mb-4 text-[26px] font-extrabold leading-tight">{question.title}</h1>
            <div className="rounded-xl border border-line bg-white p-4 shadow-[0_14px_38px_rgba(17,17,17,0.035)]">
              <MathContent>{question.questionText}</MathContent>
              <div className="mt-4">
                <label className="mb-2 block text-sm text-muted">Your answer</label>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                  }}
                >
                  <QuestionAnswerInput question={question} value={answer} submitted={submitted} onChange={setAnswer} />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={!canSubmitAnswer(answer) || submitted}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-forge px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45 max-sm:w-full"
                    >
                      Submit Answer
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {submitted && (
              <div
                id="answer-feedback"
                data-testid="question-status"
                role="status"
                aria-live="polite"
                className={`animate-fade-rise mt-4 flex items-start gap-3 rounded-xl border p-4 max-md:grid ${isPositiveFeedback ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft"}`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-white ${isPositiveFeedback ? "bg-success" : "bg-danger"}`}>
                  {isPositiveFeedback ? <Check className="size-6" /> : <X className="size-6" />}
                </span>
                <div>
                  <h2 className="m-0 text-lg font-extrabold">{usesGuidedMarking ? "Ready to self-check" : isCorrect ? (hintViewed ? "Correct with support" : "Correct") : solutionViewed ? "Completed with solution" : "Not quite"}</h2>
                  <p className="mt-2 text-ink">
                    {usesGuidedMarking
                      ? "Use the worked solution below to compare your method. Full marking for written and multi-step answers will come later."
                      : isCorrect
                        ? hintViewed
                          ? "Correct. The hint helped you complete this question, and it will be recommended for review."
                          : "Correct. Your answer matches the expected result. You can view the worked solution to compare your method."
                        : solutionViewed
                          ? "You worked through the question using the solution. It is complete and marked for review."
                          : "Not quite. Try again, use the hint, or view the worked solution to learn the method and complete the question."}
                  </p>
                  {isCorrect || solutionViewed ? (
                    <div className="mt-3 rounded-lg bg-white/70 px-4 py-3">
                      <span className="mb-1 block text-sm font-bold text-muted">Final answer</span>
                      <MathContent>{question.finalAnswer}</MathContent>
                    </div>
                  ) : null}
                  {!usesGuidedMarking && !isCorrect ? (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-danger/30 bg-white px-4 text-sm font-extrabold text-danger transition hover:border-danger"
                    >
                      Try again
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </Card>

          {(submitted || questionProgress.attempted) && (
            <>
              <Card className="animate-fade-rise p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="m-0 text-xl font-extrabold">Worked solution</h2>
                    <p className="mt-1 text-sm text-muted">Use the full method when you are ready to learn from it.</p>
                  </div>
                  {!solutionViewed ? (
                    <button type="button" data-testid="worked-solution-control" onClick={handleSolutionViewed} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-forge bg-white px-4 text-sm font-extrabold text-forge">
                      <Eye className="size-4" /> View worked solution
                    </button>
                  ) : null}
                </div>
                {solutionViewed ? <div className="mt-4 border-t border-line pt-4"><MathContent>{question.workedSolution}</MathContent></div> : null}
              </Card>
              {question.commonMistake && solutionViewed ? (
                <Card className="animate-fade-rise p-4">
                  <h2 className="mb-2 text-lg font-extrabold">Common mistake</h2>
                  <MathContent>{question.commonMistake}</MathContent>
                </Card>
              ) : null}
            </>
          )}

          {showCompletionPanel && skillPath && localProgress ? (
            <PathCompletionPanel skillPath={skillPath} progress={localProgress} />
          ) : (
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Link
              href={position.previous ? getQuestionHref(position.previous.id) : fallbackPathHref}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white text-sm font-bold"
            >
              <ArrowLeft className="size-5" />
              Previous
            </Link>
            {questionProgress.navigationEligible ? (
              <Link data-testid="next-question-action" href={nextActionHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-forge text-sm font-bold text-white">
                {nextActionLabel}<ArrowRight className="size-5" />
              </Link>
            ) : (
              <span data-testid="next-question-locked" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-line px-4 text-center text-sm font-bold text-muted">
                Complete this question to continue
              </span>
            )}
          </div>
          )}
        </section>

        <aside className="grid content-start gap-4">
          <Card className="p-4">
            <h2 className="mb-3 text-lg font-extrabold">Your Progress</h2>
            <PanelProgress
              label={skillPath?.name ?? question.skillPath ?? "Current path"}
              value={localProgress?.completionPercentage ?? questionPositionProgress}
              valueLabel={localProgress ? `${localProgress.completedQuestionIds.length} / ${localProgress.totalQuestions}` : hasPosition ? `${currentQuestion} / ${totalQuestions}` : "Not tracked"}
            />
            <PanelProgress
              label={stage?.name ?? "Stage"}
              value={stageLocalProgress?.completionPercentage ?? 0}
              valueLabel={stageLocalProgress ? `${stageLocalProgress.completedQuestionIds.length} / ${stageLocalProgress.totalQuestions}` : question.stage}
            />
          </Card>
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-forge-soft text-forge">
                <Lightbulb className="size-5" />
              </span>
              <h2 className="m-0 text-lg font-extrabold">Hint</h2>
            </div>
            {hintViewed ? (
              <MathContent>{question.hint}</MathContent>
            ) : (
              <div>
                <p className="leading-relaxed text-muted">Try the question first. Opening a hint supports your learning and is recorded for mastery.</p>
                <button type="button" data-testid="hint-control" onClick={handleHintViewed} className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-extrabold text-forge">Show hint</button>
              </div>
            )}
          </Card>
          <div className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-center text-sm font-bold text-muted">
            <MessageSquare className="size-4" />
            Record question feedback using your private-beta tester guide
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Badge({ children }: { children: string }) {
  return <span className="rounded-md bg-forge-soft px-3 py-1.5 text-sm font-bold text-forge">{children}</span>;
}

function HeaderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm max-sm:w-full max-sm:justify-between">
      <span>{label}:</span>
      <strong>{value}</strong>
    </div>
  );
}

function PanelProgress({ label, value, valueLabel }: { label: string; value: number; valueLabel: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <strong>{valueLabel}</strong>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}













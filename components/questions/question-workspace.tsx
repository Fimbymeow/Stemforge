"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Eye, Lightbulb, MessageSquare, X } from "lucide-react";
import { ReportDialog } from "@/components/beta-reports/report-dialog";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { PathCompletionPanel } from "@/components/learning/path-completion-panel";
import { StageCompletionPanel } from "@/components/learning/stage-completion-panel";
import { useLearnerNextAction } from "@/components/learning/use-learner-next-action";
import { MathContent } from "@/components/questions/math-content";
import { QuestionAnswerInput } from "@/components/questions/answer-inputs";
import { WorkedSolutionContent } from "@/components/questions/worked-solution-content";
import { Card, ProgressBar } from "@/components/ui";
import type { Question } from "@/data/types";
import { markQuestionAnswer } from "@/lib/answer-engine";
import { recordPathCelebrated, recordStageCelebrated } from "@/lib/completion-tracking";
import { getQuestionContext, getQuestionHref } from "@/lib/learning-paths";
import {
  getEmptyProgressEvidence,
  getQuestionProgress,
  getSkillPathProgress,
  recordHintViewed,
  recordWorkedSolutionViewed,
  saveQuestionAttempt,
} from "@/lib/local-progress";
import {
  classifyAnswerFeedback,
  internalAnswerFailureFeedback,
  type StudentAnswerFeedback,
} from "@/lib/questions/answer-feedback";
import {
  clearAnswerDraft,
  createAnswerDraftKey,
  loadAnswerDraft,
  saveAnswerDraft,
  type AnswerDraftIdentity,
} from "@/lib/questions/answer-drafts";
import { deriveStageQuestionPosition } from "@/lib/questions/question-context";
import { describeReviewReason } from "@/lib/questions/review-reason";
import { useHasMounted } from "@/lib/use-mounted";

type SubmissionIntent = "keyboard" | "pointer";

export function QuestionWorkspace({ question, sessionPanel, answerLocked = false }: { question: Question; sessionPanel?: ReactNode; answerLocked?: boolean }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<StudentAnswerFeedback | null>(null);
  const [feedbackSequence, setFeedbackSequence] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [hintViewed, setHintViewed] = useState(false);
  const [solutionOpenedThisInteraction, setSolutionOpenedThisInteraction] = useState(false);
  const [progressVersion, setProgressVersion] = useState(0);
  const [showCompletionPanel, setShowCompletionPanel] = useState(false);
  const [showStageCompletionPanel, setShowStageCompletionPanel] = useState(false);
  const wasPathCompleteRef = useRef<boolean | null>(null);
  const wasStageCompleteRef = useRef<boolean | null>(null);
  const feedbackHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const hintContentRef = useRef<HTMLDivElement | null>(null);
  const solutionHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const submissionIntentRef = useRef<SubmissionIntent>("keyboard");
  const hasMounted = useHasMounted();
  const nextAction = useLearnerNextAction();
  const context = useMemo(() => getQuestionContext(question.id), [question.id]);
  const skillPath = context?.skillPath;
  const stage = context?.stage;
  const stagePosition = deriveStageQuestionPosition(context);
  const position = {
    index: context?.questionIndexInPath ?? -1,
    current: context ? context.questionIndexInPath + 1 : 0,
    total: context?.pathQuestions.length ?? 0,
    previous: context?.previousQuestion,
  };
  const hasPosition = position.index >= 0 && position.total > 0;
  const currentQuestion = hasPosition ? position.current : 1;
  const totalQuestions = hasPosition ? position.total : 1;
  const draftIdentity = useMemo<AnswerDraftIdentity>(() => ({
    questionId: question.id,
    questionVersion: question.questionVersion,
    contentRevision: question.contentRevision,
  }), [question.id, question.questionVersion, question.contentRevision]);
  const draftKey = createAnswerDraftKey(draftIdentity);
  const evidenceOverride = hasMounted ? undefined : getEmptyProgressEvidence();
  void progressVersion;
  const localProgress = skillPath ? getSkillPathProgress(skillPath, evidenceOverride) : undefined;
  const stageLocalProgress = stage ? localProgress?.stageProgress[stage.id] : undefined;
  const questionProgress = getQuestionProgress(question.id, evidenceOverride);
  const solutionViewed = questionProgress.solutionViewed;
  const usesGuidedMarking = question.answerType === "written" || question.answerType === "multi_step";
  const markedSubmission = submitted && submittedAnswer !== null ? markQuestionAnswer(question, submittedAnswer) : null;
  const isCorrect = markedSubmission?.isCorrect === true;
  const completedWithCurrentSolution = submitted && solutionOpenedThisInteraction;
  const isPositiveFeedback = isCorrect || completedWithCurrentSolution || feedback?.category === "guided";
  const fallbackPathHref = skillPath?.href ?? "/subjects";
  const pathCompletedQuestionCount = localProgress?.completedQuestionIds.length ?? 0;
  const pathTotalQuestionCount = localProgress?.totalQuestions ?? 0;
  const pathStatus = localProgress?.status;
  const stageCompletedQuestionCount = stageLocalProgress?.completedQuestionIds.length ?? 0;
  const stageTotalQuestionCount = stageLocalProgress?.totalQuestions ?? 0;
  const stageStatus = stageLocalProgress?.status;

  useEffect(() => {
    setAnswer(loadAnswerDraft(browserStorage(), draftIdentity)?.answer ?? "");
    setSubmitted(false);
    setSubmittedAnswer(null);
    setFeedback(null);
    setSubmitting(false);
    setHintViewed(false);
    setSolutionOpenedThisInteraction(false);
    setShowCompletionPanel(false);
    setShowStageCompletionPanel(false);
  }, [draftKey, draftIdentity]);

  useEffect(() => {
    const update = () => setProgressVersion((current) => current + 1);
    window.addEventListener("stemforge:local-progress-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stemforge:local-progress-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    if (!hintViewed) return;
    hintContentRef.current?.focus();
  }, [hintViewed]);

  useEffect(() => {
    if (!feedbackSequence || !feedback) return;
    const frame = window.requestAnimationFrame(() => {
      if (feedback.isInputError && !submitted) {
        document.getElementById("question-answer")?.focus();
        return;
      }
      if (submissionIntentRef.current === "keyboard") feedbackHeadingRef.current?.focus();
      else feedbackHeadingRef.current?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [feedback, feedbackSequence, submitted]);

  useEffect(() => {
    if (submitted && markedSubmission?.isCorrect === true) clearAnswerDraft(browserStorage(), draftIdentity);
  }, [draftIdentity, markedSubmission?.isCorrect, submitted]);

  useEffect(() => {
    if (!hasMounted) return;
    wasPathCompleteRef.current = pathTotalQuestionCount > 0 && pathCompletedQuestionCount >= pathTotalQuestionCount;
    wasStageCompleteRef.current = stageTotalQuestionCount > 0 && stageCompletedQuestionCount >= stageTotalQuestionCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, hasMounted]);

  useEffect(() => {
    if (!hasMounted || !skillPath || !pathStatus || pathTotalQuestionCount === 0) return;
    const isPathCompleteNow = pathCompletedQuestionCount >= pathTotalQuestionCount;
    if (isPathCompleteNow && wasPathCompleteRef.current === false) {
      wasPathCompleteRef.current = true;
      // Inside a practice session, defer the one-time claim to the practice summary screen
      // (see PracticeSummaryCard) rather than claiming it here, where the panel can never
      // render anyway (sessionPanel takes over this row) — claiming it here would silently
      // burn the one-time acknowledgement before the summary gets a chance to show it.
      if (!sessionPanel) {
        const acknowledgement = recordPathCelebrated(skillPath.slug, pathStatus);
        setShowCompletionPanel(
          acknowledgement === "recorded" || acknowledgement === "unavailable" || acknowledgement === "write-failed",
        );
      }
    }
  }, [hasMounted, skillPath, pathStatus, pathCompletedQuestionCount, pathTotalQuestionCount, sessionPanel]);

  useEffect(() => {
    if (!hasMounted || !skillPath || !stage || !stageStatus || stageTotalQuestionCount === 0) return;
    const isStageCompleteNow = stageCompletedQuestionCount >= stageTotalQuestionCount;
    if (isStageCompleteNow && wasStageCompleteRef.current === false) {
      wasStageCompleteRef.current = true;
      // The path-completion moment is the stronger, dominant acknowledgement. If this same
      // submission also completes the whole path, skip claiming/showing the stage moment —
      // never stack two completion panels for one submission.
      const isPathCompleteAlso = pathTotalQuestionCount > 0 && pathCompletedQuestionCount >= pathTotalQuestionCount;
      if (isPathCompleteAlso || sessionPanel) return;
      const acknowledgement = recordStageCelebrated(skillPath.slug, stage.id, stageStatus);
      setShowStageCompletionPanel(
        acknowledgement === "recorded" || acknowledgement === "unavailable" || acknowledgement === "write-failed",
      );
    }
  }, [hasMounted, skillPath, stage, stageStatus, stageCompletedQuestionCount, stageTotalQuestionCount, pathCompletedQuestionCount, pathTotalQuestionCount, sessionPanel]);

  function updateAnswer(nextAnswer: string) {
    setAnswer(nextAnswer);
    if (feedback?.isInputError) setFeedback(null);
    saveAnswerDraft(browserStorage(), draftIdentity, nextAnswer);
  }

  function showFeedback(nextFeedback: StudentAnswerFeedback) {
    setFeedback(nextFeedback);
    setFeedbackSequence((current) => current + 1);
  }

  async function handleSubmit() {
    if (submitted || submitting || answerLocked) return;
    setSubmitting(true);
    try {
      const marking = markQuestionAnswer(question, answer);
      const classified = classifyAnswerFeedback(question, answer, marking);
      if (!classified.shouldRecordAttempt) {
        showFeedback(classified);
        return;
      }
      const saved = await saveQuestionAttempt({
        questionId: question.id,
        skillPathId: question.skillPathId ?? skillPath?.slug ?? "unknown",
        stageId: question.stageId ?? stage?.id ?? question.stage,
        isCorrect: marking.isCorrect,
        answer,
        attemptedAt: new Date().toISOString(),
        hintViewedBeforeSubmission: hintViewed,
      });
      if (!saved) {
        showFeedback(internalAnswerFailureFeedback());
        return;
      }
      setSubmittedAnswer(answer);
      setSubmitted(true);
      showFeedback(classified);
      if (marking.isCorrect === true) clearAnswerDraft(browserStorage(), draftIdentity);
    } catch {
      showFeedback(internalAnswerFailureFeedback());
    } finally {
      setSubmitting(false);
    }
  }

  function supportEventInput() {
    return {
      questionId: question.id,
      skillPathId: question.skillPathId ?? skillPath?.slug ?? "unknown",
      stageId: question.stageId ?? stage?.id ?? question.stage,
      attemptedAt: new Date().toISOString(),
    };
  }

  async function handleHintViewed() {
    if (!hintViewed) await recordHintViewed(supportEventInput());
    setHintViewed(true);
  }

  async function handleSolutionViewed() {
    const recorded = await recordWorkedSolutionViewed(supportEventInput());
    if (!recorded) return;
    setSolutionOpenedThisInteraction(true);
    window.requestAnimationFrame(() => solutionHeadingRef.current?.focus());
  }

  function handleRetry() {
    setSubmitted(false);
    setFeedback(null);
    setSolutionOpenedThisInteraction(false);
    window.requestAnimationFrame(() => {
      const input = document.getElementById("question-answer") as HTMLInputElement | HTMLTextAreaElement | null;
      input?.focus();
      input?.select();
    });
  }

  const feedbackTitle = usesGuidedMarking
    ? "Ready to self-check"
    : isCorrect
      ? hintViewed ? "Correct with support" : "Correct"
      : completedWithCurrentSolution
        ? "Completed with solution"
        : feedback?.title;
  const feedbackMessage = usesGuidedMarking
    ? "Use the worked solution to compare your method. Written and multi-step responses are not automatically marked."
    : isCorrect
      ? hintViewed
        ? "Correct. Using support is a normal part of learning — answering on your own next time is even stronger practice for the exam."
        : "Your answer matches an accepted result. You can compare it with the worked solution."
      : completedWithCurrentSolution
        ? "You used the solution to complete this question. It remains recommended for review."
        : feedback?.message;

  return (
    <AppShell demo active="Current Path">
      <div className="mx-auto mb-2 flex max-w-[1080px] justify-end">
        <AppTopbar demo />
      </div>
      <div className="mx-auto grid max-w-[1080px] grid-cols-[minmax(0,1fr)_250px] gap-3 max-lg:grid-cols-1">
        <section className="grid min-w-0 gap-3">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href={context?.subject.href ?? "/subjects"}>{context?.subject.subjectName ?? question.subject}</Link>
            <span aria-hidden="true">/</span>
            <Link href={fallbackPathHref}>{skillPath?.name ?? question.skillPath ?? "Question"}</Link>
            <span aria-hidden="true">/</span>
            <span className="font-bold text-forge">{stage?.name ?? question.stage}</span>
            <details className="ml-auto max-sm:ml-0 max-sm:w-full">
              <summary className="inline-flex min-h-10 cursor-pointer items-center text-xs font-bold text-forge">More context</summary>
              <span className="mt-2 flex flex-wrap gap-2 rounded-lg bg-paper p-2 text-xs">
                <Link href={context?.courseArea.href ?? "/subjects"}>{context?.courseArea.name ?? question.courseArea}</Link>
                <span aria-hidden="true">/</span>
                <Link href={context?.specificationStrand.href ?? fallbackPathHref}>{context?.specificationStrand.name ?? question.specArea}</Link>
              </span>
            </details>
          </nav>

          {sessionPanel}

          <Card className="p-4 max-sm:p-3" data-testid="question-workspace-card">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line pb-3">
              <div>
                <p className="font-mono text-[11px] font-extrabold uppercase text-forge">Current stage</p>
                <p className="mt-1 font-extrabold" data-testid="stage-question-position">
                  {stagePosition?.label ?? `${question.stage} · Question ${currentQuestion}`}
                </p>
              </div>
              <details className="text-sm text-muted">
                <summary className="inline-flex min-h-10 cursor-pointer items-center font-bold text-forge">Question details</summary>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-paper p-3">
                  <dt>Marks</dt><dd className="font-bold text-ink">{question.marks}</dd>
                  <dt>Skill</dt><dd className="font-bold text-ink">{question.skill}</dd>
                  <dt>Source</dt><dd className="font-bold text-ink">{question.source}</dd>
                  <dt>Path</dt><dd className="font-bold text-ink">Question {currentQuestion} of {totalQuestions}</dd>
                </dl>
                <p className="mt-2 max-w-xl text-xs">Original Qualifications Scotland-style practice; not copied from Qualifications Scotland materials.</p>
              </details>
            </div>

            <h1 className="mt-4 text-[clamp(24px,3vw,32px)] font-extrabold leading-tight">{question.title}</h1>
            {questionProgress.reviewRecommended && !submitted ? (
              <p className="mt-2 text-sm text-muted" data-testid="review-reason">{describeReviewReason(questionProgress)}</p>
            ) : null}
            <div className="mt-3 rounded-xl border border-line bg-white p-5 shadow-[0_14px_38px_rgba(17,17,17,0.035)] max-sm:p-4" data-testid="question-interaction">
              <div className="text-lg leading-relaxed"><MathContent>{question.questionText}</MathContent></div>
              <div className="mt-5 border-t border-line pt-4">
                <label id="answer-label" htmlFor="question-answer" className="mb-2 block text-sm font-extrabold">Your answer</label>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit();
                  }}
                  onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) submissionIntentRef.current = "keyboard"; }}
                >
                  <QuestionAnswerInput
                    question={question}
                    value={answer}
                    submitted={submitted}
                    onChange={updateAnswer}
                    inputId="question-answer"
                    describedBy={feedback ? "answer-feedback" : undefined}
                    invalid={feedback?.isInputError}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      onPointerDown={() => { submissionIntentRef.current = "pointer"; }}
                      disabled={submitted || submitting || answerLocked}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-forge px-6 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45 max-sm:w-full"
                    >
                      {answerLocked ? "Session ended" : submitting ? "Saving..." : "Submit Answer"}
                    </button>
                  </div>
                </form>
              </div>

              {feedback ? (
                <div
                  id="answer-feedback"
                  data-testid="question-status"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className={`mt-4 rounded-xl border p-4 ${isPositiveFeedback ? "border-success/30 bg-success-soft" : feedback.isInputError ? "border-forge/25 bg-forge-soft" : "border-danger/30 bg-danger-soft"}`}
                >
                  <div className="flex items-start gap-3 max-sm:grid">
                    <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-full text-white ${isPositiveFeedback ? "bg-success" : feedback.isInputError ? "bg-forge" : "bg-danger"}`}>
                      {isPositiveFeedback ? <Check className="size-6" /> : <X className="size-6" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 ref={feedbackHeadingRef} tabIndex={-1} className="m-0 text-lg font-extrabold outline-none">{feedbackTitle}</h2>
                      <p className="mt-1 text-ink">{feedbackMessage}</p>
                      {feedback.guidance && !isCorrect && !completedWithCurrentSolution ? <p className="mt-2 text-sm font-semibold text-ink">{feedback.guidance}</p> : null}
                      {submittedAnswer !== null ? (
                        <div className="mt-3 rounded-lg bg-white/75 px-4 py-3" data-testid="submitted-answer">
                          <span className="mb-1 block text-sm font-bold text-muted">Your submitted answer</span>
                          <code className="block whitespace-pre-wrap break-words font-mono text-base text-ink">{submittedAnswer}</code>
                        </div>
                      ) : null}
                      {isCorrect || completedWithCurrentSolution ? (
                        <div className="mt-3 rounded-lg bg-white/75 px-4 py-3">
                          <span className="mb-1 block text-sm font-bold text-muted">Accepted final answer</span>
                          <MathContent>{question.finalAnswer}</MathContent>
                        </div>
                      ) : null}
                      {submitted && !usesGuidedMarking && !isCorrect ? (
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-danger/30 bg-white px-4 text-sm font-extrabold text-danger transition hover:border-danger"
                        >
                          Try again
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-4" data-testid="question-hint-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forge-soft text-forge"><Lightbulb className="size-5" /></span>
                <div>
                  <h2 className="m-0 text-lg font-extrabold">Need a hand?</h2>
                  {!hintViewed ? <p className="mt-1 text-sm text-muted">Use a hint when you need one. Answering on your own shows you&apos;re ready to move on.</p> : null}
                </div>
              </div>
              {!hintViewed ? (
                <button type="button" data-testid="hint-control" onClick={() => void handleHintViewed()} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-extrabold text-forge max-sm:w-full">Show hint</button>
              ) : null}
            </div>
            {hintViewed ? <div ref={hintContentRef} tabIndex={-1} data-testid="hint-content" className="mt-3 rounded-lg bg-paper p-4 outline-none"><p className="mb-2 text-sm font-extrabold text-forge">Hint</p><MathContent>{question.hint}</MathContent></div> : null}
          </Card>

          {(submitted || questionProgress.attempted) ? (
            <>
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 ref={solutionHeadingRef} tabIndex={-1} className="m-0 text-xl font-extrabold outline-none">Worked solution</h2>
                    <p className="mt-1 text-sm text-muted">Compare each part with your submitted answer when you are ready.</p>
                  </div>
                  {!solutionViewed ? (
                    <button type="button" data-testid="worked-solution-control" onClick={() => void handleSolutionViewed()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-forge bg-white px-4 text-sm font-extrabold text-forge">
                      <Eye className="size-4" /> View worked solution
                    </button>
                  ) : null}
                </div>
                {solutionViewed ? <div className="mt-4 border-t border-line pt-4"><WorkedSolutionContent key={`${question.id}:${question.questionVersion}`} solution={question.workedSolution} finalAnswer={question.finalAnswer} /></div> : null}
              </Card>
              {question.commonMistake && solutionViewed ? (
                <Card className="p-4">
                  <h2 className="mb-2 text-lg font-extrabold">Common mistake</h2>
                  <MathContent>{question.commonMistake}</MathContent>
                </Card>
              ) : null}
            </>
          ) : null}

          {showCompletionPanel && !sessionPanel && skillPath && localProgress ? (
            <PathCompletionPanel skillPath={skillPath} progress={localProgress} nextAction={nextAction} />
          ) : showStageCompletionPanel && !sessionPanel && skillPath && stage && stageLocalProgress ? (
            <StageCompletionPanel skillPath={skillPath} stage={stage} progress={stageLocalProgress} nextAction={nextAction} />
          ) : sessionPanel ? null : (
            <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
              <Link href={position.previous ? getQuestionHref(position.previous.id) : fallbackPathHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white text-sm font-bold">
                <ArrowLeft className="size-5" /> Previous
              </Link>
              {questionProgress.navigationEligible && nextAction.href ? (
                <Link data-testid="next-question-action" href={nextAction.href} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-forge text-sm font-bold text-white">
                  {nextAction.label}<ArrowRight className="size-5" />
                </Link>
              ) : (
                <span data-testid="next-question-locked" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-line px-4 text-center text-sm font-bold text-muted">Complete this question to continue</span>
              )}
            </div>
          )}
        </section>

        <aside className="grid content-start gap-3" aria-label="Question support">
          <Card className="p-4">
            <h2 className="mb-3 text-lg font-extrabold">Stage progress</h2>
            <PanelProgress
              label={stage?.name ?? "Current stage"}
              value={stageLocalProgress?.completionPercentage ?? 0}
              valueLabel={stageLocalProgress ? `${stageLocalProgress.completedQuestionIds.length} / ${stageLocalProgress.totalQuestions}` : stagePosition ? `${stagePosition.current} / ${stagePosition.total}` : "Not tracked"}
            />
            <div className="mt-4 border-t border-line pt-4">
              <PanelProgress
                label={skillPath?.name ?? question.skillPath ?? "Full path"}
                value={localProgress?.completionPercentage ?? 0}
                valueLabel={localProgress ? `${localProgress.completedQuestionIds.length} / ${localProgress.totalQuestions}` : `${currentQuestion} / ${totalQuestions}`}
                secondary
              />
            </div>
          </Card>
          <div className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-center text-sm font-bold text-muted">
            <MessageSquare className="size-4" />
            <ReportDialog
              triggerLabel="Report this question"
              defaultKind="content_issue"
              pageArea="question_workspace"
              contentReference={{
                subjectId: context?.subject.subjectSlug,
                courseId: context?.courseArea.slug,
                pathId: question.skillPathId ?? skillPath?.slug,
                stageId: question.stageId ?? stage?.id,
                questionId: question.id,
                questionVersion: question.questionVersion,
                contentRevision: question.contentRevision,
                questionType: question.answerType,
              }}
              component={question.graphConfig ? "graph_question" : question.natureTableConfig ? "nature_table_question" : question.answerType}
              className="font-bold text-forge"
            />
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function PanelProgress({ label, value, valueLabel, secondary = false }: { label: string; value: number; valueLabel: string; secondary?: boolean }) {
  return (
    <div className={secondary ? "opacity-80" : ""}>
      <div className="mb-2 flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <strong>{valueLabel}</strong>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function browserStorage() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Lightbulb, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AppTopbar } from "@/components/layout/app-topbar";
import { Card, ProgressBar } from "@/components/ui";
import { MathContent } from "@/components/questions/math-content";
import { QuestionAnswerInput } from "@/components/questions/answer-inputs";
import { getMathsQuestionById, getMathsQuestionPosition } from "@/data/question-registry";
import { getBasicDifferentiationSkillPath, getStageForQuestion } from "@/data/active-path";
import { getNextQuestionId, saveQuestionAttempt } from "@/lib/local-progress";
import type { Question } from "@/data/types";

export function QuestionWorkspace({ question }: { question: Question }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const position = useMemo(() => getMathsQuestionPosition(question.id), [question.id]);
  const hasPosition = position.index >= 0 && position.total > 0;
  const currentQuestion = hasPosition ? position.current : 1;
  const totalQuestions = hasPosition ? position.total : 1;
  const usesGuidedMarking = question.answerType === "written" || question.answerType === "multi_step";
  const isCorrect = submitted && !usesGuidedMarking && isAcceptedAnswer(answer, question.acceptedAnswers);
  const progress = hasPosition ? Math.round((position.current / position.total) * 100) : 0;
  const stage = getStageForQuestion(question.id);
  const skillPath = getBasicDifferentiationSkillPath();
  const nextQuestionId = submitted ? getNextQuestionId(skillPath) : null;
  const nextQuestion = nextQuestionId ? getMathsQuestionById(nextQuestionId) : undefined;
  const nextActionHref = nextQuestionId ? `/question/${nextQuestionId}` : skillPath.href;
  const nextActionLabel = nextQuestion ? (nextQuestion.stage === question.stage ? `Continue ${nextQuestion.stage}` : `Move to ${nextQuestion.stage}`) : "Review Basic differentiation";

  useEffect(() => {
    setAnswer("");
    setSubmitted(false);
  }, [question.id]);

  function handleSubmit() {
    if (!answer.trim() || submitted) return;
    const markedCorrect = usesGuidedMarking ? null : isAcceptedAnswer(answer, question.acceptedAnswers);
    saveQuestionAttempt({
      questionId: question.id,
      skillPathId: question.skillPathId ?? skillPath.slug,
      stageId: question.stageId ?? stage?.id ?? question.stage,
      isCorrect: markedCorrect,
      answer,
      attemptedAt: new Date().toISOString(),
    });
    setSubmitted(true);
  }

  return (
    <AppShell demo active="Current Path">
      <div className="mx-auto mb-6 flex max-w-[1240px] justify-end">
        <AppTopbar demo />
      </div>
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_320px] gap-6 max-lg:grid-cols-1 max-md:gap-4">
        <section className="grid gap-5">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/subjects">Subjects</Link>
            <span>/</span>
            <Link href="/subjects/higher-maths">Higher Maths</Link>
            <span>/</span>
            <Link href="/subjects/higher-maths/calculus">Calculus</Link>
            <span>/</span>
            <Link href="/subjects/higher-maths/calculus/differentiation">Differentiation</Link>
            <span>/</span>
            <span className="font-bold text-forge">Basic differentiation</span>
          </nav>

          <Card className="p-5 max-md:p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Badge>Higher Maths</Badge>
              <HeaderMeta label="Stage" value={question.stage} />
              <HeaderMeta label="Source" value={question.source} />
              <HeaderMeta label="Skill" value={question.skill} />
              <HeaderMeta label="Marks" value={String(question.marks)} />
              <HeaderMeta label="Progress" value={hasPosition ? `Question ${currentQuestion} of ${totalQuestions}` : "Question"} />
            </div>
            <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
              STEM Forge questions are original SQA-style practice and are not copied from SQA materials.
            </p>
          </Card>

          <Card className="p-8 max-md:p-4">
            <p className="mb-5 font-mono text-[13px] font-extrabold uppercase text-forge">
              {question.stage} / Question {currentQuestion}
            </p>
            <h1 className="mb-6 text-[clamp(30px,4vw,46px)] font-extrabold leading-tight">{question.title}</h1>
            <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_18px_54px_rgba(17,17,17,0.04)] max-md:p-4">
              <MathContent>{question.questionText}</MathContent>
              <div className="mt-7">
                <label className="mb-2 block text-sm text-muted">Your answer</label>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 max-md:grid-cols-1">
                  <QuestionAnswerInput question={question} value={answer} submitted={submitted} onChange={setAnswer} />

                  <button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || submitted}
                    className="min-h-14 rounded-lg bg-forge px-8 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45 max-md:w-full"
                  >
                    Submit Answer
                  </button>
                </div>
              </div>
            </div>

            {submitted && (
              <div
                id="answer-feedback"
                className={`mt-5 flex items-start gap-4 rounded-xl border p-5 max-md:grid max-md:p-4 ${isCorrect ? "border-[#8ed0a6] bg-[#f1fbf4]" : "border-[#f0b8a0] bg-[#fff4ec]"}`}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-full text-white ${isCorrect ? "bg-[#229954]" : "bg-forge"}`}>
                  {isCorrect ? <Check className="size-6" /> : <X className="size-6" />}
                </span>
                <div>
                  <h2 className="m-0 text-xl font-extrabold">{usesGuidedMarking ? "Ready to self-check" : isCorrect ? "Correct" : "Not quite"}</h2>
                  <p className="mt-2 text-muted">
                    {usesGuidedMarking
                      ? "Use the worked solution below to compare your method. Full marking for written and multi-step answers will come later."
                      : isCorrect
                        ? "Good. Your answer matches the expected result."
                        : "Compare your answer with the worked solution below. Algebraic checks are simple for now, so use the solution to confirm your method."}
                  </p>
                  <div className="mt-3 rounded-lg bg-white/70 px-4 py-3">
                    <span className="mb-1 block text-sm font-bold text-muted">Final answer</span>
                    <MathContent>{question.finalAnswer}</MathContent>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {submitted && (
            <>
              <Card className="p-7 max-md:p-4">
                <h2 className="mb-5 text-2xl font-extrabold">Worked Solution</h2>
                <MathContent>{question.workedSolution}</MathContent>
              </Card>
              {question.commonMistake ? (
                <Card className="p-7 max-md:p-4">
                  <h2 className="mb-3 text-xl font-extrabold">Common mistake</h2>
                  <MathContent>{question.commonMistake}</MathContent>
                </Card>
              ) : null}
            </>
          )}

          <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
            <Link
              href={position.previous ? `/question/${position.previous.id}` : "/subjects/higher-maths/calculus/differentiation/basic-differentiation"}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg border border-line bg-white font-bold"
            >
              <ArrowLeft className="size-5" />
              Previous
            </Link>
            <Link
              href={submitted ? nextActionHref : position.next ? `/question/${position.next.id}` : "/subjects/higher-maths/calculus/differentiation/basic-differentiation"}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-forge font-bold text-white"
            >
              {submitted ? nextActionLabel : "Next Question"}
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <Card className="p-6 max-md:p-4">
            <h2 className="mb-5 text-xl font-extrabold">Your Progress</h2>
            <PanelProgress label="Basic differentiation" value={progress} valueLabel={hasPosition ? `${currentQuestion} / ${totalQuestions}` : "Not tracked"} />
            <PanelProgress label="Stage" value={stageProgress(question.stage)} valueLabel={question.stage} />
          </Card>
          <Card className="p-6 max-md:p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-[#fff4ec] text-forge">
                <Lightbulb className="size-5" />
              </span>
              <h2 className="m-0 text-xl font-extrabold">{submitted ? "Hint" : "Before you submit"}</h2>
            </div>
            {submitted ? (
              <MathContent>{question.hint}</MathContent>
            ) : (
              <p className="leading-relaxed text-muted">Try the question first. After you submit, STEM Forge will show the hint, feedback and worked solution.</p>
            )}
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function isAcceptedAnswer(answer: string, acceptedAnswers: string[]) {
  const normalised = normaliseAnswer(answer);
  return acceptedAnswers.some((accepted) => normaliseAnswer(accepted) === normalised);
}

function normaliseAnswer(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/\*/g, "").replace(/\{|\}/g, "");
}

function stageProgress(stage: string) {
  if (stage === "Foundations") return 0;
  if (stage === "Applications") return 0;
  return 0;
}

function Badge({ children }: { children: string }) {
  return <span className="rounded-lg bg-[#fff4ec] px-4 py-2 font-bold text-forge">{children}</span>;
}

function HeaderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-between">
      <span>{label}:</span>
      <strong>{value}</strong>
    </div>
  );
}

function PanelProgress({ label, value, valueLabel }: { label: string; value: number; valueLabel: string }) {
  return (
    <div className="mb-7 last:mb-0">
      <div className="mb-3 flex justify-between gap-4">
        <span>{label}</span>
        <strong>{valueLabel}</strong>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}














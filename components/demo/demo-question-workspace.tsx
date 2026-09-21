"use client";

import { useDemoRuntime } from "@/components/demo/demo-runtime-provider";
import { DemoPathway } from "@/components/demo/demo-pathway";
import { QuestionWorkspace } from "@/components/questions/question-workspace";
import { previewQuestionAction } from "@/lib/demo/walkthrough";
import type { Question } from "@/data/types";

export function DemoQuestionWorkspace({ question }: { question: Question }) {
  const runtime = useDemoRuntime();
  return <QuestionWorkspace question={question} runtime={runtime} preview={{
    pathway: <div className="mb-5"><DemoPathway compact currentStageId={question.stageId} /></div>,
    nextAction: previewQuestionAction(question.id),
  }} />;
}

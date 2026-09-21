import { demoNavigation, getDemoQuestion, getDemoQuestions } from "@/lib/demo/content";
import type { ProgressEvidence, QuestionProgressState } from "@/lib/progress/types";

export const WALKTHROUGH_IDS = ["hm-calc-diff-chain-f-003", "hm-calc-diff-chain-a-001", "hm-calc-diff-chain-ppq-003"] as const;

export function hasPreviewInteraction(evidence: ProgressEvidence, id?: string) {
  return [...evidence.attempts, ...evidence.supportEvents].some((event) => {
    const question = getDemoQuestion(event.questionId)?.question;
    return question && (!id || id === event.questionId) && event.versionEvidence.questionVersion === question.questionVersion;
  });
}

export function previewContinueHref(evidence: ProgressEvidence) {
  if (!hasPreviewInteraction(evidence)) return demoNavigation.skill;
  const next = WALKTHROUGH_IDS.find((id) => !hasPreviewInteraction(evidence, id));
  return next ? demoNavigation.question(next) ?? demoNavigation.skill : demoNavigation.skill;
}

export function previewQuestionAction(id: string) {
  const sample = WALKTHROUGH_IDS.findIndex((item) => item === id);
  if (sample >= 0) return {
    href: sample < 2 ? demoNavigation.question(WALKTHROUGH_IDS[sample + 1])! : demoNavigation.home,
    label: ["Sample Applications", "Sample Exam practice", "Return to Preview Dashboard"][sample],
  };
  const context = getDemoQuestion(id);
  const stageQuestions = getDemoQuestions().filter((question) => question.stageId === context?.stage.id);
  const next = stageQuestions[stageQuestions.findIndex((question) => question.id === id) + 1];
  return next ? { href: demoNavigation.question(next.id)!, label: "Next question" }
    : { href: demoNavigation.skill, label: "Explore Chain Rule" };
}

export function previewOutcomeLabel(progress: QuestionProgressState) {
  if (progress.solutionViewed) return "Solution used";
  if (progress.bestOutcome === "correct_with_hint") return "Correct with hint";
  if (progress.bestOutcome === "independently_correct_after_error") return "Correct after error";
  if (progress.bestOutcome === "independently_correct_first_attempt") return "Correct independently";
  if (progress.hintViewed) return "Hint used";
  return progress.incorrectAttemptCount > 0 ? "Attempted · not yet correct" : "Attempted · not marked correct or incorrect";
}

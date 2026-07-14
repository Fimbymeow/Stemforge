import { getActiveSkillPath, getQuestionContext, getQuestionHref } from "@/lib/learning-paths";
import type { LearningStage, SkillPath } from "@/data/types";

// Private-beta entry helper retained for current homepage/dashboard entry points.
export function getBasicDifferentiationSkillPath(): SkillPath {
  return getActiveSkillPath();
}

export function getStageForQuestion(questionId: string): LearningStage | undefined {
  return getQuestionContext(questionId)?.stage;
}

export function getNextActionForQuestion(questionId: string) {
  const context = getQuestionContext(questionId);
  if (!context) return { label: "Browse subjects", href: "/subjects", title: "Browse subjects" };

  const reviewLabel = `Review ${context.skillPath.name}`;
  if (context.nextQuestion?.stageId === context.stage.id) {
    return {
      label: `Continue ${context.stage.name}`,
      href: getQuestionHref(context.nextQuestion.id),
      title: `Continue ${context.stage.name}`,
    };
  }
  if (context.nextStage && context.nextQuestion) {
    return {
      label: `Move to ${context.nextStage.name}`,
      href: getQuestionHref(context.nextQuestion.id),
      title: `Move to ${context.nextStage.name}`,
    };
  }
  return { label: reviewLabel, href: context.skillPath.href, title: reviewLabel };
}

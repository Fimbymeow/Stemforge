import {
  getActiveSkillPath,
  getQuestionHref,
  getStageForQuestionInSkillPath,
} from "@/lib/learning-paths";
import type { LearningStage, SkillPath } from "@/data/types";

// Beta shortcut: the active available path is currently Basic differentiation, resolved from data.
export function getBasicDifferentiationSkillPath(): SkillPath {
  return getActiveSkillPath();
}

export function getStageForQuestion(questionId: string): LearningStage | undefined {
  return getStageForQuestionInSkillPath(getActiveSkillPath(), questionId);
}

export function getNextActionForQuestion(questionId: string) {
  const skillPath = getActiveSkillPath();
  const stages = skillPath.learningStages ?? [];
  const currentStageIndex = stages.findIndex((stage) => stage.questionIds.includes(questionId));
  const currentStage = currentStageIndex >= 0 ? stages[currentStageIndex] : undefined;
  const reviewLabel = `Review ${skillPath.name}`;

  if (!currentStage) {
    return {
      label: reviewLabel,
      href: skillPath.href,
      title: reviewLabel,
    };
  }

  const questionIndex = currentStage.questionIds.indexOf(questionId);
  const nextInStage = currentStage.questionIds[questionIndex + 1];
  if (nextInStage) {
    return {
      label: `Continue ${currentStage.name}`,
      href: getQuestionHref(nextInStage),
      title: `Continue ${currentStage.name}`,
    };
  }

  const nextStage = stages[currentStageIndex + 1];
  const firstQuestionInNextStage = nextStage?.questionIds[0];
  if (nextStage && firstQuestionInNextStage) {
    return {
      label: `Move to ${nextStage.name}`,
      href: getQuestionHref(firstQuestionInNextStage),
      title: `Move to ${nextStage.name}`,
    };
  }

  return {
    label: reviewLabel,
    href: skillPath.href,
    title: reviewLabel,
  };
}

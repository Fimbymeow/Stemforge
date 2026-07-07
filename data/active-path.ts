import { higherMaths } from "@/data/higher-maths";
import type { LearningStage, SkillPath } from "@/data/types";

export function getBasicDifferentiationSkillPath(): SkillPath {
  const skillPath = higherMaths.courseAreas
    .find((area) => area.slug === "calculus")
    ?.specAreas.find((specArea) => specArea.slug === "differentiation")
    ?.skillPaths?.find((path) => path.slug === "basic-differentiation");

  if (!skillPath) {
    throw new Error("Basic differentiation skill path is missing from Higher Maths data.");
  }

  return skillPath;
}

export function getStageForQuestion(questionId: string): LearningStage | undefined {
  return getBasicDifferentiationSkillPath().learningStages?.find((stage) => stage.questionIds.includes(questionId));
}

export function getNextActionForQuestion(questionId: string) {
  const skillPath = getBasicDifferentiationSkillPath();
  const stages = skillPath.learningStages ?? [];
  const currentStageIndex = stages.findIndex((stage) => stage.questionIds.includes(questionId));
  const currentStage = currentStageIndex >= 0 ? stages[currentStageIndex] : undefined;

  if (!currentStage) {
    return {
      label: "Review Basic differentiation",
      href: skillPath.href,
      title: "Review Basic differentiation",
    };
  }

  const questionIndex = currentStage.questionIds.indexOf(questionId);
  const nextInStage = currentStage.questionIds[questionIndex + 1];
  if (nextInStage) {
    return {
      label: `Continue ${currentStage.name}`,
      href: `/question/${nextInStage}`,
      title: `Continue ${currentStage.name}`,
    };
  }

  const nextStage = stages[currentStageIndex + 1];
  const firstQuestionInNextStage = nextStage?.questionIds[0];
  if (nextStage && firstQuestionInNextStage) {
    return {
      label: `Move to ${nextStage.name}`,
      href: `/question/${firstQuestionInNextStage}`,
      title: `Move to ${nextStage.name}`,
    };
  }

  return {
    label: "Review Basic differentiation",
    href: skillPath.href,
    title: "Review Basic differentiation",
  };
}

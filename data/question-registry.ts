import { higherMathsDifferentiationQuestions } from "@/content/questions/higher-maths/differentiation";
import { getQuestionById } from "@/lib/learning-paths";
import { getQuestionById as getPhysicsQuestionById, questions as physicsQuestions } from "@/data/questions";

export const mathsQuestions = higherMathsDifferentiationQuestions;

export function getMathsQuestionById(id: string) {
  return mathsQuestions.find((question) => question.id === id);
}

export function getAnyQuestionById(id: string) {
  return getQuestionById(id) ?? getPhysicsQuestionById(id);
}

export function getMathsQuestionPosition(id: string) {
  const index = mathsQuestions.findIndex((question) => question.id === id);
  return {
    index,
    current: index >= 0 ? index + 1 : 0,
    total: mathsQuestions.length,
    previous: index > 0 ? mathsQuestions[index - 1] : undefined,
    next: index >= 0 && index < mathsQuestions.length - 1 ? mathsQuestions[index + 1] : undefined,
  };
}

export function getFirstMathsQuestionForStage(stage: string) {
  return mathsQuestions.find((question) => question.stage === stage);
}

export { physicsQuestions };

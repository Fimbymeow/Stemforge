import { getQuestionById as getPhysicsQuestionById, questions as physicsQuestions } from "@/data/questions";
import { contentResolver } from "@/lib/content-resolver";

export const mathsQuestions = contentResolver.getQuestions();

export function getMathsQuestionById(id: string) {
  return contentResolver.getQuestion(id);
}

export function getAnyQuestionById(id: string) {
  return contentResolver.getQuestion(id) ?? getPhysicsQuestionById(id);
}

export function getMathsQuestionPosition(id: string) {
  const context = contentResolver.getQuestionContext(id);
  return {
    index: context?.questionIndexInPath ?? -1,
    current: context ? context.questionIndexInPath + 1 : 0,
    total: context?.pathQuestions.length ?? 0,
    previous: context?.previousQuestion,
    next: context?.nextQuestion,
  };
}

export function getFirstMathsQuestionForStage(stage: string) {
  for (const context of contentResolver.getAllPathContexts()) {
    const targetStage = context.skillPath.learningStages?.find((candidate) => candidate.id === stage || candidate.name === stage || candidate.label === stage);
    const questionId = targetStage?.questionIds[0];
    if (questionId) return contentResolver.getQuestion(questionId);
  }
  return undefined;
}

export { physicsQuestions };

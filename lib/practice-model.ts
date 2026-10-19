import { higherMathematicsCalculusPrerequisites } from "@/data/curriculum/higher-mathematics/calculus-prerequisites";
import type { Question, SkillPath } from "@/data/types";
import { contentResolver } from "@/lib/content-resolver";
import type { SkillPathProgress } from "@/lib/progress/types";

/** Explicit capability boundary for the Notes -> Practice -> Review learner model. */
export function isPracticeCompatibleSkill(path: SkillPath | null | undefined): boolean {
  return Boolean(path?.practiceQuestionIds?.length);
}

export function derivePracticeProgress(path: SkillPath, progress: SkillPathProgress) {
  const questionIds = path.practiceQuestionIds ?? [];
  const completed = new Set(progress.completedQuestionIds);
  const completedCount = questionIds.filter((questionId) => completed.has(questionId)).length;
  return {
    completedCount,
    totalCount: questionIds.length,
    percentage: questionIds.length ? Math.round((completedCount / questionIds.length) * 100) : 0,
  };
}

export function derivePracticeDependencies(path: SkillPath) {
  const hardIds = higherMathematicsCalculusPrerequisites
    .filter((edge) => edge.skillPathId === path.slug && edge.strength === "hard")
    .map((edge) => edge.requiresSkillPathId);
  const hard = new Set(hardIds);
  const conditionalIds = new Set<string>();
  for (const question of contentResolver.getPracticeQuestions(path)) {
    for (const requiredId of question.curriculum?.requiredSkillIds ?? []) {
      if (requiredId !== path.slug && !hard.has(requiredId)) conditionalIds.add(requiredId);
    }
  }
  return {
    prerequisites: hardIds.map(dependencyView),
    conditional: [...conditionalIds].map(dependencyView),
  };
}

export function practicePositionForQuestion(question: Question) {
  return contentResolver.getPracticeQuestionPosition(question.id);
}

function dependencyView(skillPathId: string) {
  const path = contentResolver.getPathContext(skillPathId)?.skillPath;
  return { skillPathId, name: path?.name ?? skillPathId, href: path?.href ?? "/subjects/higher-maths" };
}

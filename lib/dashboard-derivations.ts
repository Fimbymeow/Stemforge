import type { SkillPath } from "@/data/types";
import { calculateSkillPathProgress, selectNextQuestionId } from "@/lib/progress/calculations";
import type { ProgressEvidence } from "@/lib/progress/types";

export function derivePathDashboardSummary(
  skillPath: SkillPath,
  evidence: ProgressEvidence,
  activeQuestionVersions: Readonly<Record<string, number>>,
) {
  const progress = calculateSkillPathProgress(skillPath, evidence, activeQuestionVersions);
  const nextQuestionId = selectNextQuestionId(skillPath, evidence, activeQuestionVersions);
  const currentStage = (skillPath.learningStages ?? []).find((stage) => stage.questionIds.includes(nextQuestionId ?? ""))
    ?? (skillPath.learningStages ?? [])[0];
  return {
    skillPathId: skillPath.slug,
    skillPathHref: skillPath.href,
    nextQuestionId,
    currentStageId: currentStage?.id ?? null,
    currentStageName: currentStage?.name ?? null,
    completedQuestions: progress.completedQuestionIds.length,
    totalQuestions: progress.totalQuestions,
    completionPercentage: progress.completionPercentage,
    reviewRecommendedCount: progress.reviewQuestionIds.length,
    status: progress.status,
    masteryScore: progress.masteryScore,
  };
}

export function deriveCourseDashboardSummary(
  skillPaths: readonly SkillPath[],
  evidence: ProgressEvidence,
  activeQuestionVersions: Readonly<Record<string, number>>,
) {
  const paths = skillPaths
    .filter((path) => path.isAvailable)
    .map((path) => derivePathDashboardSummary(path, evidence, activeQuestionVersions));
  const totalQuestions = paths.reduce((total, path) => total + path.totalQuestions, 0);
  const completedQuestions = paths.reduce((total, path) => total + path.completedQuestions, 0);
  return {
    paths,
    completedQuestions,
    totalQuestions,
    completionPercentage: totalQuestions ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
    reviewRecommendedCount: paths.reduce((total, path) => total + path.reviewRecommendedCount, 0),
  };
}

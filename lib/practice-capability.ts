import type { SkillPath } from "@/data/types";

/**
 * Practice V2-native skills use their canonical Practice bank as the learner
 * structure and deliberately have no active legacy learning stages.
 */
export function isPracticeOnlySkill(path: SkillPath | null | undefined): boolean {
  return Boolean(
    path?.practiceCompatibilityStageId
    && path.practiceQuestionIds?.length
    && !(path.learningStages ?? []).some((stage) => stage.contentStatus === "active"),
  );
}

/** Keep legacy Review provenance stage-backed; only Practice-only skills branch. */
export function getStructuralQuestionIds(path: SkillPath): string[] {
  return isPracticeOnlySkill(path)
    ? [...(path.practiceQuestionIds ?? [])]
    : (path.learningStages ?? [])
      .filter((stage) => stage.contentStatus === "active")
      .flatMap((stage) => stage.questionIds);
}

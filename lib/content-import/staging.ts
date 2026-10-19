import type { Question, Subject } from "@/data/types";
import {
  materializeApprovedQuestions,
  resolveApprovedPracticeOrder,
} from "@/lib/content-import/generation";
import type { ApprovalReceipt, ImportRegistry } from "@/lib/content-import/types";

export type StagedCanonicalContent = {
  subjects: Subject[];
  questions: Question[];
};

/**
 * Builds the complete graph that an approved import must satisfy before any
 * canonical bytes are written. Practice V2 installation remains unpublished:
 * this function never changes status or isAvailable.
 */
export function createStagedCanonicalContent(input: {
  approval: ApprovalReceipt;
  registry: ImportRegistry;
  subjects: readonly Subject[];
  questions: readonly Question[];
}): StagedCanonicalContent {
  const byPath = materializeApprovedQuestions(input.approval, input.registry);
  const questions = [...input.questions];
  for (const [pathSlug, pathQuestions] of byPath) {
    const retained = questions.filter((question) => question.skillPathId !== pathSlug);
    questions.splice(0, questions.length, ...retained, ...pathQuestions);
  }

  const subjects = structuredClone(input.subjects) as Subject[];
  for (const subject of subjects) {
    for (const course of subject.courseAreas) {
      for (const spec of course.specAreas) {
        for (const path of spec.skillPaths ?? []) {
          const pathQuestions = byPath.get(path.slug);
          if (!pathQuestions) continue;
          const practiceOrder = input.approval.previewDecisionPayload.practiceOrders?.find(
            (order) => order.targetSkillPathSlug === path.slug,
          );

          if (practiceOrder?.source === "authored_practice") {
            const compatibilityStageId = input.registry.paths.get(path.slug)?.practiceCompatibilityStageId;
            if (!compatibilityStageId) throw new Error(`practice_compatibility_stage_not_wired:${path.slug}`);
            const practiceQuestionIds = resolveApprovedPracticeOrder(
              input.approval,
              input.registry,
              path.slug,
              pathQuestions,
            );
            path.practiceCompatibilityStageId = compatibilityStageId;
            path.practiceQuestionIds = [...practiceQuestionIds];
            path.questions = practiceQuestionIds.length;
            continue;
          }

          for (const stage of path.learningStages ?? []) {
            stage.questionIds = pathQuestions
              .filter((question) => question.stageId === stage.id)
              .sort((left, right) => left.displayOrder - right.displayOrder)
              .map((question) => question.id);
            stage.questions = stage.questionIds.length;
          }
          path.questions = pathQuestions.length;
        }
      }
    }
  }
  return { subjects, questions };
}

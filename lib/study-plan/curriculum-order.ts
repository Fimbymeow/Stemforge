import { higherMathematicsCalculusPrerequisites } from "@/data/curriculum/higher-mathematics/calculus-prerequisites";
import { higherMathematicsCalculusTeachingSequence } from "@/data/curriculum/higher-mathematics/calculus-teaching-sequence";
import type { ResolvedSkillPath } from "@/lib/content-resolver";
import type { SkillPathProgress } from "@/lib/progress/types";

const authoredOrder = new Map(
  higherMathematicsCalculusTeachingSequence.map((entry, index) => [entry.skillPathId, index]),
);

export function orderStudyPlanContexts(contexts: readonly ResolvedSkillPath[]): ResolvedSkillPath[] {
  return contexts
    .map((context, resolverIndex) => ({ context, resolverIndex }))
    .sort((left, right) =>
      (authoredOrder.get(left.context.skillPath.slug) ?? Number.MAX_SAFE_INTEGER)
      - (authoredOrder.get(right.context.skillPath.slug) ?? Number.MAX_SAFE_INTEGER)
      || left.resolverIndex - right.resolverIndex
      || left.context.skillPath.slug.localeCompare(right.context.skillPath.slug))
    .map(({ context }) => context);
}

export function hardPrerequisitesSatisfied(
  skillPathId: string,
  progressBySkill: ReadonlyMap<string, SkillPathProgress>,
): boolean {
  return higherMathematicsCalculusPrerequisites
    .filter((edge) => edge.skillPathId === skillPathId && edge.strength === "hard")
    .every((edge) => {
      const progress = progressBySkill.get(edge.requiresSkillPathId);
      return Boolean(progress && ["completed", "secure", "mastered"].includes(progress.status));
    });
}


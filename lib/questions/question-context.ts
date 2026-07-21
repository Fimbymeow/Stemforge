import type { ResolvedQuestionContext } from "@/lib/content-resolver";

export type StageQuestionPosition = {
  current: number;
  total: number;
  label: string;
};

export function deriveStageQuestionPosition(
  context: Pick<ResolvedQuestionContext, "questionIndexInStage" | "stage"> | undefined,
): StageQuestionPosition | null {
  if (!context || context.questionIndexInStage < 0 || context.stage.questionIds.length === 0) return null;
  const current = context.questionIndexInStage + 1;
  const total = context.stage.questionIds.length;
  return { current, total, label: `Question ${current} of ${total} in ${context.stage.name}` };
}

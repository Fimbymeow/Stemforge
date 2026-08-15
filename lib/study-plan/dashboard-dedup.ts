import type { LearnerNextAction } from "@/lib/learning/next-action";
import type { StudyPlanItem } from "@/lib/study-plan/types";

export type StudyPlanDashboardState =
  | { status: "loading" | "setup"; caughtUp: false; todayItems: readonly StudyPlanItem[] }
  | { status: "configured"; caughtUp: boolean; todayItems: readonly StudyPlanItem[] };

export type DashboardContinueMode = "full" | "compact" | "hidden";

export function resolveDashboardContinueMode(input: {
  studyPlanEnabled: boolean;
  plan: StudyPlanDashboardState;
  recommendation: LearnerNextAction;
}): DashboardContinueMode {
  if (!input.studyPlanEnabled || input.plan.status !== "configured") return "full";
  if (input.plan.caughtUp || !input.recommendation.href) return "hidden";
  if (input.plan.todayItems.some((item) => equivalentAction(item, input.recommendation))) return "hidden";
  return "compact";
}

function equivalentAction(item: StudyPlanItem, action: LearnerNextAction) {
  if (item.href === action.href) return true;
  if (!action.pathId || item.skillPathId !== action.pathId) return false;
  if (action.kind === "resume_practice") return false;
  if (item.actionType === "review") return action.intent === "reviewing";
  if (item.actionType === "continue_stage") {
    return action.intent === "starting" || action.intent === "continuing" || action.kind === "resume_question";
  }
  return item.actionType === "targeted_practice" && action.intent === "practising";
}

import type { LearnerNextAction } from "@/lib/learning/next-action";
import type { StudyPlanItem } from "@/lib/study-plan/types";

export type StudyPlanDashboardState =
  | { status: "loading" | "setup"; caughtUp: false; todayItems: readonly StudyPlanItem[]; planItems: readonly StudyPlanItem[] }
  | { status: "configured"; caughtUp: boolean; todayItems: readonly StudyPlanItem[]; planItems: readonly StudyPlanItem[] };

export type DashboardContinueMode = "full" | "compact" | "hidden";

export function resolveDashboardContinueMode(input: {
  studyPlanEnabled: boolean;
  plan: StudyPlanDashboardState;
  recommendation: LearnerNextAction;
}): DashboardContinueMode {
  if (!input.studyPlanEnabled || input.plan.status !== "configured") return "full";
  if (!input.recommendation.href) return "hidden";
  return input.plan.caughtUp ? "compact" : "hidden";
}

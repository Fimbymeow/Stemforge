import type { ProgressEvidence } from "@/lib/progress/types";

export type StudyPlanWeekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type StudyPlanExamPhase = "no_date" | "far" | "medium" | "close";
export type StudyPlanActionType = "review" | "notes" | "continue_stage" | "targeted_practice";
export type StudyPlanItemState = "planned" | "completed" | "skipped";
export type StudyPlanReasonCode =
  | "review_overdue"
  | "review_due"
  | "review_due_soon"
  | "continue_with_mistake"
  | "continue"
  | "recent_mistakes"
  | "next_skill";

export type StudyPlanPreferences = {
  courseSlug: string;
  weeklyMinutes: number;
  availableDays: StudyPlanWeekday[];
  examDate?: string | null;
};

export type StudyPlanPreservationInput = {
  itemStates?: Readonly<Record<string, Extract<StudyPlanItemState, "completed" | "skipped">>>;
  movedDates?: Readonly<Record<string, string>>;
  excludedItemKeys?: readonly string[];
};

export type StudyPlanGenerationInput = {
  now: Date;
  calendarDate?: Date;
  evidence: ProgressEvidence;
  preferences: StudyPlanPreferences;
  preservation?: StudyPlanPreservationInput;
};

export type StudyPlanCandidate = {
  candidateKey: string;
  skillPathId: string;
  skillName: string;
  actionType: StudyPlanActionType;
  href: string;
  reasonCode: StudyPlanReasonCode;
  tier: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  stageId: string | null;
  stageName: string | null;
  suggestedMinutes: number;
  dueAt: string | null;
  latestActivityAt: string | null;
  latestMistakeAt: string | null;
  examPractice: boolean;
  examQualifier: Exclude<StudyPlanExamPhase, "no_date"> | null;
};

export type StudyPlanItem = {
  id: string;
  itemKey: string;
  date: string;
  skillPathId: string;
  skillName: string;
  actionType: StudyPlanActionType;
  href: string;
  reasonCode: StudyPlanReasonCode;
  tier: StudyPlanCandidate["tier"];
  stageId: string | null;
  stageName: string | null;
  examQualifier: StudyPlanCandidate["examQualifier"];
  suggestedMinutes: number;
  state: StudyPlanItemState;
};

export type StudyPlanDiagnostic = {
  skillPathId: string | null;
  candidateKey: string | null;
  outcome: "candidate" | "selected" | "excluded";
  code: string;
  detail?: string;
};

export type StudyPlanResultStatus = "ok" | "invalid_input" | "course_missing" | "no_available_content";

export type StudyPlanResult = {
  status: StudyPlanResultStatus;
  errorCode: string | null;
  weekStart: string;
  generatedAt: string;
  generationVersion: 1;
  courseSlug: string;
  weeklyMinutes: number;
  allocatedMinutes: number;
  unusedMinutes: number;
  examPhase: StudyPlanExamPhase;
  caughtUp: boolean;
  items: StudyPlanItem[];
  diagnostics: StudyPlanDiagnostic[];
};

export type StudyPlanManualOverride = "completed" | "skipped" | "moved" | "later" | "pulled_forward" | null;

export type StudyPlanWeeklyItem = StudyPlanItem & {
  originalSuggestedDate: string;
  scheduledDate: string | null;
  manualOverride: StudyPlanManualOverride;
};

export type StudyPlanRebalanceReason =
  | "initial_generation"
  | "day_missed"
  | "review_became_due"
  | "preferences_changed"
  | "item_completed"
  | "manual_move"
  | "manual_skip"
  | "manual_swap"
  | "pull_forward"
  | "weekly_rollover"
  | "explicit_refresh"
  | "evidence_changed";

export type StudyPlanRebalanceDiagnostics = {
  reason: StudyPlanRebalanceReason;
  itemsPreserved: number;
  itemsMoved: number;
  itemsAdded: number;
  itemsRemoved: number;
  unusedCapacityBefore: number;
  unusedCapacityAfter: number;
  planDistance: number;
};

export type StudyPlanWeeklyPlan = Omit<StudyPlanResult, "items" | "diagnostics"> & {
  preferences: StudyPlanPreferences;
  items: StudyPlanWeeklyItem[];
  preservation: Required<StudyPlanPreservationInput> & { unscheduledItemKeys: string[] };
  lastRebalancedAt: string;
  rebalanceReasons: StudyPlanRebalanceReason[];
  rebalanceDiagnostics: StudyPlanRebalanceDiagnostics;
};

export type StudyPlanPreviousWeek = {
  weekStart: string;
  generatedAt: string;
  items: Array<Pick<StudyPlanWeeklyItem, "itemKey" | "state" | "manualOverride">>;
};

import type { ConfidenceLevel } from "@/lib/confidence/types";
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

export type AssessmentType = "class_test" | "prelim" | "final_exam" | "other";
export type AssessmentSource = "learner" | "orthic_provisional" | "official";

/**
 * A provisional assessment (e.g. a national exam period announced only as "May 2027") is
 * represented with month precision, never coerced into a fake exact date. Day-distance logic
 * must only ever run against `precision: "exact"` entries; month-precision entries resolve
 * through `classifyMonthPhase` instead. See `lib/study-plan/assessments.ts`.
 */
export type AssessmentDate =
  | { precision: "exact"; date: string }
  | { precision: "month"; year: number; month: number };

/**
 * Whole-course assessments never enumerate every skill; topic/skill scopes always store canonical
 * IDs, never display labels. A `topics` entry is a qualified `"${courseAreaSlug}:${routeTopicSlug}"`
 * string (see `topicScopeId` in `lib/study-plan/assessments.ts`) — the syllabus sub-section level
 * (e.g. "Differentiation"), not the broader course area (e.g. "Calculus"), since that's the
 * granularity an SQA learner actually scopes a topic test to.
 */
export type AssessmentScope =
  | { kind: "whole_course" }
  | { kind: "topics"; topicIds: string[] }
  | { kind: "skills"; skillPathIds: string[] };

export type Assessment = {
  id: string;
  courseSlug: string;
  type: AssessmentType;
  title: string;
  date: AssessmentDate;
  scope: AssessmentScope;
  source: AssessmentSource;
};

export type StudyPlanAssessmentQualifier = {
  assessmentId: string;
  title: string;
  type: AssessmentType;
  phase: Exclude<StudyPlanExamPhase, "no_date">;
  /** Only present for exact-precision assessments; never fabricated for month-precision ones. */
  daysUntil: number | null;
};

export type StudyPlanPreferences = {
  courseSlug: string;
  weeklyMinutes: number;
  availableDays: StudyPlanWeekday[];
  assessments: Assessment[];
};

export type StudyPlanPreservationInput = {
  itemStates?: Readonly<Record<string, Extract<StudyPlanItemState, "completed" | "skipped">>>;
  movedDates?: Readonly<Record<string, string>>;
  excludedItemKeys?: readonly string[];
  /** Manual "Later" state; account sync carries it without persisting a generated plan. */
  unscheduledItemKeys?: readonly string[];
};

export type StudyPlanGenerationInput = {
  now: Date;
  calendarDate?: Date;
  evidence: ProgressEvidence;
  preferences: StudyPlanPreferences;
  preservation?: StudyPlanPreservationInput;
  /**
   * A sibling of `preferences`, deliberately — confidence changes must only ever trigger the same
   * soft "evidence_changed"-style rebalance ordinary evidence changes already cause, never the hard
   * reconcile `samePreferences` gates (Part R). Absent entirely for callers with no confidence data
   * (e.g. the Study Plan simulation scripts), which must produce byte-identical output to before.
   */
  learnerConfidence?: ReadonlyMap<string, ConfidenceLevel>;
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
  assessmentQualifier: StudyPlanAssessmentQualifier | null;
  /** Learner self-rated this skill "Needs work" (Part R) — a soft tie-breaker only, see `confidenceOrder` in candidate-builder.ts. */
  learnerFlaggedNeedsWork: boolean;
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
  assessmentQualifier: StudyPlanAssessmentQualifier | null;
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

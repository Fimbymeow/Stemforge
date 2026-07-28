export const REVIEW_SESSION_ID_PREFIX = "review_session_" as const;

export type ReviewTargetRef = {
  targetType: "skill";
  targetId: string;
};

export type ReviewSourceRef = {
  sourceType: "practice_session";
  sourceId: string;
};

export type ReviewTargetVersionRef = {
  versionType: "skill_path";
  version: number;
};

export type ReviewEvidenceRef =
  | { evidenceKind: "attempt"; eventId: string }
  | { evidenceKind: "support_event"; eventId: string };

export type ReviewOutcome =
  | "independent_success"
  | "hint_assisted"
  | "solution_assisted"
  | "incorrect";

export type ReviewStage = "recovery" | "relearning" | 0 | 1 | 2 | 3 | 4 | 5;

export type ReviewEvent = {
  eventId: string;
  source: ReviewSourceRef;
  target: ReviewTargetRef;
  targetVersion: ReviewTargetVersionRef;
  outcome: ReviewOutcome;
  occurredAt: string;
  sequence: number;
  priorEventId: string | null;
  schedulerVersion: number;
  stageAfter: ReviewStage;
  evidenceRefs: ReviewEvidenceRef[];
  questionIds: string[];
};

export type ReviewDueReason =
  | "recently_incorrect"
  | "due_after_time"
  | "content_changed"
  | "not_due"
  | "not_learned"
  | "history_unavailable";

export type ReviewDueState = {
  target: ReviewTargetRef;
  eligible: boolean;
  due: boolean;
  dueSoon: boolean;
  dueAt: string | null;
  reason: ReviewDueReason;
  skillFirstCompletedAt: string | null;
  canonicalEvent: ReviewEvent | null;
  ordinaryRecoveryQuestionIds: string[];
  reassessmentQuestionIds: string[];
  diagnostic?: string;
};

export type ReviewTargetAssignment = {
  target: ReviewTargetRef;
  questionIds: string[];
};

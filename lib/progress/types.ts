export const CURRENT_PROGRESS_VERSION = 4 as const;

export type LegacyQuestionAttempt = {
  questionId: string;
  skillPathId: string;
  stageId: string;
  isCorrect: boolean | null;
  answer: string;
  attemptedAt: string;
};

export type ProgressPayloadV1 = {
  version: 1;
  data: { attempts: LegacyQuestionAttempt[] };
};

export type SupportKnowledge = "known" | "unknown_legacy";

export type KnownVersionEvidence = {
  kind: "known";
  questionVersion: number;
};

export type UnknownLegacyVersionEvidence = {
  kind: "unknown_legacy";
  questionVersion: null;
};

export type VersionEvidence = KnownVersionEvidence | UnknownLegacyVersionEvidence;

export const UNKNOWN_LEGACY_VERSION_EVIDENCE: UnknownLegacyVersionEvidence = {
  kind: "unknown_legacy",
  questionVersion: null,
};

export type QuestionAttemptV2 = LegacyQuestionAttempt & {
  sequence: number;
  isGenuine: boolean;
  hintViewedBeforeSubmission: boolean;
  supportKnowledge: SupportKnowledge;
  legacyCompleted?: boolean;
};

export type QuestionSupportEventV2 = {
  questionId: string;
  skillPathId: string;
  stageId: string;
  type: "hint_viewed" | "solution_viewed";
  occurredAt: string;
  sequence: number;
  afterGenuineAttempt: boolean;
};

export type ProgressPayloadV2 = {
  version: 2;
  data: {
    attempts: QuestionAttemptV2[];
    supportEvents: QuestionSupportEventV2[];
  };
};

export type QuestionAttemptV3 = QuestionAttemptV2 & {
  versionEvidence: VersionEvidence;
};

export type QuestionSupportEventV3 = QuestionSupportEventV2 & {
  versionEvidence: VersionEvidence;
};

export type ProgressPayloadV3 = {
  version: 3;
  data: {
    attempts: QuestionAttemptV3[];
    supportEvents: QuestionSupportEventV3[];
  };
};

export type QuestionAttempt = QuestionAttemptV3 & {
  eventId: string;
};

export type QuestionSupportEvent = QuestionSupportEventV3 & {
  eventId: string;
};

export type AchievementSnapshotKind =
  | "stage_completed"
  | "stage_secure"
  | "stage_mastered"
  | "path_completed"
  | "path_secure"
  | "path_mastered";

export type AchievementSnapshot = {
  snapshotId: string;
  kind: AchievementSnapshotKind;
  subjectId: string;
  courseId: string;
  pathId: string;
  pathVersion: number;
  stageId?: string;
  stageVersion?: number;
  achievedAt: string;
  masteryScore: number;
  independentPerformancePercentage: number;
  completionCount: number;
  totalRequiredCount: number;
  source: "derived_current" | "legacy_unknown";
};

export type ProgressPayloadV4 = {
  version: typeof CURRENT_PROGRESS_VERSION;
  data: {
    attempts: QuestionAttempt[];
    supportEvents: QuestionSupportEvent[];
    achievementSnapshots: AchievementSnapshot[];
  };
};

export type ProgressPayload = ProgressPayloadV4;
export type ProgressEvidence = ProgressPayloadV4["data"];

export type ProgressLoadStatus =
  | "current"
  | "current-repaired"
  | "empty"
  | "invalid-structure"
  | "malformed-json"
  | "migrated-legacy"
  | "migrated-v1"
  | "migrated-v2"
  | "migrated-v3"
  | "unavailable"
  | "unsupported-version";

export type ProgressLoadResult = {
  payload: ProgressPayload;
  status: ProgressLoadStatus;
  droppedAttempts: number;
  droppedEvents: number;
  droppedSnapshots: number;
};

export type QuestionOutcome =
  | "not_attempted"
  | "attempted_unresolved"
  | "completed_with_solution"
  | "correct_with_hint"
  | "independently_correct_after_error"
  | "independently_correct_first_attempt"
  | "legacy_completed"
  | "legacy_correct_unknown_support";

export type QuestionProgressState = {
  questionId: string;
  attempted: boolean;
  completed: boolean;
  latestResult: boolean | null;
  bestOutcome: QuestionOutcome;
  masteryContribution: number;
  reviewRecommended: boolean;
  genuineAttemptCount: number;
  incorrectAttemptCount: number;
  hintViewed: boolean;
  solutionViewed: boolean;
  correctWithoutSolution: boolean;
  navigationEligible: boolean;
  currentVersion: number;
  currentVersionAttempted: boolean;
  currentVersionCompleted: boolean;
  historicalAttempted: boolean;
  historicalCompleted: boolean;
  historicalBestOutcome: QuestionOutcome;
  historicalMasteryContribution: number;
  versionEvidenceStatus: "none" | "current" | "older" | "unknown_legacy" | "mixed";
  reassessment: "none" | "recommended" | "required";
};

export type ProgressStatus = "not_started" | "in_progress" | "completed" | "secure" | "mastered";

export type StageProgress = {
  stageId: string;
  attemptedQuestionIds: string[];
  correctQuestionIds: string[];
  completedQuestionIds: string[];
  reviewQuestionIds: string[];
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  completionPercentage: number;
  accuracyPercentage: number | null;
  firstAttemptAccuracyPercentage: number | null;
  latestAttemptAccuracyPercentage: number | null;
  masteryScore: number;
  independentPerformancePercentage: number;
  status: ProgressStatus;
  currentVersionCompletedQuestionIds: string[];
  historicalCompletedQuestionIds: string[];
  currentVersionCompletionPercentage: number;
  historicalCompletionPercentage: number;
  reassessmentRecommendedQuestionIds: string[];
  reassessmentRequiredQuestionIds: string[];
  newPracticeAvailable: boolean;
  historicalMasteryScore: number;
  currentVersionStatus: ProgressStatus;
  historicalStatus: ProgressStatus;
};

export type SkillPathProgress = {
  skillPathId: string;
  attemptedQuestionIds: string[];
  correctQuestionIds: string[];
  completedQuestionIds: string[];
  reviewQuestionIds: string[];
  totalQuestions: number;
  correctCount: number;
  attemptedCount: number;
  completionPercentage: number;
  accuracyPercentage: number | null;
  firstAttemptAccuracyPercentage: number | null;
  latestAttemptAccuracyPercentage: number | null;
  masteryScore: number;
  independentPerformancePercentage: number;
  status: ProgressStatus;
  stageProgress: Record<string, StageProgress>;
  currentVersionCompletedQuestionIds: string[];
  historicalCompletedQuestionIds: string[];
  currentVersionCompletionPercentage: number;
  historicalCompletionPercentage: number;
  reassessmentRecommendedQuestionIds: string[];
  reassessmentRequiredQuestionIds: string[];
  newPracticeAvailable: boolean;
  historicalMasteryScore: number;
  currentVersionStatus: ProgressStatus;
  historicalStatus: ProgressStatus;
};

export type DashboardProgressSummary = {
  attemptedCount: number;
  completedCount: number;
  correctCount: number;
  totalQuestions: number;
  completionPercentage: number;
  accuracyPercentage: number | null;
  firstAttemptAccuracyPercentage: number | null;
  masteryScore: number;
  status: ProgressStatus;
};

import { createMigrationEventId } from "@/lib/progress/event-identity";
import {
  CURRENT_PROGRESS_VERSION,
  type AchievementSnapshot,
  type GuidedSelfAssessmentEvent,
  type LegacyQuestionAttempt,
  type ProgressLoadResult,
  type ProgressPayload,
  type ProgressPayloadV5,
  type ProgressPayloadV6,
  type QuestionAttempt,
  type QuestionAttemptV2,
  type QuestionAttemptV3,
  type QuestionSupportEvent,
  type QuestionSupportEventV2,
  type QuestionSupportEventV3,
  type VersionEvidence,
  UNKNOWN_LEGACY_VERSION_EVIDENCE,
} from "@/lib/progress/types";
import { hasCompleteMarkerMetadata, isLegalPersistedMarkerMetadata } from "@/lib/marking/types";
import { isReviewEvent } from "@/lib/review/validation";
import { isFlashcardReviewEvent } from "@/lib/flashcards/validation";

export function createDefaultProgressPayload(): ProgressPayload {
  return {
    version: CURRENT_PROGRESS_VERSION,
    data: { attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] },
  };
}

const hasText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const hasOptionalSessionId = (value: { practiceSessionId?: unknown }) =>
  value.practiceSessionId === undefined || hasText(value.practiceSessionId);

export function isLegacyQuestionAttempt(value: unknown): value is LegacyQuestionAttempt {
  if (!value || typeof value !== "object") return false;
  const attempt = value as LegacyQuestionAttempt;
  return hasText(attempt.questionId) && hasText(attempt.skillPathId) && hasText(attempt.stageId) &&
    (typeof attempt.isCorrect === "boolean" || attempt.isCorrect === null) && typeof attempt.answer === "string" &&
    typeof attempt.attemptedAt === "string";
}

export function isVersionEvidence(value: unknown): value is VersionEvidence {
  if (!value || typeof value !== "object") return false;
  const evidence = value as { kind?: unknown; questionVersion?: unknown };
  return (evidence.kind === "known" && Number.isInteger(evidence.questionVersion) && (evidence.questionVersion as number) > 0) ||
    (evidence.kind === "unknown_legacy" && evidence.questionVersion === null);
}

export function isQuestionAttemptV2(value: unknown): value is QuestionAttemptV2 {
  if (!isLegacyQuestionAttempt(value)) return false;
  const attempt = value as QuestionAttemptV2;
  return Number.isInteger(attempt.sequence) && attempt.sequence >= 0 && typeof attempt.isGenuine === "boolean" &&
    typeof attempt.hintViewedBeforeSubmission === "boolean" &&
    (attempt.supportKnowledge === "known" || attempt.supportKnowledge === "unknown_legacy") &&
    (attempt.legacyCompleted === undefined || typeof attempt.legacyCompleted === "boolean");
}

const isQuestionAttemptV3 = (value: unknown): value is QuestionAttemptV3 =>
  isQuestionAttemptV2(value) && isVersionEvidence((value as QuestionAttemptV3).versionEvidence);
export const isQuestionAttempt = (value: unknown): value is QuestionAttempt =>
  isQuestionAttemptV3(value) &&
  hasText((value as QuestionAttempt).eventId) &&
  hasOptionalSessionId(value as QuestionAttempt) &&
  validMarkerFields(value as QuestionAttempt);

function validMarkerFields(attempt: QuestionAttempt) {
  if (!hasCompleteMarkerMetadata(attempt)) return true;
  if (!isLegalPersistedMarkerMetadata(attempt)) return false;
  if (attempt.outcomeKind === "graded") {
    return typeof attempt.isCorrect === "boolean" &&
      (attempt.isCorrect ? attempt.outcomeReason === undefined : attempt.outcomeReason !== undefined);
  }
  return attempt.isCorrect === null;
}

export function isQuestionSupportEventV2(value: unknown): value is QuestionSupportEventV2 {
  if (!value || typeof value !== "object") return false;
  const event = value as QuestionSupportEventV2;
  return hasText(event.questionId) && hasText(event.skillPathId) && hasText(event.stageId) &&
    (event.type === "hint_viewed" || event.type === "solution_viewed") && typeof event.occurredAt === "string" &&
    Number.isInteger(event.sequence) && event.sequence >= 0 && typeof event.afterGenuineAttempt === "boolean";
}

const isQuestionSupportEventV3 = (value: unknown): value is QuestionSupportEventV3 =>
  isQuestionSupportEventV2(value) && isVersionEvidence((value as QuestionSupportEventV3).versionEvidence);
export const isQuestionSupportEvent = (value: unknown): value is QuestionSupportEvent =>
  isQuestionSupportEventV3(value) &&
  hasText((value as QuestionSupportEvent).eventId) &&
  hasOptionalSessionId(value as QuestionSupportEvent);

export function isGuidedSelfAssessmentEvent(value: unknown): value is GuidedSelfAssessmentEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as GuidedSelfAssessmentEvent;
  return hasText(event.eventId) &&
    hasText(event.practiceSessionId) &&
    hasText(event.questionId) &&
    hasText(event.skillPathId) &&
    hasText(event.stageId) &&
    ["confident", "unsure", "needs_review"].includes(event.outcome) &&
    isIsoTimestamp(event.occurredAt) &&
    Number.isInteger(event.sequence) &&
    event.sequence >= 0 &&
    isVersionEvidence(event.versionEvidence);
}

const snapshotKinds = new Set([
  "stage_completed", "stage_secure", "stage_mastered", "path_completed", "path_secure", "path_mastered",
]);

export function isAchievementSnapshot(value: unknown): value is AchievementSnapshot {
  if (!value || typeof value !== "object") return false;
  const item = value as AchievementSnapshot;
  const isStage = typeof item.kind === "string" && item.kind.startsWith("stage_");
  return hasText(item.snapshotId) && snapshotKinds.has(item.kind) && hasText(item.subjectId) && hasText(item.courseId) &&
    hasText(item.pathId) && Number.isInteger(item.pathVersion) && item.pathVersion > 0 && isIsoTimestamp(item.achievedAt) &&
    Number.isFinite(item.masteryScore) && item.masteryScore >= 0 && item.masteryScore <= 100 &&
    Number.isFinite(item.independentPerformancePercentage) && item.independentPerformancePercentage >= 0 && item.independentPerformancePercentage <= 100 &&
    Number.isInteger(item.completionCount) && item.completionCount >= 0 && Number.isInteger(item.totalRequiredCount) &&
    item.totalRequiredCount >= 0 && item.completionCount <= item.totalRequiredCount &&
    (item.source === "derived_current" || item.source === "legacy_unknown") &&
    (isStage
      ? hasText(item.stageId) && Number.isInteger(item.stageVersion) && (item.stageVersion as number) > 0
      : item.stageId === undefined && item.stageVersion === undefined);
}

export function isCurrentProgressPayload(value: unknown): value is ProgressPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProgressPayload>;
  return candidate.version === CURRENT_PROGRESS_VERSION && Boolean(candidate.data) &&
    Array.isArray(candidate.data?.attempts) && candidate.data.attempts.every(isQuestionAttempt) &&
    Array.isArray(candidate.data?.supportEvents) && candidate.data.supportEvents.every(isQuestionSupportEvent) &&
    Array.isArray(candidate.data?.guidedSelfAssessments) && candidate.data.guidedSelfAssessments.every(isGuidedSelfAssessmentEvent) &&
    Array.isArray(candidate.data?.achievementSnapshots) && candidate.data.achievementSnapshots.every(isAchievementSnapshot) &&
    Array.isArray(candidate.data?.reviewEvents) && candidate.data.reviewEvents.every((event) => isReviewEvent(event)) &&
    Array.isArray(candidate.data?.flashcardReviews) && candidate.data.flashcardReviews.every((event) => isFlashcardReviewEvent(event));
}

export function migrateProgressPayload(value: unknown): ProgressLoadResult {
  if (Array.isArray(value)) return migrateLegacyAttempts(value, "migrated-legacy");
  if (!value || typeof value !== "object") return fallback("invalid-structure");
  const candidate = value as {
    version?: unknown;
    data?: {
      attempts?: unknown;
      supportEvents?: unknown;
      guidedSelfAssessments?: unknown;
      achievementSnapshots?: unknown;
      reviewEvents?: unknown;
      flashcardReviews?: unknown;
    };
  };
  if (candidate.version === 1) {
    if (!candidate.data || !Array.isArray(candidate.data.attempts)) return fallback("invalid-structure");
    return migrateLegacyAttempts(candidate.data.attempts, "migrated-v1");
  }
  if (candidate.version === 2 || candidate.version === 3) return migrateV2OrV3(candidate, candidate.version);
  if (candidate.version === 4) return migrateV4(candidate);
  if (candidate.version === 5) return migrateV5(candidate as { data?: ProgressPayloadV5["data"] });
  if (candidate.version === 6) return migrateV6(candidate as { data?: ProgressPayloadV6["data"] });
  if (candidate.version !== CURRENT_PROGRESS_VERSION) return fallback("unsupported-version");
  if (!candidate.data || !Array.isArray(candidate.data.attempts) || !Array.isArray(candidate.data.supportEvents) ||
      !Array.isArray(candidate.data.guidedSelfAssessments) || !Array.isArray(candidate.data.achievementSnapshots) ||
      !Array.isArray(candidate.data.reviewEvents) || !Array.isArray(candidate.data.flashcardReviews)) {
    return fallback("invalid-structure");
  }
  const attempts = candidate.data.attempts.filter(isQuestionAttempt);
  const supportEvents = candidate.data.supportEvents.filter(isQuestionSupportEvent);
  const guidedSelfAssessments = candidate.data.guidedSelfAssessments.filter(isGuidedSelfAssessmentEvent);
  const achievementSnapshots = candidate.data.achievementSnapshots.filter(isAchievementSnapshot);
  const reviewEvents = candidate.data.reviewEvents.filter((event): event is ProgressPayload["data"]["reviewEvents"][number] =>
    isReviewEvent(event));
  const flashcardReviews = candidate.data.flashcardReviews.filter((event): event is ProgressPayload["data"]["flashcardReviews"][number] =>
    isFlashcardReviewEvent(event));
  const counts = {
    droppedAttempts: candidate.data.attempts.length - attempts.length,
    droppedEvents: candidate.data.supportEvents.length - supportEvents.length,
    droppedSelfAssessments: candidate.data.guidedSelfAssessments.length - guidedSelfAssessments.length,
    droppedSnapshots: candidate.data.achievementSnapshots.length - achievementSnapshots.length,
    droppedReviewEvents: candidate.data.reviewEvents.length - reviewEvents.length,
    droppedFlashcardReviews: candidate.data.flashcardReviews.length - flashcardReviews.length,
  };
  return {
    payload: {
      version: CURRENT_PROGRESS_VERSION,
      data: { attempts, supportEvents, guidedSelfAssessments, achievementSnapshots, reviewEvents, flashcardReviews },
    },
    status: Object.values(counts).some(Boolean) ? "current-repaired" : "current",
    ...counts,
  };
}

function migrateV6(candidate: { data?: ProgressPayloadV6["data"] }): ProgressLoadResult {
  if (!candidate.data || !Array.isArray(candidate.data.attempts) || !Array.isArray(candidate.data.supportEvents) ||
      !Array.isArray(candidate.data.guidedSelfAssessments) || !Array.isArray(candidate.data.achievementSnapshots) ||
      !Array.isArray(candidate.data.reviewEvents)) return fallback("invalid-structure");
  const attempts = candidate.data.attempts.filter(isQuestionAttempt);
  const supportEvents = candidate.data.supportEvents.filter(isQuestionSupportEvent);
  const guidedSelfAssessments = candidate.data.guidedSelfAssessments.filter(isGuidedSelfAssessmentEvent);
  const achievementSnapshots = candidate.data.achievementSnapshots.filter(isAchievementSnapshot);
  const reviewEvents = candidate.data.reviewEvents.filter((event) => isReviewEvent(event));
  return {
    payload: { version: CURRENT_PROGRESS_VERSION, data: { attempts, supportEvents, guidedSelfAssessments, achievementSnapshots, reviewEvents, flashcardReviews: [] } },
    status: "migrated-v6",
    droppedAttempts: candidate.data.attempts.length - attempts.length,
    droppedEvents: candidate.data.supportEvents.length - supportEvents.length,
    droppedSelfAssessments: candidate.data.guidedSelfAssessments.length - guidedSelfAssessments.length,
    droppedSnapshots: candidate.data.achievementSnapshots.length - achievementSnapshots.length,
    droppedReviewEvents: candidate.data.reviewEvents.length - reviewEvents.length,
    droppedFlashcardReviews: 0,
  };
}

function migrateV5(candidate: { data?: ProgressPayloadV5["data"] }): ProgressLoadResult {
  if (!candidate.data || !Array.isArray(candidate.data.attempts) || !Array.isArray(candidate.data.supportEvents) ||
      !Array.isArray(candidate.data.guidedSelfAssessments) || !Array.isArray(candidate.data.achievementSnapshots)) {
    return fallback("invalid-structure");
  }
  const attempts = candidate.data.attempts.filter(isQuestionAttempt);
  const supportEvents = candidate.data.supportEvents.filter(isQuestionSupportEvent);
  const guidedSelfAssessments = candidate.data.guidedSelfAssessments.filter(isGuidedSelfAssessmentEvent);
  const achievementSnapshots = candidate.data.achievementSnapshots.filter(isAchievementSnapshot);
  return {
    payload: {
      version: CURRENT_PROGRESS_VERSION,
      data: { attempts, supportEvents, guidedSelfAssessments, achievementSnapshots, reviewEvents: [], flashcardReviews: [] },
    },
    status: "migrated-v5",
    droppedAttempts: candidate.data.attempts.length - attempts.length,
    droppedEvents: candidate.data.supportEvents.length - supportEvents.length,
    droppedSelfAssessments: candidate.data.guidedSelfAssessments.length - guidedSelfAssessments.length,
    droppedSnapshots: candidate.data.achievementSnapshots.length - achievementSnapshots.length,
    droppedReviewEvents: 0,
    droppedFlashcardReviews: 0,
  };
}

function migrateV4(candidate: {
  data?: { attempts?: unknown; supportEvents?: unknown; achievementSnapshots?: unknown };
}): ProgressLoadResult {
  if (!candidate.data || !Array.isArray(candidate.data.attempts) || !Array.isArray(candidate.data.supportEvents) ||
      !Array.isArray(candidate.data.achievementSnapshots)) return fallback("invalid-structure");
  const attempts = candidate.data.attempts.filter(isQuestionAttempt);
  const supportEvents = candidate.data.supportEvents.filter(isQuestionSupportEvent);
  const achievementSnapshots = candidate.data.achievementSnapshots.filter(isAchievementSnapshot);
  return {
    payload: {
      version: CURRENT_PROGRESS_VERSION,
      data: { attempts, supportEvents, guidedSelfAssessments: [], achievementSnapshots, reviewEvents: [], flashcardReviews: [] },
    },
    status: "migrated-v4",
    droppedAttempts: candidate.data.attempts.length - attempts.length,
    droppedEvents: candidate.data.supportEvents.length - supportEvents.length,
    droppedSelfAssessments: 0,
    droppedSnapshots: candidate.data.achievementSnapshots.length - achievementSnapshots.length,
    droppedReviewEvents: 0,
    droppedFlashcardReviews: 0,
  };
}

function migrateV2OrV3(
  candidate: { data?: { attempts?: unknown; supportEvents?: unknown } },
  version: 2 | 3,
): ProgressLoadResult {
  if (!candidate.data || !Array.isArray(candidate.data.attempts) || !Array.isArray(candidate.data.supportEvents)) {
    return fallback("invalid-structure");
  }
  const attemptGuard = version === 3 ? isQuestionAttemptV3 : isQuestionAttemptV2;
  const eventGuard = version === 3 ? isQuestionSupportEventV3 : isQuestionSupportEventV2;
  const attempts = candidate.data.attempts.flatMap((value, index) => attemptGuard(value) ? [{
    ...value,
    ...(version === 2 ? { versionEvidence: { ...UNKNOWN_LEGACY_VERSION_EVIDENCE } } : {}),
    eventId: createMigrationEventId("attempt", index, value),
  } as QuestionAttempt] : []);
  const supportEvents = candidate.data.supportEvents.flatMap((value, index) => eventGuard(value) ? [{
    ...value,
    ...(version === 2 ? { versionEvidence: { ...UNKNOWN_LEGACY_VERSION_EVIDENCE } } : {}),
    eventId: createMigrationEventId("support", index, value),
  } as QuestionSupportEvent] : []);
  return {
    payload: {
      version: CURRENT_PROGRESS_VERSION,
      data: { attempts, supportEvents, guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] },
    },
    status: version === 2 ? "migrated-v2" : "migrated-v3",
    droppedAttempts: candidate.data.attempts.length - attempts.length,
    droppedEvents: candidate.data.supportEvents.length - supportEvents.length,
    droppedSelfAssessments: 0,
    droppedSnapshots: 0,
    droppedReviewEvents: 0,
    droppedFlashcardReviews: 0,
  };
}

function migrateLegacyAttempts(
  values: unknown[],
  status: "migrated-legacy" | "migrated-v1",
): ProgressLoadResult {
  const attempts = values.flatMap((value, index) => isLegacyQuestionAttempt(value) ? [{
    ...value,
    sequence: index + 1,
    isGenuine: value.answer.trim().length > 0,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "unknown_legacy" as const,
    versionEvidence: { ...UNKNOWN_LEGACY_VERSION_EVIDENCE },
    legacyCompleted: true,
    eventId: createMigrationEventId("attempt", index, value),
  }] : []);
  return {
    payload: {
      version: CURRENT_PROGRESS_VERSION,
      data: { attempts, supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] },
    },
    status,
    droppedAttempts: values.length - attempts.length,
    droppedEvents: 0,
    droppedSelfAssessments: 0,
    droppedSnapshots: 0,
    droppedReviewEvents: 0,
    droppedFlashcardReviews: 0,
  };
}

function fallback(status: ProgressLoadResult["status"]): ProgressLoadResult {
  return {
    payload: createDefaultProgressPayload(),
    status,
    droppedAttempts: 0,
    droppedEvents: 0,
    droppedSelfAssessments: 0,
    droppedSnapshots: 0,
    droppedReviewEvents: 0,
    droppedFlashcardReviews: 0,
  };
}

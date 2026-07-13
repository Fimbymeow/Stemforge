import { createMigrationEventId } from "@/lib/progress/event-identity";
import {
  CURRENT_PROGRESS_VERSION,
  type AchievementSnapshot,
  type LegacyQuestionAttempt,
  type ProgressLoadResult,
  type ProgressPayload,
  type QuestionAttempt,
  type QuestionAttemptV2,
  type QuestionAttemptV3,
  type QuestionSupportEvent,
  type QuestionSupportEventV2,
  type QuestionSupportEventV3,
  type VersionEvidence,
  UNKNOWN_LEGACY_VERSION_EVIDENCE,
} from "@/lib/progress/types";

export function createDefaultProgressPayload(): ProgressPayload {
  return { version: CURRENT_PROGRESS_VERSION, data: { attempts: [], supportEvents: [], achievementSnapshots: [] } };
}

const hasText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

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
  isQuestionAttemptV3(value) && hasText((value as QuestionAttempt).eventId);

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
  isQuestionSupportEventV3(value) && hasText((value as QuestionSupportEvent).eventId);

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
    Array.isArray(candidate.data?.achievementSnapshots) && candidate.data.achievementSnapshots.every(isAchievementSnapshot);
}

export function migrateProgressPayload(value: unknown): ProgressLoadResult {
  if (Array.isArray(value)) return migrateLegacyAttempts(value, "migrated-legacy");
  if (!value || typeof value !== "object") return fallback("invalid-structure");
  const candidate = value as { version?: unknown; data?: { attempts?: unknown; supportEvents?: unknown; achievementSnapshots?: unknown } };
  if (candidate.version === 1) {
    if (!candidate.data || !Array.isArray(candidate.data.attempts)) return fallback("invalid-structure");
    return migrateLegacyAttempts(candidate.data.attempts, "migrated-v1");
  }
  if (candidate.version === 2 || candidate.version === 3) return migrateV2OrV3(candidate, candidate.version);
  if (candidate.version !== CURRENT_PROGRESS_VERSION) return fallback("unsupported-version");
  if (!candidate.data || !Array.isArray(candidate.data.attempts) || !Array.isArray(candidate.data.supportEvents) ||
      !Array.isArray(candidate.data.achievementSnapshots)) return fallback("invalid-structure");
  const attempts = candidate.data.attempts.filter(isQuestionAttempt);
  const supportEvents = candidate.data.supportEvents.filter(isQuestionSupportEvent);
  const achievementSnapshots = candidate.data.achievementSnapshots.filter(isAchievementSnapshot);
  const counts = {
    droppedAttempts: candidate.data.attempts.length - attempts.length,
    droppedEvents: candidate.data.supportEvents.length - supportEvents.length,
    droppedSnapshots: candidate.data.achievementSnapshots.length - achievementSnapshots.length,
  };
  return { payload: { version: 4, data: { attempts, supportEvents, achievementSnapshots } },
    status: Object.values(counts).some(Boolean) ? "current-repaired" : "current", ...counts };
}

function migrateV2OrV3(candidate: { data?: { attempts?: unknown; supportEvents?: unknown } }, version: 2 | 3): ProgressLoadResult {
  if (!candidate.data || !Array.isArray(candidate.data.attempts) || !Array.isArray(candidate.data.supportEvents)) return fallback("invalid-structure");
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
  return { payload: { version: 4, data: { attempts, supportEvents, achievementSnapshots: [] } },
    status: version === 2 ? "migrated-v2" : "migrated-v3",
    droppedAttempts: candidate.data.attempts.length - attempts.length,
    droppedEvents: candidate.data.supportEvents.length - supportEvents.length, droppedSnapshots: 0 };
}

function migrateLegacyAttempts(values: unknown[], status: "migrated-legacy" | "migrated-v1"): ProgressLoadResult {
  const attempts = values.flatMap((value, index) => isLegacyQuestionAttempt(value) ? [{
    ...value, sequence: index + 1, isGenuine: value.answer.trim().length > 0, hintViewedBeforeSubmission: false,
    supportKnowledge: "unknown_legacy" as const, versionEvidence: { ...UNKNOWN_LEGACY_VERSION_EVIDENCE }, legacyCompleted: true,
    eventId: createMigrationEventId("attempt", index, value),
  }] : []);
  return { payload: { version: 4, data: { attempts, supportEvents: [], achievementSnapshots: [] } }, status,
    droppedAttempts: values.length - attempts.length, droppedEvents: 0, droppedSnapshots: 0 };
}

function fallback(status: ProgressLoadResult["status"]): ProgressLoadResult {
  return { payload: createDefaultProgressPayload(), status, droppedAttempts: 0, droppedEvents: 0, droppedSnapshots: 0 };
}

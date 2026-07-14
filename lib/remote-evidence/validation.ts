import {
  isAchievementSnapshot,
  isQuestionAttempt,
  isQuestionSupportEvent,
} from "@/lib/progress/payload";
import type {
  AchievementSnapshot,
  ProgressPayload,
  QuestionAttempt,
  QuestionSupportEvent,
} from "@/lib/progress/types";
import type { RejectedRemoteEvidence, RemoteEvidenceKind } from "@/lib/remote-evidence/types";

export const MAX_REMOTE_EVIDENCE_BATCH_ITEMS = 500;
export const MAX_REMOTE_EVIDENCE_BATCH_BYTES = 1_000_000;
const MAX_IDENTIFIER_LENGTH = 200;
const MAX_ANSWER_LENGTH = 20_000;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;

export type ValidatedRemoteEvidenceBatch = {
  payload: ProgressPayload;
  rejected: RejectedRemoteEvidence[];
  fatal: boolean;
};

export function validateOwnerId(ownerId: unknown): ownerId is string {
  return typeof ownerId === "string" && SAFE_ID.test(ownerId) && ownerId.length <= MAX_IDENTIFIER_LENGTH;
}

export function validateRemoteEvidenceBatch(value: unknown): ValidatedRemoteEvidenceBatch {
  const empty = (): ProgressPayload => ({ version: 4, data: { attempts: [], supportEvents: [], achievementSnapshots: [] } });
  if (!value || typeof value !== "object") return fatal(empty(), "A canonical V4 evidence payload is required.");
  const candidate = value as { version?: unknown; data?: unknown };
  if (!hasExactKeys(candidate, ["version", "data"])) return fatal(empty(), "Only canonical V4 payload fields are accepted.");
  if (candidate.version !== 4) return fatal(empty(), "Only canonical V4 evidence payloads are accepted.");
  if (!candidate.data || typeof candidate.data !== "object") return fatal(empty(), "The V4 data object is required.");
  const data = candidate.data as { attempts?: unknown; supportEvents?: unknown; achievementSnapshots?: unknown };
  if (!hasExactKeys(data, ["attempts", "supportEvents", "achievementSnapshots"])) return fatal(empty(), "Only canonical V4 data fields are accepted.");
  if (!Array.isArray(data.attempts) || !Array.isArray(data.supportEvents) || !Array.isArray(data.achievementSnapshots)) {
    return fatal(empty(), "V4 attempts, supportEvents and achievementSnapshots arrays are required.");
  }
  const total = data.attempts.length + data.supportEvents.length + data.achievementSnapshots.length;
  if (total > MAX_REMOTE_EVIDENCE_BATCH_ITEMS) return fatal(empty(), `Evidence batches may contain at most ${MAX_REMOTE_EVIDENCE_BATCH_ITEMS} records.`);
  let bytes: number;
  try { bytes = new TextEncoder().encode(JSON.stringify(value)).length; } catch { return fatal(empty(), "Evidence payload must be JSON serializable."); }
  if (bytes > MAX_REMOTE_EVIDENCE_BATCH_BYTES) return fatal(empty(), `Evidence batches may contain at most ${MAX_REMOTE_EVIDENCE_BATCH_BYTES} UTF-8 bytes.`);

  const rejected: RejectedRemoteEvidence[] = [];
  const attempts = data.attempts.filter((item): item is QuestionAttempt => validateItem(item, "attempt", rejected));
  const supportEvents = data.supportEvents.filter((item): item is QuestionSupportEvent => validateItem(item, "support_event", rejected));
  const achievementSnapshots = data.achievementSnapshots.filter((item): item is AchievementSnapshot => validateItem(item, "achievement_snapshot", rejected));
  return { payload: { version: 4, data: { attempts, supportEvents, achievementSnapshots } }, rejected, fatal: false };
}

function validateItem(value: unknown, kind: RemoteEvidenceKind, rejected: RejectedRemoteEvidence[]) {
  const eventId = extractEventId(value, kind);
  let reason: string | null = null;
  if (kind === "attempt") {
    reason = !isQuestionAttempt(value) || !hasExactKeys(value, attemptKeys, attemptOptionalKeys)
      ? "Invalid canonical question attempt."
      : !validCommonAttemptFields(value)
        ? "Question attempt contains an unsafe ID, timestamp or answer."
        : null;
  } else if (kind === "support_event") {
    reason = !isQuestionSupportEvent(value) || !hasExactKeys(value, supportKeys)
      ? "Invalid canonical support event."
      : !validCommonSupportFields(value)
        ? "Support event contains an unsafe ID or timestamp."
        : null;
  } else {
    reason = !isAchievementSnapshot(value) || !hasExactKeys(value, snapshotKeys, snapshotOptionalKeys)
      ? "Invalid canonical achievement snapshot."
      : !validSnapshotFields(value)
        ? "Achievement snapshot contains an unsafe ID."
        : null;
  }
  if (!reason) return true;
  rejected.push({ kind, eventId, reason });
  return false;
}

function validCommonAttemptFields(value: QuestionAttempt) {
  return validEvidenceId(value.eventId) && validLogicalIds(value.questionId, value.skillPathId, value.stageId) &&
    isIsoTimestamp(value.attemptedAt) && value.answer.length <= MAX_ANSWER_LENGTH;
}

function validCommonSupportFields(value: QuestionSupportEvent) {
  return validEvidenceId(value.eventId) && validLogicalIds(value.questionId, value.skillPathId, value.stageId) && isIsoTimestamp(value.occurredAt);
}

function validSnapshotFields(value: AchievementSnapshot) {
  return validEvidenceId(value.snapshotId) && validLogicalIds(value.subjectId, value.courseId, value.pathId) &&
    (value.stageId === undefined || safeLogicalId(value.stageId));
}

function validEvidenceId(value: string) { return SAFE_ID.test(value); }
function safeLogicalId(value: string) { return value.trim().length > 0 && value.length <= MAX_IDENTIFIER_LENGTH; }
function validLogicalIds(...values: string[]) { return values.every(safeLogicalId); }
function isIsoTimestamp(value: string) { return Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value; }

function extractEventId(value: unknown, kind: RemoteEvidenceKind) {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const id = kind === "achievement_snapshot" ? record.snapshotId : record.eventId;
  return typeof id === "string" ? id : undefined;
}

function hasExactKeys(value: object, required: readonly string[], optional: readonly string[] = []) {
  const keys = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.prototype.hasOwnProperty.call(value, key)) && keys.every((key) => allowed.has(key));
}

function fatal(payload: ProgressPayload, reason: string): ValidatedRemoteEvidenceBatch {
  return { payload, rejected: [{ reason }], fatal: true };
}

const attemptKeys = [
  "questionId", "skillPathId", "stageId", "isCorrect", "answer", "attemptedAt", "sequence", "isGenuine",
  "hintViewedBeforeSubmission", "supportKnowledge", "versionEvidence", "eventId",
] as const;
const attemptOptionalKeys = ["legacyCompleted"] as const;
const supportKeys = [
  "questionId", "skillPathId", "stageId", "type", "occurredAt", "sequence", "afterGenuineAttempt", "versionEvidence", "eventId",
] as const;
const snapshotKeys = [
  "snapshotId", "kind", "subjectId", "courseId", "pathId", "pathVersion", "achievedAt", "masteryScore",
  "independentPerformancePercentage", "completionCount", "totalRequiredCount", "source",
] as const;
const snapshotOptionalKeys = ["stageId", "stageVersion"] as const;

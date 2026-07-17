import {
  isAchievementSnapshot,
  isQuestionAttempt,
  isQuestionSupportEvent,
} from "@/lib/progress/payload";
import type { AchievementSnapshot, ProgressPayload, QuestionAttempt, QuestionSupportEvent } from "@/lib/progress/types";
import type { ProgressImportResponse } from "@/lib/progress/import-protocol";
import type { RemoteEvidenceKind } from "@/lib/remote-evidence/types";

export const PROGRESS_SYNC_PROTOCOL_VERSION = 1 as const;
export const PROGRESS_SYNC_METADATA_KEY = "stemforge.progressSync.v1";
export const MAX_PROGRESS_SYNC_PULL_ITEMS = 200;
export const MAX_PROGRESS_SYNC_PULL_BYTES = 512_000;

export type ProgressSyncContextResponse = {
  protocolVersion: typeof PROGRESS_SYNC_PROTOCOL_VERSION;
} & (
  | { authenticated: true; accountFingerprint: string; accountGeneration: string; accountDataStatus: "active" | "erasure_pending" | "processing" | "closed" }
  | { authenticated: false }
);

export type ProgressSyncErrorResponse = {
  protocolVersion: typeof PROGRESS_SYNC_PROTOCOL_VERSION;
  error: "invalid_request" | "sign_in_required" | "forbidden" | "too_large" | "temporarily_unavailable" |
    "generation_required" | "account_generation_mismatch" | "erasure_in_progress" | "account_closed";
  message: string;
};

export type ProgressSyncPushEnvelope = {
  protocolVersion: typeof PROGRESS_SYNC_PROTOCOL_VERSION;
  expectedGeneration: string;
  evidence: ProgressPayload;
};

export type ProgressSyncPushResponse = ProgressImportResponse;

export type ProgressSyncEvidence = QuestionAttempt | QuestionSupportEvent | AchievementSnapshot;

export type ProgressSyncPulledEvent = {
  kind: RemoteEvidenceKind;
  eventId: string;
  disposition: "accepted" | "conflict_retained";
  receiveCursor: string;
  receivedAt: string;
  evidence: ProgressSyncEvidence;
};

export type ProgressSyncPullResponse = {
  protocolVersion: typeof PROGRESS_SYNC_PROTOCOL_VERSION;
  accountFingerprint: string;
  accountGeneration: string;
  events: ProgressSyncPulledEvent[];
  skipped: Array<{ kind?: RemoteEvidenceKind; eventId?: string; reasonCode: string }>;
  nextCursor: string | null;
  hasMore: boolean;
  caughtUpAt: string;
};

export function encodeProgressSyncCursor(accountFingerprint: string, accountGeneration: string, receiveCursor: string) {
  if (!isAccountFingerprint(accountFingerprint) || !isGeneration(accountGeneration) || !isReceiveCursor(receiveCursor)) {
    throw new Error("A valid account fingerprint, generation and receive cursor are required.");
  }
  return `v2.${accountFingerprint}.${accountGeneration}.${receiveCursor}`;
}

export function decodeProgressSyncCursor(value: string | null | undefined, expectedFingerprint: string, expectedGeneration: string) {
  if (value === null || value === undefined || value === "") return { ok: true as const, receiveCursor: undefined };
  const match = /^v2\.([A-Za-z0-9_-]{43})\.(\d+)\.(\d+)$/.exec(value);
  if (!match || match[1] !== expectedFingerprint || match[2] !== expectedGeneration) return { ok: false as const };
  return { ok: true as const, receiveCursor: match[3] };
}

export function isProgressSyncContextResponse(value: unknown): value is ProgressSyncContextResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProgressSyncContextResponse>;
  return candidate.protocolVersion === PROGRESS_SYNC_PROTOCOL_VERSION &&
    (candidate.authenticated === false || (candidate.authenticated === true && isAccountFingerprint(candidate.accountFingerprint) &&
      isGeneration(candidate.accountGeneration) && ["active", "erasure_pending", "processing", "closed"].includes(candidate.accountDataStatus ?? "")));
}

export function isProgressSyncPullResponse(value: unknown): value is ProgressSyncPullResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProgressSyncPullResponse>;
  return candidate.protocolVersion === PROGRESS_SYNC_PROTOCOL_VERSION &&
    isAccountFingerprint(candidate.accountFingerprint) &&
    isGeneration(candidate.accountGeneration) &&
    (candidate.nextCursor === null || typeof candidate.nextCursor === "string") &&
    typeof candidate.hasMore === "boolean" && isIsoTimestamp(candidate.caughtUpAt) &&
    Array.isArray(candidate.events) && candidate.events.every(isPulledEvent) &&
    Array.isArray(candidate.skipped) && candidate.skipped.every(isSkippedEvent);
}

export function progressSyncEventsToPayload(events: readonly ProgressSyncPulledEvent[]): ProgressPayload {
  const payload: ProgressPayload = { version: 4, data: { attempts: [], supportEvents: [], achievementSnapshots: [] } };
  for (const event of events) {
    if (event.kind === "attempt") payload.data.attempts.push(event.evidence as QuestionAttempt);
    else if (event.kind === "support_event") payload.data.supportEvents.push(event.evidence as QuestionSupportEvent);
    else payload.data.achievementSnapshots.push(event.evidence as AchievementSnapshot);
  }
  return payload;
}

export function evidenceReference(kind: RemoteEvidenceKind, eventId: string) {
  return `${kind}:${eventId}`;
}

export function isAccountFingerprint(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function isGeneration(value: unknown): value is string {
  return typeof value === "string" && /^[1-9]\d*$/.test(value);
}

function isPulledEvent(value: unknown): value is ProgressSyncPulledEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as ProgressSyncPulledEvent;
  if (!isKind(event.kind) || typeof event.eventId !== "string" || !isReceiveCursor(event.receiveCursor) ||
      !isIsoTimestamp(event.receivedAt) || !["accepted", "conflict_retained"].includes(event.disposition)) return false;
  if (event.kind === "attempt") return isQuestionAttempt(event.evidence) && event.evidence.eventId === event.eventId;
  if (event.kind === "support_event") return isQuestionSupportEvent(event.evidence) && event.evidence.eventId === event.eventId;
  return isAchievementSnapshot(event.evidence) && event.evidence.snapshotId === event.eventId;
}

function isSkippedEvent(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const item = value as { kind?: unknown; eventId?: unknown; reasonCode?: unknown };
  return (item.kind === undefined || isKind(item.kind)) &&
    (item.eventId === undefined || typeof item.eventId === "string") &&
    typeof item.reasonCode === "string" && item.reasonCode.length > 0;
}

function isKind(value: unknown): value is RemoteEvidenceKind {
  return value === "attempt" || value === "support_event" || value === "achievement_snapshot";
}

function isReceiveCursor(value: unknown): value is string {
  return typeof value === "string" && /^\d+$/.test(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

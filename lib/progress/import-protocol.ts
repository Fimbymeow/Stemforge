import type { ProgressPayload } from "@/lib/progress/types";
import type { RemoteEvidenceKind } from "@/lib/remote-evidence/types";

export const PROGRESS_IMPORT_PROTOCOL_VERSION = 1 as const;
export const MAX_PROGRESS_IMPORT_REQUEST_BYTES = 1_050_000;

export type ProgressImportEnvelope = {
  protocolVersion: typeof PROGRESS_IMPORT_PROTOCOL_VERSION;
  expectedGeneration?: string;
  evidence: ProgressPayload;
};

export type ImportAcknowledgementDisposition = "accepted" | "already_present" | "conflict_retained";

export type ImportAcknowledgedEvent = {
  kind: RemoteEvidenceKind;
  eventId: string;
  receiveCursor: string;
  receivedAt: string;
};

export type ImportRejectedEvent = {
  kind?: RemoteEvidenceKind;
  eventId?: string;
  reason: string;
};

export type ImportNotProcessedEvent = {
  kind?: RemoteEvidenceKind;
  eventId?: string;
  reason: string;
};

export type ProgressImportResponse = {
  protocolVersion: typeof PROGRESS_IMPORT_PROTOCOL_VERSION;
  accountFingerprint: string;
  accountGeneration?: string;
  committedAt: string;
  batchStatus: "committed" | "partly_committed" | "rejected";
  accepted: ImportAcknowledgedEvent[];
  alreadyPresent: ImportAcknowledgedEvent[];
  conflictRetained: ImportAcknowledgedEvent[];
  rejected: ImportRejectedEvent[];
  notProcessed: ImportNotProcessedEvent[];
};

export type ProgressImportErrorResponse = {
  protocolVersion: typeof PROGRESS_IMPORT_PROTOCOL_VERSION;
  error: "invalid_request" | "sign_in_required" | "forbidden" | "too_large" | "temporarily_unavailable" | "unexpected_error" |
    "generation_required" | "account_generation_mismatch" | "erasure_in_progress" | "account_closed";
  message: string;
};

export function parseProgressImportEnvelope(value: unknown):
  | { ok: true; envelope: ProgressImportEnvelope }
  | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, message: "A versioned progress import request is required." };
  }
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate);
  if (!keys.includes("protocolVersion") || !keys.includes("evidence") || keys.some((key) => !["protocolVersion", "expectedGeneration", "evidence"].includes(key))) {
    return { ok: false, message: "Only protocolVersion, expectedGeneration and evidence are accepted." };
  }
  if (candidate.protocolVersion !== PROGRESS_IMPORT_PROTOCOL_VERSION) {
    return { ok: false, message: "Unsupported progress import protocol version." };
  }
  return {
    ok: true,
    envelope: {
      protocolVersion: PROGRESS_IMPORT_PROTOCOL_VERSION,
      expectedGeneration: typeof candidate.expectedGeneration === "string" && /^\d+$/.test(candidate.expectedGeneration)
        ? candidate.expectedGeneration
        : undefined,
      evidence: candidate.evidence as ProgressPayload,
    },
  };
}

export function isProgressImportResponse(value: unknown): value is ProgressImportResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<ProgressImportResponse>;
  if (candidate.protocolVersion !== PROGRESS_IMPORT_PROTOCOL_VERSION || typeof candidate.accountFingerprint !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(candidate.accountFingerprint) ||
      !isIsoTimestamp(candidate.committedAt) || !["committed", "partly_committed", "rejected"].includes(candidate.batchStatus ?? "")) return false;
  return isAcknowledgementList(candidate.accepted) && isAcknowledgementList(candidate.alreadyPresent) &&
    isAcknowledgementList(candidate.conflictRetained) && isFailureList(candidate.rejected) && isFailureList(candidate.notProcessed);
}

function isFailureList(value: unknown): value is Array<{ kind?: RemoteEvidenceKind; eventId?: string; reason: string }> {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as { kind?: unknown; eventId?: unknown; reason?: unknown };
    return (record.kind === undefined || isKind(record.kind)) &&
      (record.eventId === undefined || typeof record.eventId === "string") &&
      typeof record.reason === "string" && record.reason.length > 0;
  });
}

function isAcknowledgementList(value: unknown): value is ImportAcknowledgedEvent[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as ImportAcknowledgedEvent;
    return isKind(record.kind) && typeof record.eventId === "string" && /^\d+$/.test(record.receiveCursor) && isIsoTimestamp(record.receivedAt);
  });
}

function isKind(value: unknown): value is RemoteEvidenceKind {
  return value === "attempt" || value === "support_event" || value === "achievement_snapshot";
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

import type { ProgressImportResponse } from "@/lib/progress/import-protocol";
import { readProgressImportMetadata } from "@/lib/progress/import-metadata";
import type { ProgressPayload } from "@/lib/progress/types";
import { stableStringify } from "@/lib/progress/event-identity";
import {
  PROGRESS_SYNC_METADATA_KEY,
  evidenceReference,
  isAccountFingerprint,
  type ProgressSyncPullResponse,
} from "@/lib/progress/sync-protocol";

export { PROGRESS_SYNC_METADATA_KEY };

export type ProgressSyncAcknowledgement = {
  disposition: "accepted" | "already_present" | "conflict_retained";
  receiveCursor: string;
  acknowledgedAt: string;
};

export type ProgressSyncAccountState = {
  syncEnabled: boolean;
  associationConfirmed: boolean;
  acknowledged: Record<string, ProgressSyncAcknowledgement>;
  lastPulledCursor: string | null;
  lastSuccessfulPushAt: string | null;
  lastSuccessfulPullAt: string | null;
  lastFullyCaughtUpAt: string | null;
  permanentlyRejected: Record<string, { reasonCode: string; recordDigest: string; rejectedAt: string }>;
  retry: { consecutiveFailures: number; nextRetryAt: string | null; lastFailureKind: string | null };
};

export type ProgressSyncMetadata = {
  version: 1;
  lastAssociatedAccountFingerprint: string | null;
  accounts: Record<string, ProgressSyncAccountState>;
};

export type ProgressSyncStatus =
  | "checking"
  | "saved_locally"
  | "pending_upload"
  | "syncing"
  | "caught_up"
  | "offline"
  | "temporary_error"
  | "authentication_required"
  | "association_required"
  | "paused";

export function createDefaultProgressSyncMetadata(): ProgressSyncMetadata {
  return { version: 1, lastAssociatedAccountFingerprint: null, accounts: {} };
}

export function createDefaultProgressSyncAccount(): ProgressSyncAccountState {
  return {
    syncEnabled: false,
    associationConfirmed: false,
    acknowledged: {},
    lastPulledCursor: null,
    lastSuccessfulPushAt: null,
    lastSuccessfulPullAt: null,
    lastFullyCaughtUpAt: null,
    permanentlyRejected: {},
    retry: { consecutiveFailures: 0, nextRetryAt: null, lastFailureKind: null },
  };
}

export function readProgressSyncMetadata(raw: string | null, importRaw: string | null = null): ProgressSyncMetadata {
  const metadata = parseMetadata(raw);
  const imported = readProgressImportMetadata(importRaw);
  for (const [fingerprint, importAccount] of Object.entries(imported.accounts)) {
    const account = metadata.accounts[fingerprint] ?? createDefaultProgressSyncAccount();
    for (const [reference, acknowledgement] of Object.entries(importAccount.acknowledged)) {
      if (!account.acknowledged[reference]) account.acknowledged[reference] = { ...acknowledgement };
    }
    metadata.accounts[fingerprint] = account;
  }
  return metadata;
}

export function confirmProgressSyncAssociation(metadata: ProgressSyncMetadata, fingerprint: string) {
  const next = structuredClone(metadata);
  const account = next.accounts[fingerprint] ?? createDefaultProgressSyncAccount();
  account.syncEnabled = true;
  account.associationConfirmed = true;
  next.accounts[fingerprint] = account;
  next.lastAssociatedAccountFingerprint = fingerprint;
  return next;
}

export function pauseProgressSync(metadata: ProgressSyncMetadata, fingerprint: string, requireConfirmation = false) {
  const next = structuredClone(metadata);
  const account = next.accounts[fingerprint] ?? createDefaultProgressSyncAccount();
  account.syncEnabled = false;
  if (requireConfirmation) account.associationConfirmed = false;
  next.accounts[fingerprint] = account;
  return next;
}

export function resumeProgressSync(metadata: ProgressSyncMetadata, fingerprint: string) {
  const next = structuredClone(metadata);
  const account = next.accounts[fingerprint];
  if (!account?.associationConfirmed || next.lastAssociatedAccountFingerprint !== fingerprint) return next;
  account.syncEnabled = true;
  return next;
}

export function markProgressSyncCaughtUp(metadata: ProgressSyncMetadata, fingerprint: string, caughtUpAt: string) {
  const next = structuredClone(metadata);
  const account = next.accounts[fingerprint];
  if (account && isTimestamp(caughtUpAt)) account.lastFullyCaughtUpAt = caughtUpAt;
  return next;
}

export function mergeProgressSyncPushResponse(
  metadata: ProgressSyncMetadata,
  response: ProgressImportResponse,
  submitted?: ProgressPayload,
) {
  const next = structuredClone(metadata);
  const account = next.accounts[response.accountFingerprint] ?? createDefaultProgressSyncAccount();
  addAcknowledged(account, response.accepted, "accepted", response.committedAt);
  addAcknowledged(account, response.alreadyPresent, "already_present", response.committedAt);
  addAcknowledged(account, response.conflictRetained, "conflict_retained", response.committedAt);
  for (const rejected of response.rejected) {
    if (!rejected.kind || !rejected.eventId) continue;
    const reference = evidenceReference(rejected.kind, rejected.eventId);
    account.permanentlyRejected[reference] = {
      reasonCode: "invalid_evidence",
      recordDigest: submitted ? evidenceRecordDigest(submitted, rejected.kind, rejected.eventId) ?? reference : reference,
      rejectedAt: response.committedAt,
    };
  }
  account.lastSuccessfulPushAt = response.committedAt;
  account.retry = { consecutiveFailures: 0, nextRetryAt: null, lastFailureKind: null };
  next.accounts[response.accountFingerprint] = account;
  return next;
}

export function evidenceRecordDigest(
  payload: ProgressPayload,
  kind: "attempt" | "support_event" | "achievement_snapshot",
  eventId: string,
) {
  const value = kind === "attempt"
    ? payload.data.attempts.find((item) => item.eventId === eventId)
    : kind === "support_event"
      ? payload.data.supportEvents.find((item) => item.eventId === eventId)
      : payload.data.achievementSnapshots.find((item) => item.snapshotId === eventId);
  if (!value) return null;
  const source = stableStringify(value);
  let left = 0x811c9dc5;
  let right = 0x9e3779b9;
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193) >>> 0;
    right = Math.imul(right ^ code, 0x85ebca6b) >>> 0;
  }
  return `${left.toString(16).padStart(8, "0")}${right.toString(16).padStart(8, "0")}`;
}

export function mergeProgressSyncPullResponse(metadata: ProgressSyncMetadata, response: ProgressSyncPullResponse) {
  const next = structuredClone(metadata);
  const account = next.accounts[response.accountFingerprint] ?? createDefaultProgressSyncAccount();
  for (const event of response.events) {
    account.acknowledged[evidenceReference(event.kind, event.eventId)] = {
      disposition: event.disposition,
      receiveCursor: event.receiveCursor,
      acknowledgedAt: response.caughtUpAt,
    };
  }
  account.lastPulledCursor = response.nextCursor;
  account.lastSuccessfulPullAt = response.caughtUpAt;
  account.retry = { consecutiveFailures: 0, nextRetryAt: null, lastFailureKind: null };
  next.accounts[response.accountFingerprint] = account;
  return next;
}

export function pendingProgressSyncEvidence(payload: ProgressPayload, metadata: ProgressSyncMetadata, fingerprint: string): ProgressPayload {
  const account = metadata.accounts[fingerprint] ?? createDefaultProgressSyncAccount();
  const pending = (kind: "attempt" | "support_event" | "achievement_snapshot", eventId: string) => {
    const reference = evidenceReference(kind, eventId);
    const rejection = account.permanentlyRejected[reference];
    const rejectedDigest = rejection?.recordDigest;
    const currentDigest = rejection ? evidenceRecordDigest(payload, kind, eventId) : null;
    return !account.acknowledged[reference] && (!rejection || rejectedDigest !== currentDigest);
  };
  return {
    version: 4,
    data: {
      attempts: payload.data.attempts.filter((item) => pending("attempt", item.eventId)),
      supportEvents: payload.data.supportEvents.filter((item) => pending("support_event", item.eventId)),
      achievementSnapshots: payload.data.achievementSnapshots.filter((item) => pending("achievement_snapshot", item.snapshotId)),
    },
  };
}

export function canRunProgressSync(metadata: ProgressSyncMetadata, fingerprint: string) {
  const account = metadata.accounts[fingerprint];
  return Boolean(account?.syncEnabled && account.associationConfirmed && metadata.lastAssociatedAccountFingerprint === fingerprint);
}

export function progressSyncRequiresAssociation(metadata: ProgressSyncMetadata, fingerprint: string) {
  const account = metadata.accounts[fingerprint];
  return metadata.lastAssociatedAccountFingerprint !== fingerprint || !account?.associationConfirmed;
}

function parseMetadata(raw: string | null): ProgressSyncMetadata {
  if (!raw) return createDefaultProgressSyncMetadata();
  try {
    const candidate = JSON.parse(raw) as Partial<ProgressSyncMetadata>;
    if (candidate.version !== 1 || !candidate.accounts || typeof candidate.accounts !== "object") return createDefaultProgressSyncMetadata();
    const metadata = createDefaultProgressSyncMetadata();
    metadata.lastAssociatedAccountFingerprint = isAccountFingerprint(candidate.lastAssociatedAccountFingerprint)
      ? candidate.lastAssociatedAccountFingerprint
      : null;
    for (const [fingerprint, value] of Object.entries(candidate.accounts)) {
      if (!isAccountFingerprint(fingerprint) || !value || typeof value !== "object") continue;
      metadata.accounts[fingerprint] = sanitizeAccount(value as Partial<ProgressSyncAccountState>);
    }
    return metadata;
  } catch {
    return createDefaultProgressSyncMetadata();
  }
}

function sanitizeAccount(value: Partial<ProgressSyncAccountState>): ProgressSyncAccountState {
  const account = createDefaultProgressSyncAccount();
  account.syncEnabled = value.syncEnabled === true;
  account.associationConfirmed = value.associationConfirmed === true;
  account.lastPulledCursor = typeof value.lastPulledCursor === "string" ? value.lastPulledCursor : null;
  account.lastSuccessfulPushAt = isTimestamp(value.lastSuccessfulPushAt) ? value.lastSuccessfulPushAt : null;
  account.lastSuccessfulPullAt = isTimestamp(value.lastSuccessfulPullAt) ? value.lastSuccessfulPullAt : null;
  account.lastFullyCaughtUpAt = isTimestamp(value.lastFullyCaughtUpAt) ? value.lastFullyCaughtUpAt : null;
  if (value.acknowledged && typeof value.acknowledged === "object") {
    for (const [reference, acknowledgement] of Object.entries(value.acknowledged)) {
      if (validReference(reference) && validAcknowledgement(acknowledgement)) account.acknowledged[reference] = acknowledgement;
    }
  }
  if (value.permanentlyRejected && typeof value.permanentlyRejected === "object") {
    for (const [reference, rejection] of Object.entries(value.permanentlyRejected)) {
      if (validReference(reference) && validRejection(rejection)) account.permanentlyRejected[reference] = rejection;
    }
  }
  if (value.retry && typeof value.retry === "object") {
    account.retry = {
      consecutiveFailures: Number.isInteger(value.retry.consecutiveFailures) && value.retry.consecutiveFailures! >= 0 ? value.retry.consecutiveFailures! : 0,
      nextRetryAt: isTimestamp(value.retry.nextRetryAt) ? value.retry.nextRetryAt : null,
      lastFailureKind: typeof value.retry.lastFailureKind === "string" ? value.retry.lastFailureKind : null,
    };
  }
  return account;
}

function addAcknowledged(
  account: ProgressSyncAccountState,
  values: ProgressImportResponse["accepted"],
  disposition: ProgressSyncAcknowledgement["disposition"],
  acknowledgedAt: string,
) {
  for (const value of values) {
    account.acknowledged[evidenceReference(value.kind, value.eventId)] = {
      disposition,
      receiveCursor: value.receiveCursor,
      acknowledgedAt,
    };
  }
}

function validReference(value: string) {
  return /^(attempt|support_event|achievement_snapshot):[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value);
}

function validAcknowledgement(value: unknown): value is ProgressSyncAcknowledgement {
  if (!value || typeof value !== "object") return false;
  const item = value as ProgressSyncAcknowledgement;
  return ["accepted", "already_present", "conflict_retained"].includes(item.disposition) &&
    /^\d+$/.test(item.receiveCursor) && isTimestamp(item.acknowledgedAt);
}

function validRejection(value: unknown): value is ProgressSyncAccountState["permanentlyRejected"][string] {
  if (!value || typeof value !== "object") return false;
  const item = value as ProgressSyncAccountState["permanentlyRejected"][string];
  return typeof item.reasonCode === "string" && typeof item.recordDigest === "string" && isTimestamp(item.rejectedAt);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

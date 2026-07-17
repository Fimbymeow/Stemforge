import type { ProgressPayload } from "@/lib/progress/types";
import {
  MAX_PROGRESS_SYNC_PULL_BYTES,
  MAX_PROGRESS_SYNC_PULL_ITEMS,
  PROGRESS_SYNC_PROTOCOL_VERSION,
  decodeProgressSyncCursor,
  encodeProgressSyncCursor,
  type ProgressSyncPullResponse,
  type ProgressSyncPulledEvent,
} from "@/lib/progress/sync-protocol";
import { validateRemoteEvidenceBatch } from "@/lib/remote-evidence/validation";
import { appendEvidenceForTrustedOwner, createAccountFingerprint, type TrustedOwnerContext } from "@/lib/remote-evidence/authenticated-import";
import type { AppendRemoteEvidenceResult, RemoteEvidencePage } from "@/lib/remote-evidence/types";

export async function resolveProgressSyncContext(resolveOwner: () => Promise<TrustedOwnerContext>) {
  const owner = await resolveOwner();
  if (!owner.authenticated) return { authenticated: false as const };
  return { authenticated: true as const, accountFingerprint: createAccountFingerprint(owner.ownerId) };
}

export async function pushEvidenceForTrustedOwner(
  evidence: ProgressPayload,
  resolveOwner: () => Promise<TrustedOwnerContext>,
  append: (ownerId: string, evidence: ProgressPayload) => Promise<AppendRemoteEvidenceResult>,
) {
  return appendEvidenceForTrustedOwner(evidence, resolveOwner, append);
}

export async function pullEvidenceForTrustedOwner(
  cursorToken: string | null,
  resolveOwner: () => Promise<TrustedOwnerContext>,
  readPage: (ownerId: string, afterCursor: string | undefined, limit: number) => Promise<RemoteEvidencePage>,
) {
  const owner = await resolveOwner();
  if (!owner.authenticated) return { authenticated: false as const };
  const fingerprint = createAccountFingerprint(owner.ownerId);
  const decoded = decodeProgressSyncCursor(cursorToken, fingerprint);
  if (!decoded.ok) return { authenticated: true as const, invalidCursor: true as const };

  const page = await readPage(owner.ownerId, decoded.receiveCursor, MAX_PROGRESS_SYNC_PULL_ITEMS + 1);
  const events: ProgressSyncPulledEvent[] = [];
  const skipped: ProgressSyncPullResponse["skipped"] = [];
  let consumed = 0;
  let lastReceiveCursor = decoded.receiveCursor;

  for (const record of page.records) {
    if (consumed >= MAX_PROGRESS_SYNC_PULL_ITEMS) break;
    const valid = validateRecord(record.kind, record.eventId, record.evidence);
    const nextEvents = valid ? [...events, { ...record }] : events;
    const nextSkipped = valid ? skipped : [...skipped, { kind: record.kind, eventId: record.eventId, reasonCode: "invalid_stored_evidence" }];
    const candidate = response(fingerprint, nextEvents, nextSkipped, record.receiveCursor, page.records.length > consumed + 1);
    if (utf8Bytes(candidate) > MAX_PROGRESS_SYNC_PULL_BYTES) {
      if (consumed === 0) {
        skipped.push({ kind: record.kind, eventId: record.eventId, reasonCode: "oversized_stored_evidence" });
        consumed += 1;
        lastReceiveCursor = record.receiveCursor;
      }
      break;
    }
    if (valid) events.push({ ...record });
    else skipped.push({ kind: record.kind, eventId: record.eventId, reasonCode: "invalid_stored_evidence" });
    consumed += 1;
    lastReceiveCursor = record.receiveCursor;
  }

  const result = response(fingerprint, events, skipped, lastReceiveCursor, page.records.length > consumed);
  return { authenticated: true as const, invalidCursor: false as const, response: result };
}

function response(
  accountFingerprint: string,
  events: ProgressSyncPulledEvent[],
  skipped: ProgressSyncPullResponse["skipped"],
  receiveCursor: string | undefined,
  hasMore: boolean,
): ProgressSyncPullResponse {
  return {
    protocolVersion: PROGRESS_SYNC_PROTOCOL_VERSION,
    accountFingerprint,
    events,
    skipped,
    nextCursor: receiveCursor === undefined ? null : encodeProgressSyncCursor(accountFingerprint, receiveCursor),
    hasMore,
    caughtUpAt: new Date().toISOString(),
  };
}

function validateRecord(kind: string, eventId: string, evidence: unknown) {
  const payload: ProgressPayload = { version: 4, data: { attempts: [], supportEvents: [], achievementSnapshots: [] } };
  if (kind === "attempt") payload.data.attempts.push(evidence as ProgressPayload["data"]["attempts"][number]);
  else if (kind === "support_event") payload.data.supportEvents.push(evidence as ProgressPayload["data"]["supportEvents"][number]);
  else if (kind === "achievement_snapshot") payload.data.achievementSnapshots.push(evidence as ProgressPayload["data"]["achievementSnapshots"][number]);
  else return false;
  const validated = validateRemoteEvidenceBatch(payload);
  if (validated.fatal || validated.rejected.length > 0) return false;
  const storedId = kind === "achievement_snapshot"
    ? validated.payload.data.achievementSnapshots[0]?.snapshotId
    : kind === "attempt"
      ? validated.payload.data.attempts[0]?.eventId
      : validated.payload.data.supportEvents[0]?.eventId;
  return storedId === eventId;
}

function utf8Bytes(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

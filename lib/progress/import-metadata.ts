import { migrateProgressPayload } from "@/lib/progress/payload";
import type { ProgressLoadResult, ProgressPayload } from "@/lib/progress/types";
import type {
  ImportAcknowledgedEvent,
  ImportAcknowledgementDisposition,
  ProgressImportResponse,
} from "@/lib/progress/import-protocol";
import type { RemoteEvidenceKind } from "@/lib/remote-evidence/types";

export const PROGRESS_IMPORT_METADATA_KEY = "stemforge.progressImport.v1";
export const CURRENT_PROGRESS_IMPORT_METADATA_VERSION = 1 as const;

export type ProgressImportAcknowledgement = {
  disposition: ImportAcknowledgementDisposition;
  receiveCursor: string;
  acknowledgedAt: string;
};

export type ProgressImportMetadata = {
  version: typeof CURRENT_PROGRESS_IMPORT_METADATA_VERSION;
  lastAccountFingerprint: string | null;
  accounts: Record<string, {
    acknowledged: Record<string, ProgressImportAcknowledgement>;
    lastImportAt: string | null;
  }>;
};

export type LocalImportInspection =
  | { status: "empty"; payload: ProgressPayload; loadStatus: ProgressLoadResult["status"] }
  | { status: "importable"; payload: ProgressPayload; loadStatus: ProgressLoadResult["status"]; warning: string | null }
  | { status: "invalid" | "unsupported"; payload: ProgressPayload; loadStatus: ProgressLoadResult["status"]; message: string };

export function createDefaultProgressImportMetadata(): ProgressImportMetadata {
  return { version: CURRENT_PROGRESS_IMPORT_METADATA_VERSION, lastAccountFingerprint: null, accounts: {} };
}

export function inspectLocalProgress(raw: string | null): LocalImportInspection {
  if (raw === null) return { status: "empty", payload: emptyPayload(), loadStatus: "empty" };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: "invalid", payload: emptyPayload(), loadStatus: "malformed-json", message: "Saved browser progress could not be read. It has not been changed or uploaded." };
  }
  const result = migrateProgressPayload(value);
  if (result.status === "unsupported-version") {
    return { status: "unsupported", payload: result.payload, loadStatus: result.status, message: "This browser contains progress from a newer format. It has not been changed or uploaded." };
  }
  if (result.status === "invalid-structure" || result.status === "unavailable" || result.status === "malformed-json") {
    return { status: "invalid", payload: result.payload, loadStatus: result.status, message: "Saved browser progress could not be recovered safely. It has not been changed or uploaded." };
  }
  if (evidenceCount(result.payload) === 0) return { status: "empty", payload: result.payload, loadStatus: result.status };
  const dropped = result.droppedAttempts + result.droppedEvents + result.droppedSnapshots;
  const migrated = result.status.startsWith("migrated-");
  const warning = dropped > 0
    ? `${dropped} invalid saved record${dropped === 1 ? "" : "s"} could not be recovered and will not be uploaded.`
    : migrated
      ? "Older browser progress was recovered safely for this import. The saved local copy has not been rewritten."
      : null;
  return { status: "importable", payload: result.payload, loadStatus: result.status, warning };
}

export function readProgressImportMetadata(raw: string | null): ProgressImportMetadata {
  if (!raw) return createDefaultProgressImportMetadata();
  try {
    const candidate = JSON.parse(raw) as Partial<ProgressImportMetadata>;
    if (candidate.version !== CURRENT_PROGRESS_IMPORT_METADATA_VERSION || !candidate.accounts || typeof candidate.accounts !== "object") {
      return createDefaultProgressImportMetadata();
    }
    const metadata = createDefaultProgressImportMetadata();
    metadata.lastAccountFingerprint = validFingerprint(candidate.lastAccountFingerprint) ? candidate.lastAccountFingerprint : null;
    for (const [fingerprint, accountValue] of Object.entries(candidate.accounts)) {
      if (!validFingerprint(fingerprint) || !accountValue || typeof accountValue !== "object") continue;
      const account = accountValue as { acknowledged?: unknown; lastImportAt?: unknown };
      const acknowledged: Record<string, ProgressImportAcknowledgement> = {};
      if (account.acknowledged && typeof account.acknowledged === "object") {
        for (const [key, value] of Object.entries(account.acknowledged)) {
          if (validAcknowledgementKey(key) && validAcknowledgement(value)) acknowledged[key] = value;
        }
      }
      metadata.accounts[fingerprint] = {
        acknowledged,
        lastImportAt: isIsoTimestamp(account.lastImportAt) ? account.lastImportAt : null,
      };
    }
    return metadata;
  } catch {
    return createDefaultProgressImportMetadata();
  }
}

export function mergeImportResponse(
  latest: ProgressImportMetadata,
  response: ProgressImportResponse,
): ProgressImportMetadata {
  const next = structuredClone(latest);
  const existing = next.accounts[response.accountFingerprint] ?? { acknowledged: {}, lastImportAt: null };
  addAcknowledgements(existing.acknowledged, response.accepted, "accepted", response.committedAt);
  addAcknowledgements(existing.acknowledged, response.alreadyPresent, "already_present", response.committedAt);
  addAcknowledgements(existing.acknowledged, response.conflictRetained, "conflict_retained", response.committedAt);
  existing.lastImportAt = response.committedAt;
  next.accounts[response.accountFingerprint] = existing;
  next.lastAccountFingerprint = response.accountFingerprint;
  return next;
}

export function pendingEvidence(payload: ProgressPayload, metadata: ProgressImportMetadata, accountFingerprint: string): ProgressPayload {
  const acknowledged = metadata.accounts[accountFingerprint]?.acknowledged ?? {};
  return {
    version: 4,
    data: {
      attempts: payload.data.attempts.filter((item) => !acknowledged[acknowledgementKey("attempt", item.eventId)]),
      supportEvents: payload.data.supportEvents.filter((item) => !acknowledged[acknowledgementKey("support_event", item.eventId)]),
      achievementSnapshots: payload.data.achievementSnapshots.filter((item) => !acknowledged[acknowledgementKey("achievement_snapshot", item.snapshotId)]),
    },
  };
}

export function wasAcknowledgedForDifferentAccount(metadata: ProgressImportMetadata, accountFingerprint: string) {
  return Object.entries(metadata.accounts).some(([fingerprint, account]) =>
    fingerprint !== accountFingerprint && Object.keys(account.acknowledged).length > 0,
  );
}

export function evidenceSummary(payload: ProgressPayload) {
  return {
    attempts: payload.data.attempts.length,
    supportEvents: payload.data.supportEvents.length,
    achievements: payload.data.achievementSnapshots.length,
    total: evidenceCount(payload),
  };
}

export function acknowledgementKey(kind: RemoteEvidenceKind, eventId: string) {
  return `${kind}:${eventId}`;
}

function addAcknowledgements(
  target: Record<string, ProgressImportAcknowledgement>,
  values: ImportAcknowledgedEvent[],
  disposition: ImportAcknowledgementDisposition,
  acknowledgedAt: string,
) {
  for (const item of values) {
    target[acknowledgementKey(item.kind, item.eventId)] = {
      disposition,
      receiveCursor: item.receiveCursor,
      acknowledgedAt,
    };
  }
}

function validAcknowledgement(value: unknown): value is ProgressImportAcknowledgement {
  if (!value || typeof value !== "object") return false;
  const item = value as ProgressImportAcknowledgement;
  return ["accepted", "already_present", "conflict_retained"].includes(item.disposition) &&
    typeof item.receiveCursor === "string" && /^\d+$/.test(item.receiveCursor) && isIsoTimestamp(item.acknowledgedAt);
}

function validAcknowledgementKey(value: string) {
  return /^(attempt|support_event|achievement_snapshot):[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value);
}

function validFingerprint(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function evidenceCount(payload: ProgressPayload) {
  return payload.data.attempts.length + payload.data.supportEvents.length + payload.data.achievementSnapshots.length;
}

function emptyPayload(): ProgressPayload {
  return { version: 4, data: { attempts: [], supportEvents: [], achievementSnapshots: [] } };
}

import type { ProgressPayload } from "@/lib/progress/types";
import { isAccountFingerprint } from "@/lib/progress/sync-protocol";

export const EVIDENCE_PROVENANCE_KEY = "stemforge.evidenceProvenance.v1";
export const CURRENT_EVIDENCE_PROVENANCE_VERSION = 1 as const;

export type EvidenceProvenanceSource =
  | "local_anonymous"
  | "local_associated"
  | "remote_pull"
  | "legacy_unknown";

export type EvidenceProvenanceEntry = {
  source: EvidenceProvenanceSource;
  accountFingerprint: string | null;
  firstObservedAt: string;
};

export type EvidenceProvenanceMetadata = {
  version: typeof CURRENT_EVIDENCE_PROVENANCE_VERSION;
  records: Record<string, EvidenceProvenanceEntry>;
};

export type EvidenceProvenanceRead = {
  metadata: EvidenceProvenanceMetadata;
  status: "current" | "migrated_missing" | "recovered_malformed" | "unsupported_future";
};

export type EvidenceProvenanceSummary = {
  total: number;
  anonymous: number;
  legacyUnknown: number;
  currentAccount: number;
  otherAccounts: number;
  remotePulledForCurrentAccount: number;
};

let activeAccountFingerprint: string | null = null;

export function setActiveBrowserAccountFingerprint(fingerprint: string | null) {
  activeAccountFingerprint = isAccountFingerprint(fingerprint) ? fingerprint : null;
}

export function getActiveBrowserAccountFingerprint() {
  return activeAccountFingerprint;
}

export function createDefaultEvidenceProvenance(): EvidenceProvenanceMetadata {
  return { version: CURRENT_EVIDENCE_PROVENANCE_VERSION, records: {} };
}

export function readEvidenceProvenance(raw: string | null, payload: ProgressPayload): EvidenceProvenanceRead {
  const references = payloadReferences(payload);
  if (!raw) {
    return { metadata: reconcileEvidenceProvenance(createDefaultEvidenceProvenance(), payload), status: references.size ? "migrated_missing" : "current" };
  }
  try {
    const candidate = JSON.parse(raw) as Partial<EvidenceProvenanceMetadata>;
    if (typeof candidate.version === "number" && candidate.version > CURRENT_EVIDENCE_PROVENANCE_VERSION) {
      return { metadata: reconcileEvidenceProvenance(createDefaultEvidenceProvenance(), payload), status: "unsupported_future" };
    }
    if (candidate.version !== CURRENT_EVIDENCE_PROVENANCE_VERSION || !candidate.records || typeof candidate.records !== "object") {
      return { metadata: reconcileEvidenceProvenance(createDefaultEvidenceProvenance(), payload), status: "recovered_malformed" };
    }
    const metadata = createDefaultEvidenceProvenance();
    for (const [reference, entry] of Object.entries(candidate.records)) {
      if (references.has(reference) && isEntry(entry)) metadata.records[reference] = { ...entry };
    }
    const missing = [...references.keys()].some((reference) => !metadata.records[reference]);
    return { metadata: reconcileEvidenceProvenance(metadata, payload), status: missing ? "migrated_missing" : "current" };
  } catch {
    return { metadata: reconcileEvidenceProvenance(createDefaultEvidenceProvenance(), payload), status: "recovered_malformed" };
  }
}

export function reconcileEvidenceProvenance(metadata: EvidenceProvenanceMetadata, payload: ProgressPayload) {
  const next = createDefaultEvidenceProvenance();
  for (const [reference, observedAt] of payloadReferences(payload)) {
    next.records[reference] = metadata.records[reference] ?? {
      source: "legacy_unknown",
      accountFingerprint: null,
      firstObservedAt: observedAt,
    };
  }
  return next;
}

export function assignEvidenceProvenance(
  metadata: EvidenceProvenanceMetadata,
  payload: ProgressPayload,
  references: Iterable<string>,
  source: Exclude<EvidenceProvenanceSource, "legacy_unknown">,
  accountFingerprint: string | null,
) {
  const next = reconcileEvidenceProvenance(metadata, payload);
  const observed = payloadReferences(payload);
  const fingerprint = source === "local_anonymous" ? null : accountFingerprint;
  if (source !== "local_anonymous" && !isAccountFingerprint(fingerprint)) throw new Error("Account provenance requires a valid opaque fingerprint.");
  for (const reference of references) {
    const firstObservedAt = observed.get(reference);
    if (!firstObservedAt) continue;
    next.records[reference] = { source, accountFingerprint: fingerprint, firstObservedAt };
  }
  return next;
}

export function evidenceReferences(payload: ProgressPayload) {
  return new Set(payloadReferences(payload).keys());
}

export function evidenceProvenanceSummary(
  metadata: EvidenceProvenanceMetadata,
  payload: ProgressPayload,
  currentFingerprint: string | null,
): EvidenceProvenanceSummary {
  const reconciled = reconcileEvidenceProvenance(metadata, payload);
  const summary: EvidenceProvenanceSummary = {
    total: 0,
    anonymous: 0,
    legacyUnknown: 0,
    currentAccount: 0,
    otherAccounts: 0,
    remotePulledForCurrentAccount: 0,
  };
  for (const entry of Object.values(reconciled.records)) {
    summary.total += 1;
    if (entry.source === "local_anonymous") summary.anonymous += 1;
    else if (entry.source === "legacy_unknown") summary.legacyUnknown += 1;
    else if (entry.accountFingerprint === currentFingerprint) {
      summary.currentAccount += 1;
      if (entry.source === "remote_pull") summary.remotePulledForCurrentAccount += 1;
    } else summary.otherAccounts += 1;
  }
  return summary;
}

export function referencesForAccount(metadata: EvidenceProvenanceMetadata, fingerprint: string) {
  return new Set(Object.entries(metadata.records)
    .filter(([, entry]) => entry.accountFingerprint === fingerprint && (entry.source === "local_associated" || entry.source === "remote_pull"))
    .map(([reference]) => reference));
}

function payloadReferences(payload: ProgressPayload) {
  return new Map<string, string>([
    ...payload.data.attempts.map((item) => [`attempt:${item.eventId}`, item.attemptedAt] as const),
    ...payload.data.supportEvents.map((item) => [`support_event:${item.eventId}`, item.occurredAt] as const),
    ...payload.data.achievementSnapshots.map((item) => [`achievement_snapshot:${item.snapshotId}`, item.achievedAt] as const),
  ]);
}

function isEntry(value: unknown): value is EvidenceProvenanceEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as EvidenceProvenanceEntry;
  const source = ["local_anonymous", "local_associated", "remote_pull", "legacy_unknown"].includes(entry.source);
  const account = entry.source === "local_anonymous" || entry.source === "legacy_unknown"
    ? entry.accountFingerprint === null
    : isAccountFingerprint(entry.accountFingerprint);
  return source && account && isTimestamp(entry.firstObservedAt);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

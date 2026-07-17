import { createHash } from "node:crypto";
import { stableStringify } from "@/lib/progress/event-identity";
import type { RemoteEvidenceKind } from "@/lib/remote-evidence/types";

export const ACCOUNT_EXPORT_SCHEMA_VERSION = 1 as const;
export const MAX_ACCOUNT_EXPORT_RECORDS = 10_000;
export const MAX_ACCOUNT_EXPORT_BYTES = 5_000_000;

export type AccountExportRecord = {
  kind: RemoteEvidenceKind;
  disposition: "accepted" | "conflict_retained";
  eventId: string;
  evidence: unknown;
  accountGeneration: string;
  receiveCursor: string;
  receivedAt: string;
};

export type AccountLearningDataExport = {
  schemaVersion: typeof ACCOUNT_EXPORT_SCHEMA_VERSION;
  generatedAt: string;
  scope: "remote_account_learning_data";
  accountCreatedAt: string;
  categoryCounts: { attempts: number; supportEvents: number; achievementSnapshots: number; retainedConflicts: number };
  records: AccountExportRecord[];
  integrity: { algorithm: "SHA-256"; canonicalDataDigest: string };
};

export function buildAccountLearningDataExport(records: AccountExportRecord[], accountCreatedAt: string, generatedAt = new Date().toISOString()) {
  if (records.length > MAX_ACCOUNT_EXPORT_RECORDS) throw new AccountExportBoundsError();
  const canonicalData = { schemaVersion: ACCOUNT_EXPORT_SCHEMA_VERSION, generatedAt, scope: "remote_account_learning_data" as const,
    accountCreatedAt, categoryCounts: categoryCounts(records), records };
  const result: AccountLearningDataExport = { ...canonicalData,
    integrity: { algorithm: "SHA-256", canonicalDataDigest: createHash("sha256").update(stableStringify(canonicalData), "utf8").digest("hex") } };
  if (new TextEncoder().encode(JSON.stringify(result)).length > MAX_ACCOUNT_EXPORT_BYTES) throw new AccountExportBoundsError();
  return result;
}

export function safeAccountExportFilename(now = new Date()) {
  return `stem-forge-account-data-${now.toISOString().slice(0, 10)}.json`;
}

export class AccountExportBoundsError extends Error {}

function categoryCounts(records: AccountExportRecord[]) {
  return {
    attempts: records.filter((item) => item.disposition === "accepted" && item.kind === "attempt").length,
    supportEvents: records.filter((item) => item.disposition === "accepted" && item.kind === "support_event").length,
    achievementSnapshots: records.filter((item) => item.disposition === "accepted" && item.kind === "achievement_snapshot").length,
    retainedConflicts: records.filter((item) => item.disposition === "conflict_retained").length,
  };
}

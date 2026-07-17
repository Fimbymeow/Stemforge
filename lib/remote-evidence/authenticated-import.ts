import { createHash } from "node:crypto";
import type { ProgressImportResponse } from "@/lib/progress/import-protocol";
import type { ProgressPayload } from "@/lib/progress/types";
import type { AppendRemoteEvidenceResult } from "@/lib/remote-evidence/types";

export type TrustedOwnerContext = { authenticated: false } | { authenticated: true; ownerId: string };

export async function importEvidenceForTrustedOwner(
  evidence: ProgressPayload,
  resolveOwner: () => Promise<TrustedOwnerContext>,
  append: (ownerId: string, evidence: ProgressPayload) => Promise<AppendRemoteEvidenceResult>,
) {
  return appendEvidenceForTrustedOwner(evidence, resolveOwner, append);
}

export async function appendEvidenceForTrustedOwner(
  evidence: ProgressPayload,
  resolveOwner: () => Promise<TrustedOwnerContext>,
  append: (ownerId: string, evidence: ProgressPayload) => Promise<AppendRemoteEvidenceResult>,
) {
  const owner = await resolveOwner();
  if (!owner.authenticated) return { authenticated: false as const };
  const result = await append(owner.ownerId, evidence);
  const conflictRetained = result.conflicts.map(({ kind, eventId, receiveCursor, receivedAt }) => ({
    kind, eventId, receiveCursor, receivedAt,
  }));
  const hasCommitted = result.accepted.length + result.duplicates.length + conflictRetained.length > 0;
  const response: ProgressImportResponse = {
    protocolVersion: 1,
    accountFingerprint: createAccountFingerprint(owner.ownerId),
    committedAt: new Date().toISOString(),
    batchStatus: result.rejected.length > 0 ? (hasCommitted ? "partly_committed" : "rejected") : "committed",
    accepted: result.accepted,
    alreadyPresent: result.duplicates,
    conflictRetained,
    rejected: result.rejected,
    notProcessed: [],
  };
  return { authenticated: true as const, response };
}

export function createAccountFingerprint(ownerId: string) {
  return createHash("sha256").update(`stemforge-progress-import-account-v1\0${ownerId}`, "utf8").digest("base64url");
}

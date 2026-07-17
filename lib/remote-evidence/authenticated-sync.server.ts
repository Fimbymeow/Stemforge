import "server-only";

import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";
import { PostgresRemoteEvidenceRepository } from "@/lib/remote-evidence/postgres-repository.server";
import type { ProgressPayload } from "@/lib/progress/types";
import {
  pullEvidenceForTrustedOwner,
  pushEvidenceForTrustedOwner,
  resolveProgressSyncContext,
} from "@/lib/remote-evidence/authenticated-sync";

let syncPool: ReturnType<typeof createRemoteEvidencePool> | undefined;

function repository() {
  syncPool ??= createRemoteEvidencePool();
  return new PostgresRemoteEvidenceRepository(syncPool);
}

export function resolveCurrentProgressSyncContext() {
  return resolveProgressSyncContext(resolveCurrentAuthenticatedOwner);
}

export function pushCurrentProgressSyncEvidence(evidence: ProgressPayload) {
  return pushEvidenceForTrustedOwner(evidence, resolveCurrentAuthenticatedOwner, (ownerId, payload) => repository().append(ownerId, payload));
}

export function pullCurrentProgressSyncEvidence(cursorToken: string | null) {
  return pullEvidenceForTrustedOwner(cursorToken, resolveCurrentAuthenticatedOwner, (ownerId, cursor, limit) => repository().readPage(ownerId, cursor, limit));
}

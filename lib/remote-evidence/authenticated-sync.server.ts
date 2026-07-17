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
import { PostgresAccountDataRepository } from "@/lib/account-data/postgres-account-data.server";

let syncPool: ReturnType<typeof createRemoteEvidencePool> | undefined;

function repository() {
  syncPool ??= createRemoteEvidencePool();
  return new PostgresRemoteEvidenceRepository(syncPool);
}

export function resolveCurrentProgressSyncContext() {
  return resolveProgressSyncContext(resolveCurrentAuthenticatedOwner, (ownerId) => new PostgresAccountDataRepository(syncPool ??= createRemoteEvidencePool()).readState(ownerId));
}

export function pushCurrentProgressSyncEvidence(evidence: ProgressPayload, expectedGeneration?: string) {
  return pushEvidenceForTrustedOwner(evidence, resolveCurrentAuthenticatedOwner,
    (ownerId, payload, generation) => repository().append(ownerId, payload, generation), expectedGeneration);
}

export function pullCurrentProgressSyncEvidence(cursorToken: string | null, expectedGeneration?: string) {
  return pullEvidenceForTrustedOwner(cursorToken, expectedGeneration, resolveCurrentAuthenticatedOwner,
    (ownerId, cursor, limit, generation) => repository().readPage(ownerId, cursor, limit, generation));
}

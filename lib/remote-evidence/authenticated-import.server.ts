import "server-only";

import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";
import { PostgresRemoteEvidenceRepository } from "@/lib/remote-evidence/postgres-repository.server";
import type { ProgressPayload } from "@/lib/progress/types";
import { createAccountFingerprint, importEvidenceForTrustedOwner } from "@/lib/remote-evidence/authenticated-import";

let importPool: ReturnType<typeof createRemoteEvidencePool> | undefined;

export async function importCurrentBrowserEvidence(evidence: ProgressPayload) {
  importPool ??= createRemoteEvidencePool();
  const repository = new PostgresRemoteEvidenceRepository(importPool);
  return importEvidenceForTrustedOwner(
    evidence,
    resolveCurrentAuthenticatedOwner,
    (ownerId, payload) => repository.append(ownerId, payload),
  );
}

export { createAccountFingerprint };

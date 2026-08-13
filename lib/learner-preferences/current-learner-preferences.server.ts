import "server-only";

import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";
import { PostgresLearnerPreferencesRepository } from "@/lib/learner-preferences/postgres-learner-preferences.server";

let pool: ReturnType<typeof createRemoteEvidencePool> | undefined;

function repository() {
  pool ??= createRemoteEvidencePool();
  return new PostgresLearnerPreferencesRepository(pool);
}

export async function withCurrentLearnerPreferences<T>(operation: (ownerId: string, repository: PostgresLearnerPreferencesRepository) => Promise<T>) {
  const owner = await resolveCurrentAuthenticatedOwner();
  if (!owner.authenticated) return { authenticated: false as const };
  return { authenticated: true as const, result: await operation(owner.ownerId, repository()) };
}

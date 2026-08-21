import "server-only";

import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";
import { PostgresAccountStateRepository } from "@/lib/account-state/postgres-account-state.server";

let pool: ReturnType<typeof createRemoteEvidencePool> | undefined;
function repository() { pool ??= createRemoteEvidencePool(); return new PostgresAccountStateRepository(pool); }

export async function withCurrentAccountState<T>(operation: (ownerId: string, repository: PostgresAccountStateRepository) => Promise<T>) {
  const owner = await resolveCurrentAuthenticatedOwner();
  if (!owner.authenticated) return { authenticated: false as const };
  return { authenticated: true as const, ownerId: owner.ownerId, result: await operation(owner.ownerId, repository()) };
}

import "server-only";

import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";
import { PostgresAccountDataRepository } from "@/lib/account-data/postgres-account-data.server";

let pool: ReturnType<typeof createRemoteEvidencePool> | undefined;
function repository() { pool ??= createRemoteEvidencePool(); return new PostgresAccountDataRepository(pool); }

export async function withCurrentAccountData<T>(operation: (ownerId: string, repository: PostgresAccountDataRepository) => Promise<T>) {
  const owner = await resolveCurrentAuthenticatedOwner();
  if (!owner.authenticated) return { authenticated: false as const };
  return { authenticated: true as const, result: await operation(owner.ownerId, repository()) };
}

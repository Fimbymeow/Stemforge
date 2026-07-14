import "server-only";

import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";
import { PostgresOwnerMappingRepository } from "@/lib/auth/postgres-owner-repository.server";
import { resolveAuthenticatedOwner } from "@/lib/auth/owner-resolution";
import { SupabaseVerifiedIdentityResolver } from "@/lib/auth/supabase-identity.server";

let ownerPool: ReturnType<typeof createRemoteEvidencePool> | undefined;

export function resolveCurrentAuthenticatedOwner() {
  return resolveAfterIdentityVerification();
}

async function resolveAfterIdentityVerification() {
  const identity = await new SupabaseVerifiedIdentityResolver().resolveVerifiedIdentity();
  if (!identity) return { authenticated: false as const };
  ownerPool ??= createRemoteEvidencePool();
  return resolveAuthenticatedOwner(
    { resolveVerifiedIdentity: async () => identity },
    new PostgresOwnerMappingRepository(ownerPool),
  );
}

import assert from "node:assert/strict";
import test from "node:test";
import { resolveAuthenticatedOwner } from "../lib/auth/owner-resolution";
import type { OwnerMappingRepository, VerifiedExternalIdentity, VerifiedIdentityResolver } from "../lib/auth/owner-types";

class MemoryOwnerRepository implements OwnerMappingRepository {
  private readonly owners = new Map<string, string>();
  async getOrCreateOwner(identity: VerifiedExternalIdentity) {
    const key = `${identity.provider}:${identity.subject}`;
    const owner = this.owners.get(key) ?? `owner_${String(this.owners.size + 1).padStart(32, "0")}`;
    this.owners.set(key, owner);
    return owner;
  }
}

function resolver(identity: VerifiedExternalIdentity | null): VerifiedIdentityResolver {
  return { resolveVerifiedIdentity: async () => identity };
}

test("no or invalid verified identity returns no owner", async () => {
  const owners = new MemoryOwnerRepository();
  assert.deepEqual(await resolveAuthenticatedOwner(resolver(null), owners), { authenticated: false });
  assert.deepEqual(await resolveAuthenticatedOwner(resolver({ verified: true, provider: "BAD PROVIDER", subject: "user" }), owners), { authenticated: false });
});

test("a verified identity receives one stable owner", async () => {
  const owners = new MemoryOwnerRepository();
  const identity = { verified: true as const, provider: "supabase", subject: "provider-user-1" };
  const first = await resolveAuthenticatedOwner(resolver(identity), owners);
  const second = await resolveAuthenticatedOwner(resolver(identity), owners);
  assert.deepEqual(second, first);
});

test("different identities receive different owners and mutable profile data is outside the contract", async () => {
  const owners = new MemoryOwnerRepository();
  const first = await resolveAuthenticatedOwner(resolver({ verified: true, provider: "supabase", subject: "user-1" }), owners);
  const second = await resolveAuthenticatedOwner(resolver({ verified: true, provider: "supabase", subject: "user-2" }), owners);
  assert.notDeepEqual(first, second);
  assert.equal("email" in ({ verified: true, provider: "supabase", subject: "user-1" } satisfies VerifiedExternalIdentity), false);
});

test("extra browser-supplied ownership is ignored by the canonical boundary", async () => {
  const owners = new MemoryOwnerRepository();
  const identity = { verified: true as const, provider: "supabase", subject: "trusted-user" };
  const invoked = resolveAuthenticatedOwner as unknown as (...args: unknown[]) => Promise<{ authenticated: boolean; ownerId?: string }>;
  const result = await invoked(resolver(identity), owners, { ownerId: "owner_browser_supplied" });
  assert.equal(result.authenticated, true);
  assert.notEqual(result.ownerId, "owner_browser_supplied");
});

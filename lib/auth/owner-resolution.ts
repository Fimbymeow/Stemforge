import type {
  AuthenticatedOwnerContext,
  OwnerMappingRepository,
  UnauthenticatedOwnerContext,
  VerifiedIdentityResolver,
} from "@/lib/auth/owner-types";

export async function resolveAuthenticatedOwner(
  identityResolver: VerifiedIdentityResolver,
  ownerRepository: OwnerMappingRepository,
): Promise<AuthenticatedOwnerContext | UnauthenticatedOwnerContext> {
  const identity = await identityResolver.resolveVerifiedIdentity();
  if (!identity?.verified || !isTrustedIdentity(identity.provider, identity.subject)) return { authenticated: false };
  const ownerId = await ownerRepository.getOrCreateOwner(identity);
  return { authenticated: true, ownerId, provider: identity.provider };
}

function isTrustedIdentity(provider: string, subject: string) {
  return /^[a-z][a-z0-9_-]{0,63}$/.test(provider) && subject.length > 0 && subject.length <= 200;
}

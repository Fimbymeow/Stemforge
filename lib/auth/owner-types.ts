export type VerifiedExternalIdentity = {
  verified: true;
  provider: string;
  subject: string;
};

export type AuthenticatedOwnerContext = {
  authenticated: true;
  ownerId: string;
  provider: string;
};

export type UnauthenticatedOwnerContext = { authenticated: false };

export interface VerifiedIdentityResolver {
  resolveVerifiedIdentity(): Promise<VerifiedExternalIdentity | null>;
}

export interface OwnerMappingRepository {
  getOrCreateOwner(identity: VerifiedExternalIdentity): Promise<string>;
}

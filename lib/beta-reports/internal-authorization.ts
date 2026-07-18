import type { AuthFeatureConfiguration } from "@/lib/auth/config";

export type InternalOperationsAuthorization =
  | { status: "authorized"; ownerId: string }
  | { status: "disabled" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "misconfigured" };

type Environment = Record<string, string | undefined>;
type OwnerContext = { authenticated: false } | { authenticated: true; ownerId: string };

export async function authorizeInternalOperations(input: {
  environment: Environment;
  authConfiguration: AuthFeatureConfiguration;
  resolveOwner: () => Promise<OwnerContext>;
}): Promise<InternalOperationsAuthorization> {
  const enabled = input.environment.STEMFORGE_INTERNAL_REPORTS_ENABLED;
  if (enabled === undefined || enabled === "" || enabled === "false") return { status: "disabled" };
  if (enabled !== "true") return { status: "misconfigured" };
  const allowlist = parseInternalOwnerAllowlist(input.environment.STEMFORGE_INTERNAL_REPORT_OWNER_IDS);
  if (!allowlist) return { status: "misconfigured" };
  if (input.authConfiguration.status !== "enabled") return { status: "misconfigured" };
  let owner: OwnerContext;
  try { owner = await input.resolveOwner(); } catch { return { status: "misconfigured" }; }
  if (!owner.authenticated) return { status: "unauthenticated" };
  if (!allowlist.has(owner.ownerId)) return { status: "forbidden" };
  return { status: "authorized", ownerId: owner.ownerId };
}

export function getInternalOperationsConfigurationStatus(environment: Environment) {
  const enabled = environment.STEMFORGE_INTERNAL_REPORTS_ENABLED;
  if (enabled === undefined || enabled === "" || enabled === "false") return "disabled" as const;
  if (enabled !== "true") return "misconfigured" as const;
  return parseInternalOwnerAllowlist(environment.STEMFORGE_INTERNAL_REPORT_OWNER_IDS) ? "enabled" as const : "misconfigured" as const;
}

function parseInternalOwnerAllowlist(value: string | undefined) {
  if (!value?.trim()) return null;
  const owners = value.split(",").map((item) => item.trim());
  if (owners.some((owner) => !/^owner_[a-f0-9]{32}$/.test(owner))) return null;
  return new Set(owners);
}

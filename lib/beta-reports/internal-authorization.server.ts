import "server-only";

import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";

export type InternalReportsAccess =
  | { allowed: true; ownerId: string | null; mode: "development" | "production" }
  | { allowed: false; reason: "disabled" | "sign_in_required" | "not_allowed" | "misconfigured" };

export async function getInternalReportsAccess(): Promise<InternalReportsAccess> {
  if (process.env.STEMFORGE_INTERNAL_REPORTS_ENABLED !== "true") return { allowed: false, reason: "disabled" };
  const production = process.env.NODE_ENV === "production";
  const allowlist = parseAllowlist(process.env.STEMFORGE_INTERNAL_REPORT_OWNER_IDS);
  const config = getAuthFeatureConfiguration();
  if (!production && allowlist.length === 0) return { allowed: true, ownerId: null, mode: "development" };
  if (config.status !== "enabled") return { allowed: false, reason: "misconfigured" };
  const owner = await resolveCurrentAuthenticatedOwner();
  if (!owner.authenticated) return { allowed: false, reason: "sign_in_required" };
  if (!allowlist.includes(owner.ownerId)) return { allowed: false, reason: "not_allowed" };
  return { allowed: true, ownerId: owner.ownerId, mode: production ? "production" : "development" };
}

function parseAllowlist(value: string | undefined) {
  return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

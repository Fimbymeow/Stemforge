import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { getInternalOperationsConfigurationStatus } from "@/lib/beta-reports/internal-authorization";

export const LATEST_DATABASE_MIGRATION = "1753266400000";

type Environment = Record<string, string | undefined>;
export type DeploymentCheck = { code: string; status: "pass" | "warning" | "fail"; message: string };

export function evaluateDeploymentReadiness(environment: Environment, production: boolean): DeploymentCheck[] {
  const checks: DeploymentCheck[] = [];
  const forbiddenPublic = Object.keys(environment).filter((name) => name.startsWith("NEXT_PUBLIC_") && /(DATABASE|SERVICE_ROLE|SECRET|PASSWORD|INTERNAL_REPORT)/.test(name));
  checks.push(forbiddenPublic.length ? fail("public_environment", "Forbidden sensitive NEXT_PUBLIC environment names are configured.") : pass("public_environment", "No forbidden public environment names are configured."));

  const site = validUrl(environment.NEXT_PUBLIC_SITE_URL, production);
  checks.push(site ? pass("public_site", "The public site URL is valid for this mode.") : production ? fail("public_site", "A valid HTTPS NEXT_PUBLIC_SITE_URL is required.") : warning("public_site", "NEXT_PUBLIC_SITE_URL is absent or not HTTPS; local fallback remains available."));

  const databaseReady = Boolean(environment.STEMFORGE_DATABASE_URL?.trim() && environment.STEMFORGE_DATABASE_MIGRATION_URL?.trim());
  checks.push(databaseReady ? pass("database_configuration", "Application and migration database connections are named.") : production ? fail("database_configuration", "Both server-only database connection names are required.") : warning("database_configuration", "Database configuration is optional for a credential-free local dry run."));

  const auth = getAuthFeatureConfiguration(environment);
  checks.push(auth.status === "misconfigured" ? fail("authentication", "Authentication is enabled but incomplete or invalid.") : pass("authentication", `Authentication configuration is coherently ${auth.status}.`));

  const internal = getInternalOperationsConfigurationStatus(environment);
  checks.push(internal === "misconfigured" || (internal === "enabled" && auth.status !== "enabled")
    ? fail("internal_operations", "Internal operations are enabled without a complete trusted authorization configuration.")
    : pass("internal_operations", `Internal operations are safely ${internal}.`));

  checks.push(pass("migration_contract", `Latest required migration is ${LATEST_DATABASE_MIGRATION}.`));
  return checks;
}

export function deploymentIsReady(checks: DeploymentCheck[]) {
  return checks.every((check) => check.status !== "fail");
}

function validUrl(value: string | undefined, requireHttps: boolean) {
  if (!value) return false;
  try { const url = new URL(value); return requireHttps ? url.protocol === "https:" : /^https?:$/.test(url.protocol); } catch { return false; }
}
function pass(code: string, message: string): DeploymentCheck { return { code, status: "pass", message }; }
function warning(code: string, message: string): DeploymentCheck { return { code, status: "warning", message }; }
function fail(code: string, message: string): DeploymentCheck { return { code, status: "fail", message }; }

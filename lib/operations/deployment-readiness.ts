import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { getInternalOperationsConfigurationStatus } from "@/lib/beta-reports/internal-authorization";
import { authOriginMatchesCanonical, canonicalProductionOrigin } from "@/lib/operations/canonical-origin";
import { databaseCaCertificateStatus } from "@/lib/remote-evidence/postgres-config";

export const LATEST_DATABASE_MIGRATION = "1753266400000";

type Environment = Record<string, string | undefined>;
export type DeploymentCheck = { code: string; status: "pass" | "warning" | "fail"; message: string };
export type DeploymentReadinessOptions = { production: boolean; requireMigration?: boolean };

export function evaluateDeploymentReadiness(environment: Environment, input: boolean | DeploymentReadinessOptions): DeploymentCheck[] {
  const { production, requireMigration = false } = typeof input === "boolean" ? { production: input, requireMigration: false } : input;
  const checks: DeploymentCheck[] = [];
  const forbiddenPublic = Object.keys(environment).filter((name) => name.startsWith("NEXT_PUBLIC_") && /(DATABASE|SERVICE_ROLE|SECRET|PASSWORD|INTERNAL_REPORT)/.test(name));
  checks.push(forbiddenPublic.length ? fail("public_environment", "Forbidden sensitive NEXT_PUBLIC environment names are configured.") : pass("public_environment", "No forbidden public environment names are configured."));

  const site = production ? canonicalProductionOrigin(environment) : parseLocalOrProductionOrigin(environment.NEXT_PUBLIC_SITE_URL);
  checks.push(site ? pass("public_site", "The public site URL is a canonical origin for this mode.") : production ? fail("public_site", "A valid path-free HTTPS NEXT_PUBLIC_SITE_URL is required.") : warning("public_site", "NEXT_PUBLIC_SITE_URL is absent or invalid; local metadata fallback remains available."));

  const databaseReady = validPostgresUrl(environment.STEMFORGE_DATABASE_URL);
  checks.push(databaseReady ? pass("database_configuration", "The server-only runtime database connection is valid.") : production ? fail("database_configuration", "A valid server-only PostgreSQL runtime connection is required.") : warning("database_configuration", "Database configuration is optional for a credential-free local dry run."));
  if (production) {
    const caStatus = databaseCaCertificateStatus(environment.STEMFORGE_DATABASE_CA_CERT);
    checks.push(caStatus === "valid"
      ? pass("database_tls", "The server-only database CA certificate is valid for verified TLS.")
      : fail("database_tls", caStatus === "missing" ? "A server-only database CA certificate is required for production." : "The server-only database CA certificate is malformed."));
  }
  if (requireMigration) checks.push(validPostgresUrl(environment.STEMFORGE_DATABASE_MIGRATION_URL)
    ? pass("migration_configuration", "The migration-only database connection is named.")
    : fail("migration_configuration", "A valid migration-only PostgreSQL connection is required for migration verification."));

  const auth = getAuthFeatureConfiguration(environment);
  checks.push(auth.status === "misconfigured" || (production && auth.status !== "enabled")
    ? fail("authentication", production && auth.status === "disabled" ? "Authentication must be explicitly enabled for production readiness." : "Authentication is enabled but incomplete or invalid.")
    : pass("authentication", `Authentication configuration is coherently ${auth.status}.`));
  if (production && auth.status === "enabled") checks.push(authOriginMatchesCanonical(environment)
    ? pass("auth_origin", "Authentication uses the exact canonical production origin.")
    : fail("auth_origin", "STEMFORGE_AUTH_SITE_URL must exactly match NEXT_PUBLIC_SITE_URL."));

  const internal = getInternalOperationsConfigurationStatus(environment);
  checks.push(internal === "misconfigured" || (internal === "enabled" && auth.status !== "enabled")
    ? fail("internal_operations", "Internal operations are enabled without a complete trusted authorization configuration.")
    : pass("internal_operations", `Internal operations are safely ${internal}.`));

  checks.push(pass("migration_contract", `Latest required migration is ${LATEST_DATABASE_MIGRATION}.`));
  const providerProduction = environment.VERCEL_ENV === "production";
  checks.push(providerProduction ? pass("provider_environment", "Vercel reports the production environment.")
    : production ? warning("provider_environment", "Provider production scope must be confirmed in Vercel.") : pass("provider_environment", "Provider scope is not required for local verification."));
  checks.push(environment.VERCEL_GIT_COMMIT_SHA?.trim() || environment.STEMFORGE_BUILD_COMMIT?.trim()
    ? pass("build_identity", "A server-only build identity is available.")
    : warning("build_identity", "Build identity will be supplied by Vercel in deployment."));
  return checks;
}

export function deploymentIsReady(checks: DeploymentCheck[]) {
  return checks.every((check) => check.status !== "fail");
}

function parseLocalOrProductionOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch { return null; }
}
function validPostgresUrl(value: string | undefined) {
  if (!value?.trim()) return false;
  try { return /^postgres(?:ql)?:$/.test(new URL(value).protocol); } catch { return false; }
}
function pass(code: string, message: string): DeploymentCheck { return { code, status: "pass", message }; }
function warning(code: string, message: string): DeploymentCheck { return { code, status: "warning", message }; }
function fail(code: string, message: string): DeploymentCheck { return { code, status: "fail", message }; }

import "server-only";

import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { evaluateDeploymentReadiness, deploymentIsReady, LATEST_DATABASE_MIGRATION } from "@/lib/operations/deployment-readiness";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";

type PublicState = "ok" | "disabled" | "misconfigured" | "not_configured" | "unavailable" | "not_current";

export async function getPublicReadinessSnapshot(environment: NodeJS.ProcessEnv = process.env) {
  const production = environment.VERCEL_ENV === "production";
  const auth = getAuthFeatureConfiguration(environment);
  const checks: {
    application: PublicState;
    configuration: PublicState;
    authentication: PublicState;
    database: PublicState;
    migration: PublicState;
    reporting: PublicState;
  } = {
    application: "ok",
    configuration: deploymentIsReady(evaluateDeploymentReadiness(environment, { production, requireMigration: false })) ? "ok" : "misconfigured",
    authentication: auth.status === "enabled" ? "ok" : auth.status,
    database: environment.STEMFORGE_DATABASE_URL ? "unavailable" : "not_configured",
    migration: environment.STEMFORGE_DATABASE_URL ? "unavailable" : "not_configured",
    reporting: environment.STEMFORGE_DATABASE_URL ? "unavailable" : "not_configured",
  };

  if (environment.STEMFORGE_DATABASE_URL) {
    const pool = createRemoteEvidencePool(environment.STEMFORGE_DATABASE_URL);
    try {
      const result = await pool.query<{ migration_table_ready: boolean; reporting_ready: boolean; ssl_ready: boolean }>(`
        SELECT
          to_regclass('stemforge_remote_migrations.pgmigrations') IS NOT NULL AS migration_table_ready,
          to_regclass('stemforge_operations.beta_reports') IS NOT NULL
            AND to_regclass('stemforge_operations.beta_report_audit') IS NOT NULL AS reporting_ready,
          EXISTS(SELECT 1 FROM pg_stat_ssl WHERE pid = pg_backend_pid() AND ssl) AS ssl_ready
      `);
      const row = result.rows[0];
      checks.database = production && !row.ssl_ready ? "misconfigured" : "ok";
      const migrationReady = row.migration_table_ready && (await pool.query<{ ready: boolean }>(`
        SELECT EXISTS(
          SELECT 1 FROM stemforge_remote_migrations.pgmigrations
          WHERE name LIKE $1
        ) AS ready
      `, [`${LATEST_DATABASE_MIGRATION}%`])).rows[0]?.ready;
      checks.migration = migrationReady ? "ok" : "not_current";
      checks.reporting = row.reporting_ready ? "ok" : "not_current";
    } catch {
      checks.database = "unavailable";
      checks.migration = "unavailable";
      checks.reporting = "unavailable";
    } finally {
      await pool.end();
    }
  }

  const ready = production
    ? Object.values(checks).every((state) => state === "ok")
    : checks.configuration === "ok" && checks.database !== "unavailable" && checks.authentication !== "misconfigured";
  return { status: ready ? "ready" as const : "not_ready" as const, checks };
}

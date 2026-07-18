import "server-only";

import type { Pool } from "pg";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { getInternalOperationsConfigurationStatus } from "@/lib/beta-reports/internal-authorization.server";

export type InternalHealthState = "healthy" | "degraded" | "unavailable" | "disabled" | "misconfigured";

export type InternalHealthSnapshot = {
  checkedAt: string;
  application: InternalHealthState;
  database: InternalHealthState;
  authentication: InternalHealthState;
  reportingRepository: InternalHealthState;
  migration: InternalHealthState;
  internalReview: InternalHealthState;
};

export async function getInternalHealthSnapshot(pool: Pool): Promise<InternalHealthSnapshot> {
  const auth = getAuthFeatureConfiguration();
  const internal = getInternalOperationsConfigurationStatus();
  const snapshot: InternalHealthSnapshot = {
    checkedAt: new Date().toISOString(),
    application: "healthy",
    database: "unavailable",
    authentication: auth.status === "enabled" ? "healthy" : auth.status === "disabled" ? "disabled" : "misconfigured",
    reportingRepository: "unavailable",
    migration: "unavailable",
    internalReview: internal === "enabled" ? "healthy" : internal,
  };
  try {
    const result = await pool.query<{ table_ready: boolean; migration_ready: boolean }>(`
      SELECT
        to_regclass('stemforge_operations.beta_reports') IS NOT NULL
          AND to_regclass('stemforge_operations.beta_report_audit') IS NOT NULL AS table_ready,
        EXISTS(
          SELECT 1 FROM stemforge_remote_migrations.pgmigrations
          WHERE name = '1753266400000_beta_report_triage'
        ) AS migration_ready
    `);
    snapshot.database = "healthy";
    snapshot.reportingRepository = result.rows[0].table_ready ? "healthy" : "unavailable";
    snapshot.migration = result.rows[0].migration_ready ? "healthy" : "degraded";
  } catch {
    snapshot.database = "unavailable";
  }
  return snapshot;
}

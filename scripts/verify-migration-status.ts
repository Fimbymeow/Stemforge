import { loadEnvConfig } from "@next/env";
import { readConfiguredMigrationStatus } from "@/scripts/database/migration-status";

async function main() {
  loadEnvConfig(process.cwd());
  const status = await readConfiguredMigrationStatus();
  console.log(`STEM Forge migration status: expected=${status.expectedCount} applied=${status.appliedCount} pending=${status.pending.length} unexpected=${status.unexpected.length} ssl=${status.ssl ? "enabled" : "not_verified"}.`);
  if (!status.current) throw new Error("Migration status is not current. No database credentials were printed.");
  if (!status.ssl) throw new Error("Migration connection SSL could not be verified. No database credentials were printed.");
  console.log("Migration status is current. No database credentials were printed.");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration status verification failed. No database credentials were printed.");
  process.exitCode = 1;
});

import { loadEnvConfig } from "@next/env";
import { logServerOperationError } from "@/lib/operations/server-error-diagnostics";
import { readConfiguredMigrationStatus } from "@/scripts/database/migration-status";

async function main() {
  loadEnvConfig(process.cwd());
  const status = await readConfiguredMigrationStatus();
  console.log(`Orthic migration status: expected=${status.expectedCount} applied=${status.appliedCount} pending=${status.pending.length} unexpected=${status.unexpected.length} ssl=${status.ssl ? "enabled" : "not_verified"}.`);
  if (!status.current) {
    printMigrationList("Expected migrations", status.expected);
    printMigrationList("Applied migrations", status.applied);
    printMigrationList("Pending migrations", status.pending);
    printMigrationList("Unexpected migrations", status.unexpected);
  }
  if (!status.current) throw new Error("Migration status is not current. No database credentials were printed.");
  if (!status.ssl) throw new Error("Migration connection SSL could not be verified. No database credentials were printed.");
  console.log("Migration status is current. No database credentials were printed.");
}

function printMigrationList(label: string, migrations: readonly string[]) {
  console.log(`${label}:`);
  if (migrations.length === 0) {
    console.log("- none");
    return;
  }
  for (const migration of migrations) {
    console.log(`- ${safeMigrationLabel(migration)}`);
  }
}

function safeMigrationLabel(value: string) {
  return /^\d{1,20}_[a-z0-9_-]{1,160}$/.test(value)
    ? value
    : "[unsafe migration name omitted]";
}

void main().catch((error) => {
  logServerOperationError("/scripts/verify-migration-status", "read_migration_status", error);
  process.exitCode = 1;
});

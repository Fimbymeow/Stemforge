import { loadEnvConfig } from "@next/env";
import { migrateConfiguredDatabase, reportMigrationFailure } from "@/scripts/database/migration-command";

async function main() {
  loadEnvConfig(process.cwd());
  await migrateConfiguredDatabase(process.env);
  console.log("STEM Forge database migrations applied.");
}

void main().catch(() => reportMigrationFailure("STEM Forge database migration"));

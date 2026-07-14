import { loadEnvConfig } from "@next/env";
import { migrateConfiguredTestDatabase, reportMigrationFailure } from "@/scripts/database/migration-command";

async function main() {
  loadEnvConfig(process.cwd());
  await migrateConfiguredTestDatabase(process.env);
  console.log("STEM Forge migrations applied to the isolated test database.");
}

void main().catch(() => reportMigrationFailure("STEM Forge test database migration"));

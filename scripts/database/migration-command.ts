import { runRemoteEvidenceMigrations } from "@/scripts/database/migration-runner";
import { assertSafeTestDatabaseUrl } from "@/scripts/database/safety";

type Environment = Record<string, string | undefined>;
type MigrationRunner = (databaseUrl: string) => Promise<unknown>;

export async function migrateConfiguredDatabase(
  environment: Environment,
  migrate: MigrationRunner = runRemoteEvidenceMigrations,
) {
  const databaseUrl = environment.STEMFORGE_DATABASE_MIGRATION_URL;
  if (!databaseUrl) {
    throw new Error("STEMFORGE_DATABASE_MIGRATION_URL is required to apply production/development migrations.");
  }
  await migrate(databaseUrl);
}

export async function migrateConfiguredTestDatabase(
  environment: Environment,
  migrate: MigrationRunner = runRemoteEvidenceMigrations,
) {
  const databaseUrl = assertSafeTestDatabaseUrl(
    environment.STEMFORGE_TEST_DATABASE_URL,
    environment.STEMFORGE_DATABASE_URL,
    environment.STEMFORGE_ALLOW_REMOTE_TEST_DATABASE,
  );
  await migrate(databaseUrl);
}

export function reportMigrationFailure(label: string) {
  console.error(`${label} failed. No database credentials were printed.`);
  process.exitCode = 1;
}

import path from "node:path";
import { runner } from "node-pg-migrate";

export async function runRemoteEvidenceMigrations(databaseUrl: string) {
  return runner({
    databaseUrl,
    dir: path.resolve(process.cwd(), "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    migrationsSchema: "stemforge_remote_migrations",
    createMigrationsSchema: true,
    checkOrder: true,
    singleTransaction: true,
    log: () => undefined,
  });
}


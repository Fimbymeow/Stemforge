import path from "node:path";
import { runner } from "node-pg-migrate";
import { createPostgresClientConfig } from "@/lib/remote-evidence/postgres-config";

export async function runRemoteEvidenceMigrations(databaseUrl: string) {
  return runner({
    databaseUrl: createPostgresClientConfig(databaseUrl),
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

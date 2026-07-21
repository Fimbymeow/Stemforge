import { readdir } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { compareMigrationStatus } from "@/lib/operations/migration-status";
import { createPostgresClientConfig } from "@/lib/remote-evidence/postgres-config";

export async function readConfiguredMigrationStatus(environment: NodeJS.ProcessEnv = process.env) {
  const connectionString = environment.STEMFORGE_DATABASE_MIGRATION_URL;
  if (!connectionString) throw new Error("STEMFORGE_DATABASE_MIGRATION_URL is required for migration status verification.");
  const expected = (await readdir(path.resolve(process.cwd(), "migrations")))
    .filter((name) => /^\d+_[a-z0-9-]+\.js$/.test(name))
    .map((name) => name.slice(0, -3))
    .sort();
  const pool = new Pool({
    ...createPostgresClientConfig(connectionString),
    max: 1,
    connectionTimeoutMillis: 10_000,
  });
  try {
    const table = await pool.query<{ exists: boolean }>("SELECT to_regclass('stemforge_remote_migrations.pgmigrations') IS NOT NULL AS exists");
    const applied = table.rows[0]?.exists
      ? (await pool.query<{ name: string }>("SELECT name FROM stemforge_remote_migrations.pgmigrations ORDER BY run_on, id")).rows.map((row) => row.name)
      : [];
    const ssl = await pool.query<{ active: boolean }>("SELECT EXISTS(SELECT 1 FROM pg_stat_ssl WHERE pid = pg_backend_pid() AND ssl) AS active");
    return { ...compareMigrationStatus(expected, applied), ssl: ssl.rows[0]?.active === true };
  } finally {
    await pool.end();
  }
}

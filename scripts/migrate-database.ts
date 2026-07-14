import { runRemoteEvidenceMigrations } from "@/scripts/database/migration-runner";

const databaseUrl = process.env.STEMFORGE_DATABASE_MIGRATION_URL;
if (!databaseUrl) throw new Error("STEMFORGE_DATABASE_MIGRATION_URL is required to apply production/development migrations.");
await runRemoteEvidenceMigrations(databaseUrl);
console.log("Remote evidence migrations applied.");


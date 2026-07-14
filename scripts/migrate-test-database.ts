import { runRemoteEvidenceMigrations } from "@/scripts/database/migration-runner";
import { assertSafeTestDatabaseUrl } from "@/scripts/database/safety";

const databaseUrl = assertSafeTestDatabaseUrl(process.env.STEMFORGE_TEST_DATABASE_URL);
await runRemoteEvidenceMigrations(databaseUrl);
console.log("Remote evidence migrations applied to the isolated test database.");

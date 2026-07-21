import "server-only";

import { Pool } from "pg";
import { createPostgresClientConfig } from "@/lib/remote-evidence/postgres-config";

export function createRemoteEvidencePool(
  connectionString = process.env.STEMFORGE_DATABASE_URL,
  environment: Record<string, string | undefined> = process.env,
) {
  if (!connectionString) {
    throw new Error("STEMFORGE_DATABASE_URL is required only when the server-side remote evidence repository is invoked.");
  }
  return new Pool({
    ...createPostgresClientConfig(connectionString, environment),
    max: 5,
    connectionTimeoutMillis: 10_000,
  });
}

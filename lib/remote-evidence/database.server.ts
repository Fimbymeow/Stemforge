import "server-only";

import { Pool } from "pg";

export function createRemoteEvidencePool(connectionString = process.env.STEMFORGE_DATABASE_URL) {
  if (!connectionString) {
    throw new Error("STEMFORGE_DATABASE_URL is required only when the server-side remote evidence repository is invoked.");
  }
  return new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10_000 });
}


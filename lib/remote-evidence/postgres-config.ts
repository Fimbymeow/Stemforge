import type { ClientConfig } from "pg";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function createPostgresClientConfig(connectionString: string): ClientConfig {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("The database connection must be a valid PostgreSQL URI.");
  }
  if (!/^postgres(?:ql)?:$/.test(url.protocol)) {
    throw new Error("The database connection must be a valid PostgreSQL URI.");
  }

  return {
    connectionString,
    ...(!LOOPBACK_HOSTS.has(url.hostname) ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}

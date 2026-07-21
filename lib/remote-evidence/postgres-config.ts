import { X509Certificate } from "node:crypto";
import type { ClientConfig } from "pg";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
type Environment = Record<string, string | undefined>;

export function normalizeDatabaseCaCertificate(value: string | undefined) {
  if (!value?.trim()) return null;
  const normalized = value.replace(/\\n/g, "\n").trim();
  try {
    void new X509Certificate(normalized);
    return normalized;
  } catch {
    return null;
  }
}

export function databaseCaCertificateStatus(value: string | undefined): "valid" | "missing" | "malformed" {
  if (!value?.trim()) return "missing";
  return normalizeDatabaseCaCertificate(value) ? "valid" : "malformed";
}

export function createPostgresClientConfig(connectionString: string, environment: Environment = process.env): ClientConfig {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("The database connection must be a valid PostgreSQL URI.");
  }
  if (!/^postgres(?:ql)?:$/.test(url.protocol)) {
    throw new Error("The database connection must be a valid PostgreSQL URI.");
  }

  const remote = !LOOPBACK_HOSTS.has(url.hostname);
  const verifiedTlsRequired = remote && environment.VERCEL_ENV === "production";
  if (!verifiedTlsRequired) return { connectionString };

  const ca = normalizeDatabaseCaCertificate(environment.STEMFORGE_DATABASE_CA_CERT);
  if (!ca) throw new Error("A valid server-only database CA certificate is required for verified production TLS.");
  return { connectionString, ssl: { ca, rejectUnauthorized: true } };
}

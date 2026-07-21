import assert from "node:assert/strict";
import test from "node:test";
import { safeAuthRedirect } from "../lib/auth/redirects";
import { authOriginMatchesCanonical, canonicalProductionOrigin, parseCanonicalOrigin } from "../lib/operations/canonical-origin";
import { deploymentIsReady, evaluateDeploymentReadiness } from "../lib/operations/deployment-readiness";
import { compareMigrationStatus } from "../lib/operations/migration-status";
import { createPostgresClientConfig } from "../lib/remote-evidence/postgres-config";

const productionEnvironment = {
  NEXT_PUBLIC_SITE_URL: "https://stemforge.example",
  STEMFORGE_DATABASE_URL: "postgresql://db.example/stemforge",
  STEMFORGE_AUTH_ENABLED: "true",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  STEMFORGE_AUTH_SITE_URL: "https://stemforge.example",
  STEMFORGE_INTERNAL_REPORTS_ENABLED: "false",
  VERCEL_ENV: "production",
  VERCEL_GIT_COMMIT_SHA: "a".repeat(40),
};

test("canonical production origins require an exact path-free HTTPS origin", () => {
  assert.equal(parseCanonicalOrigin("https://stemforge.example"), "https://stemforge.example");
  assert.equal(parseCanonicalOrigin("https://stemforge.example/"), "https://stemforge.example");
  assert.equal(parseCanonicalOrigin("http://stemforge.example"), null);
  assert.equal(parseCanonicalOrigin("//evil.example"), null);
  assert.equal(parseCanonicalOrigin("https://stemforge.example/path"), null);
  assert.equal(parseCanonicalOrigin("https://user:secret@stemforge.example"), null);
  assert.equal(canonicalProductionOrigin(productionEnvironment), "https://stemforge.example");
  assert.equal(authOriginMatchesCanonical(productionEnvironment), true);
});

test("authentication redirects allow only the bounded account destinations", () => {
  assert.equal(safeAuthRedirect("/account"), "/account");
  assert.equal(safeAuthRedirect("/account/update-password"), "/account/update-password");
  for (const unsafe of ["https://evil.example", "//evil.example", "/account/../internal", "%2F%2Fevil.example", "not a URL", null]) {
    assert.equal(safeAuthRedirect(unsafe), "/account");
  }
});

test("production readiness separates runtime and migration-only connections", () => {
  const runtime = evaluateDeploymentReadiness(productionEnvironment, { production: true });
  assert.equal(deploymentIsReady(runtime), true);
  assert.equal(runtime.some((check) => check.code === "migration_configuration"), false);
  const migration = evaluateDeploymentReadiness(productionEnvironment, { production: true, requireMigration: true });
  assert.equal(deploymentIsReady(migration), false);
  const complete = evaluateDeploymentReadiness({ ...productionEnvironment, STEMFORGE_DATABASE_MIGRATION_URL: "postgresql://migration-db.example/stemforge" }, { production: true, requireMigration: true });
  assert.equal(deploymentIsReady(complete), true);
});

test("production readiness rejects canonical/auth origin drift without exposing values", () => {
  const marker = "sensitive-origin-marker";
  const checks = evaluateDeploymentReadiness({
    ...productionEnvironment,
    NEXT_PUBLIC_SITE_URL: `https://${marker}.example`,
    STEMFORGE_AUTH_SITE_URL: "https://other.example",
  }, { production: true });
  assert.equal(deploymentIsReady(checks), false);
  assert.equal(JSON.stringify(checks).includes(marker), false);
});

test("migration status fails closed for pending or unexpected schema history", () => {
  assert.deepEqual(compareMigrationStatus(["001_one", "002_two"], ["001_one"]), {
    expectedCount: 2,
    appliedCount: 1,
    pending: ["002_two"],
    unexpected: [],
    current: false,
  });
  assert.deepEqual(compareMigrationStatus(["001_one"], ["001_one", "002_future"]), {
    expectedCount: 1,
    appliedCount: 2,
    pending: [],
    unexpected: ["002_future"],
    current: false,
  });
});

test("remote PostgreSQL uses verified TLS without modifying the plain pooler URI", () => {
  const connectionString = "postgresql://pooler.example:6543/stemforge";
  assert.deepEqual(createPostgresClientConfig(connectionString), {
    connectionString,
    ssl: { rejectUnauthorized: true },
  });
});

test("loopback PostgreSQL keeps disposable and local connections non-TLS", () => {
  for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
    const connectionString = `postgresql://stemforge@${host}:5432/stemforge_test`;
    assert.deepEqual(createPostgresClientConfig(connectionString), { connectionString });
  }
});

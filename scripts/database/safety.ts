export function assertSafeTestDatabaseUrl(
  value: string | undefined,
  developmentUrl = process.env.STEMFORGE_DATABASE_URL,
  allowRemoteTestDatabase = process.env.STEMFORGE_ALLOW_REMOTE_TEST_DATABASE,
) {
  if (!value) throw new Error("STEMFORGE_TEST_DATABASE_URL is required for test database operations.");
  if (developmentUrl && normalized(value) === normalized(developmentUrl)) {
    throw new Error("The test database URL must not match STEMFORGE_DATABASE_URL.");
  }
  const url = new URL(value);
  const databaseName = url.pathname.replace(/^\//, "").toLowerCase();
  if (!databaseName.includes("test")) throw new Error("Refusing database test operation: database name must contain 'test'.");
  const local = url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "::1";
  if (!local && allowRemoteTestDatabase !== "1") {
    throw new Error("Refusing remote test database. Set STEMFORGE_ALLOW_REMOTE_TEST_DATABASE=1 only for a dedicated disposable test database.");
  }
  return value;
}

function normalized(value: string) {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

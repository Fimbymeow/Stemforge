import assert from "node:assert/strict";
import test from "node:test";
import {
  migrateConfiguredDatabase,
  migrateConfiguredTestDatabase,
} from "../scripts/database/migration-command";

test("development migration requires the privileged migration URL", async () => {
  await assert.rejects(migrateConfiguredDatabase({}, async () => undefined), /STEMFORGE_DATABASE_MIGRATION_URL/);
});

test("development migration forwards its configured URL without logging or rewriting it", async () => {
  const configured = "postgresql://migration-user:secret@127.0.0.1:5432/stemforge_development";
  let received = "";
  await migrateConfiguredDatabase(
    { STEMFORGE_DATABASE_MIGRATION_URL: configured },
    async (databaseUrl) => { received = databaseUrl; },
  );
  assert.equal(received, configured);
});

test("test migration preserves development-target and remote-target safeguards", async () => {
  const development = "postgresql://app:secret@127.0.0.1:5432/stemforge_development";
  await assert.rejects(migrateConfiguredTestDatabase({
    STEMFORGE_TEST_DATABASE_URL: development,
    STEMFORGE_DATABASE_URL: development,
  }, async () => undefined), /must not match/);
  await assert.rejects(migrateConfiguredTestDatabase({
    STEMFORGE_TEST_DATABASE_URL: "postgresql://test:secret@database.example.com:5432/stemforge_test",
  }, async () => undefined), /Refusing remote test database/);
});

test("remote test migration still requires explicit opt-in", async () => {
  const configured = "postgresql://test:secret@database.example.com:5432/stemforge_test";
  let received = "";
  await migrateConfiguredTestDatabase({
    STEMFORGE_TEST_DATABASE_URL: configured,
    STEMFORGE_ALLOW_REMOTE_TEST_DATABASE: "1",
  }, async (databaseUrl) => { received = databaseUrl; });
  assert.equal(received, configured);
});

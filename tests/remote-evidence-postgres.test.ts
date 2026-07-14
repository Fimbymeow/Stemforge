import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import { Pool } from "pg";
import { PostgresRemoteEvidenceRepository } from "../lib/remote-evidence/postgres-repository.server";
import { PostgresOwnerMappingRepository } from "../lib/auth/postgres-owner-repository.server";
import { runRemoteEvidenceMigrations } from "../scripts/database/migration-runner";
import { assertSafeTestDatabaseUrl } from "../scripts/database/safety";
import { attempt, supportEvent } from "./progress-fixtures";
import type { AchievementSnapshot, ProgressPayload } from "../lib/progress/types";

let postgres: EmbeddedPostgres;
let pool: Pool;
let repository: PostgresRemoteEvidenceRepository;
let ownerRepository: PostgresOwnerMappingRepository;
let databaseUrl: string;
let databaseDir: string;

before(async () => {
  const port = await availablePort();
  const user = "stemforge_test";
  const password = `test_${randomUUID()}`;
  const database = `stemforge_remote_test_${randomUUID().replaceAll("-", "")}`;
  databaseDir = path.join(os.tmpdir(), `stemforge-postgres-${randomUUID()}`);
  postgres = new EmbeddedPostgres({
    databaseDir,
    port,
    user,
    password,
    persistent: true,
    onLog: () => undefined,
    onError: (message) => console.error("[embedded-postgres]", message),
  });
  await postgres.initialise();
  await postgres.start();
  await postgres.createDatabase(database);
  databaseUrl = assertSafeTestDatabaseUrl(`postgresql://${user}:${encodeURIComponent(password)}@127.0.0.1:${port}/${database}`, "postgresql://dev@127.0.0.1/stemforge_development");
  await runRemoteEvidenceMigrations(databaseUrl);
  pool = new Pool({ connectionString: databaseUrl, max: 4 });
  repository = new PostgresRemoteEvidenceRepository(pool);
  ownerRepository = new PostgresOwnerMappingRepository(pool);
});

after(async () => {
  await pool?.end();
  await postgres?.stop();
  if (databaseDir?.startsWith(os.tmpdir())) {
    await rm(databaseDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

test("clean migrations create the append-only evidence schema", async () => {
  const result = await pool.query<{ table_name: string }>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'stemforge_remote' ORDER BY table_name
  `);
  assert.deepEqual(result.rows.map((row) => row.table_name), [
    "achievement_snapshots", "evidence_conflicts", "question_attempts", "support_events",
  ]);
});

test("clean migrations create the immutable owner schema", async () => {
  const result = await pool.query<{ table_name: string }>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'stemforge_identity' ORDER BY table_name
  `);
  assert.deepEqual(result.rows.map((row) => row.table_name), ["application_owners", "external_auth_identities"]);
});

test("first and repeated identity resolution returns one stable owner", async () => {
  const identity = { verified: true as const, provider: "supabase", subject: `user_${randomUUID()}` };
  const first = await ownerRepository.getOrCreateOwner(identity);
  assert.equal(await ownerRepository.getOrCreateOwner(identity), first);
  const count = await pool.query<{ count: string }>("SELECT count(*)::text AS count FROM stemforge_identity.application_owners WHERE owner_id = $1", [first]);
  assert.equal(count.rows[0].count, "1");
});

test("concurrent first resolution is race-safe and leaves no orphan owner", async () => {
  const before = await pool.query<{ count: string }>("SELECT count(*)::text AS count FROM stemforge_identity.application_owners");
  const identity = { verified: true as const, provider: "supabase", subject: `concurrent_${randomUUID()}` };
  const owners = await Promise.all(Array.from({ length: 8 }, () => ownerRepository.getOrCreateOwner(identity)));
  assert.equal(new Set(owners).size, 1);
  const after = await pool.query<{ count: string }>("SELECT count(*)::text AS count FROM stemforge_identity.application_owners");
  assert.equal(BigInt(after.rows[0].count) - BigInt(before.rows[0].count), BigInt(1));
});

test("providers are isolated and separate identities receive separate owners", async () => {
  const subject = `shared_${randomUUID()}`;
  const supabaseOwner = await ownerRepository.getOrCreateOwner({ verified: true, provider: "supabase", subject });
  const futureOwner = await ownerRepository.getOrCreateOwner({ verified: true, provider: "future_provider", subject });
  const secondSupabaseOwner = await ownerRepository.getOrCreateOwner({ verified: true, provider: "supabase", subject: `${subject}_two` });
  assert.notEqual(supabaseOwner, futureOwner);
  assert.notEqual(supabaseOwner, secondSupabaseOwner);
});

test("identity mapping cannot be reassigned and stores no mutable email/profile", async () => {
  const identity = { verified: true as const, provider: "supabase", subject: `immutable_${randomUUID()}` };
  const owner = await ownerRepository.getOrCreateOwner(identity);
  const other = await ownerRepository.getOrCreateOwner({ verified: true, provider: "supabase", subject: `${identity.subject}_other` });
  await assert.rejects(pool.query(`
    UPDATE stemforge_identity.external_auth_identities SET owner_id = $1
    WHERE provider = $2 AND provider_subject = $3
  `, [other, identity.provider, identity.subject]), /immutable/i);
  const columns = await pool.query<{ column_name: string }>(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'stemforge_identity' AND table_name = 'external_auth_identities'
  `);
  assert.equal(columns.rows.some((row) => /email|profile/i.test(row.column_name)), false);
  assert.notEqual(owner, other);
});

test("owner creation has no remote evidence side effect", async () => {
  const before = await evidenceRowCount();
  await ownerRepository.getOrCreateOwner({ verified: true, provider: "supabase", subject: `no_evidence_${randomUUID()}` });
  assert.equal(await evidenceRowCount(), before);
});

test("attempts, support events and snapshots round-trip without payload loss", async () => {
  const owner = ownerId();
  const source = batch(
    [attempt({ eventId: "attempt_round_trip", versionEvidence: { kind: "unknown_legacy", questionVersion: null } })],
    [supportEvent({ eventId: "support_round_trip" })],
    [snapshot({ snapshotId: "snapshot_round_trip" })],
  );
  const appended = await repository.append(owner, source);
  assert.equal(appended.accepted.length, 3);
  assert.deepEqual(appended.rejected, []);
  const stored = await repository.read(owner);
  assert.deepEqual(stored.payload, source);
});

test("identical retries are idempotent", async () => {
  const owner = ownerId();
  const source = batch([attempt({ eventId: "attempt_retry" })]);
  assert.equal((await repository.append(owner, source)).accepted.length, 1);
  const retry = await repository.append(owner, structuredClone(source));
  assert.deepEqual(retry.duplicates, [{ kind: "attempt", eventId: "attempt_retry" }]);
  assert.equal((await repository.read(owner)).payload.data.attempts.length, 1);
});

test("same-ID conflicts preserve accepted evidence and repeated conflicts deduplicate", async () => {
  const owner = ownerId();
  const accepted = attempt({ eventId: "attempt_conflict", answer: "first" });
  const incoming = attempt({ eventId: "attempt_conflict", answer: "different" });
  await repository.append(owner, batch([accepted]));
  const first = await repository.append(owner, batch([incoming]));
  const repeated = await repository.append(owner, batch([incoming]));
  assert.equal(first.conflicts.length, 1);
  assert.equal(repeated.conflicts[0].conflictId, first.conflicts[0].conflictId);
  assert.deepEqual((await repository.read(owner)).payload.data.attempts, [accepted]);
  const count = await pool.query<{ count: string }>("SELECT count(*)::text AS count FROM stemforge_remote.evidence_conflicts WHERE owner_id = $1", [owner]);
  assert.equal(count.rows[0].count, "1");
});

test("a mixed batch accepts new evidence while reporting a conflict", async () => {
  const owner = ownerId();
  await repository.append(owner, batch([attempt({ eventId: "attempt_existing", answer: "accepted" })]));
  const mixed = batch([
    attempt({ eventId: "attempt_existing", answer: "conflicting" }),
    attempt({ eventId: "attempt_new", answer: "new" }),
  ]);
  const result = await repository.append(owner, mixed);
  assert.deepEqual(result.accepted.map((item) => item.eventId), ["attempt_new"]);
  assert.deepEqual(result.conflicts.map((item) => item.eventId), ["attempt_existing"]);
  assert.equal((await repository.read(owner)).payload.data.attempts.length, 2);
});

test("owners are isolated and may use the same deterministic event ID", async () => {
  const ownerA = ownerId();
  const ownerB = ownerId();
  const shared = attempt({ eventId: "migrated_attempt_0_12345678" });
  assert.equal((await repository.append(ownerA, batch([shared]))).accepted.length, 1);
  assert.equal((await repository.append(ownerB, batch([shared]))).accepted.length, 1);
  assert.equal((await repository.read(ownerA)).payload.data.attempts.length, 1);
  assert.equal((await repository.read(ownerB)).payload.data.attempts.length, 1);
  assert.equal((await repository.read(ownerId())).payload.data.attempts.length, 0);
});

test("trusted receive timestamps and global cursors support deterministic incremental reads", async () => {
  const owner = ownerId();
  const clientFuture = attempt({ eventId: "attempt_cursor_1", attemptedAt: "2099-01-01T00:00:00.000Z" });
  const first = await repository.append(owner, batch([clientFuture]));
  const cursor = first.accepted[0].receiveCursor;
  assert.notEqual(first.accepted[0].receivedAt, clientFuture.attemptedAt);
  await repository.append(owner, batch([], [supportEvent({ eventId: "support_cursor_2", occurredAt: "2000-01-01T00:00:00.000Z" })]));
  const incremental = await repository.read(owner, cursor);
  assert.deepEqual(incremental.records.map((item) => item.eventId), ["support_cursor_2"]);
  assert.ok(BigInt(incremental.nextCursor!) > BigInt(cursor));
});

test("database triggers reject update of accepted evidence", async () => {
  const owner = ownerId();
  await repository.append(owner, batch([attempt({ eventId: "attempt_no_update" })]));
  await assert.rejects(pool.query("UPDATE stemforge_remote.question_attempts SET event_id = 'changed' WHERE owner_id = $1", [owner]), /append-only/i);
});

test("database triggers reject deletion of accepted evidence", async () => {
  const owner = ownerId();
  await repository.append(owner, batch([], [supportEvent({ eventId: "support_no_delete" })]));
  await assert.rejects(pool.query("DELETE FROM stemforge_remote.support_events WHERE owner_id = $1", [owner]), /append-only/i);
});

test("database triggers reject truncation and reads remain deterministic", async () => {
  await assert.rejects(pool.query("TRUNCATE stemforge_remote.achievement_snapshots"), /append-only/i);
  const owner = ownerId();
  await repository.append(owner, batch([
    attempt({ eventId: "attempt_order_b" }),
    attempt({ eventId: "attempt_order_a", sequence: 2 }),
  ]));
  const first = await repository.read(owner);
  const second = await repository.read(owner);
  assert.deepEqual(first, second);
  assert.deepEqual(first.payload.data.attempts.map((item) => item.eventId), ["attempt_order_b", "attempt_order_a"]);
});

function ownerId() { return `owner_${randomUUID()}`; }

function batch(
  attempts = [attempt()],
  supportEvents = [] as ReturnType<typeof supportEvent>[],
  achievementSnapshots = [] as AchievementSnapshot[],
): ProgressPayload {
  return { version: 4, data: { attempts, supportEvents, achievementSnapshots } };
}

function snapshot(overrides: Partial<AchievementSnapshot> = {}): AchievementSnapshot {
  return {
    snapshotId: "snapshot_test_1",
    kind: "path_completed",
    subjectId: "higher-maths",
    courseId: "calculus",
    pathId: "basic-differentiation",
    pathVersion: 1,
    achievedAt: "2026-07-14T10:00:00.000Z",
    masteryScore: 72,
    independentPerformancePercentage: 75,
    completionCount: 8,
    totalRequiredCount: 8,
    source: "derived_current",
    ...overrides,
  };
}

async function availablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("Could not reserve a PostgreSQL test port."));
      server.close(() => resolve(address.port));
    });
  });
}

async function evidenceRowCount() {
  const result = await pool.query<{ count: string }>(`
    SELECT (
      (SELECT count(*) FROM stemforge_remote.question_attempts) +
      (SELECT count(*) FROM stemforge_remote.support_events) +
      (SELECT count(*) FROM stemforge_remote.achievement_snapshots) +
      (SELECT count(*) FROM stemforge_remote.evidence_conflicts)
    )::text AS count
  `);
  return result.rows[0].count;
}

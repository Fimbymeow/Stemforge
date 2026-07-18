import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import { Pool } from "pg";
import { runner } from "node-pg-migrate";
import { PostgresRemoteEvidenceRepository } from "../lib/remote-evidence/postgres-repository.server";
import { PostgresOwnerMappingRepository } from "../lib/auth/postgres-owner-repository.server";
import { PostgresAccountDataRepository } from "../lib/account-data/postgres-account-data.server";
import { PostgresBetaReportRepository, BetaReportRateLimitError } from "../lib/beta-reports/report-repository.server";
import { BETA_REPORT_SCHEMA_VERSION, type ReportDiagnosticContext } from "../lib/beta-reports/report-types";
import { AccountDataAccessError } from "../lib/account-data/types";
import { runRemoteEvidenceMigrations } from "../scripts/database/migration-runner";
import { assertSafeTestDatabaseUrl } from "../scripts/database/safety";
import { attempt, supportEvent } from "./progress-fixtures";
import type { AchievementSnapshot, ProgressPayload } from "../lib/progress/types";

let postgres: EmbeddedPostgres;
let pool: Pool;
let repository: PostgresRemoteEvidenceRepository;
let ownerRepository: PostgresOwnerMappingRepository;
let accountDataRepository: PostgresAccountDataRepository;
let betaReportRepository: PostgresBetaReportRepository;
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
  accountDataRepository = new PostgresAccountDataRepository(pool);
  betaReportRepository = new PostgresBetaReportRepository(pool);
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

test("clean migrations create the private beta operations schema", async () => {
  const result = await pool.query<{ table_name: string }>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'stemforge_operations' ORDER BY table_name
  `);
  assert.deepEqual(result.rows.map((row) => row.table_name), ["beta_reports"]);
});

test("beta report repository stores guest and authenticated reports without evidence side effects", async () => {
  const owner = await ownerId();
  const before = await evidenceRowCount();
  const guestReport = await betaReportRepository.createReport({
    ownerId: null,
    request: betaReportRequest({ guestSessionId: `guest_${randomUUID().replaceAll("-", "")}` }),
    diagnosticContext: betaDiagnostic(),
  });
  const ownerReport = await betaReportRepository.createReport({
    ownerId: owner,
    request: betaReportRequest({ kind: "account_issue", guestSessionId: null }),
    diagnosticContext: betaDiagnostic({ authState: "authenticated", pageArea: "account" }),
  });
  assert.match(guestReport, /^SF-[A-Z0-9]{10}$/);
  assert.match(ownerReport, /^SF-[A-Z0-9]{10}$/);
  assert.equal(await evidenceRowCount(), before);
  const stored = await betaReportRepository.getReport(ownerReport);
  assert.equal(stored?.ownerId, owner);
  assert.equal(stored?.userMessage, "Beta tester report body.");
});

test("beta report repository rate limits repeated guest reports", async () => {
  const guestSessionId = `guest_${randomUUID().replaceAll("-", "")}`;
  for (let index = 0; index < 5; index += 1) {
    await betaReportRepository.createReport({
      ownerId: null,
      request: betaReportRequest({ guestSessionId, userMessage: `Beta tester report ${index}.` }),
      diagnosticContext: betaDiagnostic(),
    });
  }
  await assert.rejects(
    betaReportRepository.createReport({ ownerId: null, request: betaReportRequest({ guestSessionId }), diagnosticContext: betaDiagnostic() }),
    (error) => error instanceof BetaReportRateLimitError,
  );
});

test("beta report repository enforces status workflow", async () => {
  const reportId = await betaReportRepository.createReport({
    ownerId: null,
    request: betaReportRequest({ guestSessionId: `guest_${randomUUID().replaceAll("-", "")}` }),
    diagnosticContext: betaDiagnostic(),
  });
  const triaged = await betaReportRepository.updateStatus(reportId, "triaged");
  assert.equal(triaged?.status, "triaged");
  await assert.rejects(betaReportRepository.updateStatus(reportId, "resolved"), /Invalid beta report status transition/);
  const inProgress = await betaReportRepository.updateStatus(reportId, "in_progress");
  assert.equal(inProgress?.status, "in_progress");
  const resolved = await betaReportRepository.updateStatus(reportId, "resolved", "Fixed in a private beta patch.");
  assert.equal(resolved?.status, "resolved");
  assert.equal(resolved?.resolutionSummary, "Fixed in a private beta patch.");
});

test("all four remote owner foreign keys are present, not yet validated and enforce new rows", async () => {
  const constraints = await pool.query<{ conname: string; convalidated: boolean }>(`
    SELECT conname, convalidated FROM pg_constraint
    WHERE conname IN (
      'question_attempts_owner_fk', 'support_events_owner_fk',
      'achievement_snapshots_owner_fk', 'evidence_conflicts_owner_fk'
    ) ORDER BY conname
  `);
  assert.equal(constraints.rows.length, 4);
  assert.equal(constraints.rows.every((item) => item.convalidated === false), true);
  const invalidOwner = "owner_00000000000000000000000000000000";
  await assert.rejects(pool.query(
    "INSERT INTO stemforge_remote.question_attempts (owner_id, event_id, payload) VALUES ($1, 'invalid_owner_attempt', '{}'::jsonb)",
    [invalidOwner],
  ), /foreign key/i);
  await assert.rejects(pool.query(
    "INSERT INTO stemforge_remote.support_events (owner_id, event_id, payload) VALUES ($1, 'invalid_owner_support', '{}'::jsonb)",
    [invalidOwner],
  ), /foreign key/i);
  await assert.rejects(pool.query(
    "INSERT INTO stemforge_remote.achievement_snapshots (owner_id, event_id, payload) VALUES ($1, 'invalid_owner_snapshot', '{}'::jsonb)",
    [invalidOwner],
  ), /foreign key/i);
  await assert.rejects(pool.query(`
    INSERT INTO stemforge_remote.evidence_conflicts
      (owner_id, evidence_kind, event_id, accepted_payload_hash, incoming_payload)
    VALUES ($1, 'attempt', 'invalid_owner_conflict', $2, '{}'::jsonb)
  `, [invalidOwner, "0".repeat(64)]), /foreign key/i);
});

test("owner-integrity migration preserves a historical pre-auth row while enforcing future inserts", async () => {
  const historicalDatabase = `stemforge_historical_test_${randomUUID().replaceAll("-", "")}`;
  await postgres.createDatabase(historicalDatabase);
  const historicalUrl = new URL(databaseUrl);
  historicalUrl.pathname = `/${historicalDatabase}`;
  await runner({
    databaseUrl: historicalUrl.toString(),
    dir: path.resolve(process.cwd(), "migrations"),
    direction: "up",
    count: 2,
    migrationsTable: "pgmigrations",
    migrationsSchema: "stemforge_remote_migrations",
    createMigrationsSchema: true,
    checkOrder: true,
    singleTransaction: true,
    log: () => undefined,
  });
  const historicalPool = new Pool({ connectionString: historicalUrl.toString() });
  try {
    const oldOwner = "pre_auth_historical_owner";
    await historicalPool.query(
      "INSERT INTO stemforge_remote.question_attempts (owner_id, event_id, payload) VALUES ($1, 'historical_attempt', '{}'::jsonb)",
      [oldOwner],
    );
    await runRemoteEvidenceMigrations(historicalUrl.toString());
    const retained = await historicalPool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM stemforge_remote.question_attempts WHERE owner_id = $1",
      [oldOwner],
    );
    assert.equal(retained.rows[0].count, "1");
    await assert.rejects(historicalPool.query(
      "INSERT INTO stemforge_remote.question_attempts (owner_id, event_id, payload) VALUES ($1, 'new_invalid_attempt', '{}'::jsonb)",
      [oldOwner],
    ), /foreign key/i);
  } finally {
    await historicalPool.end();
  }
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
  const owner = await ownerId();
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
  const owner = await ownerId();
  const source = batch([attempt({ eventId: "attempt_retry" })]);
  const first = await repository.append(owner, source);
  assert.equal(first.accepted.length, 1);
  const retry = await repository.append(owner, structuredClone(source));
  assert.deepEqual(retry.duplicates, [first.accepted[0]]);
  assert.equal((await repository.read(owner)).payload.data.attempts.length, 1);
});

test("same-ID conflicts preserve accepted evidence and repeated conflicts deduplicate", async () => {
  const owner = await ownerId();
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
  const owner = await ownerId();
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

test("an unexpected insert failure rolls back earlier valid records in the batch", async () => {
  const owner = await ownerId();
  await pool.query(`
    CREATE FUNCTION stemforge_remote.reject_test_support_insert()
    RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      RAISE EXCEPTION 'deliberate integration failure';
    END; $$;
    CREATE TRIGGER support_events_test_failure
      BEFORE INSERT ON stemforge_remote.support_events
      FOR EACH ROW WHEN (NEW.event_id = 'support_force_rollback')
      EXECUTE FUNCTION stemforge_remote.reject_test_support_insert();
  `);
  try {
    await assert.rejects(repository.append(owner, batch(
      [attempt({ eventId: "attempt_should_rollback" })],
      [supportEvent({ eventId: "support_force_rollback" })],
    )), /deliberate integration failure/);
    assert.equal((await repository.read(owner)).records.length, 0);
  } finally {
    await pool.query(`
      DROP TRIGGER support_events_test_failure ON stemforge_remote.support_events;
      DROP FUNCTION stemforge_remote.reject_test_support_insert();
    `);
  }
});

test("owners are isolated and may use the same deterministic event ID", async () => {
  const ownerA = await ownerId();
  const ownerB = await ownerId();
  const shared = attempt({ eventId: "migrated_attempt_0_12345678" });
  assert.equal((await repository.append(ownerA, batch([shared]))).accepted.length, 1);
  assert.equal((await repository.append(ownerB, batch([shared]))).accepted.length, 1);
  assert.equal((await repository.read(ownerA)).payload.data.attempts.length, 1);
  assert.equal((await repository.read(ownerB)).payload.data.attempts.length, 1);
  assert.equal((await repository.read(await ownerId())).payload.data.attempts.length, 0);
});

test("trusted receive timestamps and global cursors support deterministic incremental reads", async () => {
  const owner = await ownerId();
  const clientFuture = attempt({ eventId: "attempt_cursor_1", attemptedAt: "2099-01-01T00:00:00.000Z" });
  const first = await repository.append(owner, batch([clientFuture]));
  const cursor = first.accepted[0].receiveCursor;
  assert.notEqual(first.accepted[0].receivedAt, clientFuture.attemptedAt);
  await repository.append(owner, batch([], [supportEvent({ eventId: "support_cursor_2", occurredAt: "2000-01-01T00:00:00.000Z" })]));
  const incremental = await repository.read(owner, cursor);
  assert.deepEqual(incremental.records.map((item) => item.eventId), ["support_cursor_2"]);
  assert.ok(BigInt(incremental.nextCursor!) > BigInt(cursor));
});

test("paged reads are owner-scoped, cursor-exclusive and include retained conflicts", async () => {
  const owner = await ownerId();
  const otherOwner = await ownerId();
  await repository.append(otherOwner, batch([attempt({ eventId: "attempt_page_other" })]));
  await repository.append(owner, batch([
    attempt({ eventId: "attempt_page_1", answer: "accepted" }),
    attempt({ eventId: "attempt_page_2" }),
  ]));
  await repository.append(owner, batch([attempt({ eventId: "attempt_page_1", answer: "retained conflict" })]));

  const first = await repository.readPage(owner, undefined, 2);
  assert.equal(first.records.length, 2);
  const second = await repository.readPage(owner, first.records.at(-1)!.receiveCursor, 2);
  assert.equal(second.records.length, 1);
  assert.equal(second.records[0].disposition, "conflict_retained");
  assert.equal(second.records[0].eventId, "attempt_page_1");
  assert.equal((second.records[0].evidence as ReturnType<typeof attempt>).answer, "retained conflict");
  assert.equal([...first.records, ...second.records].some((item) => item.eventId === "attempt_page_other"), false);
  assert.deepEqual(await repository.readPage(owner, second.records[0].receiveCursor, 2), { records: [] });
});

test("concurrent owner appends commit in receive-cursor order without pagination gaps", async () => {
  const owner = await ownerId();
  const results = await Promise.all(Array.from({ length: 12 }, (_, index) =>
    repository.append(owner, batch([attempt({ eventId: `attempt_concurrent_cursor_${index}` })])),
  ));
  const acknowledged = results.flatMap((result) => result.accepted);
  assert.equal(acknowledged.length, 12);
  assert.equal(new Set(acknowledged.map((item) => item.receiveCursor)).size, 12);

  const seen: string[] = [];
  let cursor: string | undefined;
  while (true) {
    const page = await repository.readPage(owner, cursor, 3);
    if (page.records.length === 0) break;
    seen.push(...page.records.map((item) => item.eventId));
    const next = page.records.at(-1)!.receiveCursor;
    if (cursor) assert.ok(BigInt(next) > BigInt(cursor));
    cursor = next;
  }
  assert.equal(seen.length, 12);
  assert.equal(new Set(seen).size, 12);
});

test("database triggers reject update of accepted evidence", async () => {
  const owner = await ownerId();
  await repository.append(owner, batch([attempt({ eventId: "attempt_no_update" })]));
  await assert.rejects(pool.query("UPDATE stemforge_remote.question_attempts SET event_id = 'changed' WHERE owner_id = $1", [owner]), /append-only/i);
});

test("database triggers reject deletion of accepted evidence", async () => {
  const owner = await ownerId();
  await repository.append(owner, batch([], [supportEvent({ eventId: "support_no_delete" })]));
  await assert.rejects(pool.query("DELETE FROM stemforge_remote.support_events WHERE owner_id = $1", [owner]), /append-only/i);
});

test("database triggers reject truncation and reads remain deterministic", async () => {
  await assert.rejects(pool.query("TRUNCATE stemforge_remote.achievement_snapshots"), /append-only/i);
  const owner = await ownerId();
  await repository.append(owner, batch([
    attempt({ eventId: "attempt_order_b" }),
    attempt({ eventId: "attempt_order_a", sequence: 2 }),
  ]));
  const first = await repository.read(owner);
  const second = await repository.read(owner);
  assert.deepEqual(first, second);
  assert.deepEqual(first.payload.data.attempts.map((item) => item.eventId), ["attempt_order_b", "attempt_order_a"]);
});

test("account generations fence appends and reads after owner state creation", async () => {
  const owner = await ownerId();
  const state = await accountDataRepository.readState(owner);
  assert.equal(state.generation, "1");
  assert.equal((await repository.append(owner, batch([attempt({ eventId: "attempt_generation_ok" })]), "1")).accepted.length, 1);
  await assert.rejects(
    repository.append(owner, batch([attempt({ eventId: "attempt_generation_stale" })]), "2"),
    (error) => error instanceof AccountDataAccessError && error.code === "account_generation_mismatch",
  );
  await assert.rejects(
    repository.readPage(owner, undefined, 10, "2"),
    (error) => error instanceof AccountDataAccessError && error.code === "account_generation_mismatch",
  );
});

test("scheduled erasure pauses account writes and cancellation restores active generation", async () => {
  const owner = await ownerId();
  const request = await accountDataRepository.startRequest(owner);
  const proof = await accountDataRepository.recordReauthentication(owner, request.requestId, "session_binding_cancel");
  const scheduled = await accountDataRepository.confirmRequest(owner, request.requestId, proof.proof, "session_binding_cancel");
  assert.equal(scheduled.status, "scheduled");
  await assert.rejects(
    repository.append(owner, batch([attempt({ eventId: "attempt_paused_for_cancel" })]), "1"),
    (error) => error instanceof AccountDataAccessError && error.code === "erasure_in_progress",
  );
  const cancelled = await accountDataRepository.cancelRequest(owner, request.requestId);
  assert.equal(cancelled.status, "cancelled");
  assert.equal((await accountDataRepository.readState(owner)).status, "active");
  assert.equal((await repository.append(owner, batch([attempt({ eventId: "attempt_after_cancel" })]), "1")).accepted.length, 1);
});

test("processing erasure hard-deletes retained evidence and advances generation", async () => {
  const owner = await ownerId();
  const accepted = attempt({ eventId: "attempt_erasure_delete", answer: "accepted" });
  const conflict = attempt({ eventId: "attempt_erasure_delete", answer: "conflict" });
  await repository.append(owner, batch([accepted], [supportEvent({ eventId: "support_erasure_delete" })], [snapshot({ snapshotId: "snapshot_erasure_delete" })]), "1");
  await repository.append(owner, batch([conflict]), "1");

  const request = await accountDataRepository.startRequest(owner);
  const proof = await accountDataRepository.recordReauthentication(owner, request.requestId, "session_binding_process");
  await accountDataRepository.confirmRequest(owner, request.requestId, proof.proof, "session_binding_process");
  await pool.query("UPDATE stemforge_account_data.requests SET cancellation_deadline = clock_timestamp() - interval '1 second' WHERE request_id = $1", [request.requestId]);
  const processing = await accountDataRepository.beginProcessing(owner, request.requestId);
  assert.equal(processing.status, "processing");

  await accountDataRepository.processRequest(request.requestId);
  const completed = await accountDataRepository.latestRequest(owner);
  const state = await accountDataRepository.readState(owner);
  assert.equal(completed?.status, "completed");
  assert.deepEqual(completed?.deletedCounts, { attempts: 1, supportEvents: 1, achievementSnapshots: 1, conflicts: 1 });
  assert.equal(state.status, "active");
  assert.equal(state.generation, "2");
  assert.equal(await evidenceRowCountForOwner(owner), "0");
  await assert.rejects(
    repository.append(owner, batch([attempt({ eventId: "attempt_after_erase_stale" })]), "1"),
    (error) => error instanceof AccountDataAccessError && error.code === "account_generation_mismatch",
  );
  assert.equal((await repository.append(owner, batch([attempt({ eventId: "attempt_after_erase_current" })]), "2")).accepted.length, 1);
});

async function ownerId() {
  return ownerRepository.getOrCreateOwner({ verified: true, provider: "database_test", subject: randomUUID() });
}

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

function betaReportRequest(overrides: Partial<Parameters<PostgresBetaReportRepository["createReport"]>[0]["request"]> = {}) {
  return {
    schemaVersion: BETA_REPORT_SCHEMA_VERSION,
    kind: "bug" as const,
    userMessage: "Beta tester report body.",
    contactEmail: null,
    guestSessionId: `guest_${randomUUID().replaceAll("-", "")}`,
    pagePath: "/dashboard",
    pageArea: "dashboard",
    diagnosticContext: betaDiagnostic(),
    honeypot: "",
    ...overrides,
  };
}

function betaDiagnostic(overrides: Partial<ReportDiagnosticContext> = {}): ReportDiagnosticContext {
  return {
    appVersion: "private-beta",
    buildCommit: null,
    environmentLabel: "development",
    route: "/dashboard",
    pageArea: "dashboard",
    viewportCategory: "desktop",
    online: true,
    authState: "guest",
    syncState: null,
    accountGenerationState: null,
    browserName: "Chrome",
    browserVersion: null,
    operatingSystem: "Windows",
    locale: "en-GB",
    timezone: "Europe/London",
    contentReference: null,
    errorCode: null,
    practiceSessionMode: null,
    component: null,
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

async function evidenceRowCountForOwner(owner: string) {
  const result = await pool.query<{ count: string }>(`
    SELECT (
      (SELECT count(*) FROM stemforge_remote.question_attempts WHERE owner_id = $1) +
      (SELECT count(*) FROM stemforge_remote.support_events WHERE owner_id = $1) +
      (SELECT count(*) FROM stemforge_remote.achievement_snapshots WHERE owner_id = $1) +
      (SELECT count(*) FROM stemforge_remote.evidence_conflicts WHERE owner_id = $1)
    )::text AS count
  `, [owner]);
  return result.rows[0].count;
}

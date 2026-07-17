import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import {
  AccountDataAccessError,
  ERASURE_CANCELLATION_MINUTES,
  type AccountDataState,
  type SafeErasureRequest,
} from "@/lib/account-data/types";

type StateRow = { owner_id: string; generation: string; status: AccountDataState["status"]; state_version: string; updated_at: Date; last_erased_at: Date | null };
type RequestRow = {
  request_id: string; status: SafeErasureRequest["status"]; generation_before: string; generation_after: string | null;
  created_at: Date; updated_at: Date; cancellation_deadline: Date | null; irreversible_at: Date | null;
  completed_at: Date | null; cancelled_at: Date | null; deleted_attempt_count: string | null;
  deleted_support_event_count: string | null; deleted_achievement_snapshot_count: string | null;
  deleted_conflict_count: string | null; failure_code: string | null;
};

export class PostgresAccountDataRepository {
  constructor(private readonly pool: Pool) {}

  async readState(ownerId: string): Promise<AccountDataState> {
    const result = await this.pool.query<StateRow>(`
      SELECT owner_id, generation::text, status, state_version::text, updated_at, last_erased_at
      FROM stemforge_account_data.account_state WHERE owner_id = $1
    `, [ownerId]);
    if (!result.rows[0]) throw new Error("Account data state is unavailable.");
    return toState(result.rows[0]);
  }

  async assertActiveGeneration(client: PoolClient, ownerId: string, expectedGeneration?: string) {
    const result = await client.query<StateRow>(`
      SELECT owner_id, generation::text, status, state_version::text, updated_at, last_erased_at
      FROM stemforge_account_data.account_state WHERE owner_id = $1 FOR UPDATE
    `, [ownerId]);
    const state = result.rows[0];
    if (!state) throw new Error("Account data state is unavailable.");
    if (state.status === "closed") throw new AccountDataAccessError("account_closed");
    if (state.status !== "active") throw new AccountDataAccessError("erasure_in_progress");
    if (expectedGeneration === undefined) throw new AccountDataAccessError("generation_required");
    if (state.generation !== expectedGeneration) throw new AccountDataAccessError("account_generation_mismatch");
    return toState(state);
  }

  async startRequest(ownerId: string) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await ownerLock(client, ownerId);
      const existing = await client.query<RequestRow>(`${requestSelect}
        WHERE owner_id = $1 AND status IN ('awaiting_reauthentication','awaiting_confirmation','scheduled','processing','failed_retryable')
        ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [ownerId]);
      if (existing.rows[0]) { await client.query("COMMIT"); return toRequest(existing.rows[0]); }
      const state = await client.query<StateRow>(`SELECT owner_id, generation::text, status, state_version::text, updated_at, last_erased_at
        FROM stemforge_account_data.account_state WHERE owner_id = $1 FOR UPDATE`, [ownerId]);
      if (!state.rows[0] || state.rows[0].status === "closed") throw new AccountDataAccessError("account_closed");
      const inserted = await client.query<RequestRow>(`${requestInsert} VALUES ($1, 'awaiting_reauthentication', $2) RETURNING ${requestColumns}`,
        [ownerId, state.rows[0].generation]);
      await client.query("COMMIT");
      return toRequest(inserted.rows[0]);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }

  async recordReauthentication(ownerId: string, requestId: string, sessionBinding: string) {
    const client = await this.pool.connect();
    const proof = randomBytes(32).toString("base64url");
    try {
      await client.query("BEGIN");
      const updated = await client.query<RequestRow>(`UPDATE stemforge_account_data.requests
        SET status='awaiting_confirmation', reauthenticated_at=clock_timestamp(), updated_at=clock_timestamp()
        WHERE request_id=$1 AND owner_id=$2 AND status='awaiting_reauthentication' RETURNING ${requestColumns}`,
        [requestId, ownerId]);
      if (!updated.rows[0]) throw new Error("Erasure request is not awaiting reauthentication.");
      await client.query(`INSERT INTO stemforge_account_data.reauthentication_proofs
        (proof_hash, owner_id, request_id, session_binding_hash, request_type, expires_at)
        VALUES ($1,$2,$3,$4,'learning_progress_erasure',clock_timestamp()+interval '10 minutes')`,
        [sha256(proof), ownerId, requestId, sha256(sessionBinding)]);
      await client.query("COMMIT");
      return { request: toRequest(updated.rows[0]), proof };
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }

  async confirmRequest(ownerId: string, requestId: string, proof: string, sessionBinding: string) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await ownerLock(client, ownerId);
      const consumed = await client.query(`UPDATE stemforge_account_data.reauthentication_proofs SET consumed_at=clock_timestamp()
        WHERE proof_hash=$1 AND owner_id=$2 AND request_id=$3 AND session_binding_hash=$4
          AND consumed_at IS NULL AND expires_at>clock_timestamp() RETURNING proof_hash`,
        [sha256(proof), ownerId, requestId, sha256(sessionBinding)]);
      if (!consumed.rows[0]) throw new Error("Recent reauthentication proof is invalid, expired, or already used.");
      const updated = await client.query<RequestRow>(`UPDATE stemforge_account_data.requests SET status='scheduled',
        confirmed_at=clock_timestamp(), cancellation_deadline=clock_timestamp()+interval '${ERASURE_CANCELLATION_MINUTES} minutes',
        updated_at=clock_timestamp() WHERE request_id=$1 AND owner_id=$2 AND status='awaiting_confirmation'
        RETURNING ${requestColumns}`, [requestId, ownerId]);
      if (!updated.rows[0]) throw new Error("Erasure request is not awaiting confirmation.");
      await client.query(`UPDATE stemforge_account_data.account_state SET status='erasure_pending', state_version=state_version+1,
        updated_at=clock_timestamp() WHERE owner_id=$1 AND status='active'`, [ownerId]);
      await client.query("COMMIT");
      return toRequest(updated.rows[0]);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }

  async cancelRequest(ownerId: string, requestId: string) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN"); await ownerLock(client, ownerId);
      const updated = await client.query<RequestRow>(`UPDATE stemforge_account_data.requests SET status='cancelled',
        cancelled_at=clock_timestamp(), updated_at=clock_timestamp()
        WHERE request_id=$1 AND owner_id=$2 AND status='scheduled' AND cancellation_deadline>clock_timestamp()
        RETURNING ${requestColumns}`, [requestId, ownerId]);
      if (!updated.rows[0]) throw new Error("Deletion can no longer be cancelled.");
      await client.query(`UPDATE stemforge_account_data.account_state SET status='active', state_version=state_version+1,
        updated_at=clock_timestamp() WHERE owner_id=$1 AND status='erasure_pending'`, [ownerId]);
      await client.query("COMMIT"); return toRequest(updated.rows[0]);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }

  async latestRequest(ownerId: string) {
    const result = await this.pool.query<RequestRow>(`${requestSelect} WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 1`, [ownerId]);
    return result.rows[0] ? toRequest(result.rows[0]) : null;
  }

  async processRequest(requestId: string) {
    const result = await this.pool.query(`SELECT * FROM stemforge_account_data.process_learning_erasure($1::uuid)`, [requestId]);
    return result.rows[0];
  }

  async beginProcessing(ownerId: string, requestId: string) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN"); await ownerLock(client, ownerId);
      const updated = await client.query<RequestRow>(`UPDATE stemforge_account_data.requests SET status='processing',
        irreversible_at=COALESCE(irreversible_at,clock_timestamp()), updated_at=clock_timestamp(), failure_code=NULL
        WHERE request_id=$1 AND owner_id=$2 AND status IN ('scheduled','failed_retryable')
          AND cancellation_deadline<=clock_timestamp() RETURNING ${requestColumns}`, [requestId, ownerId]);
      if (!updated.rows[0]) throw new Error("Erasure request is not ready to process.");
      await client.query(`UPDATE stemforge_account_data.account_state SET status='processing', state_version=state_version+1,
        updated_at=clock_timestamp() WHERE owner_id=$1 AND status='erasure_pending'`, [ownerId]);
      await client.query("COMMIT"); return toRequest(updated.rows[0]);
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }

  async markRetryableFailure(ownerId: string, requestId: string, failureCode = "database_operation_failed") {
    await this.pool.query(`UPDATE stemforge_account_data.requests SET status='failed_retryable', failure_code=$3,
      updated_at=clock_timestamp() WHERE request_id=$1 AND owner_id=$2 AND status='processing'`,
      [requestId, ownerId, failureCode]);
  }
}

export async function ownerLock(client: PoolClient, ownerId: string) {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`stemforge_owner:${ownerId}`]);
}

const requestColumns = `request_id::text, status, generation_before::text, generation_after::text, created_at,
  updated_at, cancellation_deadline, irreversible_at, completed_at, cancelled_at, deleted_attempt_count::text,
  deleted_support_event_count::text, deleted_achievement_snapshot_count::text, deleted_conflict_count::text, failure_code`;
const requestSelect = `SELECT ${requestColumns} FROM stemforge_account_data.requests`;
const requestInsert = `INSERT INTO stemforge_account_data.requests (owner_id,status,generation_before)`;

function toState(row: StateRow): AccountDataState {
  return { ownerId: row.owner_id, generation: row.generation, status: row.status, stateVersion: row.state_version,
    updatedAt: row.updated_at.toISOString(), lastErasedAt: row.last_erased_at?.toISOString() ?? null };
}
function toRequest(row: RequestRow): SafeErasureRequest {
  const counts = row.deleted_attempt_count === null ? null : {
    attempts: Number(row.deleted_attempt_count), supportEvents: Number(row.deleted_support_event_count),
    achievementSnapshots: Number(row.deleted_achievement_snapshot_count), conflicts: Number(row.deleted_conflict_count),
  };
  return { requestId: row.request_id, status: row.status, generationBefore: row.generation_before,
    generationAfter: row.generation_after, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
    cancellationDeadline: row.cancellation_deadline?.toISOString() ?? null, irreversibleAt: row.irreversible_at?.toISOString() ?? null,
    completedAt: row.completed_at?.toISOString() ?? null, cancelledAt: row.cancelled_at?.toISOString() ?? null,
    deletedCounts: counts, failureCode: row.failure_code };
}
function sha256(value: string) { return createHash("sha256").update(value, "utf8").digest("hex"); }

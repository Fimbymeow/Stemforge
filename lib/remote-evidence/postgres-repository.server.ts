import "server-only";

import type { Pool, PoolClient } from "pg";
import { canonicalJsonEqual } from "@/lib/remote-evidence/canonical-json";
import type {
  AcceptedRemoteEvidence,
  AppendRemoteEvidenceResult,
  RemoteEvidenceConflict,
  RemoteEvidenceKind,
  RemoteEvidencePage,
  RemoteEvidenceRead,
} from "@/lib/remote-evidence/types";
import { validateOwnerId, validateRemoteEvidenceBatch } from "@/lib/remote-evidence/validation";
import type { AchievementSnapshot, ProgressPayload, QuestionAttempt, QuestionSupportEvent } from "@/lib/progress/types";

const TABLES: Record<RemoteEvidenceKind, string> = {
  attempt: "stemforge_remote.question_attempts",
  support_event: "stemforge_remote.support_events",
  achievement_snapshot: "stemforge_remote.achievement_snapshots",
};

type EvidenceItem = QuestionAttempt | QuestionSupportEvent | AchievementSnapshot;
type StoredRow = { payload: EvidenceItem; payload_hash: string; receive_order: string; received_at: Date };

export class PostgresRemoteEvidenceRepository {
  constructor(private readonly pool: Pool) {}

  async append(ownerId: unknown, input: unknown): Promise<AppendRemoteEvidenceResult> {
    const result: AppendRemoteEvidenceResult = { accepted: [], duplicates: [], conflicts: [], rejected: [] };
    if (!validateOwnerId(ownerId)) {
      result.rejected.push({ reason: "A non-empty opaque owner ID using safe identifier characters is required." });
      return result;
    }
    const validated = validateRemoteEvidenceBatch(input);
    result.rejected.push(...validated.rejected);
    if (validated.fatal) return result;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`stemforge_remote_append:${ownerId}`]);
      for (const item of validated.payload.data.attempts) await this.appendOne(client, ownerId, "attempt", item, result);
      for (const item of validated.payload.data.supportEvents) await this.appendOne(client, ownerId, "support_event", item, result);
      for (const item of validated.payload.data.achievementSnapshots) await this.appendOne(client, ownerId, "achievement_snapshot", item, result);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async read(ownerId: unknown, afterCursor?: string): Promise<RemoteEvidenceRead> {
    if (!validateOwnerId(ownerId)) throw new Error("A valid opaque owner ID is required.");
    if (afterCursor !== undefined && !/^\d+$/.test(afterCursor)) throw new Error("Receive cursor must be an unsigned integer string.");
    const query = await this.pool.query<StoredReadRow>(`
      SELECT evidence_kind, event_id, payload, receive_order::text, received_at
      FROM (
        SELECT 'attempt'::text AS evidence_kind, event_id, payload, receive_order, received_at
          FROM stemforge_remote.question_attempts WHERE owner_id = $1
        UNION ALL
        SELECT 'support_event'::text, event_id, payload, receive_order, received_at
          FROM stemforge_remote.support_events WHERE owner_id = $1
        UNION ALL
        SELECT 'achievement_snapshot'::text, event_id, payload, receive_order, received_at
          FROM stemforge_remote.achievement_snapshots WHERE owner_id = $1
      ) evidence
      WHERE ($2::bigint IS NULL OR receive_order > $2::bigint)
      ORDER BY receive_order, evidence_kind, event_id
    `, [ownerId, afterCursor ?? null]);

    const payload: ProgressPayload = { version: 4, data: { attempts: [], supportEvents: [], achievementSnapshots: [] } };
    const records: AcceptedRemoteEvidence[] = [];
    for (const row of query.rows) {
      if (row.evidence_kind === "attempt") payload.data.attempts.push(row.payload as QuestionAttempt);
      else if (row.evidence_kind === "support_event") payload.data.supportEvents.push(row.payload as QuestionSupportEvent);
      else payload.data.achievementSnapshots.push(row.payload as AchievementSnapshot);
      records.push({ kind: row.evidence_kind, eventId: row.event_id, receiveCursor: row.receive_order, receivedAt: row.received_at.toISOString() });
    }
    return { payload, records, nextCursor: records.at(-1)?.receiveCursor ?? afterCursor ?? null };
  }

  async readPage(ownerId: unknown, afterCursor: string | undefined, limit: number): Promise<RemoteEvidencePage> {
    if (!validateOwnerId(ownerId)) throw new Error("A valid opaque owner ID is required.");
    if (afterCursor !== undefined && !/^\d+$/.test(afterCursor)) throw new Error("Receive cursor must be an unsigned integer string.");
    if (!Number.isInteger(limit) || limit < 1 || limit > 501) throw new Error("Remote evidence page limit is invalid.");
    const query = await this.pool.query<StoredPageRow>(`
      SELECT evidence_kind, event_id, payload, disposition, receive_order::text, received_at
      FROM (
        SELECT 'attempt'::text AS evidence_kind, event_id, payload, 'accepted'::text AS disposition, receive_order, received_at
          FROM stemforge_remote.question_attempts WHERE owner_id = $1
        UNION ALL
        SELECT 'support_event'::text, event_id, payload, 'accepted'::text, receive_order, received_at
          FROM stemforge_remote.support_events WHERE owner_id = $1
        UNION ALL
        SELECT 'achievement_snapshot'::text, event_id, payload, 'accepted'::text, receive_order, received_at
          FROM stemforge_remote.achievement_snapshots WHERE owner_id = $1
        UNION ALL
        SELECT evidence_kind, event_id, incoming_payload, 'conflict_retained'::text, receive_order, received_at
          FROM stemforge_remote.evidence_conflicts WHERE owner_id = $1
      ) evidence
      WHERE ($2::bigint IS NULL OR receive_order > $2::bigint)
      ORDER BY receive_order, evidence_kind, event_id
      LIMIT $3
    `, [ownerId, afterCursor ?? null, limit]);
    return {
      records: query.rows.map((row) => ({
        kind: row.evidence_kind,
        eventId: row.event_id,
        disposition: row.disposition,
        receiveCursor: row.receive_order,
        receivedAt: row.received_at.toISOString(),
        evidence: row.payload,
      })),
    };
  }

  private async appendOne(
    client: PoolClient,
    ownerId: string,
    kind: RemoteEvidenceKind,
    item: EvidenceItem,
    result: AppendRemoteEvidenceResult,
  ) {
    const eventId = kind === "achievement_snapshot" ? (item as AchievementSnapshot).snapshotId : (item as QuestionAttempt).eventId;
    const table = TABLES[kind];
    const inserted = await client.query<StoredRow>(`
      INSERT INTO ${table} (owner_id, event_id, payload)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (owner_id, event_id) DO NOTHING
      RETURNING payload, payload_hash, receive_order::text, received_at
    `, [ownerId, eventId, JSON.stringify(item)]);
    if (inserted.rowCount === 1) {
      const row = inserted.rows[0];
      result.accepted.push({ kind, eventId, receiveCursor: row.receive_order, receivedAt: row.received_at.toISOString() });
      return;
    }

    const existing = await client.query<StoredRow>(`
      SELECT payload, payload_hash, receive_order::text, received_at
      FROM ${table} WHERE owner_id = $1 AND event_id = $2
    `, [ownerId, eventId]);
    const accepted = existing.rows[0];
    if (!accepted) throw new Error(`Accepted ${kind} ${eventId} disappeared during append classification.`);
    if (canonicalJsonEqual(accepted.payload, item)) {
      result.duplicates.push({
        kind,
        eventId,
        receiveCursor: accepted.receive_order,
        receivedAt: accepted.received_at.toISOString(),
      });
      return;
    }

    const conflict = await client.query<ConflictRow>(`
      INSERT INTO stemforge_remote.evidence_conflicts
        (owner_id, evidence_kind, event_id, accepted_payload_hash, incoming_payload)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      ON CONFLICT (owner_id, evidence_kind, event_id, accepted_payload_hash, incoming_payload_hash) DO NOTHING
      RETURNING conflict_id::text, accepted_payload_hash, incoming_payload_hash, receive_order::text, received_at
    `, [ownerId, kind, eventId, accepted.payload_hash, JSON.stringify(item)]);
    const conflictRow = conflict.rows[0] ?? (await client.query<ConflictRow>(`
      SELECT conflict_id::text, accepted_payload_hash, incoming_payload_hash, receive_order::text, received_at
      FROM stemforge_remote.evidence_conflicts
      WHERE owner_id = $1 AND evidence_kind = $2 AND event_id = $3
        AND accepted_payload_hash = $4
        AND incoming_payload_hash = encode(digest(convert_to($5::jsonb::text, 'UTF8'), 'sha256'), 'hex')
    `, [ownerId, kind, eventId, accepted.payload_hash, JSON.stringify(item)])).rows[0];
    result.conflicts.push(toConflict(kind, eventId, conflictRow));
  }
}

type StoredReadRow = {
  evidence_kind: RemoteEvidenceKind;
  event_id: string;
  payload: EvidenceItem;
  receive_order: string;
  received_at: Date;
};
type StoredPageRow = StoredReadRow & { disposition: "accepted" | "conflict_retained" };
type ConflictRow = {
  conflict_id: string;
  accepted_payload_hash: string;
  incoming_payload_hash: string;
  receive_order: string;
  received_at: Date;
};

function toConflict(kind: RemoteEvidenceKind, eventId: string, row: ConflictRow): RemoteEvidenceConflict {
  return {
    kind,
    eventId,
    conflictId: row.conflict_id,
    acceptedPayloadHash: row.accepted_payload_hash,
    incomingPayloadHash: row.incoming_payload_hash,
    receiveCursor: row.receive_order,
    receivedAt: row.received_at.toISOString(),
  };
}

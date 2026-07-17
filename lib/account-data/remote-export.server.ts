import "server-only";

import type { Pool } from "pg";
import { buildAccountLearningDataExport, MAX_ACCOUNT_EXPORT_RECORDS, type AccountExportRecord } from "@/lib/account-data/export";
import { ownerLock } from "@/lib/account-data/postgres-account-data.server";

type Row = { kind: AccountExportRecord["kind"]; disposition: AccountExportRecord["disposition"]; event_id: string;
  evidence: unknown; account_generation: string; receive_order: string; received_at: Date };

export async function exportRemoteLearningData(pool: Pool, ownerId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    await ownerLock(client, ownerId);
    const account = await client.query<{ created_at: Date }>("SELECT created_at FROM stemforge_identity.application_owners WHERE owner_id=$1", [ownerId]);
    if (!account.rows[0]) throw new Error("Account owner is unavailable.");
    const result = await client.query<Row>(`
      SELECT kind, disposition, event_id, evidence, account_generation::text, receive_order::text, received_at FROM (
        SELECT 'attempt'::text kind, 'accepted'::text disposition, event_id, payload evidence, account_generation, receive_order, received_at
          FROM stemforge_remote.question_attempts WHERE owner_id=$1
        UNION ALL SELECT 'support_event', 'accepted', event_id, payload, account_generation, receive_order, received_at
          FROM stemforge_remote.support_events WHERE owner_id=$1
        UNION ALL SELECT 'achievement_snapshot', 'accepted', event_id, payload, account_generation, receive_order, received_at
          FROM stemforge_remote.achievement_snapshots WHERE owner_id=$1
        UNION ALL SELECT evidence_kind, 'conflict_retained', event_id, incoming_payload, account_generation, receive_order, received_at
          FROM stemforge_remote.evidence_conflicts WHERE owner_id=$1
      ) export_rows ORDER BY receive_order, kind, event_id LIMIT $2
    `, [ownerId, MAX_ACCOUNT_EXPORT_RECORDS + 1]);
    const records: AccountExportRecord[] = result.rows.map((row) => ({ kind: row.kind, disposition: row.disposition,
      eventId: row.event_id, evidence: row.evidence, accountGeneration: row.account_generation,
      receiveCursor: row.receive_order, receivedAt: row.received_at.toISOString() }));
    const exported = buildAccountLearningDataExport(records, account.rows[0].created_at.toISOString());
    await client.query("COMMIT");
    return exported;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

import "server-only";

import type { Pool } from "pg";
import type { OwnerMappingRepository, VerifiedExternalIdentity } from "@/lib/auth/owner-types";

export class PostgresOwnerMappingRepository implements OwnerMappingRepository {
  constructor(private readonly pool: Pool) {}

  async getOrCreateOwner(identity: VerifiedExternalIdentity) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`${identity.provider}:${identity.subject}`]);
      const existing = await client.query<{ owner_id: string }>(`
        SELECT owner_id FROM stemforge_identity.external_auth_identities
        WHERE provider = $1 AND provider_subject = $2
      `, [identity.provider, identity.subject]);
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return existing.rows[0].owner_id;
      }

      const owner = await client.query<{ owner_id: string }>(`
        INSERT INTO stemforge_identity.application_owners DEFAULT VALUES
        RETURNING owner_id
      `);
      await client.query(`
        INSERT INTO stemforge_identity.external_auth_identities (provider, provider_subject, owner_id)
        VALUES ($1, $2, $3)
      `, [identity.provider, identity.subject, owner.rows[0].owner_id]);
      await client.query("COMMIT");
      return owner.rows[0].owner_id;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

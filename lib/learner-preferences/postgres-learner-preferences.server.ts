import "server-only";

import type { Pool, PoolClient } from "pg";
import {
  emptyLearnerPreferences,
  mergeGuestLearnerPreferences,
  normalizeLearnerPreferences,
  type LearnerPreferences,
} from "@/lib/learner-preferences";
import { AccountDataAccessError } from "@/lib/account-data/types";
import { ownerLock } from "@/lib/account-data/postgres-account-data.server";

type PreferenceRow = {
  first_name: string | null;
  name_prompt_dismissed: boolean;
  selected_course_slugs: string[];
};

export class PostgresLearnerPreferencesRepository {
  constructor(private readonly pool: Pool) {}

  async read(ownerId: string) {
    const row = await this.readRow(this.pool, ownerId);
    return row ? toPreferences(row) : emptyLearnerPreferences();
  }

  async replace(ownerId: string, preferences: LearnerPreferences) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await ownerLock(client, ownerId);
      await assertAccountActive(client, ownerId);
      const saved = await this.upsert(client, ownerId, normalizeLearnerPreferences(preferences));
      await client.query("COMMIT");
      return saved;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async mergeGuest(ownerId: string, guest: LearnerPreferences) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await ownerLock(client, ownerId);
      await assertAccountActive(client, ownerId);
      const row = await this.readRow(client, ownerId, true);
      const merged = mergeGuestLearnerPreferences(row ? toPreferences(row) : null, guest);
      const saved = await this.upsert(client, ownerId, merged);
      await client.query("COMMIT");
      return saved;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async readRow(client: Pick<Pool, "query"> | Pick<PoolClient, "query">, ownerId: string, lock = false) {
    const result = await client.query<PreferenceRow>(`
      SELECT first_name, name_prompt_dismissed, selected_course_slugs
      FROM stemforge_account_data.learner_preferences WHERE owner_id=$1${lock ? " FOR UPDATE" : ""}
    `, [ownerId]);
    return result.rows[0] ?? null;
  }

  private async upsert(client: PoolClient, ownerId: string, preferences: LearnerPreferences) {
    const result = await client.query<PreferenceRow>(`
      INSERT INTO stemforge_account_data.learner_preferences
        (owner_id, first_name, name_prompt_dismissed, selected_course_slugs)
      VALUES ($1,$2,$3,$4::text[])
      ON CONFLICT (owner_id) DO UPDATE SET
        first_name=EXCLUDED.first_name,
        name_prompt_dismissed=EXCLUDED.name_prompt_dismissed,
        selected_course_slugs=EXCLUDED.selected_course_slugs,
        updated_at=clock_timestamp()
      RETURNING first_name, name_prompt_dismissed, selected_course_slugs
    `, [ownerId, preferences.firstName, preferences.namePromptDismissed, preferences.selectedCourseSlugs]);
    return toPreferences(result.rows[0]);
  }
}

async function assertAccountActive(client: PoolClient, ownerId: string) {
  const result = await client.query<{ status: string }>("SELECT status FROM stemforge_account_data.account_state WHERE owner_id=$1 FOR UPDATE", [ownerId]);
  const status = result.rows[0]?.status;
  if (status === "closed") throw new AccountDataAccessError("account_closed");
  if (status !== "active") throw new AccountDataAccessError("erasure_in_progress");
}

function toPreferences(row: PreferenceRow): LearnerPreferences {
  return normalizeLearnerPreferences({
    version: 1,
    firstName: row.first_name,
    namePromptDismissed: row.name_prompt_dismissed,
    selectedCourseSlugs: row.selected_course_slugs,
  });
}

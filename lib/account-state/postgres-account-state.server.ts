import "server-only";

import type { Pool, PoolClient } from "pg";
import { AccountDataAccessError } from "@/lib/account-data/types";
import { ownerLock } from "@/lib/account-data/postgres-account-data.server";
import { assessmentContentFingerprint } from "@/lib/account-state/assessment-fingerprint.server";
import { normalizeAccountLearnerState, type AccountLearnerState, type AccountStateMutation } from "@/lib/account-state/types";

export class PostgresAccountStateRepository {
  constructor(private readonly pool: Pool) {}

  async read(ownerId: string): Promise<AccountLearnerState> {
    const [settings, assessments, confidence, planItems] = await Promise.all([
      this.pool.query(`SELECT weekly_minutes, available_days, changed_at FROM stemforge_account_data.study_plan_settings WHERE owner_id=$1`, [ownerId]),
      this.pool.query(`SELECT assessment_id, course_slug, assessment_type, title, assessment_date, scope, source, changed_at
        FROM stemforge_account_data.learner_assessments WHERE owner_id=$1 AND NOT deleted ORDER BY assessment_id LIMIT 100`, [ownerId]),
      this.pool.query(`SELECT skill_path_id, level, set_at, rating_deleted, override_payload, override_deleted
        FROM stemforge_account_data.learner_confidence WHERE owner_id=$1 ORDER BY skill_path_id LIMIT 400`, [ownerId]),
      this.pool.query(`SELECT item_key, week_start::text, planner_version, item_state, moved_date::text, excluded, unscheduled, changed_at
        FROM stemforge_account_data.study_plan_item_states WHERE owner_id=$1 AND week_start >= current_date - 28 ORDER BY week_start, item_key LIMIT 500`, [ownerId]),
    ]);
    const setting = settings.rows[0];
    return normalizeAccountLearnerState({
      settings: setting ? { weeklyMinutes: setting.weekly_minutes, availableDays: setting.available_days, changedAt: iso(setting.changed_at) } : null,
      assessments: assessments.rows.map((row) => ({ assessment: { id: row.assessment_id, courseSlug: row.course_slug,
        type: row.assessment_type, title: row.title, date: row.assessment_date, scope: row.scope, source: row.source }, changedAt: iso(row.changed_at) })),
      ratings: confidence.rows.filter((row) => !row.rating_deleted).map((row) => ({ skillPathId: row.skill_path_id, level: row.level, setAt: iso(row.set_at) })),
      overrides: confidence.rows.filter((row) => !row.override_deleted).map((row) => row.override_payload),
      planItems: planItems.rows.map((row) => ({ itemKey: row.item_key, weekStart: row.week_start, plannerVersion: row.planner_version,
        state: row.item_state, movedDate: row.moved_date, excluded: row.excluded, unscheduled: row.unscheduled, changedAt: iso(row.changed_at) })),
    });
  }

  async readGeneration(ownerId: string) {
    const result = await this.pool.query<{ generation: string }>("SELECT generation::text FROM stemforge_account_data.account_state WHERE owner_id=$1", [ownerId]);
    return result.rows[0]?.generation ?? null;
  }

  async apply(ownerId: string, mutations: readonly AccountStateMutation[], expectedGeneration?: string) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await ownerLock(client, ownerId);
      await assertAccountActive(client, ownerId, expectedGeneration);
      for (const mutation of mutations) await applyMutation(client, ownerId, mutation);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return this.read(ownerId);
  }
}

async function applyMutation(client: PoolClient, ownerId: string, mutation: AccountStateMutation) {
  switch (mutation.kind) {
    case "settings_replace":
      await client.query(`INSERT INTO stemforge_account_data.study_plan_settings
        (owner_id, weekly_minutes, available_days, changed_at) VALUES ($1,$2,$3::text[],$4)
        ON CONFLICT (owner_id) DO UPDATE SET weekly_minutes=EXCLUDED.weekly_minutes,
          available_days=EXCLUDED.available_days, changed_at=EXCLUDED.changed_at, updated_at=clock_timestamp()
        WHERE stemforge_account_data.study_plan_settings.changed_at <= EXCLUDED.changed_at`,
      [ownerId, mutation.settings.weeklyMinutes, mutation.settings.availableDays, mutation.changedAt]);
      return;
    case "assessment_upsert": {
      const assessment = mutation.assessment;
      await client.query(`INSERT INTO stemforge_account_data.learner_assessments
        (owner_id, assessment_id, course_slug, assessment_type, title, assessment_date, scope, source, content_fingerprint, deleted, changed_at)
        VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,false,$10)
        ON CONFLICT (owner_id, assessment_id) DO UPDATE SET course_slug=EXCLUDED.course_slug,
          assessment_type=EXCLUDED.assessment_type,title=EXCLUDED.title,assessment_date=EXCLUDED.assessment_date,
          scope=EXCLUDED.scope,source=EXCLUDED.source,content_fingerprint=EXCLUDED.content_fingerprint,
          deleted=false,changed_at=EXCLUDED.changed_at,updated_at=clock_timestamp()
        WHERE stemforge_account_data.learner_assessments.changed_at <= EXCLUDED.changed_at`,
      [ownerId, assessment.id, assessment.courseSlug, assessment.type, assessment.title, JSON.stringify(assessment.date),
        JSON.stringify(assessment.scope), assessment.source, assessmentContentFingerprint(assessment), mutation.changedAt]);
      return;
    }
    case "assessment_delete":
      await client.query(`INSERT INTO stemforge_account_data.learner_assessments
        (owner_id, assessment_id, deleted, changed_at) VALUES ($1,$2,true,$3)
        ON CONFLICT (owner_id, assessment_id) DO UPDATE SET course_slug=NULL,assessment_type=NULL,title=NULL,
          assessment_date=NULL,scope=NULL,source=NULL,content_fingerprint=NULL,deleted=true,changed_at=EXCLUDED.changed_at,
          updated_at=clock_timestamp() WHERE stemforge_account_data.learner_assessments.changed_at <= EXCLUDED.changed_at`,
      [ownerId, mutation.assessmentId, mutation.changedAt]);
      return;
    case "confidence_upsert":
      await client.query(`INSERT INTO stemforge_account_data.learner_confidence
        (owner_id,skill_path_id,level,set_at,rating_deleted,rating_changed_at,override_deleted,override_changed_at)
        VALUES ($1,$2,$3,$4,false,$5,true,$5)
        ON CONFLICT (owner_id,skill_path_id) DO UPDATE SET level=EXCLUDED.level,set_at=EXCLUDED.set_at,
          rating_deleted=false,rating_changed_at=EXCLUDED.rating_changed_at,updated_at=clock_timestamp()
        WHERE stemforge_account_data.learner_confidence.rating_changed_at <= EXCLUDED.rating_changed_at`,
      [ownerId, mutation.skillPathId, mutation.level, mutation.setAt, mutation.changedAt]);
      return;
    case "confidence_delete":
      await client.query(`INSERT INTO stemforge_account_data.learner_confidence
        (owner_id,skill_path_id,rating_deleted,rating_changed_at,override_deleted,override_changed_at)
        VALUES ($1,$2,true,$3,true,$3)
        ON CONFLICT (owner_id,skill_path_id) DO UPDATE SET level=NULL,set_at=NULL,rating_deleted=true,
          rating_changed_at=EXCLUDED.rating_changed_at,updated_at=clock_timestamp()
        WHERE stemforge_account_data.learner_confidence.rating_changed_at <= EXCLUDED.rating_changed_at`,
      [ownerId, mutation.skillPathId, mutation.changedAt]);
      return;
    case "override_upsert":
      await client.query(`INSERT INTO stemforge_account_data.learner_confidence
        (owner_id,skill_path_id,rating_deleted,rating_changed_at,override_payload,override_deleted,override_changed_at)
        VALUES ($1,$2,true,$4,$3::jsonb,false,$4)
        ON CONFLICT (owner_id,skill_path_id) DO UPDATE SET override_payload=EXCLUDED.override_payload,
          override_deleted=false,override_changed_at=EXCLUDED.override_changed_at,updated_at=clock_timestamp()
        WHERE stemforge_account_data.learner_confidence.override_changed_at <= EXCLUDED.override_changed_at`,
      [ownerId, mutation.override.skillPathId, JSON.stringify(mutation.override), mutation.changedAt]);
      return;
    case "override_delete":
      await client.query(`INSERT INTO stemforge_account_data.learner_confidence
        (owner_id,skill_path_id,rating_deleted,rating_changed_at,override_deleted,override_changed_at)
        VALUES ($1,$2,true,$3,true,$3)
        ON CONFLICT (owner_id,skill_path_id) DO UPDATE SET override_payload=NULL,override_deleted=true,
          override_changed_at=EXCLUDED.override_changed_at,updated_at=clock_timestamp()
        WHERE stemforge_account_data.learner_confidence.override_changed_at <= EXCLUDED.override_changed_at`,
      [ownerId, mutation.skillPathId, mutation.changedAt]);
      return;
    case "plan_item_upsert":
      await client.query(`INSERT INTO stemforge_account_data.study_plan_item_states
        (owner_id,week_start,planner_version,item_key,item_state,moved_date,excluded,unscheduled,changed_at)
        VALUES ($1,$2::date,$3,$4,$5,$6::date,$7,$8,$9)
        ON CONFLICT (owner_id,week_start,planner_version,item_key) DO UPDATE SET item_state=EXCLUDED.item_state,
          moved_date=EXCLUDED.moved_date,excluded=EXCLUDED.excluded,unscheduled=EXCLUDED.unscheduled,
          changed_at=EXCLUDED.changed_at,updated_at=clock_timestamp()
        WHERE stemforge_account_data.study_plan_item_states.changed_at <= EXCLUDED.changed_at`,
      [ownerId, mutation.item.weekStart, mutation.item.plannerVersion, mutation.item.itemKey, mutation.item.state,
        mutation.item.movedDate, mutation.item.excluded, mutation.item.unscheduled, mutation.changedAt]);
  }
}

async function assertAccountActive(client: PoolClient, ownerId: string, expectedGeneration?: string) {
  const result = await client.query<{ status: string; generation: string }>("SELECT status,generation::text FROM stemforge_account_data.account_state WHERE owner_id=$1 FOR UPDATE", [ownerId]);
  const status = result.rows[0]?.status;
  if (status === "closed") throw new AccountDataAccessError("account_closed");
  if (status !== "active") throw new AccountDataAccessError("erasure_in_progress");
  if (expectedGeneration && result.rows[0]?.generation !== expectedGeneration) throw new AccountDataAccessError("account_generation_mismatch");
}

function iso(value: Date | string | null) {
  return value instanceof Date ? value.toISOString() : typeof value === "string" ? new Date(value).toISOString() : "";
}

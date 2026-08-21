import "server-only";

import type { Pool } from "pg";
import { buildAccountLearningDataExport, MAX_ACCOUNT_EXPORT_RECORDS, type AccountExportRecord } from "@/lib/account-data/export";
import { ownerLock } from "@/lib/account-data/postgres-account-data.server";
import { normalizeLearnerPreferences } from "@/lib/learner-preferences";
import { normalizeAccountLearnerState } from "@/lib/account-state/types";

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
        UNION ALL SELECT 'guided_self_assessment', 'accepted', event_id, payload, account_generation, receive_order, received_at
          FROM stemforge_remote.guided_self_assessments WHERE owner_id=$1
        UNION ALL SELECT 'achievement_snapshot', 'accepted', event_id, payload, account_generation, receive_order, received_at
          FROM stemforge_remote.achievement_snapshots WHERE owner_id=$1
        UNION ALL SELECT 'review_event', 'accepted', event_id, payload, account_generation, receive_order, received_at
          FROM stemforge_remote.review_events WHERE owner_id=$1
        UNION ALL SELECT 'flashcard_review', 'accepted', event_id, payload, account_generation, receive_order, received_at
          FROM stemforge_remote.flashcard_reviews WHERE owner_id=$1
        UNION ALL SELECT evidence_kind, 'conflict_retained', event_id, incoming_payload, account_generation, receive_order, received_at
          FROM stemforge_remote.evidence_conflicts WHERE owner_id=$1
      ) export_rows ORDER BY receive_order, kind, event_id LIMIT $2
    `, [ownerId, MAX_ACCOUNT_EXPORT_RECORDS + 1]);
    const records: AccountExportRecord[] = result.rows.map((row) => ({ kind: row.kind, disposition: row.disposition,
      eventId: row.event_id, evidence: row.evidence, accountGeneration: row.account_generation,
      receiveCursor: row.receive_order, receivedAt: row.received_at.toISOString() }));
    const preferenceResult = await client.query<{ first_name: string | null; name_prompt_dismissed: boolean; selected_course_slugs: string[] }>(`
      SELECT first_name, name_prompt_dismissed, selected_course_slugs
      FROM stemforge_account_data.learner_preferences WHERE owner_id=$1
    `, [ownerId]);
    const preferenceRow = preferenceResult.rows[0];
    const learnerPreferences = normalizeLearnerPreferences(preferenceRow ? {
      version: 1,
      firstName: preferenceRow.first_name,
      namePromptDismissed: preferenceRow.name_prompt_dismissed,
      selectedCourseSlugs: preferenceRow.selected_course_slugs,
    } : null);
    const [settings, assessments, confidence, planItems] = await Promise.all([
      client.query(`SELECT weekly_minutes,available_days,changed_at FROM stemforge_account_data.study_plan_settings WHERE owner_id=$1`, [ownerId]),
      client.query(`SELECT assessment_id,course_slug,assessment_type,title,assessment_date,scope,source,changed_at
        FROM stemforge_account_data.learner_assessments WHERE owner_id=$1 AND NOT deleted ORDER BY assessment_id`, [ownerId]),
      client.query(`SELECT skill_path_id,level,set_at,rating_deleted,override_payload,override_deleted
        FROM stemforge_account_data.learner_confidence WHERE owner_id=$1 ORDER BY skill_path_id`, [ownerId]),
      client.query(`SELECT item_key,week_start::text,planner_version,item_state,moved_date::text,excluded,unscheduled,changed_at
        FROM stemforge_account_data.study_plan_item_states WHERE owner_id=$1 ORDER BY week_start,item_key`, [ownerId]),
    ]);
    const setting = settings.rows[0];
    const learnerState = normalizeAccountLearnerState({
      settings: setting ? { weeklyMinutes: setting.weekly_minutes, availableDays: setting.available_days, changedAt: iso(setting.changed_at) } : null,
      assessments: assessments.rows.map((row) => ({ assessment: { id: row.assessment_id, courseSlug: row.course_slug,
        type: row.assessment_type, title: row.title, date: row.assessment_date, scope: row.scope, source: row.source }, changedAt: iso(row.changed_at) })),
      ratings: confidence.rows.filter((row) => !row.rating_deleted).map((row) => ({ skillPathId: row.skill_path_id, level: row.level, setAt: iso(row.set_at) })),
      overrides: confidence.rows.filter((row) => !row.override_deleted).map((row) => row.override_payload),
      planItems: planItems.rows.map((row) => ({ itemKey: row.item_key, weekStart: row.week_start, plannerVersion: row.planner_version,
        state: row.item_state, movedDate: row.moved_date, excluded: row.excluded, unscheduled: row.unscheduled, changedAt: iso(row.changed_at) })),
    });
    const exported = buildAccountLearningDataExport(records, account.rows[0].created_at.toISOString(), new Date().toISOString(), learnerPreferences, learnerState);
    await client.query("COMMIT");
    return exported;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

function iso(value: Date | string | null) {
  return value instanceof Date ? value.toISOString() : typeof value === "string" ? new Date(value).toISOString() : "";
}

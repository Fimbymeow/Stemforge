import { normalizeConfidenceLocalState } from "@/lib/confidence/local-state";
import { normalizeStudyPlanLocalState } from "@/lib/study-plan/local-state";
import { isTimestamp, MAX_ACCOUNT_STATE_MUTATIONS, type AccountStateMutation } from "@/lib/account-state/types";

export function normalizeAccountStateMutations(value: unknown): AccountStateMutation[] | null {
  if (!Array.isArray(value) || value.length > MAX_ACCOUNT_STATE_MUTATIONS) return null;
  const mutations = value.map(normalizeMutation);
  return mutations.every((entry): entry is AccountStateMutation => entry !== null) ? mutations : null;
}

function normalizeMutation(value: unknown): AccountStateMutation | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (!isTimestamp(item.changedAt) || Date.parse(item.changedAt) - Date.now() > 24 * 60 * 60 * 1000) return null;
  const changedAt = item.changedAt;
  if (item.kind === "settings_replace") {
    const setup = normalizeStudyPlanLocalState({ version: 3, setup: { ...(item.settings as object ?? {}), assessments: [] } }).setup;
    return setup ? { kind: "settings_replace", settings: { weeklyMinutes: setup.weeklyMinutes, availableDays: setup.availableDays }, changedAt } : null;
  }
  if (item.kind === "assessment_upsert") {
    const setup = normalizeStudyPlanLocalState({ version: 3, setup: { weeklyMinutes: 60, availableDays: ["mon"], assessments: [item.assessment] } }).setup;
    return setup?.assessments[0] ? { kind: "assessment_upsert", assessment: setup.assessments[0], changedAt } : null;
  }
  if (item.kind === "assessment_delete") return validId(item.assessmentId, 200) ? { kind: "assessment_delete", assessmentId: item.assessmentId, changedAt } : null;
  if (item.kind === "confidence_upsert") {
    if (!validId(item.skillPathId, 240) || !isTimestamp(item.setAt)) return null;
    const state = normalizeConfidenceLocalState({ ratings: { [item.skillPathId]: { skillPathId: item.skillPathId, level: item.level, setAt: item.setAt } } });
    const rating = state.ratings[item.skillPathId];
    return rating ? { kind: "confidence_upsert", skillPathId: rating.skillPathId, level: rating.level, setAt: rating.setAt, changedAt } : null;
  }
  if (item.kind === "confidence_delete") return validId(item.skillPathId, 240) ? { kind: "confidence_delete", skillPathId: item.skillPathId, changedAt } : null;
  if (item.kind === "override_upsert") {
    const override = item.override as { skillPathId?: unknown } | null;
    if (!override || !validId(override.skillPathId, 240)) return null;
    const state = normalizeConfidenceLocalState({ overrides: { [override.skillPathId]: override } });
    const normalized = state.overrides[override.skillPathId];
    return normalized ? { kind: "override_upsert", override: normalized, changedAt } : null;
  }
  if (item.kind === "override_delete") return validId(item.skillPathId, 240) ? { kind: "override_delete", skillPathId: item.skillPathId, changedAt } : null;
  if (item.kind === "plan_item_upsert") {
    const plan = item.item as Record<string, unknown> | null;
    if (!plan || !validId(plan.itemKey, 240) || typeof plan.weekStart !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(plan.weekStart)) return null;
    if (!Number.isInteger(plan.plannerVersion) || Number(plan.plannerVersion) < 1 || Number(plan.plannerVersion) > 1000) return null;
    if (plan.state !== null && plan.state !== "completed" && plan.state !== "skipped") return null;
    if (plan.movedDate !== null && (typeof plan.movedDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(plan.movedDate))) return null;
    return { kind: "plan_item_upsert", item: { itemKey: plan.itemKey, weekStart: plan.weekStart,
      plannerVersion: Number(plan.plannerVersion), state: plan.state as "completed" | "skipped" | null,
      movedDate: plan.movedDate as string | null, excluded: plan.excluded === true, unscheduled: plan.unscheduled === true }, changedAt };
  }
  return null;
}

function validId(value: unknown, limit: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= limit;
}

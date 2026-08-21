import type { ConfidenceLevel, ConfidenceOverrideRecord, LearnerConfidence } from "@/lib/confidence/types";
import { normalizeConfidenceLocalState } from "@/lib/confidence/local-state";
import { normalizeStudyPlanLocalState } from "@/lib/study-plan/local-state";
import type { Assessment, StudyPlanWeekday } from "@/lib/study-plan/types";

export const ACCOUNT_STATE_PROTOCOL_VERSION = 1 as const;
export const ACCOUNT_STATE_PLANNER_VERSION = 1 as const;
export const MAX_ACCOUNT_STATE_MUTATIONS = 500;
export const MAX_ACCOUNT_STATE_REQUEST_BYTES = 256_000;

export type SyncedStudyPlanSettings = { weeklyMinutes: number; availableDays: StudyPlanWeekday[]; changedAt: string };
export type SyncedAssessment = { assessment: Assessment; changedAt: string };
export type SyncedPlanItemState = {
  itemKey: string; weekStart: string; plannerVersion: number;
  state: "completed" | "skipped" | null; movedDate: string | null;
  excluded: boolean; unscheduled: boolean; changedAt: string;
};
export type AccountLearnerState = {
  settings: SyncedStudyPlanSettings | null;
  assessments: SyncedAssessment[];
  ratings: LearnerConfidence[];
  overrides: ConfidenceOverrideRecord[];
  planItems: SyncedPlanItemState[];
};

export type AccountStateMutation =
  | { kind: "settings_replace"; settings: Omit<SyncedStudyPlanSettings, "changedAt">; changedAt: string }
  | { kind: "assessment_upsert"; assessment: Assessment; changedAt: string }
  | { kind: "assessment_delete"; assessmentId: string; changedAt: string }
  | { kind: "confidence_upsert"; skillPathId: string; level: ConfidenceLevel; setAt: string; changedAt: string }
  | { kind: "confidence_delete"; skillPathId: string; changedAt: string }
  | { kind: "override_upsert"; override: ConfidenceOverrideRecord; changedAt: string }
  | { kind: "override_delete"; skillPathId: string; changedAt: string }
  | { kind: "plan_item_upsert"; item: Omit<SyncedPlanItemState, "changedAt">; changedAt: string };

export function emptyAccountLearnerState(): AccountLearnerState {
  return { settings: null, assessments: [], ratings: [], overrides: [], planItems: [] };
}

export function normalizeAccountLearnerState(value: unknown): AccountLearnerState {
  if (!value || typeof value !== "object") return emptyAccountLearnerState();
  const input = value as Partial<AccountLearnerState>;
  const settings = input.settings ? normalizeStudyPlanLocalState({ version: 3, setup: {
    weeklyMinutes: input.settings.weeklyMinutes, availableDays: input.settings.availableDays, assessments: [],
  } }).setup : null;
  const assessments = normalizeStudyPlanLocalState({ version: 3, setup: {
    weeklyMinutes: 60, availableDays: ["mon"],
    assessments: Array.isArray(input.assessments) ? input.assessments.map((entry) => entry.assessment) : [],
  } }).setup?.assessments ?? [];
  const confidence = normalizeConfidenceLocalState({
    ratings: Object.fromEntries((Array.isArray(input.ratings) ? input.ratings : []).map((entry) => [entry.skillPathId, entry])),
    overrides: Object.fromEntries((Array.isArray(input.overrides) ? input.overrides : []).map((entry) => [entry.skillPathId, entry])),
  });
  const settingsChangedAt = timestamp(input.settings?.changedAt);
  return {
    settings: settings && settingsChangedAt ? { weeklyMinutes: settings.weeklyMinutes, availableDays: settings.availableDays, changedAt: settingsChangedAt } : null,
    assessments: assessments.map((assessment) => {
      const source = (Array.isArray(input.assessments) ? input.assessments : []).find((entry) => entry.assessment?.id === assessment.id);
      return source && timestamp(source.changedAt) ? { assessment, changedAt: source.changedAt } : null;
    }).filter((entry): entry is SyncedAssessment => entry !== null),
    ratings: Object.values(confidence.ratings),
    overrides: Object.values(confidence.overrides),
    planItems: (Array.isArray(input.planItems) ? input.planItems : []).map(normalizePlanItem).filter((entry): entry is SyncedPlanItemState => entry !== null).slice(0, 500),
  };
}

export function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function timestamp(value: unknown) { return isTimestamp(value) ? value : null; }

function normalizePlanItem(value: unknown): SyncedPlanItemState | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<SyncedPlanItemState>;
  if (typeof item.itemKey !== "string" || !item.itemKey || item.itemKey.length > 240) return null;
  if (typeof item.weekStart !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item.weekStart)) return null;
  if (!Number.isInteger(item.plannerVersion) || Number(item.plannerVersion) < 1 || Number(item.plannerVersion) > 1000) return null;
  if (item.state !== null && item.state !== "completed" && item.state !== "skipped") return null;
  if (item.movedDate !== null && (typeof item.movedDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item.movedDate))) return null;
  if (!isTimestamp(item.changedAt)) return null;
  return { itemKey: item.itemKey, weekStart: item.weekStart, plannerVersion: Number(item.plannerVersion), state: item.state,
    movedDate: item.movedDate, excluded: item.excluded === true, unscheduled: item.unscheduled === true, changedAt: item.changedAt };
}

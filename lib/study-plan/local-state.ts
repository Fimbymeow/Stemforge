import { MAX_WEEKLY_MINUTES } from "@/lib/study-plan/constants";
import { isValidDateOnly } from "@/lib/study-plan/dates";
import type {
  Assessment,
  StudyPlanAssessmentQualifier,
  StudyPlanPreservationInput,
  StudyPlanPreviousWeek,
  StudyPlanWeekday,
  StudyPlanWeeklyPlan,
} from "@/lib/study-plan/types";

export const STUDY_PLAN_LOCAL_STATE_VERSION = 3 as const;
export const STUDY_PLAN_LOCAL_STATE_STORAGE_KEY = "orthic.studyPlan.v1";
export const STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT = "orthic:study-plan-updated";

const WEEKDAYS: readonly StudyPlanWeekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const VALID_WEEKDAYS = new Set<StudyPlanWeekday>(WEEKDAYS);
const ITEM_KEY_LIMIT = 200;
const ASSESSMENT_LIMIT = 20;
const ASSESSMENT_SCOPE_LIMIT = 50;

/** Legacy (pre-v3) single-course hardcode used only to migrate a learner's `examDate` into an Assessment. */
const LEGACY_FINAL_EXAM_COURSE_SLUG = "higher-maths";

export type StudyPlanSetup = {
  weeklyMinutes: number;
  availableDays: StudyPlanWeekday[];
  assessments: Assessment[];
};

export type StudyPlanLocalState = {
  version: typeof STUDY_PLAN_LOCAL_STATE_VERSION;
  setup: StudyPlanSetup | null;
  plan: StudyPlanWeeklyPlan | null;
  previousWeek: StudyPlanPreviousWeek | null;
  preservation: {
    itemStates: Record<string, "completed" | "skipped">;
    movedDates: Record<string, string>;
    excludedItemKeys: string[];
    unscheduledItemKeys?: string[];
  };
};

export function emptyStudyPlanLocalState(): StudyPlanLocalState {
  return {
    version: STUDY_PLAN_LOCAL_STATE_VERSION,
    setup: null,
    plan: null,
    previousWeek: null,
    preservation: { itemStates: {}, movedDates: {}, excludedItemKeys: [] },
  };
}

export function normalizeStudyPlanLocalState(value: unknown): StudyPlanLocalState {
  if (!value || typeof value !== "object") return emptyStudyPlanLocalState();
  const candidate = value as { setup?: unknown; plan?: unknown; previousWeek?: unknown; preservation?: unknown };
  return {
    version: STUDY_PLAN_LOCAL_STATE_VERSION,
    setup: normalizeSetup(candidate.setup),
    plan: normalizeWeeklyPlan(candidate.plan),
    previousWeek: normalizePreviousWeek(candidate.previousWeek),
    preservation: normalizePreservation(candidate.preservation),
  };
}

export function parseStoredStudyPlanLocalState(raw: string | null): StudyPlanLocalState {
  if (!raw) return emptyStudyPlanLocalState();
  try {
    const parsed = JSON.parse(raw) as { version?: unknown };
    if (parsed.version === 1) return migrateV1(parsed);
    if (parsed.version === 2) return migrateV2(parsed);
    if (parsed.version !== STUDY_PLAN_LOCAL_STATE_VERSION) return emptyStudyPlanLocalState();
    return normalizeStudyPlanLocalState(parsed);
  } catch {
    return emptyStudyPlanLocalState();
  }
}

export function readStudyPlanLocalState(storage: Pick<Storage, "getItem">): StudyPlanLocalState {
  try {
    return parseStoredStudyPlanLocalState(storage.getItem(STUDY_PLAN_LOCAL_STATE_STORAGE_KEY));
  } catch {
    return emptyStudyPlanLocalState();
  }
}

export function writeStudyPlanLocalState(storage: Pick<Storage, "setItem">, value: StudyPlanLocalState): boolean {
  try {
    storage.setItem(STUDY_PLAN_LOCAL_STATE_STORAGE_KEY, JSON.stringify(normalizeStudyPlanLocalState(value)));
    return true;
  } catch {
    return false;
  }
}

export function clearStudyPlanLocalState(storage: Pick<Storage, "removeItem">): boolean {
  try {
    storage.removeItem(STUDY_PLAN_LOCAL_STATE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function localCalendarDate(now: Date, timeZone?: string): Date {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(now);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return new Date(Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day)));
  }
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function localDayKey(now: Date, timeZone?: string): string {
  return localCalendarDate(now, timeZone).toISOString().slice(0, 10);
}

export function preservationInput(state: StudyPlanLocalState): StudyPlanPreservationInput {
  return state.plan?.preservation ?? state.preservation;
}

export function previousWeekFrom(plan: StudyPlanWeeklyPlan): StudyPlanPreviousWeek {
  return {
    weekStart: plan.weekStart,
    generatedAt: plan.generatedAt,
    items: plan.items.slice(0, ITEM_KEY_LIMIT).map(({ itemKey, state, manualOverride }) => ({ itemKey, state, manualOverride })),
  };
}

function normalizeSetup(value: unknown): StudyPlanSetup | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<StudyPlanSetup>;
  const weeklyMinutes = Number(candidate.weeklyMinutes);
  const availableDays = Array.isArray(candidate.availableDays)
    ? unique(candidate.availableDays.filter((day): day is StudyPlanWeekday => typeof day === "string" && VALID_WEEKDAYS.has(day as StudyPlanWeekday)))
    : [];
  if (!Number.isInteger(weeklyMinutes) || weeklyMinutes <= 0 || weeklyMinutes > MAX_WEEKLY_MINUTES || availableDays.length === 0) return null;
  const assessments = Array.isArray(candidate.assessments)
    ? candidate.assessments.map(normalizeAssessment).filter((assessment): assessment is Assessment => assessment !== null).slice(0, ASSESSMENT_LIMIT)
    : [];
  return { weeklyMinutes, availableDays, assessments };
}

function normalizeAssessment(value: unknown): Assessment | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<Assessment>;
  if (!validItemKey(candidate.id) || !validItemKey(candidate.courseSlug) || !validItemKey(candidate.title)) return null;
  if (candidate.type !== "class_test" && candidate.type !== "prelim" && candidate.type !== "final_exam" && candidate.type !== "other") return null;
  const date = normalizeAssessmentDate(candidate.date);
  if (!date) return null;
  const scope = normalizeAssessmentScope(candidate.scope);
  if (!scope) return null;
  const source = candidate.source === "orthic_provisional" || candidate.source === "official" ? candidate.source : "learner";
  return { id: candidate.id, courseSlug: candidate.courseSlug, type: candidate.type, title: candidate.title, date, scope, source };
}

function normalizeAssessmentDate(value: unknown): Assessment["date"] | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { precision?: unknown; date?: unknown; year?: unknown; month?: unknown };
  if (candidate.precision === "exact" && typeof candidate.date === "string" && isValidDateOnly(candidate.date)) {
    return { precision: "exact", date: candidate.date };
  }
  if (
    candidate.precision === "month"
    && Number.isInteger(candidate.year) && (candidate.year as number) >= 2000 && (candidate.year as number) <= 2100
    && Number.isInteger(candidate.month) && (candidate.month as number) >= 1 && (candidate.month as number) <= 12
  ) {
    return { precision: "month", year: candidate.year as number, month: candidate.month as number };
  }
  return null;
}

function normalizeAssessmentScope(value: unknown): Assessment["scope"] | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { kind?: unknown; topicIds?: unknown; skillPathIds?: unknown; specPointIds?: unknown };
  if (candidate.kind === "whole_course") return { kind: "whole_course" };
  if (candidate.kind === "topics" && Array.isArray(candidate.topicIds)) {
    const ids = unique(candidate.topicIds.filter((id): id is string => typeof id === "string" && id.length > 0)).slice(0, ASSESSMENT_SCOPE_LIMIT);
    return ids.length ? { kind: "topics", topicIds: ids } : null;
  }
  if (candidate.kind === "skills" && Array.isArray(candidate.skillPathIds)) {
    const ids = unique(candidate.skillPathIds.filter((id): id is string => typeof id === "string" && id.length > 0)).slice(0, ASSESSMENT_SCOPE_LIMIT);
    return ids.length ? { kind: "skills", skillPathIds: ids } : null;
  }
  if (candidate.kind === "requirements" && Array.isArray(candidate.specPointIds)) {
    const ids = unique(candidate.specPointIds.filter((id): id is string => typeof id === "string" && id.length > 0)).slice(0, ASSESSMENT_SCOPE_LIMIT);
    return ids.length ? { kind: "requirements", specPointIds: ids } : null;
  }
  return null;
}

function isAssessmentQualifier(value: unknown): value is StudyPlanAssessmentQualifier {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StudyPlanAssessmentQualifier>;
  return validItemKey(candidate.assessmentId) && validItemKey(candidate.title)
    && (candidate.type === "class_test" || candidate.type === "prelim" || candidate.type === "final_exam" || candidate.type === "other")
    && (candidate.phase === "close" || candidate.phase === "medium" || candidate.phase === "far")
    && (candidate.daysUntil === null || (typeof candidate.daysUntil === "number" && Number.isFinite(candidate.daysUntil)));
}

function normalizePreservation(value: unknown): StudyPlanLocalState["preservation"] {
  if (!value || typeof value !== "object") return { itemStates: {}, movedDates: {}, excludedItemKeys: [] };
  const candidate = value as Partial<StudyPlanLocalState["preservation"]>;
  const unscheduledItemKeys = Array.isArray(candidate.unscheduledItemKeys)
    ? unique(candidate.unscheduledItemKeys.filter(validItemKey)).slice(0, ITEM_KEY_LIMIT)
    : [];
  return {
    itemStates: normalizeRecord(candidate.itemStates, (entry): entry is "completed" | "skipped" => entry === "completed" || entry === "skipped"),
    movedDates: normalizeRecord(candidate.movedDates, (entry): entry is string => typeof entry === "string" && isValidDateOnly(entry)),
    excludedItemKeys: Array.isArray(candidate.excludedItemKeys)
      ? unique(candidate.excludedItemKeys.filter(validItemKey)).slice(0, ITEM_KEY_LIMIT)
      : [],
    ...(unscheduledItemKeys.length ? { unscheduledItemKeys } : {}),
  };
}

function normalizeWeeklyPlan(value: unknown): StudyPlanWeeklyPlan | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<StudyPlanWeeklyPlan>;
  const preferences = normalizePreferences(candidate.preferences);
  if (!preferences || !isValidDateOnly(String(candidate.weekStart ?? "")) || !Array.isArray(candidate.items)) return null;
  if (candidate.generationVersion !== 1 || typeof candidate.generatedAt !== "string" || !Number.isFinite(Date.parse(candidate.generatedAt))) return null;
  const items = candidate.items.filter(isWeeklyItem).slice(0, ITEM_KEY_LIMIT);
  const preservation = normalizeWeeklyPreservation(candidate.preservation);
  const diagnostics = normalizeDiagnostics(candidate.rebalanceDiagnostics);
  if (!diagnostics) return null;
  return {
    status: candidate.status === "ok" || candidate.status === "invalid_input" || candidate.status === "course_missing" || candidate.status === "no_available_content" ? candidate.status : "invalid_input",
    errorCode: typeof candidate.errorCode === "string" ? candidate.errorCode : null,
    weekStart: candidate.weekStart as string,
    generatedAt: candidate.generatedAt,
    generationVersion: 1,
    courseSlug: preferences.courseSlug,
    weeklyMinutes: preferences.weeklyMinutes,
    allocatedMinutes: boundedNumber(candidate.allocatedMinutes, 0, preferences.weeklyMinutes),
    unusedMinutes: boundedNumber(candidate.unusedMinutes, 0, preferences.weeklyMinutes),
    examPhase: candidate.examPhase === "close" || candidate.examPhase === "medium" || candidate.examPhase === "far" ? candidate.examPhase : "no_date",
    caughtUp: candidate.caughtUp === true,
    preferences,
    items,
    preservation,
    lastRebalancedAt: typeof candidate.lastRebalancedAt === "string" && Number.isFinite(Date.parse(candidate.lastRebalancedAt)) ? candidate.lastRebalancedAt : candidate.generatedAt,
    rebalanceReasons: Array.isArray(candidate.rebalanceReasons) ? candidate.rebalanceReasons.filter(isRebalanceReason).slice(-8) : [],
    rebalanceDiagnostics: diagnostics,
  };
}

function normalizePreviousWeek(value: unknown): StudyPlanPreviousWeek | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<StudyPlanPreviousWeek>;
  if (!isValidDateOnly(String(candidate.weekStart ?? "")) || typeof candidate.generatedAt !== "string" || !Number.isFinite(Date.parse(candidate.generatedAt)) || !Array.isArray(candidate.items)) return null;
  return {
    weekStart: candidate.weekStart as string,
    generatedAt: candidate.generatedAt,
    items: candidate.items.filter((item): item is StudyPlanPreviousWeek["items"][number] => {
      if (!item || typeof item !== "object") return false;
      const entry = item as StudyPlanPreviousWeek["items"][number];
      return validItemKey(entry.itemKey) && (entry.state === "planned" || entry.state === "completed" || entry.state === "skipped")
        && (entry.manualOverride === null || ["completed", "skipped", "moved", "later", "pulled_forward"].includes(entry.manualOverride));
    }).slice(0, ITEM_KEY_LIMIT),
  };
}

function normalizePreferences(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { courseSlug?: unknown; weeklyMinutes?: unknown; availableDays?: unknown; assessments?: unknown };
  const setup = normalizeSetup(candidate);
  return setup && typeof candidate.courseSlug === "string" && candidate.courseSlug.length > 0 && candidate.courseSlug.length <= 100
    ? { courseSlug: candidate.courseSlug, ...setup }
    : null;
}

function normalizeWeeklyPreservation(value: unknown): StudyPlanWeeklyPlan["preservation"] {
  const base = normalizePreservation(value);
  const candidate = value as { unscheduledItemKeys?: unknown } | null;
  return {
    ...base,
    unscheduledItemKeys: Array.isArray(candidate?.unscheduledItemKeys)
      ? unique(candidate.unscheduledItemKeys.filter(validItemKey)).slice(0, ITEM_KEY_LIMIT)
      : [],
  };
}

function isWeeklyItem(value: unknown): value is StudyPlanWeeklyPlan["items"][number] {
  if (!value || typeof value !== "object") return false;
  const item = value as StudyPlanWeeklyPlan["items"][number];
  return validItemKey(item.itemKey) && typeof item.id === "string" && typeof item.skillPathId === "string"
    && typeof item.skillName === "string" && typeof item.href === "string" && isValidDateOnly(item.date)
    && isValidDateOnly(item.originalSuggestedDate) && (item.scheduledDate === null || isValidDateOnly(item.scheduledDate))
    && Number.isFinite(item.suggestedMinutes) && item.suggestedMinutes > 0
    && ["review", "notes", "continue_stage", "targeted_practice"].includes(item.actionType)
    && ["review_overdue", "review_due", "review_due_soon", "continue_with_mistake", "continue", "recent_mistakes", "next_skill"].includes(item.reasonCode)
    && Number.isInteger(item.tier) && item.tier >= 0 && item.tier <= 6
    && (item.stageId === null || typeof item.stageId === "string")
    && (item.stageName === null || typeof item.stageName === "string")
    && (item.examQualifier === null || item.examQualifier === "close" || item.examQualifier === "medium" || item.examQualifier === "far")
    && (item.assessmentQualifier === null || isAssessmentQualifier(item.assessmentQualifier))
    && (item.state === "planned" || item.state === "completed" || item.state === "skipped")
    && (item.manualOverride === null || ["completed", "skipped", "moved", "later", "pulled_forward"].includes(item.manualOverride));
}

function normalizeDiagnostics(value: unknown): StudyPlanWeeklyPlan["rebalanceDiagnostics"] | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<StudyPlanWeeklyPlan["rebalanceDiagnostics"]>;
  if (!isRebalanceReason(candidate.reason)) return null;
  return {
    reason: candidate.reason,
    itemsPreserved: boundedNumber(candidate.itemsPreserved, 0, ITEM_KEY_LIMIT),
    itemsMoved: boundedNumber(candidate.itemsMoved, 0, ITEM_KEY_LIMIT),
    itemsAdded: boundedNumber(candidate.itemsAdded, 0, ITEM_KEY_LIMIT),
    itemsRemoved: boundedNumber(candidate.itemsRemoved, 0, ITEM_KEY_LIMIT),
    unusedCapacityBefore: boundedNumber(candidate.unusedCapacityBefore, 0, MAX_WEEKLY_MINUTES),
    unusedCapacityAfter: boundedNumber(candidate.unusedCapacityAfter, 0, MAX_WEEKLY_MINUTES),
    planDistance: boundedNumber(candidate.planDistance, 0, ITEM_KEY_LIMIT * 3),
  };
}

function isRebalanceReason(value: unknown): value is StudyPlanWeeklyPlan["rebalanceReasons"][number] {
  return typeof value === "string" && [
    "initial_generation", "day_missed", "review_became_due", "preferences_changed", "item_completed",
    "manual_move", "manual_skip", "manual_swap", "pull_forward", "weekly_rollover", "explicit_refresh", "evidence_changed",
  ].includes(value);
}

function boundedNumber(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : minimum;
}

/**
 * v1 and v2 stored the same legacy setup shape (`{ weeklyMinutes, availableDays, examDate }`), so
 * both jump straight to the current version via `migrateV2`, matching the existing v1->v2
 * precedent of migrating directly to the live shape rather than replaying intermediate versions.
 */
function migrateV1(value: unknown): StudyPlanLocalState {
  return migrateV2(value);
}

function migrateV2(value: unknown): StudyPlanLocalState {
  const candidate = value as { setup?: unknown; preservation?: unknown };
  const legacySetup = normalizeLegacySetup(candidate.setup);
  const setup: StudyPlanSetup | null = legacySetup
    ? {
        weeklyMinutes: legacySetup.weeklyMinutes,
        availableDays: legacySetup.availableDays,
        assessments: legacySetup.examDate ? [assessmentFromLegacyExamDate(legacySetup.examDate)] : [],
      }
    : null;
  return {
    ...emptyStudyPlanLocalState(),
    setup,
    preservation: normalizePreservation(candidate.preservation),
  };
}

function normalizeLegacySetup(value: unknown): { weeklyMinutes: number; availableDays: StudyPlanWeekday[]; examDate: string | null } | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { weeklyMinutes?: unknown; availableDays?: unknown; examDate?: unknown };
  const weeklyMinutes = Number(candidate.weeklyMinutes);
  const availableDays = Array.isArray(candidate.availableDays)
    ? unique(candidate.availableDays.filter((day): day is StudyPlanWeekday => typeof day === "string" && VALID_WEEKDAYS.has(day as StudyPlanWeekday)))
    : [];
  if (!Number.isInteger(weeklyMinutes) || weeklyMinutes <= 0 || weeklyMinutes > MAX_WEEKLY_MINUTES || availableDays.length === 0) return null;
  const examDate = typeof candidate.examDate === "string" && isValidDateOnly(candidate.examDate) ? candidate.examDate : null;
  return { weeklyMinutes, availableDays, examDate };
}

/**
 * A learner's pre-v3 `examDate` becomes a single learner-owned, exact-precision, whole-course
 * final-exam Assessment. Because `effectiveAssessments` only adds the repository provisional
 * default when the learner has no whole-course final exam of their own, this migration can never
 * produce a duplicate "final exam" entry (Part J/L).
 */
function assessmentFromLegacyExamDate(examDate: string): Assessment {
  return {
    id: "legacy:final-exam",
    courseSlug: LEGACY_FINAL_EXAM_COURSE_SLUG,
    type: "final_exam",
    title: "Higher Maths final exam",
    date: { precision: "exact", date: examDate },
    scope: { kind: "whole_course" },
    source: "learner",
  };
}

function normalizeRecord<T extends string>(value: unknown, accepts: (entry: unknown) => entry is T): Record<string, T> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, entry]) => validItemKey(key) && accepts(entry)).slice(0, ITEM_KEY_LIMIT));
}

function validItemKey(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 240;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

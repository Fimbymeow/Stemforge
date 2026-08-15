import { MAX_WEEKLY_MINUTES } from "@/lib/study-plan/constants";
import { isValidDateOnly } from "@/lib/study-plan/dates";
import type { StudyPlanPreservationInput, StudyPlanWeekday } from "@/lib/study-plan/types";

export const STUDY_PLAN_LOCAL_STATE_VERSION = 1 as const;
export const STUDY_PLAN_LOCAL_STATE_STORAGE_KEY = "orthic.studyPlan.v1";
export const STUDY_PLAN_LOCAL_STATE_UPDATED_EVENT = "orthic:study-plan-updated";

const WEEKDAYS: readonly StudyPlanWeekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const VALID_WEEKDAYS = new Set<StudyPlanWeekday>(WEEKDAYS);
const ITEM_KEY_LIMIT = 200;

export type StudyPlanSetup = {
  weeklyMinutes: number;
  availableDays: StudyPlanWeekday[];
  examDate: string | null;
};

export type StudyPlanLocalState = {
  version: typeof STUDY_PLAN_LOCAL_STATE_VERSION;
  setup: StudyPlanSetup | null;
  preservation: {
    itemStates: Record<string, "completed" | "skipped">;
    movedDates: Record<string, string>;
    excludedItemKeys: string[];
  };
};

export function emptyStudyPlanLocalState(): StudyPlanLocalState {
  return {
    version: STUDY_PLAN_LOCAL_STATE_VERSION,
    setup: null,
    preservation: { itemStates: {}, movedDates: {}, excludedItemKeys: [] },
  };
}

export function normalizeStudyPlanLocalState(value: unknown): StudyPlanLocalState {
  if (!value || typeof value !== "object") return emptyStudyPlanLocalState();
  const candidate = value as { setup?: unknown; preservation?: unknown };
  return {
    version: STUDY_PLAN_LOCAL_STATE_VERSION,
    setup: normalizeSetup(candidate.setup),
    preservation: normalizePreservation(candidate.preservation),
  };
}

export function parseStoredStudyPlanLocalState(raw: string | null): StudyPlanLocalState {
  if (!raw) return emptyStudyPlanLocalState();
  try {
    const parsed = JSON.parse(raw) as { version?: unknown };
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
  return state.preservation;
}

function normalizeSetup(value: unknown): StudyPlanSetup | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<StudyPlanSetup>;
  const weeklyMinutes = Number(candidate.weeklyMinutes);
  const availableDays = Array.isArray(candidate.availableDays)
    ? unique(candidate.availableDays.filter((day): day is StudyPlanWeekday => typeof day === "string" && VALID_WEEKDAYS.has(day as StudyPlanWeekday)))
    : [];
  if (!Number.isInteger(weeklyMinutes) || weeklyMinutes <= 0 || weeklyMinutes > MAX_WEEKLY_MINUTES || availableDays.length === 0) return null;
  const examDate = typeof candidate.examDate === "string" && isValidDateOnly(candidate.examDate) ? candidate.examDate : null;
  return { weeklyMinutes, availableDays, examDate };
}

function normalizePreservation(value: unknown): StudyPlanLocalState["preservation"] {
  if (!value || typeof value !== "object") return { itemStates: {}, movedDates: {}, excludedItemKeys: [] };
  const candidate = value as Partial<StudyPlanLocalState["preservation"]>;
  return {
    itemStates: normalizeRecord(candidate.itemStates, (entry): entry is "completed" | "skipped" => entry === "completed" || entry === "skipped"),
    movedDates: normalizeRecord(candidate.movedDates, (entry): entry is string => typeof entry === "string" && isValidDateOnly(entry)),
    excludedItemKeys: Array.isArray(candidate.excludedItemKeys)
      ? unique(candidate.excludedItemKeys.filter(validItemKey)).slice(0, ITEM_KEY_LIMIT)
      : [],
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

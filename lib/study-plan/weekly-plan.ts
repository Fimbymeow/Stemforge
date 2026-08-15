import { generateStudyPlan } from "@/lib/study-plan/planner";
import { datesForAvailableDays, dateIsInWeek, isAvailableDate, utcDayKey, utcWeekStart } from "@/lib/study-plan/dates";
import type { ProgressEvidence } from "@/lib/progress/types";
import type {
  StudyPlanPreferences,
  StudyPlanPreservationInput,
  StudyPlanRebalanceDiagnostics,
  StudyPlanRebalanceReason,
  StudyPlanResult,
  StudyPlanWeeklyItem,
  StudyPlanWeeklyPlan,
} from "@/lib/study-plan/types";

type RebalanceInput = {
  currentPlan: StudyPlanWeeklyPlan | null;
  evidence: ProgressEvidence;
  preferences: StudyPlanPreferences;
  now: Date;
  calendarDate: Date;
  reason: StudyPlanRebalanceReason;
};

const EMPTY_PRESERVATION: StudyPlanWeeklyPlan["preservation"] = {
  itemStates: {}, movedDates: {}, excludedItemKeys: [], unscheduledItemKeys: [],
};

export function rebalanceStudyPlan(input: RebalanceInput): StudyPlanWeeklyPlan {
  const today = utcDayKey(input.calendarDate);
  const weekStart = utcWeekStart(input.calendarDate);
  const rollover = input.currentPlan !== null && input.currentPlan.weekStart !== weekStart;
  const preferencesChanged = input.currentPlan !== null && !samePreferences(input.currentPlan.preferences, input.preferences);
  const hardRegeneration = !input.currentPlan || rollover || preferencesChanged;
  const previousPreservation = !rollover && input.currentPlan ? input.currentPlan.preservation : EMPTY_PRESERVATION;
  const preservation = sanitizePreservation(previousPreservation, weekStart, input.preferences, today, hardRegeneration);
  const fresh = generateStudyPlan({
    now: input.now,
    calendarDate: input.calendarDate,
    evidence: input.evidence,
    preferences: input.preferences,
    preservation,
  });
  const reason = rollover ? "weekly_rollover" : preferencesChanged ? "preferences_changed" : input.reason;
  return reconcileStudyPlanResult({ current: rollover ? null : input.currentPlan, fresh, preferences: input.preferences, preservation, today, reason, now: input.now });
}

export function createInitialWeeklyPlan(input: Omit<RebalanceInput, "currentPlan" | "reason">, preservation?: StudyPlanPreservationInput) {
  const fresh = generateStudyPlan({ ...input, preservation });
  return reconcileStudyPlanResult({
    current: null,
    fresh,
    preferences: input.preferences,
    preservation: { ...EMPTY_PRESERVATION, ...preservation, unscheduledItemKeys: [] },
    today: utcDayKey(input.calendarDate),
    reason: "initial_generation",
    now: input.now,
  });
}

export function updateWeeklyItemState(plan: StudyPlanWeeklyPlan, itemKey: string, state: "completed" | "skipped", now: Date): StudyPlanWeeklyPlan {
  const itemStates = { ...plan.preservation.itemStates, [itemKey]: state };
  const items = plan.items.map((item) => item.itemKey === itemKey
    ? { ...item, state, manualOverride: state } as StudyPlanWeeklyItem
    : item);
  return withManualChange(plan, items, { ...plan.preservation, itemStates }, state === "completed" ? "item_completed" : "manual_skip", now);
}

export function moveWeeklyItem(plan: StudyPlanWeeklyPlan, itemKey: string, date: string | null, today: string, now: Date): StudyPlanWeeklyPlan {
  const item = plan.items.find((entry) => entry.itemKey === itemKey);
  if (!item || item.state !== "planned") return plan;
  if (date !== null && (date < today || !dateIsInWeek(date, plan.weekStart) || !isAvailableDate(date, plan.weekStart, plan.preferences.availableDays))) return plan;
  const movedDates = { ...plan.preservation.movedDates };
  const unscheduled = new Set(plan.preservation.unscheduledItemKeys);
  if (date === null) {
    delete movedDates[itemKey];
    unscheduled.add(itemKey);
  } else {
    movedDates[itemKey] = date;
    unscheduled.delete(itemKey);
  }
  const items = plan.items.map((entry) => entry.itemKey === itemKey
    ? { ...entry, scheduledDate: date, manualOverride: date === null ? "later" : "moved" } as StudyPlanWeeklyItem
    : entry);
  return withManualChange(plan, items, { ...plan.preservation, movedDates, unscheduledItemKeys: [...unscheduled] }, "manual_move", now);
}

export function pullForwardWeeklyItem(plan: StudyPlanWeeklyPlan, today: string, now: Date): StudyPlanWeeklyPlan {
  const candidate = [...plan.items]
    .filter((item) => item.state === "planned" && item.scheduledDate !== null && item.scheduledDate > today && item.manualOverride !== "moved")
    .sort(compareWeeklyItems)[0];
  if (!candidate) return plan;
  const items = plan.items.map((item) => item.itemKey === candidate.itemKey
    ? { ...item, scheduledDate: today, manualOverride: "pulled_forward" } as StudyPlanWeeklyItem
    : item);
  const preservation = {
    ...plan.preservation,
    movedDates: { ...plan.preservation.movedDates, [candidate.itemKey]: today },
  };
  return withManualChange(plan, items, preservation, "pull_forward", now);
}

export function replaceWeeklyItem(plan: StudyPlanWeeklyPlan, itemKey: string, replacement: StudyPlanWeeklyItem, now: Date): StudyPlanWeeklyPlan {
  const existing = plan.items.find((item) => item.itemKey === itemKey);
  if (!existing || existing.state !== "planned" || plan.items.some((item) => item.itemKey === replacement.itemKey)) return plan;
  const nextReplacement = { ...replacement, scheduledDate: existing.scheduledDate, originalSuggestedDate: replacement.originalSuggestedDate };
  const items = plan.items.map((item) => item.itemKey === itemKey ? nextReplacement : item);
  const preservation = {
    ...plan.preservation,
    excludedItemKeys: [...new Set([...plan.preservation.excludedItemKeys, itemKey])],
  };
  return withManualChange(plan, items, preservation, "manual_swap", now);
}

export function todayPlanItems(plan: StudyPlanWeeklyPlan, today: string) {
  return plan.items.filter((item) => item.scheduledDate === today && item.state !== "skipped").sort(compareWeeklyItems);
}

export function canPullForward(plan: StudyPlanWeeklyPlan, today: string) {
  const todayItems = todayPlanItems(plan, today);
  return todayItems.length > 0
    && todayItems.every((item) => item.state === "completed")
    && plan.items.some((item) => item.state === "planned" && item.scheduledDate !== null && item.scheduledDate > today && item.manualOverride !== "moved");
}

export function reconcileStudyPlanResult(input: {
  current: StudyPlanWeeklyPlan | null;
  fresh: StudyPlanResult;
  preferences: StudyPlanPreferences;
  preservation: StudyPlanWeeklyPlan["preservation"];
  today: string;
  reason: StudyPlanRebalanceReason;
  now: Date;
}): StudyPlanWeeklyPlan {
  const freshByKey = new Map(input.fresh.items.map((item) => [item.itemKey, item]));
  const previousByKey = new Map(input.current?.items.map((item) => [item.itemKey, item]) ?? []);
  const retainedHistory = (input.current?.items ?? []).filter((item) => item.state !== "planned");
  const active = input.fresh.items.map((item): StudyPlanWeeklyItem => {
    const previous = previousByKey.get(item.itemKey);
    const manuallyUnscheduled = input.preservation.unscheduledItemKeys.includes(item.itemKey);
    const validPreviousDate = previous?.scheduledDate
      && previous.scheduledDate >= input.today
      && isAvailableDate(previous.scheduledDate, input.fresh.weekStart, input.preferences.availableDays);
    const scheduledDate = manuallyUnscheduled ? null
      : previous && previous.state !== "planned" ? previous.scheduledDate
      : validPreviousDate ? previous.scheduledDate
      : item.date;
    return {
      ...item,
      state: previous && previous.state !== "planned" ? previous.state : item.state,
      originalSuggestedDate: previous?.originalSuggestedDate ?? item.date,
      scheduledDate,
      manualOverride: previous?.manualOverride ?? (item.state === "completed" ? "completed" : item.state === "skipped" ? "skipped" : null),
    };
  });
  const retainedKeys = new Set(active.map((item) => item.itemKey));
  const mergedItems = [...retainedHistory.filter((item) => !retainedKeys.has(item.itemKey)), ...active].sort(compareWeeklyItems);
  const items = trimPlannedItemsToBudget(mergedItems, input.preferences.weeklyMinutes);
  const addedReview = items.some((item) => item.actionType === "review" && !previousByKey.has(item.itemKey));
  const effectiveReason = input.reason === "evidence_changed" && addedReview ? "review_became_due" : input.reason;
  const consumedMinutes = items.filter((item) => item.state !== "skipped").reduce((sum, item) => sum + item.suggestedMinutes, 0);
  const allocatedMinutes = Math.min(input.preferences.weeklyMinutes, consumedMinutes);
  const unusedMinutes = Math.max(0, input.preferences.weeklyMinutes - allocatedMinutes);
  const diagnostics = calculateDiagnostics(input.current, items, unusedMinutes, effectiveReason);
  return {
    ...input.fresh,
    allocatedMinutes,
    unusedMinutes,
    preferences: { ...input.preferences, availableDays: [...input.preferences.availableDays] },
    items,
    preservation: input.preservation,
    lastRebalancedAt: input.now.toISOString(),
    rebalanceReasons: appendReason(input.current?.rebalanceReasons ?? [], effectiveReason),
    rebalanceDiagnostics: diagnostics,
  };
}

function sanitizePreservation(
  value: StudyPlanWeeklyPlan["preservation"],
  weekStart: string,
  preferences: StudyPlanPreferences,
  today: string,
  hard: boolean,
): StudyPlanWeeklyPlan["preservation"] {
  const validDates = new Set(datesForAvailableDays(weekStart, preferences.availableDays).filter((date) => date >= today));
  const movedDates = Object.fromEntries(Object.entries(value.movedDates).filter(([, date]) => validDates.has(date)));
  return {
    itemStates: { ...value.itemStates },
    movedDates,
    excludedItemKeys: [...value.excludedItemKeys],
    unscheduledItemKeys: hard ? [] : [...value.unscheduledItemKeys],
  };
}

function withManualChange(
  plan: StudyPlanWeeklyPlan,
  items: StudyPlanWeeklyItem[],
  preservation: StudyPlanWeeklyPlan["preservation"],
  reason: StudyPlanRebalanceReason,
  now: Date,
): StudyPlanWeeklyPlan {
  const allocatedMinutes = items.filter((item) => item.state !== "skipped").reduce((sum, item) => sum + item.suggestedMinutes, 0);
  return {
    ...plan,
    items: [...items].sort(compareWeeklyItems),
    preservation,
    allocatedMinutes,
    unusedMinutes: Math.max(0, plan.weeklyMinutes - allocatedMinutes),
    lastRebalancedAt: now.toISOString(),
    rebalanceReasons: appendReason(plan.rebalanceReasons, reason),
    rebalanceDiagnostics: calculateDiagnostics(plan, items, Math.max(0, plan.weeklyMinutes - allocatedMinutes), reason),
  };
}

function calculateDiagnostics(current: StudyPlanWeeklyPlan | null, items: StudyPlanWeeklyItem[], unusedAfter: number, reason: StudyPlanRebalanceReason): StudyPlanRebalanceDiagnostics {
  const before = new Map(current?.items.map((item) => [item.itemKey, item]) ?? []);
  const after = new Map(items.map((item) => [item.itemKey, item]));
  let preserved = 0; let moved = 0; let added = 0; let removed = 0;
  for (const [key, item] of after) {
    const previous = before.get(key);
    if (!previous) added += 1;
    else if (previous.scheduledDate !== item.scheduledDate || previous.state !== item.state) moved += 1;
    else preserved += 1;
  }
  for (const key of before.keys()) if (!after.has(key)) removed += 1;
  return {
    reason,
    itemsPreserved: preserved,
    itemsMoved: moved,
    itemsAdded: added,
    itemsRemoved: removed,
    unusedCapacityBefore: current?.unusedMinutes ?? current?.weeklyMinutes ?? 0,
    unusedCapacityAfter: unusedAfter,
    planDistance: moved + added + removed,
  };
}

function samePreferences(left: StudyPlanPreferences, right: StudyPlanPreferences) {
  return left.courseSlug === right.courseSlug
    && left.weeklyMinutes === right.weeklyMinutes
    && left.examDate === right.examDate
    && [...left.availableDays].sort().join(",") === [...right.availableDays].sort().join(",");
}

function appendReason(reasons: StudyPlanRebalanceReason[], reason: StudyPlanRebalanceReason) {
  return [...reasons.slice(-7), reason];
}

function trimPlannedItemsToBudget(items: StudyPlanWeeklyItem[], weeklyMinutes: number) {
  const kept = [...items];
  let minutes = kept.filter((item) => item.state !== "skipped").reduce((sum, item) => sum + item.suggestedMinutes, 0);
  if (minutes <= weeklyMinutes) return kept;
  const removable = kept
    .filter((item) => item.state === "planned")
    .sort((left, right) => {
      const leftIsManual = left.manualOverride === null ? 0 : 1;
      const rightIsManual = right.manualOverride === null ? 0 : 1;
      return leftIsManual - rightIsManual || right.tier - left.tier || right.itemKey.localeCompare(left.itemKey);
    });
  const removed = new Set<string>();
  for (const item of removable) {
    if (minutes <= weeklyMinutes) break;
    removed.add(item.itemKey);
    minutes -= item.suggestedMinutes;
  }
  return kept.filter((item) => !removed.has(item.itemKey));
}

function compareWeeklyItems(left: StudyPlanWeeklyItem, right: StudyPlanWeeklyItem) {
  const leftDate = left.scheduledDate ?? "9999-12-31";
  const rightDate = right.scheduledDate ?? "9999-12-31";
  return leftDate.localeCompare(rightDate) || left.tier - right.tier || left.itemKey.localeCompare(right.itemKey);
}

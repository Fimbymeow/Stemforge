import assert from "node:assert/strict";
import test from "node:test";
import { getEmptyProgressEvidence } from "@/lib/local-progress";
import {
  canPullForward,
  moveWeeklyItem,
  pullForwardWeeklyItem,
  rebalanceStudyPlan,
  reconcileStudyPlanResult,
  replaceWeeklyItem,
  todayPlanItems,
  updateWeeklyItemState,
} from "@/lib/study-plan/weekly-plan";
import type { StudyPlanPreferences, StudyPlanResult, StudyPlanWeeklyItem, StudyPlanWeeklyPlan } from "@/lib/study-plan/types";
import { runP2Simulation } from "@/lib/study-plan/rebalance-simulation";

const NOW = new Date("2026-08-10T09:00:00.000Z");
const PREFS: StudyPlanPreferences = { courseSlug: "higher-maths", weeklyMinutes: 90, availableDays: ["mon", "wed", "sat"], assessments: [] };

test("missed work returns to remaining-week allocation without study debt", () => {
  const current = weekly(result([item("a", "2026-08-10", 1)]));
  const next = reconcile(current, result([item("a", "2026-08-12", 1)]), "2026-08-11", "day_missed");
  assert.equal(next.items[0].scheduledDate, "2026-08-12");
  assert.equal(next.rebalanceDiagnostics.reason, "day_missed");
  assert.equal(next.allocatedMinutes <= next.weeklyMinutes, true);
  assert.equal(next.items.some((entry) => entry.scheduledDate === "2026-08-11"), false);
});

test("soft rebalance preserves valid future placement and removes only stale lower-priority work", () => {
  const current = weekly(result([item("keep", "2026-08-12", 2), item("stale", "2026-08-10", 6)]));
  const next = reconcile(current, result([item("keep", "2026-08-15", 2)]), "2026-08-11", "day_missed");
  assert.deepEqual(next.items.map((entry) => [entry.skillPathId, entry.scheduledDate]), [["keep", "2026-08-12"]]);
  assert.equal(next.rebalanceDiagnostics.itemsRemoved, 1);
});

test("manual Move and Later this week stay sticky across soft rebalancing", () => {
  const current = weekly(result([item("moved", "2026-08-12", 2), item("later", "2026-08-12", 3)]));
  const movedKey = current.items.find((entry) => entry.skillPathId === "moved")!.itemKey;
  const laterKey = current.items.find((entry) => entry.skillPathId === "later")!.itemKey;
  const moved = moveWeeklyItem(current, movedKey, "2026-08-15", "2026-08-10", NOW);
  const later = moveWeeklyItem(moved, laterKey, null, "2026-08-10", NOW);
  const next = reconcile(later, result([item("moved", "2026-08-12", 2), item("later", "2026-08-12", 3)]), "2026-08-10", "evidence_changed");
  assert.equal(next.items.find((entry) => entry.skillPathId === "moved")?.scheduledDate, "2026-08-15");
  assert.equal(next.items.find((entry) => entry.skillPathId === "later")?.scheduledDate, null);
});

test("past and unavailable Move destinations are rejected", () => {
  const current = weekly(result([item("a", "2026-08-12", 2)]));
  assert.equal(moveWeeklyItem(current, current.items[0].itemKey, "2026-08-09", "2026-08-10", NOW), current);
  assert.equal(moveWeeklyItem(current, current.items[0].itemKey, "2026-08-11", "2026-08-10", NOW), current);
  assert.equal(moveWeeklyItem(current, current.items[0].itemKey, "2026-08-17", "2026-08-10", NOW), current);
});

test("Done and Skip are preserved and never reactivate during the current week", () => {
  let current = weekly(result([item("done", "2026-08-10", 2), item("skip", "2026-08-12", 3)]));
  current = updateWeeklyItemState(current, current.items[0].itemKey, "completed", NOW);
  current = updateWeeklyItemState(current, current.items[1].itemKey, "skipped", NOW);
  const next = reconcile(current, result([item("done", "2026-08-12", 2), item("skip", "2026-08-15", 3)]), "2026-08-11", "day_missed");
  assert.deepEqual(next.items.map((entry) => [entry.skillPathId, entry.state, entry.scheduledDate]), [
    ["done", "completed", "2026-08-10"], ["skip", "skipped", "2026-08-12"],
  ]);
});

test("Swap replaces one item without disturbing another or exceeding capacity", () => {
  const current = weekly(result([item("a", "2026-08-10", 2), item("b", "2026-08-12", 3)]));
  const replacement = weeklyItem(item("c", "2026-08-15", 4));
  const next = replaceWeeklyItem(current, current.items[0].itemKey, replacement, NOW);
  assert.deepEqual(next.items.map((entry) => entry.skillPathId), ["c", "b"]);
  assert.equal(next.items[0].scheduledDate, "2026-08-10");
  assert.equal(next.preservation.excludedItemKeys.includes(current.items[0].itemKey), true);
  assert.equal(next.allocatedMinutes <= next.weeklyMinutes, true);
});

test("a newly due Review enters the remaining week and records the finite reason", () => {
  const current = weekly(result([item("continue", "2026-08-12", 3)]));
  const review = item("review", "2026-08-15", 0, "review");
  const next = reconcile(current, result([review, item("continue", "2026-08-12", 3)]), "2026-08-11", "evidence_changed");
  assert.equal(next.items.some((entry) => entry.actionType === "review"), true);
  assert.equal(next.rebalanceDiagnostics.reason, "review_became_due");
  assert.equal(next.items.find((entry) => entry.skillPathId === "continue")?.scheduledDate, "2026-08-12");
});

test("capacity reduction keeps completed history, removes optional work and never creates negative capacity", () => {
  const current = updateWeeklyItemState(weekly(result([item("done", "2026-08-10", 1, "continue_stage", 40), item("low", "2026-08-12", 6, "continue_stage", 40)])), "2026-08-10:higher-maths:done:continue_stage:stage", "completed", NOW);
  const preferences = { ...PREFS, weeklyMinutes: 30 };
  const next = reconcileStudyPlanResult({ current, fresh: { ...result([item("low", "2026-08-12", 6, "continue_stage", 40)]), weeklyMinutes: 30, allocatedMinutes: 0, unusedMinutes: 30 }, preferences, preservation: current.preservation, today: "2026-08-10", reason: "preferences_changed", now: NOW });
  assert.equal(next.unusedMinutes, 0);
  assert.equal(next.allocatedMinutes, 30);
  assert.equal(next.items.some((entry) => entry.skillPathId === "low"), false);
  assert.equal(next.items.some((entry) => entry.skillPathId === "done" && entry.state === "completed"), true);
});

test("hard capacity reduction preserves a sticky placement only when it still fits", () => {
  let current = weekly(result([
    item("keep", "2026-08-10", 1, "continue_stage", 20),
    item("optional", "2026-08-12", 6, "continue_stage", 20),
    item("manual", "2026-08-12", 5, "continue_stage", 20),
  ]));
  const manualKey = current.items.find((entry) => entry.skillPathId === "manual")!.itemKey;
  current = moveWeeklyItem(current, manualKey, "2026-08-15", "2026-08-10", NOW);
  const preferences = { ...PREFS, weeklyMinutes: 20 };
  const fresh = { ...result([
    item("keep", "2026-08-10", 1, "continue_stage", 20),
    item("optional", "2026-08-12", 6, "continue_stage", 20),
    item("manual", "2026-08-12", 5, "continue_stage", 20),
  ]), weeklyMinutes: 20, allocatedMinutes: 20, unusedMinutes: 0 };
  const next = reconcileStudyPlanResult({ current, fresh, preferences, preservation: current.preservation, today: "2026-08-10", reason: "preferences_changed", now: NOW });
  assert.deepEqual(next.items.map((entry) => entry.skillPathId), ["manual"]);
  assert.equal(next.items.filter((entry) => entry.state === "planned").reduce((sum, entry) => sum + entry.suggestedMinutes, 0), 20);
});

test("removing an available day moves a non-manual item onto a valid fresh date", () => {
  const current = weekly(result([item("a", "2026-08-12", 2)]));
  const preferences = { ...PREFS, availableDays: ["mon", "sat"] as StudyPlanPreferences["availableDays"] };
  const next = reconcileStudyPlanResult({ current, fresh: result([item("a", "2026-08-15", 2)]), preferences, preservation: current.preservation, today: "2026-08-10", reason: "preferences_changed", now: NOW });
  assert.equal(next.items[0].scheduledDate, "2026-08-15");
});

test("finishing Today offers and performs one opt-in pull-forward without duplication", () => {
  let plan = weekly(result([item("today", "2026-08-10", 2), item("later", "2026-08-12", 3)]));
  plan = updateWeeklyItemState(plan, plan.items[0].itemKey, "completed", NOW);
  assert.equal(canPullForward(plan, "2026-08-10"), true);
  const next = pullForwardWeeklyItem(plan, "2026-08-10", NOW);
  assert.equal(todayPlanItems(next, "2026-08-10").length, 2);
  assert.equal(new Set(next.items.map((entry) => entry.itemKey)).size, next.items.length);
  assert.equal(next.items.find((entry) => entry.skillPathId === "later")?.manualOverride, "pulled_forward");
});

test("week rollover creates a fresh valid plan without carrying unfinished debt", () => {
  const current = weekly(result([item("old", "2026-08-15", 3)]));
  const next = rebalanceStudyPlan({
    currentPlan: current,
    evidence: getEmptyProgressEvidence(),
    preferences: PREFS,
    now: new Date("2026-08-17T09:00:00.000Z"),
    calendarDate: new Date("2026-08-17T00:00:00.000Z"),
    reason: "evidence_changed",
  });
  assert.equal(next.weekStart, "2026-08-17");
  assert.equal(next.items.some((entry) => entry.skillPathId === "old"), false);
  assert.equal(next.rebalanceDiagnostics.reason, "weekly_rollover");
  assert.equal(next.items.every((entry) => entry.scheduledDate === null || entry.scheduledDate >= "2026-08-17"), true);
});

test("caught-up weekly result remains honestly empty without filler", () => {
  const empty = result([]);
  const plan = weekly({ ...empty, caughtUp: true });
  assert.deepEqual(plan.items, []);
  assert.equal(plan.unusedMinutes, plan.weeklyMinutes);
});

test("P2 simulation is deterministic and keeps every hard invariant at zero", () => {
  const first = runP2Simulation({ seed: 24680, runs: 1_000 });
  const second = runP2Simulation({ seed: 24680, runs: 1_000 });
  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.families, second.families);
  assert.deepEqual(first.violations, {});
  assert.equal(Object.values(first.families).every((count) => count > 0), true);
});

function reconcile(current: StudyPlanWeeklyPlan, fresh: StudyPlanResult, today: string, reason: Parameters<typeof reconcileStudyPlanResult>[0]["reason"]) {
  return reconcileStudyPlanResult({ current, fresh, preferences: PREFS, preservation: current.preservation, today, reason, now: NOW });
}

function weekly(fresh: StudyPlanResult) {
  return reconcileStudyPlanResult({ current: null, fresh, preferences: PREFS, preservation: { itemStates: {}, movedDates: {}, excludedItemKeys: [], unscheduledItemKeys: [] }, today: "2026-08-10", reason: "initial_generation", now: NOW });
}

function result(items: ReturnType<typeof item>[]): StudyPlanResult {
  const allocatedMinutes = items.reduce((sum, entry) => sum + entry.suggestedMinutes, 0);
  return { status: "ok", errorCode: null, weekStart: "2026-08-10", generatedAt: NOW.toISOString(), generationVersion: 1, courseSlug: "higher-maths", weeklyMinutes: 90, allocatedMinutes, unusedMinutes: 90 - allocatedMinutes, examPhase: "no_date", caughtUp: items.length === 0, items, diagnostics: [] };
}

function item(skill: string, date: string, tier: StudyPlanWeeklyItem["tier"], actionType: StudyPlanWeeklyItem["actionType"] = "continue_stage", minutes = 20) {
  const candidate = `${skill}:${actionType}:stage`;
  const itemKey = `2026-08-10:higher-maths:${candidate}`;
  return { id: `study-plan:${itemKey}`, itemKey, date, skillPathId: skill, skillName: skill, actionType, href: actionType === "review" ? `/practice?review=1&path=${skill}` : `/question/${skill}`, reasonCode: actionType === "review" ? "review_due" as const : "continue" as const, tier, stageId: actionType === "review" ? null : "stage", stageName: actionType === "review" ? null : "Applications", examQualifier: null, assessmentQualifier: null, suggestedMinutes: minutes, state: "planned" as const };
}

function weeklyItem(value: ReturnType<typeof item>): StudyPlanWeeklyItem {
  return { ...value, originalSuggestedDate: value.date, scheduledDate: value.date, manualOverride: null };
}

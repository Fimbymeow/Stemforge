import { allocateStudyPlan } from "@/lib/study-plan/allocator";
import { generateSimulationScenario } from "@/lib/study-plan/simulation";
import { canPullForward, moveWeeklyItem, pullForwardWeeklyItem, reconcileStudyPlanResult, updateWeeklyItemState } from "@/lib/study-plan/weekly-plan";
import type { StudyPlanResult, StudyPlanWeekday, StudyPlanWeeklyPlan } from "@/lib/study-plan/types";

const WEEK_START = "2026-08-10";
const NOW = new Date("2026-08-10T09:00:00.000Z");
export const P2_SIMULATION_FAMILIES = ["missed_day", "multiple_missed_days", "review_due", "new_mistake", "minutes_reduced", "day_removed", "pull_forward", "rollover"] as const;

export type P2SimulationReport = {
  seed: number;
  runs: number;
  durationMs: number;
  families: Record<string, number>;
  violations: Record<string, number>;
  violationSamples: string[];
  averagePlanDistance: number;
  maximumPlanDistance: number;
  averageUnusedMinutes: number;
  fingerprint: string;
};

export function runP2Simulation(options: { seed: number; runs: number }): P2SimulationReport {
  const started = performance.now();
  const random = seededRandom(options.seed);
  const families = Object.fromEntries(P2_SIMULATION_FAMILIES.map((family) => [family, 0]));
  const violations: Record<string, number> = {};
  const violationSamples: string[] = [];
  let totalDistance = 0; let maximumDistance = 0; let totalUnused = 0; let hash = 2166136261;
  for (let index = 0; index < options.runs; index += 1) {
    const scenario = generateSimulationScenario(random, index);
    const family = P2_SIMULATION_FAMILIES[index % P2_SIMULATION_FAMILIES.length];
    families[family] += 1;
    const preferences = { courseSlug: "synthetic-course", weeklyMinutes: scenario.weeklyMinutes, availableDays: scenario.availableDays, assessments: [] };
    const initialAllocation = allocateStudyPlan({ candidates: scenario.candidates, weekStart: WEEK_START, courseSlug: "synthetic-course", weeklyMinutes: scenario.weeklyMinutes, availableDays: scenario.availableDays, examPhase: scenario.examPhase, preservation: scenario.preservation });
    let current = reconcileStudyPlanResult({ current: null, fresh: asResult(initialAllocation, WEEK_START, preferences.weeklyMinutes, scenario.examPhase), preferences, preservation: { itemStates: {}, movedDates: {}, excludedItemKeys: [], unscheduledItemKeys: [] }, today: WEEK_START, reason: "initial_generation", now: NOW });
    const manual = current.items.find((item) => item.state === "planned");
    const lastDate = current.items.map((item) => item.scheduledDate).filter((date): date is string => date !== null).sort().at(-1);
    if (manual && lastDate && lastDate !== manual.scheduledDate) current = moveWeeklyItem(current, manual.itemKey, lastDate, WEEK_START, NOW);
    const next = simulateFamily(family, current, scenario);
    for (const violation of policyViolations(next, family)) {
      const key = `${family}:${violation}`;
      violations[key] = (violations[key] ?? 0) + 1;
      if (violationSamples.length < 3) violationSamples.push(`${key} days=${next.preferences.availableDays.join(",")} items=${next.items.filter((item) => item.state === "planned").map((item) => item.scheduledDate).join(",")}`);
    }
    totalDistance += next.rebalanceDiagnostics.planDistance;
    maximumDistance = Math.max(maximumDistance, next.rebalanceDiagnostics.planDistance);
    totalUnused += next.unusedMinutes;
    hash = fingerprintStep(hash, `${index}|${family}|${next.items.map((item) => `${item.itemKey}:${item.scheduledDate}:${item.state}`).join(",")}`);
  }
  return {
    seed: options.seed,
    runs: options.runs,
    durationMs: Math.round((performance.now() - started) * 10) / 10,
    families,
    violations,
    violationSamples,
    averagePlanDistance: average(totalDistance, options.runs),
    maximumPlanDistance: maximumDistance,
    averageUnusedMinutes: average(totalUnused, options.runs),
    fingerprint: (hash >>> 0).toString(16).padStart(8, "0"),
  };
}

export function formatP2SimulationReport(report: P2SimulationReport) {
  return [
    "Orthic Study Plan P2 rebalance simulation",
    `seed=${report.seed} runs=${report.runs} durationMs=${report.durationMs} fingerprint=${report.fingerprint}`,
    `averagePlanDistance=${report.averagePlanDistance} maximumPlanDistance=${report.maximumPlanDistance} averageUnusedMinutes=${report.averageUnusedMinutes}`,
    `families ${JSON.stringify(report.families)}`,
    `violations ${JSON.stringify(report.violations)}`,
    ...(report.violationSamples.length ? [`violationSamples ${JSON.stringify(report.violationSamples)}`] : []),
  ].join("\n");
}

function simulateFamily(family: typeof P2_SIMULATION_FAMILIES[number], current: StudyPlanWeeklyPlan, scenario: ReturnType<typeof generateSimulationScenario>) {
  let weekStart = WEEK_START;
  let today = WEEK_START;
  let weeklyMinutes = scenario.weeklyMinutes;
  let availableDays = scenario.availableDays;
  let candidates = scenario.candidates;
  let reason: Parameters<typeof reconcileStudyPlanResult>[0]["reason"] = "evidence_changed";
  if (family === "missed_day") { today = "2026-08-11"; reason = "day_missed"; }
  if (family === "multiple_missed_days") { today = "2026-08-14"; reason = "day_missed"; }
  if (family === "review_due" && candidates[0]) {
    candidates = [{ ...candidates[0], candidateKey: `${candidates[0].skillPathId}:review:p2`, actionType: "review", reasonCode: "review_due", tier: 1, href: `/practice?review=1&path=${candidates[0].skillPathId}`, stageId: null, stageName: null, suggestedMinutes: 20 }, ...candidates];
  }
  if (family === "new_mistake" && candidates[0]) candidates = candidates.map((item, index) => index === 0 ? { ...item, reasonCode: "continue_with_mistake", tier: 2 } : item);
  if (family === "minutes_reduced") { weeklyMinutes = Math.max(30, Math.floor(scenario.weeklyMinutes / 2)); reason = "preferences_changed"; }
  if (family === "day_removed" && availableDays.length > 1) { availableDays = availableDays.slice(1); reason = "preferences_changed"; }
  if (family === "pull_forward") {
    const todayItem = current.items.find((item) => item.scheduledDate === WEEK_START && item.state === "planned");
    const completed = todayItem ? updateWeeklyItemState(current, todayItem.itemKey, "completed", NOW) : current;
    return canPullForward(completed, WEEK_START) ? pullForwardWeeklyItem(completed, WEEK_START, NOW) : completed;
  }
  if (family === "rollover") { weekStart = "2026-08-17"; today = weekStart; reason = "weekly_rollover"; }
  const preferences = { courseSlug: "synthetic-course", weeklyMinutes, availableDays, assessments: [] };
  const preservation = family === "rollover" ? undefined : {
    ...current.preservation,
    movedDates: Object.fromEntries(Object.entries(current.preservation.movedDates)
      .filter(([, date]) => date >= today && availableDays.includes(weekdayFor(date)))),
  };
  const allocation = allocateStudyPlan({ candidates, weekStart, courseSlug: "synthetic-course", weeklyMinutes, availableDays, examPhase: scenario.examPhase, notBeforeDate: today, preservation });
  return reconcileStudyPlanResult({ current: family === "rollover" ? null : current, fresh: asResult(allocation, weekStart, weeklyMinutes, scenario.examPhase), preferences, preservation: family === "rollover" ? { itemStates: {}, movedDates: {}, excludedItemKeys: [], unscheduledItemKeys: [] } : preservation!, today, reason, now: new Date(`${today}T09:00:00.000Z`) });
}

function policyViolations(plan: StudyPlanWeeklyPlan, family: typeof P2_SIMULATION_FAMILIES[number]) {
  const violations: string[] = [];
  const active = plan.items.filter((item) => item.state === "planned");
  if (plan.allocatedMinutes > plan.weeklyMinutes || plan.unusedMinutes < 0) violations.push("capacity");
  if (active.some((item) => item.scheduledDate !== null && item.scheduledDate < (family === "rollover" ? "2026-08-17" : family === "multiple_missed_days" ? "2026-08-14" : family === "missed_day" ? "2026-08-11" : WEEK_START))) violations.push("past_day");
  if (active.some((item) => item.scheduledDate !== null && !plan.preferences.availableDays.includes(weekdayFor(item.scheduledDate)))) violations.push("unavailable_day");
  if (new Set(active.map((item) => item.itemKey)).size !== active.length) violations.push("duplicate");
  if (family === "rollover" && plan.items.some((item) => item.itemKey.startsWith(WEEK_START))) violations.push("rollover_debt");
  return violations;
}

function asResult(allocation: ReturnType<typeof allocateStudyPlan>, weekStart: string, weeklyMinutes: number, examPhase: StudyPlanResult["examPhase"]): StudyPlanResult {
  return { status: "ok", errorCode: null, weekStart, generatedAt: `${weekStart}T09:00:00.000Z`, generationVersion: 1, courseSlug: "synthetic-course", weeklyMinutes, allocatedMinutes: allocation.allocatedMinutes, unusedMinutes: weeklyMinutes - allocation.allocatedMinutes, examPhase, caughtUp: allocation.items.length === 0, items: allocation.items, diagnostics: allocation.diagnostics };
}

function weekdayFor(date: string): StudyPlanWeekday { return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[new Date(`${date}T00:00:00.000Z`).getUTCDay()]; }
function seededRandom(seed: number) { let state = seed >>> 0; return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; }; }
function average(value: number, denominator: number) { return denominator ? Math.round((value / denominator) * 10) / 10 : 0; }
function fingerprintStep(hash: number, value: string) { let next = hash; for (let index = 0; index < value.length; index += 1) { next ^= value.charCodeAt(index); next = Math.imul(next, 16777619); } return next; }

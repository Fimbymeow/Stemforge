import assert from "node:assert/strict";
import test from "node:test";
import type { LearnerNextAction } from "../lib/learning/next-action";
import { resolveDashboardContinueMode, type StudyPlanDashboardState } from "../lib/study-plan/dashboard-dedup";
import { evaluateSimulationPolicies, generateSimulationScenario, planDistance, simulateStudyPlans, type SimulationScenario } from "../lib/study-plan/simulation";
import type { StudyPlanItem } from "../lib/study-plan/types";

test("fixed seed and run count reproduce the same scenarios, aggregates and anomalies", () => {
  const first = simulateStudyPlans({ seed: 12345, runs: 500 });
  const second = simulateStudyPlans({ seed: 12345, runs: 500 });
  assert.equal(first.runs, 500);
  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual({ ...first, durationMs: 0 }, { ...second, durationMs: 0 });
});

test("large synthetic population spans all required breadth, budget, phase and named-family dimensions", () => {
  const report = simulateStudyPlans({ seed: 24680, runs: 2_000 });
  assert.deepEqual(Object.keys(report.breadthBreakdown).sort((a, b) => Number(a) - Number(b)), ["2", "5", "10", "15", "25", "49"]);
  assert.deepEqual(Object.keys(report.budgetBreakdown).sort((a, b) => Number(a) - Number(b)), ["30", "60", "90", "120", "180", "240", "300", "420", "600"]);
  assert.deepEqual(Object.keys(report.examBreakdown).sort(), ["close", "far", "medium", "no_date"]);
  assert.equal(Object.keys(report.familyBreakdown).length, 13);
  assert.equal(Object.values(report.breadthBreakdown).reduce((sum, row) => sum + row.runs, 0), report.runs);
  assert.equal(report.invalidDestinationRate, 0);
  assert.equal(report.unavailableDestinationRate, 0);
  assert.equal(report.budgetOverflowRate, 0);
  assert.equal(report.disallowedWeekdayRate, 0);
  assert.equal(report.duplicateEquivalentItemRate, 0);
  assert.equal(report.missingReasonRate, 0);
  assert.equal(report.closeExamNewStartRate, 0);
});

test("scenario generator creates unique valid weekdays and respects its declared breadth", () => {
  let value = 0;
  const random = () => ((value += 0.137) % 1);
  for (let index = 0; index < 100; index += 1) {
    const scenario = generateSimulationScenario(random, index);
    assert.equal(scenario.availableSkillIds.length, scenario.contentBreadth);
    assert.equal(new Set(scenario.availableDays).size, scenario.availableDays.length);
    assert.equal(scenario.availableDays.length >= 1 && scenario.availableDays.length <= 7, true);
  }
});

test("coarse policy oracle catches a deliberately broken close-exam plan", () => {
  const scenario: SimulationScenario = {
    id: "broken", family: "exam-close", contentBreadth: 2, weeklyMinutes: 30, availableDays: ["mon"], examDays: 3,
    examPhase: "close", progressProfile: "new", reviewBacklog: 0, mistakeCount: 0,
    availableSkillIds: ["skill-a", "skill-b"], candidates: [],
  };
  const broken = item({ reasonCode: "next_skill", suggestedMinutes: 60, href: "/dead", skillPathId: "missing", date: "2026-08-11" });
  assert.deepEqual(new Set(evaluateSimulationPolicies(scenario, [broken, broken], 120)), new Set([
    "budget_overflow", "invalid_href", "unavailable_skill", "disallowed_weekday", "duplicate_equivalent_item", "close_exam_new_start",
  ]));
});

test("plan distance counts additions, removals and material item changes without statistics machinery", () => {
  const base = item();
  assert.equal(planDistance([base], [base]), 0);
  assert.equal(planDistance([base], [{ ...base, date: "2026-08-12" }]), 1);
  assert.equal(planDistance([base], []), 1);
});

test("Dashboard mode preserves full default, suppresses equivalent Today work and compacts a distinct action", () => {
  const recommendation = action();
  const setup: StudyPlanDashboardState = { status: "setup", caughtUp: false, todayItems: [], planItems: [] };
  const duplicateItem = item({ href: recommendation.href!, skillPathId: recommendation.pathId! });
  const distinctItem = item({ href: "/question/other", skillPathId: "other" });
  const duplicate: StudyPlanDashboardState = { status: "configured", caughtUp: false, todayItems: [duplicateItem], planItems: [duplicateItem] };
  const distinct: StudyPlanDashboardState = { status: "configured", caughtUp: false, todayItems: [distinctItem], planItems: [distinctItem] };
  const duplicateLater: StudyPlanDashboardState = { status: "configured", caughtUp: false, todayItems: [], planItems: [duplicateItem] };
  assert.equal(resolveDashboardContinueMode({ studyPlanEnabled: false, plan: duplicate, recommendation }), "full");
  assert.equal(resolveDashboardContinueMode({ studyPlanEnabled: true, plan: setup, recommendation }), "full");
  assert.equal(resolveDashboardContinueMode({ studyPlanEnabled: true, plan: duplicate, recommendation }), "hidden");
  assert.equal(resolveDashboardContinueMode({ studyPlanEnabled: true, plan: duplicateLater, recommendation }), "hidden");
  assert.equal(resolveDashboardContinueMode({ studyPlanEnabled: true, plan: distinct, recommendation }), "compact");
  assert.equal(resolveDashboardContinueMode({ studyPlanEnabled: true, plan: { ...distinct, caughtUp: true }, recommendation }), "hidden");
});

function item(overrides: Partial<StudyPlanItem> = {}): StudyPlanItem {
  return { id: "item", itemKey: "item", date: "2026-08-10", skillPathId: "skill-a", skillName: "Skill A", actionType: "continue_stage", href: "/question/a", reasonCode: "continue", tier: 3, stageId: "foundations", stageName: "Foundations", examQualifier: "far", assessmentQualifier: null, suggestedMinutes: 20, state: "planned", ...overrides };
}
function action(overrides: Partial<LearnerNextAction> = {}): LearnerNextAction {
  return { kind: "continue_question", intent: "continuing", href: "/question/a", label: "Continue", title: "Continue Skill A", reason: "Continue.", subjectId: "higher-maths", courseId: "calculus", pathId: "skill-a", stageId: "foundations", questionId: "a", questionVersion: 1, practiceSessionId: null, ...overrides };
}

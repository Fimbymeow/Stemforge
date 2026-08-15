/** Internal development harness. This module is not imported by learner-facing code. */
import { allocateStudyPlan } from "@/lib/study-plan/allocator";
import { isValidStudyPlanHref } from "@/lib/study-plan/candidate-builder";
import { STUDY_PLAN_GENERATION_VERSION } from "@/lib/study-plan/constants";
import { presentStudyPlanReason } from "@/lib/study-plan/presenter";
import type { StudyPlanCandidate, StudyPlanExamPhase, StudyPlanItem, StudyPlanPreservationInput, StudyPlanWeekday } from "@/lib/study-plan/types";

export const SIMULATION_FAMILIES = [
  "new-learner", "continuation-heavy", "review-heavy", "mistake-heavy", "exam-close", "exam-medium",
  "far-from-exam", "almost-complete", "fully-caught-up", "sparse-content", "rich-content", "low-time", "high-time",
] as const;
export type SimulationFamily = typeof SIMULATION_FAMILIES[number];
export type ProgressProfile = "new" | "in-progress" | "mostly-complete" | "complete" | "exam-practice" | "review-heavy";

export type SimulationScenario = {
  id: string;
  family: SimulationFamily;
  contentBreadth: number;
  weeklyMinutes: number;
  availableDays: StudyPlanWeekday[];
  examDays: number | null;
  examPhase: StudyPlanExamPhase;
  progressProfile: ProgressProfile;
  reviewBacklog: number;
  mistakeCount: number;
  availableSkillIds: string[];
  candidates: StudyPlanCandidate[];
  preservation?: StudyPlanPreservationInput;
};

export type SimulationAnomaly = { kind: string; scenarioId: string; summary: string; items: string[] };
type Breakdown = { runs: number; allocatedMinutes: number; unusedMinutes: number; reviewMinutes: number; newStartItems: number; items: number };
export type SimulationReport = {
  seed: number;
  runs: number;
  generationVersion: number;
  durationMs: number;
  nonEmptyPercent: number;
  caughtUpPercent: number;
  averageAllocatedMinutes: number;
  averageUnusedMinutes: number;
  medianUnusedPercent: number;
  averageItems: number;
  averageSkillsRepresented: number;
  averageLargestSkillShare: number;
  reviewShare: number;
  continuationShare: number;
  targetedPracticeShare: number;
  newSkillShare: number;
  duplicateEquivalentItemRate: number;
  invalidDestinationRate: number;
  unavailableDestinationRate: number;
  budgetOverflowRate: number;
  disallowedWeekdayRate: number;
  missingReasonRate: number;
  closeExamNewStartRate: number;
  unusedBuckets: Record<string, number>;
  reviewShareBuckets: Record<string, number>;
  breadthBreakdown: Record<string, Breakdown>;
  examBreakdown: Record<string, Breakdown>;
  progressBreakdown: Record<string, Breakdown>;
  budgetBreakdown: Record<string, Breakdown>;
  familyBreakdown: Record<string, Breakdown>;
  policyViolations: Record<string, number>;
  stability: { pairs: number; averageDistance: number; maximumDistance: number };
  anomalies: SimulationAnomaly[];
  fingerprint: string;
};

const BREADTHS = [2, 5, 10, 15, 25, 49] as const;
const BUDGETS = [30, 60, 90, 120, 180, 240, 300, 420, 600] as const;
const EXAM_DAYS = [null, 1, 3, 7, 14, 28, 60, 120] as const;
const WEEKDAYS: StudyPlanWeekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const PROFILES: ProgressProfile[] = ["new", "in-progress", "mostly-complete", "complete", "exam-practice", "review-heavy"];
const WEEK_START = "2026-08-10";

export function simulateStudyPlans(options: { seed: number; runs: number }): SimulationReport {
  if (!Number.isInteger(options.runs) || options.runs <= 0) throw new Error("Simulation run count must be a positive integer.");
  const started = performance.now();
  const random = seededRandom(options.seed);
  const totals = emptyTotals();
  const unusedRatios: number[] = [];
  const anomalies: SimulationAnomaly[] = [];
  const policyViolations: Record<string, number> = {};
  const breadthBreakdown: Record<string, Breakdown> = {};
  const examBreakdown: Record<string, Breakdown> = {};
  const progressBreakdown: Record<string, Breakdown> = {};
  const budgetBreakdown: Record<string, Breakdown> = {};
  const familyBreakdown: Record<string, Breakdown> = {};
  const unusedBuckets = bucketMap(["0–10%", "10–25%", "25–50%", "50–75%", ">75%"]);
  const reviewShareBuckets = bucketMap(["0–40%", "40–60%", "60–80%", ">80%"]);
  let stabilityPairs = 0;
  let stabilityDistance = 0;
  let maximumDistance = 0;
  let hash = 2166136261;

  for (let index = 0; index < options.runs; index += 1) {
    const scenario = generateSimulationScenario(random, index);
    const result = allocateScenario(scenario);
    const activeItems = result.items.filter((item) => item.state !== "skipped");
    const reviewMinutes = minutesFor(activeItems, (item) => item.actionType === "review");
    const continuationMinutes = minutesFor(activeItems, (item) => item.reasonCode === "continue" || item.reasonCode === "continue_with_mistake");
    const targetedMinutes = minutesFor(activeItems, (item) => item.actionType === "targeted_practice");
    const newMinutes = minutesFor(activeItems, (item) => item.reasonCode === "next_skill");
    const unused = scenario.weeklyMinutes - result.allocatedMinutes;
    const unusedRatio = unused / scenario.weeklyMinutes;
    const reviewRatio = result.allocatedMinutes ? reviewMinutes / result.allocatedMinutes : 0;
    const skills = new Set(activeItems.map((item) => item.skillPathId));
    const largestSkillShare = largestShare(activeItems, result.allocatedMinutes);
    const violations = evaluateSimulationPolicies(scenario, result.items, result.allocatedMinutes);
    for (const violation of violations) policyViolations[violation] = (policyViolations[violation] ?? 0) + 1;

    totals.nonEmpty += Number(activeItems.length > 0);
    totals.caughtUp += Number(scenario.progressProfile === "complete");
    totals.allocated += result.allocatedMinutes;
    totals.unused += unused;
    totals.items += activeItems.length;
    totals.skills += skills.size;
    totals.largestSkillShare += largestSkillShare;
    totals.reviewMinutes += reviewMinutes;
    totals.continuationMinutes += continuationMinutes;
    totals.targetedMinutes += targetedMinutes;
    totals.newMinutes += newMinutes;
    totals.duplicate += violations.includes("duplicate_equivalent_item") ? 1 : 0;
    totals.invalid += violations.includes("invalid_href") ? 1 : 0;
    totals.unavailable += violations.includes("unavailable_skill") ? 1 : 0;
    totals.overflow += violations.includes("budget_overflow") ? 1 : 0;
    totals.disallowedDay += violations.includes("disallowed_weekday") ? 1 : 0;
    totals.missingReason += violations.includes("missing_reason") ? 1 : 0;
    totals.closeNew += activeItems.filter((item) => scenario.examPhase === "close" && item.reasonCode === "next_skill").length;
    totals.closeItems += scenario.examPhase === "close" ? activeItems.length : 0;
    unusedRatios.push(unusedRatio);
    unusedBuckets[unusedBucket(unusedRatio)] += 1;
    reviewShareBuckets[reviewBucket(reviewRatio)] += 1;
    addBreakdown(breadthBreakdown, String(scenario.contentBreadth), result, scenario.weeklyMinutes, reviewMinutes, newMinutes);
    addBreakdown(examBreakdown, scenario.examPhase, result, scenario.weeklyMinutes, reviewMinutes, newMinutes);
    addBreakdown(progressBreakdown, scenario.progressProfile, result, scenario.weeklyMinutes, reviewMinutes, newMinutes);
    addBreakdown(budgetBreakdown, String(scenario.weeklyMinutes), result, scenario.weeklyMinutes, reviewMinutes, newMinutes);
    addBreakdown(familyBreakdown, scenario.family, result, scenario.weeklyMinutes, reviewMinutes, newMinutes);

    if (unusedRatio > 0.5 && scenario.contentBreadth >= 15 && scenario.progressProfile !== "complete" && scenario.candidates.length > 0) {
      sampleAnomaly(anomalies, "rich_under_allocation", scenario, activeItems, `${Math.round(unusedRatio * 100)}% unused with ${scenario.contentBreadth} live skills`);
    }
    if (reviewRatio > 0.8) sampleAnomaly(anomalies, "review_over_80_percent", scenario, activeItems, `${Math.round(reviewRatio * 100)}% Review allocation`);
    if (largestSkillShare > 0.8 && scenario.contentBreadth >= 15 && skills.size > 0) {
      sampleAnomaly(anomalies, "single_skill_dominance", scenario, activeItems, `${Math.round(largestSkillShare * 100)}% allocated to one skill`);
    }
    if (!activeItems.length && scenario.candidates.length > 0) sampleAnomaly(anomalies, "empty_with_candidates", scenario, activeItems, "Candidates existed but no active item was allocated");
    if (!activeItems.length && scenario.candidates.length === 0 && scenario.progressProfile !== "complete") sampleAnomaly(anomalies, "unfinished_without_plan", scenario, activeItems, "Unfinished learner has no schedulable action under current policy");

    if (index % 20 === 0) {
      const changed = { ...scenario, weeklyMinutes: Math.min(600, scenario.weeklyMinutes + 30) };
      const changedResult = allocateScenario(changed);
      const distance = planDistance(result.items, changedResult.items);
      stabilityPairs += 1;
      stabilityDistance += distance;
      maximumDistance = Math.max(maximumDistance, distance);
      if (distance > 4) sampleAnomaly(anomalies, "large_small_change_delta", scenario, result.items, `Plan distance ${distance} after +30 minutes`);
    }
    hash = fingerprintStep(hash, `${scenario.id}|${result.items.map((item) => `${item.itemKey}:${item.date}:${item.state}`).join(",")}|${unused}`);
  }

  unusedRatios.sort((a, b) => a - b);
  const allocated = totals.allocated || 1;
  return {
    seed: options.seed, runs: options.runs, generationVersion: STUDY_PLAN_GENERATION_VERSION,
    durationMs: Math.round((performance.now() - started) * 10) / 10,
    nonEmptyPercent: percent(totals.nonEmpty, options.runs), caughtUpPercent: percent(totals.caughtUp, options.runs),
    averageAllocatedMinutes: average(totals.allocated, options.runs), averageUnusedMinutes: average(totals.unused, options.runs),
    medianUnusedPercent: Math.round((unusedRatios[Math.floor(unusedRatios.length / 2)] ?? 0) * 1000) / 10,
    averageItems: average(totals.items, options.runs), averageSkillsRepresented: average(totals.skills, options.runs),
    averageLargestSkillShare: percent(totals.largestSkillShare, options.runs), reviewShare: percent(totals.reviewMinutes, allocated),
    continuationShare: percent(totals.continuationMinutes, allocated), targetedPracticeShare: percent(totals.targetedMinutes, allocated),
    newSkillShare: percent(totals.newMinutes, allocated), duplicateEquivalentItemRate: percent(totals.duplicate, options.runs),
    invalidDestinationRate: percent(totals.invalid, options.runs), unavailableDestinationRate: percent(totals.unavailable, options.runs),
    budgetOverflowRate: percent(totals.overflow, options.runs), disallowedWeekdayRate: percent(totals.disallowedDay, options.runs),
    missingReasonRate: percent(totals.missingReason, options.runs), closeExamNewStartRate: percent(totals.closeNew, totals.closeItems || 1),
    unusedBuckets, reviewShareBuckets, breadthBreakdown, examBreakdown, progressBreakdown, budgetBreakdown, familyBreakdown,
    policyViolations, stability: { pairs: stabilityPairs, averageDistance: average(stabilityDistance, stabilityPairs), maximumDistance },
    anomalies, fingerprint: (hash >>> 0).toString(16).padStart(8, "0"),
  };
}

export function generateSimulationScenario(random: () => number, index: number): SimulationScenario {
  const family = SIMULATION_FAMILIES[index % SIMULATION_FAMILIES.length];
  let contentBreadth = pick(random, BREADTHS);
  let weeklyMinutes = pick(random, BUDGETS);
  let examDays = pick(random, EXAM_DAYS);
  let progressProfile = pick(random, PROFILES);
  if (family === "new-learner") progressProfile = "new";
  if (family === "continuation-heavy") progressProfile = "in-progress";
  if (family === "review-heavy") progressProfile = "review-heavy";
  if (family === "exam-close") examDays = pick(random, [1, 3, 7] as const);
  if (family === "exam-medium") examDays = pick(random, [14, 28] as const);
  if (family === "far-from-exam") examDays = pick(random, [60, 120] as const);
  if (family === "almost-complete") progressProfile = "mostly-complete";
  if (family === "fully-caught-up") progressProfile = "complete";
  if (family === "sparse-content") contentBreadth = 2;
  if (family === "rich-content") contentBreadth = pick(random, [25, 49] as const);
  if (family === "low-time") weeklyMinutes = pick(random, [30, 60] as const);
  if (family === "high-time") weeklyMinutes = pick(random, [300, 420, 600] as const);
  const availableDays = shuffledDays(random, 1 + Math.floor(random() * 7));
  const examPhase = phaseFor(examDays);
  const availableSkillIds = Array.from({ length: contentBreadth }, (_, skill) => `synthetic-skill-${skill + 1}`);
  const reviewBacklog = progressProfile === "complete" || progressProfile === "new" ? 0 : family === "review-heavy" ? Math.max(3, Math.floor(contentBreadth * 0.6)) : Math.floor(random() * Math.min(8, contentBreadth + 1));
  const mistakeCount = progressProfile === "complete" || progressProfile === "new" ? 0 : family === "mistake-heavy" ? Math.max(2, Math.floor(contentBreadth * 0.5)) : Math.floor(random() * Math.min(5, contentBreadth + 1));
  const candidates = syntheticCandidates({ random, availableSkillIds, progressProfile, reviewBacklog, mistakeCount, examPhase });
  const preservation = syntheticPreservation(random, candidates);
  return { id: `scenario-${index + 1}`, family, contentBreadth, weeklyMinutes, availableDays, examDays, examPhase, progressProfile, reviewBacklog, mistakeCount, availableSkillIds, candidates, ...(preservation ? { preservation } : {}) };
}

export function allocateScenario(scenario: SimulationScenario) {
  return allocateStudyPlan({ candidates: scenario.candidates, weekStart: WEEK_START, courseSlug: "synthetic-course", weeklyMinutes: scenario.weeklyMinutes, availableDays: scenario.availableDays, examPhase: scenario.examPhase, preservation: scenario.preservation });
}

export function evaluateSimulationPolicies(scenario: SimulationScenario, items: readonly StudyPlanItem[], allocatedMinutes: number): string[] {
  const active = items.filter((item) => item.state !== "skipped");
  const violations = new Set<string>();
  if (allocatedMinutes > scenario.weeklyMinutes) violations.add("budget_overflow");
  if (active.some((item) => !isValidStudyPlanHref(item.href))) violations.add("invalid_href");
  if (active.some((item) => !scenario.availableSkillIds.includes(item.skillPathId))) violations.add("unavailable_skill");
  if (active.some((item) => !scenario.availableDays.includes(weekdayFor(item.date)))) violations.add("disallowed_weekday");
  if (active.some((item) => !presentStudyPlanReason(item.reasonCode))) violations.add("missing_reason");
  if (new Set(active.map((item) => `${item.skillPathId}:${item.actionType}:${item.date}`)).size !== active.length) violations.add("duplicate_equivalent_item");
  if (scenario.examPhase === "close" && active.some((item) => item.reasonCode === "next_skill")) violations.add("close_exam_new_start");
  return [...violations];
}

export function planDistance(left: readonly StudyPlanItem[], right: readonly StudyPlanItem[]) {
  const leftMap = new Map(left.map((item) => [item.itemKey, item]));
  const rightMap = new Map(right.map((item) => [item.itemKey, item]));
  let distance = 0;
  for (const [key, item] of leftMap) {
    const other = rightMap.get(key);
    if (!other) distance += 1;
    else if (item.date !== other.date || item.reasonCode !== other.reasonCode || item.state !== other.state) distance += 1;
  }
  for (const key of rightMap.keys()) if (!leftMap.has(key)) distance += 1;
  return distance;
}

export function formatSimulationReport(report: SimulationReport) {
  const lines = [
    "Orthic Study Plan simulation", `seed=${report.seed} runs=${report.runs} generation=${report.generationVersion} durationMs=${report.durationMs}`,
    `nonEmpty=${report.nonEmptyPercent}% caughtUp=${report.caughtUpPercent}% avgAllocated=${report.averageAllocatedMinutes} avgUnused=${report.averageUnusedMinutes} medianUnused=${report.medianUnusedPercent}%`,
    `composition review=${report.reviewShare}% continuation=${report.continuationShare}% targetedPractice=${report.targetedPracticeShare}% newSkill=${report.newSkillShare}%`,
    `diversity avgSkills=${report.averageSkillsRepresented} avgLargestSkillShare=${report.averageLargestSkillShare}% avgItems=${report.averageItems}`,
    `invariants duplicate=${report.duplicateEquivalentItemRate}% invalidHref=${report.invalidDestinationRate}% unavailable=${report.unavailableDestinationRate}% budgetOverflow=${report.budgetOverflowRate}% disallowedDay=${report.disallowedWeekdayRate}% missingReason=${report.missingReasonRate}% closeExamNewStart=${report.closeExamNewStartRate}%`,
    `unusedBuckets ${JSON.stringify(report.unusedBuckets)}`, `reviewShareBuckets ${JSON.stringify(report.reviewShareBuckets)}`,
    `breadth ${JSON.stringify(report.breadthBreakdown)}`, `examPhases ${JSON.stringify(report.examBreakdown)}`,
    `progress ${JSON.stringify(report.progressBreakdown)}`, `budgets ${JSON.stringify(report.budgetBreakdown)}`,
    `families ${JSON.stringify(report.familyBreakdown)}`,
    `stability pairs=${report.stability.pairs} averageDistance=${report.stability.averageDistance} maxDistance=${report.stability.maximumDistance}`,
    `policyViolations ${JSON.stringify(report.policyViolations)} fingerprint=${report.fingerprint}`,
    "anomalies",
    ...report.anomalies.map((item) => `- ${item.kind} ${item.scenarioId}: ${item.summary}; ${item.items.join(" | ") || "no items"}`),
  ];
  return lines.join("\n");
}

function syntheticCandidates(input: { random: () => number; availableSkillIds: string[]; progressProfile: ProgressProfile; reviewBacklog: number; mistakeCount: number; examPhase: StudyPlanExamPhase }) {
  if (input.progressProfile === "complete") return [];
  const candidates: StudyPlanCandidate[] = [];
  const startedRatio = input.progressProfile === "new" ? 0 : input.progressProfile === "mostly-complete" ? 0.25 : input.progressProfile === "exam-practice" ? 0.7 : 0.6;
  const startedCount = Math.min(input.availableSkillIds.length, Math.max(0, Math.round(input.availableSkillIds.length * startedRatio)));
  const reviewIds = new Set(input.availableSkillIds.slice(0, Math.min(input.reviewBacklog, startedCount || input.availableSkillIds.length)));
  const mistakePool = [...input.availableSkillIds].sort(() => input.random() - 0.5);
  const mistakeIds = new Set(mistakePool.slice(0, Math.min(input.mistakeCount, input.availableSkillIds.length)));
  input.availableSkillIds.forEach((skillPathId, index) => {
    const skillName = `Synthetic skill ${index + 1}`;
    if (reviewIds.has(skillPathId)) {
      const overdue = index % 3 === 0;
      candidates.push(candidate(skillPathId, skillName, "review", overdue ? "review_overdue" : index % 2 ? "review_due" : "review_due_soon", overdue ? 0 : index % 2 ? 1 : 4, 20, `/practice?review=1&path=${skillPathId}`, null, false, input.examPhase));
    } else if (index < startedCount) {
      const mistake = mistakeIds.has(skillPathId);
      const examPractice = input.progressProfile === "exam-practice" && index % 2 === 0;
      candidates.push(candidate(skillPathId, skillName, "continue_stage", mistake ? "continue_with_mistake" : "continue", mistake ? 2 : 3, examPractice ? 25 : 20, `/question/synthetic-${index + 1}`, examPractice ? "exam-practice" : "applications", examPractice, input.examPhase));
    } else if (mistakeIds.has(skillPathId)) {
      candidates.push(candidate(skillPathId, skillName, "targeted_practice", "recent_mistakes", 5, 20, `/practice?path=${skillPathId}`, null, false, input.examPhase));
    }
  });
  if (input.examPhase !== "close" && input.progressProfile !== "mostly-complete") {
    const next = input.availableSkillIds[startedCount];
    if (next) candidates.push(candidate(next, `Synthetic skill ${startedCount + 1}`, "continue_stage", "next_skill", 6, 15, `/question/synthetic-new-${startedCount + 1}`, "foundations", false, input.examPhase));
  }
  return candidates;
}

function candidate(skillPathId: string, skillName: string, actionType: StudyPlanCandidate["actionType"], reasonCode: StudyPlanCandidate["reasonCode"], tier: StudyPlanCandidate["tier"], minutes: number, href: string, stageId: string | null, examPractice: boolean, examPhase: StudyPlanExamPhase): StudyPlanCandidate {
  return { candidateKey: `${skillPathId}:${actionType}:${stageId ?? "all"}`, skillPathId, skillName, actionType, href, reasonCode, tier, stageId, stageName: stageId ? stageId === "exam-practice" ? "Past Paper-style Questions" : stageId === "foundations" ? "Foundations" : "Applications" : null, suggestedMinutes: minutes, dueAt: actionType === "review" ? "2026-08-09T09:00:00.000Z" : null, latestActivityAt: actionType === "continue_stage" ? "2026-08-09T08:00:00.000Z" : null, latestMistakeAt: reasonCode === "continue_with_mistake" || reasonCode === "recent_mistakes" ? "2026-08-09T10:00:00.000Z" : null, examPractice, examQualifier: examPhase === "no_date" ? null : examPhase };
}

function syntheticPreservation(random: () => number, candidates: StudyPlanCandidate[]): StudyPlanPreservationInput | undefined {
  if (!candidates.length || random() > 0.18) return undefined;
  const selected = candidates[Math.floor(random() * candidates.length)];
  const itemKey = `${WEEK_START}:synthetic-course:${selected.candidateKey}`;
  const mode = Math.floor(random() * 4);
  if (mode === 0) return { itemStates: { [itemKey]: "completed" } };
  if (mode === 1) return { itemStates: { [itemKey]: "skipped" } };
  if (mode === 2) return { movedDates: { [itemKey]: "2026-08-16" } };
  return { excludedItemKeys: [itemKey] };
}

function phaseFor(days: number | null): StudyPlanExamPhase { return days === null ? "no_date" : days <= 7 ? "close" : days <= 28 ? "medium" : "far"; }
function shuffledDays(random: () => number, count: number) { return [...WEEKDAYS].sort(() => random() - 0.5).slice(0, count).sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b)); }
function seededRandom(seed: number) { let state = seed >>> 0; return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; }; }
function pick<T>(random: () => number, values: readonly T[]): T { return values[Math.floor(random() * values.length)]; }
function weekdayFor(date: string): StudyPlanWeekday { return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[new Date(`${date}T00:00:00.000Z`).getUTCDay()]; }
function minutesFor(items: readonly StudyPlanItem[], predicate: (item: StudyPlanItem) => boolean) { return items.filter(predicate).reduce((sum, item) => sum + item.suggestedMinutes, 0); }
function largestShare(items: readonly StudyPlanItem[], total: number) { if (!total) return 0; const bySkill = new Map<string, number>(); for (const item of items) bySkill.set(item.skillPathId, (bySkill.get(item.skillPathId) ?? 0) + item.suggestedMinutes); return Math.max(0, ...bySkill.values()) / total; }
function unusedBucket(value: number) { return value <= 0.1 ? "0–10%" : value <= 0.25 ? "10–25%" : value <= 0.5 ? "25–50%" : value <= 0.75 ? "50–75%" : ">75%"; }
function reviewBucket(value: number) { return value <= 0.4 ? "0–40%" : value <= 0.6 ? "40–60%" : value <= 0.8 ? "60–80%" : ">80%"; }
function bucketMap(keys: string[]) { return Object.fromEntries(keys.map((key) => [key, 0])); }
function emptyBreakdown(): Breakdown { return { runs: 0, allocatedMinutes: 0, unusedMinutes: 0, reviewMinutes: 0, newStartItems: 0, items: 0 }; }
function addBreakdown(target: Record<string, Breakdown>, key: string, result: ReturnType<typeof allocateScenario>, weeklyMinutes: number, reviewMinutes: number, newMinutes: number) { const row = target[key] ??= emptyBreakdown(); row.runs += 1; row.allocatedMinutes += result.allocatedMinutes; row.unusedMinutes += weeklyMinutes - result.allocatedMinutes; row.reviewMinutes += reviewMinutes; row.newStartItems += Number(newMinutes > 0); row.items += result.items.filter((item) => item.state !== "skipped").length; }
function sampleAnomaly(target: SimulationAnomaly[], kind: string, scenario: SimulationScenario, items: readonly StudyPlanItem[], summary: string) { if (target.filter((item) => item.kind === kind).length >= 3) return; target.push({ kind, scenarioId: scenario.id, summary: `${summary}; family=${scenario.family} profile=${scenario.progressProfile} budget=${scenario.weeklyMinutes} days=${scenario.availableDays.join(",")} reviews=${scenario.reviewBacklog} mistakes=${scenario.mistakeCount}`, items: items.filter((item) => item.state !== "skipped").map((item) => `${item.skillName}: ${item.reasonCode}, ${item.suggestedMinutes}m, ${item.date}`) }); }
function percent(value: number, denominator: number) { return Math.round((value / denominator) * 1000) / 10; }
function average(value: number, denominator: number) { return denominator ? Math.round((value / denominator) * 10) / 10 : 0; }
function fingerprintStep(hash: number, value: string) { let next = hash; for (let index = 0; index < value.length; index += 1) { next ^= value.charCodeAt(index); next = Math.imul(next, 16777619); } return next; }
function emptyTotals() { return { nonEmpty: 0, caughtUp: 0, allocated: 0, unused: 0, items: 0, skills: 0, largestSkillShare: 0, reviewMinutes: 0, continuationMinutes: 0, targetedMinutes: 0, newMinutes: 0, duplicate: 0, invalid: 0, unavailable: 0, overflow: 0, disallowedDay: 0, missingReason: 0, closeNew: 0, closeItems: 0 }; }

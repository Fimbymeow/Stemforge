import { studyPlanRequirementScopeOptions, studyPlanScopeOptions } from "@/lib/study-plan/scope-options";
import type { AssessmentScope, StudyPlanAssessmentQualifier, StudyPlanReasonCode, StudyPlanResult } from "@/lib/study-plan/types";

const REASON_LABELS: Record<StudyPlanReasonCode, string> = {
  review_overdue: "Overdue for Review",
  review_due: "Due for Review",
  review_due_soon: "Review coming up",
  continue_with_mistake: "Continue where you left off",
  continue: "Continue where you left off",
  recent_mistakes: "Recent mistakes",
  next_skill: "Next skill in the course",
};

const ASSESSMENT_TYPE_LABELS: Record<StudyPlanAssessmentQualifier["type"], string> = {
  class_test: "test",
  prelim: "prelim",
  final_exam: "final exam",
  other: "assessment",
};

export function presentStudyPlanReason(code: StudyPlanReasonCode): string {
  return REASON_LABELS[code];
}

/**
 * Restrained, secondary text that augments (never replaces) the existing reason label — e.g.
 * "Due for Review · On your test in 3 days", not a standalone "Test approaching". Only medium/close
 * phases are surfaced; a "far"-phase assessment stays silent, matching the same medium/close
 * threshold already used for exam-practice ordering elsewhere in the planner.
 */
export function presentStudyPlanAssessmentQualifier(qualifier: StudyPlanAssessmentQualifier | null): string | null {
  if (!qualifier || qualifier.phase === "far") return null;
  const label = ASSESSMENT_TYPE_LABELS[qualifier.type];
  if (qualifier.daysUntil !== null) {
    if (qualifier.daysUntil <= 0) return `On your ${label} today`;
    if (qualifier.daysUntil === 1) return `On your ${label} tomorrow`;
    return `On your ${label} in ${qualifier.daysUntil} days`;
  }
  return qualifier.phase === "close" ? `On your ${label} this month` : `On your ${label} next month`;
}

/** Short, learner-facing summary of an assessment's scope for a dense list row (e.g. "Differentiation", "3 skills"). */
export function presentAssessmentScopeSummary(scope: AssessmentScope, courseSlug: string): string {
  if (scope.kind === "whole_course") return "Whole course";
  if (scope.kind === "topics") {
    const areas = studyPlanScopeOptions(courseSlug);
    if (scope.topicIds.length === 1) {
      const topic = areas.flatMap((area) => area.topics).find((entry) => entry.topicScopeId === scope.topicIds[0]);
      if (topic) return topic.topicName;
    }
    return `${scope.topicIds.length} area${scope.topicIds.length === 1 ? "" : "s"}`;
  }
  if (scope.kind === "requirements") {
    if (scope.specPointIds.length === 1) {
      const requirement = studyPlanRequirementScopeOptions(courseSlug)
        .flatMap((area) => area.strands).flatMap((strand) => strand.requirements)
        .find((entry) => entry.specPointId === scope.specPointIds[0]);
      if (requirement) return requirement.wording;
    }
    return `${scope.specPointIds.length} requirement${scope.specPointIds.length === 1 ? "" : "s"}`;
  }
  if (scope.skillPathIds.length === 1) {
    const skill = studyPlanScopeOptions(courseSlug).flatMap((area) => area.topics).flatMap((topic) => topic.skills).find((entry) => entry.skillPathId === scope.skillPathIds[0]);
    if (skill) return skill.skillPathName;
  }
  return `${scope.skillPathIds.length} skill${scope.skillPathIds.length === 1 ? "" : "s"}`;
}

export function formatStudyPlanDebug(result: StudyPlanResult): string {
  const lines = [
    `Study Plan v${result.generationVersion} — ${result.courseSlug}`,
    `week=${result.weekStart} phase=${result.examPhase} allocated=${result.allocatedMinutes}/${result.weeklyMinutes} unused=${result.unusedMinutes}`,
  ];
  if (!result.items.length) lines.push(result.caughtUp ? "No useful action is currently due." : `No items (${result.errorCode ?? result.status}).`);
  for (const item of result.items) {
    const assessmentText = presentStudyPlanAssessmentQualifier(item.assessmentQualifier);
    lines.push([
      item.date,
      `Tier ${item.tier}`,
      item.skillName,
      item.actionType,
      assessmentText ? `${presentStudyPlanReason(item.reasonCode)} · ${assessmentText}` : presentStudyPlanReason(item.reasonCode),
      `${item.suggestedMinutes} min`,
      item.state,
      item.href,
    ].join(" | "));
  }
  lines.push("Diagnostics:");
  for (const item of result.diagnostics) {
    lines.push(`- ${item.outcome} | ${item.skillPathId ?? "course"} | ${item.code}${item.detail ? ` | ${item.detail}` : ""}`);
  }
  return lines.join("\n");
}


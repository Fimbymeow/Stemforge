import type { StudyPlanReasonCode, StudyPlanResult } from "@/lib/study-plan/types";

const REASON_LABELS: Record<StudyPlanReasonCode, string> = {
  review_overdue: "Overdue for Review",
  review_due: "Due for Review",
  review_due_soon: "Review coming up",
  continue_with_mistake: "Continue where you left off",
  continue: "Continue where you left off",
  recent_mistakes: "Recent mistakes",
  next_skill: "Next skill in the course",
};

export function presentStudyPlanReason(code: StudyPlanReasonCode): string {
  return REASON_LABELS[code];
}

export function formatStudyPlanDebug(result: StudyPlanResult): string {
  const lines = [
    `Study Plan v${result.generationVersion} — ${result.courseSlug}`,
    `week=${result.weekStart} phase=${result.examPhase} allocated=${result.allocatedMinutes}/${result.weeklyMinutes} unused=${result.unusedMinutes}`,
  ];
  if (!result.items.length) lines.push(result.caughtUp ? "No useful action is currently due." : `No items (${result.errorCode ?? result.status}).`);
  for (const item of result.items) {
    lines.push([
      item.date,
      `Tier ${item.tier}`,
      item.skillName,
      item.actionType,
      presentStudyPlanReason(item.reasonCode),
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


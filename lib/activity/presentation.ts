import type { ActivityHistory, ActivityIntensityLevel } from "@/lib/activity/derivation";

export function activityIntensityClass(level: ActivityIntensityLevel) {
  if (level === 1) return "border-forge/20 bg-forge-soft forced-colors:border-[Highlight]";
  if (level === 2) return "border-forge/30 bg-activity-moderate forced-colors:border-[Highlight]";
  if (level === 3) return "border-forge/40 bg-activity-strong forced-colors:border-[Highlight]";
  if (level === 4) return "border-forge bg-forge forced-colors:border-[Highlight]";
  return "border-line bg-paper forced-colors:border-[CanvasText]";
}

export function activityIntensityName(level: ActivityIntensityLevel) {
  return ["No activity", "Light", "Moderate", "Strong", "Very strong"][level];
}

export function deriveDashboardActivityRecap(history: ActivityHistory) {
  if (!history.hasActivity) return `No activity in the last ${history.totalDayCount} days`;

  const activeDays = `${history.activeDayCount} active day${history.activeDayCount === 1 ? "" : "s"} in the last ${history.totalDayCount} days`;
  const facts: string[] = [];
  if (history.totalDistinctQuestionsWorkedOn > 0) {
    facts.push(`${history.totalDistinctQuestionsWorkedOn} question${history.totalDistinctQuestionsWorkedOn === 1 ? "" : "s"} worked on`);
  }
  if (history.totalIndependentReviewSuccesses > 0) {
    facts.push(history.totalIndependentReviewSuccesses === 1 ? "Review completed" : `${history.totalIndependentReviewSuccesses} Reviews completed`);
  }
  if (history.totalDistinctFlashcardsReviewed > 0) {
    facts.push(`${history.totalDistinctFlashcardsReviewed} flashcard${history.totalDistinctFlashcardsReviewed === 1 ? "" : "s"} reviewed`);
  }
  if (history.totalMilestones > 0) {
    facts.push(history.totalMilestones === 1 ? "Learning milestone recorded" : `${history.totalMilestones} learning milestones recorded`);
  }
  return [activeDays, ...facts.slice(0, 2)].join(" · ");
}

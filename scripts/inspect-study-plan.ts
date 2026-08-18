import { formatStudyPlanDebug, generateStudyPlan, getStudyPlanConfiguration } from "@/lib/study-plan";
import type { ProgressEvidence } from "@/lib/progress/types";

if (!getStudyPlanConfiguration().enabled) {
  console.error("Study Plan inspection is disabled. Set STEMFORGE_STUDY_PLAN_ENABLED=true for this internal command.");
  process.exitCode = 1;
} else {
  const evidence: ProgressEvidence = {
    attempts: [],
    supportEvents: [],
    guidedSelfAssessments: [],
    achievementSnapshots: [],
    reviewEvents: [],
    flashcardReviews: [],
  };
  const result = generateStudyPlan({
    now: new Date(),
    evidence,
    preferences: {
      courseSlug: "higher-maths",
      weeklyMinutes: 180,
      availableDays: ["mon", "wed", "sat"],
      assessments: [],
    },
  });
  console.log(formatStudyPlanDebug(result));
}


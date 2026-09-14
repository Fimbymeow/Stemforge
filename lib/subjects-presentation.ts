import { subjectCatalog } from "@/data/subjects";
import { contentResolver } from "@/lib/content-resolver";
import { deriveCourseDashboardSummary } from "@/lib/dashboard-derivations";
import { getAllSkillPathContexts, getSubjectBySlug } from "@/lib/learning-paths";
import { resolveEffectiveCourses, type LearnerPreferences } from "@/lib/learner-preferences";
import type { ProgressEvidence } from "@/lib/progress/types";
import { deriveSubjectReviewSummary } from "@/lib/review/derivation";

/** Read-only presentation of the existing catalogue, enrolment and evidence derivations. */
export function presentSubjectCourses(preferences: LearnerPreferences, evidence: ProgressEvidence) {
  const enrolled = new Set(resolveEffectiveCourses({ preferences, evidence }).map((course) => course.slug));
  const courses = subjectCatalog.filter((course) => course.available).map((course) => {
    const subject = getSubjectBySlug(course.slug);
    const progress = subject ? deriveCourseDashboardSummary(getAllSkillPathContexts(subject).map((context) => context.skillPath), evidence, contentResolver.getQuestionVersions(), subject) : null;
    return { ...course, selected: preferences.selectedCourseSlugs.includes(course.slug), progress, dueSkillCount: deriveSubjectReviewSummary(course.slug, evidence).dueSkillCount };
  });
  return { yourCourses: courses.filter((course) => enrolled.has(course.slug)), exploreCourses: courses.filter((course) => !enrolled.has(course.slug)) };
}

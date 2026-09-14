import type { LearnerCourse } from "@/lib/learner-preferences";

/** Presentation selection only. Enrolment and attention are supplied by existing derivations. */
export function selectDashboardCourses(courses: readonly LearnerCourse[], focusCourseSlug: string | null, attentionCourseSlugs: readonly string[] = []): LearnerCourse[] {
  const focus = courses.find((course) => course.slug === focusCourseSlug) ?? courses[0];
  if (!focus) return [];
  const remaining = courses.filter((course) => course.slug !== focus.slug);
  const second = remaining.find((course) => attentionCourseSlugs.includes(course.slug)) ?? remaining[0];
  return second ? [focus, second] : [focus];
}

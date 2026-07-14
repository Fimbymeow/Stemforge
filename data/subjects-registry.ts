import type { CourseArea, SpecArea, Subject } from "@/data/types";
import { contentResolver } from "@/lib/content-resolver";
import { getActiveRecords } from "@/lib/content-selectors";

export const subjects: Subject[] = contentResolver.getSubjects();

export function getSubject(subjectSlug: string): Subject | undefined {
  return contentResolver.getSubject(subjectSlug);
}

export function getCourseArea(subjectSlug: string, courseAreaSlug: string): CourseArea | undefined {
  return contentResolver.getCourseArea(subjectSlug, courseAreaSlug);
}

export function getSpecArea(subjectSlug: string, courseAreaSlug: string, specAreaSlug: string): SpecArea | undefined {
  const courseArea = getCourseArea(subjectSlug, courseAreaSlug);
  return contentResolver.getRouteTopics(courseArea).find((specArea) => specArea.slug === specAreaSlug);
}

export function getLearningStages(subjectSlug: string) {
  const subject = getSubject(subjectSlug);
  return subject ? getActiveRecords(subject.learningStages) : [];
}

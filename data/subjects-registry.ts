import { higherMaths } from "@/data/higher-maths";
import { higherPhysics } from "@/data/higher-physics";
import { higherMathsDifferentiationQuestions } from "@/content/questions/higher-maths/differentiation";
import type { CourseArea, SpecArea, Subject } from "@/data/types";
import { createActiveSubjectView, getActiveCourseAreas, getActiveRecords, getActiveSpecAreas, getActiveSubjects } from "@/lib/content-selectors";

export const subjects: Subject[] = getActiveSubjects([higherMaths, higherPhysics])
  .map((subject) => createActiveSubjectView(subject, higherMathsDifferentiationQuestions));

export function getSubject(subjectSlug: string): Subject | undefined {
  return subjects.find((subject) => subject.subjectSlug === subjectSlug && subject.contentStatus === "active");
}

export function getCourseArea(subjectSlug: string, courseAreaSlug: string): CourseArea | undefined {
  const subject = getSubject(subjectSlug);
  return subject ? getActiveCourseAreas(subject).find((area) => area.slug === courseAreaSlug) : undefined;
}

export function getSpecArea(subjectSlug: string, courseAreaSlug: string, specAreaSlug: string): SpecArea | undefined {
  const courseArea = getCourseArea(subjectSlug, courseAreaSlug);
  return courseArea ? getActiveSpecAreas(courseArea).find((specArea) => specArea.slug === specAreaSlug) : undefined;
}

export function getLearningStages(subjectSlug: string) {
  const subject = getSubject(subjectSlug);
  return subject ? getActiveRecords(subject.learningStages) : [];
}

import { higherMaths } from "@/data/higher-maths";
import { higherPhysics } from "@/data/higher-physics";
import type { CourseArea, SpecArea, Subject } from "@/data/types";

export const subjects: Subject[] = [higherMaths, higherPhysics];

export function getSubject(subjectSlug: string): Subject | undefined {
  return subjects.find((subject) => subject.subjectSlug === subjectSlug);
}

export function getCourseArea(subjectSlug: string, courseAreaSlug: string): CourseArea | undefined {
  return getSubject(subjectSlug)?.courseAreas.find((area) => area.slug === courseAreaSlug);
}

export function getSpecArea(subjectSlug: string, courseAreaSlug: string, specAreaSlug: string): SpecArea | undefined {
  return getCourseArea(subjectSlug, courseAreaSlug)?.specAreas.find((specArea) => specArea.slug === specAreaSlug);
}

export function getLearningStages(subjectSlug: string) {
  return getSubject(subjectSlug)?.learningStages ?? [];
}

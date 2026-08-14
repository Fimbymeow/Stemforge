import type { QualificationLevel } from "@/lib/qualification-presentation";

export const QUALIFICATION_ORDER: readonly QualificationLevel[] = ["National 5", "Higher", "Advanced Higher"];

export function groupCoursesByQualification<T extends { level: string }>(courses: readonly T[]) {
  const representedLevels = new Set(courses.map((course) => course.level));
  const orderedLevels = [
    ...QUALIFICATION_ORDER.filter((level) => representedLevels.has(level)),
    ...[...representedLevels].filter((level) => !QUALIFICATION_ORDER.includes(level as QualificationLevel)),
  ];

  return orderedLevels.map((level) => ({
    level,
    courses: courses.filter((course) => course.level === level),
  }));
}

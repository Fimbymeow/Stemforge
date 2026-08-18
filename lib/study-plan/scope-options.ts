import { contentResolver } from "@/lib/content-resolver";

export type StudyPlanScopeSkillOption = { skillPathId: string; skillPathName: string };
export type StudyPlanScopeAreaOption = {
  courseAreaId: string;
  courseAreaName: string;
  skills: StudyPlanScopeSkillOption[];
};

/**
 * Area-first scope options for the Assessment scope selector, sourced from the same canonical
 * curriculum structure (`contentResolver`) the rest of the app uses — never a separate, duplicated
 * taxonomy. Grouped by course area so the UI can stay area-first/expandable instead of a flat
 * checkbox dump of every skill in the course.
 */
export function studyPlanScopeOptions(courseSlug: string): StudyPlanScopeAreaOption[] {
  const contexts = contentResolver.getAllPathContexts()
    .filter((context) => context.subject.subjectSlug === courseSlug && context.skillPath.isAvailable);
  const areas = new Map<string, StudyPlanScopeAreaOption>();
  for (const context of contexts) {
    const areaId = context.courseArea.slug;
    const area = areas.get(areaId) ?? { courseAreaId: areaId, courseAreaName: context.courseArea.name, skills: [] };
    area.skills.push({ skillPathId: context.skillPath.slug, skillPathName: context.skillPath.name });
    areas.set(areaId, area);
  }
  return [...areas.values()];
}

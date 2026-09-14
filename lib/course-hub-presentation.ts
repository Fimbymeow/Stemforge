import type { CourseArea } from "@/data/types";
import { higherMathematicsSpecificationRegister } from "@/data/curriculum/higher-mathematics/specification-register";

export function getStrandSkillPaths(strand: CourseArea) {
  return strand.specAreas.flatMap((area) => area.skillPaths ?? []);
}

export function getActionableStrandSkillPaths(strand: CourseArea) {
  return getStrandSkillPaths(strand).filter((path) => path.isAvailable);
}

/** Present existing ownership, never reinforcement claims, as the row grouping. */
export function getActionableSpecificationGroups(strand: CourseArea) {
  const paths = getActionableStrandSkillPaths(strand);
  const headings = higherMathematicsSpecificationRegister.areas.filter((area) =>
    area.status === "active" && strand.specificationStrands?.some((item) => item.id === area.areaId),
  ).sort((a, b) => a.order - b.order);
  const groups = headings.map((area) => ({
    id: area.areaId,
    title: area.title,
    paths: paths.filter((path) => path.specificationStrandId === area.areaId),
  })).filter((group) => group.paths.length > 0);
  const grouped = new Set(groups.flatMap((group) => group.paths.map((path) => path.slug)));
  const remaining = paths.filter((path) => !grouped.has(path.slug));
  // Preserve access if a future available skill has no registered ownership heading.
  if (remaining.length) groups.push({ id: `${strand.slug}-ungrouped`, title: "Other skills", paths: remaining });
  return groups;
}

import type { CourseArea } from "@/data/types";

export function getStrandSkillPaths(strand: CourseArea) {
  return strand.specAreas.flatMap((area) => area.skillPaths ?? []);
}

export function getActionableStrandSkillPaths(strand: CourseArea) {
  return getStrandSkillPaths(strand).filter((path) => path.isAvailable);
}

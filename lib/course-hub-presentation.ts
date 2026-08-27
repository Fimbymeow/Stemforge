import type { CourseArea, SkillPath } from "@/data/types";

export const ROADMAP_UNAVAILABLE_PREVIEW_COUNT = 3;

export function getStrandSkillPaths(strand: CourseArea) {
  return strand.specAreas.flatMap((area) => area.skillPaths ?? []);
}

export function deriveStrandAvailability(strand: CourseArea) {
  const skillPaths = getStrandSkillPaths(strand);
  const availableSkillCount = skillPaths.filter((path) => path.isAvailable).length;
  return {
    totalSkillCount: skillPaths.length,
    availableSkillCount,
    unavailableSkillCount: skillPaths.length - availableSkillCount,
    label: availableSkillCount > 0
      ? `${availableSkillCount} available`
      : "Coming soon",
  };
}

export function deriveRoadmapPreview(
  skillPaths: SkillPath[],
  unavailablePreviewCount = ROADMAP_UNAVAILABLE_PREVIEW_COUNT,
) {
  let unavailableShown = 0;
  const preview: SkillPath[] = [];
  const remainingUnavailable: SkillPath[] = [];

  for (const path of skillPaths) {
    if (path.isAvailable || unavailableShown < unavailablePreviewCount) {
      preview.push(path);
      if (!path.isAvailable) unavailableShown += 1;
    } else {
      remainingUnavailable.push(path);
    }
  }

  return { preview, remainingUnavailable };
}

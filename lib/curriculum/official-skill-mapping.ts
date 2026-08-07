import type { ResolvedSkillPath } from "@/lib/content-resolver";
import type { CourseSpecificationRegister } from "@/lib/curriculum/specification-register";
import { createIssueCollector, finalizeReport, findDuplicates, isValidId } from "@/lib/curriculum/validation-report";

export type CanonicalSkillSpecificationMapping = {
  skillPathId: string;
  primarySpecPointId: string;
  officialSpecificationPointIds: string[];
};

export function validateCanonicalSkillSpecificationMappings(input: {
  register: CourseSpecificationRegister;
  mappings: CanonicalSkillSpecificationMapping[];
  pathContexts: ResolvedSkillPath[];
}) {
  const { issue, issues } = createIssueCollector();
  const pointById = new Map(input.register.points.filter((point) => point.status === "active").map((point) => [point.specPointId, point]));
  const pathById = new Map(input.pathContexts.map((context) => [context.skillPath.slug, context]));

  for (const duplicate of findDuplicates(input.mappings.map((mapping) => mapping.skillPathId))) {
    issue("error", "duplicate-official-skill-mapping", `Canonical skill "${duplicate}" has more than one official mapping record.`, "curriculum/higher-maths/official-skill-mappings");
  }

  for (const mapping of input.mappings) {
    const location = `curriculum/higher-maths/official-skill-mapping/${mapping.skillPathId}`;
    if (!isValidId(mapping.skillPathId) || !pathById.has(mapping.skillPathId)) {
      issue("error", "unknown-mapped-skill", `Official mapping references unknown canonical skill "${mapping.skillPathId}".`, location);
    }
    if (!mapping.officialSpecificationPointIds.includes(mapping.primarySpecPointId)) {
      issue("error", "primary-point-not-listed", `Primary point "${mapping.primarySpecPointId}" is not present in officialSpecificationPointIds.`, location);
    }
    for (const duplicate of findDuplicates(mapping.officialSpecificationPointIds)) {
      issue("error", "duplicate-point-on-skill", `Canonical skill "${mapping.skillPathId}" references official point "${duplicate}" more than once.`, location);
    }
    for (const pointId of mapping.officialSpecificationPointIds) {
      if (!pointById.has(pointId)) issue("error", "unknown-official-point", `Canonical skill "${mapping.skillPathId}" references missing official point "${pointId}".`, location);
    }
    const context = pathById.get(mapping.skillPathId);
    const primaryPoint = pointById.get(mapping.primarySpecPointId);
    if (context && primaryPoint && primaryPoint.areaId !== context.specificationStrand.id) {
      issue("error", "primary-point-strand-mismatch", `Canonical skill "${mapping.skillPathId}" is in "${context.specificationStrand.id}" but its primary official point is in "${primaryPoint.areaId}".`, location);
    }
  }

  for (const context of input.pathContexts) {
    if (!input.mappings.some((mapping) => mapping.skillPathId === context.skillPath.slug)) {
      issue("error", context.skillPath.isAvailable ? "available-skill-missing-official-mapping" : "canonical-skill-missing-official-mapping", `Canonical skill "${context.skillPath.slug}" has no official specification mapping.`, `curriculum/higher-maths/skill/${context.skillPath.slug}`);
    }
  }

  const mappedPointIds = new Set(input.mappings.flatMap((mapping) => mapping.officialSpecificationPointIds));
  for (const point of pointById.values()) {
    if (point.mandatory && !mappedPointIds.has(point.specPointId)) {
      issue("error", "official-point-uncovered", `Mandatory official point "${point.specPointId}" is not mapped to any canonical skill.`, `curriculum/higher-maths/official-point/${point.specPointId}`);
    }
  }

  return finalizeReport(issues);
}

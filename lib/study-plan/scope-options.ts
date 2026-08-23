import { higherMathematicsOfficialSkillMappings } from "@/data/curriculum/higher-mathematics/official-skill-mappings";
import { higherMathematicsSpecificationRegister } from "@/data/curriculum/higher-mathematics/specification-register";
import { contentResolver } from "@/lib/content-resolver";
import { resolveSkillsForRequirements } from "@/lib/curriculum/requirement-resolution";
import { topicScopeId } from "@/lib/study-plan/assessments";

export type StudyPlanCourseOption = { courseSlug: string; courseName: string };

/** Genuinely live/selectable courses, derived from the same availability flag the rest of the app uses — never a second hand-maintained list. */
export function studyPlanCourseOptions(): StudyPlanCourseOption[] {
  return contentResolver.getSubjects()
    .filter((subject) => subject.isAvailable)
    .map((subject) => ({ courseSlug: subject.subjectSlug, courseName: subject.subjectName }));
}

export type StudyPlanScopeSkillOption = {
  skillPathId: string;
  skillPathName: string;
  isAvailable: boolean;
};
export type StudyPlanScopeTopicOption = {
  topicScopeId: string;
  topicName: string;
  skills: StudyPlanScopeSkillOption[];
};
export type StudyPlanScopeAreaOption = {
  courseAreaId: string;
  courseAreaName: string;
  topics: StudyPlanScopeTopicOption[];
};

/**
 * Area-first, topic-second scope options for the Assessment scope selector, sourced from the same
 * canonical curriculum structure (`contentResolver`) the rest of the app uses — never a separate,
 * duplicated taxonomy. Grouped by course area then route topic (e.g. "Calculus" -> "Differentiation")
 * so the UI can collapse at the topic level instead of a flat checkbox dump of every skill in the
 * course, and so a topic-scoped assessment ("just Differentiation") is representable without
 * enumerating individual skill IDs. Canonical unavailable skills remain selectable because school
 * assessment scope is broader than Orthic's current published-content coverage.
 */
export function studyPlanScopeOptions(courseSlug: string): StudyPlanScopeAreaOption[] {
  const contexts = contentResolver.getAllPathContexts()
    .filter((context) => context.subject.subjectSlug === courseSlug && context.skillPath.contentStatus === "active");
  const areas = new Map<string, StudyPlanScopeAreaOption>();
  for (const context of contexts) {
    const areaId = context.courseArea.slug;
    const area = areas.get(areaId) ?? { courseAreaId: areaId, courseAreaName: context.courseArea.name, topics: [] };
    if (!areas.has(areaId)) areas.set(areaId, area);

    const topicId = topicScopeId(areaId, context.routeTopic.slug);
    let topic = area.topics.find((entry) => entry.topicScopeId === topicId);
    if (!topic) {
      topic = { topicScopeId: topicId, topicName: context.routeTopic.name, skills: [] };
      area.topics.push(topic);
    }
    topic.skills.push({
      skillPathId: context.skillPath.slug,
      skillPathName: context.skillPath.name,
      isAvailable: context.skillPath.isAvailable,
    });
  }
  return [...areas.values()];
}

export type StudyPlanScopeRequirementOption = {
  specPointId: string;
  wording: string;
  skillPathIds: string[];
  availableSkillCount: number;
  totalSkillCount: number;
};
export type StudyPlanScopeStrandOption = {
  strandId: string;
  strandName: string;
  requirements: StudyPlanScopeRequirementOption[];
};
export type StudyPlanScopeRequirementAreaOption = {
  courseAreaId: string;
  courseAreaName: string;
  strands: StudyPlanScopeStrandOption[];
};

/**
 * Official-specification-first scope options for the Assessment scope selector: course area ->
 * specification strand -> official requirement, sourced from the same specification register and
 * official-skill mappings Course Tracker uses (never a duplicated taxonomy). Lets a learner enter
 * exactly the requirements a teacher named, without needing to know which Orthic skill(s) each one
 * resolves to. Skills are resolved via `resolveSkillsForRequirements` purely so callers can show
 * honest coverage counts — the resolved skill list is never itself the thing a learner picks from.
 * Canonical unavailable skills still count toward resolution (same "school scope is broader than
 * Orthic's current published content" precedent `studyPlanScopeOptions` already follows above) —
 * only `availableSkillCount` distinguishes what Orthic can currently teach from what it will cover
 * later. Only Higher Maths has a specification register today; other course slugs return no options.
 */
export function studyPlanRequirementScopeOptions(courseSlug: string): StudyPlanScopeRequirementAreaOption[] {
  if (courseSlug !== "higher-maths") return [];
  const subject = contentResolver.getSubjects().find((entry) => entry.subjectSlug === courseSlug);
  if (!subject) return [];
  const skillById = new Map(contentResolver.getAllPathContexts()
    .filter((context) => context.subject.subjectSlug === courseSlug && context.skillPath.contentStatus === "active")
    .map((context) => [context.skillPath.slug, context.skillPath]));
  const activePoints = higherMathematicsSpecificationRegister.points.filter((point) => point.status === "active");
  const pointsByStrand = new Map<string, typeof activePoints>();
  for (const point of activePoints) pointsByStrand.set(point.areaId, [...(pointsByStrand.get(point.areaId) ?? []), point]);
  const pointOrder = new Map(higherMathematicsSpecificationRegister.points.map((point, index) => [point.specPointId, index]));

  return subject.courseAreas
    .map((courseArea) => {
      const strands = [...(courseArea.specificationStrands ?? [])]
        .filter((strand) => strand.contentStatus === "active")
        .sort((left, right) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id))
        .map((strand) => {
          const requirements = (pointsByStrand.get(strand.id) ?? [])
            .slice()
            .sort((left, right) => (pointOrder.get(left.specPointId) ?? 0) - (pointOrder.get(right.specPointId) ?? 0))
            .map((point) => {
              const skillPathIds = resolveSkillsForRequirements([point.specPointId], higherMathematicsOfficialSkillMappings);
              const availableSkillCount = skillPathIds.filter((id) => skillById.get(id)?.isAvailable).length;
              return {
                specPointId: point.specPointId,
                wording: point.verificationStatus === "verified" ? point.officialStatement : point.authoringSummary,
                skillPathIds,
                availableSkillCount,
                totalSkillCount: skillPathIds.length,
              };
            });
          return { strandId: strand.id, strandName: strand.name, requirements };
        })
        .filter((strand) => strand.requirements.length > 0);
      return { courseAreaId: courseArea.slug, courseAreaName: courseArea.name, strands };
    })
    .filter((area) => area.strands.length > 0);
}

import { contentResolver } from "@/lib/content-resolver";
import { topicScopeId } from "@/lib/study-plan/assessments";

export type StudyPlanCourseOption = { courseSlug: string; courseName: string };

/** Genuinely live/selectable courses, derived from the same availability flag the rest of the app uses — never a second hand-maintained list. */
export function studyPlanCourseOptions(): StudyPlanCourseOption[] {
  return contentResolver.getSubjects()
    .filter((subject) => subject.isAvailable)
    .map((subject) => ({ courseSlug: subject.subjectSlug, courseName: subject.subjectName }));
}

export type StudyPlanScopeSkillOption = { skillPathId: string; skillPathName: string };
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
 * enumerating individual skill IDs.
 */
export function studyPlanScopeOptions(courseSlug: string): StudyPlanScopeAreaOption[] {
  const contexts = contentResolver.getAllPathContexts()
    .filter((context) => context.subject.subjectSlug === courseSlug && context.skillPath.isAvailable);
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
    topic.skills.push({ skillPathId: context.skillPath.slug, skillPathName: context.skillPath.name });
  }
  return [...areas.values()];
}

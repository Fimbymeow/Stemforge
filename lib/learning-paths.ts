import { questions as physicsQuestions, type StemForgeQuestion } from "@/data/questions";
import type { CourseArea, LearningStage, Question, SkillPath, Subject, Topic } from "@/data/types";
import { contentResolver } from "@/lib/content-resolver";
import { getActiveRecords, getActiveStages } from "@/lib/content-selectors";

export type ResourceType = "revision-notes" | "formula-cards" | "worked-examples" | "flashcards";
export type AnyStemForgeQuestion = Question | StemForgeQuestion;

export const subjects: Subject[] = contentResolver.getSubjects();

// Private-beta entry defaults. Generic question/path runtime code resolves ownership through contentResolver.
export const ACTIVE_SUBJECT_SLUG = "higher-maths";
export const ACTIVE_SKILL_PATH_SLUG = "basic-differentiation";

export function getSubjectBySlug(subjectSlug: string) {
  return contentResolver.getSubject(subjectSlug);
}

export function getCourseAreaBySlug(subject: Subject | undefined, courseAreaSlug: string) {
  return subject ? contentResolver.getCourseArea(subject.subjectSlug, courseAreaSlug) : undefined;
}

export function getTopicBySlug(courseArea: CourseArea | undefined, topicSlug: string) {
  if (!courseArea) return undefined;
  return contentResolver.getRouteTopics(courseArea).find((topic) => topic.slug === topicSlug)
    ?? getActiveRecords(courseArea.topics ?? []).find((topic) => topic.slug === topicSlug);
}

export function getSkillPathBySlug(topic: Topic | undefined, skillPathSlug: string) {
  if (!topic) return undefined;
  const context = contentResolver.getPathContext(skillPathSlug);
  return context?.routeTopic.slug === topic.slug ? context.skillPath : undefined;
}

export function getAllSkillPathContexts(subject?: Subject) {
  return contentResolver.getAllPathContexts().filter((context) => !subject || context.subject.subjectSlug === subject.subjectSlug);
}

export function getAllSkillPaths(subject: Subject | undefined) {
  return subject ? getAllSkillPathContexts(subject).map((context) => context.skillPath) : [];
}

export function getSkillPathById(skillPathId: string) {
  return contentResolver.getPathContext(skillPathId)?.skillPath;
}

export function getSkillPathContext(skillPathId: string) {
  return contentResolver.getPathContext(skillPathId);
}

export function getSkillPathContextByRoute(subjectSlug: string, courseAreaSlug: string, topicSlug: string, skillPathSlug: string) {
  return contentResolver.getPathContextByRoute(subjectSlug, courseAreaSlug, topicSlug, skillPathSlug);
}

export function getAvailableSkillPaths(subject: Subject | undefined) {
  return getAllSkillPaths(subject).filter((path) => path.isAvailable);
}

export function getLockedSkillPaths(subject: Subject | undefined) {
  return getAllSkillPaths(subject).filter((path) => !path.isAvailable);
}

export function getActiveSubject() {
  const subject = getSubjectBySlug(ACTIVE_SUBJECT_SLUG);
  if (!subject) throw new Error("Active subject is missing from subject data.");
  return subject;
}

export function getActiveSkillPath() {
  const path = getSkillPathById(ACTIVE_SKILL_PATH_SLUG);
  if (!path?.isAvailable) throw new Error("No available skill path is configured for the active beta subject.");
  return path;
}

export function getActiveSkillPathHref() {
  return getSkillPathHref(getActiveSkillPath());
}

export function getActiveFirstQuestionId() {
  return getFirstQuestionIdForSkillPath(getActiveSkillPath());
}

export function getActiveFirstQuestionHref() {
  const questionId = getActiveFirstQuestionId();
  return questionId ? getQuestionHref(questionId) : getActiveSkillPathHref();
}

export function getActiveContinueHref(nextQuestionId?: string | null) {
  return nextQuestionId ? getQuestionHref(nextQuestionId) : getActiveSkillPathHref();
}

export function getSkillPathQuestionIds(skillPath: SkillPath) {
  return getActiveStages(skillPath).flatMap((stage) => stage.questionIds);
}

export function getAllQuestions(): AnyStemForgeQuestion[] {
  return [...contentResolver.getQuestions(), ...physicsQuestions];
}

export function getQuestionById(id: string) {
  return contentResolver.getQuestion(id) ?? physicsQuestions.find((question) => question.id === id);
}

export function getCanonicalQuestionById(id: string) {
  return contentResolver.getQuestion(id);
}

export function getQuestionContext(id: string) {
  return contentResolver.getQuestionContext(id);
}

export function getQuestionsForSkillPath(skillPath: SkillPath): Question[] {
  return contentResolver.getPathQuestions(skillPath);
}

export function getQuestionCountForSkillPath(skillPath: SkillPath) {
  return getSkillPathQuestionIds(skillPath).length || skillPath.questions;
}

export function getFirstQuestionIdForSkillPath(skillPath: SkillPath) {
  return getSkillPathQuestionIds(skillPath)[0] ?? null;
}

export function getFirstQuestionIdForStage(skillPath: SkillPath, stageIdOrName: string) {
  const stage = getActiveStages(skillPath).find((item) => item.id === stageIdOrName || item.name === stageIdOrName || item.label === stageIdOrName);
  return stage?.questionIds[0] ?? null;
}

export function getStageForQuestionInSkillPath(skillPath: SkillPath, questionId: string): LearningStage | undefined {
  return getActiveStages(skillPath).find((stage) => stage.questionIds.includes(questionId));
}

export function getSkillPathForQuestion(question: AnyStemForgeQuestion | undefined) {
  return question ? contentResolver.getQuestionContext(question.id)?.skillPath : undefined;
}

export function getSubjectHrefForSkillPath(skillPathOrId: SkillPath | string) {
  const id = typeof skillPathOrId === "string" ? skillPathOrId : skillPathOrId.slug;
  return contentResolver.getPathContext(id)?.subject.href ?? "/subjects";
}

export function getSubjectForSkillPath(skillPathOrId: SkillPath | string) {
  const id = typeof skillPathOrId === "string" ? skillPathOrId : skillPathOrId.slug;
  return contentResolver.getPathContext(id)?.subject;
}

export function getCourseAreaHrefForSkillPath(skillPathOrId: SkillPath | string) {
  const id = typeof skillPathOrId === "string" ? skillPathOrId : skillPathOrId.slug;
  return contentResolver.getPathContext(id)?.courseArea.href ?? "/subjects";
}

export function getResourceSummaryForSkillPath(skillPath: SkillPath, resourceType: ResourceType) {
  const resources = getResourcesForSkillPath(skillPath, resourceType);
  return { count: resources.length, hasResources: resources.length > 0 };
}

export function getResourcesForSkillPath(skillPath: SkillPath, resourceType: ResourceType) {
  if (resourceType === "revision-notes") return getActiveRecords(skillPath.notes ?? []);
  if (resourceType === "formula-cards") return getActiveRecords(skillPath.formulaCards ?? []);
  if (resourceType === "worked-examples") return getActiveRecords(skillPath.workedExamples ?? []);
  return getActiveRecords(skillPath.flashcards ?? []);
}

export function getSkillPathHref(skillPath: SkillPath) {
  return skillPath.href;
}

export function getQuestionHref(questionId: string) {
  return `/question/${questionId}`;
}

export function getResourceHref(resourceType: ResourceType, subjectSlug = ACTIVE_SUBJECT_SLUG) {
  return `/subjects/${subjectSlug}/${resourceType}`;
}

export function getQuestionBankHref(subjectSlug = ACTIVE_SUBJECT_SLUG) {
  return `/subjects/${subjectSlug}/question-bank`;
}

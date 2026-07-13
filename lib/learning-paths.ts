import { higherMathsDifferentiationQuestions } from "@/content/questions/higher-maths/differentiation";
import { higherMaths } from "@/data/higher-maths";
import { higherPhysics } from "@/data/higher-physics";
import { questions as physicsQuestions, type StemForgeQuestion } from "@/data/questions";
import type { CourseArea, LearningStage, Question, SkillPath, Subject, Topic } from "@/data/types";
import {
  createActiveSkillPathView,
  getActiveCourseAreas,
  getActiveQuestionById,
  getActiveQuestions,
  getActiveRecords,
  getActiveResources,
  getActiveSkillPaths,
  getActiveSpecAreas,
  getActiveStages,
  getActiveSubjects,
} from "@/lib/content-selectors";

export type ResourceType = "revision-notes" | "formula-cards" | "worked-examples" | "flashcards";
export type AnyStemForgeQuestion = Question | StemForgeQuestion;

export const subjects: Subject[] = getActiveSubjects([higherMaths, higherPhysics]);

// Current private beta entry point. Components should resolve this through helpers instead of assuming Basic differentiation directly.
export const ACTIVE_SUBJECT_SLUG = "higher-maths";
export const ACTIVE_SKILL_PATH_SLUG = "basic-differentiation";

export function getSubjectBySlug(subjectSlug: string) {
  return subjects.find((subject) => subject.subjectSlug === subjectSlug && subject.contentStatus === "active");
}

export function getCourseAreaBySlug(subject: Subject | undefined, courseAreaSlug: string) {
  return subject ? getActiveCourseAreas(subject).find((area) => area.slug === courseAreaSlug) : undefined;
}

export function getTopicBySlug(courseArea: CourseArea | undefined, topicSlug: string) {
  if (!courseArea) return undefined;
  return getActiveSpecAreas(courseArea).find((topic) => topic.slug === topicSlug)
    ?? getActiveRecords(courseArea.topics ?? []).find((topic) => topic.slug === topicSlug);
}

export function getSkillPathBySlug(topic: Topic | undefined, skillPathSlug: string) {
  const path = topic ? getActiveSkillPaths(topic).find((item) => item.slug === skillPathSlug) : undefined;
  return path ? createActiveSkillPathView(path, higherMathsDifferentiationQuestions) : undefined;
}

export function getAllSkillPaths(subject: Subject | undefined) {
  if (!subject || subject.contentStatus !== "active") return [];
  return getActiveCourseAreas(subject).flatMap((area) =>
    getActiveSpecAreas(area).flatMap((topic) =>
      getActiveSkillPaths(topic).map((path) => createActiveSkillPathView(path, higherMathsDifferentiationQuestions)),
    ),
  );
}

export function getSkillPathById(skillPathId: string) {
  return subjects.flatMap((subject) => getAllSkillPaths(subject)).find((path) => path.slug === skillPathId);
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
  const subject = getActiveSubject();
  const skillPath = getAvailableSkillPaths(subject).find((path) => path.slug === ACTIVE_SKILL_PATH_SLUG) ?? getAvailableSkillPaths(subject)[0];
  if (!skillPath) throw new Error("No available skill path is configured for the active beta subject.");
  return skillPath;
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
  return [...getActiveQuestions(higherMathsDifferentiationQuestions), ...physicsQuestions];
}

export function getQuestionById(id: string) {
  return getActiveQuestionById(higherMathsDifferentiationQuestions, id)
    ?? physicsQuestions.find((question) => question.id === id);
}

export function getQuestionsForSkillPath(skillPath: SkillPath): Question[] {
  return getSkillPathQuestionIds(skillPath)
    .map((id) => getActiveQuestionById(higherMathsDifferentiationQuestions, id))
    .filter((question): question is Question => question !== undefined);
}

export function getQuestionCountForSkillPath(skillPath: SkillPath) {
  const stageQuestionIds = getSkillPathQuestionIds(skillPath);
  return stageQuestionIds.length || skillPath.questions;
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
  if (!question) return undefined;
  if ("skillPathId" in question && question.skillPathId) return getSkillPathById(question.skillPathId);
  return subjects
    .flatMap((subject) => getAllSkillPaths(subject))
    .find((path) => getActiveStages(path).some((stage) => stage.questionIds.includes(question.id)));
}

export function getResourceSummaryForSkillPath(skillPath: SkillPath, resourceType: ResourceType) {
  const resources = getResourcesForSkillPath(skillPath, resourceType);
  return {
    count: resources.length,
    hasResources: resources.length > 0,
  };
}

export function getResourcesForSkillPath(skillPath: SkillPath, resourceType: ResourceType) {
  if (resourceType === "revision-notes") return getActiveResources(skillPath.notes ?? []);
  if (resourceType === "formula-cards") return getActiveResources(skillPath.formulaCards ?? []);
  if (resourceType === "worked-examples") return getActiveResources(skillPath.workedExamples ?? []);
  return getActiveResources(skillPath.flashcards ?? []);
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

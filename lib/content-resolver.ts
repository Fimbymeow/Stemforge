import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import type {
  CourseArea,
  LearningStage,
  Question,
  SkillPath,
  SpecificationStrand,
  Subject,
  Topic,
} from "@/data/types";
import {
  createActiveSkillPathView,
  createActiveSubjectView,
  getActiveCourseAreas,
  getActiveRecords,
  getActiveSkillPaths,
  getActiveSpecAreas,
  getActiveStages,
  getActiveSubjects,
} from "@/lib/content-selectors";

export type ResolvedSkillPath = {
  subject: Subject;
  courseArea: CourseArea;
  specificationStrand: SpecificationStrand;
  routeTopic: Topic;
  skillPath: SkillPath;
};

export type ResolvedQuestionContext = ResolvedSkillPath & {
  question: Question;
  stage: LearningStage;
  stageIndex: number;
  questionIndexInStage: number;
  questionIndexInPath: number;
  pathQuestions: Question[];
  previousQuestion?: Question;
  nextQuestion?: Question;
  nextStage?: LearningStage;
};

function compareOrder(
  left: { displayOrder?: number; id?: string; slug?: string },
  right: { displayOrder?: number; id?: string; slug?: string },
) {
  return (left.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.displayOrder ?? Number.MAX_SAFE_INTEGER)
    || (left.id ?? left.slug ?? "").localeCompare(right.id ?? right.slug ?? "");
}

function routeKey(subjectSlug: string, courseAreaSlug: string, routeTopicSlug: string, skillPathSlug: string) {
  return `${subjectSlug}\0${courseAreaSlug}\0${routeTopicSlug}\0${skillPathSlug}`;
}

export function createContentResolver(source: CanonicalContentSource) {
  const activeQuestions = getActiveRecords(source.questions);
  const questionById = new Map(activeQuestions.map((question) => [question.id, question]));
  const subjectViews = getActiveSubjects(source.subjects).map((subject) => createActiveSubjectView(subject, source.questions));
  const questionVersions = Object.freeze(Object.fromEntries(activeQuestions.map((question) => [question.id, question.questionVersion]))) as Readonly<Record<string, number>>;
  let pathContextsCache: ResolvedSkillPath[] | null = null;
  let pathBySlugCache: Map<string, ResolvedSkillPath | null> | null = null;
  let pathByRouteCache: Map<string, ResolvedSkillPath> | null = null;
  const pathQuestionsCache = new Map<string, Question[]>();
  const questionContextCache = new Map<string, ResolvedQuestionContext | undefined>();

  function activeSubjects() {
    return subjectViews;
  }

  function getSubject(subjectSlug: string) {
    return activeSubjects().find((subject) => subject.subjectSlug === subjectSlug);
  }

  function getCourseArea(subjectSlug: string, courseAreaSlug: string) {
    const subject = getSubject(subjectSlug);
    return subject ? getActiveCourseAreas(subject).find((course) => course.slug === courseAreaSlug) : undefined;
  }

  function getSpecificationStrands(courseArea: CourseArea | undefined) {
    return getActiveRecords(courseArea?.specificationStrands ?? []).sort(compareOrder);
  }

  function getRouteTopics(courseArea: CourseArea | undefined) {
    return courseArea ? getActiveSpecAreas(courseArea) : [];
  }

  function getAllPathContexts() {
    if (pathContextsCache) return pathContextsCache;
    const contexts: ResolvedSkillPath[] = [];
    for (const subject of activeSubjects()) {
      for (const courseArea of getActiveCourseAreas(subject)) {
        const strands = getSpecificationStrands(courseArea);
        for (const routeTopic of getRouteTopics(courseArea)) {
          for (const rawPath of getActiveSkillPaths(routeTopic)) {
            const specificationStrand = strands.find((strand) => strand.id === rawPath.specificationStrandId);
            if (!specificationStrand) continue;
            contexts.push({
              subject,
              courseArea,
              specificationStrand,
              routeTopic,
              skillPath: createActiveSkillPathView(rawPath, source.questions),
            });
          }
        }
      }
    }
    pathContextsCache = contexts.sort((left, right) =>
      compareOrder(left.specificationStrand, right.specificationStrand)
      || compareOrder(left.skillPath, right.skillPath),
    );
    indexPaths(pathContextsCache);
    return pathContextsCache;
  }

  function getPathContext(skillPathId: string) {
    ensurePathIndexes();
    return pathBySlugCache!.get(skillPathId) ?? undefined;
  }

  function getPathContextByRoute(subjectSlug: string, courseAreaSlug: string, routeTopicSlug: string, skillPathSlug: string) {
    ensurePathIndexes();
    return pathByRouteCache!.get(routeKey(subjectSlug, courseAreaSlug, routeTopicSlug, skillPathSlug));
  }

  function getPathQuestions(skillPathOrId: SkillPath | string) {
    const context = typeof skillPathOrId === "string"
      ? getPathContext(skillPathOrId)
      : getPathContext(skillPathOrId.slug);
    if (!context) return [];
    const cached = pathQuestionsCache.get(context.skillPath.slug);
    if (cached) return cached;
    const questions = getActiveStages(context.skillPath).flatMap((stage) =>
      stage.questionIds
        .map((questionId) => questionById.get(questionId))
        .filter((question): question is Question => question !== undefined),
    );
    pathQuestionsCache.set(context.skillPath.slug, questions);
    return questions;
  }

  function getQuestion(questionId: string) {
    return questionById.get(questionId);
  }

  function getQuestions() {
    return activeQuestions;
  }

  function getQuestionContext(questionId: string): ResolvedQuestionContext | undefined {
    if (questionContextCache.has(questionId)) return questionContextCache.get(questionId);
    const question = getQuestion(questionId);
    if (!question?.skillPathId || !question.stageId) return cacheQuestionContext(questionId, undefined);
    const pathContext = getPathContext(question.skillPathId);
    if (!pathContext) return cacheQuestionContext(questionId, undefined);
    const stages = getActiveStages(pathContext.skillPath);
    const stageIndex = stages.findIndex((stage) => stage.id === question.stageId && stage.questionIds.includes(question.id));
    if (stageIndex < 0) return cacheQuestionContext(questionId, undefined);
    const stage = stages[stageIndex];
    const questionIndexInStage = stage.questionIds.indexOf(question.id);
    const pathQuestions = getPathQuestions(pathContext.skillPath);
    const questionIndexInPath = pathQuestions.findIndex((candidate) => candidate.id === question.id);
    if (questionIndexInPath < 0) return cacheQuestionContext(questionId, undefined);
    const nextQuestion = pathQuestions[questionIndexInPath + 1];
    const nextStage = nextQuestion && nextQuestion.stageId !== stage.id ? stages[stageIndex + 1] : undefined;
    return cacheQuestionContext(questionId, {
      ...pathContext,
      question,
      stage,
      stageIndex,
      questionIndexInStage,
      questionIndexInPath,
      pathQuestions,
      previousQuestion: pathQuestions[questionIndexInPath - 1],
      nextQuestion,
      nextStage,
    });
  }

  function getQuestionVersions() {
    return questionVersions;
  }

  function ensurePathIndexes() {
    if (!pathBySlugCache || !pathByRouteCache) getAllPathContexts();
  }

  function indexPaths(contexts: ResolvedSkillPath[]) {
    pathBySlugCache = new Map();
    pathByRouteCache = new Map();
    for (const context of contexts) {
      const slug = context.skillPath.slug;
      pathBySlugCache.set(slug, pathBySlugCache.has(slug) ? null : context);
      pathByRouteCache.set(routeKey(context.subject.subjectSlug, context.courseArea.slug, context.routeTopic.slug, slug), context);
    }
  }

  function cacheQuestionContext(questionId: string, context: ResolvedQuestionContext | undefined) {
    questionContextCache.set(questionId, context);
    return context;
  }

  return {
    getSubjects: activeSubjects,
    getSubject,
    getCourseArea,
    getSpecificationStrands,
    getRouteTopics,
    getAllPathContexts,
    getPathContext,
    getPathContextByRoute,
    getPathQuestions,
    getQuestions,
    getQuestion,
    getQuestionContext,
    getQuestionVersions,
  };
}

export const contentResolver = createContentResolver(canonicalContent);

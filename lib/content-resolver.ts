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
  stage: ResolvedQuestionStage;
  stageIndex: number;
  questionIndexInStage: number;
  questionIndexInPath: number;
  pathQuestions: Question[];
  previousQuestion?: Question;
  nextQuestion?: Question;
  nextStage?: LearningStage;
};

export type ResolvedQuestionStage = LearningStage | {
  id: string;
  title: "Practice";
  label: "Practice";
  name: "Practice";
  description: string;
  questionIds: string[];
  questions: number;
  completed: number;
  button: string;
  accent: "blue";
  status: "available";
  estimatedMinutes: number;
  kind: "practice_compatibility";
};

export type ResolvedPracticeQuestionPosition = ResolvedSkillPath & {
  question: Question;
  /** Zero-based authored index in the skill-level Practice projection. */
  index: number;
  /** One-based learner-readable position in the Practice projection. */
  position: number;
  total: number;
  previousQuestion?: Question;
  nextQuestion?: Question;
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
  const practiceQuestionsCache = new Map<string, Question[]>();
  const questionContextCache = new Map<string, ResolvedQuestionContext | undefined>();
  const practicePositionCache = new Map<string, ResolvedPracticeQuestionPosition | undefined>();

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
    const stages = getActiveStages(context.skillPath);
    const questions = stages.flatMap((stage) =>
      stage.questionIds
        .map((questionId) => questionById.get(questionId))
        .filter((question): question is Question => question !== undefined),
    );
    if (stages.length === 0 && context.skillPath.practiceCompatibilityStageId) {
      questions.push(...getPracticeQuestions(context.skillPath));
    }
    pathQuestionsCache.set(context.skillPath.slug, questions);
    return questions;
  }

  function getQuestion(questionId: string) {
    return questionById.get(questionId);
  }

  /**
   * Returns the explicit skill-level Practice projection without changing the
   * legacy stage-backed path order used by current learner behaviour.
   */
  function getPracticeQuestions(skillPathOrId: SkillPath | string) {
    const context = typeof skillPathOrId === "string"
      ? getPathContext(skillPathOrId)
      : getPathContext(skillPathOrId.slug);
    if (!context?.skillPath.practiceQuestionIds) return [];
    const cached = practiceQuestionsCache.get(context.skillPath.slug);
    if (cached) return cached;
    const questions = context.skillPath.practiceQuestionIds
      .map((questionId) => questionById.get(questionId))
      .filter((question): question is Question => question !== undefined);
    practiceQuestionsCache.set(context.skillPath.slug, questions);
    return questions;
  }

  function getPracticeQuestionPosition(questionId: string): ResolvedPracticeQuestionPosition | undefined {
    if (practicePositionCache.has(questionId)) return practicePositionCache.get(questionId);
    const question = getQuestion(questionId);
    if (!question?.skillPathId) return cachePracticePosition(questionId, undefined);
    const pathContext = getPathContext(question.skillPathId);
    if (!pathContext?.skillPath.practiceQuestionIds) return cachePracticePosition(questionId, undefined);
    const questions = getPracticeQuestions(pathContext.skillPath);
    const index = questions.findIndex((candidate) => candidate.id === questionId);
    if (index < 0) return cachePracticePosition(questionId, undefined);
    return cachePracticePosition(questionId, {
      ...pathContext,
      question,
      index,
      position: index + 1,
      total: questions.length,
      previousQuestion: questions[index - 1],
      nextQuestion: questions[index + 1],
    });
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
    if (stageIndex < 0) {
      const compatibilityStageId = pathContext.skillPath.practiceCompatibilityStageId;
      const practiceQuestions = getPracticeQuestions(pathContext.skillPath);
      const practiceIndex = practiceQuestions.findIndex((candidate) => candidate.id === question.id);
      if (!compatibilityStageId || question.stageId !== compatibilityStageId || practiceIndex < 0) {
        return cacheQuestionContext(questionId, undefined);
      }
      const practiceQuestionIds = practiceQuestions.map((candidate) => candidate.id);
      const practiceStage: ResolvedQuestionStage = {
        id: compatibilityStageId,
        title: "Practice",
        label: "Practice",
        name: "Practice",
        description: "Practise this skill in the approved question order.",
        questionIds: practiceQuestionIds,
        questions: practiceQuestionIds.length,
        completed: 0,
        button: "Continue Practice",
        accent: "blue",
        status: "available",
        estimatedMinutes: 0,
        kind: "practice_compatibility",
      };
      return cacheQuestionContext(questionId, {
        ...pathContext,
        question,
        stage: practiceStage,
        stageIndex: -1,
        questionIndexInStage: practiceIndex,
        questionIndexInPath: practiceIndex,
        pathQuestions: practiceQuestions,
        previousQuestion: practiceQuestions[practiceIndex - 1],
        nextQuestion: practiceQuestions[practiceIndex + 1],
      });
    }
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

  function cachePracticePosition(questionId: string, position: ResolvedPracticeQuestionPosition | undefined) {
    practicePositionCache.set(questionId, position);
    return position;
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
    getPracticeQuestions,
    getPracticeQuestionPosition,
    getQuestions,
    getQuestion,
    getQuestionContext,
    getQuestionVersions,
  };
}

export const contentResolver = createContentResolver(canonicalContent);

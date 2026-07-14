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
  getActiveQuestionById,
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

export function createContentResolver(source: CanonicalContentSource) {
  function activeSubjects() {
    return getActiveSubjects(source.subjects).map((subject) => createActiveSubjectView(subject, source.questions));
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
    return contexts.sort((left, right) =>
      compareOrder(left.specificationStrand, right.specificationStrand)
      || compareOrder(left.skillPath, right.skillPath),
    );
  }

  function getPathContext(skillPathId: string) {
    const matches = getAllPathContexts().filter((context) => context.skillPath.slug === skillPathId);
    return matches.length === 1 ? matches[0] : undefined;
  }

  function getPathContextByRoute(subjectSlug: string, courseAreaSlug: string, routeTopicSlug: string, skillPathSlug: string) {
    return getAllPathContexts().find((context) =>
      context.subject.subjectSlug === subjectSlug
      && context.courseArea.slug === courseAreaSlug
      && context.routeTopic.slug === routeTopicSlug
      && context.skillPath.slug === skillPathSlug,
    );
  }

  function getPathQuestions(skillPathOrId: SkillPath | string) {
    const context = typeof skillPathOrId === "string"
      ? getPathContext(skillPathOrId)
      : getPathContext(skillPathOrId.slug);
    if (!context) return [];
    return getActiveStages(context.skillPath).flatMap((stage) =>
      stage.questionIds
        .map((questionId) => getActiveQuestionById(source.questions, questionId))
        .filter((question): question is Question => question !== undefined),
    );
  }

  function getQuestion(questionId: string) {
    return getActiveQuestionById(source.questions, questionId);
  }

  function getQuestions() {
    return getActiveRecords(source.questions);
  }

  function getQuestionContext(questionId: string): ResolvedQuestionContext | undefined {
    const question = getQuestion(questionId);
    if (!question?.skillPathId || !question.stageId) return undefined;
    const pathContext = getPathContext(question.skillPathId);
    if (!pathContext) return undefined;
    const stages = getActiveStages(pathContext.skillPath);
    const stageIndex = stages.findIndex((stage) => stage.id === question.stageId && stage.questionIds.includes(question.id));
    if (stageIndex < 0) return undefined;
    const stage = stages[stageIndex];
    const questionIndexInStage = stage.questionIds.indexOf(question.id);
    const pathQuestions = getPathQuestions(pathContext.skillPath);
    const questionIndexInPath = pathQuestions.findIndex((candidate) => candidate.id === question.id);
    if (questionIndexInPath < 0) return undefined;
    const nextQuestion = pathQuestions[questionIndexInPath + 1];
    const nextStage = nextQuestion && nextQuestion.stageId !== stage.id ? stages[stageIndex + 1] : undefined;
    return {
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
    };
  }

  function getQuestionVersions() {
    return Object.fromEntries(
      getActiveRecords(source.questions).map((question) => [question.id, question.questionVersion]),
    ) as Readonly<Record<string, number>>;
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

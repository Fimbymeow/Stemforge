import type {
  ContentResource,
  ContentStatus,
  CourseArea,
  LearningStage,
  Question,
  SkillPath,
  SpecArea,
  SpecificationStrand,
  Subject,
} from "@/data/types";

type LifecycleRecord = { contentStatus: ContentStatus };

export function getActiveRecords<T extends LifecycleRecord>(records: readonly T[]): T[] {
  return records.filter((record) => record.contentStatus === "active");
}

export const getActiveSubjects = (subjects: readonly Subject[]) => getActiveRecords(subjects);
export const getActiveCourseAreas = (subject: Subject) => getActiveRecords(subject.courseAreas);
export const getActiveSpecAreas = (courseArea: CourseArea) => getActiveRecords(courseArea.specAreas);
export const getActiveSpecificationStrands = (courseArea: CourseArea) =>
  getActiveRecords(courseArea.specificationStrands ?? []).sort(
    (left: SpecificationStrand, right: SpecificationStrand) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id),
  );
export const getActiveSkillPaths = (specArea: SpecArea) => getActiveRecords(specArea.skillPaths ?? []);
export const getActiveStages = (skillPath: SkillPath) => getActiveRecords(skillPath.learningStages ?? []);
export const getActiveResources = (resources: readonly ContentResource[]) => getActiveRecords(resources);
export const getActiveQuestions = (questions: readonly Question[]) => getActiveRecords(questions);

export function getActiveQuestionById(questions: readonly Question[], id: string): Question | undefined {
  return questions.find((question) => question.id === id && question.contentStatus === "active");
}

/** Historical/admin lookup. Runtime learner flows should use getActiveQuestionById. */
export function getQuestionByIdIncludingArchived(
  questions: readonly Question[],
  id: string,
  questionVersion?: number,
): Question | undefined {
  const matches = questions.filter((question) => question.id === id);
  if (questionVersion !== undefined) {
    return matches.find((question) => question.questionVersion === questionVersion);
  }

  return matches.find((question) => question.contentStatus === "active")
    ?? [...matches].sort((a, b) => b.questionVersion - a.questionVersion)[0];
}

export function getActiveQuestionIdsForStage(
  stage: LearningStage,
  questions: readonly Question[],
): string[] {
  return stage.questionIds.filter((id) => getActiveQuestionById(questions, id) !== undefined);
}

/** Produces the learner-facing path without mutating canonical source records. */
export function createActiveSkillPathView(
  path: SkillPath,
  questions: readonly Question[],
): SkillPath {
  const learningStages = getActiveStages(path).map((stage) => {
    const questionIds = getActiveQuestionIdsForStage(stage, questions);
    return { ...stage, questionIds, questions: questionIds.length };
  });

  return {
    ...path,
    learningStages,
    questions: learningStages.reduce((total, stage) => total + stage.questions, 0),
  };
}

/** Active hierarchy view for pages that navigate from a subject downward. */
export function createActiveSubjectView(subject: Subject, questions: readonly Question[]): Subject {
  return {
    ...subject,
    courseAreas: getActiveCourseAreas(subject).map((courseArea) => ({
      ...courseArea,
      specificationStrands: getActiveSpecificationStrands(courseArea),
      specAreas: getActiveSpecAreas(courseArea).map((specArea) => ({
        ...specArea,
        skillPaths: getActiveSkillPaths(specArea).map((path) => createActiveSkillPathView(path, questions)),
      })),
      topics: courseArea.topics?.filter((topic) => topic.contentStatus === "active"),
    })),
    learningStages: getActiveRecords(subject.learningStages),
  };
}

import { higherMathsDifferentiationQuestions } from "../../content/questions/higher-maths/differentiation";
import { higherMaths, higherMathsCalculusStrandIds } from "../../data/higher-maths";
import type { LearningStage, Question, SkillPath, Subject } from "../../data/types";
import type { CanonicalContentSource } from "../../data/canonical-content";

const TEST_PATH_ID = "fixture-basic-integration";
const TEST_FOUNDATIONS_STAGE_ID = "fixture-integration-stage-foundations";
const TEST_APPLICATIONS_STAGE_ID = "fixture-integration-stage-applications";

function stage(id: string, name: LearningStage["name"], questionIds: string[], accent: LearningStage["accent"]): LearningStage {
  return {
    id,
    stageVersion: 1,
    contentStatus: "active",
    title: name,
    label: name,
    name,
    description: `Test-only ${name.toLowerCase()} stage.`,
    questionIds,
    questions: questionIds.length,
    completed: 0,
    button: `Start ${name}`,
    accent,
    status: "available",
    estimatedMinutes: 5,
    href: `/question/${questionIds[0]}`,
  };
}

function question(id: string, stageId: string, stageName: LearningStage["name"], displayOrder: number): Question {
  return {
    ...structuredClone(higherMathsDifferentiationQuestions[0]),
    id,
    subject: "Higher Maths",
    courseArea: "Calculus",
    specArea: "Integration",
    specificationStrandId: higherMathsCalculusStrandIds.integratingFunctions,
    skillPath: "Fixture basic integration",
    skillPathId: TEST_PATH_ID,
    stageId,
    stage: stageName,
    skill: "Test integration skill",
    title: `Test integration question ${displayOrder}`,
    questionText: `Differentiate the test fixture value ${displayOrder}.`,
    displayOrder,
  };
}

export function createTwoPathFixture(): CanonicalContentSource {
  const subject: Subject = structuredClone(higherMaths);
  const integrationTopic = subject.courseAreas
    .find((courseArea) => courseArea.slug === "calculus")
    ?.specAreas.find((topic) => topic.slug === "integration");
  const plannedPath = integrationTopic?.skillPaths?.find((path) => path.slug === "basic-integration");
  if (!integrationTopic || !plannedPath) throw new Error("Production taxonomy no longer contains the planned integration mapping.");

  const fixturePath: SkillPath = {
    ...plannedPath,
    slug: TEST_PATH_ID,
    name: "Fixture basic integration",
    href: "/subjects/higher-maths/calculus/integration/fixture-basic-integration",
    status: "available",
    isAvailable: true,
    questions: 3,
    learningStages: [
      stage(TEST_FOUNDATIONS_STAGE_ID, "Foundations", ["fixture-int-f-001", "fixture-int-f-002"], "green"),
      stage(TEST_APPLICATIONS_STAGE_ID, "Applications", ["fixture-int-a-001"], "blue"),
    ],
  };
  integrationTopic.skillPaths = [
    ...(integrationTopic.skillPaths ?? []).filter((path) => path.slug !== "basic-integration"),
    fixturePath,
  ];
  integrationTopic.questions = 3;

  return {
    subjects: [subject],
    questions: [
      ...structuredClone(higherMathsDifferentiationQuestions),
      question("fixture-int-f-001", TEST_FOUNDATIONS_STAGE_ID, "Foundations", 1),
      question("fixture-int-f-002", TEST_FOUNDATIONS_STAGE_ID, "Foundations", 2),
      question("fixture-int-a-001", TEST_APPLICATIONS_STAGE_ID, "Applications", 1),
    ],
  };
}

export const fixtureIds = {
  path: TEST_PATH_ID,
  foundationsStage: TEST_FOUNDATIONS_STAGE_ID,
  applicationsStage: TEST_APPLICATIONS_STAGE_ID,
  questions: ["fixture-int-f-001", "fixture-int-f-002", "fixture-int-a-001"],
  subjectSlug: "higher-maths",
} as const;

const SUBJECT_TWO_SLUG = "fixture-subject-two";
const SUBJECT_TWO_STRAND_ID = "fixture-subject-two-strand";
const SUBJECT_TWO_PATH_ID = "fixture-subject-two-path";
const SUBJECT_TWO_FOUNDATIONS_STAGE_ID = "fixture-subject-two-stage-foundations";
const SUBJECT_TWO_APPLICATIONS_STAGE_ID = "fixture-subject-two-stage-applications";

function subjectTwoQuestion(id: string, stageId: string, stageName: LearningStage["name"], displayOrder: number): Question {
  return {
    ...structuredClone(higherMathsDifferentiationQuestions[0]),
    id,
    subject: "Fixture Subject Two",
    courseArea: "Fixture Course",
    specArea: "Fixture Spec Area",
    specificationStrandId: SUBJECT_TWO_STRAND_ID,
    skillPath: "Fixture subject two path",
    skillPathId: SUBJECT_TWO_PATH_ID,
    stageId,
    stage: stageName,
    skill: "Fixture subject two skill",
    title: `Fixture subject two question ${displayOrder}`,
    questionText: `Solve the fixture subject two value ${displayOrder}.`,
    displayOrder,
  };
}

function subjectTwoSkillPath(): SkillPath {
  return {
    slug: SUBJECT_TWO_PATH_ID,
    specificationStrandId: SUBJECT_TWO_STRAND_ID,
    displayOrder: 1,
    pathVersion: 1,
    contentStatus: "active",
    name: "Fixture subject two path",
    description: "Test-only skill path belonging to a second, simultaneously available subject.",
    href: `/subjects/${SUBJECT_TWO_SLUG}/fixture-course/fixture-spec/fixture-subject-two-path`,
    status: "available",
    isAvailable: true,
    progress: 0,
    completed: 0,
    questions: 3,
    learningStages: [
      stage(SUBJECT_TWO_FOUNDATIONS_STAGE_ID, "Foundations", ["fixture-st2-f-001", "fixture-st2-f-002"], "green"),
      stage(SUBJECT_TWO_APPLICATIONS_STAGE_ID, "Applications", ["fixture-st2-a-001"], "blue"),
    ],
  };
}

/**
 * Builds a CanonicalContentSource containing two simultaneously available subjects
 * (real Higher Maths plus a wholly synthetic second subject) with distinct slugs at
 * every taxonomy level, for cross-subject isolation tests.
 */
export function createTwoSubjectFixture(): CanonicalContentSource {
  const subjectOne: Subject = structuredClone(higherMaths);

  const subjectTwoPath = subjectTwoSkillPath();
  const subjectTwoStages = subjectTwoPath.learningStages as LearningStage[];
  const subjectTwo: Subject = {
    subjectSlug: SUBJECT_TWO_SLUG,
    contentStatus: "active",
    subjectName: "Fixture Subject Two",
    subject: "Fixture Subject",
    level: "Test",
    status: "available",
    isAvailable: true,
    description: "Test-only second subject used to prove cross-subject isolation.",
    longDescription: "Test-only second subject used to prove cross-subject isolation.",
    href: `/subjects/${SUBJECT_TWO_SLUG}`,
    topicCount: 1,
    progress: 0,
    questionsCompleted: 0,
    courseAreas: [
      {
        slug: "fixture-course",
        contentStatus: "active",
        name: "Fixture Course",
        description: "Test-only course area.",
        href: `/subjects/${SUBJECT_TWO_SLUG}/fixture-course`,
        available: true,
        progress: 0,
        questionsCompleted: 0,
        specificationStrands: [
          {
            id: SUBJECT_TWO_STRAND_ID,
            contentStatus: "active",
            name: "Fixture strand",
            description: "Test-only specification strand.",
            displayOrder: 1,
            href: `/subjects/${SUBJECT_TWO_SLUG}/fixture-course`,
          },
        ],
        specAreas: [
          {
            slug: "fixture-spec",
            contentStatus: "active",
            name: "Fixture Spec Area",
            description: "Test-only spec area.",
            href: `/subjects/${SUBJECT_TWO_SLUG}/fixture-course/fixture-spec`,
            progress: 0,
            completed: 0,
            questions: 3,
            isAvailable: true,
            skillPaths: [subjectTwoPath],
          },
        ],
      },
    ],
    learningStages: subjectTwoStages,
  };

  return {
    subjects: [subjectOne, subjectTwo],
    questions: [
      ...structuredClone(higherMathsDifferentiationQuestions),
      subjectTwoQuestion("fixture-st2-f-001", SUBJECT_TWO_FOUNDATIONS_STAGE_ID, "Foundations", 1),
      subjectTwoQuestion("fixture-st2-f-002", SUBJECT_TWO_FOUNDATIONS_STAGE_ID, "Foundations", 2),
      subjectTwoQuestion("fixture-st2-a-001", SUBJECT_TWO_APPLICATIONS_STAGE_ID, "Applications", 1),
    ],
  };
}

export const subjectTwoFixtureIds = {
  subjectSlug: SUBJECT_TWO_SLUG,
  path: SUBJECT_TWO_PATH_ID,
  foundationsStage: SUBJECT_TWO_FOUNDATIONS_STAGE_ID,
  applicationsStage: SUBJECT_TWO_APPLICATIONS_STAGE_ID,
  questions: ["fixture-st2-f-001", "fixture-st2-f-002", "fixture-st2-a-001"],
} as const;

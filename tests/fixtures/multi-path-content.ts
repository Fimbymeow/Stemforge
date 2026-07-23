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
} as const;

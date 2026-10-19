import type { GuidedSelfAssessmentEvent, ProgressEvidence, QuestionAttempt, QuestionSupportEvent } from "@/lib/progress/types";
import type { PracticeQuestionReference, PracticeSession } from "@/lib/practice/practice-types";
import { contentResolver } from "@/lib/content-resolver";

export const PRACTICE_COMPATIBILITY_NOW = new Date("2026-07-04T10:20:00.000Z");

const resolvedBasicPracticePath = contentResolver.getPathContext("basic-differentiation")?.skillPath;
if (!resolvedBasicPracticePath) throw new Error("Basic Differentiation compatibility fixture is unavailable.");
export const basicPracticePath = resolvedBasicPracticePath;

export const basicPracticeQuestionIds = contentResolver
  .getPracticeQuestions(basicPracticePath)
  .map((question) => question.id);

export function emptyCompatibilityEvidence(): ProgressEvidence {
  return {
    attempts: [],
    supportEvents: [],
    guidedSelfAssessments: [],
    achievementSnapshots: [],
    reviewEvents: [],
    flashcardReviews: [],
  };
}

export function compatibilityAttempt(
  questionId: string,
  sequence: number,
  isCorrect: boolean,
  overrides: Partial<QuestionAttempt> = {},
): QuestionAttempt {
  const context = contentResolver.getQuestionContext(questionId);
  if (!context) throw new Error(`Missing compatibility question ${questionId}.`);
  return {
    eventId: `practice_compat_attempt_${sequence}`,
    questionId,
    skillPathId: context.skillPath.slug,
    stageId: context.stage.id,
    isCorrect,
    answer: isCorrect ? "correct" : "incorrect",
    attemptedAt: new Date(Date.parse("2026-07-01T10:00:00.000Z") + sequence * 60_000).toISOString(),
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    outcomeKind: "graded",
    strategy: context.question.marking.strategy,
    strategyVersion: context.question.marking.strategyVersion,
    ...overrides,
  };
}

const partialQuestionIds = [
  basicPracticeQuestionIds[0],
  basicPracticeQuestionIds[3],
  basicPracticeQuestionIds[6],
];

const partialAttempts = partialQuestionIds.map((questionId, index) =>
  compatibilityAttempt(questionId, index * 2 + 1, true));
const partialSupportContext = contentResolver.getQuestionContext(partialQuestionIds[0]);
if (!partialSupportContext) throw new Error("Partial compatibility support fixture is unavailable.");
const partialSupport: QuestionSupportEvent = {
  eventId: "practice_compat_support_2",
  questionId: partialQuestionIds[0],
  skillPathId: partialSupportContext.skillPath.slug,
  stageId: partialSupportContext.stage.id,
  type: "hint_viewed",
  occurredAt: "2026-07-01T10:02:00.000Z",
  sequence: 2,
  afterGenuineAttempt: true,
  versionEvidence: { kind: "known", questionVersion: partialSupportContext.question.questionVersion },
};
const partialAssessment: GuidedSelfAssessmentEvent = {
  eventId: "practice_compat_assessment_7",
  practiceSessionId: "practice_compat_active",
  questionId: partialQuestionIds[2],
  skillPathId: partialSupportContext.skillPath.slug,
  stageId: contentResolver.getQuestionContext(partialQuestionIds[2])!.stage.id,
  outcome: "confident",
  occurredAt: "2026-07-01T10:07:00.000Z",
  sequence: 7,
  versionEvidence: {
    kind: "known",
    questionVersion: contentResolver.getQuestion(partialQuestionIds[2])!.questionVersion,
  },
};

const completedAttempts = basicPracticeQuestionIds.map((questionId, index) =>
  compatibilityAttempt(questionId, index + 1, true));

export const practiceCompatibilityEvidence = {
  fresh: emptyCompatibilityEvidence(),
  partial: {
    ...emptyCompatibilityEvidence(),
    attempts: partialAttempts,
    supportEvents: [partialSupport],
    guidedSelfAssessments: [partialAssessment],
  },
  completed: {
    ...emptyCompatibilityEvidence(),
    attempts: completedAttempts,
  },
  reviewDue: {
    ...emptyCompatibilityEvidence(),
    attempts: completedAttempts,
  },
  openMistake: {
    ...emptyCompatibilityEvidence(),
    attempts: [compatibilityAttempt(basicPracticeQuestionIds[0], 1, false)],
  },
} satisfies Record<string, ProgressEvidence>;

function reference(questionId: string): PracticeQuestionReference {
  const context = contentResolver.getQuestionContext(questionId);
  if (!context) throw new Error(`Missing compatibility session question ${questionId}.`);
  return {
    subjectId: context.subject.subjectSlug,
    courseId: context.courseArea.slug,
    pathId: context.skillPath.slug,
    stageId: context.stage.id,
    questionId,
    questionVersion: context.question.questionVersion,
    contentRevision: context.question.contentRevision,
  };
}

function sessionBase(questionReferences: PracticeQuestionReference[]): Omit<PracticeSession, "origin" | "mode"> {
  return {
    schemaVersion: 3,
    sessionId: "practice_compat_active",
    subjectId: "higher-maths",
    courseId: "calculus",
    selectedPathIds: [basicPracticePath.slug],
    questionReferences,
    currentQuestionIndex: 0,
    startedAt: "2026-07-02T10:00:00.000Z",
    updatedAt: "2026-07-02T10:05:00.000Z",
    completedAt: null,
    status: "active",
    timing: { type: "untimed" },
    selectionMetadata: {
      seed: "practice-compatibility",
      requestedCount: questionReferences.length,
      availableCount: questionReferences.length,
      selectedCount: questionReferences.length,
      fullySatisfied: true,
      shortageReason: null,
      excludedByReason: {},
      includedPathIds: [basicPracticePath.slug],
      createdAt: "2026-07-02T10:00:00.000Z",
    },
    skippedQuestionIds: [],
  };
}

const ordinaryReferences = basicPracticeQuestionIds.slice(0, 2).map(reference);
export const legacyStageBackedPracticeSession: PracticeSession = {
  ...sessionBase(ordinaryReferences),
  origin: "configured_practice",
  mode: "targeted",
};

const reviewReferences = basicPracticeQuestionIds.slice(0, 2).map(reference);
export const legacyStageBackedReviewSession: PracticeSession = {
  ...sessionBase(reviewReferences),
  sessionId: "review_session_practice_compat",
  origin: "scheduled_review",
  mode: "review",
  reviewTargets: [{
    target: { targetType: "skill", targetId: basicPracticePath.slug },
    questionIds: reviewReferences.map((item) => item.questionId),
  }],
};

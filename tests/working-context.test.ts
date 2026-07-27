import test from "node:test";
import assert from "node:assert/strict";
import { contentResolver } from "../lib/content-resolver";
import {
  deriveWorkingContextModel,
  formatReviewDueLabel,
  parseWorkingContextPathId,
  questionHelpNotesHref,
  workingContextPracticeHref,
} from "../lib/working-context";
import type { ProgressEvidence, QuestionAttempt } from "../lib/progress/types";

const pathId = "basic-differentiation";
const context = contentResolver.getPathContext(pathId)!;
const questionIds = context.skillPath.learningStages!.flatMap((stage) => stage.questionIds);

test("fresh state starts the first canonical question without writing a pointer", () => {
  const model = deriveWorkingContextModel({ pathId, evidence: emptyEvidence() })!;
  assert.equal(model.primaryLabel, "Start");
  assert.equal(model.primaryHref, `/question/${questionIds[0]}`);
  assert.equal(model.completed, 0);
  assert.equal(model.reviewHref, null);
});

test("real incomplete evidence resumes the exact current-version question", () => {
  const model = deriveWorkingContextModel({
    pathId,
    evidence: evidence([attempt(questionIds[1], 1, false)]),
  })!;
  assert.equal(model.primaryLabel, "Continue");
  assert.equal(model.primaryHref, `/question/${questionIds[1]}`);
  assert.match(model.nextActionReason, /last attempted/i);
});

test("stage completion advances deterministically and reports the real stage count", () => {
  const foundations = context.skillPath.learningStages![0];
  const model = deriveWorkingContextModel({
    pathId,
    evidence: evidence(foundations.questionIds.map((id, index) => attempt(id, index + 1, true))),
  })!;
  assert.equal(model.stageName, "Applications");
  assert.equal(model.primaryHref, `/question/${questionIds[3]}`);
  assert.equal(model.collapsedSummary, "Applications · 0/3");
});

test("completed content offers path-scoped practice", () => {
  const model = deriveWorkingContextModel({
    pathId,
    evidence: evidence(questionIds.map((id, index) => attempt(id, index + 1, true))),
  })!;
  assert.equal(model.isComplete, true);
  assert.equal(model.primaryLabel, "Practise this skill");
  assert.equal(model.primaryHref, "/practice?path=basic-differentiation");
});

test("review is shown only when existing evidence genuinely recommends it", () => {
  const attempts = questionIds.map((id, index) => attempt(id, index + 1, true, {
    hintViewedBeforeSubmission: index === 0,
  }));
  const model = deriveWorkingContextModel({ pathId, evidence: evidence(attempts) })!;
  assert.equal(model.reviewCount, 1);
  assert.equal(model.reviewHref, `/question/${questionIds[0]}`);
});

test("formatReviewDueLabel pluralises the noun, not the verb, and never touches other counts", () => {
  assert.equal(formatReviewDueLabel(1), "Review 1 question due");
  assert.equal(formatReviewDueLabel(2), "Review 2 questions due");
  assert.equal(formatReviewDueLabel(0), "Review 0 questions due");
});

test("completed skill with one genuine review due prioritises reviewing it over generic practice", () => {
  const attempts = questionIds.map((id, index) => attempt(id, index + 1, true, {
    hintViewedBeforeSubmission: index === 0,
  }));
  const model = deriveWorkingContextModel({ pathId, evidence: evidence(attempts) })!;
  assert.equal(model.isComplete, true);
  assert.equal(model.primaryLabel, "Review due question");
  assert.equal(model.primaryHref, `/question/${questionIds[0]}`);
});

test("completed skill with multiple genuine reviews due pluralises the primary action honestly", () => {
  const attempts = questionIds.map((id, index) => attempt(id, index + 1, true, {
    hintViewedBeforeSubmission: index === 0 || index === 1,
  }));
  const model = deriveWorkingContextModel({ pathId, evidence: evidence(attempts) })!;
  assert.equal(model.reviewCount, 2);
  assert.equal(model.primaryLabel, "Review 2 due questions");
  assert.equal(model.primaryHref, `/question/${questionIds[0]}`);
});

test("stage models expose reviewDue only for the specific stage a genuine review question belongs to", () => {
  const foundations = context.skillPath.learningStages![0];
  const attempts = questionIds.map((id, index) => attempt(id, index + 1, true, {
    hintViewedBeforeSubmission: index === 0,
  }));
  const model = deriveWorkingContextModel({ pathId, evidence: evidence(attempts) })!;
  const foundationsStage = model.stages.find((stage) => stage.id === foundations.id)!;
  const otherStages = model.stages.filter((stage) => stage.id !== foundations.id);
  assert.equal(foundationsStage.reviewDue, true);
  assert.ok(otherStages.every((stage) => stage.reviewDue === false));
});

test("path parsing accepts only an available canonical path", () => {
  assert.equal(parseWorkingContextPathId(pathId), pathId);
  assert.equal(parseWorkingContextPathId(["not-real", pathId]), null);
  assert.equal(parseWorkingContextPathId("chain-rule"), null);
});

test("production helpers contain path and question context without activation flags", () => {
  assert.equal(workingContextPracticeHref(pathId), "/practice?path=basic-differentiation");
  const href = questionHelpNotesHref({
    subjectSlug: "higher-maths",
    questionId: questionIds[0],
    questionNumber: 1,
    noteId: "power-rule",
    token: "safe-token",
  });
  assert.match(href, /^\/subjects\/higher-maths\/revision-notes\?/);
  assert.match(href, /fromQuestion=/);
  assert.doesNotMatch(href, /workingContext|review=true/);
});

function emptyEvidence(): ProgressEvidence {
  return { attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [] };
}

function evidence(attempts: QuestionAttempt[]): ProgressEvidence {
  return { attempts, supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [] };
}

function attempt(questionId: string, sequence: number, isCorrect: boolean, overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  const questionContext = contentResolver.getQuestionContext(questionId)!;
  return {
    questionId,
    skillPathId: questionContext.skillPath.slug,
    stageId: questionContext.stage.id,
    isCorrect,
    answer: isCorrect ? "correct" : "wrong",
    attemptedAt: `2026-07-24T10:${String(sequence).padStart(2, "0")}:00.000Z`,
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: questionContext.question.questionVersion },
    eventId: `working_context_${sequence}`,
    ...overrides,
  };
}

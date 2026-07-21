import test from "node:test";
import assert from "node:assert/strict";
import { canonicalContent } from "../data/canonical-content";
import { createContentResolver } from "../lib/content-resolver";
import { deriveLearnerNextAction, derivePracticeSummaryNextAction } from "../lib/learning/next-action";
import type { PracticeSession } from "../lib/practice/practice-types";
import type { ProgressEvidence, QuestionAttempt, QuestionSupportEvent } from "../lib/progress/types";

const resolver = createContentResolver(canonicalContent);
const path = resolver.getPathContext("basic-differentiation")!.skillPath;
const questionIds = (path.learningStages ?? []).flatMap((stage) => stage.questionIds);

test("new learner starts the first valid available question without inferring review", () => {
  const action = deriveLearnerNextAction({ evidence: emptyEvidence() });
  assert.equal(action.kind, "start_learning");
  assert.equal(action.questionId, questionIds[0]);
  assert.equal(action.href, `/question/${questionIds[0]}`);
  assert.equal(action.label, "Start learning");
});

test("a current-version incomplete attempt resumes before unrelated practice", () => {
  const action = deriveLearnerNextAction({ evidence: evidence([attempt(questionIds[1], 1, false)]) });
  assert.equal(action.kind, "resume_question");
  assert.equal(action.questionId, questionIds[1]);
  assert.equal(action.label, "Resume question");
});

test("a recorded hint without an answer resumes the exact unfinished question", () => {
  const action = deriveLearnerNextAction({ evidence: evidence([], [support(questionIds[2], 1)]) });
  assert.equal(action.kind, "resume_question");
  assert.equal(action.questionId, questionIds[2]);
  assert.match(action.reason, /hint/i);
});

test("worked-solution completion continues guided work before later review", () => {
  const action = deriveLearnerNextAction({
    evidence: evidence(
      [attempt(questionIds[0], 1, false)],
      [support(questionIds[0], 2, { type: "solution_viewed", afterGenuineAttempt: true })],
    ),
  });
  assert.equal(action.kind, "continue_question");
  assert.equal(action.questionId, questionIds[1]);
});

test("the next incomplete question is selected deterministically", () => {
  const progress = evidence([attempt(questionIds[0], 1, true)]);
  const first = deriveLearnerNextAction({ evidence: progress });
  const second = deriveLearnerNextAction({ evidence: structuredClone(progress) });
  assert.equal(first.kind, "continue_question");
  assert.equal(first.questionId, questionIds[1]);
  assert.deepEqual(second, first);
});

test("completing a stage begins the next stage while keeping it directly available", () => {
  const foundations = path.learningStages![0];
  const action = deriveLearnerNextAction({
    evidence: evidence(foundations.questionIds.map((id, index) => attempt(id, index + 1, true))),
  });
  assert.equal(action.kind, "start_stage");
  assert.equal(action.stageId, path.learningStages![1].id);
  assert.equal(action.questionId, path.learningStages![1].questionIds[0]);
  assert.equal(action.label, "Begin Applications");
});

test("completed guided content recommends genuine review before practice", () => {
  const attempts = questionIds.map((id, index) => attempt(id, index + 1, true, { hintViewedBeforeSubmission: index === 0 }));
  const action = deriveLearnerNextAction({ evidence: evidence(attempts) });
  assert.equal(action.kind, "review_question");
  assert.equal(action.questionId, questionIds[0]);
  assert.match(action.label, /^Review 1 question$/);
});

test("completed content with no review due recommends existing practice and never locked inventory", () => {
  const action = deriveLearnerNextAction({
    evidence: evidence(questionIds.map((id, index) => attempt(id, index + 1, true))),
  });
  assert.equal(action.kind, "practice_again");
  assert.equal(action.href, "/practice");
  assert.equal(action.pathId, "basic-differentiation");
});

test("older pinned evidence is not treated as current completion", () => {
  const source = structuredClone(canonicalContent);
  const changed = source.questions.find((question) => question.id === questionIds[0])!;
  changed.questionVersion = 2;
  changed.contentRevision += 1;
  const action = deriveLearnerNextAction({
    source,
    evidence: evidence([attempt(questionIds[0], 1, true)]),
  });
  assert.equal(action.kind, "review_question");
  assert.equal(action.questionId, questionIds[0]);
  assert.equal(action.questionVersion, 2);
});

test("a valid pinned active practice session is resumed and an unavailable pin fails safely", () => {
  const session = activeSession();
  const resumed = deriveLearnerNextAction({ evidence: emptyEvidence(), activePracticeSession: session });
  assert.equal(resumed.kind, "resume_practice");
  assert.equal(resumed.href, `/practice/session/${session.sessionId}`);

  const stale = structuredClone(session);
  stale.questionReferences[0].questionVersion += 1;
  const fallback = deriveLearnerNextAction({ evidence: emptyEvidence(), activePracticeSession: stale });
  assert.equal(fallback.kind, "start_learning");
});

test("exact-session failures produce a retry action without creating evidence", () => {
  const completed = { ...activeSession(), status: "completed" as const, completedAt: "2026-07-20T10:10:00.000Z" };
  const progress = emptyEvidence();
  const action = derivePracticeSummaryNextAction({
    evidence: progress,
    completedSession: completed,
    incorrectQuestionIds: [completed.questionReferences[0].questionId],
  });
  assert.equal(action.kind, "retry_session");
  assert.equal(action.practiceSessionId, completed.sessionId);
  assert.deepEqual(progress, emptyEvidence());
});

test("empty and invalid catalogue conditions return an explicit unavailable result", () => {
  const action = deriveLearnerNextAction({ evidence: emptyEvidence(), source: { subjects: [], questions: [] } });
  assert.equal(action.kind, "none");
  assert.equal(action.href, null);

  const missingRoute = deriveLearnerNextAction({
    evidence: evidence([attempt("removed-question", 1, false, { skillPathId: "removed-path", stageId: "removed-stage" })]),
  });
  assert.equal(missingRoute.kind, "start_learning");
});

function emptyEvidence(): ProgressEvidence {
  return { attempts: [], supportEvents: [], achievementSnapshots: [] };
}

function evidence(attempts: QuestionAttempt[] = [], supportEvents: QuestionSupportEvent[] = []): ProgressEvidence {
  return { attempts, supportEvents, achievementSnapshots: [] };
}

function attempt(
  questionId: string,
  sequence: number,
  isCorrect: boolean,
  overrides: Partial<QuestionAttempt> = {},
): QuestionAttempt {
  const context = resolver.getQuestionContext(questionId);
  return {
    questionId,
    skillPathId: context?.skillPath.slug ?? "basic-differentiation",
    stageId: context?.stage.id ?? "basic-diff-stage-foundations",
    isCorrect,
    answer: isCorrect ? "correct" : "wrong",
    attemptedAt: `2026-07-20T10:${String(sequence).padStart(2, "0")}:00.000Z`,
    sequence,
    isGenuine: true,
    hintViewedBeforeSubmission: false,
    supportKnowledge: "known",
    versionEvidence: { kind: "known", questionVersion: 1 },
    eventId: `next_action_attempt_${sequence}`,
    ...overrides,
  };
}

function support(questionId: string, sequence: number, overrides: Partial<QuestionSupportEvent> = {}): QuestionSupportEvent {
  const context = resolver.getQuestionContext(questionId)!;
  return {
    questionId,
    skillPathId: context.skillPath.slug,
    stageId: context.stage.id,
    type: "hint_viewed",
    occurredAt: `2026-07-20T10:${String(sequence).padStart(2, "0")}:30.000Z`,
    sequence,
    afterGenuineAttempt: false,
    versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
    eventId: `next_action_support_${sequence}`,
    ...overrides,
  };
}

function activeSession(): PracticeSession {
  const context = resolver.getQuestionContext(questionIds[0])!;
  return {
    schemaVersion: 1,
    sessionId: "next-action-active-session",
    mode: "targeted",
    courseId: context.courseArea.slug,
    selectedPathIds: [context.skillPath.slug],
    questionReferences: [{
      subjectId: context.subject.subjectSlug,
      courseId: context.courseArea.slug,
      pathId: context.skillPath.slug,
      stageId: context.stage.id,
      questionId: context.question.id,
      questionVersion: context.question.questionVersion,
      contentRevision: context.question.contentRevision,
    }],
    currentQuestionIndex: 0,
    startedAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
    completedAt: null,
    status: "active",
    timing: { type: "untimed" },
    selectionMetadata: {
      seed: "next-action",
      requestedCount: 1,
      availableCount: 1,
      selectedCount: 1,
      fullySatisfied: true,
      shortageReason: null,
      excludedByReason: {},
      includedPathIds: [context.skillPath.slug],
      createdAt: "2026-07-20T10:00:00.000Z",
    },
  };
}

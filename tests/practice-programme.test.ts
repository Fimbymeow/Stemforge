import assert from "node:assert/strict";
import test from "node:test";
import { createTwoPathFixture, fixtureIds } from "./fixtures/multi-path-content";
import { evidence, attempt, supportEvent } from "./progress-fixtures";
import {
  replaceActivePracticeSession,
  requestPracticeSessionActivation,
  resumeActivePracticeSession,
} from "../lib/practice/practice-activation";
import { practiceOriginLabel, practiceReturnDestination } from "../lib/practice/practice-destinations";
import { derivePracticeQuestionStatuses } from "../lib/practice/practice-question-status";
import { completePracticeSession, setPracticeQuestionSkipped } from "../lib/practice/practice-session-actions";
import { createCompletedSkippedRetry, createPracticeSessionSelection } from "../lib/practice/practice-selection";
import { loadPracticeSessionStore, savePracticeSessionStore } from "../lib/practice/practice-storage";
import type { PracticeSession, PracticeSessionOrigin } from "../lib/practice/practice-types";
import type { GuidedSelfAssessmentEvent, ProgressEvidence } from "../lib/progress/types";
import {
  getProgressEvidence,
  recordGuidedSelfAssessment,
  recordHintViewed,
  saveQuestionAttempt,
} from "../lib/local-progress";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  throwOnWrite = false;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.throwOnWrite) throw new Error("write blocked");
    this.values.set(key, value);
  }
}

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
let browserStorage: MemoryStorage;
test.before(() => {
  browserStorage = new MemoryStorage();
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { locks: { request: async (_name: string, _options: unknown, operation: () => unknown) => operation() } },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: browserStorage, dispatchEvent: () => true },
  });
});
test.after(() => {
  if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
  else Reflect.deleteProperty(globalThis, "navigator");
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

test("central activation resolves empty, conflict, resume, replace and repaired multi-active stores", async () => {
  const storage = new MemoryStorage();
  const first = session("first", "quick_practice");
  const second = session("second", "configured_practice", new Date("2026-07-27T10:01:00.000Z"));
  assert.equal((await requestPracticeSessionActivation(first, storage)).status, "activated");
  const conflict = await requestPracticeSessionActivation(second, storage);
  assert.equal(conflict.status, "conflict");
  assert.equal(loadPracticeSessionStore(storage).store.sessions.some((item) => item.sessionId === second.sessionId), false);
  assert.equal((await resumeActivePracticeSession(first.sessionId, storage)).status, "resumed");
  assert.equal((await replaceActivePracticeSession(second, first.sessionId, storage)).status, "activated");
  const replaced = loadPracticeSessionStore(storage).store;
  assert.equal(replaced.sessions.filter((item) => item.status === "active").length, 1);
  assert.equal(replaced.sessions.find((item) => item.sessionId === first.sessionId)?.status, "abandoned");

  const third = session("third", "question_bank_custom", new Date("2026-07-27T10:02:00.000Z"));
  const fourth = session("fourth", "subject_review", new Date("2026-07-27T10:03:00.000Z"));
  storage.setItem("stemforge.practiceSessions.v1", JSON.stringify({
    schemaVersion: 3,
    activeSessionId: null,
    sessions: [third, fourth],
  }));
  const repairedConflict = await requestPracticeSessionActivation(session("candidate", "quick_practice"), storage);
  assert.equal(repairedConflict.status, "conflict");
  const repaired = loadPracticeSessionStore(storage).store;
  assert.equal(repaired.sessions.filter((item) => item.status === "active").length, 1);
  assert.equal(repaired.activeSessionId, fourth.sessionId);
});

test("unresolvable active sessions require explicit replacement and changed pointers fail closed", async () => {
  const storage = new MemoryStorage();
  const stale = session("stale", "working_context_practice");
  stale.questionReferences[0].questionId = "removed-question";
  savePracticeSessionStore({ schemaVersion: 3, activeSessionId: stale.sessionId, sessions: [stale] }, storage);
  const candidate = session("next", "quick_practice");
  const conflict = await requestPracticeSessionActivation(candidate, storage);
  assert.equal(conflict.status, "conflict");
  assert.equal(conflict.status === "conflict" && conflict.resolvable, false);
  const concurrent = session("concurrent", "configured_practice");
  savePracticeSessionStore({ schemaVersion: 3, activeSessionId: concurrent.sessionId, sessions: [concurrent] }, storage);
  const result = await replaceActivePracticeSession(candidate, stale.sessionId, storage);
  assert.equal(result.status, "conflict");
  assert.equal(loadPracticeSessionStore(storage).store.activeSessionId, concurrent.sessionId);
});

test("session actions make Skip reversible and completion frozen, idempotent and write-safe", async () => {
  const storage = new MemoryStorage();
  const active = session("actions", "quick_practice");
  savePracticeSessionStore({ schemaVersion: 3, activeSessionId: active.sessionId, sessions: [active] }, storage);
  const questionId = active.questionReferences[0].questionId;
  assert.equal((await setPracticeQuestionSkipped(active.sessionId, questionId, true, storage)).status, "updated");
  assert.deepEqual(loadPracticeSessionStore(storage).store.sessions[0].skippedQuestionIds, [questionId]);
  assert.equal((await setPracticeQuestionSkipped(active.sessionId, questionId, false, storage)).status, "updated");
  await setPracticeQuestionSkipped(active.sessionId, questionId, true, storage);
  const completed = await completePracticeSession(active.sessionId, null, storage);
  assert.equal(completed.status, "updated");
  assert.deepEqual(completed.status === "updated" && completed.session.finalSkippedQuestionIds, [questionId]);
  assert.equal((await completePracticeSession(active.sessionId, null, storage)).status, "already_completed");
  assert.equal((await setPracticeQuestionSkipped(active.sessionId, questionId, false, storage)).status, "not_active");
  const retry = createCompletedSkippedRetry(completed.status === "updated" ? completed.session : active);
  assert.equal(retry?.origin, "retry_skipped");
  assert.equal(retry?.parentSessionId, active.sessionId);

  const failing = new MemoryStorage();
  savePracticeSessionStore({ schemaVersion: 3, activeSessionId: active.sessionId, sessions: [active] }, failing);
  failing.throwOnWrite = true;
  assert.equal((await completePracticeSession(active.sessionId, null, failing)).status, "write_failed");
});

test("canonical statuses prefer exact session IDs, use legacy time only when absent and keep guided outcomes separate", () => {
  const source = createTwoPathFixture();
  const active = session("status", "configured_practice");
  const reference = active.questionReferences[0];
  const guidedSource = {
    ...source,
    questions: source.questions.map((question) =>
      question.id === reference.questionId ? { ...question, answerType: "written" as const } : question),
  };
  const exact = attempt({
    eventId: "exact",
    questionId: reference.questionId,
    skillPathId: reference.pathId,
    stageId: reference.stageId,
    isCorrect: null,
    practiceSessionId: active.sessionId,
  });
  const other = attempt({
    eventId: "other-session",
    questionId: reference.questionId,
    skillPathId: reference.pathId,
    stageId: reference.stageId,
    isCorrect: true,
    practiceSessionId: "another-session",
    sequence: 2,
  });
  const assessment = selfAssessment(active, reference.questionId, reference.pathId, reference.stageId, "unsure");
  const progress: ProgressEvidence = evidence([exact, other], [
    supportEvent({
      questionId: reference.questionId,
      skillPathId: reference.pathId,
      stageId: reference.stageId,
      practiceSessionId: active.sessionId,
    }),
  ]);
  progress.guidedSelfAssessments.push(assessment);
  const status = derivePracticeQuestionStatuses(active, progress, guidedSource)[0];
  assert.equal(status.attemptCount, 1);
  assert.equal(status.primary, "complete");
  assert.equal(status.selfAssessment, "unsure");
  assert.equal(status.worthRevisit, true);

  const legacy = evidence([attempt({
    eventId: "legacy",
    questionId: reference.questionId,
    skillPathId: reference.pathId,
    stageId: reference.stageId,
    isCorrect: true,
    attemptedAt: "2026-07-27T10:00:30.000Z",
  })]);
  assert.equal(derivePracticeQuestionStatuses(active, legacy, source)[0].primary, "complete");
});

test("all origins remain distinct and destinations are subject generic", () => {
  const origins: PracticeSessionOrigin[] = [
    "question_bank_custom", "subject_review", "quick_practice", "configured_practice",
    "working_context_practice", "retry_incorrect", "retry_skipped", "scheduled_review",
  ];
  assert.deepEqual(origins.map(practiceOriginLabel), [
    "Custom practice", "Review practice", "Quick Practice", "Configured practice",
    "Current Path practice", "Retry incorrect", "Retry skipped", "Review",
  ]);
  assert.deepEqual(practiceReturnDestination({ origin: "subject_review", subjectId: "another-subject" }), {
    href: "/subjects/another-subject/question-bank",
    label: "Question Bank",
  });
  assert.deepEqual(practiceReturnDestination({ origin: "scheduled_review", subjectId: "higher-maths" }), {
    href: "/practice?review=1",
    label: "Review",
  });
  assert.deepEqual(practiceReturnDestination({
    origin: "scheduled_review",
    subjectId: "higher-maths",
    selectedPathIds: ["chain-rule"],
  }), {
    href: "/practice?review=1&path=chain-rule",
    label: "Review",
  });
});

test("new session evidence carries exact identity while standalone evidence omits it", async () => {
  browserStorage.clear();
  const base = {
    questionId: "hm-calc-diff-basic-f-001",
    skillPathId: "basic-differentiation",
    stageId: "basic-diff-stage-foundations",
    isCorrect: false,
    answer: "wrong",
    attemptedAt: "2026-07-27T11:00:00.000Z",
    outcomeKind: "graded" as const,
    outcomeReason: "value_wrong" as const,
    strategy: "polynomial_form" as const,
    strategyVersion: 1,
  };
  assert.equal(await saveQuestionAttempt(base), true);
  assert.equal(await saveQuestionAttempt({ ...base, practiceSessionId: "session-evidence", attemptedAt: "2026-07-27T11:01:00.000Z" }), true);
  assert.equal(await recordHintViewed({
    questionId: base.questionId,
    skillPathId: base.skillPathId,
    stageId: base.stageId,
    attemptedAt: "2026-07-27T11:02:00.000Z",
    practiceSessionId: "session-evidence",
  }), true);
  for (const outcome of ["confident", "unsure", "needs_review"] as const) {
    assert.equal(await recordGuidedSelfAssessment({
      practiceSessionId: "session-evidence",
      questionId: base.questionId,
      skillPathId: base.skillPathId,
      stageId: base.stageId,
      outcome,
      occurredAt: `2026-07-27T11:0${3 + ["confident", "unsure", "needs_review"].indexOf(outcome)}:00.000Z`,
    }), true);
  }
  const progress = getProgressEvidence();
  assert.equal(Object.hasOwn(progress.attempts[0], "practiceSessionId"), false);
  assert.equal(progress.attempts[1].practiceSessionId, "session-evidence");
  assert.equal(progress.supportEvents[0].practiceSessionId, "session-evidence");
  assert.deepEqual(progress.guidedSelfAssessments.map((item) => item.outcome), ["confident", "unsure", "needs_review"]);
});

function session(seed: string, origin: PracticeSessionOrigin, now = new Date("2026-07-27T10:00:00.000Z")) {
  return createPracticeSessionSelection({
    origin,
    mode: origin === "retry_incorrect" || origin === "retry_skipped" ? "retry_incorrect" : "targeted",
    courseId: "calculus",
    selectedPathIds: [fixtureIds.path],
    requestedCount: 2,
    seed,
    evidence: evidence(),
    source: createTwoPathFixture(),
    now,
  }).session!;
}

function selfAssessment(
  sessionValue: PracticeSession,
  questionId: string,
  skillPathId: string,
  stageId: string,
  outcome: GuidedSelfAssessmentEvent["outcome"],
): GuidedSelfAssessmentEvent {
  return {
    eventId: `self-${outcome}`,
    practiceSessionId: sessionValue.sessionId,
    questionId,
    skillPathId,
    stageId,
    outcome,
    occurredAt: "2026-07-27T10:00:45.000Z",
    sequence: 3,
    versionEvidence: { kind: "known", questionVersion: 1 },
  };
}

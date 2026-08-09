import assert from "node:assert/strict";
import test from "node:test";
import { contentResolver } from "../lib/content-resolver";
import { createDefaultProgressPayload, migrateProgressPayload } from "../lib/progress/payload";
import { ProgressRepository } from "../lib/progress/repository";
import { LocalStorageProgressStorage, PROGRESS_STORAGE_KEY } from "../lib/progress/storage";
import type { ProgressEvidence, ProgressPayload, QuestionAttempt } from "../lib/progress/types";
import { decodePracticeSessionStore } from "../lib/practice/practice-migration";
import { createPracticeSessionSelection } from "../lib/practice/practice-selection";
import type { PracticeSession } from "../lib/practice/practice-types";
import { isPracticeSession } from "../lib/practice/practice-validation";
import { recordResolvedReviewTargets } from "../lib/review/emission";
import { deriveSubjectReviewSummary } from "../lib/review/derivation";
import { createReviewEventId } from "../lib/review/identity";
import { createReviewSessionSelection } from "../lib/review/selection";
import { isReviewEvent } from "../lib/review/validation";
import { attempt, evidence } from "./progress-fixtures";

const path = contentResolver.getPathContext("basic-differentiation")!.skillPath;
const questionIds = (path.learningStages ?? []).flatMap((stage) => stage.questionIds);
const chainPath = contentResolver.getPathContext("chain-rule")!.skillPath;

test("Practice Session V2 migrates conservatively to V3 without inventing Review metadata", () => {
  const current = createPracticeSessionSelection({
    mode: "targeted",
    courseId: "calculus",
    selectedPathIds: [path.slug],
    requestedCount: 2,
    seed: "review-v2-migration",
    evidence: evidence(),
    now: new Date("2026-07-20T10:00:00.000Z"),
  }).session!;
  const { reviewTargets: _reviewTargets, ...withoutReview } = current;
  const versionTwo = { ...withoutReview, schemaVersion: 2 as const };
  const decoded = decodePracticeSessionStore({
    schemaVersion: 2,
    activeSessionId: versionTwo.sessionId,
    sessions: [versionTwo],
  });
  assert(decoded);
  assert.equal(decoded.store.schemaVersion, 3);
  assert.equal(decoded.store.sessions[0].schemaVersion, 3);
  assert.equal(decoded.store.sessions[0].reviewTargets, undefined);
  assert.equal(isPracticeSession(decoded.store.sessions[0]), true);
});

test("Review selector creates a bounded, frozen V3 Practice Session only when learning is due", () => {
  assert.equal(createReviewSessionSelection({ evidence: evidence(), now: new Date("2026-07-20T10:00:00.000Z") }).session, null);
  const completed = completedEvidence("2026-07-01T10:00:00.000Z");
  const result = createReviewSessionSelection({
    evidence: completed,
    requestedCount: 50,
    targetPathId: path.slug,
    now: new Date("2026-07-20T10:00:00.000Z"),
  });
  assert(result.session);
  assert.equal(result.session.schemaVersion, 3);
  assert.equal(result.session.mode, "review");
  assert.equal(result.session.origin, "scheduled_review");
  assert.equal(result.session.questionReferences.length <= 12, true);
  assert.equal(result.session.reviewTargets?.length, 1);
  assert.deepEqual(result.session.reviewTargets?.[0].questionIds, result.session.questionReferences.map((item) => item.questionId));
  assert.equal(isPracticeSession(result.session), true);

  const repeated = createReviewSessionSelection({
    evidence: completed,
    requestedCount: 50,
    targetPathId: path.slug,
    now: new Date("2026-07-20T10:00:00.000Z"),
  });
  assert.deepEqual(
    repeated.session?.questionReferences.map((item) => item.questionId),
    result.session.questionReferences.map((item) => item.questionId),
  );
});

test("Higher Maths Review summary reports Basic Differentiation-only, Chain Rule-only and both-skill due states", () => {
  const now = new Date("2026-07-20T10:00:00.000Z");
  const basic = completedPathEvidence(path, "2026-07-01T10:00:00.000Z");
  const chain = completedPathEvidence(chainPath, "2026-07-02T10:00:00.000Z", 100);
  assert.deepEqual(deriveSubjectReviewSummary("higher-maths", basic, now).dueSkillNames, ["Basic differentiation"]);
  assert.deepEqual(deriveSubjectReviewSummary("higher-maths", chain, now).dueSkillNames, ["Chain rule"]);
  const both = combineEvidence(basic, chain);
  const summary = deriveSubjectReviewSummary("higher-maths", both, now);
  assert.equal(summary.dueSkillCount, 2);
  assert.deepEqual(new Set(summary.dueSkillNames), new Set(["Basic differentiation", "Chain rule"]));
  assert.equal(summary.href, "/practice?review=1");
});

test("a combined scheduled Review queue contains both live skills", () => {
  const evidence = combineEvidence(
    completedPathEvidence(path, "2026-07-01T10:00:00.000Z"),
    completedPathEvidence(chainPath, "2026-07-02T10:00:00.000Z", 100),
  );
  const result = createReviewSessionSelection({
    evidence,
    requestedCount: 6,
    now: new Date("2026-07-20T10:00:00.000Z"),
  });
  assert(result.session);
  assert.equal(result.selectedTargetCount, 2);
  assert.deepEqual(new Set(result.session.selectedPathIds), new Set([path.slug, chainPath.slug]));
  assert.deepEqual(
    new Set(result.session.questionReferences.map((reference) => reference.pathId)),
    new Set([path.slug, chainPath.slug]),
  );
});

test("completing one skill's scheduled Review leaves the other skill due", () => {
  const now = new Date("2026-07-20T10:00:00.000Z");
  const combined = combineEvidence(
    completedPathEvidence(path, "2026-07-01T10:00:00.000Z"),
    completedPathEvidence(chainPath, "2026-07-02T10:00:00.000Z", 100),
  );
  combined.reviewEvents.push({
    eventId: "review_basic_completed_only",
    source: { sourceType: "practice_session", sourceId: "review_session_basic_completed_only" },
    target: { targetType: "skill", targetId: path.slug },
    targetVersion: { versionType: "skill_path", version: path.pathVersion },
    outcome: "independent_success",
    occurredAt: now.toISOString(),
    sequence: 500,
    priorEventId: null,
    schedulerVersion: 1,
    stageAfter: 0,
    evidenceRefs: [],
    questionIds: [questionIds[0]],
  });
  const summary = deriveSubjectReviewSummary("higher-maths", combined, now);
  assert.equal(summary.dueSkillCount, 1);
  assert.deepEqual(summary.dueSkillNames, ["Chain rule"]);
});

test("Review selector prioritises current-version reassessment and never fills with first-time content", () => {
  const completed = completedEvidence("2026-07-01T10:00:00.000Z");
  const changedQuestionId = questionIds.find((questionId) =>
    contentResolver.getQuestion(questionId)!.questionVersion > 1)!;
  const withoutCurrent = {
    ...completed,
    attempts: completed.attempts.map((item) => item.questionId === changedQuestionId
      ? { ...item, versionEvidence: { kind: "known" as const, questionVersion: item.versionEvidence.kind === "known" ? item.versionEvidence.questionVersion - 1 : 1 } }
      : item),
    achievementSnapshots: [{
      snapshotId: "snapshot_historical_path",
      kind: "path_completed" as const,
      subjectId: "higher-maths",
      courseId: "calculus",
      pathId: path.slug,
      pathVersion: path.pathVersion,
      achievedAt: "2026-07-01T10:10:00.000Z",
      masteryScore: 80,
      independentPerformancePercentage: 75,
      completionCount: questionIds.length,
      totalRequiredCount: questionIds.length,
      source: "derived_current" as const,
    }],
  };
  const result = createReviewSessionSelection({
    evidence: withoutCurrent,
    requestedCount: 1,
    targetPathId: path.slug,
    now: new Date("2026-07-20T10:00:00.000Z"),
  });
  assert.equal(result.session?.questionReferences[0].questionId, changedQuestionId);

  const onlySnapshot: ProgressEvidence = {
    attempts: [],
    supportEvents: [],
    guidedSelfAssessments: [],
    achievementSnapshots: withoutCurrent.achievementSnapshots,
    reviewEvents: [],
    flashcardReviews: [],
  };
  assert.equal(createReviewSessionSelection({
    evidence: onlySnapshot,
    targetPathId: path.slug,
    now: new Date("2026-07-20T10:00:00.000Z"),
  }).session, null);
});

test("path-version Review never introduces a question the learner has not attempted", () => {
  const completed = completedEvidence("2026-07-01T10:00:00.000Z");
  const unlearnedQuestionId = questionIds.at(-1)!;
  const learnedAttempts = completed.attempts.filter((item) => item.questionId !== unlearnedQuestionId);
  const source: ProgressEvidence = {
    ...completed,
    attempts: learnedAttempts,
    achievementSnapshots: [{
      snapshotId: "snapshot_before_path_change",
      kind: "path_completed",
      subjectId: "higher-maths",
      courseId: "calculus",
      pathId: path.slug,
      pathVersion: path.pathVersion,
      achievedAt: "2026-07-01T10:10:00.000Z",
      masteryScore: 80,
      independentPerformancePercentage: 75,
      completionCount: questionIds.length,
      totalRequiredCount: questionIds.length,
      source: "derived_current",
    }],
    reviewEvents: [{
      ...payloadWithReview().data.reviewEvents[0],
      eventId: "review_before_path_change",
      source: { sourceType: "practice_session", sourceId: "review_session_before_path_change" },
      targetVersion: { versionType: "skill_path", version: path.pathVersion + 1 },
      occurredAt: "2026-07-02T10:00:00.000Z",
    }],
  };
  const result = createReviewSessionSelection({
    evidence: source,
    requestedCount: 12,
    targetPathId: path.slug,
    now: new Date("2026-07-20T10:00:00.000Z"),
  });
  assert(result.session);
  assert.equal(
    result.session.questionReferences.some((item) => item.questionId === unlearnedQuestionId),
    false,
  );
});

test("resolved target emission is durable, deterministic and idempotent across refresh retry", async (t) => {
  const session = dueSession();
  const assignment = session.reviewTargets![0];
  const questionId = assignment.questionIds[0];
  const browser = installBrowserStorage(t, payloadWithSessionAttempt(session, questionId));
  const first = await recordResolvedReviewTargets(session);
  assert.equal(first.status, "recorded");
  const stored = readPayload(browser);
  assert.equal(stored.data.reviewEvents.length, 1);
  const recorded = stored.data.reviewEvents[0];
  assert.equal(recorded.eventId, await createReviewEventId(recorded.source, recorded.target));
  assert.equal(isReviewEvent(recorded), true);
  const second = await recordResolvedReviewTargets(session);
  assert.equal(second.status, "already_recorded");
  assert.equal(readPayload(browser).data.reviewEvents.length, 1);
});

test("Review emission waits for resolution and cannot fabricate from ordinary or unrelated evidence", async (t) => {
  const session = dueSession();
  const assignment = session.reviewTargets![0];
  const questionId = assignment.questionIds[0];
  const ordinary = payloadWithSessionAttempt(session, questionId);
  ordinary.data.attempts[0].practiceSessionId = undefined;
  const browser = installBrowserStorage(t, ordinary);
  assert.equal((await recordResolvedReviewTargets(session)).status, "unresolved");
  assert.equal(readPayload(browser).data.reviewEvents.length, 0);
});

test("Review event write failure is reported honestly while underlying attempt remains durable", async (t) => {
  const session = dueSession();
  const assignment = session.reviewTargets![0];
  const questionId = assignment.questionIds[0];
  const browser = installBrowserStorage(t, payloadWithSessionAttempt(session, questionId));
  browser.failWrites = true;
  const result = await recordResolvedReviewTargets(session);
  assert.equal(result.status, "write_failed");
  browser.failWrites = false;
  const stored = readPayload(browser);
  assert.equal(stored.data.attempts.length, 1);
  assert.equal(stored.data.reviewEvents.length, 0);
  assert.equal((await recordResolvedReviewTargets(session)).status, "recorded");
});

test("local Review idempotency accepts an exact retry but rejects a conflicting same-ID payload", () => {
  const existing = payloadWithReview();
  const storage = installStandalonePayload(existing);
  const repository = new ProgressRepository(new LocalStorageProgressStorage(storage));
  const event = existing.data.reviewEvents[0];
  assert.equal(repository.recordReviewEvent(structuredClone(event)), true);
  assert.equal(repository.recordReviewEvent({
    ...event,
    outcome: "incorrect",
    stageAfter: "recovery",
  }), false);
  assert.deepEqual(repository.load().payload.data.reviewEvents, [event]);
});

test("unknown scheduler history fails closed instead of fabricating a baseline successor", async (t) => {
  const session = dueSession();
  const assignment = session.reviewTargets![0];
  const source = payloadWithSessionAttempt(session, assignment.questionIds[0]);
  source.data.reviewEvents.push({
    ...payloadWithReview().data.reviewEvents[0],
    eventId: "review_unknown_scheduler",
    source: { sourceType: "practice_session", sourceId: "older_review_session" },
    schedulerVersion: 99,
  });
  const browser = installBrowserStorage(t, source);
  assert.equal((await recordResolvedReviewTargets(session)).status, "write_failed");
  assert.deepEqual(readPayload(browser).data.reviewEvents.map((event) => event.eventId), ["review_unknown_scheduler"]);
});

test("V5 migrates to V7, malformed Review events repair individually, and older chains still reach V7", () => {
  const v5 = {
    version: 5,
    data: { attempts: [], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [] },
  };
  const migrated = migrateProgressPayload(v5);
  assert.equal(migrated.status, "migrated-v5");
  assert.equal(migrated.payload.version, 7);
  assert.deepEqual(migrated.payload.data.reviewEvents, []);
  for (const legacy of [
    [{ questionId: "q", skillPathId: "p", stageId: "s", isCorrect: true, answer: "1", attemptedAt: "2026-07-01T10:00:00.000Z" }],
    { version: 1, data: { attempts: [] } },
    { version: 2, data: { attempts: [], supportEvents: [] } },
    { version: 3, data: { attempts: [], supportEvents: [] } },
    { version: 4, data: { attempts: [], supportEvents: [], achievementSnapshots: [] } },
  ]) {
    assert.equal(migrateProgressPayload(legacy).payload.version, 7);
  }
  const valid = readPayload(installStandalonePayload(payloadWithReview())).data.reviewEvents[0];
  const repaired = migrateProgressPayload({
    ...payloadWithReview(),
    data: { ...payloadWithReview().data, reviewEvents: [valid, { ...valid, eventId: "" }] },
  });
  assert.equal(repaired.status, "current-repaired");
  assert.equal(repaired.droppedReviewEvents, 1);
  assert.deepEqual(repaired.payload.data.reviewEvents, [valid]);
});

function dueSession() {
  const result = createReviewSessionSelection({
    evidence: completedEvidence("2026-07-01T10:00:00.000Z"),
    requestedCount: 1,
    targetPathId: path.slug,
    now: new Date("2026-07-20T10:00:00.000Z"),
  });
  assert(result.session);
  return result.session;
}

function completedEvidence(start: string): ProgressEvidence {
  return completedPathEvidence(path, start);
}

function completedPathEvidence(skillPath: typeof path, start: string, sequenceOffset = 0): ProgressEvidence {
  const startTime = Date.parse(start);
  const ids = (skillPath.learningStages ?? []).flatMap((stage) => stage.questionIds);
  return evidence(ids.map((questionId, index) => {
    const context = contentResolver.getQuestionContext(questionId)!;
    return attempt({
      eventId: `attempt_review_complete_${skillPath.slug}_${index}`,
      questionId,
      skillPathId: skillPath.slug,
      stageId: context.stage.id,
      versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
      attemptedAt: new Date(startTime + index * 60_000).toISOString(),
      sequence: sequenceOffset + index + 1,
      isCorrect: true,
      answer: "correct",
      outcomeKind: "graded",
    });
  }));
}

function combineEvidence(...items: ProgressEvidence[]): ProgressEvidence {
  return {
    attempts: items.flatMap((item) => item.attempts),
    supportEvents: items.flatMap((item) => item.supportEvents),
    guidedSelfAssessments: items.flatMap((item) => item.guidedSelfAssessments),
    achievementSnapshots: items.flatMap((item) => item.achievementSnapshots),
    reviewEvents: items.flatMap((item) => item.reviewEvents),
    flashcardReviews: items.flatMap((item) => item.flashcardReviews),
  };
}

function payloadWithSessionAttempt(session: PracticeSession, questionId: string): ProgressPayload {
  const context = contentResolver.getQuestionContext(questionId)!;
  return {
    ...createDefaultProgressPayload(),
    data: {
      ...createDefaultProgressPayload().data,
      attempts: [attempt({
        eventId: "attempt_review_resolution",
        practiceSessionId: session.sessionId,
        questionId,
        skillPathId: context.skillPath.slug,
        stageId: context.stage.id,
        versionEvidence: { kind: "known", questionVersion: context.question.questionVersion },
        attemptedAt: new Date(Date.parse(session.startedAt) + 60_000).toISOString(),
        sequence: 1,
        isCorrect: true,
        answer: "correct",
      })],
    },
  };
}

function payloadWithReview(): ProgressPayload {
  const session = dueSession();
  const questionId = session.reviewTargets![0].questionIds[0];
  const payload = payloadWithSessionAttempt(session, questionId);
  return {
    ...payload,
    data: {
      ...payload.data,
      reviewEvents: [{
        eventId: "review_payload_valid",
        source: { sourceType: "practice_session", sourceId: session.sessionId },
        target: { targetType: "skill", targetId: path.slug },
        targetVersion: { versionType: "skill_path", version: path.pathVersion },
        outcome: "independent_success",
        occurredAt: payload.data.attempts[0].attemptedAt,
        sequence: 2,
        priorEventId: null,
        schedulerVersion: 1,
        stageAfter: 0,
        evidenceRefs: [{ evidenceKind: "attempt", eventId: payload.data.attempts[0].eventId }],
        questionIds: [questionId],
      }],
    },
  };
}

function installBrowserStorage(t: test.TestContext, payload: ProgressPayload) {
  const storage = installStandalonePayload(payload);
  const previousWindow = (globalThis as { window?: unknown }).window;
  const previousCustomEvent = (globalThis as { CustomEvent?: unknown }).CustomEvent;
  (globalThis as { window: unknown }).window = {
    localStorage: storage,
    dispatchEvent: () => true,
  };
  if (typeof CustomEvent === "undefined") {
    (globalThis as { CustomEvent: unknown }).CustomEvent = class {
      constructor(readonly type: string) {}
    };
  }
  t.after(() => {
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window: unknown }).window = previousWindow;
    if (previousCustomEvent === undefined) delete (globalThis as { CustomEvent?: unknown }).CustomEvent;
    else (globalThis as { CustomEvent: unknown }).CustomEvent = previousCustomEvent;
  });
  return storage;
}

function installStandalonePayload(payload: ProgressPayload) {
  const values = new Map([[PROGRESS_STORAGE_KEY, JSON.stringify(payload)]]);
  return {
    failWrites: false,
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) {
      if (this.failWrites) throw new Error("storage full");
      values.set(key, value);
    },
    removeItem(key: string) { values.delete(key); },
  };
}

function readPayload(storage: ReturnType<typeof installStandalonePayload>): ProgressPayload {
  return JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY) ?? "null") as ProgressPayload;
}

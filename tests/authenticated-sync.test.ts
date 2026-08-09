import assert from "node:assert/strict";
import test from "node:test";
import { attempt } from "./progress-fixtures";
import { isProgressSyncBrowserRequest, PROGRESS_SYNC_PRIVATE_HEADERS } from "../lib/progress/sync-http";
import { MAX_PROGRESS_SYNC_PULL_ITEMS } from "../lib/progress/sync-protocol";
import {
  pullEvidenceForTrustedOwner,
  pushEvidenceForTrustedOwner,
  resolveProgressSyncContext,
} from "../lib/remote-evidence/authenticated-sync";
import { createAccountFingerprint } from "../lib/remote-evidence/authenticated-import";
import type { AchievementSnapshot } from "../lib/progress/types";
import type { ReviewEvent } from "../lib/review/types";

const ownerId = "owner_12345678901234567890123456789012";
const fingerprint = createAccountFingerprint(ownerId);
const generation = "1";
const receivedAt = "2026-07-16T12:00:00.000Z";

test("sync browser boundary rejects cross-site requests and private responses are non-cacheable", () => {
  assert.equal(isProgressSyncBrowserRequest(new Headers({ "sec-fetch-site": "cross-site" }), "https://stemforge.app"), false);
  assert.equal(isProgressSyncBrowserRequest(new Headers({ origin: "https://evil.example" }), "https://stemforge.app"), false);
  assert.equal(isProgressSyncBrowserRequest(new Headers({ origin: "https://stemforge.app" }), "https://stemforge.app"), true);
  assert.equal(PROGRESS_SYNC_PRIVATE_HEADERS["Cache-Control"], "no-store, private");
});

test("sync context exposes only an opaque account fingerprint after trusted resolution", async () => {
  assert.deepEqual(await resolveProgressSyncContext(async () => ({ authenticated: false })), { authenticated: false });
  const result = await resolveProgressSyncContext(async () => ({ authenticated: true, ownerId }));
  assert.deepEqual(result, { authenticated: true, accountFingerprint: fingerprint, accountGeneration: generation, accountDataStatus: "active" });
  assert.equal(JSON.stringify(result).includes(ownerId), false);
});

test("sync push reuses durable trusted append classifications", async () => {
  const evidence = { version: 7 as const, data: { attempts: [attempt()], supportEvents: [], guidedSelfAssessments: [], achievementSnapshots: [], reviewEvents: [], flashcardReviews: [] } };
  const result = await pushEvidenceForTrustedOwner(evidence, async () => ({ authenticated: true, ownerId }), async (resolvedOwner) => {
    assert.equal(resolvedOwner, ownerId);
    return { accepted: [{ kind: "attempt", eventId: evidence.data.attempts[0].eventId, receiveCursor: "1", receivedAt }], duplicates: [], conflicts: [], rejected: [] };
  });
  assert.equal(result.authenticated, true);
  if (result.authenticated) assert.equal(result.response.accepted.length, 1);
});

test("pull rejects a cursor from another account before repository access", async () => {
  let read = false;
  const result = await pullEvidenceForTrustedOwner(`v2.${"B".repeat(43)}.${generation}.10`, generation, async () => ({ authenticated: true, ownerId }), async () => {
    read = true;
    return { records: [] };
  });
  assert.equal(result.authenticated, true);
  if (result.authenticated) assert.equal(result.invalidCursor, true);
  assert.equal(read, false);
});

test("pull is exclusive, bounded and returns a replay-safe account cursor", async () => {
  const records = Array.from({ length: MAX_PROGRESS_SYNC_PULL_ITEMS + 1 }, (_, index) => {
    const evidence = attempt({ eventId: `attempt_page_${index}` });
    return { kind: "attempt" as const, eventId: evidence.eventId, disposition: "accepted" as const, receiveCursor: String(index + 1), receivedAt, evidence };
  });
  const result = await pullEvidenceForTrustedOwner(null, generation, async () => ({ authenticated: true, ownerId }), async (_owner: string, after: string | undefined, limit: number) => {
    assert.equal(after, undefined);
    assert.equal(limit, MAX_PROGRESS_SYNC_PULL_ITEMS + 1);
    return { records };
  });
  assert.equal(result.authenticated, true);
  if (!result.authenticated || result.invalidCursor || result.generationRequired) return;
  assert.equal(result.response.events.length, MAX_PROGRESS_SYNC_PULL_ITEMS);
  assert.equal(result.response.hasMore, true);
  assert.equal(result.response.nextCursor, `v2.${fingerprint}.${generation}.200`);
});

test("pull includes canonical retained conflict evidence without internal hashes", async () => {
  const evidence = attempt({ eventId: "attempt_conflict_pull", answer: "different" });
  const result = await pullEvidenceForTrustedOwner(null, generation, async () => ({ authenticated: true, ownerId }), async () => ({ records: [{
    kind: "attempt", eventId: evidence.eventId, disposition: "conflict_retained", receiveCursor: "7", receivedAt, evidence,
  }] }));
  assert.equal(result.authenticated, true);
  if (!result.authenticated || result.invalidCursor || result.generationRequired) return;
  assert.equal(result.response.events[0].disposition, "conflict_retained");
  assert.equal(JSON.stringify(result.response).includes("payloadHash"), false);
});

test("pull validates both existing achievement snapshots and Review events", async () => {
  const achievement: AchievementSnapshot = {
    snapshotId: "snapshot_pull",
    kind: "path_completed",
    subjectId: "higher-maths",
    courseId: "calculus",
    pathId: "basic-differentiation",
    pathVersion: 1,
    achievedAt: receivedAt,
    masteryScore: 70,
    independentPerformancePercentage: 100,
    completionCount: 8,
    totalRequiredCount: 8,
    source: "derived_current",
  };
  const review: ReviewEvent = {
    eventId: "review_pull",
    source: { sourceType: "practice_session", sourceId: "review_session_pull" },
    target: { targetType: "skill", targetId: "basic-differentiation" },
    targetVersion: { versionType: "skill_path", version: 1 },
    outcome: "independent_success",
    occurredAt: receivedAt,
    sequence: 2,
    priorEventId: null,
    schedulerVersion: 1,
    stageAfter: 0,
    evidenceRefs: [],
    questionIds: ["hm-calc-diff-basic-f-001"],
  };
  const result = await pullEvidenceForTrustedOwner(null, generation, async () => ({ authenticated: true, ownerId }), async () => ({ records: [
    { kind: "achievement_snapshot", eventId: achievement.snapshotId, disposition: "accepted", receiveCursor: "8", receivedAt, evidence: achievement },
    { kind: "review_event", eventId: review.eventId, disposition: "accepted", receiveCursor: "9", receivedAt, evidence: review },
  ] }));
  assert.equal(result.authenticated, true);
  if (!result.authenticated || result.invalidCursor || result.generationRequired) return;
  assert.deepEqual(result.response.events.map((item) => item.kind), ["achievement_snapshot", "review_event"]);
});

test("unverified pull never invokes the repository", async () => {
  let read = false;
  const result = await pullEvidenceForTrustedOwner(null, generation, async () => ({ authenticated: false }), async () => {
    read = true;
    return { records: [] };
  });
  assert.deepEqual(result, { authenticated: false });
  assert.equal(read, false);
});

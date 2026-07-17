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

const ownerId = "owner_12345678901234567890123456789012";
const fingerprint = createAccountFingerprint(ownerId);
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
  assert.deepEqual(result, { authenticated: true, accountFingerprint: fingerprint });
  assert.equal(JSON.stringify(result).includes(ownerId), false);
});

test("sync push reuses durable trusted append classifications", async () => {
  const evidence = { version: 4 as const, data: { attempts: [attempt()], supportEvents: [], achievementSnapshots: [] } };
  const result = await pushEvidenceForTrustedOwner(evidence, async () => ({ authenticated: true, ownerId }), async (resolvedOwner) => {
    assert.equal(resolvedOwner, ownerId);
    return { accepted: [{ kind: "attempt", eventId: evidence.data.attempts[0].eventId, receiveCursor: "1", receivedAt }], duplicates: [], conflicts: [], rejected: [] };
  });
  assert.equal(result.authenticated, true);
  if (result.authenticated) assert.equal(result.response.accepted.length, 1);
});

test("pull rejects a cursor from another account before repository access", async () => {
  let read = false;
  const result = await pullEvidenceForTrustedOwner(`v1.${"B".repeat(43)}.10`, async () => ({ authenticated: true, ownerId }), async () => {
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
  const result = await pullEvidenceForTrustedOwner(null, async () => ({ authenticated: true, ownerId }), async (_owner, after, limit) => {
    assert.equal(after, undefined);
    assert.equal(limit, MAX_PROGRESS_SYNC_PULL_ITEMS + 1);
    return { records };
  });
  assert.equal(result.authenticated, true);
  if (!result.authenticated || result.invalidCursor) return;
  assert.equal(result.response.events.length, MAX_PROGRESS_SYNC_PULL_ITEMS);
  assert.equal(result.response.hasMore, true);
  assert.equal(result.response.nextCursor, `v1.${fingerprint}.200`);
});

test("pull includes canonical retained conflict evidence without internal hashes", async () => {
  const evidence = attempt({ eventId: "attempt_conflict_pull", answer: "different" });
  const result = await pullEvidenceForTrustedOwner(null, async () => ({ authenticated: true, ownerId }), async () => ({ records: [{
    kind: "attempt", eventId: evidence.eventId, disposition: "conflict_retained", receiveCursor: "7", receivedAt, evidence,
  }] }));
  assert.equal(result.authenticated, true);
  if (!result.authenticated || result.invalidCursor) return;
  assert.equal(result.response.events[0].disposition, "conflict_retained");
  assert.equal(JSON.stringify(result.response).includes("payloadHash"), false);
});

test("unverified pull never invokes the repository", async () => {
  let read = false;
  const result = await pullEvidenceForTrustedOwner(null, async () => ({ authenticated: false }), async () => {
    read = true;
    return { records: [] };
  });
  assert.deepEqual(result, { authenticated: false });
  assert.equal(read, false);
});

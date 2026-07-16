import assert from "node:assert/strict";
import test from "node:test";
import { importEvidenceForTrustedOwner, createAccountFingerprint } from "../lib/remote-evidence/authenticated-import";
import { isProgressImportJson, isProgressImportSameOrigin, parseProgressImportBody } from "../lib/progress/import-http";
import { attempt } from "./progress-fixtures";
import type { ProgressPayload } from "../lib/progress/types";

const evidence: ProgressPayload = { version: 4, data: { attempts: [attempt()], supportEvents: [], achievementSnapshots: [] } };
const receivedAt = "2026-07-16T12:00:00.000Z";

test("HTTP boundary requires JSON, same origin and a strict owner-free envelope", () => {
  assert.equal(isProgressImportJson("application/json; charset=utf-8"), true);
  assert.equal(isProgressImportJson("text/plain"), false);
  assert.equal(isProgressImportSameOrigin("https://stemforge.app", "https://stemforge.app", "https://stemforge.app"), true);
  assert.equal(isProgressImportSameOrigin("https://stemforge.app", "https://internal.example", "https://stemforge.app"), true);
  assert.equal(isProgressImportSameOrigin("https://evil.example", "https://stemforge.app", "https://stemforge.app"), false);
  assert.equal(isProgressImportSameOrigin(null, "https://stemforge.app", "https://stemforge.app"), false);
  assert.equal(parseProgressImportBody(JSON.stringify({ protocolVersion: 1, evidence })).ok, true);
  assert.equal(parseProgressImportBody(JSON.stringify({ protocolVersion: 1, evidence, ownerId: "owner_browser" })).ok, false);
  assert.equal(parseProgressImportBody(JSON.stringify({ protocolVersion: 2, evidence })).ok, false);
  assert.equal(parseProgressImportBody("not json").ok, false);
});

test("oversized and unsupported canonical payloads are rejected before owner resolution", () => {
  assert.equal(parseProgressImportBody("x".repeat(1_050_001)).status, 413);
  const future = parseProgressImportBody(JSON.stringify({ protocolVersion: 1, evidence: { version: 5, data: {} } }));
  assert.equal(future.ok, false);
  assert.equal(future.status, 400);
});

test("no verified session never invokes the append repository", async () => {
  let appended = false;
  const result = await importEvidenceForTrustedOwner(evidence, async () => ({ authenticated: false }), async () => {
    appended = true;
    throw new Error("not expected");
  });
  assert.deepEqual(result, { authenticated: false });
  assert.equal(appended, false);
});

test("trusted owner is server-resolved and durable classifications are sanitized", async () => {
  let receivedOwner = "";
  const result = await importEvidenceForTrustedOwner(
    evidence,
    async () => ({ authenticated: true, ownerId: "owner_12345678901234567890123456789012" }),
    async (ownerId) => {
      receivedOwner = ownerId;
      return {
        accepted: [{ kind: "attempt", eventId: "accepted", receiveCursor: "1", receivedAt }],
        duplicates: [{ kind: "support_event", eventId: "duplicate", receiveCursor: "2", receivedAt }],
        conflicts: [{ kind: "achievement_snapshot", eventId: "conflict", conflictId: "9", acceptedPayloadHash: "secret-a", incomingPayloadHash: "secret-b", receiveCursor: "3", receivedAt }],
        rejected: [{ kind: "attempt", eventId: "bad", reason: "Invalid canonical question attempt." }],
      };
    },
  );
  assert.equal(receivedOwner, "owner_12345678901234567890123456789012");
  assert.equal(result.authenticated, true);
  if (!result.authenticated) return;
  assert.equal(result.response.batchStatus, "partly_committed");
  assert.equal(result.response.alreadyPresent[0].receiveCursor, "2");
  assert.deepEqual(result.response.conflictRetained[0], { kind: "achievement_snapshot", eventId: "conflict", receiveCursor: "3", receivedAt });
  assert.equal(JSON.stringify(result.response).includes("secret-a"), false);
  assert.equal(JSON.stringify(result.response).includes(receivedOwner), false);
});

test("account fingerprints are deterministic, domain-separated and opaque", () => {
  const first = createAccountFingerprint("owner_123");
  assert.equal(first, createAccountFingerprint("owner_123"));
  assert.notEqual(first, createAccountFingerprint("owner_456"));
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(first.includes("owner"), false);
});

test("repository failures propagate to the route sanitizer without fabricated acknowledgement", async () => {
  await assert.rejects(importEvidenceForTrustedOwner(
    evidence,
    async () => ({ authenticated: true, ownerId: "owner_12345678901234567890123456789012" }),
    async () => { throw new Error("database-host:5432 secret answer"); },
  ), /database-host/);
});

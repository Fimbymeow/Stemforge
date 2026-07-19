import assert from "node:assert/strict";
import test from "node:test";
import { createSecurityHeaders } from "../lib/security/headers";
import { parseBoundedJsonRequest } from "../lib/security/request-boundary";
import { deploymentIsReady, evaluateDeploymentReadiness } from "../lib/operations/deployment-readiness";
import { readBetaReportReceipts, recordBetaReportReceipt } from "../lib/beta-reports/report-receipts";
import { loadPracticeSessionStore, savePracticeSessionStore } from "../lib/practice/practice-storage";
import { canonicalContent } from "../data/canonical-content";
import { createContentResolver } from "../lib/content-resolver";
import { power, xExpression } from "../lib/maths/expression-core";
import { sampleExpressionForGraph } from "../lib/maths/graph-sampling";

test("production security headers provide the expected browser boundaries", () => {
  const headers = Object.fromEntries(createSecurityHeaders(true).map(({ key, value }) => [key, value]));
  assert.match(headers["Content-Security-Policy"], /default-src 'self'/);
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.doesNotMatch(headers["Content-Security-Policy"], /unsafe-eval/);
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.match(headers["Strict-Transport-Security"], /max-age=31536000/);
  assert.match(Object.fromEntries(createSecurityHeaders(false).map(({ key, value }) => [key, value]))["Content-Security-Policy"], /unsafe-eval/);
});

test("bounded JSON rejects declared and actual oversize, malformed, and non-object bodies", async () => {
  const parse = (body: string, length?: string) => parseBoundedJsonRequest(new Request("https://example.test", {
    method: "POST", body, headers: length ? { "content-length": length } : undefined,
  }), 16);
  assert.deepEqual(await parse("{}", "17"), { ok: false, status: 413, reason: "too_large" });
  assert.equal((await parse(JSON.stringify({ value: "1234567890" }))).reason, "too_large");
  assert.equal((await parse("{" )).reason, "invalid_json");
  assert.equal((await parse("[]")).reason, "invalid_json");
  assert.deepEqual(await parse('{"ok":true}'), { ok: true, value: { ok: true } });
});

test("deployment checks fail closed without leaking configured values", () => {
  const secret = "credential-marker-never-print";
  const missing = evaluateDeploymentReadiness({}, true);
  assert.equal(deploymentIsReady(missing), false);
  const forbidden = evaluateDeploymentReadiness({ NEXT_PUBLIC_DATABASE_SECRET: secret }, false);
  assert.equal(deploymentIsReady(forbidden), false);
  assert.equal(JSON.stringify(forbidden).includes(secret), false);
  const ready = evaluateDeploymentReadiness({
    NEXT_PUBLIC_SITE_URL: "https://stemforge.example",
    STEMFORGE_DATABASE_URL: "postgresql://db.example/stemforge",
    STEMFORGE_AUTH_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    STEMFORGE_AUTH_SITE_URL: "https://stemforge.example",
  }, true);
  assert.equal(deploymentIsReady(ready), true);
});

test("browser persistence fails safely when storage is unavailable or full", () => {
  const unavailable = throwingStorage("get");
  assert.equal(loadPracticeSessionStore(unavailable).status, "unavailable");
  assert.deepEqual(readBetaReportReceipts(unavailable), []);
  const full = throwingStorage("set");
  assert.equal(savePracticeSessionStore({ schemaVersion: 1, activeSessionId: null, sessions: [] }, full), false);
  assert.equal(recordBetaReportReceipt({
    reportId: "SF-TEST0000001", kind: "feedback", status: "new", pageArea: null,
    source: "guest", createdAt: "2026-07-18T12:00:00.000Z",
  }, full), false);
});

test("large content lookup and graph sampling remain indexed and bounded", () => {
  const template = canonicalContent.questions[0];
  const questions = Array.from({ length: 10_000 }, (_, index) => ({ ...template, id: `scale-question-${index}` }));
  const started = performance.now();
  const resolver = createContentResolver({ subjects: canonicalContent.subjects, questions });
  for (let index = 0; index < 100_000; index += 1) {
    assert.equal(resolver.getQuestion(`scale-question-${index % questions.length}`)?.id, `scale-question-${index % questions.length}`);
  }
  assert.ok(performance.now() - started < 5_000, "10,000-item registry and 100,000 indexed lookups exceeded the broad regression budget");

  const sampled = sampleExpressionForGraph(power(xExpression, 5), { xMin: -10, xMax: 10, yMin: -100, yMax: 100 }, { samples: 1_000_000 });
  assert.ok(sampled.reduce((total, segment) => total + segment.length, 0) <= 601);
});

function throwingStorage(operation: "get" | "set"): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { if (operation === "get") throw new Error("unavailable"); return values.get(key) ?? null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { if (operation === "set") throw new Error("quota"); values.set(key, value); },
  };
}

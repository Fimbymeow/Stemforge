import assert from "node:assert/strict";
import { test } from "node:test";
import { BETA_REPORT_SCHEMA_VERSION, type ReportDiagnosticContext } from "../lib/beta-reports/report-types";
import { isValidReportTransition, sanitizeDiagnosticContext, validateSubmitBetaReportRequest } from "../lib/beta-reports/report-validation";
import { isJsonRequest, isSafeSameOrigin, parseBetaReportBody } from "../lib/beta-reports/report-http";

test("beta report validation accepts only explicit, bounded report payloads", () => {
  const result = validateSubmitBetaReportRequest({
    schemaVersion: BETA_REPORT_SCHEMA_VERSION,
    kind: "content_issue",
    userMessage: "This graph question appears to mark a correct point as wrong.",
    contactEmail: "tester@example.com",
    guestSessionId: "guest_1234567890",
    pagePath: "/question/demo",
    pageArea: "question_workspace",
    diagnosticContext: diagnostic({
      contentReference: {
        subjectId: "higher-maths",
        courseId: "calculus",
        pathId: "basic-differentiation",
        stageId: "foundations",
        questionId: "hm-calc-diff-f-001",
        questionVersion: 2,
        contentRevision: 4,
        questionType: "graph_structured",
      },
    }),
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.request.userMessage, "This graph question appears to mark a correct point as wrong.");
    assert.equal(result.request.diagnosticContext.contentReference?.questionId, "hm-calc-diff-f-001");
  }
});

test("beta report diagnostics strip unsafe or unrecognised fields", () => {
  const sanitized = sanitizeDiagnosticContext({
    ...diagnostic(),
    route: "https://evil.example/path",
    contentReference: {
      questionId: "safe-question-id",
      answer: "private answer text",
      questionVersion: -1,
      contentRevision: 5,
    },
    storageDump: "must not survive",
    cookie: "must not survive",
  });
  assert.equal(sanitized.route, "/");
  assert.equal(sanitized.contentReference?.questionId, "safe-question-id");
  assert.equal(sanitized.contentReference?.contentRevision, 5);
  assert.equal("answer" in sanitized.contentReference!, false);
  assert.equal("storageDump" in sanitized, false);
});

test("beta report parser rejects bots, oversized messages and cross-origin requests", () => {
  assert.equal(isJsonRequest("application/json; charset=utf-8"), true);
  assert.equal(isSafeSameOrigin("https://stemforge.test", "https://stemforge.test", undefined), true);
  assert.equal(isSafeSameOrigin("https://other.example", "https://stemforge.test", undefined), false);
  const bot = parseBetaReportBody(JSON.stringify({
    schemaVersion: BETA_REPORT_SCHEMA_VERSION,
    kind: "bug",
    userMessage: "Something broke.",
    pagePath: "/dashboard",
    diagnosticContext: diagnostic(),
    honeypot: "filled",
  }));
  assert.equal(bot.ok, false);
  const tooLarge = parseBetaReportBody(JSON.stringify({
    schemaVersion: BETA_REPORT_SCHEMA_VERSION,
    kind: "bug",
    userMessage: "x".repeat(2001),
    pagePath: "/dashboard",
    diagnosticContext: diagnostic(),
  }));
  assert.equal(tooLarge.ok, false);
});

test("beta report status transitions are deterministic and conservative", () => {
  assert.equal(isValidReportTransition("new", "triaged"), true);
  assert.equal(isValidReportTransition("triaged", "resolved"), false);
  assert.equal(isValidReportTransition("resolved", "in_progress"), true);
  assert.equal(isValidReportTransition("closed", "triaged"), false);
});

function diagnostic(overrides: Partial<ReportDiagnosticContext> = {}): ReportDiagnosticContext {
  return {
    appVersion: "private-beta",
    buildCommit: null,
    environmentLabel: "development",
    route: "/dashboard",
    pageArea: "dashboard",
    viewportCategory: "desktop",
    online: true,
    authState: "guest",
    syncState: null,
    accountGenerationState: null,
    browserName: "Chrome",
    browserVersion: null,
    operatingSystem: "Windows",
    locale: "en-GB",
    timezone: "Europe/London",
    contentReference: null,
    errorCode: null,
    practiceSessionMode: null,
    component: null,
    ...overrides,
  };
}

import assert from "node:assert/strict";
import { test } from "node:test";
import { authorizeInternalOperations, getInternalOperationsConfigurationStatus } from "../lib/beta-reports/internal-authorization";
import { decodeInternalReportCursor, encodeInternalReportCursor, parseInternalReportFilters } from "../lib/beta-reports/internal-query-types";
import { parseWorkflowUpdate, validateWorkflowChange, type WorkflowState } from "../lib/beta-reports/report-workflow";

const trustedOwner = "owner_1234567890abcdef1234567890abcdef";
const otherOwner = "owner_abcdef1234567890abcdef1234567890";
const enabledAuth = { status: "enabled" as const, supabaseUrl: "https://test.supabase.co", publishableKey: "test", siteUrl: "http://localhost:3000" };

test("internal authorization is disabled unless explicitly enabled", async () => {
  assert.deepEqual(await authorizeInternalOperations({ environment: {}, authConfiguration: enabledAuth, resolveOwner: async () => ({ authenticated: true, ownerId: trustedOwner }) }), { status: "disabled" });
  assert.equal(getInternalOperationsConfigurationStatus({ STEMFORGE_INTERNAL_REPORTS_ENABLED: "false" }), "disabled");
});

test("internal authorization fails closed for malformed or missing allowlists", async () => {
  for (const allowlist of [undefined, "", "email@example.com", "owner_short", `${trustedOwner},bad`]) {
    const result = await authorizeInternalOperations({ environment: { STEMFORGE_INTERNAL_REPORTS_ENABLED: "true", STEMFORGE_INTERNAL_REPORT_OWNER_IDS: allowlist }, authConfiguration: enabledAuth, resolveOwner: async () => ({ authenticated: true, ownerId: trustedOwner }) });
    assert.deepEqual(result, { status: "misconfigured" });
  }
  assert.equal(getInternalOperationsConfigurationStatus({ STEMFORGE_INTERNAL_REPORTS_ENABLED: "sometimes", STEMFORGE_INTERNAL_REPORT_OWNER_IDS: trustedOwner }), "misconfigured");
});

test("internal authorization distinguishes no session, ordinary learner and trusted operator", async () => {
  const environment = { STEMFORGE_INTERNAL_REPORTS_ENABLED: "true", STEMFORGE_INTERNAL_REPORT_OWNER_IDS: trustedOwner };
  assert.deepEqual(await authorizeInternalOperations({ environment, authConfiguration: enabledAuth, resolveOwner: async () => ({ authenticated: false }) }), { status: "unauthenticated" });
  assert.deepEqual(await authorizeInternalOperations({ environment, authConfiguration: enabledAuth, resolveOwner: async () => ({ authenticated: true, ownerId: otherOwner }) }), { status: "forbidden" });
  assert.deepEqual(await authorizeInternalOperations({ environment, authConfiguration: enabledAuth, resolveOwner: async () => ({ authenticated: true, ownerId: trustedOwner }) }), { status: "authorized", ownerId: trustedOwner });
});

test("client-like email, fingerprint and owner fields cannot influence authorization", async () => {
  const environment = { STEMFORGE_INTERNAL_REPORTS_ENABLED: "true", STEMFORGE_INTERNAL_REPORT_OWNER_IDS: trustedOwner, email: "operator@example.com", ownerFingerprint: trustedOwner, ownerId: trustedOwner };
  assert.deepEqual(await authorizeInternalOperations({ environment, authConfiguration: enabledAuth, resolveOwner: async () => ({ authenticated: true, ownerId: otherOwner }) }), { status: "forbidden" });
});

test("default internal report filters are bounded, newest and new-only", () => {
  const result = parseInternalReportFilters({});
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual({ status: result.filters.status, sort: result.filters.sort, pageSize: result.filters.pageSize }, { status: "new", sort: "newest", pageSize: 25 });
});

test("internal report filters accept supported combinations and reject arbitrary controls", () => {
  const result = parseInternalReportFilters({ status: "all", kind: "bug", severity: "critical", reproduction: "reproduced", source: "guest", pageArea: "question_workspace", search: "SF-ABCDE12345", from: "2026-07-01", to: "2026-07-31", sort: "severity", pageSize: "100" });
  assert.equal(result.ok, true);
  assert.equal(parseInternalReportFilters({ sort: "DROP TABLE" }).ok, false);
  assert.equal(parseInternalReportFilters({ pageSize: "101" }).ok, false);
  assert.equal(parseInternalReportFilters({ search: "%" }).ok, false);
  assert.equal(parseInternalReportFilters({ pageArea: "x' OR 1=1" }).ok, false);
});

test("pagination cursor is opaque, sort-bound and rejects malformed state", () => {
  const cursor = encodeInternalReportCursor({ sort: "severity", primary: "2026-07-18T12:00:00.000Z", reportId: "SF-ABCDE12345", severityRank: 4 });
  assert.deepEqual(decodeInternalReportCursor(cursor, "severity"), { sort: "severity", primary: "2026-07-18T12:00:00.000Z", reportId: "SF-ABCDE12345", severityRank: 4 });
  assert.equal(decodeInternalReportCursor(cursor, "newest"), null);
  assert.equal(decodeInternalReportCursor("not-a-cursor", "newest"), null);
});

test("workflow parser rejects owner spoofing, unknown fields and oversized summaries", () => {
  assert.equal(parseWorkflowUpdate({ expectedVersion: 1, ownerId: trustedOwner, status: "triaged" }).ok, false);
  assert.equal(parseWorkflowUpdate({ expectedVersion: 1, resolutionSummary: "x".repeat(2001) }).ok, false);
  assert.equal(parseWorkflowUpdate({ expectedVersion: 0, severity: "high" }).ok, false);
  assert.equal(parseWorkflowUpdate({ expectedVersion: 1 }).ok, false);
});

test("workflow rules require resolution and closure explanations", () => {
  const current = state();
  assert.match(validateWorkflowChange(state({ status: "triaged" }), { expectedVersion: 1, status: "resolved" })!, /resolution summary/i);
  assert.match(validateWorkflowChange(current, { expectedVersion: 1, status: "closed" })!, /closure explanation/i);
  assert.equal(validateWorkflowChange(current, { expectedVersion: 1, status: "closed", duplicateOf: "SF-ABCDE12345" }), null);
  assert.match(validateWorkflowChange(current, { expectedVersion: 1, duplicateOf: current.reportId })!, /cannot duplicate itself/i);
});

test("workflow transition model permits conservative triage, reopen and closure paths", () => {
  assert.equal(validateWorkflowChange(state({ status: "new" }), { expectedVersion: 1, status: "triaged" }), null);
  assert.equal(validateWorkflowChange(state({ status: "resolved", resolutionSummary: "Fixed." }), { expectedVersion: 1, status: "in_progress" }), null);
  assert.equal(validateWorkflowChange(state({ status: "closed", resolutionSummary: "Closed." }), { expectedVersion: 1, status: "triaged" }), null);
  assert.match(validateWorkflowChange(state({ status: "new" }), { expectedVersion: 1, status: "in_progress" })!, /invalid status transition/i);
});

function state(overrides: Partial<WorkflowState> = {}): WorkflowState {
  return { reportId: "SF-REPORT1234", status: "new", severity: "normal", reproductionStatus: "not_checked", duplicateOf: null, resolutionSummary: null, stateVersion: 1, ...overrides };
}

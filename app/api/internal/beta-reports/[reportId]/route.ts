import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { getInternalOperationsAuthorization } from "@/lib/beta-reports/internal-authorization.server";
import {
  InternalReportConflictError,
  InternalReportNotFoundError,
  InternalReportWorkflowError,
  PostgresInternalBetaReportRepository,
} from "@/lib/beta-reports/internal-report-repository.server";
import { isJsonRequest, isSafeSameOrigin } from "@/lib/beta-reports/report-http";
import { MAX_INTERNAL_UPDATE_BYTES, parseWorkflowUpdate } from "@/lib/beta-reports/report-workflow";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const access = await getInternalOperationsAuthorization();
  if (access.status !== "authorized") return forbidden();
  const { reportId } = await params;
  if (!validReportId(reportId)) return privateJson({ error: "not_found" }, 404);
  const pool = createRemoteEvidencePool();
  try {
    const repository = new PostgresInternalBetaReportRepository(pool);
    const report = await repository.getBetaReport(reportId);
    if (!report) return privateJson({ error: "not_found" }, 404);
    return privateJson({ report: safeDetail(report) });
  } catch {
    return privateJson({ error: "temporarily_unavailable" }, 503);
  } finally {
    await pool.end();
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const access = await getInternalOperationsAuthorization();
  if (access.status !== "authorized") return forbidden();
  const auth = getAuthFeatureConfiguration();
  const siteUrl = auth.status === "enabled" ? auth.siteUrl : undefined;
  if (!isSafeSameOrigin(request.headers.get("origin"), request.nextUrl.origin, siteUrl)) return forbidden();
  if (!isJsonRequest(request.headers.get("content-type"))) return privateJson({ error: "invalid_request" }, 415);
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_INTERNAL_UPDATE_BYTES) return privateJson({ error: "too_large" }, 413);
  const { reportId } = await params;
  if (!validReportId(reportId)) return privateJson({ error: "not_found" }, 404);
  let raw: string;
  try { raw = await request.text(); } catch { return privateJson({ error: "invalid_request" }, 400); }
  if (new TextEncoder().encode(raw).length > MAX_INTERNAL_UPDATE_BYTES) return privateJson({ error: "too_large" }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return privateJson({ error: "invalid_request" }, 400); }
  const parsed = parseWorkflowUpdate(body);
  if (!parsed.ok) return privateJson({ error: "invalid_request", message: parsed.reason }, 400);
  const pool = createRemoteEvidencePool();
  try {
    const repository = new PostgresInternalBetaReportRepository(pool);
    const report = await repository.updateWorkflow(reportId, access.ownerId, parsed.update);
    return privateJson({ report: safeWorkflow(report) });
  } catch (error) {
    if (error instanceof InternalReportNotFoundError) return privateJson({ error: "not_found" }, 404);
    if (error instanceof InternalReportConflictError) return privateJson({ error: "stale_update", message: "This report changed. Refresh before trying again." }, 409);
    if (error instanceof InternalReportWorkflowError) return privateJson({ error: "invalid_workflow", message: error.message }, 409);
    return privateJson({ error: "temporarily_unavailable" }, 503);
  } finally {
    await pool.end();
  }
}

function safeWorkflow(report: Awaited<ReturnType<PostgresInternalBetaReportRepository["updateWorkflow"]>>) {
  return {
    reportId: report.reportId, status: report.status, severity: report.severity,
    reproductionStatus: report.reproductionStatus, duplicateOf: report.duplicateOf,
    resolutionSummary: report.resolutionSummary, stateVersion: report.stateVersion,
    updatedAt: report.updatedAt, resolvedAt: report.resolvedAt,
  };
}

function safeDetail(report: NonNullable<Awaited<ReturnType<PostgresInternalBetaReportRepository["getBetaReport"]>>>) {
  const { ownerId: _ownerId, guestSessionId: _guestSessionId, ...safe } = report;
  return { ...safe, source: report.ownerId ? "authenticated" : "guest" };
}

function validReportId(value: string) { return /^SF-[A-Z0-9]{10}$/.test(value); }
function forbidden() { return privateJson({ error: "forbidden" }, 403); }
function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

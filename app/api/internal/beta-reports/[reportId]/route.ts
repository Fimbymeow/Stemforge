import { NextResponse, type NextRequest } from "next/server";
import { getInternalReportsAccess } from "@/lib/beta-reports/internal-authorization.server";
import { PostgresBetaReportRepository } from "@/lib/beta-reports/report-repository.server";
import { isReportStatus, sanitizeResolutionSummary } from "@/lib/beta-reports/report-validation";
import type { BetaReportStatus } from "@/lib/beta-reports/report-types";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const access = await getInternalReportsAccess();
  if (!access.allowed) return forbidden(access.reason);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders() });
  }
  if (!isUpdateBody(body)) return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders() });
  const pool = createRemoteEvidencePool();
  try {
    const repository = new PostgresBetaReportRepository(pool);
    const { reportId } = await params;
    const report = await repository.updateStatus(reportId, body.status, sanitizeResolutionSummary(body.resolutionSummary));
    if (!report) return NextResponse.json({ error: "not_found" }, { status: 404, headers: privateHeaders() });
    return NextResponse.json({ report }, { headers: privateHeaders() });
  } catch {
    return NextResponse.json({ error: "invalid_transition" }, { status: 409, headers: privateHeaders() });
  } finally {
    await pool.end();
  }
}

function isUpdateBody(value: unknown): value is { status: BetaReportStatus; resolutionSummary?: string | null } {
  if (typeof value !== "object" || value === null || !("status" in value)) return false;
  return isReportStatus((value as { status: unknown }).status);
}

function forbidden(reason: string) {
  return NextResponse.json({ error: "forbidden", reason }, { status: 403, headers: privateHeaders() });
}

function privateHeaders() {
  return { "Cache-Control": "no-store" };
}

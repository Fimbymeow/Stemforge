import { NextResponse, type NextRequest } from "next/server";
import { getInternalReportsAccess } from "@/lib/beta-reports/internal-authorization.server";
import { PostgresBetaReportRepository } from "@/lib/beta-reports/report-repository.server";
import { isReportStatus } from "@/lib/beta-reports/report-validation";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await getInternalReportsAccess();
  if (!access.allowed) return forbidden(access.reason);
  const statusParam = request.nextUrl.searchParams.get("status");
  if (statusParam && !isReportStatus(statusParam)) return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders() });
  const status = statusParam && isReportStatus(statusParam) ? statusParam : undefined;
  const pool = createRemoteEvidencePool();
  try {
    const repository = new PostgresBetaReportRepository(pool);
    const reports = await repository.listReports({ status, limit: 50 });
    return NextResponse.json({ reports }, { headers: privateHeaders() });
  } finally {
    await pool.end();
  }
}

function forbidden(reason: string) {
  return NextResponse.json({ error: "forbidden", reason }, { status: 403, headers: privateHeaders() });
}

function privateHeaders() {
  return { "Cache-Control": "no-store" };
}

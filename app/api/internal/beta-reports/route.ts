import { NextResponse, type NextRequest } from "next/server";
import { getInternalOperationsAuthorization } from "@/lib/beta-reports/internal-authorization.server";
import { PostgresInternalBetaReportRepository } from "@/lib/beta-reports/internal-report-repository.server";
import { parseInternalReportFilters } from "@/lib/beta-reports/internal-query-types";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await getInternalOperationsAuthorization();
  if (access.status !== "authorized") return forbidden();
  const parsed = parseInternalReportFilters(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.ok) return privateJson({ error: "invalid_request", message: parsed.reason }, 400);
  const pool = createRemoteEvidencePool();
  try {
    const repository = new PostgresInternalBetaReportRepository(pool);
    const [page, summary] = await Promise.all([
      repository.listBetaReports(parsed.filters),
      repository.getOperationalSummary(),
    ]);
    return privateJson({ ...page, summary });
  } catch {
    return privateJson({ error: "temporarily_unavailable" }, 503);
  } finally {
    await pool.end();
  }
}

function forbidden() { return privateJson({ error: "forbidden" }, 403); }
function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { submitBetaReport } from "@/lib/beta-reports/authenticated-reporting.server";
import { isJsonRequest, isSafeSameOrigin, MAX_BETA_REPORT_REQUEST_BYTES, parseBetaReportBody } from "@/lib/beta-reports/report-http";
import { BetaReportRateLimitError } from "@/lib/beta-reports/report-repository.server";
import type { SubmitBetaReportResult } from "@/lib/beta-reports/report-types";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  const siteUrl = config.status === "enabled" ? config.siteUrl : undefined;
  if (!isJsonRequest(request.headers.get("content-type"))) return error(415, "invalid_request", "Feedback reports require application/json.");
  if (!isSafeSameOrigin(request.headers.get("origin"), request.nextUrl.origin, siteUrl)) {
    return error(403, "forbidden", "The report request could not be verified.");
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BETA_REPORT_REQUEST_BYTES) {
    return error(413, "too_large", "That report is too large to submit.");
  }
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return error(400, "invalid_request", "The report could not be read.");
  }
  const parsed = parseBetaReportBody(raw);
  if (!parsed.ok) return error(parsed.status, parsed.code, parsed.message);
  let pool: ReturnType<typeof createRemoteEvidencePool> | null = null;
  try {
    pool = createRemoteEvidencePool();
    const reportId = await submitBetaReport(parsed.request, parsed.diagnosticContext, pool);
    return NextResponse.json<SubmitBetaReportResult>({ status: "accepted", reportId }, { headers: PRIVATE_HEADERS });
  } catch (cause) {
    if (cause instanceof BetaReportRateLimitError) {
      return NextResponse.json(
        { status: "rejected", reason: "rate_limited", message: "Please wait before sending another report." },
        { status: 429, headers: { ...PRIVATE_HEADERS, "Retry-After": String(cause.retryAfterSeconds) } },
      );
    }
    return error(503, "temporarily_unavailable", "Feedback could not be saved just now. Please try again in a moment.");
  } finally {
    await pool?.end();
  }
}

function error(status: number, code: Exclude<SubmitBetaReportResult, { status: "accepted" }>["reason"], message: string) {
  return NextResponse.json<SubmitBetaReportResult>({ status: "rejected", reason: code, message }, { status, headers: PRIVATE_HEADERS });
}

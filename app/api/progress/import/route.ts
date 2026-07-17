import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import {
  MAX_PROGRESS_IMPORT_REQUEST_BYTES,
  PROGRESS_IMPORT_PROTOCOL_VERSION,
  type ProgressImportErrorResponse,
} from "@/lib/progress/import-protocol";
import { isProgressImportJson, isProgressImportSameOrigin, parseProgressImportBody } from "@/lib/progress/import-http";
import { importCurrentBrowserEvidence } from "@/lib/remote-evidence/authenticated-import.server";
import { AccountDataAccessError } from "@/lib/account-data/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return error(401, "sign_in_required", "Sign in is required to import browser progress.");
  if (!isProgressImportJson(request.headers.get("content-type"))) return error(415, "invalid_request", "Progress imports require application/json.");
  if (!isProgressImportSameOrigin(request.headers.get("origin"), request.nextUrl.origin, config.siteUrl)) {
    return error(403, "forbidden", "The progress import request could not be verified.");
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PROGRESS_IMPORT_REQUEST_BYTES) {
    return error(413, "too_large", "The progress import request is too large.");
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return error(400, "invalid_request", "The progress import request could not be read.");
  }
  const parsed = parseProgressImportBody(raw);
  if (!parsed.ok) return error(parsed.status, parsed.status === 413 ? "too_large" : "invalid_request", parsed.message);

  try {
    const imported = await importCurrentBrowserEvidence(parsed.envelope.evidence, parsed.envelope.expectedGeneration);
    if (!imported.authenticated) return error(401, "sign_in_required", "Your session has expired. Sign in again to continue.");
    return NextResponse.json(imported.response, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    if (cause instanceof AccountDataAccessError) return accountDataError(cause);
    return error(503, "temporarily_unavailable", "Progress could not be added just now. Nothing was deleted—please try again.");
  }
}

function accountDataError(cause: AccountDataAccessError) {
  const message = cause.code === "account_generation_mismatch" || cause.code === "generation_required"
    ? "Refresh account context and review this browser's older progress before importing."
    : cause.code === "account_closed" ? "This account is closed." : "Learning-data deletion is in progress. Import is paused.";
  return error(409, cause.code, message);
}

function error(status: number, code: ProgressImportErrorResponse["error"], message: string) {
  return NextResponse.json<ProgressImportErrorResponse>(
    { protocolVersion: PROGRESS_IMPORT_PROTOCOL_VERSION, error: code, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

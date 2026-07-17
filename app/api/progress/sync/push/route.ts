import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { isProgressImportJson, isProgressImportSameOrigin, parseProgressImportBody } from "@/lib/progress/import-http";
import { MAX_PROGRESS_IMPORT_REQUEST_BYTES } from "@/lib/progress/import-protocol";
import { PROGRESS_SYNC_PRIVATE_HEADERS } from "@/lib/progress/sync-http";
import { PROGRESS_SYNC_PROTOCOL_VERSION, type ProgressSyncErrorResponse } from "@/lib/progress/sync-protocol";
import { pushCurrentProgressSyncEvidence } from "@/lib/remote-evidence/authenticated-sync.server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return error(401, "sign_in_required", "Sign in is required to synchronize progress.");
  if (!isProgressImportJson(request.headers.get("content-type"))) return error(415, "invalid_request", "Progress synchronization requires application/json.");
  if (!isProgressImportSameOrigin(request.headers.get("origin"), request.nextUrl.origin, config.siteUrl)) {
    return error(403, "forbidden", "The synchronization request could not be verified.");
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PROGRESS_IMPORT_REQUEST_BYTES) {
    return error(413, "too_large", "The synchronization request is too large.");
  }
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return error(400, "invalid_request", "The synchronization request could not be read.");
  }
  const parsed = parseProgressImportBody(raw);
  if (!parsed.ok) return error(parsed.status, parsed.status === 413 ? "too_large" : "invalid_request", parsed.message);
  try {
    const pushed = await pushCurrentProgressSyncEvidence(parsed.envelope.evidence);
    if (!pushed.authenticated) return error(401, "sign_in_required", "Your session has expired. Sign in again to continue.");
    return NextResponse.json(pushed.response, { headers: PROGRESS_SYNC_PRIVATE_HEADERS });
  } catch {
    return error(503, "temporarily_unavailable", "Progress could not be synchronized just now. Your browser copy is safe.");
  }
}

function error(status: number, code: ProgressSyncErrorResponse["error"], message: string) {
  return NextResponse.json<ProgressSyncErrorResponse>(
    { protocolVersion: PROGRESS_SYNC_PROTOCOL_VERSION, error: code, message },
    { status, headers: PROGRESS_SYNC_PRIVATE_HEADERS },
  );
}

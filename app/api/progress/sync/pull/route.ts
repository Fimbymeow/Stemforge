import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { PROGRESS_SYNC_PRIVATE_HEADERS, isProgressSyncBrowserRequest } from "@/lib/progress/sync-http";
import { PROGRESS_SYNC_PROTOCOL_VERSION, type ProgressSyncErrorResponse } from "@/lib/progress/sync-protocol";
import { pullCurrentProgressSyncEvidence } from "@/lib/remote-evidence/authenticated-sync.server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return error(401, "sign_in_required", "Sign in is required to synchronize progress.");
  if (!isProgressSyncBrowserRequest(request.headers, config.siteUrl)) return error(403, "forbidden", "The synchronization request could not be verified.");
  const cursor = request.nextUrl.searchParams.get("after");
  if (cursor !== null && cursor.length > 256) return error(400, "invalid_request", "The synchronization cursor is invalid.");
  try {
    const pulled = await pullCurrentProgressSyncEvidence(cursor);
    if (!pulled.authenticated) return error(401, "sign_in_required", "Your session has expired. Sign in again to continue.");
    if (pulled.invalidCursor) return error(400, "invalid_request", "The synchronization cursor is invalid for this account.");
    return NextResponse.json(pulled.response, { headers: PROGRESS_SYNC_PRIVATE_HEADERS });
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

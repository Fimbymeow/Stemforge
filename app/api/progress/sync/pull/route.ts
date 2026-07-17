import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { PROGRESS_SYNC_PRIVATE_HEADERS, isProgressSyncBrowserRequest } from "@/lib/progress/sync-http";
import { PROGRESS_SYNC_PROTOCOL_VERSION, type ProgressSyncErrorResponse } from "@/lib/progress/sync-protocol";
import { pullCurrentProgressSyncEvidence } from "@/lib/remote-evidence/authenticated-sync.server";
import { AccountDataAccessError } from "@/lib/account-data/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return error(401, "sign_in_required", "Sign in is required to synchronize progress.");
  if (!isProgressSyncBrowserRequest(request.headers, config.siteUrl)) return error(403, "forbidden", "The synchronization request could not be verified.");
  const cursor = request.nextUrl.searchParams.get("after");
  const generation = request.nextUrl.searchParams.get("generation") ?? undefined;
  if (cursor !== null && cursor.length > 256) return error(400, "invalid_request", "The synchronization cursor is invalid.");
  try {
    const pulled = await pullCurrentProgressSyncEvidence(cursor, generation);
    if (!pulled.authenticated) return error(401, "sign_in_required", "Your session has expired. Sign in again to continue.");
    if ("generationRequired" in pulled && pulled.generationRequired) return error(409, "generation_required", "Refresh account context before synchronization.");
    if (pulled.invalidCursor) return error(400, "invalid_request", "The synchronization cursor is invalid for this account.");
    return NextResponse.json(pulled.response, { headers: PROGRESS_SYNC_PRIVATE_HEADERS });
  } catch (cause) {
    if (cause instanceof AccountDataAccessError) return accountDataError(cause);
    return error(503, "temporarily_unavailable", "Progress could not be synchronized just now. Your browser copy is safe.");
  }
}

function accountDataError(cause: AccountDataAccessError) {
  const message = cause.code === "account_generation_mismatch" || cause.code === "generation_required"
    ? "This browser has progress from before account deletion. It cannot sync until you review the data stored here."
    : cause.code === "account_closed" ? "This account is closed." : "Learning-data deletion is in progress. Synchronization is paused.";
  return error(409, cause.code, message);
}

function error(status: number, code: ProgressSyncErrorResponse["error"], message: string) {
  return NextResponse.json<ProgressSyncErrorResponse>(
    { protocolVersion: PROGRESS_SYNC_PROTOCOL_VERSION, error: code, message },
    { status, headers: PROGRESS_SYNC_PRIVATE_HEADERS },
  );
}

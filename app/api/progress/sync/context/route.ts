import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { PROGRESS_SYNC_PRIVATE_HEADERS, isProgressSyncBrowserRequest } from "@/lib/progress/sync-http";
import { PROGRESS_SYNC_PROTOCOL_VERSION, type ProgressSyncErrorResponse } from "@/lib/progress/sync-protocol";
import { resolveCurrentProgressSyncContext } from "@/lib/remote-evidence/authenticated-sync.server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return error(401, "sign_in_required", "Sign in is required to synchronize progress.");
  if (!isProgressSyncBrowserRequest(request.headers, config.siteUrl)) return error(403, "forbidden", "The synchronization request could not be verified.");
  try {
    const context = await resolveCurrentProgressSyncContext();
    if (!context.authenticated) return NextResponse.json({ protocolVersion: PROGRESS_SYNC_PROTOCOL_VERSION, authenticated: false }, {
      headers: PROGRESS_SYNC_PRIVATE_HEADERS,
    });
    return NextResponse.json({ protocolVersion: PROGRESS_SYNC_PROTOCOL_VERSION, authenticated: true,
      accountFingerprint: context.accountFingerprint, accountGeneration: context.accountGeneration,
      accountDataStatus: context.accountDataStatus }, {
      headers: PROGRESS_SYNC_PRIVATE_HEADERS,
    });
  } catch {
    return error(503, "temporarily_unavailable", "Synchronization is temporarily unavailable.");
  }
}

function error(status: number, code: ProgressSyncErrorResponse["error"], message: string) {
  return NextResponse.json<ProgressSyncErrorResponse>(
    { protocolVersion: PROGRESS_SYNC_PROTOCOL_VERSION, error: code, message },
    { status, headers: PROGRESS_SYNC_PRIVATE_HEADERS },
  );
}

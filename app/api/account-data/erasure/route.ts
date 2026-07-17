import { NextResponse, type NextRequest } from "next/server";
import { withCurrentAccountData } from "@/lib/account-data/current-account-data.server";
import { ACCOUNT_DATA_PRIVATE_HEADERS, isTrustedAccountDataMutation } from "@/lib/account-data/request-http.server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isTrustedAccountDataMutation(request)) return failure(403, "forbidden", "The deletion request could not be verified.");
  try {
    const result = await withCurrentAccountData((ownerId, repository) => repository.startRequest(ownerId));
    if (!result.authenticated) return failure(401, "sign_in_required", "Sign in again to continue.");
    return NextResponse.json({ protocolVersion: 1, request: result.result }, { headers: ACCOUNT_DATA_PRIVATE_HEADERS });
  } catch { return failure(503, "temporarily_unavailable", "The deletion request could not be started just now."); }
}

export async function GET() {
  try {
    const result = await withCurrentAccountData(async (ownerId, repository) => {
      let request = await repository.latestRequest(ownerId);
      if ((request?.status === "scheduled" || request?.status === "failed_retryable") &&
          request.cancellationDeadline && Date.parse(request.cancellationDeadline) <= Date.now()) {
        const requestId = request.requestId;
        try {
          request = await repository.beginProcessing(ownerId, requestId);
          await repository.processRequest(requestId);
          request = await repository.latestRequest(ownerId);
        } catch {
          await repository.markRetryableFailure(ownerId, requestId).catch(() => undefined);
          request = await repository.latestRequest(ownerId);
        }
      }
      return { request, state: await repository.readState(ownerId) };
    });
    if (!result.authenticated) return failure(401, "sign_in_required", "Sign in again to continue.");
    return NextResponse.json({ protocolVersion: 1, ...result.result }, { headers: ACCOUNT_DATA_PRIVATE_HEADERS });
  } catch { return failure(503, "temporarily_unavailable", "Deletion status is temporarily unavailable."); }
}

function failure(status: number, error: string, message: string) {
  return NextResponse.json({ protocolVersion: 1, error, message }, { status, headers: ACCOUNT_DATA_PRIVATE_HEADERS });
}

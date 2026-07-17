import { NextResponse, type NextRequest } from "next/server";
import { withCurrentAccountData } from "@/lib/account-data/current-account-data.server";
import { ACCOUNT_DATA_PRIVATE_HEADERS, isTrustedAccountDataMutation, validRequestId } from "@/lib/account-data/request-http.server";

export async function POST(request: NextRequest) {
  if (!isTrustedAccountDataMutation(request)) return failure(403, "forbidden", "The cancellation could not be verified.");
  let requestId: unknown;
  try { requestId = (await request.json() as { requestId?: unknown }).requestId; } catch { return failure(400, "invalid_request", "The cancellation is invalid."); }
  if (!validRequestId(requestId)) return failure(400, "invalid_request", "A valid deletion request is required.");
  try {
    const result = await withCurrentAccountData((ownerId, repository) => repository.cancelRequest(ownerId, requestId));
    if (!result.authenticated) return failure(401, "sign_in_required", "Sign in again to continue.");
    return NextResponse.json({ protocolVersion: 1, request: result.result }, { headers: ACCOUNT_DATA_PRIVATE_HEADERS });
  } catch { return failure(409, "cancellation_unavailable", "Deletion can no longer be cancelled."); }
}
function failure(status: number, error: string, message: string) { return NextResponse.json({ protocolVersion: 1, error, message }, { status, headers: ACCOUNT_DATA_PRIVATE_HEADERS }); }

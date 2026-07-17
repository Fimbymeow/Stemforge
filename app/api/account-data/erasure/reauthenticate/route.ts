import { NextResponse, type NextRequest } from "next/server";
import { withCurrentAccountData } from "@/lib/account-data/current-account-data.server";
import { ACCOUNT_DATA_PRIVATE_HEADERS, isTrustedAccountDataMutation, validRequestId } from "@/lib/account-data/request-http.server";
import { currentSessionBinding, reauthenticateCurrentPasswordUser } from "@/lib/auth/reauthentication.server";

export async function POST(request: NextRequest) {
  if (!isTrustedAccountDataMutation(request)) return failure(403, "forbidden", "The identity confirmation could not be verified.");
  let body: { requestId?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return failure(400, "invalid_request", "The identity confirmation is invalid."); }
  if (!validRequestId(body.requestId)) return failure(400, "invalid_request", "A valid deletion request is required.");
  const requestId = body.requestId;
  const fresh = await reauthenticateCurrentPasswordUser(body.password);
  if (!fresh.ok) return failure(401, fresh.reason, "Identity confirmation failed.");
  try {
    const binding = await currentSessionBinding();
    const result = await withCurrentAccountData((ownerId, repository) => repository.recordReauthentication(ownerId, requestId, binding));
    if (!result.authenticated) return failure(401, "sign_in_required", "Sign in again to continue.");
    const response = NextResponse.json({ protocolVersion: 1, request: result.result.request }, { headers: ACCOUNT_DATA_PRIVATE_HEADERS });
    response.cookies.set(`stemforge-erasure-proof-${requestId}`, result.result.proof, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/api/account-data/erasure", maxAge: 600 });
    return response;
  } catch { return failure(409, "invalid_state", "Identity confirmation is no longer valid for this request."); }
}
function failure(status: number, error: string, message: string) { return NextResponse.json({ protocolVersion: 1, error, message }, { status, headers: ACCOUNT_DATA_PRIVATE_HEADERS }); }

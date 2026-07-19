import { NextResponse, type NextRequest } from "next/server";
import { withCurrentAccountData } from "@/lib/account-data/current-account-data.server";
import { ACCOUNT_DATA_PRIVATE_HEADERS, isTrustedAccountDataMutation, validRequestId } from "@/lib/account-data/request-http.server";
import { currentSessionBinding } from "@/lib/auth/reauthentication.server";
import { ERASURE_CONFIRMATION_TEXT } from "@/lib/account-data/types";
import { MAX_ACCOUNT_DATA_REQUEST_BYTES, parseBoundedJsonRequest } from "@/lib/security/request-boundary";

export async function POST(request: NextRequest) {
  if (!isTrustedAccountDataMutation(request)) return failure(403, "forbidden", "The confirmation could not be verified.");
  const parsed = await parseBoundedJsonRequest(request, MAX_ACCOUNT_DATA_REQUEST_BYTES);
  if (!parsed.ok) return failure(parsed.status, parsed.reason === "too_large" ? "too_large" : "invalid_request", "The confirmation is invalid.");
  const body = parsed.value;
  if (!validRequestId(body.requestId) || body.confirmation !== ERASURE_CONFIRMATION_TEXT) return failure(400, "confirmation_required", `Type ${ERASURE_CONFIRMATION_TEXT} to confirm.`);
  const requestId = body.requestId;
  const proof = request.cookies.get(`stemforge-erasure-proof-${requestId}`)?.value;
  if (!proof) return failure(401, "reauthentication_required", "Confirm your identity again before continuing.");
  try {
    const binding = await currentSessionBinding();
    const result = await withCurrentAccountData((ownerId, repository) => repository.confirmRequest(ownerId, requestId, proof, binding));
    if (!result.authenticated) return failure(401, "sign_in_required", "Sign in again to continue.");
    const response = NextResponse.json({ protocolVersion: 1, request: result.result }, { headers: ACCOUNT_DATA_PRIVATE_HEADERS });
    response.cookies.delete(`stemforge-erasure-proof-${requestId}`);
    return response;
  } catch { return failure(409, "reauthentication_required", "Recent identity confirmation is invalid, expired, or already used."); }
}
function failure(status: number, error: string, message: string) { return NextResponse.json({ protocolVersion: 1, error, message }, { status, headers: ACCOUNT_DATA_PRIVATE_HEADERS }); }

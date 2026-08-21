import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { createAccountFingerprint } from "@/lib/remote-evidence/authenticated-import.server";
import { withCurrentAccountState } from "@/lib/account-state/current-account-state.server";
import { normalizeAccountStateMutations } from "@/lib/account-state/validation";
import { isProgressImportSameOrigin } from "@/lib/progress/import-http";
import { parseBoundedJsonRequest } from "@/lib/security/request-boundary";
import { MAX_ACCOUNT_STATE_REQUEST_BYTES } from "@/lib/account-state/types";
import { AccountDataAccessError } from "@/lib/account-data/types";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", "X-Content-Type-Options": "nosniff" };

export async function GET() {
  if (getAuthFeatureConfiguration().status !== "enabled") return NextResponse.json({ authenticated: false }, { headers });
  try {
    const result = await withCurrentAccountState(async (ownerId, repository) => ({ state: await repository.read(ownerId), accountGeneration: await repository.readGeneration(ownerId) }));
    return NextResponse.json(result.authenticated
      ? { protocolVersion: 1, authenticated: true, accountFingerprint: createAccountFingerprint(result.ownerId), ...result.result }
      : { protocolVersion: 1, authenticated: false }, { headers });
  } catch {
    return failure(503, "temporarily_unavailable");
  }
}

export async function PUT(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return failure(401, "sign_in_required");
  if (!isProgressImportSameOrigin(request.headers.get("origin"), request.nextUrl.origin, config.siteUrl)) return failure(403, "forbidden");
  const parsed = await parseBoundedJsonRequest(request, MAX_ACCOUNT_STATE_REQUEST_BYTES);
  if (!parsed.ok) return failure(parsed.status, "invalid_request");
  const mutations = normalizeAccountStateMutations(parsed.value.mutations);
  const accountGeneration = parsed.value.accountGeneration;
  if (!mutations || typeof accountGeneration !== "string" || !/^[1-9]\d*$/.test(accountGeneration)) return failure(400, "invalid_request");
  try {
    const result = await withCurrentAccountState(async (ownerId, repository) => {
      const state = await repository.apply(ownerId, mutations, accountGeneration);
      return { state, accountGeneration: await repository.readGeneration(ownerId) };
    });
    if (!result.authenticated) return failure(401, "sign_in_required");
    return NextResponse.json({ protocolVersion: 1, authenticated: true,
      accountFingerprint: createAccountFingerprint(result.ownerId), ...result.result }, { headers });
  } catch (error) {
    if (error instanceof AccountDataAccessError) return failure(409, error.code);
    return failure(503, "temporarily_unavailable");
  }
}

function failure(status: number, error: string) {
  return NextResponse.json({ protocolVersion: 1, error }, { status, headers });
}

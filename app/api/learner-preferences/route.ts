import { NextResponse, type NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { withCurrentLearnerPreferences } from "@/lib/learner-preferences/current-learner-preferences.server";
import { normalizeLearnerPreferences } from "@/lib/learner-preferences";
import { isProgressImportSameOrigin } from "@/lib/progress/import-http";
import { MAX_ACCOUNT_DATA_REQUEST_BYTES, parseBoundedJsonRequest } from "@/lib/security/request-boundary";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", "X-Content-Type-Options": "nosniff" };

export async function GET() {
  if (getAuthFeatureConfiguration().status !== "enabled") return NextResponse.json({ authenticated: false }, { headers });
  try {
    const result = await withCurrentLearnerPreferences((ownerId, repository) => repository.read(ownerId));
    return NextResponse.json(result.authenticated
      ? { authenticated: true, preferences: result.result }
      : { authenticated: false }, { headers });
  } catch {
    return failure(503, "temporarily_unavailable");
  }
}

export async function PUT(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return failure(401, "sign_in_required");
  if (!isProgressImportSameOrigin(request.headers.get("origin"), request.nextUrl.origin, config.siteUrl)) return failure(403, "forbidden");
  const parsed = await parseBoundedJsonRequest(request, MAX_ACCOUNT_DATA_REQUEST_BYTES);
  if (!parsed.ok) return failure(parsed.status, "invalid_request");
  const preferences = normalizeLearnerPreferences(parsed.value.preferences);
  try {
    const result = await withCurrentLearnerPreferences((ownerId, repository) => repository.replace(ownerId, preferences));
    if (!result.authenticated) return failure(401, "sign_in_required");
    return NextResponse.json({ authenticated: true, preferences: result.result }, { headers });
  } catch {
    return failure(503, "temporarily_unavailable");
  }
}

function failure(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers });
}

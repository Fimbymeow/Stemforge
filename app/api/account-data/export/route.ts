import { NextResponse, type NextRequest } from "next/server";
import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";
import { reauthenticateCurrentPasswordUser } from "@/lib/auth/reauthentication.server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { isProgressImportSameOrigin } from "@/lib/progress/import-http";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";
import { exportRemoteLearningData } from "@/lib/account-data/remote-export.server";
import { AccountExportBoundsError, safeAccountExportFilename } from "@/lib/account-data/export";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", "X-Content-Type-Options": "nosniff" };

export async function POST(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  if (config.status !== "enabled") return failure(401, "sign_in_required", "Sign in is required.");
  if (!isProgressImportSameOrigin(request.headers.get("origin"), request.nextUrl.origin, config.siteUrl)) return failure(403, "forbidden", "The export request could not be verified.");
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") return failure(415, "invalid_request", "Export requires application/json.");
  let password: unknown;
  try { password = (await request.json() as { password?: unknown }).password; } catch { return failure(400, "invalid_request", "The export request is invalid."); }
  const owner = await resolveCurrentAuthenticatedOwner();
  if (!owner.authenticated) return failure(401, "sign_in_required", "Your session has expired.");
  const reauthenticated = await reauthenticateCurrentPasswordUser(password);
  if (!reauthenticated.ok) return failure(401, reauthenticated.reason, "Identity confirmation failed.");
  try {
    const exported = await exportRemoteLearningData(createRemoteEvidencePool(), owner.ownerId);
    return new NextResponse(JSON.stringify(exported), { status: 200, headers: { ...privateHeaders,
      "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${safeAccountExportFilename()}"` } });
  } catch (error) {
    if (error instanceof AccountExportBoundsError) return failure(413, "export_too_large", "This account is too large for a safe immediate export. No partial export was created.");
    return failure(503, "temporarily_unavailable", "Account data could not be exported just now.");
  }
}

function failure(status: number, error: string, message: string) {
  return NextResponse.json({ protocolVersion: 1, error, message }, { status, headers: privateHeaders });
}

import { NextResponse } from "next/server";
import { getInternalOperationsAuthorization } from "@/lib/beta-reports/internal-authorization.server";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";
import { getInternalHealthSnapshot } from "@/lib/operations/internal-health.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getInternalOperationsAuthorization();
  if (access.status !== "authorized") return response({ error: "forbidden" }, 403);
  const pool = createRemoteEvidencePool();
  try {
    return response(await getInternalHealthSnapshot(pool));
  } catch {
    return response({ error: "temporarily_unavailable" }, 503);
  } finally {
    await pool.end();
  }
}

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

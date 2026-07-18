import { NextResponse } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { createRemoteEvidencePool } from "@/lib/remote-evidence/database.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    app: "ok",
    auth: getAuthFeatureConfiguration().status,
    database: "not_configured" as "ok" | "not_configured" | "unavailable",
  };
  if (process.env.STEMFORGE_DATABASE_URL) {
    const pool = createRemoteEvidencePool();
    try {
      await pool.query("SELECT 1");
      checks.database = "ok";
    } catch {
      checks.database = "unavailable";
    } finally {
      await pool.end();
    }
  }
  const ready = checks.database !== "unavailable" && checks.auth !== "misconfigured";
  return NextResponse.json(
    { status: ready ? "ready" : "not_ready", checks },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}

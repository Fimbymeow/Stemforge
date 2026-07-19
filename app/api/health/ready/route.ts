import { NextResponse } from "next/server";
import { getPublicReadinessSnapshot } from "@/lib/operations/public-readiness.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getPublicReadinessSnapshot();
  return NextResponse.json(
    snapshot,
    { status: snapshot.status === "ready" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      appVersion: "private-beta",
      buildCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

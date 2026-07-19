import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      appVersion: "private-beta",
      buildCommit: (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.STEMFORGE_BUILD_COMMIT)?.slice(0, 12) ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

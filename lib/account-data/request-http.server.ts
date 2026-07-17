import "server-only";

import type { NextRequest } from "next/server";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { isProgressImportSameOrigin } from "@/lib/progress/import-http";

export function isTrustedAccountDataMutation(request: NextRequest) {
  const config = getAuthFeatureConfiguration();
  return config.status === "enabled" && isProgressImportSameOrigin(request.headers.get("origin"), request.nextUrl.origin, config.siteUrl) &&
    request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

export const ACCOUNT_DATA_PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

export function validRequestId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
}

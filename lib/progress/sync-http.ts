import { isProgressImportSameOrigin } from "@/lib/progress/import-http";

export const PROGRESS_SYNC_PRIVATE_HEADERS = {
  "Cache-Control": "no-store, private",
  "Vary": "Cookie",
  "X-Content-Type-Options": "nosniff",
} as const;

export function isProgressSyncBrowserRequest(headers: Headers, configuredOrigin: string) {
  if (headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = headers.get("origin");
  return origin === null || isProgressImportSameOrigin(origin, "", configuredOrigin);
}

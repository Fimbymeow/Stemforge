"use client";

import type { ReportDiagnosticContext, SafeContentReference } from "@/lib/beta-reports/report-types";

export function createReportDiagnosticContext(input: {
  pageArea?: string | null;
  contentReference?: SafeContentReference | null;
  errorCode?: string | null;
  syncState?: string | null;
  authState?: ReportDiagnosticContext["authState"];
  practiceSessionMode?: string | null;
  component?: string | null;
} = {}): ReportDiagnosticContext {
  const nav = typeof navigator === "undefined" ? null : navigator;
  const width = typeof window === "undefined" ? 1200 : window.innerWidth;
  return {
    appVersion: "private-beta",
    buildCommit: null,
    environmentLabel: process.env.NODE_ENV === "production" ? "production" : "development",
    route: typeof window === "undefined" ? "/" : window.location.pathname,
    pageArea: input.pageArea ?? null,
    viewportCategory: width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop",
    online: nav?.onLine ?? true,
    authState: input.authState ?? "guest",
    syncState: input.syncState ?? null,
    accountGenerationState: null,
    browserName: detectBrowser(nav?.userAgent ?? ""),
    browserVersion: null,
    operatingSystem: detectOS(nav?.userAgent ?? ""),
    locale: nav?.language ?? null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    contentReference: input.contentReference ?? null,
    errorCode: input.errorCode ?? null,
    practiceSessionMode: input.practiceSessionMode ?? null,
    component: input.component ?? null,
  };
}

function detectBrowser(userAgent: string) {
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  return null;
}

function detectOS(userAgent: string) {
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac OS")) return "macOS";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  if (userAgent.includes("Linux")) return "Linux";
  return null;
}

import { MAX_REPORT_DIAGNOSTICS_BYTES, MAX_REPORT_MESSAGE_LENGTH } from "@/lib/beta-reports/report-types";
import { validateSubmitBetaReportRequest } from "@/lib/beta-reports/report-validation";

export const MAX_BETA_REPORT_REQUEST_BYTES = MAX_REPORT_MESSAGE_LENGTH + MAX_REPORT_DIAGNOSTICS_BYTES + 3000;

export function isJsonRequest(contentType: string | null) {
  return contentType?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

export function isSafeSameOrigin(origin: string | null, requestOrigin: string, configuredSiteUrl?: string) {
  if (!origin) return false;
  try {
    const normalizedOrigin = new URL(origin).origin;
    const allowedOrigin = configuredSiteUrl ? new URL(configuredSiteUrl).origin : new URL(requestOrigin).origin;
    return normalizedOrigin === allowedOrigin;
  } catch {
    return false;
  }
}

export function parseBetaReportBody(raw: string) {
  if (new TextEncoder().encode(raw).length > MAX_BETA_REPORT_REQUEST_BYTES) {
    return { ok: false as const, status: 413 as const, code: "too_large" as const, message: "That report is too large to submit." };
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false as const, status: 400 as const, code: "invalid_request" as const, message: "The report could not be read." };
  }
  const parsed = validateSubmitBetaReportRequest(value);
  if (!parsed.ok) return { ok: false as const, status: 400 as const, code: "invalid_request" as const, message: parsed.message };
  return { ok: true as const, request: parsed.request, diagnosticContext: parsed.request.diagnosticContext };
}

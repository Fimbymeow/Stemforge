import {
  BETA_REPORT_SCHEMA_VERSION,
  MAX_REPORT_DIAGNOSTICS_BYTES,
  MAX_REPORT_MESSAGE_LENGTH,
  type BetaReportKind,
  type BetaReportSeverity,
  type BetaReportStatus,
  type ReportDiagnosticContext,
  type SafeContentReference,
  type SubmitBetaReportRequest,
  type ReproductionStatus,
} from "@/lib/beta-reports/report-types";

const kinds: BetaReportKind[] = ["bug", "feedback", "support_request", "content_issue", "account_issue"];
const statuses: BetaReportStatus[] = ["new", "triaged", "in_progress", "resolved", "closed"];
const severities: BetaReportSeverity[] = ["low", "normal", "high", "critical"];
const reproductionStatuses: ReproductionStatus[] = ["not_checked", "unable_to_reproduce", "reproduced", "needs_more_information"];
const transitions: Record<BetaReportStatus, BetaReportStatus[]> = {
  new: ["triaged", "closed"],
  triaged: ["in_progress", "resolved", "closed"],
  in_progress: ["triaged", "resolved"],
  resolved: ["closed", "in_progress"],
  closed: ["triaged"],
};

export type ReportValidationResult =
  | { ok: true; request: SubmitBetaReportRequest }
  | { ok: false; reason: "invalid" | "too_large"; message: string };

export function validateSubmitBetaReportRequest(value: unknown): ReportValidationResult {
  if (!value || typeof value !== "object") return invalid("Report payload is invalid.");
  const input = value as Partial<SubmitBetaReportRequest> & Record<string, unknown>;
  if (input.schemaVersion !== BETA_REPORT_SCHEMA_VERSION) return invalid("Report schema is unsupported.");
  if (!isReportKind(input.kind)) return invalid("Choose a valid report type.");
  if (typeof input.honeypot === "string" && input.honeypot.trim()) return invalid("Report payload is invalid.");
  if (typeof input.userMessage !== "string" || input.userMessage.trim().length < 3) return invalid("Describe what happened.");
  if (input.userMessage.length > MAX_REPORT_MESSAGE_LENGTH) return tooLarge("Report message is too long.");
  if (input.contactEmail !== undefined && input.contactEmail !== null && !isEmail(input.contactEmail)) return invalid("Use a valid email address or leave it blank.");
  if (typeof input.pagePath !== "string" || !safePath(input.pagePath)) return invalid("Report page context is invalid.");
  const diagnostic = sanitizeDiagnosticContext(input.diagnosticContext);
  const diagnosticBytes = new TextEncoder().encode(JSON.stringify(diagnostic)).length;
  if (diagnosticBytes > MAX_REPORT_DIAGNOSTICS_BYTES) return tooLarge("Report diagnostics are too large.");
  return {
    ok: true,
    request: {
      schemaVersion: BETA_REPORT_SCHEMA_VERSION,
      kind: input.kind,
      userMessage: input.userMessage.trim(),
      contactEmail: input.contactEmail?.trim() || null,
      guestSessionId: typeof input.guestSessionId === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(input.guestSessionId) ? input.guestSessionId : null,
      pagePath: input.pagePath,
      pageArea: typeof input.pageArea === "string" ? bound(input.pageArea, 80) : null,
      diagnosticContext: diagnostic,
      honeypot: "",
    },
  };
}

export function sanitizeDiagnosticContext(value: unknown): ReportDiagnosticContext {
  const input = value && typeof value === "object" ? value as Partial<ReportDiagnosticContext> : {};
  return {
    appVersion: bound(stringOr(input.appVersion, "unknown"), 80),
    buildCommit: input.buildCommit && /^[a-f0-9]{7,40}$/i.test(input.buildCommit) ? input.buildCommit : null,
    environmentLabel: input.environmentLabel === "production" || input.environmentLabel === "preview" ? input.environmentLabel : "development",
    route: safePath(input.route) ? input.route! : "/",
    pageArea: typeof input.pageArea === "string" ? bound(input.pageArea, 80) : null,
    viewportCategory: input.viewportCategory === "mobile" || input.viewportCategory === "tablet" ? input.viewportCategory : "desktop",
    online: input.online === true,
    authState: input.authState === "authenticated" || input.authState === "expired" || input.authState === "disabled" ? input.authState : "guest",
    syncState: typeof input.syncState === "string" ? bound(input.syncState, 80) : null,
    accountGenerationState: typeof input.accountGenerationState === "string" ? bound(input.accountGenerationState, 80) : null,
    browserName: typeof input.browserName === "string" ? bound(input.browserName, 80) : null,
    browserVersion: typeof input.browserVersion === "string" ? bound(input.browserVersion, 80) : null,
    operatingSystem: typeof input.operatingSystem === "string" ? bound(input.operatingSystem, 80) : null,
    locale: typeof input.locale === "string" ? bound(input.locale, 40) : null,
    timezone: typeof input.timezone === "string" ? bound(input.timezone, 80) : null,
    contentReference: sanitizeContentReference(input.contentReference),
    errorCode: typeof input.errorCode === "string" && /^SF-[A-Z]+-\d{3}$/.test(input.errorCode) ? input.errorCode : null,
    practiceSessionMode: typeof input.practiceSessionMode === "string" ? bound(input.practiceSessionMode, 40) : null,
    component: typeof input.component === "string" ? bound(input.component, 80) : null,
  };
}

export function isReportKind(value: unknown): value is BetaReportKind {
  return typeof value === "string" && kinds.includes(value as BetaReportKind);
}

export function isReportStatus(value: unknown): value is BetaReportStatus {
  return typeof value === "string" && statuses.includes(value as BetaReportStatus);
}

export function isReportSeverity(value: unknown): value is BetaReportSeverity {
  return typeof value === "string" && severities.includes(value as BetaReportSeverity);
}

export function isReproductionStatus(value: unknown): value is ReproductionStatus {
  return typeof value === "string" && reproductionStatuses.includes(value as ReproductionStatus);
}

export function isValidReportTransition(from: BetaReportStatus, to: BetaReportStatus) {
  return from === to || transitions[from].includes(to);
}

export function sanitizeResolutionSummary(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? bound(trimmed, 2000) : null;
}

function sanitizeContentReference(value: unknown): SafeContentReference | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<SafeContentReference>;
  const output: SafeContentReference = {};
  for (const key of ["subjectId", "courseId", "pathId", "stageId", "questionId", "questionType"] as const) {
    if (typeof input[key] === "string" && /^[A-Za-z0-9_.:-]{1,120}$/.test(input[key]!)) output[key] = input[key];
  }
  if (Number.isInteger(input.questionVersion) && input.questionVersion! > 0) output.questionVersion = input.questionVersion;
  if (Number.isInteger(input.contentRevision) && input.contentRevision! > 0) output.contentRevision = input.contentRevision;
  return Object.keys(output).length ? output : null;
}

function invalid(message: string): ReportValidationResult { return { ok: false, reason: "invalid", message }; }
function tooLarge(message: string): ReportValidationResult { return { ok: false, reason: "too_large", message }; }
function bound(value: string, length: number) { return value.slice(0, length); }
function stringOr(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function isEmail(value: string) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) && value.length <= 254; }
function safePath(value: unknown): value is string { return typeof value === "string" && value.startsWith("/") && !value.includes("://") && value.length <= 300; }

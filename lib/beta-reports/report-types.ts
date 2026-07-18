export const BETA_REPORT_SCHEMA_VERSION = 1 as const;
export const BETA_REPORT_RECEIPTS_KEY = "stemforge.betaReportReceipts.v1";
export const BETA_REPORT_GUEST_ID_KEY = "stemforge.betaReportGuest.v1";
export const MAX_REPORT_MESSAGE_LENGTH = 2000;
export const MAX_REPORT_DIAGNOSTICS_BYTES = 5000;
export const MAX_REPORT_RECEIPTS = 20;

export type BetaReportKind = "bug" | "feedback" | "support_request" | "content_issue" | "account_issue";
export type BetaReportStatus = "new" | "triaged" | "in_progress" | "resolved" | "closed";
export type BetaReportSeverity = "low" | "normal" | "high" | "critical";
export type ReproductionStatus = "not_checked" | "unable_to_reproduce" | "reproduced" | "needs_more_information";

export type ReportViewportCategory = "mobile" | "tablet" | "desktop";
export type ReportAuthState = "guest" | "authenticated" | "expired" | "disabled";

export type SafeContentReference = {
  subjectId?: string;
  courseId?: string;
  pathId?: string;
  stageId?: string;
  questionId?: string;
  questionVersion?: number;
  contentRevision?: number;
  questionType?: string;
};

export type ReportDiagnosticContext = {
  appVersion: string;
  buildCommit: string | null;
  environmentLabel: "development" | "preview" | "production";
  route: string;
  pageArea: string | null;
  viewportCategory: ReportViewportCategory;
  online: boolean;
  authState: ReportAuthState;
  syncState: string | null;
  accountGenerationState: string | null;
  browserName: string | null;
  browserVersion: string | null;
  operatingSystem: string | null;
  locale: string | null;
  timezone: string | null;
  contentReference: SafeContentReference | null;
  errorCode: string | null;
  practiceSessionMode: string | null;
  component: string | null;
};

export type SubmitBetaReportRequest = {
  schemaVersion: typeof BETA_REPORT_SCHEMA_VERSION;
  kind: BetaReportKind;
  userMessage: string;
  contactEmail?: string | null;
  guestSessionId?: string | null;
  pagePath: string;
  pageArea?: string | null;
  diagnosticContext: ReportDiagnosticContext;
  honeypot?: string;
};

export type SubmitBetaReportResult =
  | { status: "accepted"; reportId: string }
  | { status: "rejected"; reason: "invalid_request" | "forbidden" | "too_large" | "rate_limited" | "temporarily_unavailable"; message: string };

export type BetaReportReceipt = {
  reportId: string;
  kind: BetaReportKind;
  createdAt: string;
  pageArea: string | null;
  source: "guest" | "authenticated";
  status: BetaReportStatus;
};

export type StoredBetaReport = {
  reportId: string;
  schemaVersion: number;
  kind: BetaReportKind;
  status: BetaReportStatus;
  ownerId: string | null;
  guestSessionId: string | null;
  contactEmail: string | null;
  userMessage: string;
  pagePath: string;
  pageArea: string | null;
  appVersion: string;
  contentContext: SafeContentReference | null;
  diagnosticContext: ReportDiagnosticContext;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolutionSummary: string | null;
  severity: BetaReportSeverity;
  reproductionStatus: ReproductionStatus;
  duplicateOf: string | null;
  stateVersion: number;
  triagedAt: string | null;
  lastReviewedAt: string | null;
};

export type LearnerBetaReportStatus = Pick<StoredBetaReport,
  "reportId" | "kind" | "status" | "createdAt" | "updatedAt" | "resolvedAt"
> & { resolutionSummary: string | null; closedAsDuplicate: boolean };

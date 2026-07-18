import "server-only";

import { randomBytes } from "node:crypto";
import type { Pool } from "pg";
import {
  BETA_REPORT_SCHEMA_VERSION,
  type BetaReportKind,
  type BetaReportSeverity,
  type BetaReportStatus,
  type ReportDiagnosticContext,
  type ReproductionStatus,
  type StoredBetaReport,
  type SubmitBetaReportRequest,
} from "@/lib/beta-reports/report-types";
import { isValidReportTransition, sanitizeResolutionSummary } from "@/lib/beta-reports/report-validation";

const MAX_REPORTS_PER_HOUR = 5;
const MAX_REPORTS_PER_DAY = 20;

export class BetaReportRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many beta reports have been submitted recently.");
    this.name = "BetaReportRateLimitError";
  }
}

export class BetaReportAccessError extends Error {
  constructor(message = "Beta report access is not authorized.") {
    super(message);
    this.name = "BetaReportAccessError";
  }
}

export class PostgresBetaReportRepository {
  constructor(private readonly pool: Pool) {}

  async createReport(input: {
    request: SubmitBetaReportRequest;
    ownerId: string | null;
    diagnosticContext: ReportDiagnosticContext;
  }) {
    await this.assertWithinRateLimit(input.ownerId, input.request.guestSessionId ?? null);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const reportId = createReportId();
      try {
        const result = await this.pool.query<{ report_id: string }>(`
          INSERT INTO stemforge_operations.beta_reports (
            report_id, schema_version, kind, owner_id, guest_session_id, contact_email,
            user_message, page_path, page_area, app_version, content_context, diagnostic_context
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)
          RETURNING report_id
        `, [
          reportId,
          BETA_REPORT_SCHEMA_VERSION,
          input.request.kind,
          input.ownerId,
          input.request.guestSessionId ?? null,
          input.request.contactEmail ?? null,
          input.request.userMessage,
          input.request.pagePath,
          input.diagnosticContext.pageArea ?? null,
          input.diagnosticContext.appVersion,
          input.diagnosticContext.contentReference ? JSON.stringify(input.diagnosticContext.contentReference) : null,
          JSON.stringify(input.diagnosticContext),
        ]);
        return result.rows[0].report_id;
      } catch (cause) {
        if (isUniqueViolation(cause)) continue;
        throw cause;
      }
    }
    throw new Error("Could not allocate a unique beta report id.");
  }

  async listReports(options: { status?: BetaReportStatus; limit?: number } = {}) {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const parameters: unknown[] = [];
    const where = options.status ? "WHERE status = $1" : "";
    if (options.status) parameters.push(options.status);
    parameters.push(limit);
    const result = await this.pool.query<ReportRow>(`
      SELECT * FROM stemforge_operations.beta_reports
      ${where}
      ORDER BY created_at DESC
      LIMIT $${parameters.length}
    `, parameters);
    return result.rows.map(mapReportRow);
  }

  async getReport(reportId: string) {
    const result = await this.pool.query<ReportRow>(
      "SELECT * FROM stemforge_operations.beta_reports WHERE report_id = $1",
      [reportId],
    );
    return result.rows[0] ? mapReportRow(result.rows[0]) : null;
  }

  async updateStatus(reportId: string, status: BetaReportStatus, resolutionSummary?: string | null) {
    const current = await this.getReport(reportId);
    if (!current) return null;
    if (!isValidReportTransition(current.status, status)) {
      throw new BetaReportAccessError(`Invalid beta report status transition from ${current.status} to ${status}.`);
    }
    const summary = status === "resolved" || status === "closed" ? sanitizeResolutionSummary(resolutionSummary) : null;
    const result = await this.pool.query<ReportRow>(`
      UPDATE stemforge_operations.beta_reports
      SET status = $2,
          resolution_summary = $3,
          resolved_at = CASE WHEN $2 IN ('resolved', 'closed') THEN COALESCE(resolved_at, clock_timestamp()) ELSE NULL END,
          updated_at = clock_timestamp(),
          state_version = state_version + 1,
          last_reviewed_at = clock_timestamp()
      WHERE report_id = $1
      RETURNING *
    `, [reportId, status, summary]);
    return result.rows[0] ? mapReportRow(result.rows[0]) : null;
  }

  private async assertWithinRateLimit(ownerId: string | null, guestSessionId: string | null) {
    if (!ownerId && !guestSessionId) return;
    const column = ownerId ? "owner_id" : "guest_session_id";
    const value = ownerId ?? guestSessionId;
    const result = await this.pool.query<{ hour_count: string; day_count: string }>(`
      SELECT
        count(*) FILTER (WHERE created_at >= clock_timestamp() - interval '1 hour')::text AS hour_count,
        count(*) FILTER (WHERE created_at >= clock_timestamp() - interval '1 day')::text AS day_count
      FROM stemforge_operations.beta_reports
      WHERE ${column} = $1
    `, [value]);
    const hourCount = Number(result.rows[0]?.hour_count ?? 0);
    const dayCount = Number(result.rows[0]?.day_count ?? 0);
    if (hourCount >= MAX_REPORTS_PER_HOUR) throw new BetaReportRateLimitError(3600);
    if (dayCount >= MAX_REPORTS_PER_DAY) throw new BetaReportRateLimitError(86400);
  }
}

function createReportId() {
  return `SF-${randomBytes(8).toString("base64url").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 10).padEnd(10, "0")}`;
}

function isUniqueViolation(cause: unknown) {
  return typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505";
}

type ReportRow = {
  report_id: string;
  schema_version: number;
  kind: BetaReportKind;
  status: BetaReportStatus;
  owner_id: string | null;
  guest_session_id: string | null;
  contact_email: string | null;
  user_message: string;
  page_path: string;
  page_area: string | null;
  app_version: string;
  content_context: StoredBetaReport["contentContext"];
  diagnostic_context: ReportDiagnosticContext;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
  resolution_summary: string | null;
  severity: BetaReportSeverity;
  reproduction_status: ReproductionStatus;
  duplicate_of: string | null;
  state_version: number;
  triaged_at: Date | null;
  last_reviewed_at: Date | null;
};

function mapReportRow(row: ReportRow): StoredBetaReport {
  return {
    reportId: row.report_id,
    schemaVersion: row.schema_version,
    kind: row.kind,
    status: row.status,
    ownerId: row.owner_id,
    guestSessionId: row.guest_session_id,
    contactEmail: row.contact_email,
    userMessage: row.user_message,
    pagePath: row.page_path,
    pageArea: row.page_area,
    appVersion: row.app_version,
    contentContext: row.content_context,
    diagnosticContext: row.diagnostic_context,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    resolvedAt: row.resolved_at?.toISOString() ?? null,
    resolutionSummary: row.resolution_summary,
    severity: row.severity,
    reproductionStatus: row.reproduction_status,
    duplicateOf: row.duplicate_of,
    stateVersion: row.state_version,
    triagedAt: row.triaged_at?.toISOString() ?? null,
    lastReviewedAt: row.last_reviewed_at?.toISOString() ?? null,
  };
}

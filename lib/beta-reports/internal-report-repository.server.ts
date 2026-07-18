import "server-only";

import type { Pool, PoolClient } from "pg";
import type {
  BetaReportKind,
  BetaReportSeverity,
  BetaReportStatus,
  LearnerBetaReportStatus,
  ReportDiagnosticContext,
  ReproductionStatus,
  SafeContentReference,
  StoredBetaReport,
} from "@/lib/beta-reports/report-types";
import {
  decodeInternalReportCursor,
  encodeInternalReportCursor,
  type InternalReportFilters,
  type InternalReportSort,
} from "@/lib/beta-reports/internal-query-types";
import { validateWorkflowChange, type UpdateBetaReportWorkflowRequest, type WorkflowState } from "@/lib/beta-reports/report-workflow";

export type InternalBetaReportListItem = {
  reportId: string;
  kind: BetaReportKind;
  severity: BetaReportSeverity;
  status: BetaReportStatus;
  reproductionStatus: ReproductionStatus;
  pageArea: string | null;
  source: "authenticated" | "guest";
  messagePreview: string;
  createdAt: string;
  updatedAt: string;
  duplicateOf: string | null;
  stateVersion: number;
};

export type InternalReportPage = { reports: InternalBetaReportListItem[]; nextCursor: string | null };

export type InternalOperationalSummary = {
  windowDays: 30;
  newReports: number;
  urgentUnresolved: number;
  awaitingTriage: number;
  inProgress: number;
  resolvedLastSevenDays: number;
  kindCounts: Partial<Record<BetaReportKind, number>>;
};

type SafeWorkflowAuditState = {
  status: BetaReportStatus;
  severity: BetaReportSeverity;
  reproductionStatus: ReproductionStatus;
  duplicateOf: string | null;
  hasResolutionSummary: boolean;
  stateVersion: number;
};

export type InternalReportAuditEvent = {
  actionType: "workflow_updated";
  previousState: SafeWorkflowAuditState;
  nextState: SafeWorkflowAuditState;
  createdAt: string;
};

export class InternalReportNotFoundError extends Error {}
export class InternalReportConflictError extends Error {}
export class InternalReportWorkflowError extends Error {}

export class PostgresInternalBetaReportRepository {
  constructor(private readonly pool: Pool) {}

  async listBetaReports(filters: InternalReportFilters): Promise<InternalReportPage> {
    const parameters: unknown[] = [];
    const where: string[] = [];
    const add = (value: unknown) => { parameters.push(value); return `$${parameters.length}`; };
    if (filters.status) where.push(`status = ${add(filters.status)}`);
    if (filters.kind) where.push(`kind = ${add(filters.kind)}`);
    if (filters.severity) where.push(`severity = ${add(filters.severity)}`);
    if (filters.reproductionStatus) where.push(`reproduction_status = ${add(filters.reproductionStatus)}`);
    if (filters.source === "authenticated") where.push("owner_id IS NOT NULL");
    if (filters.source === "guest") where.push("owner_id IS NULL");
    if (filters.pageArea) where.push(`page_area = ${add(filters.pageArea)}`);
    if (filters.createdFrom) where.push(`created_at >= ${add(filters.createdFrom)}::date`);
    if (filters.createdTo) where.push(`created_at < (${add(filters.createdTo)}::date + interval '1 day')`);
    if (filters.search) {
      if (/^SF-[A-Z0-9]{10}$/.test(filters.search.toUpperCase())) {
        where.push(`report_id = ${add(filters.search.toUpperCase())}`);
      } else {
        const token = add(`%${escapeLike(filters.search)}%`);
        where.push(`(
          user_message ILIKE ${token} ESCAPE '\\'
          OR COALESCE(content_context->>'questionId', '') ILIKE ${token} ESCAPE '\\'
          OR COALESCE(diagnostic_context->>'errorCode', '') ILIKE ${token} ESCAPE '\\'
        )`);
      }
    }
    const cursor = filters.cursor ? decodeInternalReportCursor(filters.cursor, filters.sort) : null;
    if (cursor) addCursorWhere(where, parameters, cursor);
    const limit = add(filters.pageSize + 1);
    const result = await this.pool.query<ListRow>(`
      SELECT report_id, kind, severity, status, reproduction_status, page_area,
        CASE WHEN owner_id IS NULL THEN 'guest' ELSE 'authenticated' END AS source,
        left(user_message, 160) AS message_preview, created_at, updated_at,
        duplicate_of, state_version,
        CASE severity WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'normal' THEN 2 ELSE 1 END AS severity_rank
      FROM stemforge_operations.beta_reports
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY ${orderSql(filters.sort)}
      LIMIT ${limit}
    `, parameters);
    const hasMore = result.rows.length > filters.pageSize;
    const rows = result.rows.slice(0, filters.pageSize);
    return {
      reports: rows.map(mapListRow),
      nextCursor: hasMore && rows.at(-1) ? encodeInternalReportCursor(cursorFor(rows.at(-1)!, filters.sort)) : null,
    };
  }

  async getOperationalSummary(): Promise<InternalOperationalSummary> {
    const counts = await this.pool.query<SummaryRow>(`
      SELECT
        count(*) FILTER (WHERE status = 'new' AND created_at >= clock_timestamp() - interval '30 days')::int AS new_reports,
        count(*) FILTER (WHERE severity IN ('high', 'critical') AND status NOT IN ('resolved', 'closed') AND created_at >= clock_timestamp() - interval '30 days')::int AS urgent_unresolved,
        count(*) FILTER (WHERE triaged_at IS NULL AND status = 'new' AND created_at >= clock_timestamp() - interval '30 days')::int AS awaiting_triage,
        count(*) FILTER (WHERE status = 'in_progress' AND created_at >= clock_timestamp() - interval '30 days')::int AS in_progress,
        count(*) FILTER (WHERE status IN ('resolved', 'closed') AND resolved_at >= clock_timestamp() - interval '7 days')::int AS resolved_last_seven_days
      FROM stemforge_operations.beta_reports
    `);
    const kinds = await this.pool.query<{ kind: BetaReportKind; count: number }>(`
      SELECT kind, count(*)::int AS count FROM stemforge_operations.beta_reports
      WHERE created_at >= clock_timestamp() - interval '30 days'
      GROUP BY kind ORDER BY kind
    `);
    const row = counts.rows[0];
    return {
      windowDays: 30,
      newReports: row.new_reports,
      urgentUnresolved: row.urgent_unresolved,
      awaitingTriage: row.awaiting_triage,
      inProgress: row.in_progress,
      resolvedLastSevenDays: row.resolved_last_seven_days,
      kindCounts: Object.fromEntries(kinds.rows.map((item) => [item.kind, item.count])),
    };
  }

  async getBetaReport(reportId: string) {
    const result = await this.pool.query<ReportRow>("SELECT * FROM stemforge_operations.beta_reports WHERE report_id = $1", [reportId]);
    return result.rows[0] ? mapReportRow(result.rows[0]) : null;
  }

  async listAuditEvents(reportId: string, limit = 20): Promise<InternalReportAuditEvent[]> {
    const result = await this.pool.query<AuditRow>(`
      SELECT action_type, previous_state, next_state, created_at
      FROM stemforge_operations.beta_report_audit
      WHERE report_id = $1 ORDER BY created_at DESC, audit_id DESC LIMIT $2
    `, [reportId, Math.min(Math.max(limit, 1), 50)]);
    return result.rows.map((row) => ({
      actionType: row.action_type,
      previousState: row.previous_state,
      nextState: row.next_state,
      createdAt: row.created_at.toISOString(),
    }));
  }

  async listLearnerReports(ownerId: string, limit = 20): Promise<LearnerBetaReportStatus[]> {
    const result = await this.pool.query<LearnerRow>(`
      SELECT report_id, kind, status, created_at, updated_at, resolved_at,
        CASE WHEN status IN ('resolved', 'closed') THEN resolution_summary ELSE NULL END AS resolution_summary,
        duplicate_of IS NOT NULL AS closed_as_duplicate
      FROM stemforge_operations.beta_reports
      WHERE owner_id = $1 ORDER BY created_at DESC, report_id DESC LIMIT $2
    `, [ownerId, Math.min(Math.max(limit, 1), 50)]);
    return result.rows.map((row) => ({
      reportId: row.report_id, kind: row.kind, status: row.status,
      createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
      resolvedAt: row.resolved_at?.toISOString() ?? null,
      resolutionSummary: row.resolution_summary, closedAsDuplicate: row.closed_as_duplicate,
    }));
  }

  async updateWorkflow(reportId: string, actorOwnerId: string, update: UpdateBetaReportWorkflowRequest) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<ReportRow>("SELECT * FROM stemforge_operations.beta_reports WHERE report_id = $1 FOR UPDATE", [reportId]);
      if (!result.rows[0]) throw new InternalReportNotFoundError("Report was not found.");
      const current = mapReportRow(result.rows[0]);
      if (current.stateVersion !== update.expectedVersion) throw new InternalReportConflictError("Report changed since it was opened.");
      const workflowError = validateWorkflowChange(workflowState(current), update);
      if (workflowError) throw new InternalReportWorkflowError(workflowError);
      if (update.duplicateOf !== undefined && update.duplicateOf !== null) await assertValidDuplicateTarget(client, reportId, update.duplicateOf);
      const next = await client.query<ReportRow>(`
        UPDATE stemforge_operations.beta_reports
        SET status = CASE WHEN $2::boolean THEN $3 ELSE status END,
            severity = CASE WHEN $4::boolean THEN $5 ELSE severity END,
            reproduction_status = CASE WHEN $6::boolean THEN $7 ELSE reproduction_status END,
            duplicate_of = CASE WHEN $8::boolean THEN $9 ELSE duplicate_of END,
            resolution_summary = CASE WHEN $10::boolean THEN $11 ELSE resolution_summary END,
            triaged_at = CASE WHEN $2::boolean AND $3 = 'triaged' THEN COALESCE(triaged_at, clock_timestamp()) ELSE triaged_at END,
            resolved_at = CASE
              WHEN $2::boolean AND $3 IN ('resolved', 'closed') THEN COALESCE(resolved_at, clock_timestamp())
              WHEN $2::boolean AND $3 IN ('triaged', 'in_progress') THEN NULL
              ELSE resolved_at END,
            last_reviewed_at = clock_timestamp(), updated_at = clock_timestamp(), state_version = state_version + 1
        WHERE report_id = $1 AND state_version = $12 RETURNING *
      `, [
        reportId,
        update.status !== undefined, update.status ?? null,
        update.severity !== undefined, update.severity ?? null,
        update.reproductionStatus !== undefined, update.reproductionStatus ?? null,
        update.duplicateOf !== undefined, update.duplicateOf ?? null,
        update.resolutionSummary !== undefined, update.resolutionSummary ?? null,
        update.expectedVersion,
      ]);
      if (!next.rows[0]) throw new InternalReportConflictError("Report changed since it was opened.");
      const updated = mapReportRow(next.rows[0]);
      await client.query(`
        INSERT INTO stemforge_operations.beta_report_audit
          (report_id, action_type, previous_state, next_state, actor_owner_id)
        VALUES ($1, 'workflow_updated', $2::jsonb, $3::jsonb, $4)
      `, [reportId, JSON.stringify(auditState(current)), JSON.stringify(auditState(updated)), actorOwnerId]);
      await client.query("COMMIT");
      return updated;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

async function assertValidDuplicateTarget(client: PoolClient, reportId: string, duplicateOf: string) {
  const target = await client.query("SELECT 1 FROM stemforge_operations.beta_reports WHERE report_id = $1", [duplicateOf]);
  if (!target.rowCount) throw new InternalReportWorkflowError("Duplicate target does not exist.");
  const cycle = await client.query<{ cycle: boolean }>(`
    WITH RECURSIVE chain AS (
      SELECT report_id, duplicate_of FROM stemforge_operations.beta_reports WHERE report_id = $1
      UNION ALL
      SELECT report.report_id, report.duplicate_of FROM stemforge_operations.beta_reports report
      JOIN chain ON report.report_id = chain.duplicate_of
    ) SELECT EXISTS(SELECT 1 FROM chain WHERE report_id = $2) AS cycle
  `, [duplicateOf, reportId]);
  if (cycle.rows[0].cycle) throw new InternalReportWorkflowError("Duplicate relationship would create a cycle.");
}

function addCursorWhere(where: string[], parameters: unknown[], cursor: NonNullable<ReturnType<typeof decodeInternalReportCursor>>) {
  const add = (value: unknown) => { parameters.push(value); return `$${parameters.length}`; };
  const primary = add(cursor.primary);
  const reportId = add(cursor.reportId);
  if (cursor.sort === "newest") where.push(`(created_at, report_id) < (${primary}::timestamptz, ${reportId})`);
  if (cursor.sort === "oldest") where.push(`(created_at, report_id) > (${primary}::timestamptz, ${reportId})`);
  if (cursor.sort === "updated") where.push(`(updated_at, report_id) < (${primary}::timestamptz, ${reportId})`);
  if (cursor.sort === "severity") {
    const rank = add(cursor.severityRank);
    where.push(`(CASE severity WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'normal' THEN 2 ELSE 1 END < ${rank}
      OR (CASE severity WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'normal' THEN 2 ELSE 1 END = ${rank}
      AND (created_at, report_id) < (${primary}::timestamptz, ${reportId})))`);
  }
}

function orderSql(sort: InternalReportSort) {
  if (sort === "oldest") return "created_at ASC, report_id ASC";
  if (sort === "updated") return "updated_at DESC, report_id DESC";
  if (sort === "severity") return "CASE severity WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'normal' THEN 2 ELSE 1 END DESC, created_at DESC, report_id DESC";
  return "created_at DESC, report_id DESC";
}

function cursorFor(row: ListRow, sort: InternalReportSort) {
  return { sort, primary: (sort === "updated" ? row.updated_at : row.created_at).toISOString(), reportId: row.report_id,
    ...(sort === "severity" ? { severityRank: row.severity_rank } : {}) };
}

function escapeLike(value: string) { return value.replace(/[\\%_]/g, (character) => `\\${character}`); }

function workflowState(report: StoredBetaReport): WorkflowState {
  return { reportId: report.reportId, status: report.status, severity: report.severity,
    reproductionStatus: report.reproductionStatus, duplicateOf: report.duplicateOf,
    resolutionSummary: report.resolutionSummary, stateVersion: report.stateVersion };
}

function auditState(report: StoredBetaReport): SafeWorkflowAuditState {
  return { status: report.status, severity: report.severity, reproductionStatus: report.reproductionStatus,
    duplicateOf: report.duplicateOf, hasResolutionSummary: Boolean(report.resolutionSummary), stateVersion: report.stateVersion };
}

function mapListRow(row: ListRow): InternalBetaReportListItem {
  return { reportId: row.report_id, kind: row.kind, severity: row.severity, status: row.status,
    reproductionStatus: row.reproduction_status, pageArea: row.page_area, source: row.source,
    messagePreview: row.message_preview, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
    duplicateOf: row.duplicate_of, stateVersion: row.state_version };
}

function mapReportRow(row: ReportRow): StoredBetaReport {
  return {
    reportId: row.report_id, schemaVersion: row.schema_version, kind: row.kind, status: row.status,
    ownerId: row.owner_id, guestSessionId: row.guest_session_id, contactEmail: row.contact_email,
    userMessage: row.user_message, pagePath: row.page_path, pageArea: row.page_area, appVersion: row.app_version,
    contentContext: row.content_context, diagnosticContext: row.diagnostic_context,
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
    resolvedAt: row.resolved_at?.toISOString() ?? null, resolutionSummary: row.resolution_summary,
    severity: row.severity, reproductionStatus: row.reproduction_status, duplicateOf: row.duplicate_of,
    stateVersion: row.state_version, triagedAt: row.triaged_at?.toISOString() ?? null,
    lastReviewedAt: row.last_reviewed_at?.toISOString() ?? null,
  };
}

type ListRow = { report_id: string; kind: BetaReportKind; severity: BetaReportSeverity; status: BetaReportStatus;
  reproduction_status: ReproductionStatus; page_area: string | null; source: "authenticated" | "guest";
  message_preview: string; created_at: Date; updated_at: Date; duplicate_of: string | null; state_version: number; severity_rank: number };
type SummaryRow = { new_reports: number; urgent_unresolved: number; awaiting_triage: number; in_progress: number; resolved_last_seven_days: number };
type ReportRow = { report_id: string; schema_version: number; kind: BetaReportKind; status: BetaReportStatus;
  owner_id: string | null; guest_session_id: string | null; contact_email: string | null; user_message: string;
  page_path: string; page_area: string | null; app_version: string; content_context: SafeContentReference | null;
  diagnostic_context: ReportDiagnosticContext; created_at: Date; updated_at: Date; resolved_at: Date | null;
  resolution_summary: string | null; severity: BetaReportSeverity; reproduction_status: ReproductionStatus;
  duplicate_of: string | null; state_version: number; triaged_at: Date | null; last_reviewed_at: Date | null };
type AuditRow = { action_type: "workflow_updated"; previous_state: SafeWorkflowAuditState; next_state: SafeWorkflowAuditState; created_at: Date };
type LearnerRow = { report_id: string; kind: BetaReportKind; status: BetaReportStatus; created_at: Date; updated_at: Date;
  resolved_at: Date | null; resolution_summary: string | null; closed_as_duplicate: boolean };

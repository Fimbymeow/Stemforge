import type { BetaReportSeverity, BetaReportStatus, ReproductionStatus } from "@/lib/beta-reports/report-types";
import { isReportSeverity, isReportStatus, isReproductionStatus, isValidReportTransition } from "@/lib/beta-reports/report-validation";

export const MAX_RESOLUTION_SUMMARY_LENGTH = 2000;
export const MAX_INTERNAL_UPDATE_BYTES = 5000;

export type UpdateBetaReportWorkflowRequest = {
  expectedVersion: number;
  status?: BetaReportStatus;
  severity?: BetaReportSeverity;
  reproductionStatus?: ReproductionStatus;
  duplicateOf?: string | null;
  resolutionSummary?: string | null;
};

export type WorkflowState = {
  reportId: string;
  status: BetaReportStatus;
  severity: BetaReportSeverity;
  reproductionStatus: ReproductionStatus;
  duplicateOf: string | null;
  resolutionSummary: string | null;
  stateVersion: number;
};

export type WorkflowValidationResult =
  | { ok: true; update: UpdateBetaReportWorkflowRequest }
  | { ok: false; reason: string };

export function parseWorkflowUpdate(value: unknown): WorkflowValidationResult {
  if (!value || typeof value !== "object") return invalid("Workflow update is invalid.");
  const input = value as Record<string, unknown>;
  const allowed = new Set(["expectedVersion", "status", "severity", "reproductionStatus", "duplicateOf", "resolutionSummary"]);
  if (Object.keys(input).some((key) => !allowed.has(key))) return invalid("Workflow update contains unsupported fields.");
  if (!Number.isInteger(input.expectedVersion) || Number(input.expectedVersion) < 1) return invalid("Expected version is required.");
  if (input.status !== undefined && !isReportStatus(input.status)) return invalid("Status is invalid.");
  if (input.severity !== undefined && !isReportSeverity(input.severity)) return invalid("Severity is invalid.");
  if (input.reproductionStatus !== undefined && !isReproductionStatus(input.reproductionStatus)) return invalid("Reproduction status is invalid.");
  if (input.duplicateOf !== undefined && input.duplicateOf !== null && (typeof input.duplicateOf !== "string" || !/^SF-[A-Z0-9]{10}$/.test(input.duplicateOf))) return invalid("Duplicate report reference is invalid.");
  if (input.resolutionSummary !== undefined && input.resolutionSummary !== null && typeof input.resolutionSummary !== "string") return invalid("Resolution summary is invalid.");
  const resolutionSummary = typeof input.resolutionSummary === "string" ? input.resolutionSummary.trim() || null : input.resolutionSummary as null | undefined;
  if (resolutionSummary && resolutionSummary.length > MAX_RESOLUTION_SUMMARY_LENGTH) return invalid("Resolution summary is too long.");
  if (["expectedVersion"].every((key) => key in input) && Object.keys(input).length === 1) return invalid("Choose at least one workflow change.");
  return {
    ok: true,
    update: {
      expectedVersion: Number(input.expectedVersion),
      ...(input.status !== undefined ? { status: input.status as BetaReportStatus } : {}),
      ...(input.severity !== undefined ? { severity: input.severity as BetaReportSeverity } : {}),
      ...(input.reproductionStatus !== undefined ? { reproductionStatus: input.reproductionStatus as ReproductionStatus } : {}),
      ...(input.duplicateOf !== undefined ? { duplicateOf: input.duplicateOf as string | null } : {}),
      ...(input.resolutionSummary !== undefined ? { resolutionSummary: resolutionSummary ?? null } : {}),
    },
  };
}

export function validateWorkflowChange(current: WorkflowState, update: UpdateBetaReportWorkflowRequest): string | null {
  const nextStatus = update.status ?? current.status;
  const nextDuplicate = update.duplicateOf === undefined ? current.duplicateOf : update.duplicateOf;
  const nextSummary = update.resolutionSummary === undefined ? current.resolutionSummary : update.resolutionSummary;
  if (update.status && !isValidReportTransition(current.status, update.status)) return `Invalid status transition from ${current.status} to ${update.status}.`;
  if (nextDuplicate === current.reportId) return "A report cannot duplicate itself.";
  if (nextStatus === "resolved" && !nextSummary) return "A resolution summary is required before resolving a report.";
  if (nextStatus === "closed" && !nextDuplicate && !nextSummary) return "A closure explanation or duplicate report is required before closing a report.";
  return null;
}

function invalid(reason: string): WorkflowValidationResult {
  return { ok: false, reason };
}

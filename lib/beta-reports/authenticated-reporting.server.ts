import "server-only";

import type { Pool } from "pg";
import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";
import { PostgresBetaReportRepository } from "@/lib/beta-reports/report-repository.server";
import type { ReportDiagnosticContext, SubmitBetaReportRequest } from "@/lib/beta-reports/report-types";

export async function submitBetaReport(request: SubmitBetaReportRequest, diagnosticContext: ReportDiagnosticContext, pool: Pool) {
  const ownerId = await resolveOptionalOwner();
  const repository = new PostgresBetaReportRepository(pool);
  return repository.createReport({ request, ownerId, diagnosticContext });
}

async function resolveOptionalOwner() {
  if (getAuthFeatureConfiguration().status !== "enabled") return null;
  try {
    const result = await resolveCurrentAuthenticatedOwner();
    return result.authenticated ? result.ownerId : null;
  } catch {
    return null;
  }
}

import type { BetaReportKind, BetaReportSeverity, BetaReportStatus, ReproductionStatus } from "@/lib/beta-reports/report-types";
import { isReportKind, isReportSeverity, isReportStatus, isReproductionStatus } from "@/lib/beta-reports/report-validation";

export const INTERNAL_REPORT_DEFAULT_PAGE_SIZE = 25;
export const INTERNAL_REPORT_MAX_PAGE_SIZE = 100;

export type InternalReportSource = "authenticated" | "guest";
export type InternalReportSort = "newest" | "oldest" | "severity" | "updated";

export type InternalReportFilters = {
  status: BetaReportStatus | null;
  kind: BetaReportKind | null;
  severity: BetaReportSeverity | null;
  reproductionStatus: ReproductionStatus | null;
  source: InternalReportSource | null;
  pageArea: string | null;
  search: string | null;
  createdFrom: string | null;
  createdTo: string | null;
  sort: InternalReportSort;
  pageSize: number;
  cursor: string | null;
};

export type InternalReportCursor = {
  sort: InternalReportSort;
  primary: string;
  reportId: string;
  severityRank?: number;
};

export type InternalFilterResult =
  | { ok: true; filters: InternalReportFilters }
  | { ok: false; reason: string };

type SearchParameters = Record<string, string | string[] | undefined>;

export function parseInternalReportFilters(input: SearchParameters, defaultStatus: BetaReportStatus | null = "new"): InternalFilterResult {
  const one = (name: string) => single(input[name]);
  const statusValue = one("status");
  const kindValue = one("kind");
  const severityValue = one("severity");
  const reproductionValue = one("reproduction");
  const sourceValue = one("source");
  const sortValue = one("sort") ?? "newest";
  if (statusValue && statusValue !== "all" && !isReportStatus(statusValue)) return invalid("Invalid status filter.");
  if (kindValue && kindValue !== "all" && !isReportKind(kindValue)) return invalid("Invalid kind filter.");
  if (severityValue && severityValue !== "all" && !isReportSeverity(severityValue)) return invalid("Invalid severity filter.");
  if (reproductionValue && reproductionValue !== "all" && !isReproductionStatus(reproductionValue)) return invalid("Invalid reproduction filter.");
  if (sourceValue && sourceValue !== "all" && sourceValue !== "authenticated" && sourceValue !== "guest") return invalid("Invalid source filter.");
  if (!isInternalReportSort(sortValue)) return invalid("Invalid sort order.");
  const pageArea = boundedToken(one("pageArea"), 80);
  if (one("pageArea") && !pageArea) return invalid("Invalid page-area filter.");
  const search = one("search")?.trim() || null;
  if (search && (search.length < 3 || search.length > 80 || /[\u0000-\u001f]/.test(search))) return invalid("Search must contain 3 to 80 safe characters.");
  const createdFrom = dateValue(one("from"));
  const createdTo = dateValue(one("to"));
  if (one("from") && !createdFrom) return invalid("Invalid start date.");
  if (one("to") && !createdTo) return invalid("Invalid end date.");
  if (createdFrom && createdTo && createdFrom > createdTo) return invalid("Start date must not be after end date.");
  const rawPageSize = one("pageSize");
  const pageSize = rawPageSize ? Number(rawPageSize) : INTERNAL_REPORT_DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > INTERNAL_REPORT_MAX_PAGE_SIZE) return invalid("Invalid page size.");
  const cursor = one("cursor") ?? null;
  if (cursor && !decodeInternalReportCursor(cursor, sortValue)) return invalid("Invalid pagination cursor.");
  return {
    ok: true,
    filters: {
      status: statusValue === "all" ? null : statusValue && isReportStatus(statusValue) ? statusValue : defaultStatus,
      kind: kindValue === "all" ? null : kindValue && isReportKind(kindValue) ? kindValue : null,
      severity: severityValue === "all" ? null : severityValue && isReportSeverity(severityValue) ? severityValue : null,
      reproductionStatus: reproductionValue === "all" ? null : reproductionValue && isReproductionStatus(reproductionValue) ? reproductionValue : null,
      source: sourceValue === "authenticated" || sourceValue === "guest" ? sourceValue : null,
      pageArea,
      search,
      createdFrom,
      createdTo,
      sort: sortValue,
      pageSize,
      cursor,
    },
  };
}

export function encodeInternalReportCursor(cursor: InternalReportCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeInternalReportCursor(value: string, expectedSort: InternalReportSort): InternalReportCursor | null {
  if (!/^[A-Za-z0-9_-]{8,400}$/.test(value)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<InternalReportCursor>;
    if (parsed.sort !== expectedSort || !isInternalReportSort(parsed.sort)) return null;
    if (typeof parsed.primary !== "string" || Number.isNaN(Date.parse(parsed.primary))) return null;
    if (typeof parsed.reportId !== "string" || !/^SF-[A-Z0-9]{10}$/.test(parsed.reportId)) return null;
    if (parsed.sort === "severity" && (!Number.isInteger(parsed.severityRank) || parsed.severityRank! < 1 || parsed.severityRank! > 4)) return null;
    return parsed as InternalReportCursor;
  } catch {
    return null;
  }
}

export function isInternalReportSort(value: unknown): value is InternalReportSort {
  return value === "newest" || value === "oldest" || value === "severity" || value === "updated";
}

export function internalFiltersToSearchParams(filters: InternalReportFilters, includeCursor = true) {
  const params = new URLSearchParams();
  params.set("status", filters.status ?? "all");
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.reproductionStatus) params.set("reproduction", filters.reproductionStatus);
  if (filters.source) params.set("source", filters.source);
  if (filters.pageArea) params.set("pageArea", filters.pageArea);
  if (filters.search) params.set("search", filters.search);
  if (filters.createdFrom) params.set("from", filters.createdFrom);
  if (filters.createdTo) params.set("to", filters.createdTo);
  params.set("sort", filters.sort);
  params.set("pageSize", String(filters.pageSize));
  if (includeCursor && filters.cursor) params.set("cursor", filters.cursor);
  return params;
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? null : value ?? null;
}

function boundedToken(value: string | null, max: number) {
  if (!value) return null;
  const trimmed = value.trim();
  return /^[A-Za-z0-9_.:/-]+$/.test(trimmed) && trimmed.length <= max ? trimmed : null;
}

function dateValue(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) ? null : value;
}

function invalid(reason: string): InternalFilterResult {
  return { ok: false, reason };
}

/**
 * Shared validation-report shape for every curriculum module, matching
 * lib/content-validation.ts's existing ContentValidationIssue/report conventions
 * (severity + code + message + locations[]) instead of inventing a parallel shape.
 */

export type CurriculumValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  locations: string[];
};

export type CurriculumValidationReport = {
  issues: CurriculumValidationIssue[];
  errors: CurriculumValidationIssue[];
  warnings: CurriculumValidationIssue[];
  valid: boolean;
};

export type IssueWriter = (severity: "error" | "warning", code: string, message: string, ...locations: string[]) => void;

export const CURRICULUM_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createIssueCollector() {
  const issues: CurriculumValidationIssue[] = [];
  const issue: IssueWriter = (severity, code, message, ...locations) => {
    issues.push({ severity, code, message, locations });
  };
  return { issue, issues };
}

export function finalizeReport(issues: CurriculumValidationIssue[]): CurriculumValidationReport {
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  return { issues, errors, warnings, valid: errors.length === 0 };
}

export function isValidId(value: unknown): value is string {
  return typeof value === "string" && CURRICULUM_ID_PATTERN.test(value);
}

export function requiredText(value: unknown, label: string, location: string, issue: IssueWriter, severity: "error" | "warning" = "error") {
  if (typeof value !== "string" || !value.trim()) issue(severity, `empty-${slugifyLabel(label)}`, `${label} must not be empty.`, location);
}

export function requiredId(value: unknown, label: string, location: string, issue: IssueWriter) {
  if (!isValidId(value)) issue("error", `invalid-${slugifyLabel(label)}-id`, `${label} must be a lowercase, hyphenated stable ID.`, location);
}

export function positiveInteger(value: unknown, label: string, location: string, issue: IssueWriter) {
  if (!Number.isInteger(value) || Number(value) <= 0) issue("error", `invalid-${slugifyLabel(label)}`, `${label} must be a positive integer.`, location);
}

export function findDuplicates<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function slugifyLabel(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

import { PAST_PAPER_SOURCE_AUTHORITY, type PastPaperRecord, type PastPaperResource } from "@/lib/past-papers/types";

export type PastPaperValidationIssue = { code: string; message: string; location: string };

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validateResource(resource: PastPaperResource, kind: "paper" | "marking-instructions", location: string, issues: PastPaperValidationIssue[]) {
  if (!resource || !["available", "pending", "unavailable"].includes(resource.status)) {
    issues.push({ code: "invalid-past-paper-resource-status", message: `${kind} must have an explicit availability status.`, location });
    return;
  }
  if (resource.status !== "available") {
    if (!("note" in resource) || !resource.note.trim()) issues.push({ code: "missing-past-paper-availability-note", message: `${kind} must explain why it is not available.`, location });
    if ("url" in resource) issues.push({ code: "unavailable-past-paper-has-url", message: `${kind} must not expose a URL unless it is available.`, location });
    return;
  }
  if (!("url" in resource) || !resource.url) {
    issues.push({ code: "missing-past-paper-url", message: `${kind} is available but has no URL.`, location });
    return;
  }
  try {
    const url = new URL(resource.url);
    const expectedPath = kind === "paper" ? "/pastpapers/papers/papers/" : "/pastpapers/papers/instructions/";
    if (url.protocol !== "https:" || !["sqa.org.uk", "www.sqa.org.uk"].includes(url.hostname) || !url.pathname.startsWith(expectedPath) || !url.pathname.endsWith(".pdf")) {
      issues.push({ code: "invalid-official-past-paper-url", message: `${kind} must link directly to an official SQA-hosted PDF in the correct archive path.`, location });
    }
  } catch {
    issues.push({ code: "invalid-official-past-paper-url", message: `${kind} URL is not valid.`, location });
  }
}

export function validatePastPapers(records: readonly PastPaperRecord[]): PastPaperValidationIssue[] {
  const issues: PastPaperValidationIssue[] = [];
  const ids = new Set<string>();
  const paperKeys = new Set<string>();

  records.forEach((record, index) => {
    const location = `data/past-papers.ts#${index + 1}`;
    if (!ID_PATTERN.test(record.id)) issues.push({ code: "invalid-past-paper-id", message: "Past-paper IDs must use lowercase kebab-case.", location });
    if (ids.has(record.id)) issues.push({ code: "duplicate-past-paper-id", message: `Duplicate past-paper ID “${record.id}”.`, location });
    ids.add(record.id);
    const paperKey = `${record.subjectSlug}:${record.year}:${record.paperNumber}`;
    if (paperKeys.has(paperKey)) issues.push({ code: "duplicate-past-paper-record", message: `Duplicate past-paper record “${paperKey}”.`, location });
    paperKeys.add(paperKey);
    if (!ID_PATTERN.test(record.subjectSlug)) issues.push({ code: "invalid-past-paper-subject", message: "Past-paper subject slugs must use lowercase kebab-case.", location });
    if (record.qualification !== "Higher") issues.push({ code: "invalid-past-paper-qualification", message: "This catalogue currently supports the Higher qualification only.", location });
    if (!Number.isInteger(record.year) || record.year < 2000 || record.year > 2100) issues.push({ code: "invalid-past-paper-year", message: "Past-paper year must be a plausible four-digit exam year.", location });
    if (record.paperNumber !== 1 && record.paperNumber !== 2) issues.push({ code: "invalid-past-paper-number", message: "Paper number must be 1 or 2.", location });
    if (!record.officialTitle.trim()) issues.push({ code: "missing-past-paper-title", message: "Past-paper title is required.", location });
    const expectedPolicy = record.paperNumber === 1 ? "non-calculator" : "calculator-permitted";
    if (record.calculatorPolicy !== expectedPolicy) issues.push({ code: "invalid-past-paper-calculator-policy", message: `Paper ${record.paperNumber} has the wrong calculator policy.`, location });
    if (record.sourceAuthority !== PAST_PAPER_SOURCE_AUTHORITY) issues.push({ code: "invalid-past-paper-source", message: "Past papers must identify the approved official source authority.", location });
    if (!DATE_PATTERN.test(record.sourceCheckedAt) || Number.isNaN(Date.parse(`${record.sourceCheckedAt}T00:00:00Z`))) issues.push({ code: "invalid-past-paper-source-date", message: "Source checked date must be a valid ISO date.", location });
    validateResource(record.paper, "paper", `${location}/paper`, issues);
    validateResource(record.markingInstructions, "marking-instructions", `${location}/marking-instructions`, issues);
  });

  return issues;
}

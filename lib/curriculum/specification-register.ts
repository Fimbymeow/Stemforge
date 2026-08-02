import {
  CurriculumValidationReport,
  createIssueCollector,
  finalizeReport,
  findDuplicates,
  isValidId,
  positiveInteger,
  requiredId,
  requiredText,
} from "@/lib/curriculum/validation-report";

export type CourseSpecificationRegister = {
  courseId: string;
  qualification: {
    subject: string;
    level: "National 5" | "Higher" | "Advanced Higher";
  };
  sourceDocument: {
    documentId: string;
    title: string;
    publisher: string;
    sourceUrl?: string;
    retrievedAt: string;
    versionLabel?: string;
  };
  registerVersion: number;
  areas: SpecificationArea[];
  points: SpecificationPoint[];
};

export type SpecificationArea = {
  areaId: string;
  courseId: string;
  title: string;
  order: number;
  status: "active" | "retired";
};

/**
 * A specification point is either genuinely VERIFIED against a stored, cited official
 * source (exact wording, structured reference) or explicitly PROVISIONAL (no official
 * wording at all, an authoring summary only, and a stated reason it hasn't been verified).
 * A point can never sit in between — this is the fix for the earlier "empty string means
 * unverified" shape, which let an unverified point look structurally identical to a
 * genuinely-checked one.
 */
export type VerifiedSpecificationPoint = {
  verificationStatus: "verified";
  specPointId: string;
  courseId: string;
  areaId: string;
  officialReference: {
    documentId: string;
    section: string;
    page?: number;
    itemLabel?: string;
  };
  officialStatement: string;
  authoringSummary: string;
  mandatory: boolean;
  status: "active" | "retired";
};

export type ProvisionalSpecificationPoint = {
  verificationStatus: "provisional";
  specPointId: string;
  courseId: string;
  areaId: string;
  officialReference: null;
  officialStatement: null;
  authoringSummary: string;
  limitation: string;
  mandatory: boolean;
  status: "active" | "retired";
};

export type SpecificationPoint = VerifiedSpecificationPoint | ProvisionalSpecificationPoint;

const VALID_LEVELS = new Set(["National 5", "Higher", "Advanced Higher"]);

export function validateSpecificationRegister(register: CourseSpecificationRegister): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  const location = `curriculum/${register.courseId}/specification-register`;

  requiredId(register.courseId, "courseId", location, issue);
  if (!VALID_LEVELS.has(register.qualification?.level)) {
    issue("error", "invalid-qualification-level", "qualification.level must be National 5, Higher or Advanced Higher.", location);
  }
  requiredText(register.qualification?.subject, "qualification.subject", location, issue);
  requiredText(register.sourceDocument?.documentId, "sourceDocument.documentId", location, issue);
  requiredText(register.sourceDocument?.title, "sourceDocument.title", location, issue);
  requiredText(register.sourceDocument?.publisher, "sourceDocument.publisher", location, issue);
  requiredText(register.sourceDocument?.retrievedAt, "sourceDocument.retrievedAt", location, issue);
  positiveInteger(register.registerVersion, "registerVersion", location, issue);

  const areaIds = new Set<string>();
  findDuplicates(register.areas.map((area) => area.areaId)).forEach((duplicateId) =>
    issue("error", "duplicate-area-id", `Duplicate specification area ID "${duplicateId}".`, location));

  register.areas.forEach((area, index) => {
    const areaLocation = `${location}/areas[${index}]`;
    requiredId(area.areaId, "areaId", areaLocation, issue);
    if (area.courseId !== register.courseId) {
      issue("error", "area-course-mismatch", `Area "${area.areaId}" declares courseId "${area.courseId}" but the register is "${register.courseId}".`, areaLocation);
    }
    requiredText(area.title, "title", areaLocation, issue);
    positiveInteger(area.order, "order", areaLocation, issue);
    if (!["active", "retired"].includes(area.status)) issue("error", "invalid-area-status", `Area "${area.areaId}" status must be active or retired.`, areaLocation);
    if (isValidId(area.areaId)) areaIds.add(area.areaId);
  });

  const pointIds = new Set<string>();
  findDuplicates(register.points.map((point) => point.specPointId)).forEach((duplicateId) =>
    issue("error", "duplicate-spec-point-id", `Duplicate specification point ID "${duplicateId}".`, location));

  const officialReferenceKeys = new Map<string, string>();

  register.points.forEach((point, index) => {
    const pointLocation = `${location}/points[${index}]`;
    requiredId(point.specPointId, "specPointId", pointLocation, issue);
    if (point.courseId !== register.courseId) {
      issue("error", "point-course-mismatch", `Point "${point.specPointId}" declares courseId "${point.courseId}" but the register is "${register.courseId}".`, pointLocation);
    }
    if (!areaIds.has(point.areaId)) {
      issue("error", "unknown-spec-area", `Point "${point.specPointId}" references unknown area "${point.areaId}".`, pointLocation);
    }
    requiredText(point.authoringSummary, "authoringSummary", pointLocation, issue);
    if (typeof point.mandatory !== "boolean") issue("error", "invalid-mandatory-flag", `Point "${point.specPointId}" mandatory flag must be a boolean.`, pointLocation);
    if (!["active", "retired"].includes(point.status)) issue("error", "invalid-point-status", `Point "${point.specPointId}" status must be active or retired.`, pointLocation);

    const verificationStatus: unknown = point.verificationStatus;
    if (verificationStatus === "verified") {
      const verifiedPoint = point as VerifiedSpecificationPoint;
      if (!verifiedPoint.officialReference || !verifiedPoint.officialReference.documentId?.trim() || !verifiedPoint.officialReference.section?.trim()) {
        issue("error", "verified-point-missing-reference", `Verified point "${verifiedPoint.specPointId}" must carry a structured official reference (documentId + section).`, pointLocation);
      }
      if (typeof verifiedPoint.officialStatement !== "string" || !verifiedPoint.officialStatement.trim()) {
        issue("error", "verified-point-missing-wording", `Verified point "${verifiedPoint.specPointId}" must carry the exact official wording — a verified point can never have empty officialStatement.`, pointLocation);
      }
      if (verifiedPoint.officialReference?.documentId && verifiedPoint.officialReference?.section) {
        const key = `${verifiedPoint.officialReference.documentId}::${verifiedPoint.officialReference.section}::${verifiedPoint.officialReference.itemLabel ?? ""}`;
        const existing = officialReferenceKeys.get(key);
        if (existing) issue("warning", "duplicate-official-reference", `Points "${existing}" and "${verifiedPoint.specPointId}" cite the identical official reference (same document, section and item label) — confirm this isn't the same statement recorded twice.`, pointLocation);
        else officialReferenceKeys.set(key, verifiedPoint.specPointId);
      }
    } else if (verificationStatus === "provisional") {
      const provisionalPoint = point as ProvisionalSpecificationPoint;
      if (provisionalPoint.officialReference !== null) issue("error", "provisional-point-has-reference", `Provisional point "${provisionalPoint.specPointId}" must not carry an official reference — that would make it masquerade as verified.`, pointLocation);
      if (provisionalPoint.officialStatement !== null) issue("error", "provisional-point-has-statement", `Provisional point "${provisionalPoint.specPointId}" must not carry official wording — that would make it masquerade as verified.`, pointLocation);
      requiredText(provisionalPoint.limitation, "limitation", pointLocation, issue);
    } else {
      const unknownPoint = point as { specPointId?: unknown };
      issue("error", "invalid-verification-status", `Point "${String(unknownPoint.specPointId ?? "unknown")}" verificationStatus must be "verified" or "provisional".`, pointLocation);
    }

    if (isValidId(point.specPointId)) pointIds.add(point.specPointId);
  });

  return finalizeReport(issues);
}

export function getActiveAreas(register: CourseSpecificationRegister) {
  return register.areas.filter((area) => area.status === "active");
}

export function getActivePoints(register: CourseSpecificationRegister) {
  return register.points.filter((point) => point.status === "active");
}

export function getVerifiedPoints(points: readonly SpecificationPoint[]): VerifiedSpecificationPoint[] {
  return points.filter((point): point is VerifiedSpecificationPoint => point.verificationStatus === "verified");
}

export function getProvisionalPoints(points: readonly SpecificationPoint[]): ProvisionalSpecificationPoint[] {
  return points.filter((point): point is ProvisionalSpecificationPoint => point.verificationStatus === "provisional");
}

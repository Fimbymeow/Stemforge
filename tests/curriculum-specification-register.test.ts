import assert from "node:assert/strict";
import test from "node:test";
import { higherMathematicsSpecificationRegister } from "../data/curriculum/higher-mathematics/specification-register";
import { validateSpecificationRegister } from "../lib/curriculum/specification-register";
import type { CourseSpecificationRegister, ProvisionalSpecificationPoint, VerifiedSpecificationPoint } from "../lib/curriculum/specification-register";

function cloneRegister(): CourseSpecificationRegister {
  return structuredClone(higherMathematicsSpecificationRegister);
}

const sampleVerified: VerifiedSpecificationPoint = {
  verificationStatus: "verified",
  specPointId: "sample-verified-point",
  courseId: "higher-maths",
  areaId: "differentiating-functions",
  officialReference: { documentId: "sqa-h-course-spec-mathematics-2023-v3", section: "sample section", page: 6, itemLabel: "Sample" },
  officialStatement: "sample official wording",
  authoringSummary: "sample summary",
  mandatory: true,
  status: "active",
};

const sampleProvisional: ProvisionalSpecificationPoint = {
  verificationStatus: "provisional",
  specPointId: "sample-provisional-point",
  courseId: "higher-maths",
  areaId: "differentiating-functions",
  officialReference: null,
  officialStatement: null,
  authoringSummary: "sample summary",
  limitation: "official wording not yet verified against a stored source",
  mandatory: true,
  status: "active",
};

test("the source-verified Higher Mathematics specification register has no errors", () => {
  const report = validateSpecificationRegister(cloneRegister());
  assert.deepEqual(report.errors, []);
});

test("the register has nineteen active areas and fifty-eight active points, all verified", () => {
  const register = cloneRegister();
  assert.equal(register.areas.filter((area) => area.status === "active").length, 19);
  const activePoints = register.points.filter((point) => point.status === "active");
  assert.equal(activePoints.length, 58);
  assert.ok(activePoints.every((point) => point.verificationStatus === "verified"));
});

test("every verified point carries non-empty official wording and a structured reference", () => {
  const register = cloneRegister();
  for (const point of register.points) {
    if (point.verificationStatus !== "verified") continue;
    assert.ok(point.officialStatement.trim().length > 0, `${point.specPointId} has empty officialStatement`);
    assert.ok(point.officialReference.documentId.trim().length > 0, `${point.specPointId} has no documentId`);
    assert.ok(point.officialReference.section.trim().length > 0, `${point.specPointId} has no section`);
  }
});

test("the official statement never mentions a normal line — only tangents are specified", () => {
  const register = cloneRegister();
  const tangentPoint = register.points.find((point) => point.specPointId === "hm-calc-tangent");
  assert.ok(tangentPoint && tangentPoint.verificationStatus === "verified");
  assert.ok(!tangentPoint.officialStatement.toLowerCase().includes("normal"));
});

test("a verified point with empty officialStatement fails validation", () => {
  const register = cloneRegister();
  const point = structuredClone(sampleVerified);
  point.officialStatement = "";
  register.points.push(point);
  const report = validateSpecificationRegister(register);
  assert.ok(report.errors.some((issue) => issue.code === "verified-point-missing-wording"));
});

test("a verified point with no official reference fails validation", () => {
  const register = cloneRegister();
  const point = structuredClone(sampleVerified) as VerifiedSpecificationPoint;
  point.officialReference = { documentId: "", section: "" };
  register.points.push(point);
  const report = validateSpecificationRegister(register);
  assert.ok(report.errors.some((issue) => issue.code === "verified-point-missing-reference"));
});

test("a provisional point requires a non-empty limitation", () => {
  const register = cloneRegister();
  const point = structuredClone(sampleProvisional);
  point.limitation = "";
  register.points.push(point);
  const report = validateSpecificationRegister(register);
  assert.ok(report.errors.some((issue) => issue.code === "empty-limitation"));
});

test("a provisional point may never carry official wording or a reference", () => {
  const register = cloneRegister();
  const point = structuredClone(sampleProvisional) as unknown as VerifiedSpecificationPoint;
  point.officialStatement = "this would masquerade as verified";
  register.points.push(point as unknown as ProvisionalSpecificationPoint);
  const report = validateSpecificationRegister(register);
  assert.ok(report.errors.some((issue) => issue.code === "provisional-point-has-statement"));
});

test("a genuinely valid provisional point passes with no errors", () => {
  const register = cloneRegister();
  register.points.push(structuredClone(sampleProvisional));
  const report = validateSpecificationRegister(register);
  assert.deepEqual(report.errors, []);
});

test("duplicate official references on two different points produce a warning", () => {
  const register = cloneRegister();
  const first = register.points.find((point) => point.specPointId === "hm-calc-diff-power-rule") as VerifiedSpecificationPoint;
  const duplicate: VerifiedSpecificationPoint = {
    ...structuredClone(first),
    specPointId: "hm-calc-diff-power-rule-duplicate",
  };
  register.points.push(duplicate);
  const report = validateSpecificationRegister(register);
  assert.ok(report.warnings.some((issue) => issue.code === "duplicate-official-reference"));
});

test("duplicate area IDs fail validation", () => {
  const register = cloneRegister();
  register.areas.push(structuredClone(register.areas[0]));
  const report = validateSpecificationRegister(register);
  assert.ok(report.errors.some((issue) => issue.code === "duplicate-area-id"));
});

test("duplicate specification point IDs fail validation", () => {
  const register = cloneRegister();
  register.points.push(structuredClone(register.points[0]));
  const report = validateSpecificationRegister(register);
  assert.ok(report.errors.some((issue) => issue.code === "duplicate-spec-point-id"));
});

test("a point referencing an unknown area fails validation", () => {
  const register = cloneRegister();
  (register.points[0] as VerifiedSpecificationPoint).areaId = "not-a-real-area";
  const report = validateSpecificationRegister(register);
  assert.ok(report.errors.some((issue) => issue.code === "unknown-spec-area"));
});

test("an invalid registerVersion fails validation", () => {
  const register = cloneRegister();
  register.registerVersion = 0;
  const report = validateSpecificationRegister(register);
  assert.ok(report.errors.some((issue) => issue.code === "invalid-registerversion"));
});

test("source document metadata is complete", () => {
  const register = cloneRegister();
  assert.equal(register.sourceDocument.publisher, "Scottish Qualifications Authority (SQA)");
  assert.ok(register.sourceDocument.sourceUrl?.includes("h-course-spec-mathematics.pdf"));
  assert.ok(register.sourceDocument.retrievedAt.length > 0);
});

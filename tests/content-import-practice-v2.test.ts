import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { canonicalContent, type CanonicalContentSource } from "@/data/canonical-content";
import { compareQuestion } from "@/lib/content-import/classification";
import { createImportRegistry, parseAndValidateBankConfiguration } from "@/lib/content-import/configuration";
import { generateApprovedSkillModules } from "@/lib/content-import/generation";
import { createStagedCanonicalContent } from "@/lib/content-import/staging";
import { parseMarkdownBank } from "@/lib/content-import/parser";
import { createPreviewDecisionPayload, reconstructPreviewDecisionPayload, renderPreview } from "@/lib/content-import/preview";
import { createApprovalReceipt, validateApprovalFreshness, validateApprovalReceipt } from "@/lib/content-import/receipts";
import { sha256 } from "@/lib/content-import/canonical";
import { validateContent } from "@/lib/content-validation";
import { createContentResolver } from "@/lib/content-resolver";
import { basicConfigurationText, loadBankForImport } from "@/tests/content-import-fixtures";

const practiceSource = readFileSync("tests/fixtures/tangents-practice-v1.md", "utf8");
const practiceConfiguration = JSON.parse(readFileSync("tests/fixtures/tangents-practice-v1.import.json", "utf8")) as {
  bankId: string;
  sourceBankVersion: string;
  targetSkillPathSlug: string;
  runMode: "new_content_only";
};

function prePublicationFixture(): CanonicalContentSource {
  const subjects = structuredClone(canonicalContent.subjects);
  const path = stagedTangentsPath(subjects);
  if (!path) throw new Error("Tangents fixture path is unavailable.");
  path.status = "coming-soon";
  path.isAvailable = false;
  path.questions = 0;
  delete path.practiceQuestionIds;
  delete path.lessonDocument;
  return {
    subjects,
    questions: canonicalContent.questions.filter((question) => question.skillPathId !== "tangents-and-normals"),
  };
}

function practicePreview() {
  const source = prePublicationFixture();
  return reconstructPreviewDecisionPayload({
    sourcePath: "tests/fixtures/tangents-practice-v1.md",
    sourceBytes: Buffer.from(practiceSource),
    configurationPath: "tests/fixtures/tangents-practice-v1.import.json",
    configurationBytes: Buffer.from(JSON.stringify(practiceConfiguration, null, 2)),
    subjects: source.subjects,
    questions: source.questions,
  });
}

function approvedPractice() {
  const source = prePublicationFixture();
  const reconstructed = reconstructPreviewDecisionPayload({
    sourcePath: "tests/fixtures/tangents-practice-v1.md",
    sourceBytes: Buffer.from(practiceSource),
    configurationPath: "tests/fixtures/tangents-practice-v1.import.json",
    configurationBytes: Buffer.from(JSON.stringify(practiceConfiguration, null, 2)),
    subjects: source.subjects,
    questions: source.questions,
  });
  const approval = createApprovalReceipt({
    previewDecisionPayload: reconstructed.payload,
    approvedQuestionIds: [...reconstructed.payload.eligibleCandidateIds],
    explicitlyExcludedCandidateIds: [],
    versionDecisions: {},
    approvedAt: "2026-10-16T10:00:00.000Z",
  });
  return { ...reconstructed, approval, source };
}

function stagedTangentsPath(subjects: typeof canonicalContent.subjects) {
  return subjects.flatMap((subject) => subject.courseAreas)
    .flatMap((course) => course.specAreas)
    .flatMap((spec) => spec.skillPaths ?? [])
    .find((path) => path.slug === "tangents-and-normals");
}

test("single Practice bank parses stage-free Q headings and neutral IDs in authored order", () => {
  const bank = parseMarkdownBank({ sourcePath: "tangents-practice-v1.md", bytes: Buffer.from(practiceSource) });
  assert.equal(bank.authoringModel, "practice");
  assert.deepEqual(bank.questions.map((question) => question.sourceOrder), ["Q001", "Q002"]);
  assert.deepEqual(bank.questions.map((question) => question.id), ["hm-calc-tangent-q-001", "hm-calc-tangent-q-002"]);
  assert.ok(bank.questions.every((question) => question.declaredStage === "Practice"));
  assert.equal(bank.diagnostics.filter((item) => item.severity === "error").length, 0);
});

test("Practice Skim List copies are excluded from canonical question discovery", () => {
  const withSkim = `${practiceSource}\n\n## Practice Skim List\n\n### Q001 — hm-calc-tangent-q-001\n\nQuestion: Prompt only.`;
  const bank = parseMarkdownBank({ sourcePath: "tangents-practice-v1.md", bytes: Buffer.from(withSkim) });
  assert.deepEqual(bank.questions.map((question) => question.id), ["hm-calc-tangent-q-001", "hm-calc-tangent-q-002"]);
  assert.equal(bank.diagnostics.some((item) => item.code === "duplicate_question_id"), false);
});

test("new Practice banks reject learner-stage-prefixed IDs", () => {
  const bank = parseMarkdownBank({
    sourcePath: "bad-practice-id.md",
    bytes: Buffer.from(practiceSource.replaceAll("hm-calc-tangent-q-001", "hm-calc-tangent-f-001")),
  });
  assert.ok(bank.diagnostics.some((item) => item.code === "learner_stage_prefix_in_practice_id"));
});

test("Practice V2 configuration is stage-free, Higher-Maths-only and fail-closed without compatibility wiring", () => {
  const bank = parseMarkdownBank({ sourcePath: "tangents-practice-v1.md", bytes: Buffer.from(practiceSource) });
  const registry = createImportRegistry(canonicalContent.subjects, canonicalContent.questions);
  const valid = parseAndValidateBankConfiguration(JSON.stringify(practiceConfiguration), registry, bank);
  assert.equal(valid.valid, true);
  const unknown = parseAndValidateBankConfiguration(JSON.stringify({ ...practiceConfiguration, targetSkillPathSlug: "optimisation" }), registry, bank);
  assert.ok(unknown.diagnostics.some((item) => item.code === "practice_compatibility_stage_not_wired"));
  const legacyShape = parseAndValidateBankConfiguration(JSON.stringify({ ...practiceConfiguration, stageNameToStageId: { Practice: "anything" } }), registry, bank);
  assert.ok(legacyShape.diagnostics.some((item) => item.code === "practice_bank_uses_legacy_configuration"));
});

test("Tangents dry run classifies and previews a Practice bank without learner-stage language", () => {
  const { bank, payload } = practicePreview();
  assert.equal(bank.questions.length, 2);
  assert.equal(payload.importable, true);
  assert.deepEqual(payload.blockedIds, []);
  assert.deepEqual(payload.practiceOrders, [{
    targetSkillPathSlug: "tangents-and-normals",
    questionIds: ["hm-calc-tangent-q-001", "hm-calc-tangent-q-002"],
    source: "authored_practice",
  }]);
  assert.ok(payload.classifications.every((item) => item.targetStageId === "tangents-and-normals-practice-compatibility"));
  assert.ok(payload.classifications.every((item) => item.canonicalQuestion?.stage === "Practice"));
  const rendered = renderPreview(payload);
  assert.match(rendered, /Target skill: tangents-and-normals/);
  assert.match(rendered, /Learner-facing bank: Practice/);
  assert.match(rendered, /Ownership: tangents-and-normals/);
  assert.match(rendered, /Dependencies: chain-rule/);
  assert.doesNotMatch(rendered, /Target: .*Foundations|Target: .*Applications|Target: .*Past Paper/);
});

test("authored Practice order is approval-bound and generated deterministically", () => {
  const { payload, registry } = practicePreview();
  const approval = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [...payload.eligibleCandidateIds],
    explicitlyExcludedCandidateIds: [],
    versionDecisions: {},
    approvedAt: "2026-10-16T10:00:00.000Z",
  });
  assert.equal(validateApprovalReceipt(approval, { registry, reconstructedPayload: payload }).valid, true);
  const generated = generateApprovedSkillModules(approval, registry);
  assert.equal(generated.length, 1);
  const text = Buffer.from(generated[0].bytes).toString("utf8");
  assert.match(text, /tangentsAndNormalsPracticeQuestionIds/);
  assert.ok(text.indexOf("hm-calc-tangent-q-001") < text.indexOf("hm-calc-tangent-q-002"));
  const tampered = structuredClone(payload);
  tampered.practiceOrders![0].questionIds.reverse();
  assert.equal(validateApprovalReceipt(approval, { registry, reconstructedPayload: tampered }).valid, false);
});

test("Practice V2 staged graph installs the approval-bound order without publishing the skill", () => {
  const { approval, registry, source } = approvedPractice();
  const staged = createStagedCanonicalContent({
    approval,
    registry,
    subjects: source.subjects,
    questions: source.questions,
  });
  const path = stagedTangentsPath(staged.subjects);
  assert.ok(path);
  assert.deepEqual(path.practiceQuestionIds, ["hm-calc-tangent-q-001", "hm-calc-tangent-q-002"]);
  assert.equal(path.questions, 2);
  assert.equal(path.practiceCompatibilityStageId, "tangents-and-normals-practice-compatibility");
  assert.equal(path.isAvailable, false);
  assert.equal(path.status, "coming-soon");
  assert.deepEqual(path.learningStages, undefined);
  const resolver = createContentResolver(staged);
  assert.deepEqual(resolver.getPracticeQuestions(path.slug).map((question) => question.id), [
    "hm-calc-tangent-q-001",
    "hm-calc-tangent-q-002",
  ]);
  assert.equal(resolver.getPathQuestions(path.slug).length, 2);
  const report = validateContent(staged);
  for (const code of ["orphan-practice-question", "path-question-count-mismatch", "placeholder-enters-progress"]) {
    assert.equal(report.errors.filter((issue) => issue.code === code).length, 0);
  }
});

test("Practice V2 staged projection fails closed for omissions and duplicate membership", () => {
  const omitted = approvedPractice();
  omitted.approval.previewDecisionPayload.practiceOrders![0].questionIds = ["hm-calc-tangent-q-001"];
  assert.throws(() => createStagedCanonicalContent({
    approval: omitted.approval,
    registry: omitted.registry,
    subjects: omitted.source.subjects,
    questions: omitted.source.questions,
  }), /approved_practice_order_mismatch:tangents-and-normals/);

  const duplicated = approvedPractice();
  duplicated.approval.previewDecisionPayload.practiceOrders![0].questionIds.push("hm-calc-tangent-q-001");
  assert.throws(() => createStagedCanonicalContent({
    approval: duplicated.approval,
    registry: duplicated.registry,
    subjects: duplicated.source.subjects,
    questions: duplicated.source.questions,
  }), /duplicate_approved_practice_order:tangents-and-normals/);
});

test("unpublished Practice projection still rejects missing, orphaned and accidentally live content", () => {
  const { approval, registry, source } = approvedPractice();
  const staged = createStagedCanonicalContent({
    approval,
    registry,
    subjects: source.subjects,
    questions: source.questions,
  });
  const path = stagedTangentsPath(staged.subjects);
  assert.ok(path?.practiceQuestionIds);

  const missing = structuredClone(staged);
  const missingPath = stagedTangentsPath(missing.subjects)!;
  missingPath.practiceQuestionIds![1] = "hm-calc-tangent-q-999";
  assert.ok(validateContent(missing).errors.some((issue) => issue.code === "missing-practice-question-reference"));

  const orphaned = structuredClone(staged);
  const orphanedPath = stagedTangentsPath(orphaned.subjects)!;
  orphanedPath.practiceQuestionIds = [orphanedPath.practiceQuestionIds![0]];
  orphanedPath.questions = 1;
  assert.ok(validateContent(orphaned).errors.some((issue) => issue.code === "orphan-practice-question"));

  const accidentallyLive = structuredClone(staged);
  const livePath = stagedTangentsPath(accidentallyLive.subjects)!;
  livePath.isAvailable = true;
  assert.ok(validateContent(accidentallyLive).errors.some((issue) => issue.code === "available-path-status-mismatch"));
});

test("Practice approval freshness remains bound to source, config bytes and live snapshot", () => {
  const { payload } = practicePreview();
  const approval = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [],
    explicitlyExcludedCandidateIds: payload.eligibleCandidateIds.map((id) => ({ id, reason: "Dry-run only." })),
    versionDecisions: {},
    approvedAt: "2026-10-16T10:00:00.000Z",
  });
  const current = {
    receipt: approval,
    currentSourceHash: payload.sourceBytesHash,
    currentConfigurationPath: payload.configurationPath,
    currentConfigurationBytesHash: payload.configurationBytesHash,
    currentConfigurationHash: payload.configurationHash,
    currentLiveSnapshotHash: payload.liveCanonicalContentSnapshotHash,
  };
  assert.equal(validateApprovalFreshness(current).valid, true);
  assert.equal(validateApprovalFreshness({ ...current, currentConfigurationBytesHash: "0".repeat(64) }).diagnostics[0].code, "stale_configuration_bytes");
});

test("legacy banks and configurations still flatten deterministically without overriding explicit Practice order", () => {
  const bank = loadBankForImport("basic-differentiation-v1.md");
  const registry = createImportRegistry(canonicalContent.subjects, canonicalContent.questions);
  const configBytes = Buffer.from(basicConfigurationText());
  const configuration = parseAndValidateBankConfiguration(configBytes.toString("utf8"), registry, bank);
  assert.equal(configuration.valid, true);
  const payload = createPreviewDecisionPayload({
    bank,
    configuration: configuration.configuration!,
    configurationPath: "content-drafts/higher-maths/calculus/basic-differentiation-v1.import.json",
    configurationBytesHash: sha256(configBytes),
    configurationHash: configuration.configurationHash!,
    registry,
    subjects: canonicalContent.subjects,
    questions: canonicalContent.questions,
  });
  assert.equal(bank.authoringModel, "legacy_stages");
  assert.equal(payload.practiceOrders?.[0].source, "existing_explicit");
  assert.deepEqual(payload.practiceOrders?.[0].questionIds.slice(0, 8), registry.paths.get("basic-differentiation")?.practiceQuestionIds);
});

test("legacy approval payloads without Practice ordering remain structurally and cryptographically valid", () => {
  const { payload, registry } = practicePreview();
  const legacyPayload = structuredClone(payload);
  delete legacyPayload.practiceOrders;
  const approval = createApprovalReceipt({
    previewDecisionPayload: legacyPayload,
    approvedQuestionIds: [],
    explicitlyExcludedCandidateIds: legacyPayload.eligibleCandidateIds.map((id) => ({ id, reason: "Legacy fixture." })),
    versionDecisions: {},
    approvedAt: "2026-10-16T10:00:00.000Z",
  });
  assert.equal(validateApprovalReceipt(approval, { registry, reconstructedPayload: payload }).valid, true);
});

test("Practice regrouping is explicitly non-semantic while content changes still require versioning", () => {
  const existing = canonicalContent.questions.find((question) => question.id === "hm-calc-diff-basic-f-001")!;
  const regrouped = { ...structuredClone(existing), stage: "Practice" as const, stageId: "basic-differentiation-practice-compatibility" };
  assert.deepEqual(compareQuestion(existing, regrouped).availableVersionDecisions, ["practice_regrouping_no_version_bump", "question_version_bump"]);
  const changed = { ...regrouped, questionText: `${regrouped.questionText} Changed.` };
  assert.deepEqual(compareQuestion(existing, changed).availableVersionDecisions, ["question_version_bump"]);
});

test("existing Basic Differentiation and Chain Rule canonical question identity and Practice order remain unchanged", () => {
  const registry = createImportRegistry(canonicalContent.subjects, canonicalContent.questions);
  assert.equal(canonicalContent.questions.filter((question) => question.skillPathId === "basic-differentiation").length, 8);
  assert.equal(canonicalContent.questions.filter((question) => question.skillPathId === "chain-rule").length, 34);
  assert.deepEqual(registry.paths.get("basic-differentiation")?.practiceQuestionIds, [
    "hm-calc-diff-basic-f-001", "hm-calc-diff-basic-f-002", "hm-calc-diff-basic-f-003",
    "hm-calc-diff-basic-a-001", "hm-calc-diff-basic-a-002", "hm-calc-diff-basic-a-003",
    "hm-calc-diff-basic-ppq-001", "hm-calc-diff-basic-ppq-002",
  ]);
  assert.deepEqual(registry.paths.get("chain-rule")?.practiceQuestionIds?.slice(-15), [
    "hm-calc-diff-chain-ppq-003", "hm-calc-diff-chain-ppq-004", "hm-calc-diff-chain-ppq-007",
    "hm-calc-diff-chain-ppq-008", "hm-calc-diff-chain-ppq-010", "hm-calc-diff-chain-ppq-011",
    "hm-calc-diff-chain-ppq-012", "hm-calc-diff-chain-ppq-014", "hm-calc-diff-chain-ppq-015",
    "hm-calc-diff-chain-ppq-016", "hm-calc-diff-chain-ppq-017", "hm-calc-diff-chain-ppq-018",
    "hm-calc-diff-chain-ppq-019", "hm-calc-diff-chain-ppq-020", "hm-calc-diff-chain-ppq-021",
  ]);
  assert.equal(readFileSync("content-import/receipts/d7dc37ee2bb450342b72a85b82fdfc09af82cce05728186c9128a4a32a9d1305.json", "utf8").length > 0, true);
});

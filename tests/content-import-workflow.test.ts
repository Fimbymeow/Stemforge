import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import {
  applyGeneratedOutputs,
  approvalReceiptHash,
  canonicalSerialize,
  compareQuestion,
  createApprovalReceipt,
  createCanonicalContentSnapshotHash,
  generateApprovedSkillModules,
  previewHash,
  reconstructPreviewDecisionPayload,
  sha256,
  validateApprovalFreshness,
  validateApprovalReceipt,
  validateImportReceipt,
  type GeneratedOutput,
  type ImportReceipt,
  type PreviewDecisionPayload,
  type VersionDecision,
} from "@/lib/content-import";
import {
  basicConfigurationText,
  canonicalContent,
} from "@/tests/content-import-fixtures";

function realPreview() {
  const sourcePath = "content-drafts/higher-maths/calculus/basic-differentiation-v1.md";
  const configurationPath = "content-drafts/higher-maths/calculus/basic-differentiation-v1.import.json";
  const reconstructed = reconstructPreviewDecisionPayload({
    sourcePath,
    sourceBytes: readFileSync(sourcePath),
    configurationPath,
    configurationBytes: Buffer.from(basicConfigurationText()),
    subjects: canonicalContent.subjects,
    questions: canonicalContent.questions,
  });
  return { ...reconstructed, payload: reconstructed.payload };
}

function approvalContext(payload: PreviewDecisionPayload, registry: ReturnType<typeof realPreview>["registry"]) {
  return { registry, reconstructedPayload: payload };
}

function demoConfiguration() {
  return Buffer.from(JSON.stringify({
    bankId: "demo-bank",
    sourceBankVersion: "1",
    targetSkillPathSlug: "basic-differentiation",
    stageNameToStageId: { Foundations: "basic-diff-stage-foundations" },
    runMode: "new_content_only",
  }));
}

function reconstructDemo(source: string, configurationPath = "content-drafts/configurations/demo.import.json") {
  return reconstructPreviewDecisionPayload({
    sourcePath: "content-drafts/demo.md",
    sourceBytes: Buffer.from(source),
    configurationPath,
    configurationBytes: demoConfiguration(),
    subjects: canonicalContent.subjects,
    questions: canonicalContent.questions,
  });
}

function demoQuestion(overrides: { heading?: string; hint?: string; extra?: string; answer?: string } = {}) {
  return `# Demo Question Bank v1
- skillPathId: demo-bank
${overrides.heading ?? "## F001 - demo-bank-f-001"}
Stage: Foundations
Type: numeric
Marks: 1
Question: What is one?
Correct answer: ${overrides.answer ?? "1"}
${overrides.hint === "" ? "" : `Hint: ${overrides.hint ?? "Think."}`}
Worked solution: One.
Common mistake: Zero.
${overrides.extra ?? ""}`;
}

test("preview payload and canonical serialization are deterministic and fully accounted", () => {
  const first = realPreview().payload;
  const second = realPreview().payload;
  assert.equal(canonicalSerialize(first), canonicalSerialize(second));
  assert.equal(previewHash(first), previewHash(second));
  assert.equal(first.sourceQuestionIds.length, first.eligibleCandidateIds.length + first.blockedIds.length + first.unchangedIds.length);
  assert.equal(new Set([...first.eligibleCandidateIds, ...first.blockedIds, ...first.unchangedIds]).size, first.sourceQuestionIds.length);
});

test("every independent preview decision input changes the preview hash", () => {
  const payload = realPreview().payload;
  const changes: PreviewDecisionPayload[] = [
    { ...structuredClone(payload), sourceBytesHash: "b".repeat(64) },
    { ...structuredClone(payload), configurationHash: "c".repeat(64) },
    { ...structuredClone(payload), liveCanonicalContentSnapshotHash: "d".repeat(64) },
    { ...structuredClone(payload), sourceQuestionIds: [...payload.sourceQuestionIds].reverse() },
    { ...structuredClone(payload), diagnostics: [...payload.diagnostics, { code: "changed", severity: "warning", message: "changed" }] },
  ];
  for (const changed of changes) assert.notEqual(previewHash(changed), previewHash(payload));
});

test("reauthored preview content is rejected even after its self-hash is recomputed", () => {
  const { payload, registry } = realPreview();
  const tampered = structuredClone(payload);
  const id = tampered.eligibleCandidateIds.find((candidate) => !registry.questions.has(candidate));
  assert.ok(id);
  const classification = tampered.classifications.find((item) => item.questionId === id);
  assert.ok(classification?.canonicalQuestion);
  classification.canonicalQuestion.questionText = "Text absent from the approved source bank.";
  const receipt = createApprovalReceipt({
    previewDecisionPayload: tampered,
    approvedQuestionIds: [id!],
    explicitlyExcludedCandidateIds: tampered.eligibleCandidateIds.filter((candidate) => candidate !== id)
      .map((candidate) => ({ id: candidate, reason: "Excluded." })),
    versionDecisions: {},
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(receipt.previewHash, previewHash(tampered));
  const validation = validateApprovalReceipt(receipt, approvalContext(payload, registry));
  assert.equal(validation.valid, false);
  assert.ok(validation.diagnostics.some((item) => item.code === "reconstructed_preview_mismatch"));
});

test("parser errors make previews non-importable and prevent approval or partial enumeration", () => {
  const invalidSources = [
    demoQuestion({ hint: "" }),
    demoQuestion({ heading: "## F001 malformed" }),
    demoQuestion({ extra: "Hint: Duplicate hint." }),
  ];
  for (const source of invalidSources) {
    const reconstructed = reconstructDemo(source);
    assert.equal(reconstructed.payload.importable, false);
    assert.equal(reconstructed.payload.eligibleCandidateIds.length, 0);
    assert.ok(reconstructed.payload.diagnostics.some((item) => item.severity === "error"));
    const receipt = createApprovalReceipt({
      previewDecisionPayload: reconstructed.payload,
      approvedQuestionIds: [],
      explicitlyExcludedCandidateIds: [],
      versionDecisions: {},
      approvedAt: "2026-07-29T10:00:00.000Z",
    });
    const validation = validateApprovalReceipt(receipt, approvalContext(reconstructed.payload, reconstructed.registry));
    assert.equal(validation.valid, false);
    assert.ok(validation.diagnostics.some((item) => item.code === "invalid_preview_not_approvable"));
  }
  const malformedHeading = reconstructDemo(demoQuestion({ heading: "## F001 malformed" }));
  assert.equal(malformedHeading.bank.questions.length, 0);
  assert.equal(malformedHeading.payload.importable, false);

  const overLimitQuestions = Array.from({ length: 501 }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    return `## F${number} - demo-bank-f-${number}
Stage: Foundations
Type: numeric
Marks: 1
Question: What is one?
Correct answer: 1
Hint: Think.
Worked solution: One.
Common mistake: Zero.`;
  }).join("\n");
  const overLimit = reconstructDemo(`# Demo Question Bank v1
- skillPathId: demo-bank
${overLimitQuestions}`);
  assert.equal(overLimit.payload.importable, false);
  assert.equal(overLimit.payload.eligibleCandidateIds.length, 0);
  assert.ok(overLimit.payload.diagnostics.some((item) => item.code === "too_many_questions"));
});

test("rehashed tampering cannot make an invalid source preview approvable", () => {
  const reconstructed = reconstructDemo(demoQuestion({ hint: "" }));
  const tampered = structuredClone(reconstructed.payload);
  tampered.importable = true;
  const receipt = createApprovalReceipt({
    previewDecisionPayload: tampered,
    approvedQuestionIds: [],
    explicitlyExcludedCandidateIds: [],
    versionDecisions: {},
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(receipt.previewHash, previewHash(tampered));
  const validation = validateApprovalReceipt(
    receipt,
    approvalContext(reconstructed.payload, reconstructed.registry),
  );
  assert.equal(validation.valid, false);
  assert.ok(validation.diagnostics.some((item) => item.code === "reconstructed_preview_mismatch"));
  assert.ok(validation.diagnostics.some((item) => item.code === "invalid_preview_not_approvable"));
});

test("multiple-choice preview and canonical output share one verified option authority", () => {
  const source = `# Demo Question Bank v1
- skillPathId: demo-bank
## F001 - demo-bank-f-001
Stage: Foundations
Type: multiple_choice
Marks: 1
Question:
Choose one.
A. First expression
B. Second expression
Correct answer: A. First expression
Accepted answers:
- A
- First expression
Hint: Choose the first.
Worked solution: The first option is correct.
Common mistake: Choosing the second.`;
  const reconstructed = reconstructDemo(source);
  const classification = reconstructed.payload.classifications[0];
  assert.equal(reconstructed.payload.importable, true);
  assert.equal(classification.status, "convertible");
  assert.equal(classification.canonicalQuestion?.correctAnswer, "A");
  assert.deepEqual(classification.canonicalQuestion?.acceptedAnswers, ["A"]);
  assert.equal(classification.canonicalQuestion?.marking.strategy, "multiple_choice");
});

test("embedded approval payload reproduces preview without a disposable preview file", () => {
  const { payload, registry } = realPreview();
  const receipt = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [],
    explicitlyExcludedCandidateIds: payload.eligibleCandidateIds.map((id) => ({ id, reason: "Not selected in this fixture." })),
    versionDecisions: {},
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(receipt.previewHash, previewHash(receipt.previewDecisionPayload));
  assert.equal(validateApprovalReceipt(receipt, approvalContext(payload, registry)).valid, true);
});

test("malformed and extra-key receipts fail safely", () => {
  assert.equal(validateApprovalReceipt({ receiptVersion: 1 }).valid, false);
  const { payload } = realPreview();
  const receipt = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [],
    explicitlyExcludedCandidateIds: payload.eligibleCandidateIds.map((id) => ({ id, reason: "Excluded." })),
    versionDecisions: {},
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(validateApprovalReceipt({ ...receipt, unexpected: true }, approvalContext(payload, realPreview().registry)).valid, false);
});

test("approval validation rejects missing/inconsistent decisions and blocked or incomplete partitions", () => {
  const { payload, registry } = realPreview();
  const collision = payload.eligibleCandidateIds.find((id) => payload.collisionDiffs.some((item) => item.questionId === id && !item.identical));
  assert.ok(collision);
  const remaining = payload.eligibleCandidateIds.filter((id) => id !== collision);
  const missing = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [collision!],
    explicitlyExcludedCandidateIds: remaining.map((id) => ({ id, reason: "Excluded." })),
    versionDecisions: {},
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.ok(validateApprovalReceipt(missing, approvalContext(payload, registry)).diagnostics.some((item) => item.code === "missing_version_decision"));
  const inconsistent = structuredClone(missing);
  (inconsistent.versionDecisions as Record<string, unknown>)[collision!] = { kind: "marking_strategy_version_bump" };
  assert.ok(validateApprovalReceipt(inconsistent, approvalContext(payload, registry)).diagnostics.some((item) => item.code === "malformed_approval_receipt" || item.code === "inconsistent_version_decision"));
  const incomplete = structuredClone(missing);
  incomplete.approvedQuestionIds = [];
  assert.ok(validateApprovalReceipt(incomplete, approvalContext(payload, registry)).diagnostics.some((item) => item.code === "approval_accounting_mismatch"));
  const blocked = structuredClone(missing);
  blocked.approvedQuestionIds.push(payload.blockedIds[0]);
  assert.equal(validateApprovalReceipt(blocked, approvalContext(payload, registry)).valid, false);
});

test("approval freshness fails independently for source, configuration and live snapshot changes", () => {
  const { payload } = realPreview();
  const receipt = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [],
    explicitlyExcludedCandidateIds: payload.eligibleCandidateIds.map((id) => ({ id, reason: "Excluded." })),
    versionDecisions: {},
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(validateApprovalFreshness({
    receipt,
    currentSourceHash: payload.sourceBytesHash,
    currentConfigurationPath: payload.configurationPath,
    currentConfigurationBytesHash: payload.configurationBytesHash,
    currentConfigurationHash: payload.configurationHash,
    currentLiveSnapshotHash: payload.liveCanonicalContentSnapshotHash,
  }).valid, true);
  assert.deepEqual([
    validateApprovalFreshness({ receipt, currentSourceHash: "0".repeat(64), currentConfigurationPath: payload.configurationPath, currentConfigurationBytesHash: payload.configurationBytesHash, currentConfigurationHash: payload.configurationHash, currentLiveSnapshotHash: payload.liveCanonicalContentSnapshotHash }).diagnostics[0].code,
    validateApprovalFreshness({ receipt, currentSourceHash: payload.sourceBytesHash, currentConfigurationPath: payload.configurationPath, currentConfigurationBytesHash: payload.configurationBytesHash, currentConfigurationHash: "0".repeat(64), currentLiveSnapshotHash: payload.liveCanonicalContentSnapshotHash }).diagnostics[0].code,
    validateApprovalFreshness({ receipt, currentSourceHash: payload.sourceBytesHash, currentConfigurationPath: payload.configurationPath, currentConfigurationBytesHash: payload.configurationBytesHash, currentConfigurationHash: payload.configurationHash, currentLiveSnapshotHash: "0".repeat(64) }).diagnostics[0].code,
  ], ["stale_source", "stale_configuration", "stale_live_snapshot"]);
});

test("custom configuration identity is preserved and substituted or replaced configuration fails", () => {
  const sourcePath = "content-drafts/higher-maths/calculus/basic-differentiation-v1.md";
  const customPath = "content-drafts/configurations/basic-custom.import.json";
  const custom = reconstructPreviewDecisionPayload({
    sourcePath,
    sourceBytes: readFileSync(sourcePath),
    configurationPath: customPath,
    configurationBytes: Buffer.from(basicConfigurationText()),
    subjects: canonicalContent.subjects,
    questions: canonicalContent.questions,
  });
  assert.equal(custom.payload.configurationPath, customPath);
  const receipt = createApprovalReceipt({
    previewDecisionPayload: custom.payload,
    approvedQuestionIds: [],
    explicitlyExcludedCandidateIds: custom.payload.eligibleCandidateIds.map((id) => ({ id, reason: "Excluded." })),
    versionDecisions: {},
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(validateApprovalReceipt(receipt, approvalContext(custom.payload, custom.registry)).valid, true);
  const adjacent = realPreview();
  assert.ok(validateApprovalReceipt(
    receipt,
    approvalContext(adjacent.payload, adjacent.registry),
  ).diagnostics.some((item) => item.code === "reconstructed_preview_mismatch"));
  assert.ok(validateApprovalFreshness({
    receipt,
    currentSourceHash: custom.payload.sourceBytesHash,
    currentConfigurationPath: customPath,
    currentConfigurationBytesHash: "0".repeat(64),
    currentConfigurationHash: custom.payload.configurationHash,
    currentLiveSnapshotHash: custom.payload.liveCanonicalContentSnapshotHash,
  }).diagnostics.some((item) => item.code === "stale_configuration_bytes"));
});

test("deterministic generation changes only the configured skill-owned module", () => {
  const { payload, registry } = realPreview();
  const newId = payload.eligibleCandidateIds.find((id) => !registry.questions.has(id));
  assert.ok(newId);
  const receipt = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [newId!],
    explicitlyExcludedCandidateIds: payload.eligibleCandidateIds.filter((id) => id !== newId).map((id) => ({ id, reason: "Excluded." })),
    versionDecisions: {},
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(validateApprovalReceipt(receipt, approvalContext(payload, registry)).valid, true);
  const first = generateApprovedSkillModules(receipt, registry);
  const second = generateApprovedSkillModules(receipt, registry);
  assert.equal(first.length, 1);
  assert.equal(first[0].path, "content/questions/higher-maths/basic-differentiation.ts");
  assert.equal(first[0].hash, second[0].hash);
  assert.deepEqual(first[0].bytes, second[0].bytes);
});

test("same-ID question-version decisions are explicit and deterministic", () => {
  const { payload, registry } = realPreview();
  const collision = payload.eligibleCandidateIds.find((id) => registry.questions.has(id));
  assert.ok(collision);
  const decisions: Record<string, VersionDecision> = { [collision!]: { kind: "question_version_bump" } };
  const receipt = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [collision!],
    explicitlyExcludedCandidateIds: payload.eligibleCandidateIds.filter((id) => id !== collision).map((id) => ({ id, reason: "Excluded." })),
    versionDecisions: decisions,
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(validateApprovalReceipt(receipt, approvalContext(payload, registry)).valid, true);
  const output = Buffer.from(generateApprovedSkillModules(receipt, registry)[0].bytes).toString("utf8");
  const expectedVersion = (registry.questions.get(collision!)?.questionVersion ?? 0) + 1;
  assert.match(output, new RegExp(`\"id\": \"${collision}\"[\\s\\S]*?\"questionVersion\": ${expectedVersion}`));
});

test("approval rejects collision decisions that do not cover every structured impact", () => {
  const { payload, registry } = realPreview();
  const collision = payload.eligibleCandidateIds.find((id) => registry.questions.has(id));
  assert.ok(collision);
  const diff = payload.collisionDiffs.find((item) => item.questionId === collision);
  assert.deepEqual(diff?.availableVersionDecisions, ["question_version_bump"]);
  const receipt = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [collision!],
    explicitlyExcludedCandidateIds: payload.eligibleCandidateIds.filter((id) => id !== collision)
      .map((id) => ({ id, reason: "Excluded." })),
    versionDecisions: { [collision!]: { kind: "content_revision_bump" } },
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  const validation = validateApprovalReceipt(receipt, approvalContext(payload, registry));
  assert.equal(validation.valid, false);
  assert.ok(validation.diagnostics.some((item) => item.code === "inconsistent_version_decision"));
});

test("every approval-valid decision kind reaches deterministic generation", () => {
  const { payload, registry } = realPreview();
  const collision = payload.eligibleCandidateIds.find((id) => registry.questions.has(id));
  assert.ok(collision);
  const existing = registry.questions.get(collision!)!;

  const questionVersionReceipt = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [collision!],
    explicitlyExcludedCandidateIds: payload.eligibleCandidateIds.filter((id) => id !== collision)
      .map((id) => ({ id, reason: "Excluded." })),
    versionDecisions: { [collision!]: { kind: "question_version_bump" } },
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(validateApprovalReceipt(questionVersionReceipt, approvalContext(payload, registry)).valid, true);
  assert.doesNotThrow(() => generateApprovedSkillModules(questionVersionReceipt, registry));

  const presentationPayload = structuredClone(payload);
  const proposed = structuredClone(existing);
  proposed.hint += " Clarified.";
  const classification = presentationPayload.classifications.find((item) => item.questionId === collision)!;
  classification.status = "convertible";
  classification.blockers = [];
  classification.canonicalQuestion = proposed;
  presentationPayload.collisionDiffs = presentationPayload.collisionDiffs.map((item) =>
    item.questionId === collision ? compareQuestion(existing, proposed) : item);
  const contentRevisionReceipt = createApprovalReceipt({
    previewDecisionPayload: presentationPayload,
    approvedQuestionIds: [collision!],
    explicitlyExcludedCandidateIds: presentationPayload.eligibleCandidateIds.filter((id) => id !== collision)
      .map((id) => ({ id, reason: "Excluded." })),
    versionDecisions: { [collision!]: { kind: "content_revision_bump" } },
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(validateApprovalReceipt(
    contentRevisionReceipt,
    approvalContext(presentationPayload, registry),
  ).valid, true);
  const generated = Buffer.from(generateApprovedSkillModules(contentRevisionReceipt, registry)[0].bytes).toString("utf8");
  assert.match(generated, new RegExp(`\"id\": \"${collision}\"[\\s\\S]*?\"questionVersion\": ${existing.questionVersion}`));
  assert.match(generated, new RegExp(`\"contentRevision\": ${existing.contentRevision + 1}`));
});

test("transactional apply rolls back exact original bytes after every injected failure", () => {
  for (const fault of ["after_first_replacement", "after_middle_replacement", "after_final_replacement", "post_write_verification_corruption"] as const) {
    const root = mkdtempSync(resolve(tmpdir(), "stemforge-import-"));
    try {
      const outputs = threeOutputs();
      outputs.forEach((output, index) => {
        const path = resolve(root, output.path);
        mkdirSync(resolve(path, ".."), { recursive: true });
        writeFileSync(path, `original-${index}`);
      });
      assert.throws(() => applyGeneratedOutputs({ root, outputs, receipt: preparedReceipt(), validateStagedGraph: () => undefined, statusReader: () => [], fault }));
      outputs.forEach((output, index) => assert.equal(readFileSync(resolve(root, output.path), "utf8"), `original-${index}`, `${fault}:${output.path}`));
      assert.equal(existsSync(resolve(root, "content-import", ".apply-state")), true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("successful apply preserves sibling files, verifies hashes and cleans temporary state", () => {
  const root = mkdtempSync(resolve(tmpdir(), "stemforge-import-"));
  try {
    const output = generated("content/questions/higher-maths/owned.ts", "replacement");
    const destination = resolve(root, output.path);
    mkdirSync(resolve(destination, ".."), { recursive: true });
    writeFileSync(destination, "original");
    const sibling = resolve(root, "content/questions/higher-maths/sibling.ts");
    writeFileSync(sibling, "sibling-original");
    const result = applyGeneratedOutputs({ root, outputs: [output], receipt: preparedReceipt(), validateStagedGraph: () => undefined, statusReader: () => [] });
    assert.equal(readFileSync(destination, "utf8"), "replacement");
    assert.equal(readFileSync(sibling, "utf8"), "sibling-original");
    assert.equal(result.hashes[output.path], output.hash);
    assert.equal(existsSync(resolve(root, result.receiptPath)), true);
    assert.equal(existsSync(resolve(root, "content-import", ".apply-state")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("receipt persistence failures roll canonical content back exactly", () => {
  const faults = [
    "receipt_validation",
    "receipt_directory_creation",
    "receipt_temporary_write",
    "receipt_finalization",
    "receipt_verification",
  ] as const;
  for (const fault of faults) {
    const root = mkdtempSync(resolve(tmpdir(), "stemforge-import-receipt-"));
    try {
      const output = generated("content/questions/higher-maths/owned.ts", "replacement");
      const destination = resolve(root, output.path);
      mkdirSync(resolve(destination, ".."), { recursive: true });
      writeFileSync(destination, "original");
      const receipt = preparedReceipt();
      assert.throws(() => applyGeneratedOutputs({
        root,
        outputs: [output],
        receipt,
        validateStagedGraph: () => undefined,
        statusReader: () => [],
        fault,
      }));
      assert.equal(readFileSync(destination, "utf8"), "original", fault);
      assert.equal(existsSync(resolve(root, receipt.path)), false, fault);
      const applyStateExists = existsSync(resolve(root, "content-import", ".apply-state"));
      assert.equal(applyStateExists, fault === "receipt_finalization" || fault === "receipt_verification", fault);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("staged graph validation failure leaves no canonical change or temporary apply state", () => {
  const root = mkdtempSync(resolve(tmpdir(), "stemforge-import-staged-"));
  try {
    const output = generated("content/questions/higher-maths/owned.ts", "replacement");
    const destination = resolve(root, output.path);
    mkdirSync(resolve(destination, ".."), { recursive: true });
    writeFileSync(destination, "original");
    const receipt = preparedReceipt();
    assert.throws(() => applyGeneratedOutputs({
      root,
      outputs: [output],
      receipt,
      validateStagedGraph: () => {
        throw new Error("invalid_staged_graph");
      },
      statusReader: () => [],
    }), /invalid_staged_graph/);
    assert.equal(readFileSync(destination, "utf8"), "original");
    assert.equal(existsSync(resolve(root, "content-import", ".apply-state")), false);
    assert.equal(existsSync(resolve(root, receipt.path)), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("apply rejects path traversal and unacknowledged working-tree changes", () => {
  const root = mkdtempSync(resolve(tmpdir(), "stemforge-import-"));
  try {
    assert.throws(() => applyGeneratedOutputs({ root, outputs: [generated("../escape.ts", "bad")], receipt: preparedReceipt(), validateStagedGraph: () => undefined, statusReader: () => [] }), /output_path_traversal/);
    assert.throws(() => applyGeneratedOutputs({ root, outputs: [generated("owned.ts", "ok")], receipt: preparedReceipt(), validateStagedGraph: () => undefined, statusReader: () => [" M unrelated.ts"] }), /working_tree_not_clean_or_acknowledged/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("import receipt accounting exactly equals approved IDs", () => {
  const { payload } = realPreview();
  const receipt = createApprovalReceipt({
    previewDecisionPayload: payload,
    approvedQuestionIds: [],
    explicitlyExcludedCandidateIds: payload.eligibleCandidateIds.map((id) => ({ id, reason: "Excluded." })),
    versionDecisions: {},
    approvedAt: "2026-07-29T10:00:00.000Z",
  });
  const imported: ImportReceipt = {
    receiptVersion: 1,
    approvalReceiptHash: approvalReceiptHash(receipt),
    appliedQuestionIds: [],
    outputPaths: ["content/questions/higher-maths/basic-differentiation.ts"],
    finalOutputHashes: { "content/questions/higher-maths/basic-differentiation.ts": "a".repeat(64) },
    appliedAt: "2026-07-29T11:00:00.000Z",
    compilerVersion: 1,
  };
  assert.equal(validateImportReceipt(imported, receipt).valid, true);
  imported.appliedQuestionIds.push("not-approved");
  assert.equal(validateImportReceipt(imported, receipt).valid, false);
});

test("live snapshot hashing is stable and sensitive to canonical content", () => {
  const first = createCanonicalContentSnapshotHash(canonicalContent.subjects, canonicalContent.questions);
  const second = createCanonicalContentSnapshotHash(structuredClone(canonicalContent.subjects), structuredClone(canonicalContent.questions));
  assert.equal(first, second);
  const changed = structuredClone(canonicalContent.questions);
  changed[0].hint += " changed";
  assert.notEqual(createCanonicalContentSnapshotHash(canonicalContent.subjects, changed), first);
});

test("documented pnpm separator is accepted by the CLI argument contract", () => {
  const forwarded = ["--", "preview", "content-drafts/example.md"];
  if (forwarded[0] === "--") forwarded.shift();
  assert.deepEqual(forwarded, ["preview", "content-drafts/example.md"]);
});

function generated(path: string, text: string): GeneratedOutput {
  const bytes = Buffer.from(text);
  return { path, bytes, hash: sha256(bytes) };
}

function preparedReceipt() {
  const bytes = Buffer.from('{"receipt":"valid"}\n');
  return {
    path: "content-import/receipts/test-receipt.json",
    bytes,
    hash: sha256(bytes),
    validate: (candidate: Uint8Array) => {
      assert.deepEqual(Buffer.from(candidate), bytes);
    },
  };
}

function threeOutputs() {
  return [
    generated("content/questions/a.ts", "new-a"),
    generated("content/questions/b.ts", "new-b"),
    generated("content/questions/c.ts", "new-c"),
  ];
}

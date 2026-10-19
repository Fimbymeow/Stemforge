import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, extname, isAbsolute, relative, resolve } from "node:path";
import { canonicalContent, canonicalQuestionModuleRegistry } from "@/data/canonical-content";
import { validateContent } from "@/lib/content-validation";
import {
  CONTENT_IMPORT_COMPILER_VERSION,
  applyGeneratedOutputs,
  assertGeneratedOutputPathsRegistered,
  approvalReceiptHash,
  createAcknowledgedWorkingTreeSnapshot,
  createApprovalReceipt,
  createCanonicalContentSnapshotHash,
  createStagedCanonicalContent,
  generateApprovedSkillModules,
  previewHash,
  reconstructPreviewDecisionPayload,
  renderPreview,
  sha256,
  validateApprovalFreshness,
  validateApprovalReceipt,
  validateImportReceipt,
  type ApprovalReceipt,
  type ImportReceipt,
  type PreviewDecisionPayload,
  type VersionDecision,
} from "@/lib/content-import";

const root = process.cwd();
const cliArguments = process.argv.slice(2);
if (cliArguments[0] === "--") cliArguments.shift();
const [command, target, ...args] = cliArguments;

async function main() {
  if (!command || !target || !["preview", "approve", "apply"].includes(command)) usage();
  if (command === "preview") return preview(target, args);
  if (command === "approve") return approve(target, args);
  return apply(target, args);
}

function preview(bankArgument: string, args: string[]) {
  const sourcePath = safePathWithin("content-drafts", bankArgument);
  const configFlag = option(args, "--config");
  const configPath = configFlag ? safePathWithin("content-drafts", configFlag) : sourcePath.replace(/\.md$/i, ".import.json");
  if (!existsSync(configPath)) throw new Error(`import_configuration_missing:${relative(root, configPath).replaceAll("\\", "/")}`);
  const sourceRelative = relative(root, sourcePath).replaceAll("\\", "/");
  const configurationRelative = relative(root, configPath).replaceAll("\\", "/");
  const reconstructed = reconstructPreviewDecisionPayload({
    sourcePath: sourceRelative,
    sourceBytes: readFileSync(sourcePath),
    configurationPath: configurationRelative,
    configurationBytes: readFileSync(configPath),
    subjects: canonicalContent.subjects,
    questions: canonicalContent.questions,
  });
  const payload = reconstructed.payload;
  const hash = previewHash(payload);
  const previewDirectory = resolve(root, "content-import", "previews");
  mkdirSync(previewDirectory, { recursive: true });
  const stem = basename(sourcePath, extname(sourcePath));
  const jsonPath = resolve(previewDirectory, `${stem}-${hash}.json`);
  const markdownPath = resolve(previewDirectory, `${stem}-${hash}.md`);
  writeFileSync(jsonPath, `${JSON.stringify({ previewHash: hash, previewDecisionPayload: payload }, null, 2)}\n`, { flag: "wx" });
  writeFileSync(markdownPath, `${renderPreview(payload)}\n`, { flag: "wx" });
  console.log(`Preview created: ${relative(root, markdownPath).replaceAll("\\", "/")}`);
  console.log(`Decision payload: ${relative(root, jsonPath).replaceAll("\\", "/")}`);
  console.log(`Accounting: total=${payload.sourceQuestionIds.length} eligible=${payload.eligibleCandidateIds.length} blocked=${payload.blockedIds.length} unchanged=${payload.unchangedIds.length}`);
}

function approve(previewArgument: string, args: string[]) {
  const previewPath = safePathWithin(resolve("content-import", "previews"), previewArgument);
  const previewFile = JSON.parse(readFileSync(previewPath, "utf8")) as { previewHash: string; previewDecisionPayload: PreviewDecisionPayload };
  if (previewHash(previewFile.previewDecisionPayload) !== previewFile.previewHash) throw new Error("preview_file_hash_mismatch");
  const reconstructed = reconstructFromPayloadIdentity(previewFile.previewDecisionPayload);
  const approvedQuestionIds = listOption(args, "--include");
  const exclusions = listOption(args, "--exclude").map((value) => {
    const separator = value.indexOf("=");
    if (separator < 1) throw new Error("exclude_requires_id_equals_reason");
    return { id: value.slice(0, separator), reason: value.slice(separator + 1) };
  });
  const decisionsPath = option(args, "--version-decisions");
  const versionDecisions = decisionsPath
    ? JSON.parse(readFileSync(safePathWithin(root, decisionsPath), "utf8")) as Record<string, VersionDecision>
    : {};
  const receipt = createApprovalReceipt({
    previewDecisionPayload: previewFile.previewDecisionPayload,
    approvedQuestionIds,
    explicitlyExcludedCandidateIds: exclusions,
    versionDecisions,
    approvedAt: new Date().toISOString(),
  });
  const validation = validateApprovalReceipt(receipt, {
    registry: reconstructed.registry,
    reconstructedPayload: reconstructed.payload,
  });
  if (!validation.valid) {
    printDiagnostics(validation.diagnostics);
    throw new Error("approval_receipt_invalid");
  }
  const outputDirectory = resolve(root, "content-import", "approvals");
  mkdirSync(outputDirectory, { recursive: true });
  const output = resolve(outputDirectory, `${receipt.previewHash}.json`);
  writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  console.log(`Approval receipt created: ${relative(root, output).replaceAll("\\", "/")}`);
}

function apply(approvalArgument: string, args: string[]) {
  const acknowledgeCurrentWorkingTree = args.includes("--acknowledge-current-working-tree");
  const acknowledgedWorkingTree = acknowledgeCurrentWorkingTree
    ? createAcknowledgedWorkingTreeSnapshot(readGitStatus())
    : undefined;
  const approvalPath = safePathWithin(resolve("content-import", "approvals"), approvalArgument);
  const receipt = JSON.parse(readFileSync(approvalPath, "utf8")) as ApprovalReceipt;
  const reconstructed = reconstructFromPayloadIdentity(receipt.previewDecisionPayload);
  const registry = reconstructed.registry;
  const receiptValidation = validateApprovalReceipt(receipt, {
    registry,
    reconstructedPayload: reconstructed.payload,
  });
  if (!receiptValidation.valid) {
    printDiagnostics(receiptValidation.diagnostics);
    throw new Error("approval_receipt_invalid");
  }
  const payload = receipt.previewDecisionPayload;
  const freshness = validateApprovalFreshness({
    receipt,
    currentSourceHash: reconstructed.bank.rawSourceHash,
    currentConfigurationPath: reconstructed.payload.configurationPath,
    currentConfigurationBytesHash: reconstructed.payload.configurationBytesHash,
    currentConfigurationHash: reconstructed.configuration.configurationHash!,
    currentLiveSnapshotHash: createCanonicalContentSnapshotHash(canonicalContent.subjects, canonicalContent.questions),
  });
  if (!freshness.valid) {
    printDiagnostics(freshness.diagnostics);
    throw new Error("approval_is_stale");
  }
  const outputs = generateApprovedSkillModules(receipt, registry);
  assertGeneratedOutputPathsRegistered(outputs, canonicalQuestionModuleRegistry);
  const hypothetical = createStagedCanonicalContent({
    approval: receipt,
    registry,
    subjects: canonicalContent.subjects,
    questions: canonicalContent.questions,
  });
  const report = validateContent(hypothetical);
  if (report.errors.length) throw new Error(`staged_content_graph_invalid:${report.errors.map((item) => item.code).join(",")}`);
  const importReceipt: ImportReceipt = {
    receiptVersion: 1,
    approvalReceiptHash: approvalReceiptHash(receipt),
    appliedQuestionIds: [...receipt.approvedQuestionIds],
    outputPaths: outputs.map((output) => output.path),
    finalOutputHashes: Object.fromEntries(outputs.map((output) => [output.path, output.hash])),
    appliedAt: new Date().toISOString(),
    compilerVersion: CONTENT_IMPORT_COMPILER_VERSION,
  };
  const importValidation = validateImportReceipt(importReceipt, receipt);
  if (!importValidation.valid) throw new Error("generated_import_receipt_invalid");
  const receiptRelativePath = `content-import/receipts/${approvalReceiptHash(receipt)}.json`;
  const receiptBytes = Buffer.from(`${JSON.stringify(importReceipt, null, 2)}\n`, "utf8");
  const applied = applyGeneratedOutputs({
    root,
    outputs,
    receipt: {
      path: receiptRelativePath,
      bytes: receiptBytes,
      hash: sha256(receiptBytes),
      validate: (bytes) => {
        let persisted: unknown;
        try {
          persisted = JSON.parse(Buffer.from(bytes).toString("utf8"));
        } catch {
          throw new Error("persisted_import_receipt_malformed");
        }
        const validation = validateImportReceipt(persisted, receipt);
        if (!validation.valid) throw new Error("persisted_import_receipt_invalid");
      },
    },
    validateStagedGraph: (staged) => {
      if (staged.some((output) => sha256(output.bytes) !== output.hash)) throw new Error("staged_output_hash_invalid");
      const stagedReport = validateContent(hypothetical);
      if (stagedReport.errors.length) throw new Error("staged_content_graph_invalid");
    },
    acknowledgedWorkingTree,
  });
  console.log(`Applied ${importReceipt.appliedQuestionIds.length} approved questions.`);
  console.log(`Import receipt: ${applied.receiptPath}`);
}

function readGitStatus() {
  return execFileSync("git", ["status", "--porcelain=v1", "-uall"], {
    cwd: root,
    encoding: "utf8",
  }).split(/\r?\n/).filter(Boolean);
}

function reconstructFromPayloadIdentity(payload: PreviewDecisionPayload) {
  const sourcePath = safePathWithin("content-drafts", payload.sourcePath);
  const configurationPath = safePathWithin("content-drafts", payload.configurationPath);
  const sourceRelative = relative(root, sourcePath).replaceAll("\\", "/");
  const configurationRelative = relative(root, configurationPath).replaceAll("\\", "/");
  if (sourceRelative !== payload.sourcePath || configurationRelative !== payload.configurationPath) {
    throw new Error("non_canonical_preview_path_identity");
  }
  return reconstructPreviewDecisionPayload({
    sourcePath: sourceRelative,
    sourceBytes: readFileSync(sourcePath),
    configurationPath: configurationRelative,
    configurationBytes: readFileSync(configurationPath),
    subjects: canonicalContent.subjects,
    questions: canonicalContent.questions,
  });
}

function safePathWithin(boundary: string, argument: string) {
  const base = isAbsolute(boundary) ? boundary : resolve(root, boundary);
  const candidate = isAbsolute(argument) ? resolve(argument) : resolve(root, argument);
  const fromBase = relative(base, candidate);
  if (!fromBase || fromBase.startsWith("..") || isAbsolute(fromBase)) throw new Error("path_outside_allowed_content_import_boundary");
  return candidate;
}

function option(args: string[], name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function listOption(args: string[], name: string) {
  const index = args.indexOf(name);
  if (index < 0) return [];
  const values: string[] = [];
  for (let cursor = index + 1; cursor < args.length && !args[cursor].startsWith("--"); cursor += 1) values.push(args[cursor]);
  return values;
}

function printDiagnostics(diagnostics: Array<{ code: string; message: string }>) {
  diagnostics.forEach((item) => console.error(`${item.code}: ${item.message}`));
}

function usage(): never {
  throw new Error("Usage: import-content <preview|approve|apply> <path> [options]");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "content_import_failed");
  process.exitCode = 1;
});

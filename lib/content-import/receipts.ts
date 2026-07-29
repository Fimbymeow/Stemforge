import { canonicalSerialize, sha256 } from "@/lib/content-import/canonical";
import { previewHash } from "@/lib/content-import/preview";
import type {
  ApprovalReceipt,
  ImportDiagnostic,
  ImportReceipt,
  ImportRegistry,
  PreviewDecisionPayload,
  VersionDecision,
} from "@/lib/content-import/types";

export function validateApprovalReceipt(
  value: unknown,
  context?: {
    registry: ImportRegistry;
    reconstructedPayload: PreviewDecisionPayload;
  },
): { valid: boolean; diagnostics: ImportDiagnostic[] } {
  const diagnostics: ImportDiagnostic[] = [];
  if (!isApprovalReceiptShape(value)) return { valid: false, diagnostics: [error("malformed_approval_receipt", "Approval receipt shape is invalid or contains unexpected keys.")] };
  const receipt = value;
  if (receipt.receiptVersion !== 1) diagnostics.push(error("unsupported_approval_receipt_version", "Approval receipt version is unsupported."));
  if (previewHash(receipt.previewDecisionPayload) !== receipt.previewHash) diagnostics.push(error("preview_hash_mismatch", "Embedded preview decision payload does not reproduce previewHash."));
  const payload = receipt.previewDecisionPayload;
  if (!context) {
    diagnostics.push(error("approval_reconstruction_required", "Approval validation requires a freshly reconstructed preview."));
  } else {
    const reconstructed = context.reconstructedPayload;
    if (canonicalSerialize(payload) !== canonicalSerialize(reconstructed) ||
        receipt.previewHash !== previewHash(reconstructed)) {
      diagnostics.push(error("reconstructed_preview_mismatch", "Embedded preview does not exactly match the current reconstructed preview."));
    }
  }
  if (!payload.importable || payload.diagnostics.some((item) => item?.severity === "error")) {
    diagnostics.push(error("invalid_preview_not_approvable", "A preview containing source errors is not approvable."));
  }
  const approved = receipt.approvedQuestionIds;
  const excluded = receipt.explicitlyExcludedCandidateIds.map((item) => item.id);
  if (hasDuplicates(approved) || hasDuplicates(excluded)) diagnostics.push(error("duplicate_approval_id", "Approval and exclusion lists must not contain duplicate IDs."));
  if (new Set([...approved, ...excluded]).size !== approved.length + excluded.length) diagnostics.push(error("approval_partition_overlap", "A candidate cannot be both approved and explicitly excluded."));
  if (!sameSet(payload.eligibleCandidateIds, [...approved, ...excluded])) diagnostics.push(error("approval_accounting_mismatch", "Every eligible candidate must be explicitly approved or explicitly excluded."));
  const sourceIds = new Set(payload.sourceQuestionIds);
  for (const id of [...approved, ...excluded]) if (!sourceIds.has(id)) diagnostics.push(error("approval_id_not_in_preview", `Selected ID "${id}" does not belong to the embedded preview.`));
  for (const id of approved) {
    if (payload.blockedIds.includes(id)) diagnostics.push(error("blocked_question_approved", `Blocked question "${id}" cannot be approved.`));
    if (payload.unchangedIds.includes(id)) diagnostics.push(error("unchanged_question_approved", `Unchanged question "${id}" cannot be approved.`));
  }
  for (const exclusion of receipt.explicitlyExcludedCandidateIds) {
    if (!exclusion.reason?.trim() || exclusion.reason.length > 500) diagnostics.push(error("invalid_exclusion_reason", `Excluded candidate "${exclusion.id}" requires a bounded reason.`));
  }
  const collisions = new Map(payload.collisionDiffs.filter((item) => !item.identical).map((item) => [item.questionId, item]));
  for (const id of approved) {
    const collision = collisions.get(id);
    if (collision) {
      const decision = receipt.versionDecisions[id];
      if (!decision) diagnostics.push(error("missing_version_decision", `Approved collision "${id}" requires an explicit version decision.`));
      else validateVersionDecision(id, decision, collision.availableVersionDecisions, diagnostics);
    } else if (receipt.versionDecisions[id]) diagnostics.push(error("unexpected_version_decision", `Non-colliding question "${id}" must not carry a version decision.`));
  }
  for (const id of Object.keys(receipt.versionDecisions)) if (!approved.includes(id)) diagnostics.push(error("orphan_version_decision", `Version decision "${id}" does not belong to an approved question.`));
  if (!isIsoInstant(receipt.approvedAt)) diagnostics.push(error("invalid_approved_at", "approvedAt must be a valid UTC instant."));
  return { valid: !diagnostics.length, diagnostics };
}

export function validateApprovalFreshness(input: {
  receipt: ApprovalReceipt;
  currentSourceHash: string;
  currentConfigurationPath: string;
  currentConfigurationBytesHash: string;
  currentConfigurationHash: string;
  currentLiveSnapshotHash: string;
}) {
  const diagnostics: ImportDiagnostic[] = [];
  const payload = input.receipt.previewDecisionPayload;
  if (payload.sourceBytesHash !== input.currentSourceHash) diagnostics.push(error("stale_source", "Source bytes have changed since preview."));
  if (payload.configurationPath !== input.currentConfigurationPath) diagnostics.push(error("stale_configuration_path", "Import configuration identity has changed since preview."));
  if (payload.configurationBytesHash !== input.currentConfigurationBytesHash) diagnostics.push(error("stale_configuration_bytes", "Import configuration bytes have changed since preview."));
  if (payload.configurationHash !== input.currentConfigurationHash) diagnostics.push(error("stale_configuration", "Import configuration has changed since preview."));
  if (payload.liveCanonicalContentSnapshotHash !== input.currentLiveSnapshotHash) diagnostics.push(error("stale_live_snapshot", "Canonical content has changed since preview."));
  return { valid: !diagnostics.length, diagnostics };
}

export function approvalReceiptHash(receipt: ApprovalReceipt) {
  return sha256(canonicalSerialize(receipt));
}

export function validateImportReceipt(value: unknown, approval: ApprovalReceipt) {
  const diagnostics: ImportDiagnostic[] = [];
  if (!isImportReceiptShape(value)) return { valid: false, diagnostics: [error("malformed_import_receipt", "Import receipt shape is invalid or contains unexpected keys.")] };
  const receipt = value;
  if (receipt.receiptVersion !== 1) diagnostics.push(error("unsupported_import_receipt_version", "Import receipt version is unsupported."));
  if (receipt.approvalReceiptHash !== approvalReceiptHash(approval)) diagnostics.push(error("approval_receipt_hash_mismatch", "Import receipt does not reference the supplied approval receipt."));
  if (!sameSet(receipt.appliedQuestionIds, approval.approvedQuestionIds)) diagnostics.push(error("import_receipt_accounting_mismatch", "Applied question IDs must exactly equal approved question IDs."));
  if (hasDuplicates(receipt.appliedQuestionIds) || hasDuplicates(receipt.outputPaths)) diagnostics.push(error("duplicate_import_receipt_value", "Import receipt lists must be unique."));
  if (!isIsoInstant(receipt.appliedAt)) diagnostics.push(error("invalid_applied_at", "appliedAt must be a valid UTC instant."));
  for (const path of receipt.outputPaths) {
    if (!Object.hasOwn(receipt.finalOutputHashes, path) || !/^[a-f0-9]{64}$/.test(receipt.finalOutputHashes[path] ?? "")) {
      diagnostics.push(error("invalid_final_output_hash", `Output "${path}" is missing a SHA-256 hash.`));
    }
  }
  if (!sameSet(receipt.outputPaths, Object.keys(receipt.finalOutputHashes))) {
    diagnostics.push(error("import_receipt_output_hash_accounting_mismatch", "Output paths and final hash keys must match exactly."));
  }
  return { valid: !diagnostics.length, diagnostics };
}

export function createApprovalReceipt(input: Omit<ApprovalReceipt, "receiptVersion" | "previewHash"> & { previewDecisionPayload: PreviewDecisionPayload }): ApprovalReceipt {
  return {
    receiptVersion: 1,
    previewHash: previewHash(input.previewDecisionPayload),
    previewDecisionPayload: input.previewDecisionPayload,
    approvedQuestionIds: input.approvedQuestionIds,
    explicitlyExcludedCandidateIds: input.explicitlyExcludedCandidateIds,
    versionDecisions: input.versionDecisions,
    approvedAt: input.approvedAt,
  };
}

function validateVersionDecision(
  id: string,
  decision: VersionDecision,
  allowed: VersionDecision["kind"][],
  diagnostics: ImportDiagnostic[],
) {
  if (!allowed.includes(decision.kind)) {
    diagnostics.push(error("inconsistent_version_decision", `Decision "${decision.kind}" is not available for collision "${id}".`));
    return;
  }
}

function sameSet(left: string[], right: string[]) {
  return left.length === right.length && [...left].sort().join("\0") === [...right].sort().join("\0");
}

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length;
}

function isIsoInstant(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function error(code: string, message: string): ImportDiagnostic {
  return { code, severity: "error", message };
}

function isApprovalReceiptShape(value: unknown): value is ApprovalReceipt {
  if (!exactRecord(value, ["receiptVersion", "previewHash", "previewDecisionPayload", "approvedQuestionIds", "explicitlyExcludedCandidateIds", "versionDecisions", "approvedAt"])) return false;
  if (value.receiptVersion !== 1 || typeof value.previewHash !== "string" || !/^[a-f0-9]{64}$/.test(value.previewHash) ||
      !isPreviewPayloadShape(value.previewDecisionPayload) || !stringArray(value.approvedQuestionIds) ||
      !Array.isArray(value.explicitlyExcludedCandidateIds) || !exactRecord(value.versionDecisions) ||
      typeof value.approvedAt !== "string") return false;
  return value.explicitlyExcludedCandidateIds.every((item) =>
    exactRecord(item, ["id", "reason"]) && typeof item.id === "string" && typeof item.reason === "string") &&
    Object.values(value.versionDecisions).every(isVersionDecisionShape);
}

function isPreviewPayloadShape(value: unknown): value is PreviewDecisionPayload {
  return exactRecord(value, [
    "payloadVersion", "compilerVersion", "importable", "sourcePath", "sourceBytesHash",
    "configurationPath", "configurationBytesHash", "configuration",
    "configurationHash", "liveCanonicalContentSnapshotHash", "sourceQuestionIds", "classifications",
    "eligibleCandidateIds", "blockedIds", "unchangedIds", "collisionDiffs", "plannedOutputs", "diagnostics",
  ]) && value.payloadVersion === 1 && value.compilerVersion === 1 && typeof value.importable === "boolean" &&
    typeof value.sourcePath === "string" && typeof value.sourceBytesHash === "string" &&
    typeof value.configurationPath === "string" && typeof value.configurationBytesHash === "string" &&
    typeof value.configurationHash === "string" && typeof value.liveCanonicalContentSnapshotHash === "string" &&
    stringArray(value.sourceQuestionIds) && stringArray(value.eligibleCandidateIds) &&
    stringArray(value.blockedIds) && stringArray(value.unchangedIds) &&
    Array.isArray(value.classifications) && Array.isArray(value.collisionDiffs) &&
    Array.isArray(value.plannedOutputs) && Array.isArray(value.diagnostics) &&
    value.configuration !== null && typeof value.configuration === "object";
}

function isImportReceiptShape(value: unknown): value is ImportReceipt {
  return exactRecord(value, ["receiptVersion", "approvalReceiptHash", "appliedQuestionIds", "outputPaths", "finalOutputHashes", "appliedAt", "compilerVersion"]) &&
    value.receiptVersion === 1 && value.compilerVersion === 1 &&
    typeof value.approvalReceiptHash === "string" && stringArray(value.appliedQuestionIds) &&
    stringArray(value.outputPaths) && exactRecord(value.finalOutputHashes) &&
    Object.values(value.finalOutputHashes).every((item) => typeof item === "string") &&
    typeof value.appliedAt === "string";
}

function isVersionDecisionShape(value: unknown): value is VersionDecision {
  if (!exactRecord(value)) return false;
  const kind = value.kind;
  if (!["content_revision_bump", "question_version_bump"].includes(String(kind))) return false;
  return exactRecord(value, ["kind"]);
}

function exactRecord(value: unknown, allowed?: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return !allowed || (Object.keys(value).length === allowed.length && Object.keys(value).every((key) => allowed.includes(key)));
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

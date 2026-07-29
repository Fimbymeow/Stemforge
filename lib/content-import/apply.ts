import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { canonicalSerialize, sha256 } from "@/lib/content-import/canonical";
import type { GeneratedOutput, PreparedImportReceipt } from "@/lib/content-import/types";

export type AcknowledgedWorkingTreeSnapshot = {
  statusLines: string[];
  hash: string;
};

export type ApplyFault =
  | "after_first_replacement"
  | "after_middle_replacement"
  | "after_final_replacement"
  | "post_write_verification_corruption"
  | "receipt_validation"
  | "receipt_directory_creation"
  | "receipt_temporary_write"
  | "receipt_finalization"
  | "receipt_verification";

type OriginalOutput = {
  path: string;
  existed: boolean;
  bytes: string | null;
  hash: string | null;
};

export function createAcknowledgedWorkingTreeSnapshot(statusLines: string[]): AcknowledgedWorkingTreeSnapshot {
  const sorted = [...statusLines].sort();
  return { statusLines: sorted, hash: sha256(canonicalSerialize(sorted)) };
}

export function applyGeneratedOutputs(input: {
  root: string;
  outputs: GeneratedOutput[];
  receipt: PreparedImportReceipt;
  validateStagedGraph: (stagedOutputs: GeneratedOutput[]) => void;
  acknowledgedWorkingTree?: AcknowledgedWorkingTreeSnapshot;
  statusReader?: () => string[];
  fault?: ApplyFault;
}) {
  const root = resolve(input.root);
  const outputs = [...input.outputs].sort((left, right) => left.path.localeCompare(right.path));
  if (!outputs.length) throw new Error("no_generated_outputs");
  const statusLines = (input.statusReader ?? (() => readGitStatus(root)))();
  if (statusLines.length) {
    const acknowledged = input.acknowledgedWorkingTree;
    const current = createAcknowledgedWorkingTreeSnapshot(statusLines);
    if (!acknowledged || acknowledged.hash !== current.hash ||
        canonicalSerialize(acknowledged.statusLines) !== canonicalSerialize(current.statusLines)) {
      throw new Error("working_tree_not_clean_or_acknowledged");
    }
  }
  const destinations = outputs.map((output) => secureDestination(root, output.path));
  if (new Set(destinations).size !== destinations.length) throw new Error("duplicate_output_destination");
  outputs.forEach((output) => {
    if (sha256(output.bytes) !== output.hash) throw new Error(`generated_output_hash_mismatch:${output.path}`);
  });
  if (sha256(input.receipt.bytes) !== input.receipt.hash) throw new Error("prepared_import_receipt_hash_mismatch");

  const transactionId = randomUUID();
  const stateRoot = resolve(root, "content-import", ".apply-state", transactionId);
  const stagingRoot = resolve(stateRoot, "staging");
  const recoveryPath = resolve(stateRoot, "recovery.json");
  const receiptDestination = secureDestination(root, input.receipt.path);
  if (destinations.includes(receiptDestination)) throw new Error("receipt_destination_overlaps_canonical_output");
  const receiptDirectory = dirname(receiptDestination);
  const receiptDirectoryExisted = existsSync(receiptDirectory);
  const temporaryReceiptPath = `${receiptDestination}.tmp-${transactionId}`;
  let originals: OriginalOutput[] = [];
  let canonicalWritesStarted = false;
  let receiptFinalized = false;

  try {
    if (input.fault === "receipt_validation") throw new Error("injected_receipt_validation_failure");
    input.receipt.validate(input.receipt.bytes);

    mkdirSync(stagingRoot, { recursive: true });
    outputs.forEach((output) => {
      const staged = secureDestination(stagingRoot, output.path);
      mkdirSync(dirname(staged), { recursive: true });
      writeFileSync(staged, output.bytes);
    });
    input.validateStagedGraph(outputs);

    if (input.fault === "receipt_directory_creation") throw new Error("injected_receipt_directory_creation_failure");
    mkdirSync(receiptDirectory, { recursive: true });
    if (existsSync(receiptDestination)) throw new Error("import_receipt_already_exists");
    writeFileSync(temporaryReceiptPath, input.receipt.bytes, { flag: "wx" });
    if (input.fault === "receipt_temporary_write") throw new Error("injected_receipt_temporary_write_failure");
    const stagedReceipt = readFileSync(temporaryReceiptPath);
    if (sha256(stagedReceipt) !== input.receipt.hash) throw new Error("staged_import_receipt_hash_mismatch");
    input.receipt.validate(stagedReceipt);

    originals = destinations.map((destination, index) => ({
      path: outputs[index].path,
      existed: existsSync(destination),
      bytes: existsSync(destination) ? readFileSync(destination).toString("base64") : null,
      hash: existsSync(destination) ? sha256(readFileSync(destination)) : null,
    }));
    writeFileSync(recoveryPath, JSON.stringify({ version: 1, status: "prepared", originals }, null, 2));

    canonicalWritesStarted = true;
    for (let index = 0; index < outputs.length; index += 1) {
      const destination = destinations[index];
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, outputs[index].bytes);
      if (input.fault === "after_first_replacement" && index === 0) throw new Error("injected_after_first_replacement");
      if (input.fault === "after_middle_replacement" && index === Math.floor((outputs.length - 1) / 2)) throw new Error("injected_after_middle_replacement");
      if (input.fault === "after_final_replacement" && index === outputs.length - 1) throw new Error("injected_after_final_replacement");
    }
    if (input.fault === "post_write_verification_corruption") {
      writeFileSync(destinations[0], Buffer.concat([readFileSync(destinations[0]), Buffer.from("\ncorrupted")]));
    }
    outputs.forEach((output, index) => {
      const final = readFileSync(destinations[index]);
      if (sha256(final) !== output.hash) throw new Error(`post_write_hash_mismatch:${output.path}`);
    });

    if (input.fault === "receipt_finalization") throw new Error("injected_receipt_finalization_failure");
    renameSync(temporaryReceiptPath, receiptDestination);
    receiptFinalized = true;
    if (input.fault === "receipt_verification") throw new Error("injected_receipt_verification_failure");
    const persistedReceipt = readFileSync(receiptDestination);
    if (sha256(persistedReceipt) !== input.receipt.hash) throw new Error("persisted_import_receipt_hash_mismatch");
    input.receipt.validate(persistedReceipt);

    rmSync(stateRoot, { recursive: true, force: true });
    removeEmptyApplyStateRoot(root);
    return {
      appliedPaths: outputs.map((output) => output.path),
      hashes: Object.fromEntries(outputs.map((output) => [output.path, output.hash])),
      receiptPath: input.receipt.path,
      receiptHash: input.receipt.hash,
    };
  } catch (cause) {
    let rollbackWriteFailed = false;
    if (canonicalWritesStarted) {
      for (let index = originals.length - 1; index >= 0; index -= 1) {
        const original = originals[index];
        const destination = destinations[index];
        try {
          if (original.existed && original.bytes !== null) {
            mkdirSync(dirname(destination), { recursive: true });
            writeFileSync(destination, Buffer.from(original.bytes, "base64"));
          } else {
            rmSync(destination, { force: true });
          }
        } catch {
          rollbackWriteFailed = true;
        }
      }
    }
    if (receiptFinalized) rmSync(receiptDestination, { force: true });
    rmSync(temporaryReceiptPath, { force: true });
    const rollbackVerified = canonicalWritesStarted && !rollbackWriteFailed && originals.every((original, index) =>
      original.existed
        ? existsSync(destinations[index]) && sha256(readFileSync(destinations[index])) === original.hash
        : !existsSync(destinations[index]));
    if (canonicalWritesStarted) {
      mkdirSync(stateRoot, { recursive: true });
      writeFileSync(recoveryPath, JSON.stringify({
        version: 1,
        status: rollbackVerified ? "rolled_back_after_failure" : "rollback_verification_failed",
        originals,
        failure: cause instanceof Error ? cause.message : "unknown_apply_failure",
      }, null, 2));
    } else {
      rmSync(stateRoot, { recursive: true, force: true });
      removeEmptyApplyStateRoot(root);
      if (!receiptDirectoryExisted && existsSync(receiptDirectory) && readdirSync(receiptDirectory).length === 0) {
        rmSync(receiptDirectory, { force: true });
      }
    }
    throw cause;
  }
}

function readGitStatus(root: string) {
  return execFileSync("git", ["status", "--porcelain=v1", "-uall"], { cwd: root, encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
}

function secureDestination(root: string, relativePath: string) {
  if (isAbsolute(relativePath) || relativePath.includes("\0")) throw new Error("unsafe_output_path");
  const destination = resolve(root, relativePath);
  const fromRoot = relative(root, destination);
  if (!fromRoot || fromRoot.startsWith("..") || isAbsolute(fromRoot)) throw new Error("output_path_traversal");
  return destination;
}

function removeEmptyApplyStateRoot(root: string) {
  const applyStateRoot = resolve(root, "content-import", ".apply-state");
  if (existsSync(applyStateRoot) && readdirSync(applyStateRoot).length === 0) {
    rmSync(applyStateRoot, { recursive: true, force: true });
  }
}

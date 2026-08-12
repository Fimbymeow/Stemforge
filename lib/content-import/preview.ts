import type { Question, Subject } from "@/data/types";
import { canonicalSerialize, hashCanonical, sha256 } from "@/lib/content-import/canonical";
import { classifyBank } from "@/lib/content-import/classification";
import { createImportRegistry, parseAndValidateBankConfiguration } from "@/lib/content-import/configuration";
import { parseMarkdownBank } from "@/lib/content-import/parser";
import type {
  BankImportConfiguration,
  ContentBankIR,
  ImportClassification,
  ImportDiagnostic,
  ImportRegistry,
  PreviewDecisionPayload,
} from "@/lib/content-import/types";

export function createCanonicalContentSnapshotHash(subjects: readonly Subject[], questions: readonly Question[]) {
  return hashCanonical({
    subjects,
    questions: [...questions].sort((left, right) => left.id.localeCompare(right.id)),
  });
}

export function createPreviewDecisionPayload(input: {
  bank: ContentBankIR;
  configuration: BankImportConfiguration;
  configurationPath: string;
  configurationBytesHash: string;
  configurationHash: string;
  registry: ImportRegistry;
  subjects: readonly Subject[];
  questions: readonly Question[];
}): PreviewDecisionPayload {
  const classified = classifyBank(input.bank, input.configuration, input.registry);
  const importable = !input.bank.diagnostics.some((item) => item.severity === "error") &&
    !classified.classifications.some((item) => item.diagnostics.some((diagnostic) => diagnostic.severity === "error"));
  const classifications = importable ? classified.classifications : classified.classifications.map((item) => {
    const blocked: ImportClassification = {
      ...item,
      status: "blocked" as const,
      blockers: [...item.blockers, {
        code: "invalid_bank_source",
        message: "The source bank contains error-level parser diagnostics and is not importable.",
      }],
    };
    delete blocked.canonicalQuestion;
    return blocked;
  });
  const collisionDiffs = classified.collisionDiffs;
  const eligibleCandidateIds = classifications.filter((item) => item.status === "ready" || item.status === "convertible").map((item) => item.questionId);
  const blockedIds = classifications.filter((item) => item.status === "blocked").map((item) => item.questionId);
  const unchangedIds = classifications.filter((item) => item.status === "unchanged").map((item) => item.questionId);
  const sourceQuestionIds = input.bank.questions.map((question) => question.id);
  const diagnostics: ImportDiagnostic[] = [...input.bank.diagnostics, ...classifications.flatMap((item) => item.diagnostics)];
  const plannedOutputs = classifications.flatMap((classification) => classification.canonicalQuestion ? [{
    questionId: classification.questionId,
    path: skillOwnedOutputPath(classification.targetSkillPathSlug ?? ""),
    contentHash: sha256(canonicalSerialize(classification.canonicalQuestion)),
  }] : []);
  assertPreviewAccounting(sourceQuestionIds, eligibleCandidateIds, blockedIds, unchangedIds);
  return {
    payloadVersion: 1,
    compilerVersion: input.bank.compilerVersion,
    importable,
    sourcePath: input.bank.sourcePath,
    sourceBytesHash: input.bank.rawSourceHash,
    configurationPath: input.configurationPath,
    configurationBytesHash: input.configurationBytesHash,
    configuration: input.configuration,
    configurationHash: input.configurationHash,
    liveCanonicalContentSnapshotHash: createCanonicalContentSnapshotHash(input.subjects, input.questions),
    sourceQuestionIds,
    classifications,
    eligibleCandidateIds,
    blockedIds,
    unchangedIds,
    collisionDiffs,
    plannedOutputs,
    diagnostics,
  };
}

export function reconstructPreviewDecisionPayload(input: {
  sourcePath: string;
  sourceBytes: Uint8Array;
  configurationPath: string;
  configurationBytes: Uint8Array;
  subjects: readonly Subject[];
  questions: readonly Question[];
}) {
  const bank = parseMarkdownBank({ sourcePath: input.sourcePath, bytes: input.sourceBytes });
  const registry = createImportRegistry(input.subjects, input.questions);
  const configuration = parseAndValidateBankConfiguration(
    Buffer.from(input.configurationBytes).toString("utf8"),
    registry,
    bank,
  );
  if (!configuration.valid || !configuration.configuration || !configuration.configurationHash) {
    const codes = configuration.diagnostics.map((item) => item.code).join(",");
    throw new Error(`import_configuration_invalid:${codes}`);
  }
  const payload = createPreviewDecisionPayload({
    bank,
    configuration: configuration.configuration,
    configurationPath: input.configurationPath,
    configurationBytesHash: sha256(input.configurationBytes),
    configurationHash: configuration.configurationHash,
    registry,
    subjects: input.subjects,
    questions: input.questions,
  });
  return { bank, registry, configuration, payload };
}

export function previewHash(payload: PreviewDecisionPayload) {
  return sha256(canonicalSerialize(payload));
}

export function renderPreview(payload: PreviewDecisionPayload) {
  const counts = {
    total: payload.sourceQuestionIds.length,
    eligible: payload.eligibleCandidateIds.length,
    blocked: payload.blockedIds.length,
    unchanged: payload.unchangedIds.length,
    collisions: payload.collisionDiffs.length,
  };
  return [
    "# Orthic Content Import Preview",
    "",
    `Preview hash: ${previewHash(payload)}`,
    `Source: ${payload.sourcePath}`,
    `Compiler: ${payload.compilerVersion}`,
    `Importable: ${payload.importable ? "yes" : "no"}`,
    "",
    "## Accounting",
    "",
    `- Total source questions: ${counts.total}`,
    `- Eligible candidates: ${counts.eligible}`,
    `- Blocked: ${counts.blocked}`,
    `- Unchanged: ${counts.unchanged}`,
    `- Exact-ID collisions: ${counts.collisions}`,
    "",
    "## Questions",
    "",
    ...payload.classifications.flatMap((item) => [
      `### ${item.questionId} — ${item.status}`,
      `Source lines: ${item.sourceLineRange.start}-${item.sourceLineRange.end}`,
      `Target: ${item.targetSkillPathSlug ?? "unresolved"} / ${item.targetStageId ?? "unresolved"}`,
      ...(item.blockers.length ? item.blockers.map((blocker) => `- Blocker: ${blocker.code} — ${blocker.message}`) : ["- No blockers"]),
      ...(item.diagnostics.length ? item.diagnostics.map((diagnostic) => `- ${diagnostic.severity}: ${diagnostic.code} — ${diagnostic.message}`) : []),
      "",
    ]),
  ].join("\n");
}

export function assertPreviewAccounting(source: string[], eligible: string[], blocked: string[], unchanged: string[]) {
  const partitions = [...eligible, ...blocked, ...unchanged];
  if (new Set(source).size !== source.length || new Set(partitions).size !== partitions.length ||
      [...source].sort().join("\0") !== [...partitions].sort().join("\0")) {
    throw new Error("preview_accounting_mismatch");
  }
}

export function skillOwnedOutputPath(pathSlug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathSlug)) throw new Error("unsafe_output_path_slug");
  return `content/questions/higher-maths/${pathSlug}.ts`;
}

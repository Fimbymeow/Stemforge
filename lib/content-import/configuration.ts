import type { Question, Subject } from "@/data/types";
import { canonicalSerialize, sha256 } from "@/lib/content-import/canonical";
import type {
  BankImportConfiguration,
  ConfigurationValidationResult,
  ContentBankIR,
  ImportDiagnostic,
  ImportRegistry,
  ImportRegistryPath,
} from "@/lib/content-import/types";

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONFIG_KEYS = new Set(["bankId", "sourceBankVersion", "targetSkillPathSlug", "stageNameToStageId", "pathOverrides", "runMode"]);
const OVERRIDE_KEYS = new Set(["questionIds", "targetSkillPathSlug", "stageNameToStageId"]);
const PROTOTYPE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function createImportRegistry(subjects: readonly Subject[], questions: readonly Question[]): ImportRegistry {
  const paths = new Map<string, ImportRegistryPath>();
  for (const subject of subjects) {
    for (const course of subject.courseAreas) {
      for (const specArea of course.specAreas) {
        for (const path of specArea.skillPaths ?? []) {
          paths.set(path.slug, {
            slug: path.slug,
            subject: subject.subject,
            courseArea: course.name,
            specArea: specArea.name,
            name: path.name,
            stages: (path.learningStages ?? []).map((stage) => ({
              id: stage.id,
              names: [...new Set([stage.name, stage.label, stage.title])],
            })),
          });
        }
      }
    }
  }
  return { paths, questions: new Map(questions.map((question) => [question.id, question])) };
}

export function parseAndValidateBankConfiguration(
  raw: string,
  registry: ImportRegistry,
  bank?: ContentBankIR,
): ConfigurationValidationResult {
  const diagnostics: ImportDiagnostic[] = [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { valid: false, diagnostics: [{ code: "malformed_configuration_json", severity: "error", message: "Import configuration is not valid JSON." }] };
  }
  if (!isPlainRecord(value)) return { valid: false, diagnostics: [{ code: "malformed_configuration", severity: "error", message: "Import configuration must be a plain object." }] };
  rejectPrototypeKeys(value, diagnostics);
  rejectExtraKeys(value, CONFIG_KEYS, "configuration", diagnostics);
  const configuration = value as unknown as BankImportConfiguration;
  if (!safeText(configuration.bankId)) diagnostics.push(error("invalid_bank_id", "bankId must be a bounded safe ID."));
  if (!safeVersion(configuration.sourceBankVersion)) diagnostics.push(error("invalid_source_bank_version", "sourceBankVersion must be a bounded numeric version string."));
  if (!safeText(configuration.targetSkillPathSlug)) diagnostics.push(error("invalid_target_skill_path", "targetSkillPathSlug must be a bounded safe slug."));
  if (!["new_content_only", "includes_authorised_edits"].includes(configuration.runMode)) diagnostics.push(error("invalid_run_mode", "runMode is not supported."));
  validateStageMap(configuration.stageNameToStageId, configuration.targetSkillPathSlug, registry, diagnostics);
  if (configuration.pathOverrides !== undefined) {
    if (!Array.isArray(configuration.pathOverrides) || configuration.pathOverrides.length > 50) diagnostics.push(error("malformed_path_overrides", "pathOverrides must be an array of at most 50 entries."));
    else {
      const assigned = new Set<string>();
      for (const override of configuration.pathOverrides) {
        if (!isPlainRecord(override)) {
          diagnostics.push(error("malformed_path_override", "Each path override must be a plain object."));
          continue;
        }
        rejectExtraKeys(override, OVERRIDE_KEYS, "path override", diagnostics);
        if (!Array.isArray(override.questionIds) || !override.questionIds.length || override.questionIds.length > 500 ||
            override.questionIds.some((id) => !safeText(id))) {
          diagnostics.push(error("malformed_path_override_ids", "Path override questionIds must be a non-empty bounded list of exact safe IDs."));
        } else {
          for (const id of override.questionIds) {
            if (assigned.has(id)) diagnostics.push(error("duplicate_path_override_id", `Question "${id}" appears in more than one path override.`));
            assigned.add(id);
          }
        }
        if (!safeText(override.targetSkillPathSlug)) diagnostics.push(error("invalid_override_target_path", "Override targetSkillPathSlug must be an exact safe slug."));
        validateStageMap(override.stageNameToStageId, override.targetSkillPathSlug, registry, diagnostics);
      }
    }
  }
  if (bank) {
    const runtimeOverrides = Array.isArray(value.pathOverrides)
      ? value.pathOverrides.filter(isPlainRecord)
      : [];
    if (configuration.bankId !== bank.sourceBankId) diagnostics.push(error("bank_identity_mismatch", `Configuration bankId does not match source bank identity "${bank.sourceBankId}".`));
    if (configuration.sourceBankVersion !== bank.sourceBankVersion) diagnostics.push(error("bank_version_mismatch", `Configuration version does not match source version "${bank.sourceBankVersion}".`));
    const configuredIds = new Set(bank.questions.map((question) => question.id));
    for (const override of runtimeOverrides) {
      if (!Array.isArray(override.questionIds)) continue;
      for (const id of override.questionIds) {
        if (typeof id === "string" && !configuredIds.has(id)) {
          diagnostics.push(error("unknown_override_question", `Path override references unknown source question "${id}".`));
        }
      }
    }
    for (const question of bank.questions) {
      const override = runtimeOverrides.find((candidate) =>
        Array.isArray(candidate.questionIds) && candidate.questionIds.includes(question.id));
      const targetSkillPathSlug = override?.targetSkillPathSlug ?? value.targetSkillPathSlug;
      const stageNameToStageId = override?.stageNameToStageId ?? value.stageNameToStageId;
      if (typeof targetSkillPathSlug !== "string" || !isPlainRecord(stageNameToStageId)) continue;
      const targetStageId = stageNameToStageId[question.declaredStage];
      const path = registry.paths.get(targetSkillPathSlug);
      if (typeof targetStageId !== "string" || !path?.stages.some((stage) => stage.id === targetStageId)) {
        diagnostics.push({
          ...error("unmapped_source_stage", `Question "${question.id}" source stage "${question.declaredStage}" has no explicit valid canonical stage mapping.`),
          questionId: question.id,
          lineRange: question.sourceLineRange,
        });
      }
    }
  }
  const valid = !diagnostics.some((item) => item.severity === "error");
  return {
    valid,
    ...(valid ? {
      configuration,
      configurationHash: sha256(canonicalSerialize(configuration)),
    } : {}),
    diagnostics,
  };
}

export function resolveConfiguredPlacement(configuration: BankImportConfiguration, questionId: string, declaredStage: string) {
  const override = configuration.pathOverrides?.find((candidate) => candidate.questionIds.includes(questionId));
  const targetSkillPathSlug = override?.targetSkillPathSlug ?? configuration.targetSkillPathSlug;
  const stageNameToStageId = override?.stageNameToStageId ?? configuration.stageNameToStageId;
  return { targetSkillPathSlug, targetStageId: stageNameToStageId[declaredStage] };
}

function validateStageMap(value: unknown, pathSlug: unknown, registry: ImportRegistry, diagnostics: ImportDiagnostic[]) {
  if (!isPlainRecord(value) || Object.keys(value).length < 1 || Object.keys(value).length > 20) {
    diagnostics.push(error("malformed_stage_mapping", "stageNameToStageId must be a bounded non-empty exact mapping."));
    return;
  }
  const path = typeof pathSlug === "string" ? registry.paths.get(pathSlug) : undefined;
  if (!path) {
    diagnostics.push(error("unknown_target_skill_path", `Configured skill path "${String(pathSlug)}" does not exist in the live registry.`));
    return;
  }
  if (!path.stages.length) diagnostics.push(error("target_path_has_no_live_stages", `Configured skill path "${path.slug}" has no live stage IDs.`));
  for (const [stageName, stageId] of Object.entries(value)) {
    if (!stageName.trim() || stageName.length > 100 || typeof stageId !== "string" || !SAFE_ID.test(stageId)) {
      diagnostics.push(error("invalid_stage_mapping_entry", "Stage mappings require bounded source labels and exact safe stage IDs."));
      continue;
    }
    const stage = path.stages.find((candidate) => candidate.id === stageId);
    if (!stage) diagnostics.push(error("unknown_target_stage", `Stage ID "${stageId}" does not belong to live skill path "${path.slug}".`));
    else if (!stage.names.includes(stageName)) diagnostics.push(error("stage_label_mismatch", `Source stage label "${stageName}" does not exactly name configured stage "${stageId}".`));
  }
}

function rejectPrototypeKeys(value: unknown, diagnostics: ImportDiagnostic[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => rejectPrototypeKeys(item, diagnostics));
    return;
  }
  if (!isPlainRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (PROTOTYPE_KEYS.has(key)) diagnostics.push(error("prototype_polluting_configuration_key", `Forbidden configuration key "${key}".`));
    rejectPrototypeKeys(child, diagnostics);
  }
}

function rejectExtraKeys(value: Record<string, unknown>, allowed: Set<string>, kind: string, diagnostics: ImportDiagnostic[]) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) diagnostics.push(error("unknown_configuration_key", `Unknown ${kind} key "${key}".`));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function safeText(value: unknown) {
  return typeof value === "string" && value.length <= 200 && SAFE_ID.test(value);
}

function safeVersion(value: unknown) {
  return typeof value === "string" && /^\d{1,20}$/.test(value);
}

function error(code: string, message: string): ImportDiagnostic {
  return { code, severity: "error", message };
}

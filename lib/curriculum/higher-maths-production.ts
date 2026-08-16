import { higherMathematicsCalculusCoverageClaims } from "@/data/curriculum/higher-mathematics/calculus-coverage-claims";
import { higherMathematicsCalculusPrerequisites } from "@/data/curriculum/higher-mathematics/calculus-prerequisites";
import { higherMathematicsCalculusSkillContracts } from "@/data/curriculum/higher-mathematics/calculus-skill-contracts";
import { higherMathematicsCalculusTeachingSequence } from "@/data/curriculum/higher-mathematics/calculus-teaching-sequence";
import { higherMathematicsOfficialSkillMappings } from "@/data/curriculum/higher-mathematics/official-skill-mappings";
import { higherMathematicsSpecificationRegister } from "@/data/curriculum/higher-mathematics/specification-register";
import { higherMathematicsSkillPackages } from "@/data/curriculum/higher-mathematics/skill-packages";
import type { LearningStageName } from "@/data/types";
import { contentResolver } from "@/lib/content-resolver";
import { resolveSkillPackageEvidence } from "@/lib/curriculum/skill-package-resolver";
import {
  deriveSkillPackageReadiness,
  validateSkillPackageManifest,
  type SkillPackageBlocker,
  type SkillPackageKnownReferences,
  type SkillPackageManifest,
} from "@/lib/curriculum/skill-package";
import { resolveLessonDocument } from "@/lib/lessons/resolver";
import { sha256 } from "@/lib/content-import/canonical";

export type ProductionStage =
  | "official_mapping"
  | "skill_contract"
  | "historical_pattern_audit"
  | "notes"
  | "foundations"
  | "applications"
  | "exam_practice"
  | "marking_readiness"
  | "content_qa"
  | "content_approval"
  | "content_correction"
  | "integration_publication"
  | "complete";

export type HigherMathsProductionEntry = {
  skillPathId: string;
  skillName: string;
  canonicalOrder: number;
  registered: boolean;
  live: boolean;
  officialSpecificationPointIds: string[];
  officialRequirements: Array<{ id: string; statement: string }>;
  contractPresent: boolean;
  contractBoundary: { learningObjective: string; includes: string[]; excludes: string[] } | null;
  hardPrerequisiteSkillIds: string[];
  recommendedSequence?: { areaId: string; order: number };
  packagePresent: boolean;
  publicationPolicy: SkillPackageManifest["publicationPolicy"] | null;
  historicalPatternAuditComplete: boolean;
  sources: Array<{
    kind: SkillPackageManifest["sources"][number]["kind"];
    path: string;
    expectedHash?: string;
    currentHash?: string;
    hashMatches: boolean | null;
    exists: boolean;
  }>;
  notesPresent: boolean;
  stageCounts: Record<LearningStageName, number>;
  canonicalQuestionCount: number;
  markingReady: boolean;
  qa: {
    mathematical: boolean;
    curriculum: boolean;
    originality: boolean;
    marking: boolean;
    contentApproval: boolean;
  };
  importState: "not_required" | "not_started" | "configuration_missing" | "configured_not_approved" | "approved_not_applied" | "applied_verified" | "applied_then_modified";
  publicationReady: boolean;
  liveReadinessAccepted: boolean;
  blockers: SkillPackageBlocker[];
  nextStage: ProductionStage;
};

export type HigherMathsProductionTracker = {
  courseId: "higher-maths";
  entries: HigherMathsProductionEntry[];
  recommendedNext: { skillPathId: string; stage: ProductionStage; reason: string } | null;
};

export type ProductionValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  skillPathId?: string;
};

export function createHigherMathsKnownReferences(): SkillPackageKnownReferences {
  const contexts = contentResolver.getAllPathContexts().filter((context) => context.subject.subjectSlug === "higher-maths");
  return {
    knownCourseIds: new Set(["higher-maths"]),
    knownSkillIds: new Set(contexts.map((context) => context.skillPath.slug)),
    knownContractSkillPathIds: new Set(higherMathematicsCalculusSkillContracts.map((contract) => contract.skillPathId)),
    knownOfficialMappedSkillIds: new Set(higherMathematicsOfficialSkillMappings.map((mapping) => mapping.skillPathId)),
    knownCoverageClaimIds: new Set(higherMathematicsCalculusCoverageClaims.map((claim) => claim.claimId)),
    knownHardPrerequisiteEdges: new Set(higherMathematicsCalculusPrerequisites
      .filter((edge) => edge.strength === "hard")
      .map((edge) => `${edge.skillPathId}::${edge.requiresSkillPathId}`)),
  };
}

export function buildHigherMathsProductionTracker(repoRoot: string = process.cwd()): HigherMathsProductionTracker {
  const contexts = contentResolver.getAllPathContexts().filter((context) => context.subject.subjectSlug === "higher-maths");
  const known = createHigherMathsKnownReferences();
  const packageById = new Map(higherMathematicsSkillPackages.map((manifest) => [manifest.skillPathId, manifest]));
  const mappingById = new Map(higherMathematicsOfficialSkillMappings.map((mapping) => [mapping.skillPathId, mapping]));
  const officialPointById = new Map(higherMathematicsSpecificationRegister.points.map((point) => [point.specPointId, point]));
  const contractById = new Map(higherMathematicsCalculusSkillContracts.map((contract) => [contract.skillPathId, contract]));
  const sequenceById = new Map(higherMathematicsCalculusTeachingSequence.map((entry) => [entry.skillPathId, entry]));

  const entries = contexts.map((context, canonicalOrder): HigherMathsProductionEntry => {
    const path = context.skillPath;
    const manifest = packageById.get(path.slug);
    const mapping = mappingById.get(path.slug);
    const contract = contractById.get(path.slug);
    const questions = contentResolver.getPathQuestions(path.slug);
    const canonicalStageCounts = stageCountRecord(path.learningStages ?? []);
    const evidence = manifest ? resolveSkillPackageEvidence(manifest, repoRoot) : null;
    const stageCounts = manifest && evidence ? productionStageCountRecord(manifest, evidence, canonicalStageCounts) : canonicalStageCounts;
    const validation = manifest ? validateSkillPackageManifest(manifest, known) : null;
    const readiness = manifest && evidence && validation
      ? deriveSkillPackageReadiness(manifest, validation, evidence)
      : null;
    const blockers = readiness?.blockers ?? [{
      code: "missing-production-package",
      message: "No production package manifest is registered for this canonical skill.",
      tier: "structural" as const,
    }];
    const lesson = resolveLessonDocument(path);
    const markingReady = Boolean(manifest && !blockers.some((blocker) => blocker.code === "unsupported-marking-capability"));
    const liveReadinessAccepted = path.isAvailable && Boolean(
      readiness?.readyForPublication || manifest?.publicationPolicy === "grandfathered_live_baseline",
    );
    const sequence = sequenceById.get(path.slug);
    const base = {
      skillPathId: path.slug,
      skillName: path.name,
      canonicalOrder,
      registered: true,
      live: path.isAvailable,
      officialSpecificationPointIds: [...(mapping?.officialSpecificationPointIds ?? [])],
      officialRequirements: (mapping?.officialSpecificationPointIds ?? []).map((id) => {
        const point = officialPointById.get(id);
        return { id, statement: point?.verificationStatus === "verified" ? point.officialStatement : point?.authoringSummary ?? "" };
      }),
      contractPresent: Boolean(contract),
      contractBoundary: contract ? {
        learningObjective: contract.learningObjective,
        includes: [...contract.boundaries.includes],
        excludes: [...contract.boundaries.excludes],
      } : null,
      hardPrerequisiteSkillIds: higherMathematicsCalculusPrerequisites
        .filter((edge) => edge.skillPathId === path.slug && edge.strength === "hard")
        .map((edge) => edge.requiresSkillPathId),
      recommendedSequence: sequence ? { areaId: sequence.areaId, order: sequence.recommendedOrder } : undefined,
      packagePresent: Boolean(manifest),
      publicationPolicy: manifest?.publicationPolicy ?? null,
      historicalPatternAuditComplete: manifest?.productionEvidence.historicalPatternAuditComplete ?? false,
      sources: manifest?.sources.map((source) => {
        const resolvedSource = evidence?.sources.find((candidate) => candidate.kind === source.kind);
        return {
          kind: source.kind,
          path: source.sourcePath,
          expectedHash: source.expectedSourceHash,
          currentHash: resolvedSource?.currentContentHash,
          hashMatches: source.expectedSourceHash ? resolvedSource?.currentContentHash === source.expectedSourceHash : null,
          exists: resolvedSource?.exists ?? false,
        };
      }) ?? [],
      notesPresent: Boolean(lesson),
      stageCounts,
      canonicalQuestionCount: questions.length,
      markingReady,
      qa: {
        mathematical: manifest?.qaEvidence.mathematicalQaComplete ?? false,
        curriculum: manifest?.qaEvidence.curriculumQaComplete ?? false,
        originality: manifest?.qaEvidence.originalityAuditComplete ?? false,
        marking: manifest?.qaEvidence.markingQaComplete ?? false,
        contentApproval: manifest?.productionEvidence.contentApprovalComplete ?? false,
      },
      importState: deriveImportState(manifest, evidence?.importConfigurationExists ?? false, questions.map((question) => question.id), repoRoot),
      publicationReady: readiness?.readyForPublication ?? false,
      liveReadinessAccepted,
      blockers,
    };
    return { ...base, nextStage: deriveNextProductionStage(base, manifest) };
  });

  const recommended = entries
    .filter((entry) => !entry.live && entry.nextStage !== "complete")
    .sort((left, right) => Number(right.packagePresent) - Number(left.packagePresent) || left.canonicalOrder - right.canonicalOrder)[0];

  return {
    courseId: "higher-maths",
    entries,
    recommendedNext: recommended ? {
      skillPathId: recommended.skillPathId,
      stage: recommended.nextStage,
      reason: recommended.packagePresent
        ? "Continue the earliest canonical skill that already has an in-progress package."
        : "Start the earliest incomplete canonical skill in repository order.",
    } : null,
  };
}

function deriveImportState(
  manifest: SkillPackageManifest | undefined,
  configurationExists: boolean,
  canonicalQuestionIds: string[],
  repoRoot: string,
): HigherMathsProductionEntry["importState"] {
  if (!manifest) return "not_started";
  if (!manifest.importReference) return "not_required";
  if (!configurationExists) return "configuration_missing";
  const applyReceiptState = findApplyReceiptState(repoRoot, canonicalQuestionIds);
  if (applyReceiptState) return applyReceiptState;
  if (hasApprovalReceipt(repoRoot, manifest.importReference.bankId, canonicalQuestionIds)) return "approved_not_applied";
  return "configured_not_approved";
}

function findApplyReceiptState(repoRoot: string, canonicalQuestionIds: string[]): "applied_verified" | "applied_then_modified" | null {
  if (canonicalQuestionIds.length === 0) return null;
  let foundAppliedIds = false;
  const verified = readJsonDirectory(repoRoot, "content-import/receipts").some((record) => {
    const appliedIds = stringArray(record.appliedQuestionIds);
    const outputPaths = stringArray(record.outputPaths);
    const hashes = isRecord(record.finalOutputHashes) ? record.finalOutputHashes : {};
    if (!canonicalQuestionIds.every((id) => appliedIds.includes(id))) return false;
    foundAppliedIds = true;
    return outputPaths.length > 0 && outputPaths.every((path) => {
      const expectedHash = hashes[path];
      const absolutePath = resolve(repoRoot, path);
      return typeof expectedHash === "string" && existsSync(absolutePath) && sha256(readFileSync(absolutePath)) === expectedHash;
    });
  });
  return verified ? "applied_verified" : foundAppliedIds ? "applied_then_modified" : null;
}

function hasApprovalReceipt(repoRoot: string, bankId: string, canonicalQuestionIds: string[]) {
  return readJsonDirectory(repoRoot, "content-import/approvals").some((record) => {
    const payload = isRecord(record.previewDecisionPayload) ? record.previewDecisionPayload : {};
    const configuration = isRecord(payload.configuration) ? payload.configuration : {};
    const approvedIds = stringArray(record.approvedQuestionIds);
    return configuration.bankId === bankId && canonicalQuestionIds.length > 0 && canonicalQuestionIds.every((id) => approvedIds.includes(id));
  });
}

function readJsonDirectory(repoRoot: string, relativeDirectory: string): Record<string, unknown>[] {
  const directory = resolve(repoRoot, relativeDirectory);
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith(".json")).flatMap((name) => {
    try {
      const parsed: unknown = JSON.parse(readFileSync(resolve(directory, name), "utf8"));
      return isRecord(parsed) ? [parsed] : [];
    } catch {
      return [];
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function deriveNextProductionStage(
  entry: Omit<HigherMathsProductionEntry, "nextStage">,
  manifest: SkillPackageManifest | undefined,
): ProductionStage {
  if (entry.officialSpecificationPointIds.length === 0) return "official_mapping";
  if (!entry.contractPresent) return "skill_contract";
  if (entry.live && manifest?.knownIssues.some((issue) => issue.blocksStandardPublication)) return "content_correction";
  if (!manifest || !entry.historicalPatternAuditComplete) return "historical_pattern_audit";
  if (!entry.notesPresent) return "notes";
  if (entry.stageCounts.Foundations === 0) return "foundations";
  if (entry.stageCounts.Applications === 0) return "applications";
  if (entry.stageCounts["Past Paper-style Questions"] === 0) return "exam_practice";
  if (!entry.markingReady) return "marking_readiness";
  if (!entry.qa.mathematical || !entry.qa.curriculum || !entry.qa.originality || !entry.qa.marking) return "content_qa";
  if (!entry.qa.contentApproval) return "content_approval";
  if (!entry.live) return "integration_publication";
  return entry.publicationReady ? "complete" : "content_correction";
}

function stageCountRecord(stages: Array<{ name: LearningStageName; questionIds: string[] }>): Record<LearningStageName, number> {
  const counts: Record<LearningStageName, number> = { Foundations: 0, Applications: 0, "Past Paper-style Questions": 0 };
  for (const stage of stages) counts[stage.name] += stage.questionIds.length;
  return counts;
}

function productionStageCountRecord(
  manifest: SkillPackageManifest,
  evidence: ReturnType<typeof resolveSkillPackageEvidence>,
  fallback: Record<LearningStageName, number>,
): Record<LearningStageName, number> {
  const sourceKindByStage: Record<LearningStageName, "foundations" | "applications" | "pastPaperPractice"> = {
    Foundations: "foundations",
    Applications: "applications",
    "Past Paper-style Questions": "pastPaperPractice",
  };
  return Object.fromEntries(Object.entries(sourceKindByStage).map(([stageName, sourceKind]) => {
    const discovered = evidence.sources.find((source) => source.kind === sourceKind)?.discoveredQuestionCount;
    const declared = manifest.sources.find((source) => source.kind === sourceKind)?.expectedQuestionCount;
    return [stageName, discovered ?? declared ?? fallback[stageName as LearningStageName]];
  })) as Record<LearningStageName, number>;
}

export function validateHigherMathsProductionTracker(tracker: HigherMathsProductionTracker): ProductionValidationIssue[] {
  const issues: ProductionValidationIssue[] = [];
  const packageIds = higherMathematicsSkillPackages.map((manifest) => manifest.skillPathId);
  const duplicatePackageIds = packageIds.filter((id, index) => packageIds.indexOf(id) !== index);
  for (const skillPathId of [...new Set(duplicatePackageIds)]) {
    issues.push({ severity: "error", code: "duplicate-production-package", message: `More than one production package is registered for "${skillPathId}".`, skillPathId });
  }
  const entryIds = new Set(tracker.entries.map((entry) => entry.skillPathId));
  for (const skillPathId of packageIds) {
    if (!entryIds.has(skillPathId)) issues.push({ severity: "error", code: "unknown-production-package-skill", message: `Production package references unknown canonical skill "${skillPathId}".`, skillPathId });
  }
  for (const entry of tracker.entries.filter((candidate) => candidate.live)) {
    if (!entry.packagePresent) {
      issues.push({ severity: "error", code: "live-skill-missing-production-package", message: `Live skill "${entry.skillPathId}" is outside the production-readiness system.`, skillPathId: entry.skillPathId });
    } else if (!entry.publicationReady && entry.publicationPolicy === "grandfathered_live_baseline") {
      issues.push({ severity: "warning", code: "grandfathered-live-skill", message: `Live skill "${entry.skillPathId}" is explicitly grandfathered and has unresolved production blockers.`, skillPathId: entry.skillPathId });
    } else if (!entry.publicationReady) {
      issues.push({ severity: "error", code: "live-skill-not-production-ready", message: `Live skill "${entry.skillPathId}" does not satisfy standard publication readiness.`, skillPathId: entry.skillPathId });
    } else if (["configuration_missing", "configured_not_approved", "approved_not_applied"].includes(entry.importState)) {
      issues.push({ severity: "error", code: "live-skill-import-not-applied", message: `Live skill "${entry.skillPathId}" declares an import workflow but has no apply receipt for its canonical question set.`, skillPathId: entry.skillPathId });
    }
  }
  return issues;
}

export function formatHigherMathsProductionTracker(tracker: HigherMathsProductionTracker): string {
  const header = ["Skill", "Live", "Map", "Contract", "Notes", "F/A/E", "QA", "Ready", "Next"];
  const rows = tracker.entries.map((entry) => [
    entry.skillPathId,
    entry.live ? "yes" : "no",
    entry.officialSpecificationPointIds.length ? "yes" : "no",
    entry.contractPresent ? "yes" : "no",
    entry.notesPresent ? "yes" : "no",
    `${entry.stageCounts.Foundations}/${entry.stageCounts.Applications}/${entry.stageCounts["Past Paper-style Questions"]}`,
    Object.values(entry.qa).every(Boolean) ? "yes" : "no",
    entry.publicationReady ? "yes" : entry.publicationPolicy === "grandfathered_live_baseline" ? "baseline" : "no",
    entry.nextStage,
  ]);
  const widths = header.map((value, index) => Math.max(value.length, ...rows.map((row) => row[index].length)));
  const line = (row: string[]) => row.map((value, index) => value.padEnd(widths[index])).join("  ");
  const output = ["Higher Maths Content Production", "", line(header), line(widths.map((width) => "-".repeat(width))), ...rows.map(line)];
  if (tracker.recommendedNext) output.push("", `Recommended next: ${tracker.recommendedNext.skillPathId} → ${tracker.recommendedNext.stage}`, tracker.recommendedNext.reason);
  return output.join("\n");
}

export function formatHigherMathsProductionEntry(entry: HigherMathsProductionEntry): string {
  const yesNo = (value: boolean) => value ? "yes" : "no";
  return [
    `Higher Maths Production — ${entry.skillPathId}`,
    "",
    `Name: ${entry.skillName}`,
    `Live: ${yesNo(entry.live)}${entry.publicationPolicy ? ` (${entry.publicationPolicy})` : ""}`,
    `Official requirements: ${entry.officialRequirements.map((requirement) => `${requirement.id} — ${requirement.statement}`).join("; ") || "none"}`,
    `Contract: ${yesNo(entry.contractPresent)}`,
    ...(entry.contractBoundary ? [
      `Objective: ${entry.contractBoundary.learningObjective}`,
      `Includes: ${entry.contractBoundary.includes.join("; ")}`,
      `Excludes: ${entry.contractBoundary.excludes.join("; ")}`,
    ] : []),
    `Hard prerequisites: ${entry.hardPrerequisiteSkillIds.join(", ") || "none"}`,
    `Pattern audit: ${yesNo(entry.historicalPatternAuditComplete)}`,
    ...entry.sources.map((source) => `Source ${source.kind}: ${source.exists ? "present" : "missing"} at ${source.path}; hash=${source.hashMatches === null ? "not_declared" : source.hashMatches ? "match" : "mismatch"}${source.expectedHash ? ` (${source.expectedHash})` : ""}`),
    `Notes: ${yesNo(entry.notesPresent)}`,
    `Questions: Foundations ${entry.stageCounts.Foundations}; Applications ${entry.stageCounts.Applications}; Exam Practice ${entry.stageCounts["Past Paper-style Questions"]}; canonical total ${entry.canonicalQuestionCount}`,
    `Marking ready: ${yesNo(entry.markingReady)}`,
    `QA: mathematical=${yesNo(entry.qa.mathematical)} curriculum=${yesNo(entry.qa.curriculum)} originality=${yesNo(entry.qa.originality)} marking=${yesNo(entry.qa.marking)} content-approval=${yesNo(entry.qa.contentApproval)}`,
    `Import: ${entry.importState}`,
    `Publication ready: ${yesNo(entry.publicationReady)}`,
    `Next production stage: ${entry.nextStage}`,
    "",
    `Blockers (${entry.blockers.length}):`,
    ...(entry.blockers.length ? entry.blockers.map((blocker) => `- ${blocker.code}: ${blocker.message}`) : ["- none"]),
  ].join("\n");
}
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

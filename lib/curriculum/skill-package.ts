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

/**
 * A SkillPackageManifest answers one question: "why is this canonical skill not ready to
 * publish?" It sits above the existing curriculum, import and validation systems and never
 * duplicates them — it holds references (skillContractId, coverageClaimIds,
 * hardPrerequisiteSkillIds, source file paths) and small declared facts (expected counts,
 * expected shape/misconception coverage, explicit QA sign-off), never the authoritative
 * data itself. The authoritative skill contract, coverage claims and prerequisite graph
 * live exactly where Phase 1 put them (data/curriculum/higher-mathematics/*); the
 * authoritative import mechanism lives exactly where Content Import put it
 * (lib/content-import/*). This module composes references to both, it does not re-implement
 * either.
 *
 * Every field here exists to answer one of the thirteen pilot questions from the Phase 2
 * brief. No field was added "for completeness" or to anticipate future subjects — see the
 * doc comment on each type for which question it answers.
 */

export const SKILL_PACKAGE_SCHEMA_VERSION = 1;

/** Which of the four learner-facing content sources a reference describes. */
export type SkillPackageSourceKind = "notes" | "foundations" | "applications" | "pastPaperPractice";

export const SKILL_PACKAGE_SOURCE_KINDS: readonly SkillPackageSourceKind[] = [
  "notes",
  "foundations",
  "applications",
  "pastPaperPractice",
];

/**
 * A declared reference to one content source. Never embeds the source's content — only
 * enough to locate it and to detect drift against a previously reviewed state. Answers
 * "does an approved Notes source exist?" and "do Foundations/Applications/PPQ sources
 * exist?" (§5, §6) — the declaration side; SkillPackageSourceEvidence (resolved
 * separately, see skill-package-resolver.ts) answers whether that declaration currently
 * holds.
 */
export type SkillPackageSourceDeclaration = {
  kind: SkillPackageSourceKind;
  /** Repo-relative path, e.g. "content-drafts/higher-maths/calculus/chain-rule-v6.md". */
  sourcePath: string;
  /**
   * The declared-stage heading this source's questions are filed under within sourcePath
   * (e.g. "Foundations", "Past Paper-style Questions"), needed only when several source
   * kinds share one physical draft file, as the Chain Rule draft does. Omit when sourcePath
   * is exclusive to this kind.
   */
  declaredStageName?: string;
  /** Curriculum-design target, not a filesystem fact — how many questions this source is expected to eventually hold. Foundations/Applications/PPQ only; omit for Notes. */
  expectedQuestionCount?: number;
  /**
   * The SHA-256 hash the source is expected to have, because this exact byte snapshot is
   * what was inspected when this manifest's declared facts (expected counts,
   * shape/misconception coverage) were reviewed against the file. A match proves only that
   * the currently-inspected source is byte-identical to that snapshot — it proves nothing
   * about mathematical, curriculum, originality or marking correctness, and it is never
   * treated as any form of approval. If the live file's hash no longer matches, those
   * reviewed facts are treated as unverified — see the "source-reference-stale" blocker and
   * its effect on shape/misconception coverage below.
   */
  expectedSourceHash?: string;
};

/**
 * One question-shape family this skill is expected to cover. `observedInSource` is a
 * hand-reviewed fact, not something inferred from question text — matching this
 * repository's existing convention (see basic-differentiation-question-review.ts: "no
 * code here decides a question's canonical owner from the mathematics it happens to
 * use"). Answers "which historical question-shape families are expected?" (§8).
 */
export type SkillPackageShapeRequirement = {
  shapeId: string;
  description: string;
  /** False for a shape that is legitimately out of this skill's current contract boundary — its absence is not a blocker. */
  required: boolean;
  observedInSource: boolean;
  evidenceNote?: string;
};

/** One misconception family this skill is expected to address. Same evidence discipline as SkillPackageShapeRequirement. Answers "which misconceptions should be covered?" (§9). */
export type SkillPackageMisconceptionRequirement = {
  misconceptionId: string;
  description: string;
  required: boolean;
  observedInSource: boolean;
  evidenceNote?: string;
};

/**
 * Explicit human QA sign-off. These can never be derived mechanically — that is the point.
 * A missing signature is represented as `false`, never inferred as true because a file
 * happens to exist. Answers "what curriculum or mathematical QA remains?" (§11).
 */
export type SkillPackageQaEvidence = {
  mathematicalQaComplete: boolean;
  curriculumQaComplete: boolean;
  originalityAuditComplete: boolean;
  markingQaComplete: boolean;
  note?: string;
};

/**
 * Documents a question-level (not skill-level) dependency policy — e.g. "a Chain Rule
 * question involving a trig composite may require Trigonometric Differentiation." This is
 * documentation of intent for future question authoring via
 * QuestionCurriculumMetadata.requiredSkillIds; it does not itself tag any question, and it
 * is never promoted to a prerequisite-graph edge (see lib/curriculum/prerequisite-graph.ts,
 * which stays hard/soft-only). Answers "what prerequisite rules apply?" (§4).
 */
export type SkillPackageQuestionLevelRequirement = {
  triggerDescription: string;
  requiredSkillId: string;
};

/**
 * Reference to a required import configuration equivalent to
 * lib/content-import/types.ts's BankImportConfiguration. This never duplicates that shape
 * — it records only whether a bank identity is declared and, once a real
 * `<bank>.import.json` exists, that its path resolves. Answers "what import configuration
 * is required?" (§12).
 */
export type SkillPackageImportReference = {
  bankId: string;
  /** Repo-relative path a real BankImportConfiguration is expected at, once one is authored. */
  expectedConfigurationPath: string;
};

export type SkillPackageManifest = {
  packageSchemaVersion: typeof SKILL_PACKAGE_SCHEMA_VERSION;
  packageRevision: number;
  courseId: string;
  skillPathId: string;

  /** Reference to the authoritative CanonicalSkillContract.skillPathId — never a copy of the contract. Answers "does a full skill contract exist?" (§3). */
  contractSkillPathId: string;
  /** References to authoritative SpecificationCoverageClaim.claimId entries — never copies of the claims. Answers "which verified specification claims does it cover?" (§2). */
  coverageClaimIds: string[];
  /** References to authoritative hard PrerequisiteRelationship edges targeting this skill's requiresSkillPathId. */
  hardPrerequisiteSkillIds: string[];
  questionLevelRequirements: SkillPackageQuestionLevelRequirement[];

  sources: SkillPackageSourceDeclaration[];
  expectedShapes: SkillPackageShapeRequirement[];
  expectedMisconceptions: SkillPackageMisconceptionRequirement[];
  qaEvidence: SkillPackageQaEvidence;
  importReference: SkillPackageImportReference;
};

export type SkillPackageKnownReferences = {
  knownCourseIds: Set<string>;
  knownSkillIds: Set<string>;
  knownContractSkillPathIds: Set<string>;
  knownCoverageClaimIds: Set<string>;
  knownHardPrerequisiteEdges: Set<string>;
};

export function validateSkillPackageManifest(
  manifest: SkillPackageManifest,
  known: SkillPackageKnownReferences,
): CurriculumValidationReport {
  const { issue, issues } = createIssueCollector();
  const location = `curriculum/skill-package/${manifest.skillPathId ?? "unknown"}`;

  if (manifest.packageSchemaVersion !== SKILL_PACKAGE_SCHEMA_VERSION) {
    issue("error", "invalid-package-schema-version", `Manifest declares unsupported packageSchemaVersion ${String(manifest.packageSchemaVersion)}.`, location);
  }
  positiveInteger(manifest.packageRevision, "packageRevision", location, issue);
  requiredId(manifest.courseId, "courseId", location, issue);
  requiredId(manifest.skillPathId, "skillPathId", location, issue);

  if (isValidId(manifest.courseId) && !known.knownCourseIds.has(manifest.courseId)) {
    issue("error", "unknown-course", `Manifest references unknown course "${manifest.courseId}".`, location);
  }
  if (isValidId(manifest.skillPathId) && !known.knownSkillIds.has(manifest.skillPathId)) {
    issue("error", "unknown-skill", `Manifest references unknown canonical skill "${manifest.skillPathId}".`, location);
  }

  requiredId(manifest.contractSkillPathId, "contractSkillPathId", location, issue);
  if (isValidId(manifest.contractSkillPathId) && !known.knownContractSkillPathIds.has(manifest.contractSkillPathId)) {
    issue("error", "unknown-contract-reference", `Manifest references unknown skill contract "${manifest.contractSkillPathId}".`, location);
  }

  findDuplicates(manifest.coverageClaimIds).forEach((duplicateId) =>
    issue("error", "duplicate-coverage-claim-reference", `Manifest references coverage claim "${duplicateId}" more than once.`, location));
  manifest.coverageClaimIds.forEach((claimId, index) => {
    if (!isValidId(claimId)) { issue("error", "invalid-coverage-claim-id", `coverageClaimIds[${index}] is not a valid stable ID.`, location); return; }
    if (!known.knownCoverageClaimIds.has(claimId)) issue("error", "unknown-coverage-claim-reference", `Manifest references unknown coverage claim "${claimId}".`, location);
  });
  if (manifest.coverageClaimIds.length === 0) {
    issue("error", "missing-coverage-claim-reference", `Manifest for "${manifest.skillPathId}" declares no coverage-claim references.`, location);
  }

  findDuplicates(manifest.hardPrerequisiteSkillIds).forEach((duplicateId) =>
    issue("error", "duplicate-prerequisite-reference", `Manifest references hard prerequisite "${duplicateId}" more than once.`, location));
  manifest.hardPrerequisiteSkillIds.forEach((skillId, index) => {
    if (!isValidId(skillId)) { issue("error", "invalid-prerequisite-id", `hardPrerequisiteSkillIds[${index}] is not a valid stable ID.`, location); return; }
    const edgeKey = `${manifest.skillPathId}::${skillId}`;
    if (!known.knownHardPrerequisiteEdges.has(edgeKey)) {
      issue("error", "unknown-prerequisite", `Manifest declares hard prerequisite "${skillId}", but no matching hard edge exists in the prerequisite graph.`, location);
    }
  });

  manifest.questionLevelRequirements.forEach((rule, index) => {
    const ruleLocation = `${location}/question-level-requirement[${index}]`;
    requiredText(rule.triggerDescription, "triggerDescription", ruleLocation, issue);
    requiredId(rule.requiredSkillId, "requiredSkillId", ruleLocation, issue);
    if (isValidId(rule.requiredSkillId) && !known.knownSkillIds.has(rule.requiredSkillId)) {
      issue("error", "unknown-question-level-requirement-skill", `Question-level requirement[${index}] references unknown skill "${rule.requiredSkillId}".`, ruleLocation);
    }
  });

  findDuplicates(manifest.sources.map((source) => source.kind)).forEach((duplicateKind) =>
    issue("error", "duplicate-source-kind", `Manifest declares more than one source of kind "${duplicateKind}".`, location));
  manifest.sources.forEach((source, index) => {
    const sourceLocation = `${location}/source[${index}]`;
    if (!SKILL_PACKAGE_SOURCE_KINDS.includes(source.kind)) {
      issue("error", "invalid-source-kind", `Source[${index}] kind "${String(source.kind)}" is not a recognised source kind.`, sourceLocation);
    }
    requiredText(source.sourcePath, "sourcePath", sourceLocation, issue);
    if (source.expectedQuestionCount !== undefined) positiveInteger(source.expectedQuestionCount, "expectedQuestionCount", sourceLocation, issue);
  });

  findDuplicates(manifest.expectedShapes.map((shape) => shape.shapeId)).forEach((duplicateId) =>
    issue("error", "duplicate-shape-id", `Manifest declares shape "${duplicateId}" more than once.`, location));
  manifest.expectedShapes.forEach((shape, index) => {
    const shapeLocation = `${location}/shape[${index}]`;
    requiredId(shape.shapeId, "shapeId", shapeLocation, issue);
    requiredText(shape.description, "description", shapeLocation, issue);
  });

  findDuplicates(manifest.expectedMisconceptions.map((entry) => entry.misconceptionId)).forEach((duplicateId) =>
    issue("error", "duplicate-misconception-id", `Manifest declares misconception "${duplicateId}" more than once.`, location));
  manifest.expectedMisconceptions.forEach((entry, index) => {
    const misconceptionLocation = `${location}/misconception[${index}]`;
    requiredId(entry.misconceptionId, "misconceptionId", misconceptionLocation, issue);
    requiredText(entry.description, "description", misconceptionLocation, issue);
  });

  requiredId(manifest.importReference.bankId, "importReference.bankId", location, issue);
  requiredText(manifest.importReference.expectedConfigurationPath, "importReference.expectedConfigurationPath", location, issue);

  return finalizeReport(issues);
}

/** Evidence resolved against the real filesystem/importer for one declared source. Built by skill-package-resolver.ts — never by this pure module. */
export type SkillPackageSourceEvidence = {
  kind: SkillPackageSourceKind;
  exists: boolean;
  discoveredQuestionCount?: number;
  currentContentHash?: string;
  unsupportedMarkingCapabilities: Array<{ questionId: string; code: string; requiredCapability?: string }>;
};

export type SkillPackageEvidence = {
  sources: SkillPackageSourceEvidence[];
  importConfigurationExists: boolean;
};

export type SkillPackageBlocker = {
  code: string;
  message: string;
  tier: "structural" | "preview" | "import" | "publication";
};

export type SkillPackageReadiness = {
  structurallyComplete: boolean;
  readyForPackagePreview: boolean;
  readyForImport: boolean;
  readyForPublication: boolean;
  blockers: SkillPackageBlocker[];
};

const SOURCE_MISSING_BLOCKER_CODE: Record<SkillPackageSourceKind, string> = {
  notes: "missing-notes-source",
  foundations: "missing-foundations-source",
  applications: "missing-applications-source",
  pastPaperPractice: "missing-ppq-source",
};

/**
 * Notes gates package-preview completeness and publication — the real Content Import
 * mechanism (lib/content-import/*) never reads a LessonDocument, so a missing Notes source
 * must never block question-bank import. The three question-bank kinds gate preview AND
 * import, since import cannot proceed against an absent source either way.
 */
const SOURCE_MISSING_BLOCKER_TIER: Record<SkillPackageSourceKind, SkillPackageBlocker["tier"]> = {
  notes: "publication",
  foundations: "preview",
  applications: "preview",
  pastPaperPractice: "preview",
};

/**
 * Fixed priority order for deterministic blocker sorting. A blocker code not listed here
 * (should not happen — every code this module emits is listed) sorts last. This ordering is
 * purely for deterministic display; it is not what determines which readiness result a
 * blocker gates — see the *_BLOCKING_CODES sets below for that.
 */
const BLOCKER_PRIORITY: string[] = [
  "manifest-invalid",
  "missing-skill-contract",
  "missing-coverage-claim",
  "unknown-prerequisite",
  "unknown-question-level-requirement-skill",
  "missing-foundations-source",
  "missing-applications-source",
  "missing-ppq-source",
  "source-reference-stale",
  "question-count-mismatch",
  "unsupported-marking-capability",
  "import-config-missing",
  "missing-notes-source",
  "uncovered-question-shape",
  "uncovered-misconception",
  "mathematical-qa-incomplete",
  "curriculum-qa-incomplete",
  "originality-audit-incomplete",
  "marking-qa-incomplete",
];

/**
 * Which blocker codes gate each readiness result. This is the single source of truth for
 * readiness — each blocker's `tier` field is a display label only (see BLOCKER_PRIORITY),
 * decoupled from these sets so a code (missing-notes-source) can carry one display tier
 * while participating in a different gating rule than that tier's name might suggest.
 *
 * Deliberately not a strict staircase: package preview and import both depend only on
 * structural validity, not on each other, because "the whole package including Notes is
 * present" (preview) and "the question banks the importer reads are present and clean"
 * (import) are independent facts. Publication depends on import plus everything import
 * doesn't check (Notes, coverage, QA).
 */
const STRUCTURAL_BLOCKING_CODES: ReadonlySet<string> = new Set(["manifest-invalid"]);

const PACKAGE_PREVIEW_BLOCKING_CODES: ReadonlySet<string> = new Set([
  "missing-notes-source",
  "missing-foundations-source",
  "missing-applications-source",
  "missing-ppq-source",
  "source-reference-stale",
]);

const IMPORT_BLOCKING_CODES: ReadonlySet<string> = new Set([
  "missing-foundations-source",
  "missing-applications-source",
  "missing-ppq-source",
  "source-reference-stale",
  "question-count-mismatch",
  "unsupported-marking-capability",
  "import-config-missing",
]);

const PUBLICATION_BLOCKING_CODES: ReadonlySet<string> = new Set([
  "missing-notes-source",
  "uncovered-question-shape",
  "uncovered-misconception",
  "mathematical-qa-incomplete",
  "curriculum-qa-incomplete",
  "originality-audit-incomplete",
  "marking-qa-incomplete",
]);

/**
 * Derives readiness from the manifest's declared facts, its structural validation result,
 * and resolved source evidence. This function never reads a file and never calls the
 * importer — every input is already-resolved data, exactly like
 * lib/curriculum/coverage.ts's computeCurriculumCoverageReport. Readiness is always
 * recomputed from the blocker list; nothing here is a manually toggled boolean.
 */
export function deriveSkillPackageReadiness(
  manifest: SkillPackageManifest,
  validation: CurriculumValidationReport,
  evidence: SkillPackageEvidence,
): SkillPackageReadiness {
  const blockers: SkillPackageBlocker[] = [];
  let anySourceStale = false;

  if (!validation.valid) {
    blockers.push({ code: "manifest-invalid", message: `Manifest fails structural validation (${String(validation.errors.length)} error(s)) — see the validation report for detail.`, tier: "structural" });
  }

  const evidenceByKind = new Map(evidence.sources.map((source) => [source.kind, source]));
  for (const kind of SKILL_PACKAGE_SOURCE_KINDS) {
    const declared = manifest.sources.find((source) => source.kind === kind);
    const resolved = evidenceByKind.get(kind);
    if (!declared || !resolved || !resolved.exists) {
      blockers.push({ code: SOURCE_MISSING_BLOCKER_CODE[kind], message: `No ${describeSourceKind(kind)} source is present at a declared, existing path.`, tier: SOURCE_MISSING_BLOCKER_TIER[kind] });
      continue;
    }
    if (declared.expectedSourceHash && resolved.currentContentHash && declared.expectedSourceHash !== resolved.currentContentHash) {
      anySourceStale = true;
      blockers.push({ code: "source-reference-stale", message: `${capitalize(describeSourceKind(kind))} source "${declared.sourcePath}" has changed since its facts were last reviewed (hash mismatch).`, tier: "preview" });
    }
    if (declared.expectedQuestionCount !== undefined && resolved.discoveredQuestionCount !== undefined && declared.expectedQuestionCount !== resolved.discoveredQuestionCount) {
      blockers.push({ code: "question-count-mismatch", message: `${capitalize(describeSourceKind(kind))} source "${declared.sourcePath}" declares ${String(declared.expectedQuestionCount)} expected question(s) but ${String(resolved.discoveredQuestionCount)} were found.`, tier: "import" });
    }
    if (resolved.unsupportedMarkingCapabilities.length > 0) {
      const distinctQuestionCount = new Set(resolved.unsupportedMarkingCapabilities.map((entry) => entry.questionId)).size;
      const distinctCodes = [...new Set(resolved.unsupportedMarkingCapabilities.map((entry) => entry.requiredCapability ?? entry.code))].sort();
      blockers.push({
        code: "unsupported-marking-capability",
        message: `${capitalize(describeSourceKind(kind))} source "${declared.sourcePath}" has ${String(distinctQuestionCount)} question(s) the live marking implementations cannot currently import (${distinctCodes.join(", ")}; ${String(resolved.unsupportedMarkingCapabilities.length)} blocker occurrence(s) total).`,
        tier: "import",
      });
    }
  }

  if (!evidence.importConfigurationExists) {
    blockers.push({ code: "import-config-missing", message: `No import configuration exists at "${manifest.importReference.expectedConfigurationPath}" for bank "${manifest.importReference.bankId}".`, tier: "import" });
  }

  // A required shape/misconception blocks publication if it was never observed, OR if it
  // was observed but the package's source evidence is now stale — a hand-reviewed
  // observation is only as trustworthy as the snapshot it was reviewed against. This is a
  // deliberately package-level rule (not per-question): every shape/misconception
  // observation in this pilot is reviewed against the one shared Chain Rule draft, so one
  // staleness signal is sufficient without building a per-question evidence graph.
  manifest.expectedShapes.filter((shape) => shape.required && (!shape.observedInSource || anySourceStale)).forEach((shape) => {
    const reason = shape.observedInSource
      ? "was previously observed, but the source it was reviewed against is now stale (hash mismatch) — treat as unverified until re-reviewed"
      : "is not yet observed in any source";
    blockers.push({ code: "uncovered-question-shape", message: `Required question shape "${shape.shapeId}" (${shape.description}) ${reason}.`, tier: "publication" });
  });
  manifest.expectedMisconceptions.filter((entry) => entry.required && (!entry.observedInSource || anySourceStale)).forEach((entry) => {
    const reason = entry.observedInSource
      ? "was previously observed, but the source it was reviewed against is now stale (hash mismatch) — treat as unverified until re-reviewed"
      : "is not yet observed in any source";
    blockers.push({ code: "uncovered-misconception", message: `Required misconception "${entry.misconceptionId}" (${entry.description}) ${reason}.`, tier: "publication" });
  });

  if (!manifest.qaEvidence.mathematicalQaComplete) blockers.push({ code: "mathematical-qa-incomplete", message: "Mathematical QA has not been recorded as complete.", tier: "publication" });
  if (!manifest.qaEvidence.curriculumQaComplete) blockers.push({ code: "curriculum-qa-incomplete", message: "Curriculum QA has not been recorded as complete.", tier: "publication" });
  if (!manifest.qaEvidence.originalityAuditComplete) blockers.push({ code: "originality-audit-incomplete", message: "The originality/pattern audit has not been recorded as complete.", tier: "publication" });
  if (!manifest.qaEvidence.markingQaComplete) blockers.push({ code: "marking-qa-incomplete", message: "Marking QA has not been recorded as complete.", tier: "publication" });

  const ordered = [...blockers].sort((a, b) => {
    const rank = (code: string) => { const index = BLOCKER_PRIORITY.indexOf(code); return index === -1 ? BLOCKER_PRIORITY.length : index; };
    const byPriority = rank(a.code) - rank(b.code);
    return byPriority !== 0 ? byPriority : a.message.localeCompare(b.message);
  });

  const codesPresent = new Set(ordered.map((blocker) => blocker.code));
  const blocksAny = (codes: ReadonlySet<string>) => [...codes].some((code) => codesPresent.has(code));

  const structurallyComplete = !blocksAny(STRUCTURAL_BLOCKING_CODES);
  const readyForPackagePreview = structurallyComplete && !blocksAny(PACKAGE_PREVIEW_BLOCKING_CODES);
  const readyForImport = structurallyComplete && !blocksAny(IMPORT_BLOCKING_CODES);
  const readyForPublication = readyForImport && !blocksAny(PUBLICATION_BLOCKING_CODES);

  return { structurallyComplete, readyForPackagePreview, readyForImport, readyForPublication, blockers: ordered };
}

function describeSourceKind(kind: SkillPackageSourceKind): string {
  if (kind === "pastPaperPractice") return "Past Paper Practice";
  return kind === "notes" ? "Notes" : kind === "foundations" ? "Foundations" : "Applications";
}

function capitalize(value: string) {
  return value.length ? value[0].toUpperCase() + value.slice(1) : value;
}

/** Human-readable rendering of a package's readiness — the report's primary output. */
export function formatSkillPackageReport(input: {
  manifest: SkillPackageManifest;
  validation: CurriculumValidationReport;
  readiness: SkillPackageReadiness;
  evidence: SkillPackageEvidence;
}): string {
  const { manifest, validation, readiness, evidence } = input;
  const evidenceByKind = new Map(evidence.sources.map((source) => [source.kind, source]));
  const yesNo = (value: boolean) => (value ? "yes" : "no");

  const lines: string[] = [
    `Skill Package — ${manifest.courseId} / ${manifest.skillPathId}`,
    "",
    `Package schema version: ${String(manifest.packageSchemaVersion)}  (revision ${String(manifest.packageRevision)})`,
    `Manifest valid: ${yesNo(validation.valid)}${validation.valid ? "" : ` (${String(validation.errors.length)} error(s))`}`,
    `Skill contract referenced: ${manifest.contractSkillPathId}`,
    `Coverage claims referenced: ${manifest.coverageClaimIds.join(", ") || "none"}`,
    `Hard prerequisites: ${manifest.hardPrerequisiteSkillIds.join(", ") || "none"}`,
    `Question-level requirement rules: ${String(manifest.questionLevelRequirements.length)}`,
    "",
    "Sources:",
  ];
  for (const declaration of manifest.sources) {
    const resolved = evidenceByKind.get(declaration.kind);
    const countText = declaration.expectedQuestionCount !== undefined
      ? `${String(resolved?.discoveredQuestionCount ?? 0)} / ${String(declaration.expectedQuestionCount)} expected`
      : "n/a";
    lines.push(`  - ${declaration.kind}: ${resolved?.exists ? "present" : "absent"} at ${declaration.sourcePath}  (questions: ${countText})`);
  }

  const shapesCovered = manifest.expectedShapes.filter((shape) => shape.observedInSource).length;
  const misconceptionsCovered = manifest.expectedMisconceptions.filter((entry) => entry.observedInSource).length;
  lines.push(
    "",
    `Shape coverage: ${String(shapesCovered)} / ${String(manifest.expectedShapes.length)} observed (${manifest.expectedShapes.filter((shape) => shape.required && !shape.observedInSource).map((shape) => shape.shapeId).join(", ") || "no required gaps"})`,
    `Misconception coverage: ${String(misconceptionsCovered)} / ${String(manifest.expectedMisconceptions.length)} observed (${manifest.expectedMisconceptions.filter((entry) => entry.required && !entry.observedInSource).map((entry) => entry.misconceptionId).join(", ") || "no required gaps"})`,
    "",
    `QA evidence: mathematical=${yesNo(manifest.qaEvidence.mathematicalQaComplete)} curriculum=${yesNo(manifest.qaEvidence.curriculumQaComplete)} originality=${yesNo(manifest.qaEvidence.originalityAuditComplete)} marking=${yesNo(manifest.qaEvidence.markingQaComplete)}`,
    `Import configuration present: ${yesNo(evidence.importConfigurationExists)} (expected at ${manifest.importReference.expectedConfigurationPath})`,
    "",
    `Structurally complete: ${yesNo(readiness.structurallyComplete)}`,
    `Ready for package preview: ${yesNo(readiness.readyForPackagePreview)}`,
    `Ready for import: ${yesNo(readiness.readyForImport)}`,
    `Ready for publication: ${yesNo(readiness.readyForPublication)}`,
    "",
    `Blockers (${String(readiness.blockers.length)}, ordered):`,
  );
  if (readiness.blockers.length === 0) {
    lines.push("  (none)");
  } else {
    readiness.blockers.forEach((blocker, index) => {
      lines.push(`  ${String(index + 1)}. [${blocker.tier}] ${blocker.code} — ${blocker.message}`);
    });
  }

  return lines.join("\n");
}

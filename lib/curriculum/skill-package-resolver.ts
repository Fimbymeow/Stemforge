import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { contentResolver } from "@/lib/content-resolver";
import { sha256 } from "@/lib/content-import/canonical";
import { auditBankAssessment } from "@/lib/content-import/classification";
import { parseMarkdownBank } from "@/lib/content-import/parser";
import type { ContentBankIR } from "@/lib/content-import/types";
import type {
  SkillPackageEvidence,
  SkillPackageManifest,
  SkillPackageSourceEvidence,
} from "@/lib/curriculum/skill-package";

/**
 * The only impure module in the skill-package layer: reads the real filesystem and calls
 * the real Content Import parser/classifier (lib/content-import/parser.ts,
 * lib/content-import/classification.ts) to resolve a manifest's declared source references
 * against current repository state. It never writes a file, never calls preview/approve/
 * apply, and never duplicates parsing or marking logic — it only reads the outputs those
 * existing modules already produce.
 *
 * Markdown draft sources are parsed with parseMarkdownBank and audited with
 * auditBankAssessment (a pure, registry-free classification pass — the same one
 * scripts/import-content.ts's preview command would eventually run against, but without
 * requiring an import configuration to exist). Non-markdown sources (a Notes/LessonDocument
 * .ts module) are checked for existence only — they are not a question bank and have no
 * marking classification.
 */
export function resolveSkillPackageEvidence(manifest: SkillPackageManifest, repoRoot: string = process.cwd()): SkillPackageEvidence {
  const bankCache = new Map<string, ContentBankIR>();
  const loadBank = (sourcePath: string): ContentBankIR => {
    const cached = bankCache.get(sourcePath);
    if (cached) return cached;
    const bytes = readFileSync(resolve(repoRoot, sourcePath));
    const bank = parseMarkdownBank({ sourcePath, bytes });
    bankCache.set(sourcePath, bank);
    return bank;
  };

  const sources: SkillPackageSourceEvidence[] = manifest.sources.map((declaration) => {
    const absolutePath = resolve(repoRoot, declaration.sourcePath);
    const exists = existsSync(absolutePath);
    if (!exists) {
      return { kind: declaration.kind, exists: false, unsupportedMarkingCapabilities: [] };
    }
    if (declaration.evidenceMode === "canonical_runtime") {
      const questions = contentResolver.getPathQuestions(manifest.skillPathId).filter((question) =>
        declaration.declaredStageName ? question.stage === declaration.declaredStageName : true);
      return {
        kind: declaration.kind,
        exists: true,
        discoveredQuestionCount: questions.length,
        currentContentHash: sha256(readFileSync(absolutePath)),
        unsupportedMarkingCapabilities: [],
      };
    }
    if (!declaration.sourcePath.toLowerCase().endsWith(".md")) {
      // Non-markdown source (e.g. a LessonDocument .ts module) — existence only, no question-bank classification applies.
      return { kind: declaration.kind, exists: true, unsupportedMarkingCapabilities: [] };
    }

    const bank = loadBank(declaration.sourcePath);
    const questionsInStage = declaration.declaredStageName
      ? bank.questions.filter((question) => question.declaredStage === declaration.declaredStageName)
      : bank.questions;
    const questionIds = new Set(questionsInStage.map((question) => question.id));

    const classifications = auditBankAssessment(bank).filter((entry) => questionIds.has(entry.questionId));
    const unsupportedMarkingCapabilities = classifications.flatMap((entry) =>
      entry.blockers.map((blocker) => ({ questionId: entry.questionId, code: blocker.code, requiredCapability: blocker.requiredCapability })));

    return {
      kind: declaration.kind,
      exists: true,
      discoveredQuestionCount: questionsInStage.length,
      currentContentHash: bank.rawSourceHash,
      unsupportedMarkingCapabilities,
    };
  });

  const importConfigurationExists = manifest.importReference
    ? existsSync(resolve(repoRoot, manifest.importReference.expectedConfigurationPath))
    : false;

  return { sources, importConfigurationExists };
}

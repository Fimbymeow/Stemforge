import { readFileSync } from "node:fs";
import { canonicalContent } from "@/data/canonical-content";
import type { ImportAnswerCandidate, ImportQuestionIR } from "@/lib/content-import/types";
import { parseMarkdownBank } from "@/lib/content-import/parser";

export const BANK_DIRECTORY = "content-drafts/higher-maths/calculus";
export const BANKS = [
  ["basic-differentiation-v1.md", 50, "e7fa953b578aac1d3511d478035762324aecc8cf0d654d0fc4bc979d4da845bf"],
  ["chain-rule-v6.md", 34, "6aa38c610b2827cdd34ec22476558baa6b9e44419e61e8b04bf6da344fe1c769"],
  ["stationary-points-v2.md", 43, "d59be41090a888698fad4ce3ea2d15f67f3614bb267b2b3ecfefe9b2308ad53a"],
  ["optimisation-v1.md", 14, "097edffe69b37fad6b8147617c2e5d1a141aef5dc91a9ebd5c667d13ea17792b"],
  ["basic-integration-v1.md", 20, "288d3d25181abc641e322acb7a8f30b7f0df0a0646f970d36aebd7c160230fcd"],
  ["tangents-and-normals-v1.md", 5, "082d0f5c979095054dd2791f063e2b2b0630d4fd840f36e28c292a184c99e101"],
] as const;

export function loadBank(name: string) {
  const path = `${BANK_DIRECTORY}/${name}`;
  return parseMarkdownBank({ sourcePath: path, bytes: readFileSync(path) });
}

/**
 * Mechanism tests use explicit synthetic curriculum review rather than treating legacy source
 * omissions as trusted. Authoritative bank bytes remain untouched and are still covered by
 * loadBank/hash tests.
 */
export function withTestCurriculumMetadata(source: string, primarySkillId: string, requiredSkillIds: string[] = []) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  let inQuestion = false;
  let hasCurriculum = false;
  for (const line of lines) {
    if (/^#{2,3}\s+(?:F|A|PPQ)\d{3}\s+[—-]\s+[a-z0-9]+(?:-[a-z0-9]+)*\s*$/i.test(line)) {
      inQuestion = true;
      hasCurriculum = false;
    } else if (inQuestion && /^Curriculum metadata:\s*$/i.test(line)) {
      hasCurriculum = true;
    }
    if (inQuestion && !hasCurriculum && /^Question:\s*/i.test(line)) {
      output.push(
        "Curriculum metadata:",
        "```yaml",
        "curriculum:",
        `  primarySkillId: ${primarySkillId}`,
        "  requiredSkillIds:",
        ...requiredSkillIds.map((skillId) => `    - ${skillId}`),
        "```",
        "",
      );
      hasCurriculum = true;
    }
    output.push(line);
  }
  return output.join("\n");
}

export function loadBankForImport(name: string) {
  const path = `${BANK_DIRECTORY}/${name}`;
  const primarySkillId = name === "chain-rule-v6.md" ? "chain-rule" : "basic-differentiation";
  const requiredSkillIds = primarySkillId === "chain-rule" ? ["basic-differentiation"] : [];
  const source = readFileSync(path, "utf8");
  return parseMarkdownBank({ sourcePath: path, bytes: Buffer.from(withTestCurriculumMetadata(source, primarySkillId, requiredSkillIds)) });
}

export function basicConfigurationText() {
  return readFileSync(`${BANK_DIRECTORY}/basic-differentiation-v1.import.json`, "utf8");
}

export function questionIR(overrides: Partial<ImportQuestionIR> & { answerCandidates?: ImportAnswerCandidate[] } = {}): ImportQuestionIR {
  return {
    id: "synthetic-f-001",
    sourceLineRange: { start: 1, end: 20 },
    declaredStage: "Foundations",
    marks: 1,
    interactionType: "algebraic",
    questionText: "Give the answer.",
    hint: "Use the method.",
    workedSolution: "The answer follows.",
    commonMistake: "Avoid a common mistake.",
    answerCandidates: [{
      id: "answer",
      label: "Answer",
      type: "algebraic",
      correctAnswer: "2x^2+3x+1",
      acceptedAnswers: ["2x^2+3x+1"],
    }],
    answerDeclarationShape: "yaml_answer_fields",
    explicitFieldAssessment: false,
    curriculum: { primarySkillId: "basic-differentiation", requiredSkillIds: [] },
    diagnostics: [],
    ...overrides,
  };
}

export function syntheticBank(question: ImportQuestionIR) {
  return {
    compilerVersion: 1 as const,
    sourcePath: "content-drafts/test.md",
    rawSourceHash: "a".repeat(64),
    sourceBankId: "synthetic-bank",
    sourceBankVersion: "1",
    questions: [question],
    diagnostics: [],
  };
}

export { canonicalContent };

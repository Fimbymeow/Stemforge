import { readFileSync } from "node:fs";
import { canonicalContent } from "@/data/canonical-content";
import type { ImportAnswerCandidate, ImportQuestionIR } from "@/lib/content-import/types";
import { parseMarkdownBank } from "@/lib/content-import/parser";

export const BANK_DIRECTORY = "content-drafts/higher-maths/calculus";
export const BANKS = [
  ["basic-differentiation-v1.md", 50, "e7fa953b578aac1d3511d478035762324aecc8cf0d654d0fc4bc979d4da845bf"],
  ["chain-rule-v6.md", 34, "7c45e31b926d24829e30031890d80429fcb74fe3d2780d7531032efea6e00d89"],
  ["stationary-points-v2.md", 43, "d59be41090a888698fad4ce3ea2d15f67f3614bb267b2b3ecfefe9b2308ad53a"],
  ["optimisation-v1.md", 14, "097edffe69b37fad6b8147617c2e5d1a141aef5dc91a9ebd5c667d13ea17792b"],
  ["basic-integration-v1.md", 20, "288d3d25181abc641e322acb7a8f30b7f0df0a0646f970d36aebd7c160230fcd"],
  ["tangents-and-normals-v1.md", 5, "d658055adcf726a4e1db665823746243e5a2fbf649afb1508b186bf72457a577"],
] as const;

export function loadBank(name: string) {
  const path = `${BANK_DIRECTORY}/${name}`;
  return parseMarkdownBank({ sourcePath: path, bytes: readFileSync(path) });
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

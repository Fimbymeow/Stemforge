import { serializeTransformation } from "@/lib/maths/graph-transformations";
import type { NatureTableConfig, StructuredGraphAnswer } from "@/lib/maths/expression-types";
import type { StructuredQuestionAnswerConfig } from "@/data/types";

export type StructuredGraphMarkingResult = {
  isCorrect: boolean;
  normalizedAnswer: string;
  feedback: string;
  correctCells?: string[];
  incorrectCells?: string[];
};

export function serializeStructuredGraphAnswer(answer: StructuredGraphAnswer) {
  return JSON.stringify(canonicalize(answer));
}

export function validateStructuredGraphAnswer(
  config: StructuredQuestionAnswerConfig,
  answer: StructuredGraphAnswer,
  natureTable?: NatureTableConfig,
): StructuredGraphMarkingResult {
  if (config.type !== answer.type && !(config.type === "nature-table" && answer.type === "nature-table")) {
    return result(false, answer, "This answer does not match the question interaction.");
  }
  if (config.type === "point-placement" && answer.type === "point-placement") {
    const byId = new Map(answer.points.map((point) => [point.id, point]));
    const correct = config.expectedPoints.every((expected) => {
      const actual = byId.get(expected.id);
      const tolerance = expected.tolerance ?? 0.15;
      return actual && Math.abs(actual.x - expected.x) <= tolerance && Math.abs(actual.y - expected.y) <= tolerance;
    });
    return result(correct, answer, correct ? "All key points are placed within tolerance." : "One or more key points need adjusting.");
  }
  if (config.type === "interval-signs" && answer.type === "interval-signs") {
    const correct = Object.entries(config.expectedSigns).every(([id, sign]) => answer.intervals[id] === sign);
    return result(correct, answer, correct ? "The derivative signs are correct." : "Check the derivative sign on each interval.");
  }
  if (config.type === "candidate-match" && answer.type === "candidate-match") {
    return result(answer.selectedId === config.expectedId, answer, answer.selectedId === config.expectedId ? "Correct graph selected." : "That graph does not match the required features.");
  }
  if (config.type === "transformation-sequence" && answer.type === "transformation-sequence") {
    const expected = config.expectedTransformations.map(serializeTransformation).join("|");
    const actual = answer.transformations.map(serializeTransformation).join("|");
    return result(actual === expected, answer, actual === expected ? "Transformation sequence is correct." : "Check the transformation order and direction.");
  }
  if (config.type === "nature-table" && answer.type === "nature-table") {
    if (!natureTable || config.tableId !== natureTable.id) return result(false, answer, "The nature table configuration is missing.");
    const correctCells: string[] = [];
    const incorrectCells: string[] = [];
    for (const [cellId, expected] of Object.entries(natureTable.expectedAnswers)) {
      if (JSON.stringify(canonicalize(answer.cells[cellId])) === JSON.stringify(canonicalize(expected))) correctCells.push(cellId);
      else incorrectCells.push(cellId);
    }
    return {
      isCorrect: incorrectCells.length === 0,
      normalizedAnswer: serializeStructuredGraphAnswer(answer),
      feedback: incorrectCells.length === 0 ? "Nature table is complete and correct." : "Some table cells need another look.",
      correctCells,
      incorrectCells,
    };
  }
  return result(false, answer, "Unsupported structured answer.");
}

function result(isCorrect: boolean, answer: StructuredGraphAnswer, feedback: string): StructuredGraphMarkingResult {
  return { isCorrect, normalizedAnswer: serializeStructuredGraphAnswer(answer), feedback };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
}

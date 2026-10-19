import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  higherMathsTangentsAndNormalsQuestions,
  tangentsAndNormalsPracticeQuestionIds,
} from "@/content/questions/higher-maths/tangents-and-normals";
import { canonicalContent } from "@/data/canonical-content";
import { tangentsPackage } from "@/data/curriculum/higher-mathematics/tangents-package";
import { tangentsLesson } from "@/data/lessons/tangents";
import { markQuestionAnswer } from "@/lib/answer-engine";
import { reconstructPreviewDecisionPayload } from "@/lib/content-import/preview";
import { createHigherMathsKnownReferences } from "@/lib/curriculum/higher-maths-production";
import { deriveSkillPackageReadiness, validateSkillPackageManifest } from "@/lib/curriculum/skill-package";
import { resolveSkillPackageEvidence } from "@/lib/curriculum/skill-package-resolver";
import { validateLessonDocument } from "@/lib/lessons/lesson-document";

const sourcePath = "content-drafts/higher-maths/calculus/tangents-and-normals-v1.md";
const configurationPath = "content-drafts/higher-maths/calculus/tangents-and-normals-v1.import.json";

function preview() {
  return reconstructPreviewDecisionPayload({
    sourcePath,
    sourceBytes: readFileSync(sourcePath),
    configurationPath,
    configurationBytes: readFileSync(configurationPath),
    subjects: canonicalContent.subjects,
    questions: canonicalContent.questions,
  });
}

test("installed Tangents Practice V2 is ordered, owned and dependency-gated", () => {
  const { bank, payload } = preview();
  assert.equal(bank.authoringModel, "practice");
  assert.equal(bank.sourceBankId, "tangents-and-normals-v1");
  assert.equal(bank.questions.length, 30);
  assert.equal(payload.importable, true);
  assert.deepEqual(payload.blockedIds, []);
  assert.equal(payload.eligibleCandidateIds.length, 0, "an installed bank must not be eligible for duplicate import");
  assert.equal(payload.collisionDiffs.length, 30);
  assert.deepEqual(tangentsAndNormalsPracticeQuestionIds, bank.questions.map((question) => question.id));
  assert.ok(higherMathsTangentsAndNormalsQuestions.every((question) => question.skillPathId === "tangents-and-normals"));
  assert.ok(higherMathsTangentsAndNormalsQuestions.every((question) => question.stage === "Practice"));
  assert.equal(higherMathsTangentsAndNormalsQuestions.filter((question) => question.curriculum?.requiredSkillIds.includes("chain-rule")).length, 9);
  assert.equal(higherMathsTangentsAndNormalsQuestions.filter((question) => question.curriculum?.requiredSkillIds.length === 0).length, 21);
  assert.deepEqual(
    higherMathsTangentsAndNormalsQuestions
      .filter((question) => question.curriculum?.requiredSkillIds.includes("chain-rule"))
      .map((question) => question.id),
    [
      "hm-calc-tangent-q-019",
      "hm-calc-tangent-q-020",
      "hm-calc-tangent-q-021",
      "hm-calc-tangent-q-023",
      "hm-calc-tangent-q-024",
      "hm-calc-tangent-q-026",
      "hm-calc-tangent-q-027",
      "hm-calc-tangent-q-029",
      "hm-calc-tangent-q-030",
    ],
  );
  assert.deepEqual(
    higherMathsTangentsAndNormalsQuestions
      .filter((question) => question.calculatorAllowed)
      .map((question) => question.id),
    ["hm-calc-tangent-q-028"],
  );
});

test("Tangents Practice does not reuse the four Notes example constructions", () => {
  const { bank } = preview();
  const prompts = bank.questions.map((question) => question.questionText.replace(/\s+/g, ""));
  for (const notesExpression of ["x^2+3x-4", "x^3-2x^2+4", "3x^2-4x+7", "(2x+1)^2"]) {
    assert.ok(prompts.every((prompt) => !prompt.includes(notesExpression)), notesExpression);
  }
});

test("every Tangents answer is deterministic affine-line marking and rejects a representative wrong line", () => {
  const { payload } = preview();
  for (const classification of payload.classifications) {
    assert.equal(classification.markerCompatibility?.strategy, "linear_equation_equivalence");
    assert.ok(classification.markerCompatibility?.aliasOutcomes.every((outcome) => outcome.outcomeKind === "graded" && outcome.isCorrect));
    const question = classification.canonicalQuestion;
    assert.ok(question);
    const wrong = markQuestionAnswer(question, "y=0");
    assert.equal(wrong.outcomeKind, "graded", classification.questionId);
    assert.equal(wrong.isCorrect, false, classification.questionId);
  }
});

test("revised Tangents questions reject misconception-grounded wrong lines", () => {
  const { payload } = preview();
  const wrongLines: Record<string, string> = {
    "hm-calc-tangent-q-001": "y=6x-2",
    "hm-calc-tangent-q-003": "y=1",
    "hm-calc-tangent-q-006": "y=18x-18",
    "hm-calc-tangent-q-014": "y=x/2+1",
    "hm-calc-tangent-q-015": "y=-17x-17",
    "hm-calc-tangent-q-016": "y=x+11/3",
    "hm-calc-tangent-q-017": "y=2x/7",
    "hm-calc-tangent-q-018": "y=-3x+4",
    "hm-calc-tangent-q-020": "y=12x+4",
    "hm-calc-tangent-q-022": "y=-13x",
    "hm-calc-tangent-q-025": "2y=23x",
    "hm-calc-tangent-q-028": "y=4.3x+2.25",
  };
  for (const [questionId, answer] of Object.entries(wrongLines)) {
    const question = payload.classifications.find((entry) => entry.questionId === questionId)?.canonicalQuestion;
    assert.ok(question, questionId);
    const outcome = markQuestionAnswer(question, answer);
    assert.equal(outcome.outcomeKind, "graded", questionId);
    assert.equal(outcome.isCorrect, false, questionId);
  }
});

test("Tangents Notes validate and package readiness includes the recorded human approval", () => {
  assert.equal(validateLessonDocument(tangentsLesson).valid, true);
  const validation = validateSkillPackageManifest(tangentsPackage, createHigherMathsKnownReferences());
  assert.equal(validation.valid, true);
  const readiness = deriveSkillPackageReadiness(tangentsPackage, validation, resolveSkillPackageEvidence(tangentsPackage));
  assert.equal(readiness.readyForPackagePreview, true);
  assert.equal(readiness.readyForImport, true);
  assert.equal(readiness.readyForPublication, true);
  assert.deepEqual(readiness.blockers.map((blocker) => blocker.code), []);
});

import assert from "node:assert/strict";
import test from "node:test";
import { higherMathsFormulaSheet } from "../data/higher-maths-formula-sheet";
import {
  getStudentResourceCapabilities,
  getSubjectFamily,
  subjectSupportsResource,
} from "../lib/resource-capabilities";
import { createQuickPracticeSelection } from "../lib/study-context";
import { evidence } from "./progress-fixtures";

test("subject families expose the canonical student resource capabilities", () => {
  assert.equal(getSubjectFamily("Maths"), "mathematics");
  assert.equal(getSubjectFamily("Physics"), "science");
  assert.equal(getSubjectFamily("Chemistry"), "science");
  assert.equal(getSubjectFamily("Biology"), "science");
  assert.equal(getSubjectFamily("Unknown"), null);
  assert.deepEqual(getStudentResourceCapabilities("mathematics"), ["notes", "practice"]);
  assert.deepEqual(getStudentResourceCapabilities("science"), ["notes", "flashcards", "practice"]);
  assert.equal(subjectSupportsResource("mathematics", "flashcards"), false);
  assert.equal(subjectSupportsResource("science", "flashcards"), true);
});

test("standalone formula and worked-example categories cannot become capabilities", () => {
  const capabilityNames = [
    ...getStudentResourceCapabilities("mathematics"),
    ...getStudentResourceCapabilities("science"),
  ];
  assert(!capabilityNames.includes("formula" as never));
  assert(!capabilityNames.includes("worked-examples" as never));
});

test("the assessment formula sheet contains only the verified official sections", () => {
  assert.deepEqual(
    higherMathsFormulaSheet.sections.map((section) => section.title),
    [
      "Circle",
      "Scalar Product",
      "Trigonometric formulae",
      "Table of standard derivatives",
      "Table of standard integrals",
    ],
  );
  const serialized = JSON.stringify(higherMathsFormulaSheet);
  assert(!serialized.includes("power rule"));
  assert(!serialized.includes("worked example"));
  assert(!serialized.includes("hint"));
});

test("Quick Practice keeps the existing deterministic session-generation contract", () => {
  const first = createQuickPracticeSelection({
    evidence: evidence(),
    preferredPathId: "basic-differentiation",
  });
  const second = createQuickPracticeSelection({
    evidence: evidence(),
    preferredPathId: "basic-differentiation",
  });
  assert(first.result.session);
  assert(second.result.session);
  assert.equal(first.result.session.timing.type, "untimed");
  assert.deepEqual(
    first.result.session.questionReferences.map((reference) => reference.questionId),
    second.result.session.questionReferences.map((reference) => reference.questionId),
  );
});


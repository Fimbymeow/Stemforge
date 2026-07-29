import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MAX_IMPORT_SOURCE_BYTES } from "@/lib/content-import/types";
import { parseAnswerFieldsYaml, parseMarkdownBank } from "@/lib/content-import/parser";
import { BANKS, BANK_DIRECTORY, loadBank } from "@/tests/content-import-fixtures";

test("all five byte-identical banks parse their exact authoritative 172-question total", () => {
  let total = 0;
  for (const [name, expectedCount, expectedHash] of BANKS) {
    const bank = loadBank(name);
    assert.equal(bank.questions.length, expectedCount, name);
    assert.equal(bank.rawSourceHash, expectedHash, name);
    assert.equal(bank.diagnostics.filter((item) => item.severity === "error").length, 0, name);
    total += bank.questions.length;
  }
  assert.equal(total, 172);
});

test("both real answer declaration shapes and both heading depths are preserved", () => {
  const basic = loadBank("basic-differentiation-v1.md");
  const chain = loadBank("chain-rule-v6.md");
  assert.equal(basic.questions[0].answerDeclarationShape, "yaml_answer_fields");
  assert.equal(chain.questions[0].answerDeclarationShape, "bare_correct_answer");
  assert.equal(basic.questions[0].sourceLineRange.start, 37);
  assert.equal(chain.questions[0].sourceLineRange.start, 37);
});

test("skim and QA summary copies never duplicate questions", () => {
  const source = readFileSync(`${BANK_DIRECTORY}/basic-differentiation-v1.md`, "utf8");
  assert.match(source, /all questions together for skim/i);
  assert.equal(loadBank("basic-differentiation-v1.md").questions.length, 50);
});

test("malformed headings, missing sections and duplicate IDs are diagnosed", () => {
  const source = `# Demo Question Bank v1
- skillPathId: demo-bank
## F001 malformed
Stage: Foundations
## F002 — duplicate-id
Stage: Foundations
Marks: 1
Question: One
Correct answer: 1
Hint: Hint
Worked solution: Work
Common mistake: Mistake
## F003 — duplicate-id
Stage: Foundations
Marks: 1
Question: Two
Correct answer: 2
Hint: Hint
Worked solution: Work
Common mistake: Mistake`;
  const bank = parseMarkdownBank({ sourcePath: "demo.md", bytes: Buffer.from(source) });
  assert.ok(bank.diagnostics.some((item) => item.code === "malformed_question_heading"));
  assert.ok(bank.diagnostics.some((item) => item.code === "duplicate_question_id"));
});

test("strict answerFields YAML rejects malformed, duplicate and prototype-polluting keys", () => {
  const malformed = parseAnswerFieldsYaml(`answerFields:
  - id: answer
    id: duplicate
    __proto__: polluted
    label: Answer
    type: algebraic
    correctAnswer: x
    acceptedAnswers: [x]`);
  assert.ok(malformed.diagnostics.some((item) => item.code === "duplicate_yaml_key"));
  assert.ok(malformed.diagnostics.some((item) => item.code === "prototype_polluting_yaml_key"));
  assert.ok(malformed.diagnostics.some((item) => item.code === "malformed_yaml"));
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
});

test("explicit assessed/scaffolding metadata is represented only when every field declares it", () => {
  const parsed = parseAnswerFieldsYaml(`answerFields:
  - id: working
    label: Working
    type: algebraic
    correctAnswer: x
    assessed: false
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: 2x
    assessed: true`);
  assert.equal(parsed.explicitFieldAssessment, true);
  assert.deepEqual(parsed.candidates.map((candidate) => candidate.assessed), [false, true]);
});

test("oversized sources fail closed without parsing content", () => {
  const bank = parseMarkdownBank({ sourcePath: "huge.md", bytes: Buffer.alloc(MAX_IMPORT_SOURCE_BYTES + 1, 65) });
  assert.equal(bank.questions.length, 0);
  assert.equal(bank.diagnostics[0]?.code, "source_too_large");
});

test("YAML accepted-answer overflow is diagnosed without pruning any declared alias", () => {
  const aliases = Array.from({ length: 65 }, (_, index) => `      - alias-${index}`).join("\n");
  const parsed = parseAnswerFieldsYaml(`answerFields:
  - id: answer
    label: Answer
    type: algebraic
    correctAnswer: x
    acceptedAnswers:
${aliases}`);
  assert.equal(parsed.candidates[0].acceptedAnswers.length, 66);
  assert.equal(parsed.candidates[0].acceptedAnswers.at(-1), "alias-64");
  assert.ok(parsed.diagnostics.some((item) => item.code === "too_many_accepted_answers"));
});

test("bare accepted-answer overflow is diagnosed without pruning any declared alias", () => {
  const aliases = Array.from({ length: 65 }, (_, index) => `- alias-${index}`).join("\n");
  const source = `# Demo Question Bank v1
- skillPathId: demo-bank
## F001 - demo-bank-f-001
Stage: Foundations
Type: algebraic
Marks: 1
Question: Give the expression.
Correct answer: x
Accepted answers:
${aliases}
Hint: Use the expression.
Worked solution: The answer is x.
Common mistake: Do not change the expression.`;
  const bank = parseMarkdownBank({ sourcePath: "demo.md", bytes: Buffer.from(source) });
  assert.equal(bank.questions[0].answerCandidates[0].acceptedAnswers.length, 66);
  assert.equal(bank.questions[0].answerCandidates[0].acceptedAnswers.at(-1), "alias-64");
  assert.ok(bank.questions[0].diagnostics.some((item) => item.code === "too_many_accepted_answers"));
});

test("duplicate required source sections are diagnosed as malformed structure", () => {
  const source = `# Demo Question Bank v1
- skillPathId: demo-bank
## F001 - demo-bank-f-001
Stage: Foundations
Type: numeric
Marks: 1
Question: What is one?
Correct answer: 1
Hint: First hint.
Hint: Second hint.
Worked solution: One.
Common mistake: Zero.`;
  const bank = parseMarkdownBank({ sourcePath: "demo.md", bytes: Buffer.from(source) });
  assert.ok(bank.questions[0].diagnostics.some((item) => item.code === "duplicate_question_section"));
});

test("question discovery over the explicit limit is diagnosed without pretending enumeration is complete", () => {
  const questions = Array.from({ length: 501 }, (_, index) => {
    const id = String(index + 1).padStart(3, "0");
    return `## F${id} - demo-bank-f-${id}
Stage: Foundations
Type: numeric
Marks: 1
Question: What is one?
Correct answer: 1
Hint: Think.
Worked solution: One.
Common mistake: Zero.`;
  }).join("\n");
  const bank = parseMarkdownBank({
    sourcePath: "demo.md",
    bytes: Buffer.from(`# Demo Question Bank v1\n- skillPathId: demo-bank\n${questions}`),
  });
  assert.equal(bank.questions.length, 500);
  assert.ok(bank.diagnostics.some((item) => item.code === "too_many_questions"));
});

test("out-of-order source question headings invalidate complete enumeration", () => {
  const block = (heading: string, id: string) => `${heading} - ${id}
Stage: Foundations
Type: numeric
Marks: 1
Question: What is one?
Correct answer: 1
Hint: Think.
Worked solution: One.
Common mistake: Zero.`;
  const bank = parseMarkdownBank({
    sourcePath: "demo.md",
    bytes: Buffer.from(`# Demo Question Bank v1
- skillPathId: demo-bank
${block("## A001", "demo-bank-a-001")}
${block("## F001", "demo-bank-f-001")}`),
  });
  assert.ok(bank.diagnostics.some((item) => item.code === "invalid_question_order"));
});
